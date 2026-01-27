import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { appearanceSettings } from './appearance-settings';
import { generateULID } from '../utils/ulid';

export const theme = pgTable(
  'theme',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateULID()),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }), // Nullable for built-in themes
    name: text('name').notNull(), // Theme name (e.g., "Ocean Dark", "Forest Light")
    description: text('description'), // Optional description
    isBuiltIn: boolean('is_built_in').notNull().default(false), // Built-in themes don't have userId
    // Color fields - stored as HSL color strings for CSS variables
    primary: text('primary').notNull().default('210 100% 50%'), // Primary color (hsl values)
    secondary: text('secondary').notNull().default('210 100% 45%'), // Secondary color
    background: text('background').notNull().default('0 0% 100%'), // Background color
    foreground: text('foreground').notNull().default('210 20% 10%'), // Foreground/text color
    muted: text('muted').notNull().default('210 20% 90%'), // Muted background
    mutedForeground: text('muted_foreground').notNull().default('210 20% 40%'), // Muted text
    accent: text('accent').notNull().default('210 100% 50%'), // Accent color
    accentForeground: text('accent_foreground').notNull().default('0 0% 100%'), // Accent text
    destructive: text('destructive').notNull().default('0 100% 50%'), // Error/danger
    destructiveForeground: text('destructive_foreground').notNull().default('0 0% 100%'), // Error text
    border: text('border').notNull().default('210 20% 85%'), // Border color
    input: text('input').notNull().default('210 20% 85%'), // Input border
    ring: text('ring').notNull().default('210 100% 50%'), // Focus ring
    radius: text('radius').notNull().default('0.5'), // Border radius (rem)
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('theme_user_id_idx').on(table.userId),
    index('theme_is_built_in_idx').on(table.isBuiltIn),
  ]
);

export const themeRelations = relations(theme, ({ one, many }) => ({
  user: one(user, {
    fields: [theme.userId],
    references: [user.id],
  }),
  appearanceSettings: many(appearanceSettings),
}));
