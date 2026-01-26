import { db } from '@sambung-chat/db';
import { userPreferences } from '@sambung-chat/db/schema/user-preferences';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure } from '../index';

// Font size enum for validation
const fontSizeEnum = z.enum(['small', 'medium', 'large', 'extra-large']);

// Schema for updating user preferences
const updatePreferencesSchema = z.object({
  sidebarWidth: z.number().min(200).max(400).optional(),
  fontSize: fontSizeEnum.optional(),
  privacyMode: z.boolean().optional(),
});

export const userPreferencesRouter = {
  // Get user preferences (create with defaults if not exists)
  get: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    // Try to get existing preferences
    const results = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    if (results.length > 0) {
      return results[0];
    }

    // Create default preferences if not exists
    const [newPrefs] = await db
      .insert(userPreferences)
      .values({
        userId,
        sidebarWidth: 280,
        fontSize: 'medium',
        privacyMode: false,
      })
      .returning();

    return newPrefs;
  }),

  // Update user preferences
  update: protectedProcedure.input(updatePreferencesSchema).handler(async ({ input, context }) => {
    const userId = context.session.user.id;

    // Check if preferences exist
    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    if (existing.length === 0) {
      // Create with defaults + provided values
      const [newPrefs] = await db
        .insert(userPreferences)
        .values({
          userId,
          sidebarWidth: input.sidebarWidth ?? 280,
          fontSize: input.fontSize ?? 'medium',
          privacyMode: input.privacyMode ?? false,
        })
        .returning();

      return newPrefs;
    }

    // Update existing preferences
    const [updatedPrefs] = await db
      .update(userPreferences)
      .set({
        ...(input.sidebarWidth !== undefined && { sidebarWidth: input.sidebarWidth }),
        ...(input.fontSize !== undefined && { fontSize: input.fontSize }),
        ...(input.privacyMode !== undefined && { privacyMode: input.privacyMode }),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    return updatedPrefs;
  }),
};
