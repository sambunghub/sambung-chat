import { db } from '@sambung-chat/db';
import { models } from '@sambung-chat/db/schema/model';
import { eq, and, asc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { ORPCError } from '@orpc/server';
import { protectedProcedure } from '../index';
import { ulidSchema } from '../utils/validation';

// Provider enum for validation
const providerEnum = z.enum(['openai', 'anthropic', 'google', 'groq', 'ollama', 'custom']);

// Settings schema for model parameters
const modelSettingsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(1000000).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().min(0).max(100).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
});

export const modelRouter = {
  // Get all models for current user
  getAll: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    return await db
      .select()
      .from(models)
      .where(eq(models.userId, userId))
      .orderBy(asc(models.createdAt));
  }),

  // Get model by ID
  getById: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const modelResults = await db
        .select()
        .from(models)
        .where(and(eq(models.id, input.id), eq(models.userId, userId)));

      if (modelResults.length === 0) {
        return null;
      }

      return modelResults[0];
    }),

  // Get active model for current user
  getActive: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    const modelResults = await db
      .select()
      .from(models)
      .where(and(eq(models.userId, userId), eq(models.isActive, true)));

    if (modelResults.length === 0) {
      return null;
    }

    return modelResults[0];
  }),

  // Create new model
  create: protectedProcedure
    .input(
      z.object({
        provider: providerEnum,
        modelId: z.string().min(1).max(255),
        name: z.string().min(1).max(255),
        baseUrl: z.string().url().optional(),
        apiKeyId: ulidSchema.optional(),
        isActive: z.boolean().default(false),
        avatarUrl: z.string().url().optional(),
        settings: modelSettingsSchema.optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // If setting as active, deactivate all other models for this user
      if (input.isActive) {
        await db.update(models).set({ isActive: false }).where(eq(models.userId, userId));
      }

      const [model] = await db
        .insert(models)
        .values({
          userId,
          ...input,
        })
        .returning();

      return model;
    }),

  // Update model
  update: protectedProcedure
    .input(
      z.object({
        id: ulidSchema,
        name: z.string().min(1).max(255).optional(),
        baseUrl: z.string().url().optional(),
        apiKeyId: ulidSchema.optional(),
        isActive: z.boolean().optional(),
        avatarUrl: z.string().url().optional(),
        settings: modelSettingsSchema.optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { id, isActive, ...data } = input;

      // If setting as active, deactivate all other models for this user
      if (isActive) {
        await db
          .update(models)
          .set({ isActive: false })
          .where(and(eq(models.userId, userId), sql`${models.id} != ${id}`));
      }

      const results = await db
        .update(models)
        .set(data)
        .where(and(eq(models.id, id), eq(models.userId, userId)))
        .returning();

      if (results.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Model not found or you do not have permission to update it',
        });
      }

      return results[0];
    }),

  // Set model as active (deactivates others)
  setActive: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Verify ownership
      const modelResults = await db
        .select()
        .from(models)
        .where(and(eq(models.id, input.id), eq(models.userId, userId)));

      if (modelResults.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Model not found or you do not have permission to update it',
        });
      }

      // Use transaction for atomicity
      await db.transaction(async (tx) => {
        // Deactivate all models for this user
        await tx.update(models).set({ isActive: false }).where(eq(models.userId, userId));

        // Activate the selected model
        await tx.update(models).set({ isActive: true }).where(eq(models.id, input.id));
      });

      return { success: true };
    }),

  // Delete model
  delete: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Verify ownership before deletion
      const modelResults = await db
        .select()
        .from(models)
        .where(and(eq(models.id, input.id), eq(models.userId, userId)));

      if (modelResults.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Model not found or you do not have permission to delete it',
        });
      }

      // Delete the model
      await db.delete(models).where(eq(models.id, input.id));

      return { success: true };
    }),
};
