import { db } from '@sambung-chat/db';
import { chats } from '@sambung-chat/db/schema/chat';
import { messages } from '@sambung-chat/db/schema/chat';
import { eq, and, asc } from 'drizzle-orm';
import z from 'zod';
import { protectedProcedure } from '../index';
import { ulidSchema } from '../utils/validation';

export const messageRouter = {
  // Get messages by chat ID
  getByChatId: protectedProcedure
    .input(z.object({ chatId: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Verify chat belongs to user
      const chatResults = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, input.chatId), eq(chats.userId, userId)));

      if (chatResults.length === 0) {
        return [];
      }

      // Get messages
      return await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, input.chatId))
        .orderBy(asc(messages.createdAt));
    }),

  // Create message
  create: protectedProcedure
    .input(
      z.object({
        chatId: ulidSchema,
        content: z.string().min(1),
        role: z.enum(['user', 'assistant']).default('user'),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Verify chat belongs to user
      const chatResults = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, input.chatId), eq(chats.userId, userId)));

      if (chatResults.length === 0) {
        throw new Error('Chat not found');
      }

      // Create message
      const [message] = await db
        .insert(messages)
        .values({
          chatId: input.chatId,
          role: input.role,
          content: input.content,
        })
        .returning();

      return message;
    }),

  // Delete message
  delete: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Get message to verify chat ownership
      const messageResults = await db
        .select({
          messageId: messages.id,
          chatId: messages.chatId,
        })
        .from(messages)
        .where(eq(messages.id, input.id));

      const message = messageResults[0];

      if (!message) {
        return { success: false };
      }

      // Verify chat belongs to user
      const chatResults = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, message.chatId), eq(chats.userId, userId)));

      if (chatResults.length === 0) {
        return { success: false };
      }

      // Delete message
      await db.delete(messages).where(eq(messages.id, input.id));

      return { success: true };
    }),
};
