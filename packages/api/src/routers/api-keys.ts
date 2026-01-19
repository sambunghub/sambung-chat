import { db } from '@sambung-chat/db';
import { apiKeys } from '@sambung-chat/db/schema/api-key';
import { eq, and, asc, desc } from 'drizzle-orm';
import z from 'zod';
import { ORPCError } from '@orpc/server';
import { protectedProcedure } from '../index';
import { ulidSchema } from '../utils/validation';
import { encrypt, decrypt, extractLastChars } from '../lib/encryption';

/**
 * API Key Provider Enum
 * Supported AI/LLM providers
 */
const providerSchema = z.enum([
  'openai',
  'anthropic',
  'google',
  'groq',
  'ollama',
  'openrouter',
  'other',
]);

/**
 * API Key Router
 * Provides CRUD operations for encrypted API key storage
 *
 * Security features:
 * - All keys are encrypted at rest using AES-256-GCM
 * - User-level isolation: users can only access their own keys
 * - Keys are never exposed in logs or error messages
 * - Last 4 characters stored separately for identification
 */
export const apiKeyRouter = {
  /**
   * List all API keys for the current user
   * Returns keys with last 4 characters only, never the full key
   */
  getAll: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

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

    return keys;
  }),

  /**
   * Get a specific API key by ID
   * Returns the decrypted key (use with caution)
   */
  getById: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const results = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, userId)));

      if (results.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'API key not found or you do not have permission to access it',
        });
      }

      const apiKey = results[0];

      // Decrypt the key
      let decryptedKey: string;
      try {
        decryptedKey = decrypt(apiKey.encryptedKey);
      } catch (error) {
        throw new ORPCError('INTERNAL_ERROR', {
          message: 'Failed to decrypt API key',
        });
      }

      // Return with the decrypted key
      return {
        id: apiKey.id,
        provider: apiKey.provider,
        name: apiKey.name,
        key: decryptedKey, // Decrypted key
        keyLast4: apiKey.keyLast4,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
      };
    }),

  /**
   * Create a new API key
   * Encrypts the key before storing it in the database
   */
  create: protectedProcedure
    .input(
      z.object({
        provider: providerSchema,
        name: z.string().min(1).max(100),
        key: z.string().min(1, 'API key cannot be empty'),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Validate that the key looks like an API key
      // This is a basic sanity check, not a comprehensive validation
      if (input.key.length < 8) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'API key appears to be invalid (too short)',
        });
      }

      // Encrypt the key
      let encryptedData;
      try {
        encryptedData = encrypt(input.key);
      } catch (error) {
        throw new ORPCError('INTERNAL_ERROR', {
          message: 'Failed to encrypt API key',
        });
      }

      // Extract last 4 characters for identification
      const last4 = extractLastChars(input.key, 4);

      // Insert into database
      const [newKey] = await db
        .insert(apiKeys)
        .values({
          userId,
          provider: input.provider,
          name: input.name,
          encryptedKey: encryptedData.encrypted,
          keyLast4: last4,
          isActive: true,
        })
        .returning();

      // Return the created key (without the actual key)
      return {
        id: newKey.id,
        provider: newKey.provider,
        name: newKey.name,
        keyLast4: newKey.keyLast4,
        isActive: newKey.isActive,
        createdAt: newKey.createdAt,
        updatedAt: newKey.updatedAt,
      };
    }),

  /**
   * Update an existing API key
   * Can update name, provider, or the key itself
   */
  update: protectedProcedure
    .input(
      z.object({
        id: ulidSchema,
        provider: providerSchema.optional(),
        name: z.string().min(1).max(100).optional(),
        key: z.string().min(1, 'API key cannot be empty').optional(),
        isActive: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { id, key, ...updates } = input;

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

      // If a new key is provided, encrypt it
      if (key) {
        // Validate key length
        if (key.length < 8) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'API key appears to be invalid (too short)',
          });
        }

        // Encrypt the new key
        let encryptedData;
        try {
          encryptedData = encrypt(key);
        } catch (error) {
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

      return {
        id: updatedKey.id,
        provider: updatedKey.provider,
        name: updatedKey.name,
        keyLast4: updatedKey.keyLast4,
        isActive: updatedKey.isActive,
        createdAt: updatedKey.createdAt,
        updatedAt: updatedKey.updatedAt,
      };
    }),

  /**
   * Delete an API key
   * Permanently removes the key from the database
   */
  delete: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // First, verify ownership
      const existingKeyResults = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, userId)));

      if (existingKeyResults.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'API key not found or you do not have permission to delete it',
        });
      }

      // Delete the key
      await db
        .delete(apiKeys)
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, userId)));

      return { success: true };
    }),
};
