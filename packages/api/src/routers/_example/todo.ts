// ============================================================================
// EXAMPLE ROUTER - NOT FOR PRODUCTION USE
// ============================================================================
//
// This is an EXAMPLE router to demonstrate ORPC patterns.
// It uses publicProcedure (no authentication) for simplicity.
//
// For production use:
// 1. Use protectedProcedure instead of publicProcedure
// 2. Add userId field to database schema
// 3. Add ownership checks: where(eq(table.userId, context.session.user.id))
//
// See orpc-todo-reference.md for complete patterns.
// ============================================================================

import { db } from '@sambung-chat/db';
import { todo } from '@sambung-chat/db/schema/todo';
import { eq } from 'drizzle-orm';
import z from 'zod';

import { publicProcedure } from '../../index';

export const todoRouter = {
  getAll: publicProcedure.handler(async () => {
    return await db.select().from(todo);
  }),

  create: publicProcedure
    .input(z.object({ text: z.string().min(1) }))
    .handler(async ({ input }) => {
      return await db.insert(todo).values({
        text: input.text,
      });
    }),

  toggle: publicProcedure
    .input(z.object({ id: z.number(), completed: z.boolean() }))
    .handler(async ({ input }) => {
      return await db.update(todo).set({ completed: input.completed }).where(eq(todo.id, input.id));
    }),

  delete: publicProcedure.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    return await db.delete(todo).where(eq(todo.id, input.id));
  }),
};
