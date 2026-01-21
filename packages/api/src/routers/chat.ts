import { db } from '@sambung-chat/db';
import { chats } from '@sambung-chat/db/schema/chat';
import { messages } from '@sambung-chat/db/schema/chat';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import z from 'zod';
import { protectedProcedure, withCsrfProtection } from '../index';
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

  // Toggle pin status
  togglePin: protectedProcedure
    .use(withCsrfProtection)
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
    .use(withCsrfProtection)
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
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const conditions = [eq(chats.userId, userId)];

      if (input.query) {
        conditions.push(sql`${chats.title} ILIKE ${`%${input.query}%`}`);
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

      const results = await db
        .select()
        .from(chats)
        .where(and(...conditions))
        .orderBy(desc(chats.pinned), desc(chats.updatedAt));

      return results;
    }),
};
