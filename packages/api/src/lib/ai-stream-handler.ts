import { db } from '@sambung-chat/db';
import { chats, messages as messagesTable } from '@sambung-chat/db/schema/chat';
import { eq, and } from 'drizzle-orm';
import { streamText } from 'ai';
import { ORPCError } from '@orpc/server';
import { createAIProvider } from './ai-provider-factory';
import { handleAIError } from './ai-error-handler';
import { getModelConfig, messageExists } from './ai-database-helpers';
import type { CompletionSettings, StreamEvent } from './ai-schemas';

/**
 * Input parameters for streaming chat completion
 *
 * Contains all necessary data to generate a streaming AI response:
 * - Optional chat ID for saving messages to database
 * - Model ID to use for generation
 * - Array of chat messages (conversation history)
 * - Optional completion settings to control model behavior
 */
export interface StreamInput {
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
 * Handle streaming AI chat completion
 *
 * This function generates an AI response with streaming, yielding text chunks
 * as they are generated. It handles model configuration, API calls, and optionally
 * saves messages to the database.
 *
 * Features:
 * - Retrieves and validates model configuration from database
 * - Decrypts API keys automatically
 * - Supports all completion settings (temperature, maxTokens, topP, etc.)
 * - Streams text deltas in real-time as they're generated
 * - Saves user and assistant messages to database if chatId is provided
 * - Prevents duplicate message saves
 * - Validates chat ownership before saving messages
 * - Creates placeholder message for assistant that's updated as text streams
 * - Cleans up placeholder message if streaming fails
 * - Updates chat timestamp
 * - Comprehensive error handling for AI provider errors
 *
 * @param input - Stream parameters including chatId, modelId, messages, and settings
 * @param userId - Current user's ID for authorization and database operations
 * @returns Async generator yielding stream events (text-delta, finish, or error)
 * @throws {ORPCError} errors are yielded as error events, not thrown
 *
 * @example
 * ```ts
 * try {
 *   const stream = handleStream({
 *     chatId: '01HJX...',
 *     modelId: 'gpt-4',
 *     messages: [
 *       { role: 'user', content: 'Hello, how are you?' }
 *     ],
 *     settings: { temperature: 0.7, maxTokens: 1000 }
 *   }, userId);
 *
 *   for await (const event of stream) {
 *     if (event.type === 'text-delta') {
 *       console.log(event.text); // Stream text chunk
 *     } else if (event.type === 'finish') {
 *       console.log('Done!', event.finishReason);
 *     } else if (event.type === 'error') {
 *       console.error('Error:', event.error.message);
 *     }
 *   }
 * } catch (error) {
 *   // Handle unexpected errors
 * }
 * ```
 */
export async function* handleStream(
  input: StreamInput,
  userId: string
): AsyncGenerator<StreamEvent> {
  // Track the assistant placeholder message ID and accumulated text
  const state = {
    assistantMessageId: undefined as string | undefined,
    fullText: '',
  };

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

    // If chatId is provided, save user message and create placeholder for assistant
    if (input.chatId) {
      state.assistantMessageId = await saveUserMessageAndCreatePlaceholder(
        input.chatId,
        userId,
        input.messages
      );
    }

    // Start streaming with AI SDK
    const result = await streamText({
      model,
      messages: input.messages,
      ...aiSettings,
    });

    // Stream text deltas to client using async generator
    // The AI SDK's textStream is an async iterable of text chunks
    for await (const textDelta of result.textStream) {
      // Accumulate full text for saving to database later
      state.fullText += textDelta;

      // Yield text chunk to client
      yield {
        type: 'text-delta',
        text: textDelta,
      };
    }

    // Await the final usage and finish reason
    const finalUsage = await result.usage;
    const finalFinishReason = await result.finishReason;

    // After streaming completes, save the complete message to database
    if (state.assistantMessageId && input.chatId) {
      await updateAssistantMessage(
        input.chatId,
        state.assistantMessageId,
        state.fullText,
        modelConfig.modelId,
        finalUsage?.totalTokens,
        finalFinishReason
      );
    }

    // Send final completion message
    yield {
      type: 'finish',
      finishReason: finalFinishReason,
      usage: finalUsage,
    };
  } catch (error) {
    // Handle partial content: persist it to database if streaming failed after partial output
    if (state.assistantMessageId && input.chatId && state.fullText.length > 0) {
      // Persist partial content so chat history reflects what the user saw
      await updateAssistantMessage(
        input.chatId,
        state.assistantMessageId,
        state.fullText,
        '', // modelId not available on error
        undefined, // totalTokens not available on error
        'error' // finishReason indicates streaming failed
      );
    } else if (state.assistantMessageId && input.chatId && state.fullText.length === 0) {
      // Clean up placeholder if streaming failed before any content was generated
      await cleanupPlaceholderMessage(state.assistantMessageId);
    }

    // Handle errors and yield error message to client
    if (error instanceof ORPCError) {
      yield {
        type: 'error',
        error: {
          code: error.code,
          message: error.message,
        },
      };
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
        };
      }
    }
  }
}

/**
 * Save user message and create placeholder for assistant message
 *
 * This helper function handles:
 * - Verifying chat ownership
 * - Saving user message (with duplicate check)
 * - Creating placeholder message for assistant that will be updated as text streams
 *
 * @param chatId - Chat ID to save messages to
 * @param userId - Current user's ID for ownership verification
 * @param messages - Array of chat messages from the request
 * @returns The ID of the created placeholder message, or undefined if chat not found
 */
async function saveUserMessageAndCreatePlaceholder(
  chatId: string,
  userId: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string | undefined> {
  // Verify chat belongs to user
  const chatResults = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));

  // Only proceed if chat exists and belongs to user
  if (chatResults.length === 0) {
    return undefined;
  }

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

  // Create a placeholder message for the assistant
  // This placeholder will be updated with actual content as streaming progresses
  const insertedMessages = await db
    .insert(messagesTable)
    .values({
      chatId: chatId,
      role: 'assistant',
      content: '',
    })
    .returning();

  // Return the ID of the created placeholder message
  if (insertedMessages.length > 0 && insertedMessages[0]) {
    return insertedMessages[0].id;
  }

  return undefined;
}

/**
 * Update assistant message with final content and metadata
 *
 * This helper function updates the placeholder assistant message with:
 * - The complete streamed text
 * - Metadata about the generation (model, tokens, finish reason)
 * - Updated chat timestamp
 *
 * @param chatId - Chat ID to update
 * @param messageId - ID of the placeholder message to update
 * @param content - Complete text content from streaming
 * @param modelId - Model ID used for generation
 * @param totalTokens - Total tokens used
 * @param finishReason - Reason for completion finish
 */
async function updateAssistantMessage(
  chatId: string,
  messageId: string,
  content: string,
  modelId: string,
  totalTokens: number | undefined,
  finishReason: string | null | undefined
): Promise<void> {
  // Update the placeholder message with complete content and metadata
  await db
    .update(messagesTable)
    .set({
      content: content,
      metadata: {
        model: modelId,
        tokens: totalTokens,
        finishReason: finishReason ?? undefined,
      },
    })
    .where(eq(messagesTable.id, messageId!));

  // Update chat timestamp to reflect recent activity
  await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));
}

/**
 * Clean up placeholder message if streaming fails
 *
 * This helper function removes the placeholder assistant message if streaming
 * fails before any content is generated. This prevents empty messages from
 * cluttering the chat history.
 *
 * @param messageId - ID of the placeholder message to delete
 */
async function cleanupPlaceholderMessage(messageId: string): Promise<void> {
  try {
    await db.delete(messagesTable).where(eq(messagesTable.id, messageId!));
  } catch (deleteError) {
    // Log but don't throw - we still need to yield the error to client
    console.error('[AI Stream Handler] Failed to clean up placeholder message:', deleteError);
  }
}
