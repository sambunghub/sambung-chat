import { db } from '@sambung-chat/db';
import { chats } from '@sambung-chat/db/schema/chat';
import { models } from '@sambung-chat/db/schema/model';
import { eq, and, desc, asc, sql, gte, lte, inArray, ilike } from 'drizzle-orm';
import z from 'zod';
import { protectedProcedure } from '../../index';
import { ulidOptionalSchema } from '../../utils/validation';

/**
 * Search Router for Chat Operations
 *
 * Provides advanced search functionality for chats with multiple filter options.
 * Supports searching by title, message content, folder, model provider, dates, etc.
 */
export const searchRouter = {
  /**
   * Search chats with advanced filtering
   *
   * Supports filtering by:
   * - query: Search in title and/or message content
   * - folderId: Filter by specific folder or uncategorized (null)
   * - pinnedOnly: Show only pinned chats
   * - providers: Filter by AI model providers (multi-select)
   * - modelIds: Filter by specific model IDs (multi-select)
   * - dateFrom/dateTo: Filter by creation date range
   * - searchInMessages: Include message content in search
   *
   * When searchInMessages is true, returns matching message snippets (up to 3 per chat)
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        folderId: ulidOptionalSchema,
        pinnedOnly: z.boolean().optional(),
        providers: z
          .array(z.enum(['openai', 'anthropic', 'google', 'groq', 'ollama', 'custom']))
          .optional(),
        modelIds: z.array(z.string()).optional(),
        dateFrom: z.coerce.date().optional(),
        dateTo: z.coerce.date().optional(),
        searchInMessages: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Normalize query: trim whitespace to prevent searching for empty/whitespace-only strings
      const normalizedQuery = input.query?.trim();

      const conditions = [eq(chats.userId, userId)];

      // Build search conditions for title and/or message content
      if (normalizedQuery) {
        if (input.searchInMessages) {
          // Search in both title and message content
          const { messages } = await import('@sambung-chat/db/schema/chat');
          conditions.push(
            sql`(${chats.title} ILIKE ${`%${normalizedQuery}%`} OR ${messages.content} ILIKE ${`%${normalizedQuery}%`})`
          );
        } else {
          // Search only in title
          conditions.push(sql`${chats.title} ILIKE ${`%${normalizedQuery}%`}`);
        }
      }

      if (input.folderId !== undefined) {
        if (input.folderId === null) {
          conditions.push(sql`${chats.folderId} IS NULL`);
        } else {
          conditions.push(eq(chats.folderId, input.folderId));
        }
      }

      if (input.pinnedOnly) {
        conditions.push(eq(chats.pinned, true));
      }

      // Add date range filter (input.dateFrom/dateTo are already Date objects from Zod coercion)
      if (input.dateFrom) {
        conditions.push(gte(chats.createdAt, input.dateFrom));
      }

      if (input.dateTo) {
        conditions.push(lte(chats.createdAt, input.dateTo));
      }

      // Build the query - join with models and/or messages tables as needed
      const needsModelJoin = input.providers !== undefined || input.modelIds !== undefined;
      const needsMessagesJoin = Boolean(input.searchInMessages && normalizedQuery);

      let query;
      if (needsModelJoin && needsMessagesJoin) {
        // Add providers filter (multi-select)
        if (Array.isArray(input.providers) && input.providers.length > 0) {
          conditions.push(inArray(models.provider, input.providers));
        }

        // Add modelIds filter (multi-select)
        if (Array.isArray(input.modelIds) && input.modelIds.length > 0) {
          conditions.push(inArray(models.id, input.modelIds));
        }

        // Join with both models and messages tables
        // Use DISTINCT ON to avoid duplicate chats when multiple messages match
        const { messages } = await import('@sambung-chat/db/schema/chat');
        query = db
          .selectDistinct({
            id: chats.id,
            userId: chats.userId,
            title: chats.title,
            modelId: chats.modelId,
            folderId: chats.folderId,
            pinned: chats.pinned,
            createdAt: chats.createdAt,
            updatedAt: chats.updatedAt,
          })
          .from(chats)
          .innerJoin(models, eq(chats.modelId, models.id))
          .innerJoin(messages, eq(chats.id, messages.chatId))
          .where(and(...conditions))
          .orderBy(desc(chats.pinned), desc(chats.updatedAt));
      } else if (needsModelJoin) {
        // Add providers filter (multi-select)
        if (Array.isArray(input.providers) && input.providers.length > 0) {
          conditions.push(inArray(models.provider, input.providers));
        }

        // Add modelIds filter (multi-select)
        if (Array.isArray(input.modelIds) && input.modelIds.length > 0) {
          conditions.push(inArray(models.id, input.modelIds));
        }

        query = db
          .select({
            id: chats.id,
            userId: chats.userId,
            title: chats.title,
            modelId: chats.modelId,
            folderId: chats.folderId,
            pinned: chats.pinned,
            createdAt: chats.createdAt,
            updatedAt: chats.updatedAt,
          })
          .from(chats)
          .innerJoin(models, eq(chats.modelId, models.id))
          .where(and(...conditions))
          .orderBy(desc(chats.pinned), desc(chats.updatedAt));
      } else if (needsMessagesJoin) {
        // Join only with messages table
        // Use DISTINCT ON to avoid duplicate chats when multiple messages match
        const { messages } = await import('@sambung-chat/db/schema/chat');
        query = db
          .selectDistinct({
            id: chats.id,
            userId: chats.userId,
            title: chats.title,
            modelId: chats.modelId,
            folderId: chats.folderId,
            pinned: chats.pinned,
            createdAt: chats.createdAt,
            updatedAt: chats.updatedAt,
          })
          .from(chats)
          .innerJoin(messages, eq(chats.id, messages.chatId))
          .where(and(...conditions))
          .orderBy(desc(chats.pinned), desc(chats.updatedAt));
      } else {
        // No joins needed
        query = db
          .select()
          .from(chats)
          .where(and(...conditions))
          .orderBy(desc(chats.pinned), desc(chats.updatedAt));
      }

      const results = await query;

      // If searching in messages and a query was provided, fetch matching message snippets
      let resultsWithSnippets = results;
      if (input.searchInMessages && normalizedQuery && results.length > 0) {
        const chatIds = results.map((r) => r.id);
        const { messages } = await import('@sambung-chat/db/schema/chat');

        // Get all matching messages for these chats
        const matchingMessages = await db
          .select({
            id: messages.id,
            chatId: messages.chatId,
            role: messages.role,
            content: messages.content,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(
            and(inArray(messages.chatId, chatIds), ilike(messages.content, `%${normalizedQuery}%`))
          )
          .orderBy(asc(messages.createdAt));

        // Group messages by chatId and limit to top 3 per chat
        const messagesByChat = new Map<string, typeof matchingMessages>();
        for (const msg of matchingMessages) {
          if (!messagesByChat.has(msg.chatId)) {
            messagesByChat.set(msg.chatId, []);
          }
          const chatMessages = messagesByChat.get(msg.chatId)!;
          // Limit to 3 matching messages per chat to avoid huge responses
          if (chatMessages.length < 3) {
            chatMessages.push(msg);
          }
        }

        // Attach matching messages to each chat result
        resultsWithSnippets = results.map((chat) => ({
          ...chat,
          matchingMessages: messagesByChat.get(chat.id) || [],
        }));
      }

      return resultsWithSnippets;
    }),
};
