import { db } from '@sambung-chat/db';
import { prompts } from '@sambung-chat/db/schema/prompt';
import { user } from '@sambung-chat/db/schema/auth';
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
        category: z
          .enum(['general', 'coding', 'writing', 'analysis', 'creative', 'business', 'custom'])
          .default('general'),
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
        category: z
          .enum(['general', 'coding', 'writing', 'analysis', 'creative', 'business', 'custom'])
          .optional(),
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

      // Delete prompt
      await db.delete(prompts).where(eq(prompts.id, input.id));

      return { success: true };
    }),

  // Search prompts with category and keyword filtering
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        category: z
          .enum(['general', 'coding', 'writing', 'analysis', 'creative', 'business', 'custom'])
          .optional(),
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

      // Build search conditions for name and content
      if (normalizedQuery) {
        conditions.push(
          sql`(${prompts.name} ILIKE ${`%${normalizedQuery}%`} OR ${prompts.content} ILIKE ${`%${normalizedQuery}%`})`
        );
      }

      // Filter by category
      if (input.category !== undefined) {
        conditions.push(eq(prompts.category, input.category));
      }

      // Filter by public status
      if (input.isPublic !== undefined) {
        conditions.push(eq(prompts.isPublic, input.isPublic));
      }

      // Add date range filter
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

  // Get all public prompts from all users
  getPublicTemplates: protectedProcedure
    .input(
      z.object({
        limit: z.coerce.number().min(1).max(100).default(20),
        offset: z.coerce.number().min(0).default(0),
        category: z
          .enum(['general', 'coding', 'writing', 'analysis', 'creative', 'business', 'custom'])
          .optional(),
        query: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      const { limit, offset, category, query } = input;

      // Normalize query: trim whitespace to prevent searching for empty/whitespace-only strings
      const normalizedQuery = query?.trim();

      // Build conditions for public prompts only
      const conditions = [eq(prompts.isPublic, true)];

      // Filter by category
      if (category !== undefined) {
        conditions.push(eq(prompts.category, category));
      }

      // Build search conditions for name and content
      if (normalizedQuery) {
        conditions.push(
          sql`(${prompts.name} ILIKE ${`%${normalizedQuery}%`} OR ${prompts.content} ILIKE ${`%${normalizedQuery}%`})`
        );
      }

      // Fetch public prompts with user information
      const results = await db
        .select({
          id: prompts.id,
          name: prompts.name,
          content: prompts.content,
          variables: prompts.variables,
          category: prompts.category,
          isPublic: prompts.isPublic,
          createdAt: prompts.createdAt,
          updatedAt: prompts.updatedAt,
          authorName: user.name,
        })
        .from(prompts)
        .innerJoin(user, eq(prompts.userId, user.id))
        .where(and(...conditions))
        .orderBy(desc(prompts.createdAt))
        .limit(limit)
        .offset(offset);

      return results;
    }),
};
