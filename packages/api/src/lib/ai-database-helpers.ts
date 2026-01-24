import { db } from '@sambung-chat/db';
import { messages } from '@sambung-chat/db/schema/chat';
import { models } from '@sambung-chat/db/schema/model';
import { apiKeys } from '@sambung-chat/db/schema/api-key';
import { eq, and } from 'drizzle-orm';
import { ORPCError } from '@orpc/server';
import { decrypt } from '../lib/encryption';
import type { ProviderConfig } from '../lib/ai-provider-factory';

/**
 * Helper function to get decrypted API key from database
 *
 * Retrieves an API key by ID and decrypts it using AES-256-GCM encryption.
 * This function ensures that API keys are never stored or returned in plain text.
 *
 * @param apiKeyId - The API key ID from the database
 * @returns Decrypted API key string
 * @throws {ORPCError} with code 'NOT_FOUND' if API key is not found
 * @throws {ORPCError} with code 'INTERNAL_SERVER_ERROR' if decryption fails
 *
 * @example
 * ```ts
 * try {
 *   const apiKey = await getDecryptedApiKey('01HJX...');
 *   // Use apiKey for API requests
 * } catch (error) {
 *   if (error instanceof ORPCError && error.code === 'NOT_FOUND') {
 *     // Handle missing API key
 *   }
 * }
 * ```
 */
export async function getDecryptedApiKey(apiKeyId: string): Promise<string> {
  const apiKeyResults = await db.select().from(apiKeys).where(eq(apiKeys.id, apiKeyId)).limit(1);

  if (apiKeyResults.length === 0) {
    throw new ORPCError('NOT_FOUND', {
      message: 'API key not found',
    });
  }

  const apiKey = apiKeyResults[0];

  if (!apiKey) {
    throw new ORPCError('NOT_FOUND', {
      message: 'API key not found',
    });
  }

  // Decrypt the API key using AES-256-GCM
  try {
    return decrypt(apiKey.encryptedKey);
  } catch (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Failed to decrypt API key',
    });
  }
}

/**
 * Helper function to check if a message already exists in database
 *
 * This prevents duplicate messages from being saved when the client
 * retries a request or pre-saves messages before calling the API.
 * It checks the most recent message with the given role and compares content.
 *
 * @param chatId - The chat ID to check for messages
 * @param role - The message role ('user' | 'assistant' | 'system')
 * @param content - The message content to compare
 * @returns True if message exists, false otherwise
 *
 * @example
 * ```ts
 * const exists = await messageExists(chatId, 'user', 'Hello, world!');
 * if (!exists) {
 *   await db.insert(messages).values({ chatId, role: 'user', content: 'Hello, world!' });
 * }
 * ```
 */
export async function messageExists(
  chatId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<boolean> {
  const existingMessages = await db
    .select()
    .from(messages)
    .where(and(eq(messages.chatId, chatId), eq(messages.role, role)))
    .orderBy(messages.createdAt)
    .limit(1);

  // Check if the most recent message with this role has the same content
  return existingMessages.length > 0 && existingMessages[0]?.content === content;
}

/**
 * Helper function to get model configuration from database
 *
 * Retrieves a model by ID and user ID, then builds the complete provider configuration
 * including the decrypted API key. This function ensures that:
 * - The model exists and belongs to the user
 * - API keys are properly decrypted
 * - Ollama provider works without API key
 * - Other providers have required API keys
 * - Custom base URLs are included when specified
 *
 * @param modelId - The model ID from the database
 * @param userId - The current user's ID for authorization
 * @returns Provider configuration including provider type, model ID, API key, and optional base URL
 * @throws {ORPCError} with code 'NOT_FOUND' if model is not found or doesn't belong to user
 * @throws {ORPCError} with code 'BAD_REQUEST' if non-Ollama model is missing API key
 *
 * @example
 * ```ts
 * try {
 *   const config = await getModelConfig(modelId, userId);
 *   const model = createAIProvider(config);
 *   const result = await generateText({ model, messages });
 * } catch (error) {
 *   if (error instanceof ORPCError) {
 *     // Handle authorization or configuration errors
 *   }
 * }
 * ```
 */
export async function getModelConfig(modelId: string, userId: string): Promise<ProviderConfig> {
  const modelResults = await db
    .select()
    .from(models)
    .where(and(eq(models.id, modelId), eq(models.userId, userId)))
    .limit(1);

  if (modelResults.length === 0) {
    throw new ORPCError('NOT_FOUND', {
      message: 'Model not found or you do not have permission to use it',
    });
  }

  const model = modelResults[0];

  if (!model) {
    throw new ORPCError('NOT_FOUND', {
      message: 'Model not found',
    });
  }

  // Build provider configuration
  const config: ProviderConfig = {
    provider: model.provider as any,
    modelId: model.modelId,
    apiKey: '', // Will be set below
  };

  // API key is now required (except for Ollama)
  if (model.apiKeyId) {
    config.apiKey = await getDecryptedApiKey(model.apiKeyId);
  } else if (model.provider !== 'ollama') {
    // Ollama doesn't require API key, but other providers do
    throw new ORPCError('BAD_REQUEST', {
      message: `Model "${model.name}" is missing an API key. Please add an API Key in Settings and assign it to this model.`,
    });
  } else {
    config.apiKey = 'ollama'; // Placeholder for Ollama
  }

  // Add custom base URL if specified
  if (model.baseUrl) {
    config.baseURL = model.baseUrl;
  }

  return config;
}
