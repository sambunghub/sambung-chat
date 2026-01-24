import { db } from '@sambung-chat/db';
import { chats, messages } from '@sambung-chat/db/schema/chat';
import { eq, and, desc, asc } from 'drizzle-orm';
import z from 'zod';
import { protectedProcedure, withCsrfProtection, o } from '../../index';
import { ulidSchema } from '../../utils/validation';
import { cacheHeadersMiddleware, CACHE_DURATIONS } from '../../middleware/cache-headers';

/**
 * CRUD Router for Chat Operations
 *
 * Provides basic Create, Read, Update, Delete operations for chat entities.
 * These procedures handle the fundamental chat management operations.
 */
export const crudRouter = {
  // Get all chats for current user
  getAll: protectedProcedure
    .use(cacheHeadersMiddleware(o)(CACHE_DURATIONS.SHORT))
    .handler(async ({ context }) => {
      const userId = context.session.user.id;
      return await db
        .select()
        .from(chats)
        .where(eq(chats.userId, userId))
        .orderBy(desc(chats.updatedAt));
    }),

  // Get chat by ID with messages
  getById: protectedProcedure
    .use(cacheHeadersMiddleware(o)(CACHE_DURATIONS.SHORT))
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
    .use(withCsrfProtection)
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
    .use(withCsrfProtection)
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

      if (results.length === 0 || !results[0]) {
        throw new Error('Chat not found');
      }

      return results[0];
    }),

  // Delete chat
  delete: protectedProcedure
    .use(withCsrfProtection)
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      await db.delete(chats).where(and(eq(chats.id, input.id), eq(chats.userId, userId)));

      return { success: true };
    }),
};
