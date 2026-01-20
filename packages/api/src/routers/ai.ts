/**
 * AI Chat Completion Router
 *
 * This router handles AI chat completions using the AI SDK v6.
 * It supports streaming responses and proper error handling for various scenarios.
 *
 * Supported providers:
 * - OpenAI (GPT-4, GPT-3.5, GPT-4o, etc.)
 *
 * Error handling:
 * - Rate limits (HTTP 429)
 * - Invalid API keys (HTTP 401)
 * - Network errors
 * - Model not found
 * - Context window exceeded
 */

import { db } from '@sambung-chat/db';
import { chats, messages } from '@sambung-chat/db/schema/chat';
import { models } from '@sambung-chat/db/schema/model';
import { apiKeys } from '@sambung-chat/db/schema/api-key';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { ORPCError, eventIterator } from '@orpc/server';
import { streamText, generateText } from 'ai';
import { protectedProcedure } from '../index';
import { ulidSchema } from '../utils/validation';
import { createAIProvider, type ProviderConfig } from '../lib/ai-provider-factory';
import { decrypt } from '../lib/encryption';

/**
 * Chat message schema for AI completion requests
 */
const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
});

/**
 * Completion settings schema
 */
const completionSettingsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(1000000).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().min(0).max(100).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
});

/**
 * Helper function to get decrypted API key
 *
 * @param apiKeyId - The API key ID from the database
 * @returns Decrypted API key
 * @throws {ORPCError} If API key is not found or decryption fails
 */
async function getDecryptedApiKey(apiKeyId: string): Promise<string> {
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
 * Helper function to check if a message already exists
 *
 * This prevents duplicate messages from being saved when the client
 * retries a request or pre-saves messages before calling the API.
 *
 * @param chatId - The chat ID
 * @param role - The message role (user/assistant)
 * @param content - The message content
 * @returns True if message exists, false otherwise
 */
async function messageExists(
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
 * @param modelId - The model ID from the database
 * @param userId - The current user's ID
 * @returns Model configuration with decrypted API key
 * @throws {ORPCError} If model is not found or doesn't belong to user
 */
async function getModelConfig(modelId: string, userId: string): Promise<ProviderConfig> {
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

/**
 * Error type constants for better error categorization
 */
const ERROR_PATTERNS = {
  RATE_LIMIT: [
    'rate limit',
    'rate_limit_exceeded',
    '429',
    'quota',
    'too many requests',
    'requests exceeded',
  ],
  AUTHENTICATION: [
    'api key',
    'unauthorized',
    '401',
    '403',
    'authentication',
    'invalid api key',
    'incorrect api key',
  ],
  MODEL_NOT_FOUND: [
    'model not found',
    'invalid model',
    '404',
    'model does not exist',
    'no such model',
  ],
  CONTEXT_EXCEEDED: [
    'context',
    'context_length_exceeded',
    'tokens',
    'too long',
    'maximum',
    'exceeds maximum length',
  ],
  CONTENT_POLICY: ['content policy', 'content_filter', 'safety', 'moderation', 'policy violation'],
  INVALID_REQUEST: ['invalid', 'validation', 'schema', 'malformed', 'bad request', '400'],
  NETWORK: ['network', 'connection', 'fetch', 'econnrefused', 'etimedout', 'timeout', 'dns'],
  SERVICE_UNAVAILABLE: [
    '503',
    'service unavailable',
    'maintenance',
    'overloaded',
    'temporarily unavailable',
  ],
  PAYMENT_REQUIRED: ['payment', 'billing', 'insufficient', '402', 'quota exceeded'],
} as const;

/**
 * Type guard to check if error is an AI SDK error with additional properties
 */
function isAIError(
  error: unknown
): error is Error & { cause?: unknown; statusCode?: number; code?: string } {
  return error instanceof Error;
}

/**
 * Extract error code from error object if available
 */
function extractErrorCode(error: unknown): string | undefined {
  if (isAIError(error)) {
    // Check for code property directly
    if ('code' in error && typeof error.code === 'string') {
      return error.code;
    }

    // Check for cause property
    if ('cause' in error && typeof error.cause === 'object' && error.cause !== null) {
      if ('code' in error.cause && typeof error.cause.code === 'string') {
        return error.cause.code;
      }
    }
  }
  return undefined;
}

/**
 * Sanitize error message by removing sensitive information
 */
function sanitizeErrorMessage(message: string): string {
  // Remove API keys if accidentally included
  return message.replace(/sk-[a-zA-Z0-9-]{20,}/g, 'sk-****');
}

/**
 * Check if error message matches any of the provided patterns
 */
function matchesPattern(errorMessage: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => errorMessage.toLowerCase().includes(pattern.toLowerCase()));
}

/**
 * Handle AI SDK errors and convert them to ORPC errors
 *
 * This function provides comprehensive error handling for AI provider errors,
 * including rate limits, authentication failures, network issues, and more.
 *
 * @param error - The error caught from AI SDK
 * @throws {ORPCError} with appropriate error code and message
 */
function handleAIError(error: unknown): never {
  // Handle non-Error objects
  if (!isAIError(error)) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'An unknown error occurred',
    });
  }

  const errorMessage = sanitizeErrorMessage(error.message).toLowerCase();
  const errorCode = extractErrorCode(error);

  // Log error for debugging (without sensitive data)
  console.error('[AI Error]', {
    message: sanitizeErrorMessage(error.message),
    code: errorCode,
    name: error.name,
  });

  // Rate limit errors - most common
  if (matchesPattern(errorMessage, ERROR_PATTERNS.RATE_LIMIT)) {
    throw new ORPCError('TOO_MANY_REQUESTS', {
      message: 'Rate limit exceeded. Please wait a moment and try again.',
    });
  }

  // Authentication errors - invalid or missing API keys
  if (matchesPattern(errorMessage, ERROR_PATTERNS.AUTHENTICATION)) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'Invalid API key. Please check your provider credentials.',
    });
  }

  // Model not found or access denied
  if (matchesPattern(errorMessage, ERROR_PATTERNS.MODEL_NOT_FOUND)) {
    throw new ORPCError('NOT_FOUND', {
      message: 'The specified model is not available or you do not have access to it.',
    });
  }

  // Context window exceeded
  if (matchesPattern(errorMessage, ERROR_PATTERNS.CONTEXT_EXCEEDED)) {
    throw new ORPCError('BAD_REQUEST', {
      message:
        'The conversation is too long. Please start a new chat or reduce the message length.',
    });
  }

  // Content policy violations
  if (matchesPattern(errorMessage, ERROR_PATTERNS.CONTENT_POLICY)) {
    throw new ORPCError('BAD_REQUEST', {
      message:
        'The content was flagged by the safety filter. Please modify your message and try again.',
    });
  }

  // Invalid request format
  if (matchesPattern(errorMessage, ERROR_PATTERNS.INVALID_REQUEST)) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Invalid request format. Please check your input and try again.',
    });
  }

  // Network and connectivity errors
  if (matchesPattern(errorMessage, ERROR_PATTERNS.NETWORK)) {
    throw new ORPCError('SERVICE_UNAVAILABLE', {
      message: 'Network error. Please check your connection and try again.',
    });
  }

  // Service unavailable or maintenance
  if (matchesPattern(errorMessage, ERROR_PATTERNS.SERVICE_UNAVAILABLE)) {
    throw new ORPCError('SERVICE_UNAVAILABLE', {
      message: 'The service is temporarily unavailable. Please try again later.',
    });
  }

  // Payment/billing related errors
  if (matchesPattern(errorMessage, ERROR_PATTERNS.PAYMENT_REQUIRED)) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Payment required or quota exceeded. Please check your billing details.',
    });
  }

  // Generic server error with sanitized message
  throw new ORPCError('INTERNAL_SERVER_ERROR', {
    message:
      sanitizeErrorMessage(error.message) || 'An error occurred while processing your request',
  });
}

export const aiRouter = {
  /**
   * Generate a non-streaming chat completion
   *
   * This endpoint returns the complete response in one call.
   * Use this for simple completions where streaming is not required.
   */
  complete: protectedProcedure
    .input(
      z.object({
        chatId: ulidSchema.optional(),
        modelId: ulidSchema,
        messages: z.array(chatMessageSchema).min(1),
        settings: completionSettingsSchema.optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      try {
        // Get model configuration
        const modelConfig = await getModelConfig(input.modelId, userId);

        // Create the language model
        const model = createAIProvider(modelConfig);

        // Prepare AI SDK settings
        const aiSettings: any = {};

        if (input.settings) {
          if (input.settings.temperature !== undefined) {
            aiSettings.temperature = input.settings.temperature;
          }
          if (input.settings.maxTokens !== undefined) {
            aiSettings.maxTokens = input.settings.maxTokens;
          }
          if (input.settings.topP !== undefined) {
            aiSettings.topP = input.settings.topP;
          }
          if (input.settings.topK !== undefined) {
            aiSettings.topK = input.settings.topK;
          }
          if (input.settings.frequencyPenalty !== undefined) {
            aiSettings.frequencyPenalty = input.settings.frequencyPenalty;
          }
          if (input.settings.presencePenalty !== undefined) {
            aiSettings.presencePenalty = input.settings.presencePenalty;
          }
        }

        // Generate completion
        const result = await generateText({
          model,
          messages: input.messages as any,
          ...aiSettings,
        });

        // If chatId is provided, save the messages to database
        if (input.chatId) {
          // Verify chat belongs to user
          const chatResults = await db
            .select()
            .from(chats)
            .where(and(eq(chats.id, input.chatId), eq(chats.userId, userId)));

          if (chatResults.length > 0) {
            // Save user message if it's the last message and not already saved
            const lastMessage = input.messages[input.messages.length - 1];
            if (lastMessage && lastMessage.role === 'user') {
              const userMsgExists = await messageExists(input.chatId, 'user', lastMessage.content);

              if (!userMsgExists) {
                await db.insert(messages).values({
                  chatId: input.chatId,
                  role: 'user',
                  content: lastMessage.content,
                });
              }
            }

            // Save assistant response with standardized metadata
            await db.insert(messages).values({
              chatId: input.chatId,
              role: 'assistant',
              content: result.text,
              metadata: {
                model: modelConfig.modelId,
                tokens: result.usage?.totalTokens,
                finishReason: result.finishReason,
              },
            });

            // Update chat timestamp
            await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, input.chatId));
          }
        }

        // Return completion result
        return {
          text: result.text,
          usage: result.usage,
          finishReason: result.finishReason,
          response: result.response,
        };
      } catch (error) {
        handleAIError(error);
      }
    }),

  /**
   * Generate a streaming chat completion using Server-Sent Events (SSE)
   *
   * This endpoint uses oRPC's event iterator to stream text chunks as they are generated.
   * The async generator function yields each text delta for real-time display.
   *
   * Frontend consumption example:
   * ```ts
   * const stream = await orpc.ai.stream({ messages: [...] })
   * for await (const chunk of stream) {
   *   console.log(chunk.text) // Individual text delta
   * }
   * ```
   */
  stream: protectedProcedure
    .input(
      z.object({
        chatId: ulidSchema.optional(),
        modelId: ulidSchema,
        messages: z.array(chatMessageSchema).min(1),
        settings: completionSettingsSchema.optional(),
      })
    )
    .output(
      eventIterator(
        z.discriminatedUnion('type', [
          z.object({
            type: z.literal('text-delta'),
            text: z.string(),
          }),
          z.object({
            type: z.literal('finish'),
            finishReason: z.string().optional(),
            usage: z
              .object({
                promptTokens: z.number().optional(),
                completionTokens: z.number().optional(),
                totalTokens: z.number().optional(),
              })
              .optional(),
          }),
          z.object({
            type: z.literal('error'),
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
          }),
        ])
      )
    )
    .handler(async function* ({ input, context }) {
      const userId = context.session.user.id;

      let assistantMessageId: string | undefined;
      let fullText = '';

      try {
        // Get model configuration
        const modelConfig = await getModelConfig(input.modelId, userId);

        // Create the language model
        const model = createAIProvider(modelConfig);

        // Prepare AI SDK settings
        const aiSettings: any = {};

        if (input.settings) {
          if (input.settings.temperature !== undefined) {
            aiSettings.temperature = input.settings.temperature;
          }
          if (input.settings.maxTokens !== undefined) {
            aiSettings.maxTokens = input.settings.maxTokens;
          }
          if (input.settings.topP !== undefined) {
            aiSettings.topP = input.settings.topP;
          }
          if (input.settings.topK !== undefined) {
            aiSettings.topK = input.settings.topK;
          }
          if (input.settings.frequencyPenalty !== undefined) {
            aiSettings.frequencyPenalty = input.settings.frequencyPenalty;
          }
          if (input.settings.presencePenalty !== undefined) {
            aiSettings.presencePenalty = input.settings.presencePenalty;
          }
        }

        // If chatId is provided, save user message and create placeholder for assistant
        if (input.chatId) {
          // Verify chat belongs to user
          const chatResults = await db
            .select()
            .from(chats)
            .where(and(eq(chats.id, input.chatId), eq(chats.userId, userId)));

          if (chatResults.length > 0) {
            // Save user message if not already saved
            const lastMessage = input.messages[input.messages.length - 1];
            if (lastMessage && lastMessage.role === 'user') {
              const userMsgExists = await messageExists(input.chatId, 'user', lastMessage.content);

              if (!userMsgExists) {
                await db.insert(messages).values({
                  chatId: input.chatId,
                  role: 'user',
                  content: lastMessage.content,
                });
              }
            }

            // Create a placeholder message for the assistant
            const insertedMessages = await db
              .insert(messages)
              .values({
                chatId: input.chatId,
                role: 'assistant',
                content: '',
              })
              .returning();

            if (insertedMessages.length > 0 && insertedMessages[0]) {
              assistantMessageId = insertedMessages[0].id;
            }
          }
        }

        // Start streaming with AI SDK
        const result = await streamText({
          model,
          messages: input.messages as any,
          ...aiSettings,
        });

        // Stream text deltas to client using async generator
        // The AI SDK's textStream is an async iterable of text chunks
        for await (const textDelta of result.textStream) {
          // Accumulate full text for saving to database later
          fullText += textDelta;

          // Yield text chunk to client
          yield {
            type: 'text-delta',
            text: textDelta,
          } as const;
        }

        // Await the final usage and finish reason
        const finalUsage = await result.usage;
        const finalFinishReason = await result.finishReason;

        // After streaming completes, save the complete message to database
        if (assistantMessageId && input.chatId) {
          await db
            .update(messages)
            .set({
              content: fullText,
              metadata: {
                model: modelConfig.modelId,
                tokens: finalUsage?.totalTokens,
                finishReason: finalFinishReason,
              },
            })
            .where(eq(messages.id, assistantMessageId));

          // Update chat timestamp
          await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, input.chatId));
        }

        // Send final completion message
        yield {
          type: 'finish',
          finishReason: finalFinishReason,
          usage: finalUsage,
        } as const;
      } catch (error) {
        // Clean up placeholder message if streaming failed
        if (assistantMessageId && input.chatId && fullText.length === 0) {
          try {
            await db.delete(messages).where(eq(messages.id, assistantMessageId));
          } catch (deleteError) {
            // Log but don't throw - we still need to yield the error to client
            console.error('[AI Router] Failed to clean up placeholder message:', deleteError);
          }
        }

        // Handle errors and yield error message to client
        if (error instanceof ORPCError) {
          yield {
            type: 'error',
            error: {
              code: error.code,
              message: error.message,
            },
          } as const;
          return;
        }

        // Handle AI SDK errors
        try {
          handleAIError(error);
        } catch (orpcError) {
          if (orpcError instanceof ORPCError) {
            yield {
              type: 'error',
              error: {
                code: orpcError.code,
                message: orpcError.message,
              },
            } as const;
          }
        }
      }
    }),

  /**
   * Get available models for testing
   *
   * This endpoint returns a list of available models for the current user.
   * Useful for testing and validation.
   */
  listModels: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    const userModels = await db.select().from(models).where(eq(models.userId, userId));

    return userModels;
  }),

  /**
   * Validate model configuration
   *
   * This endpoint checks if a model is properly configured with valid credentials.
   */
  validateModel: protectedProcedure
    .input(z.object({ modelId: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      try {
        const modelConfig = await getModelConfig(input.modelId, userId);
        const model = createAIProvider(modelConfig);

        // Make a simple test request
        await generateText({
          model,
          messages: [{ role: 'user', content: 'Test' }],
        });

        return {
          valid: true,
          message: 'Model is properly configured',
        };
      } catch (error) {
        if (error instanceof ORPCError) {
          return {
            valid: false,
            message: error.message,
          };
        }
        return {
          valid: false,
          message: 'Model configuration is invalid',
        };
      }
    }),
};
