import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { theme } from './theme';
import { generateULID } from '../utils/ulid';

export const appearanceSettings = pgTable(
  'appearance_settings',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateULID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    fontSize: text('font_size').notNull().default('16'), // Font size in pixels (12-20)
    fontFamily: text('font_family').notNull().default('system-ui'), // "system-ui" | "sans-serif" | "monospace"
    sidebarWidth: text('sidebar_width').notNull().default('280'), // Width in pixels
    messageDensity: text('message_density').notNull().default('comfortable'), // "compact" | "comfortable" | "spacious"
    themeId: text('theme_id').references(() => theme.id, { onDelete: 'set null' }), // Reference to custom theme (null = default theme)
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('appearance_settings_user_id_idx').on(table.userId)]
);

export const appearanceSettingsRelations = relations(appearanceSettings, ({ one }) => ({
  user: one(user, {
    fields: [appearanceSettings.userId],
    references: [user.id],
  }),
  theme: one(theme, {
    fields: [appearanceSettings.themeId],
    references: [theme.id],
  }),
}));
