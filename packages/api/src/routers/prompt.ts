import { db } from '@sambung-chat/db';
import { prompts } from '@sambung-chat/db/schema/prompt';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import z from 'zod';
import { ORPCError } from '@orpc/server';
import { protectedProcedure, withCsrfProtection } from '../index';
import { ulidSchema } from '../utils/validation';

export const promptRouter = {
  // Get all prompts for current user
  getAll: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    return await db
      .select()
      .from(prompts)
      .where(eq(prompts.userId, userId))
      .orderBy(desc(prompts.createdAt));
  }),

  // Get prompt by ID with ownership validation
  getById: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const promptResults = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, input.id), eq(prompts.userId, userId)));

      if (promptResults.length === 0) {
        return null;
      }

      return promptResults[0];
    }),

  // Create new prompt
  create: protectedProcedure
    .use(withCsrfProtection)
    .input(
      z.object({
        name: z.string().min(1).max(200),
        content: z.string().min(1),
        variables: z.array(z.string()).default([]),
        category: z.string().default('general'),
        isPublic: z.boolean().default(false),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const [prompt] = await db
        .insert(prompts)
        .values({
          userId,
          name: input.name,
          content: input.content,
          variables: input.variables,
          category: input.category,
          isPublic: input.isPublic,
        })
        .returning();

      return prompt;
    }),

  // Update prompt
  update: protectedProcedure
    .use(withCsrfProtection)
    .input(
      z.object({
        id: ulidSchema,
        name: z.string().min(1).max(200).optional(),
        content: z.string().min(1).optional(),
        variables: z.array(z.string()).optional(),
        category: z.string().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { id, ...data } = input;

      const results = await db
        .update(prompts)
        .set(data)
        .where(and(eq(prompts.id, id), eq(prompts.userId, userId)))
        .returning();

      if (results.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Prompt not found or you do not have permission to update it',
        });
      }

      return results[0];
    }),

  // Delete prompt
  delete: protectedProcedure
    .use(withCsrfProtection)
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // First, verify prompt ownership before deletion
      const promptResults = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, input.id), eq(prompts.userId, userId)));

      if (promptResults.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Prompt not found or you do not have permission to delete it',
        });
      }

      await db.delete(prompts).where(eq(prompts.id, input.id));

      return { success: true };
    }),

  // Search prompts with filters
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        category: z.string().optional(),
        isPublic: z.boolean().optional(),
        dateFrom: z.coerce.date().optional(),
        dateTo: z.coerce.date().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Normalize query: trim whitespace to prevent searching for empty/whitespace-only strings
      const normalizedQuery = input.query?.trim();

      const conditions = [eq(prompts.userId, userId)];

      // Build search conditions for name and/or content
      if (normalizedQuery) {
        conditions.push(
          sql`(${prompts.name} ILIKE ${`%${normalizedQuery}%`} OR ${prompts.content} ILIKE ${`%${normalizedQuery}%`})`
        );
      }

      if (input.category !== undefined) {
        conditions.push(eq(prompts.category, input.category));
      }

      if (input.isPublic !== undefined) {
        conditions.push(eq(prompts.isPublic, input.isPublic));
      }

      if (input.dateFrom) {
        conditions.push(gte(prompts.createdAt, input.dateFrom));
      }

      if (input.dateTo) {
        conditions.push(lte(prompts.createdAt, input.dateTo));
      }

      const results = await db
        .select()
        .from(prompts)
        .where(and(...conditions))
        .orderBy(desc(prompts.updatedAt));

      return results;
    }),
};
