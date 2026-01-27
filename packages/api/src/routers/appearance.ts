import { db } from '@sambung-chat/db';
import { appearanceSettings } from '@sambung-chat/db/schema/appearance-settings';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { ORPCError } from '@orpc/server';
import { protectedProcedure } from '../index';

// Font size validation (12-20px)
const fontSizeEnum = z.enum(['12', '13', '14', '15', '16', '17', '18', '19', '20']);

// Font family validation
const fontFamilyEnum = z.enum(['system-ui', 'sans-serif', 'monospace']);

// Message density validation
const messageDensityEnum = z.enum(['compact', 'comfortable', 'spacious']);

// Sidebar width validation (200-400px)
const sidebarWidthSchema = z
  .string()
  .regex(/^\d+$/)
  .transform((val) => parseInt(val, 10))
  .refine((val) => val >= 200 && val <= 400, {
    message: 'Sidebar width must be between 200 and 400 pixels',
  })
  .transform((val) => val.toString());

// Default settings values
const DEFAULT_SETTINGS = {
  fontSize: '16',
  fontFamily: 'system-ui',
  sidebarWidth: '280',
  messageDensity: 'comfortable',
  themeId: null,
};

export const appearanceRouter = {
  // Get user's appearance settings
  // Creates default settings if they don't exist
  getSettings: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    const settings = await db
      .select()
      .from(appearanceSettings)
      .where(eq(appearanceSettings.userId, userId))
      .limit(1);

    // If settings don't exist, create default settings
    if (settings.length === 0) {
      const [newSettings] = await db
        .insert(appearanceSettings)
        .values({
          userId,
          ...DEFAULT_SETTINGS,
        })
        .returning();

      return newSettings;
    }

    return settings[0];
  }),

  // Update user's appearance settings
  updateSettings: protectedProcedure
    .input(
      z.object({
        fontSize: fontSizeEnum.optional(),
        fontFamily: fontFamilyEnum.optional(),
        sidebarWidth: sidebarWidthSchema.optional(),
        messageDensity: messageDensityEnum.optional(),
        themeId: z.string().optional().nullable(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Check if settings exist
      const existing = await db
        .select()
        .from(appearanceSettings)
        .where(eq(appearanceSettings.userId, userId))
        .limit(1);

      // If settings don't exist, create them with the provided values
      if (existing.length === 0) {
        const [newSettings] = await db
          .insert(appearanceSettings)
          .values({
            userId,
            ...DEFAULT_SETTINGS,
            ...input,
          })
          .returning();

        return newSettings;
      }

      // Update existing settings
      const updated = await db
        .update(appearanceSettings)
        .set(input)
        .where(eq(appearanceSettings.userId, userId))
        .returning();

      if (updated.length === 0) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Appearance settings not found',
        });
      }

      return updated[0];
    }),

  // Reset user's appearance settings to defaults
  resetSettings: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    // Check if settings exist
    const existing = await db
      .select()
      .from(appearanceSettings)
      .where(eq(appearanceSettings.userId, userId))
      .limit(1);

    // If settings don't exist, create default settings
    if (existing.length === 0) {
      const [newSettings] = await db
        .insert(appearanceSettings)
        .values({
          userId,
          ...DEFAULT_SETTINGS,
        })
        .returning();

      return newSettings;
    }

    // Reset to defaults
    const reset = await db
      .update(appearanceSettings)
      .set(DEFAULT_SETTINGS)
      .where(eq(appearanceSettings.userId, userId))
      .returning();

    if (reset.length === 0) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Appearance settings not found',
      });
    }

    return reset[0];
  }),
};
