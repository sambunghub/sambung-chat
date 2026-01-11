import { db } from '@sambung-chat/db';
import { chats } from '@sambung-chat/db/schema/chat';
import { messages } from '@sambung-chat/db/schema/chat';
import { eq, and, desc, asc } from 'drizzle-orm';
import z from 'zod';
import { protectedProcedure } from '../index';

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
    .input(z.object({ id: z.number() }))
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
        id: z.number(),
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
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      await db.delete(chats).where(and(eq(chats.id, input.id), eq(chats.userId, userId)));

      return { success: true };
    }),
};
