import { db } from '@sambung-chat/db';
import { folders, chats } from '@sambung-chat/db/schema/chat';
import { eq, and, asc, sql } from 'drizzle-orm';
import z from 'zod';
import { ORPCError } from '@orpc/server';
import { protectedProcedure } from '../index';
import { ulidSchema } from '../utils/validation';

export const folderRouter = {
  // Get all folders for current user
  getAll: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    return await db
      .select()
      .from(folders)
      .where(eq(folders.userId, userId))
      .orderBy(asc(folders.createdAt));
  }),

  // Get folder by ID with chat count
  getById: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const folderResults = await db
        .select()
        .from(folders)
        .where(and(eq(folders.id, input.id), eq(folders.userId, userId)));

      if (folderResults.length === 0) {
        return null;
      }

      const folder = folderResults[0];

      // Count chats in this folder
      const chatCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(chats)
        .where(eq(chats.folderId, input.id));

      return {
        ...folder,
        chatCount: chatCount[0]?.count || 0,
      };
    }),

  // Create new folder
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const [folder] = await db
        .insert(folders)
        .values({
          userId,
          name: input.name,
        })
        .returning();

      return folder;
    }),

  // Update folder
  update: protectedProcedure
    .input(
      z.object({
        id: ulidSchema,
        name: z.string().min(1).max(100).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { id, ...data } = input;

      const results = await db
        .update(folders)
        .set(data)
        .where(and(eq(folders.id, id), eq(folders.userId, userId)))
        .returning();

      return results[0];
    }),

  // Delete folder
  delete: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // First, verify folder ownership before any operations
      const folderResults = await db
        .select()
        .from(folders)
        .where(and(eq(folders.id, input.id), eq(folders.userId, userId)));

      if (folderResults.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Folder not found or you do not have permission to delete it',
        });
      }

      // Use transaction for atomicity
      await db.transaction(async (tx) => {
        // Unassign chats from this folder
        await tx.update(chats).set({ folderId: null }).where(eq(chats.folderId, input.id));

        // Delete folder
        await tx.delete(folders).where(eq(folders.id, input.id));
      });

      return { success: true };
    }),
};
