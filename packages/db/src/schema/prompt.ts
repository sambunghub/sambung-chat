import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, index, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { generateULID } from '../utils/ulid';

export const prompts = pgTable(
  'prompts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateULID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    content: text('content').notNull(),
    variables: jsonb('variables').$type<string[]>().default([]).notNull(),
    category: text('category').default('general'),
    isPublic: boolean('is_public').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('prompt_user_id_idx').on(table.userId),
    index('prompt_category_idx').on(table.category),
    index('prompt_is_public_idx').on(table.isPublic),
  ]
);

export const promptRelations = relations(prompts, ({ one }) => ({
  user: one(user, {
    fields: [prompts.userId],
    references: [user.id],
  }),
}));
