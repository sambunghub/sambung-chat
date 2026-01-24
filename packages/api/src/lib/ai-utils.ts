import { db } from '@sambung-chat/db';
import { models } from '@sambung-chat/db/schema/model';
import { eq } from 'drizzle-orm';
import { generateText } from 'ai';
import { ORPCError } from '@orpc/server';
import { createAIProvider } from './ai-provider-factory';
import { getModelConfig } from './ai-database-helpers';

/**
 * Result returned from model validation
 *
 * Contains the validation status and optional message.
 */
export interface ValidateModelResult {
  /** Whether the model configuration is valid */
  valid: boolean;
  /** Optional message describing the validation result */
  message: string;
}

/**
 * Get all models for a user
 *
 * This function retrieves all AI models configured by a user from the database.
 * Useful for testing, validation, and displaying available models in the UI.
 *
 * Features:
 * - Retrieves all models belonging to the user
 * - Returns model configurations including provider, model ID, and settings
 * - Useful for model selection UI and testing
 *
 * @param userId - The user's ID to retrieve models for
 * @returns Array of model configurations belonging to the user
 *
 * @example
 * ```ts
 * const userModels = await listModels(userId);
 * console.log(`User has ${userModels.length} models configured`);
 *
 * userModels.forEach(model => {
 *   console.log(`- ${model.name} (${model.provider})`);
 * });
 * ```
 */
export async function listModels(userId: string): Promise<Array<typeof models.$inferSelect>> {
  const userModels = await db.select().from(models).where(eq(models.userId, userId));
  return userModels;
}

/**
 * Validate model configuration
 *
 * This function validates a model configuration by making a test request
 * to the AI provider. It checks if the API key is valid and the model is accessible.
 *
 * Features:
 * - Retrieves model configuration with automatic API key decryption
 * - Creates AI provider instance
 * - Makes a simple test request to validate credentials
 * - Returns validation result with descriptive message
 * - Handles errors gracefully without throwing
 *
 * @param modelId - The model ID to validate
 * @param userId - The current user's ID for authorization
 * @returns Validation result indicating if the model is properly configured
 *
 * @example
 * ```ts
 * const result = await validateModel('gpt-4', userId);
 *
 * if (result.valid) {
 *   console.log('Model is ready to use!');
 * } else {
 *   console.error('Model configuration issue:', result.message);
 * }
 * ```
 */
export async function validateModel(modelId: string, userId: string): Promise<ValidateModelResult> {
  try {
    // Get model configuration (includes API key decryption and validation)
    const modelConfig = await getModelConfig(modelId, userId);

    // Create the language model instance
    const model = createAIProvider(modelConfig);

    // Make a simple test request to validate credentials
    await generateText({
      model,
      messages: [{ role: 'user', content: 'Test' }],
    });

    return {
      valid: true,
      message: 'Model is properly configured',
    };
  } catch (error) {
    // Handle ORPC errors from model config retrieval
    if (error instanceof ORPCError) {
      return {
        valid: false,
        message: error.message,
      };
    }

    // Handle other errors (AI SDK errors, network errors, etc.)
    return {
      valid: false,
      message: 'Model configuration is invalid',
    };
  }
}
