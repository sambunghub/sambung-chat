import { z } from 'zod';

/**
 * AI Validation Schemas
 *
 * This module contains Zod validation schemas used throughout the AI chat completion system.
 * These schemas ensure type safety and validate input data for AI requests.
 *
 * @module ai-schemas
 */

/**
 * Chat message schema for AI completion requests
 *
 * Validates the structure of individual chat messages, including:
 * - Role validation (user, assistant, or system)
 * - Content validation (non-empty string)
 *
 * Used in both streaming and non-streaming completion procedures.
 *
 * @example
 * ```ts
 * import { chatMessageSchema } from '@sambung-chat/api/lib/ai-schemas';
 *
 * const message = {
 *   role: 'user',
 *   content: 'Hello, how are you?'
 * };
 *
 * const validated = chatMessageSchema.parse(message);
 * ```
 */
export const chatMessageSchema = z.object({
  /**
   * Message role in the conversation
   * - user: Message from the user
   * - assistant: Response from the AI assistant
   * - system: System instructions or context
   */
  role: z.enum(['user', 'assistant', 'system']),

  /**
   * Message content
   * Must be a non-empty string
   */
  content: z.string().min(1),
});

/**
 * Completion settings schema
 *
 * Validates optional parameters for AI chat completion requests.
 * All fields are optional and provide fine-grained control over model behavior.
 *
 * These settings map to standard AI provider parameters:
 * - Temperature: Controls randomness (0 = deterministic, 2 = very random)
 * - Max tokens: Limits response length
 * - Top P: Nucleus sampling parameter
 * - Top K: Limits token selection to top K options
 * - Frequency penalty: Reduces repetition of frequent tokens
 * - Presence penalty: Encourages talking about new topics
 *
 * @example
 * ```ts
 * import { completionSettingsSchema } from '@sambung-chat/api/lib/ai-schemas';
 *
 * const settings = {
 *   temperature: 0.7,
 *   maxTokens: 1000,
 *   topP: 0.9
 * };
 *
 * const validated = completionSettingsSchema.parse(settings);
 * ```
 */
export const completionSettingsSchema = z.object({
  /**
   * Sampling temperature (0-2)
   * Higher values increase randomness and creativity
   * Lower values make output more focused and deterministic
   */
  temperature: z.number().min(0).max(2).optional(),

  /**
   * Maximum number of tokens to generate (1-1000000)
   * Limits the length of the model's response
   */
  maxTokens: z.number().min(1).max(1000000).optional(),

  /**
   * Nucleus sampling parameter (0-1)
   * Controls the cumulative probability threshold for token selection
   * 0.1 = very focused, 1.0 = include all tokens
   */
  topP: z.number().min(0).max(1).optional(),

  /**
   * Top-k sampling parameter (0-100)
   * Limits token selection to the k most probable tokens
   * 0 = disabled, higher values = more diverse options
   */
  topK: z.number().min(0).max(100).optional(),

  /**
   * Frequency penalty (-2 to 2)
   * Positive values reduce repetition of frequent tokens
   * Negative values increase repetition
   */
  frequencyPenalty: z.number().min(-2).max(2).optional(),

  /**
   * Presence penalty (-2 to 2)
   * Positive values encourage talking about new topics
   * Negative values encourage staying on topic
   */
  presencePenalty: z.number().min(-2).max(2).optional(),
});

/**
 * Type inference from schemas
 *
 * Exported TypeScript types for use in function signatures and interfaces.
 * These types are automatically inferred from the Zod schemas.
 */

/** Type representing a validated chat message */
export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** Type representing validated completion settings */
export type CompletionSettings = z.infer<typeof completionSettingsSchema>;

/**
 * Completion input schema
 *
 * Validates the input parameters for both streaming and non-streaming chat completions.
 * This schema combines chat identifier, model identifier, message history, and optional settings.
 *
 * @example
 * ```ts
 * import { completionInputSchema } from '@sambung-chat/api/lib/ai-schemas';
 *
 * const input = {
 *   chatId: '01HZ9K5...',
 *   modelId: '01HZ9K6...',
 *   messages: [
 *     { role: 'user', content: 'Hello!' }
 *   ],
 *   settings: {
 *     temperature: 0.7,
 *     maxTokens: 1000
 *   }
 * };
 *
 * const validated = completionInputSchema.parse(input);
 * ```
 */
export const completionInputSchema = z.object({
  /**
   * Optional chat identifier
   * If provided, messages will be saved to this chat
   */
  chatId: z.string().ulid().optional(),

  /**
   * Model identifier
   * References the user's configured model in the database
   */
  modelId: z.string().ulid(),

  /**
   * Array of chat messages
   * Must contain at least one message
   * Messages should be in chronological order
   */
  messages: z.array(chatMessageSchema).min(1),

  /**
   * Optional completion settings
   * Overrides model default settings if provided
   */
  settings: completionSettingsSchema.optional(),
});

/** Type representing validated completion input */
export type CompletionInput = z.infer<typeof completionInputSchema>;

/**
 * Stream event schema for Server-Sent Events (SSE)
 *
 * Defines the structure of events emitted during streaming chat completion.
 * Uses discriminated union for type-safe event handling.
 *
 * Event types:
 * - text-delta: Partial text chunk as it's generated
 * - finish: Final status with usage statistics
 * - error: Error information if streaming fails
 *
 * @example
 * ```ts
 * import { streamEventSchema } from '@sambung-chat/api/lib/ai-schemas';
 *
 * const event = {
 *   type: 'text-delta',
 *   text: 'Hello'
 * };
 *
 * const validated = streamEventSchema.parse(event);
 * ```
 */
export const streamEventSchema = z.discriminatedUnion('type', [
  /**
   * Text delta event
   * Emitted when a new text chunk is generated
   */
  z.object({
    type: z.literal('text-delta'),
    text: z.string(),
  }),

  /**
   * Finish event
   * Emitted when completion is complete
   * Contains usage statistics and finish reason
   */
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

  /**
   * Error event
   * Emitted when an error occurs during streaming
   */
  z.object({
    type: z.literal('error'),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  }),
]);

/** Type representing a validated stream event */
export type StreamEvent = z.infer<typeof streamEventSchema>;
