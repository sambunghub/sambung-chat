import z from 'zod';
import { protectedProcedure } from '../index';
import { ulidSchema } from '../utils/validation';
import { ApiKeyService } from '../services/api-key-service';

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
    return await ApiKeyService.retrieveAll(userId);
  }),

  /**
   * Get a specific API key by ID
   * Returns the decrypted key (use with caution)
   */
  getById: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      return await ApiKeyService.retrieveAndDecrypt(input.id, userId);
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
      return await ApiKeyService.encryptAndStore({
        userId,
        provider: input.provider,
        name: input.name,
        key: input.key,
      });
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
      return await ApiKeyService.updateKey({
        userId,
        ...input,
      });
    }),

  /**
   * Delete an API key
   * Permanently removes the key from the database
   */
  delete: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      return await ApiKeyService.deleteKey(input.id, userId);
    }),
};
