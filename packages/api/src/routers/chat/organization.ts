import { db } from '@sambung-chat/db';
import { chats } from '@sambung-chat/db/schema/chat';
import { eq, and } from 'drizzle-orm';
import z from 'zod';
import { protectedProcedure, withCsrfProtection } from '../../index';
import { ulidSchema, ulidOptionalSchema } from '../../utils/validation';

export const organizationRouter = {
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

      if (results.length === 0 || !results[0]) {
        throw new Error('Chat not found');
      }

      return results[0];
    }),
};
