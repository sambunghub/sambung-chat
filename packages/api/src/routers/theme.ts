import { db } from '@sambung-chat/db';
import { theme } from '@sambung-chat/db/schema/theme';
import { eq, and, or, asc, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { ORPCError } from '@orpc/server';
import { protectedProcedure, withCsrfProtection } from '../index';
import { ulidSchema } from '../utils/validation';

// HSL color validation (format: "210 100% 50%")
const hslColorSchema = z
  .string()
  .regex(
    /^\d+\s+\d+%\s+\d+%$/,
    'Color must be in HSL format (e.g., "210 100% 50%")'
  );

// Theme schema for creating/updating themes
const themeInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  primary: hslColorSchema.optional(),
  secondary: hslColorSchema.optional(),
  background: hslColorSchema.optional(),
  foreground: hslColorSchema.optional(),
  muted: hslColorSchema.optional(),
  mutedForeground: hslColorSchema.optional(),
  accent: hslColorSchema.optional(),
  accentForeground: hslColorSchema.optional(),
  destructive: hslColorSchema.optional(),
  destructiveForeground: hslColorSchema.optional(),
  border: hslColorSchema.optional(),
  input: hslColorSchema.optional(),
  ring: hslColorSchema.optional(),
  radius: z.string().optional(),
});

// Default color values
const DEFAULT_COLORS = {
  primary: '210 100% 50%',
  secondary: '210 100% 45%',
  background: '0 0% 100%',
  foreground: '210 20% 10%',
  muted: '210 20% 90%',
  mutedForeground: '210 20% 40%',
  accent: '210 100% 50%',
  accentForeground: '0 0% 100%',
  destructive: '0 100% 50%',
  destructiveForeground: '0 0% 100%',
  border: '210 20% 85%',
  input: '210 20% 85%',
  ring: '210 100% 50%',
  radius: '0.5',
};

export const themeRouter = {
  // Get all themes (built-in themes + user's custom themes)
  getAllThemes: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    // Get built-in themes and user's custom themes
    const themes = await db
      .select()
      .from(theme)
      .where(or(eq(theme.userId, userId), isNull(theme.userId)))
      .orderBy(asc(theme.createdAt));

    return themes;
  }),

  // Get a single theme by ID
  getTheme: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const themeResults = await db
        .select()
        .from(theme)
        .where(
          and(
            eq(theme.id, input.id),
            or(eq(theme.userId, userId), isNull(theme.userId))
          )
        );

      if (themeResults.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Theme not found',
        });
      }

      return themeResults[0];
    }),

  // Create a new custom theme
  createTheme: protectedProcedure
    .use(withCsrfProtection)
    .input(themeInputSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Merge with defaults for any missing color values
      const themeData = {
        ...DEFAULT_COLORS,
        ...input,
      };

      const [newTheme] = await db
        .insert(theme)
        .values({
          userId,
          isBuiltIn: false,
          ...themeData,
        })
        .returning();

      return newTheme;
    }),

  // Update an existing custom theme
  updateTheme: protectedProcedure
    .use(withCsrfProtection)
    .input(
      z.object({
        id: ulidSchema,
        ...themeInputSchema.partial().shape,
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { id, ...data } = input;

      // First, verify theme exists and belongs to user
      const existingThemes = await db
        .select()
        .from(theme)
        .where(and(eq(theme.id, id), eq(theme.userId, userId)));

      if (existingThemes.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Theme not found or you do not have permission to modify it',
        });
      }

      const existingTheme = existingThemes[0];

      // Prevent modifying built-in themes
      if (existingTheme.isBuiltIn) {
        throw new ORPCError('FORBIDDEN', {
          message: 'Cannot modify built-in themes',
        });
      }

      // Update theme
      const updated = await db
        .update(theme)
        .set(data)
        .where(eq(theme.id, id))
        .returning();

      return updated[0];
    }),

  // Delete a custom theme
  deleteTheme: protectedProcedure
    .use(withCsrfProtection)
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // First, verify theme exists and belongs to user
      const existingThemes = await db
        .select()
        .from(theme)
        .where(and(eq(theme.id, input.id), eq(theme.userId, userId)));

      if (existingThemes.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Theme not found or you do not have permission to delete it',
        });
      }

      const existingTheme = existingThemes[0];

      // Prevent deleting built-in themes
      if (existingTheme.isBuiltIn) {
        throw new ORPCError('FORBIDDEN', {
          message: 'Cannot delete built-in themes',
        });
      }

      // Delete theme
      await db.delete(theme).where(eq(theme.id, input.id));

      return { success: true };
    }),
};
