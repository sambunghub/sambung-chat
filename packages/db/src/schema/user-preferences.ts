import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, index, boolean, integer } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { generateULID } from '../utils/ulid';

/**
 * User preferences table for UI customization
 * Stores one-to-one preferences per user
 */
export const userPreferences = pgTable(
  'user_preferences',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateULID()),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),

    // Sidebar settings
    sidebarWidth: integer('sidebar_width').notNull().default(280), // 200-400px range

    // Font size settings
    fontSize: text('font_size').notNull().default('medium'), // "small" | "medium" | "large" | "extra-large"

    // Privacy mode - hides message content in sidebar/chat list
    privacyMode: boolean('privacy_mode').notNull().default(false),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('user_preferences_user_id_idx').on(table.userId)]
);

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(user, {
    fields: [userPreferences.userId],
    references: [user.id],
  }),
}));
