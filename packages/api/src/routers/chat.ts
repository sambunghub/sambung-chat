import { db } from '@sambung-chat/db';
import { chats } from '@sambung-chat/db/schema/chat';
import { messages } from '@sambung-chat/db/schema/chat';
import { models } from '@sambung-chat/db/schema/model';
import { eq, and, desc, asc, sql, gte, lte, inArray } from 'drizzle-orm';
import z from 'zod';
import { protectedProcedure } from '../index';
import { ulidSchema, ulidOptionalSchema } from '../utils/validation';

export const chatRouter = {
  // Get all chats for current user
  getAll: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    return await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));
  }),

  // Get chat by ID with messages
  getById: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Get chat
      const chatResults = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, input.id), eq(chats.userId, userId)));

      if (chatResults.length === 0) {
        return null;
      }

      const chat = chatResults[0];

      // Get messages for this chat
      const chatMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, input.id))
        .orderBy(asc(messages.createdAt));

      return {
        ...chat,
        messages: chatMessages,
      };
    }),

  // Create new chat
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).default('New Chat'),
        modelId: z.string().min(1),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const [chat] = await db
        .insert(chats)
        .values({
          userId,
          title: input.title,
          modelId: input.modelId,
        })
        .returning();

      return chat;
    }),

  // Update chat
  update: protectedProcedure
    .input(
      z.object({
        id: ulidSchema,
        title: z.string().min(1).optional(),
        modelId: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { id, ...data } = input;

      const results = await db
        .update(chats)
        .set(data)
        .where(and(eq(chats.id, id), eq(chats.userId, userId)))
        .returning();

      return results[0];
    }),

  // Delete chat
  delete: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      await db.delete(chats).where(and(eq(chats.id, input.id), eq(chats.userId, userId)));

      return { success: true };
    }),

  // Toggle pin status
  togglePin: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Get current pin status
      const chatResults = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, input.id), eq(chats.userId, userId)));

      if (chatResults.length === 0) {
        throw new Error('Chat not found');
      }

      const currentPinStatus = chatResults[0]?.pinned || false;

      // Toggle pin
      const results = await db
        .update(chats)
        .set({ pinned: !currentPinStatus })
        .where(and(eq(chats.id, input.id), eq(chats.userId, userId)))
        .returning();

      if (results.length === 0) {
        throw new Error('Failed to update chat');
      }

      return { ...results[0], pinned: !currentPinStatus };
    }),

  // Update chat folder
  updateFolder: protectedProcedure
    .input(z.object({ id: ulidSchema, folderId: ulidOptionalSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const results = await db
        .update(chats)
        .set({ folderId: input.folderId })
        .where(and(eq(chats.id, input.id), eq(chats.userId, userId)))
        .returning();

      return results[0];
    }),

  // Search chats
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        folderId: ulidOptionalSchema,
        pinnedOnly: z.boolean().optional(),
        providers: z.array(z.enum(['openai', 'anthropic', 'google', 'groq', 'ollama', 'custom'])).optional(),
        modelId: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        searchInMessages: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const conditions = [eq(chats.userId, userId)];

      // Build search conditions for title and/or message content
      if (input.query) {
        if (input.searchInMessages) {
          // Search in both title and message content
          conditions.push(
            sql`(${chats.title} ILIKE ${`%${input.query}%`} OR ${messages.content} ILIKE ${`%${input.query}%`})`
          );
        } else {
          // Search only in title
          conditions.push(sql`${chats.title} ILIKE ${`%${input.query}%`}`);
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

      // Add date range filter
      if (input.dateFrom) {
        conditions.push(gte(chats.createdAt, new Date(input.dateFrom)));
      }

      if (input.dateTo) {
        conditions.push(lte(chats.createdAt, new Date(input.dateTo)));
      }

      // Build the query - join with models and/or messages tables as needed
      const needsModelJoin = input.providers !== undefined || input.modelId !== undefined;
      const needsMessagesJoin = input.searchInMessages && input.query !== undefined;

      let query;
      if (needsModelJoin && needsMessagesJoin) {
        // Add providers filter (multi-select)
        if (input.providers !== undefined && input.providers.length > 0) {
          conditions.push(inArray(models.provider, input.providers));
        }

        // Add modelId filter
        if (input.modelId !== undefined) {
          conditions.push(eq(models.modelId, input.modelId));
        }

        // Join with both models and messages tables
        // Use DISTINCT ON to avoid duplicate chats when multiple messages match
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
        if (input.providers !== undefined && input.providers.length > 0) {
          conditions.push(inArray(models.provider, input.providers));
        }

        // Add modelId filter
        if (input.modelId !== undefined) {
          conditions.push(eq(models.modelId, input.modelId));
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
      if (input.searchInMessages && input.query && results.length > 0) {
        const chatIds = results.map((r) => r.id);

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
            and(
              sql`${messages.chatId} = ANY(${chatIds})`,
              sql`${messages.content} ILIKE ${`%${input.query}%`}`
            )
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
