import { db } from '@sambung-chat/db';
import { apiKeys } from '@sambung-chat/db/schema/api-key';
import { eq, and, desc } from 'drizzle-orm';
import { ORPCError } from '@orpc/server';
import { encrypt, decrypt, extractLastChars } from '../lib/encryption';

/**
 * Provider types supported for API keys
 */
export type ApiKeyProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'groq'
  | 'ollama'
  | 'openrouter'
  | 'other';

/**
 * API Key data structure (without the decrypted key)
 */
export interface ApiKeyData {
  id: string;
  provider: ApiKeyProvider;
  name: string;
  keyLast4: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API Key data structure with decrypted key
 */
export interface ApiKeyWithData extends ApiKeyData {
  key: string;
}

/**
 * Create API key input
 */
export interface CreateApiKeyInput {
  userId: string;
  provider: ApiKeyProvider;
  name: string;
  key: string;
}

/**
 * Update API key input
 */
export interface UpdateApiKeyInput {
  userId: string;
  id: string;
  provider?: ApiKeyProvider;
  name?: string;
  key?: string;
  isActive?: boolean;
}

/**
 * API Key Service
 *
 * Business logic layer for API key CRUD operations with encryption/decryption.
 * Provides a clean separation between routing logic and data access logic.
 *
 * Security features:
 * - All keys encrypted with AES-256-GCM before storage
 * - User-level isolation enforced
 * - Keys never logged or exposed in errors
 * - Ownership verification on all operations
 */
export class ApiKeyService {
  /**
   * Validate API key format
   *
   * Performs basic sanity checks on API key format.
   * This is not comprehensive validation but catches obvious errors.
   *
   * @param key - The API key to validate
   * @throws {ORPCError} If the key appears invalid
   *
   * @example
   * ```ts
   * validateKey('sk-1234567890abcdef'); // OK
   * validateKey('abc'); // Throws BAD_REQUEST
   * ```
   */
  static validateKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'API key must be a non-empty string',
      });
    }

    if (key.length < 8) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'API key appears to be invalid (too short)',
      });
    }

    if (key.length > 500) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'API key appears to be invalid (too long)',
      });
    }
  }

  /**
   * Encrypt and store a new API key
   *
   * Encrypts the API key using AES-256-GCM and stores it in the database.
   * The last 4 characters are stored separately for identification.
   *
   * @param input - Create API key input
   * @returns The created API key data (without the actual key)
   * @throws {ORPCError} If validation fails or encryption fails
   *
   * @example
   * ```ts
   * const result = await ApiKeyService.encryptAndStore({
   *   userId: 'user_123',
   *   provider: 'openai',
   *   name: 'My OpenAI Key',
   *   key: 'sk-1234567890abcdef'
   * });
   * ```
   */
  static async encryptAndStore(input: CreateApiKeyInput): Promise<ApiKeyData> {
    const { userId, provider, name, key } = input;

    // Validate the key
    this.validateKey(key);

    // Encrypt the key
    let encryptedData;
    try {
      encryptedData = encrypt(key);
    } catch {
      throw new ORPCError('INTERNAL_ERROR', {
        message: 'Failed to encrypt API key',
      });
    }

    // Extract last 4 characters for identification
    const last4 = extractLastChars(key, 4);

    // Insert into database
    const [newKey] = await db
      .insert(apiKeys)
      .values({
        userId,
        provider,
        name,
        encryptedKey: encryptedData.encrypted,
        keyLast4: last4,
        isActive: true,
      })
      .returning();

    if (!newKey) {
      throw new ORPCError('INTERNAL_ERROR', {
        message: 'Failed to create API key',
      });
    }

    return {
      id: newKey.id,
      provider: newKey.provider as ApiKeyProvider,
      name: newKey.name,
      keyLast4: newKey.keyLast4,
      isActive: newKey.isActive,
      createdAt: newKey.createdAt,
      updatedAt: newKey.updatedAt,
    };
  }

  /**
   * Retrieve all API keys for a user (without decryption)
   *
   * Returns all API keys for the specified user with only the last 4 characters.
   * Never returns the full decrypted key for security.
   *
   * @param userId - The user ID to fetch keys for
   * @returns Array of API key data (without actual keys)
   *
   * @example
   * ```ts
   * const keys = await ApiKeyService.retrieveAll('user_123');
   * // Returns: [{ id, provider, name, keyLast4, isActive, createdAt, updatedAt }]
   * ```
   */
  static async retrieveAll(userId: string): Promise<ApiKeyData[]> {
    const keys = await db
      .select({
        id: apiKeys.id,
        provider: apiKeys.provider,
        name: apiKeys.name,
        keyLast4: apiKeys.keyLast4,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));

    return keys.map((key) => ({
      ...key,
      provider: key.provider as ApiKeyProvider,
    }));
  }

  /**
   * Retrieve and decrypt a specific API key
   *
   * Fetches an API key by ID and decrypts it.
   * Verifies user ownership before returning the key.
   *
   * @param id - The API key ID
   * @param userId - The user ID (for ownership verification)
   * @returns The API key with decrypted key
   * @throws {ORPCError} If not found, no permission, or decryption fails
   *
   * @example
   * ```ts
   * const result = await ApiKeyService.retrieveAndDecrypt('key_123', 'user_123');
   * // Returns: { id, provider, name, key: 'sk-...', keyLast4, isActive, createdAt, updatedAt }
   * ```
   */
  static async retrieveAndDecrypt(id: string, userId: string): Promise<ApiKeyWithData> {
    const results = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));

    if (results.length === 0) {
      throw new ORPCError('NOT_FOUND', {
        message: 'API key not found or you do not have permission to access it',
      });
    }

    const apiKey = results[0];

    if (!apiKey) {
      throw new ORPCError('NOT_FOUND', {
        message: 'API key not found or you do not have permission to access it',
      });
    }

    // Decrypt the key
    let decryptedKey: string;
    try {
      decryptedKey = decrypt(apiKey.encryptedKey);
    } catch {
      throw new ORPCError('INTERNAL_ERROR', {
        message: 'Failed to decrypt API key',
      });
    }

    return {
      id: apiKey.id,
      provider: apiKey.provider as ApiKeyProvider,
      name: apiKey.name,
      key: decryptedKey,
      keyLast4: apiKey.keyLast4,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    };
  }

  /**
   * Update an existing API key
   *
   * Can update name, provider, the key itself, or active status.
   * If a new key is provided, it will be encrypted before storage.
   * Verifies user ownership before performing the update.
   *
   * @param input - Update API key input
   * @returns The updated API key data (without the actual key)
   * @throws {ORPCError} If not found, no permission, validation fails, or encryption fails
   *
   * @example
   * ```ts
   * const result = await ApiKeyService.updateKey({
   *   userId: 'user_123',
   *   id: 'key_123',
   *   name: 'Updated Name',
   *   key: 'sk-newkey123456789'
   * });
   * ```
   */
  static async updateKey(input: UpdateApiKeyInput): Promise<ApiKeyData> {
    const { userId, id, key, ...updates } = input;

    // First, verify ownership
    const existingKeyResults = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));

    if (existingKeyResults.length === 0) {
      throw new ORPCError('NOT_FOUND', {
        message: 'API key not found or you do not have permission to update it',
      });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = { ...updates };

    // If a new key is provided, validate and encrypt it
    if (key) {
      this.validateKey(key);

      let encryptedData;
      try {
        encryptedData = encrypt(key);
      } catch {
        throw new ORPCError('INTERNAL_ERROR', {
          message: 'Failed to encrypt API key',
        });
      }

      updateData.encryptedKey = encryptedData.encrypted;
      updateData.keyLast4 = extractLastChars(key, 4);
    }

    // Update the key
    const [updatedKey] = await db
      .update(apiKeys)
      .set(updateData)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .returning();

    if (!updatedKey) {
      throw new ORPCError('NOT_FOUND', {
        message: 'API key not found or you do not have permission to access it',
      });
    }

    return {
      id: updatedKey.id,
      provider: updatedKey.provider as ApiKeyProvider,
      name: updatedKey.name,
      keyLast4: updatedKey.keyLast4,
      isActive: updatedKey.isActive,
      createdAt: updatedKey.createdAt,
      updatedAt: updatedKey.updatedAt,
    };
  }

  /**
   * Delete an API key
   *
   * Permanently removes an API key from the database.
   * Verifies user ownership before performing the deletion.
   *
   * @param id - The API key ID
   * @param userId - The user ID (for ownership verification)
   * @returns Success indicator
   * @throws {ORPCError} If not found or no permission
   *
   * @example
   * ```ts
   * await ApiKeyService.deleteKey('key_123', 'user_123');
   * // Returns: { success: true }
   * ```
   */
  static async deleteKey(id: string, userId: string): Promise<{ success: boolean }> {
    // First, verify ownership
    const existingKeyResults = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));

    if (existingKeyResults.length === 0) {
      throw new ORPCError('NOT_FOUND', {
        message: 'API key not found or you do not have permission to delete it',
      });
    }

    // Delete the key
    await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));

    return { success: true };
  }
}
