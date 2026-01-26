import { db } from '@sambung-chat/db';
import { prompts, promptVersions } from '@sambung-chat/db/schema/prompt';
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

      // Use transaction to ensure prompt and version are created atomically
      try {
        const [prompt] = await db.transaction(async (tx) => {
          // Create the prompt
          const [newPrompt] = await tx
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

          // Create initial version entry
          await tx.insert(promptVersions).values({
            promptId: newPrompt.id,
            userId: userId,
            name: newPrompt.name,
            content: newPrompt.content,
            variables: newPrompt.variables,
            category: newPrompt.category,
            versionNumber: 1,
            changeReason: 'Initial version',
          });

          return newPrompt;
        });

        return prompt;
      } catch (error) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: `Failed to create prompt: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
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
        changeReason: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { id, changeReason, ...data } = input;

      // Use transaction to ensure version entry and prompt update are atomic
      try {
        const [updatedPrompt] = await db.transaction(async (tx) => {
          // Fetch current prompt state before update
          const currentPromptResults = await tx
            .select()
            .from(prompts)
            .where(and(eq(prompts.id, id), eq(prompts.userId, userId)));

          if (currentPromptResults.length === 0) {
            throw new ORPCError('NOT_FOUND', {
              message: 'Prompt not found or you do not have permission to update it',
            });
          }

          const currentPrompt = currentPromptResults[0];

          // Get the next version number
          const versionResults = await tx
            .select({ versionNumber: promptVersions.versionNumber })
            .from(promptVersions)
            .where(eq(promptVersions.promptId, id))
            .orderBy(desc(promptVersions.versionNumber))
            .limit(1);

          const nextVersionNumber = versionResults.length > 0 ? versionResults[0].versionNumber + 1 : 1;

          // Create version entry with old values
          await tx.insert(promptVersions).values({
            promptId: currentPrompt.id,
            userId: currentPrompt.userId,
            name: currentPrompt.name,
            content: currentPrompt.content,
            variables: currentPrompt.variables,
            category: currentPrompt.category,
            versionNumber: nextVersionNumber,
            changeReason: changeReason || 'Updated prompt',
          });

          // Update the prompt with new values
          const results = await tx
            .update(prompts)
            .set(data)
            .where(eq(prompts.id, id))
            .returning();

          return results;
        });

        return updatedPrompt;
      } catch (error) {
        if (error instanceof ORPCError) {
          throw error;
        }
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: `Failed to update prompt: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
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

  // Duplicate a public prompt to user's private collection
  duplicateFromPublic: protectedProcedure
    .use(withCsrfProtection)
    .input(
      z.object({
        publicPromptId: ulidSchema,
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { publicPromptId } = input;

      // Fetch the public prompt
      const publicPromptResults = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, publicPromptId), eq(prompts.isPublic, true)));

      if (publicPromptResults.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Public prompt not found',
        });
      }

      const publicPrompt = publicPromptResults[0];

      // Check if user already has a prompt with the same name
      const existingPrompts = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.userId, userId), eq(prompts.name, publicPrompt.name)));

      // Generate unique name by adding (Copy) suffix if needed
      let finalName = publicPrompt.name;
      if (existingPrompts.length > 0) {
        // Check if name already ends with (Copy)
        if (finalName.endsWith(' (Copy)')) {
          // Already has (Copy) suffix, add number
          let counter = 2;
          let uniqueNameFound = false;
          while (!uniqueNameFound) {
            const testName = `${finalName} ${counter}`;
            const nameCheckResults = await db
              .select()
              .from(prompts)
              .where(and(eq(prompts.userId, userId), eq(prompts.name, testName)));

            if (nameCheckResults.length === 0) {
              finalName = testName;
              uniqueNameFound = true;
            } else {
              counter++;
            }
          }
        } else {
          // No (Copy) suffix, add it
          finalName = `${finalName} (Copy)`;
        }
      }

      // Create new prompt with current user as owner
      const [newPrompt] = await db
        .insert(prompts)
        .values({
          userId,
          name: finalName,
          content: publicPrompt.content,
          variables: publicPrompt.variables,
          category: publicPrompt.category,
          isPublic: false, // Always set to false for duplicated prompts
        })
        .returning();

      return newPrompt;
    }),

  // Export all user's prompts as JSON
  exportPrompts: protectedProcedure
    .input(
      z.object({
        category: z
          .enum(['general', 'coding', 'writing', 'analysis', 'creative', 'business', 'custom'])
          .optional(),
        dateFrom: z.coerce.date().optional(),
        dateTo: z.coerce.date().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { category, dateFrom, dateTo } = input;

      // Build conditions
      const conditions = [eq(prompts.userId, userId)];

      // Filter by category
      if (category !== undefined) {
        conditions.push(eq(prompts.category, category));
      }

      // Add date range filter
      if (dateFrom) {
        conditions.push(gte(prompts.createdAt, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(prompts.createdAt, dateTo));
      }

      // Fetch prompts with filters
      const userPrompts = await db
        .select({
          id: prompts.id,
          name: prompts.name,
          content: prompts.content,
          variables: prompts.variables,
          category: prompts.category,
          isPublic: prompts.isPublic,
          createdAt: prompts.createdAt,
          updatedAt: prompts.updatedAt,
        })
        .from(prompts)
        .where(and(...conditions))
        .orderBy(desc(prompts.updatedAt));

      return userPrompts;
    }),

  // Import prompts from JSON
  importPrompts: protectedProcedure
    .use(withCsrfProtection)
    .input(
      z.object({
        prompts: z.array(
          z.object({
            id: ulidSchema.optional(), // Optional, will be ignored
            name: z.string().min(1).max(200),
            content: z.string().min(1),
            variables: z.array(z.string()).default([]),
            category: z
              .enum(['general', 'coding', 'writing', 'analysis', 'creative', 'business', 'custom'])
              .default('general'),
            isPublic: z.boolean().default(false),
            createdAt: z.coerce.date().optional(), // Optional, will be ignored
            updatedAt: z.coerce.date().optional(), // Optional, will be ignored
          })
        ),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { prompts: promptsToImport } = input;

      // Use transaction for atomicity (all or nothing)
      try {
        const createdPrompts = await db.transaction(async (tx) => {
          const results: Array<typeof prompts.$inferInsert> = [];

          for (const importedPrompt of promptsToImport) {
            // Check if user already has a prompt with the same name
            const existingPrompts = await tx
              .select()
              .from(prompts)
              .where(and(eq(prompts.userId, userId), eq(prompts.name, importedPrompt.name)));

            // Generate unique name by adding suffix if needed
            let finalName = importedPrompt.name;
            if (existingPrompts.length > 0) {
              let counter = 1;
              let uniqueNameFound = false;
              while (!uniqueNameFound) {
                const testName = importedPrompt.name.includes(' (')
                  ? importedPrompt.name.split(' (')[0] + ` (${counter})`
                  : `${importedPrompt.name} (${counter})`;

                const nameCheckResults = await tx
                  .select()
                  .from(prompts)
                  .where(and(eq(prompts.userId, userId), eq(prompts.name, testName)));

                if (nameCheckResults.length === 0) {
                  finalName = testName;
                  uniqueNameFound = true;
                } else {
                  counter++;
                }
              }
            }

            // Create new prompt with current user as owner
            const [newPrompt] = await tx
              .insert(prompts)
              .values({
                userId,
                name: finalName,
                content: importedPrompt.content,
                variables: importedPrompt.variables,
                category: importedPrompt.category,
                isPublic: importedPrompt.isPublic,
              })
              .returning();

            results.push(newPrompt);
          }

          return results;
        });

        // Transaction succeeded
        return {
          success: true,
          importedCount: createdPrompts.length,
          prompts: createdPrompts,
        };
      } catch (error) {
        // Transaction failed, rollback occurred
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: `Failed to import prompts: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),
};
