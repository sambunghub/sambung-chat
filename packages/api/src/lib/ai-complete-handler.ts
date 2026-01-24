import { db } from '@sambung-chat/db';
import { chats, messages as messagesTable } from '@sambung-chat/db/schema/chat';
import { eq, and } from 'drizzle-orm';
import { generateText } from 'ai';
import { createAIProvider } from './ai-provider-factory';
import { handleAIError } from './ai-error-handler';
import { getModelConfig, messageExists } from './ai-database-helpers';
import type { CompletionSettings } from './ai-schemas';

/**
 * Input parameters for non-streaming chat completion
 *
 * Contains all necessary data to generate a complete AI response:
 * - Optional chat ID for saving messages to database
 * - Model ID to use for generation
 * - Array of chat messages (conversation history)
 * - Optional completion settings to control model behavior
 */
export interface CompleteInput {
  /** Optional chat ID. If provided, messages will be saved to the chat */
  chatId?: string;
  /** Model ID to use for generating the completion */
  modelId: string;
  /** Array of chat messages representing the conversation */
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  /** Optional completion settings to control model behavior */
  settings?: CompletionSettings;
}

/**
 * Result returned from non-streaming chat completion
 *
 * Contains the generated text response and metadata about the completion.
 */
export interface CompleteResult {
  /** The generated text response from the AI model */
  text: string;
  /** Token usage information (prompt, completion, and total tokens) */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  /** The reason why the completion finished (e.g., 'stop', 'length') */
  finishReason?: string | null;
  /** Raw response object from the AI provider */
  response?: unknown;
}

/**
 * Handle non-streaming AI chat completion
 *
 * This function generates a complete AI response without streaming.
 * It handles model configuration, API calls, and optionally saves messages to the database.
 *
 * Features:
 * - Retrieves and validates model configuration from database
 * - Decrypts API keys automatically
 * - Supports all completion settings (temperature, maxTokens, topP, etc.)
 * - Saves user and assistant messages to database if chatId is provided
 * - Prevents duplicate message saves
 * - Validates chat ownership before saving messages
 * - Updates chat timestamp
 * - Comprehensive error handling for AI provider errors
 *
 * @param input - Completion parameters including chatId, modelId, messages, and settings
 * @param userId - Current user's ID for authorization and database operations
 * @returns Complete result containing generated text, usage info, and finish reason
 * @throws {ORPCError} with appropriate error code for various failure scenarios:
 * - NOT_FOUND: Model or chat not found
 * - UNAUTHORIZED: Invalid API key or unauthorized access
 * - BAD_REQUEST: Invalid input or context length exceeded
 * - TOO_MANY_REQUESTS: Rate limit exceeded
 * - SERVICE_UNAVAILABLE: Network errors or provider issues
 *
 * @example
 * ```ts
 * try {
 *   const result = await handleComplete({
 *     chatId: '01HJX...',
 *     modelId: 'gpt-4',
 *     messages: [
 *       { role: 'user', content: 'Hello, how are you?' }
 *     ],
 *     settings: { temperature: 0.7, maxTokens: 1000 }
 *   }, userId);
 *
 *   console.log(result.text); // "I'm doing well, thank you!"
 * } catch (error) {
 *   if (error instanceof ORPCError) {
 *     // Handle error
 *   }
 * }
 * ```
 */
export async function handleComplete(
  input: CompleteInput,
  userId: string
): Promise<CompleteResult> {
  try {
    // Get model configuration (includes API key decryption and validation)
    const modelConfig = await getModelConfig(input.modelId, userId);

    // Create the language model instance
    const model = createAIProvider(modelConfig);

    // Prepare AI SDK settings from input
    const aiSettings: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      topK?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
    } = {};

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

    // Generate completion using AI SDK
    const result = await generateText({
      model,
      messages: input.messages,
      ...aiSettings,
    });

    // If chatId is provided, save messages to database
    if (input.chatId) {
      await saveMessagesToChat(
        input.chatId,
        userId,
        input.messages,
        result.text,
        modelConfig.modelId,
        result.usage?.totalTokens,
        result.finishReason
      );
    }

    // Return completion result
    return {
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
      response: result.response,
    };
  } catch (error) {
    // Delegate to centralized error handler
    handleAIError(error);
  }
}

/**
 * Save user and assistant messages to chat
 *
 * This helper function handles:
 * - Verifying chat ownership
 * - Saving user message (with duplicate check)
 * - Saving assistant response with metadata
 * - Updating chat timestamp
 *
 * @param chatId - Chat ID to save messages to
 * @param userId - Current user's ID for ownership verification
 * @param messages - Array of chat messages from the request
 * @param assistantText - Generated assistant response text
 * @param modelId - Model ID used for generation (stored in metadata)
 * @param totalTokens - Total tokens used (stored in metadata)
 * @param finishReason - Reason for completion finish (stored in metadata)
 */
async function saveMessagesToChat(
  chatId: string,
  userId: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  assistantText: string,
  modelId: string,
  totalTokens: number | undefined,
  finishReason: string | null | undefined
): Promise<void> {
  // Verify chat belongs to user
  const chatResults = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));

  // Only save if chat exists and belongs to user
  if (chatResults.length > 0) {
    // Save user message if it's the last message and not already saved
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      const userMsgExists = await messageExists(chatId, 'user', lastMessage.content);

      if (!userMsgExists) {
        await db.insert(messagesTable).values({
          chatId: chatId,
          role: 'user',
          content: lastMessage.content,
        });
      }
    }

    // Save assistant response with standardized metadata
    await db.insert(messagesTable).values({
      chatId: chatId,
      role: 'assistant',
      content: assistantText,
      metadata: modelId
        ? {
            model: modelId,
            tokens: totalTokens,
            ...(finishReason ? { finishReason } : {}),
          }
        : undefined,
    });

    // Update chat timestamp to reflect recent activity
    await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));
  }
}
