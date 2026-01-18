import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { generateULID } from '../utils/ulid';

export const apiKeys = pgTable(
  'api_keys',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateULID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(), // "openai" | "anthropic" | "google" | "groq" | "ollama"
    encryptedKey: text('encrypted_key').notNull(), // AES-256 encrypted
    keyLast4: text('key_last4').notNull(), // Last 4 chars for identification
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('api_key_user_id_idx').on(table.userId),
    index('api_key_provider_idx').on(table.provider),
  ]
);

export const apiKeyRelations = relations(apiKeys, ({ one }) => ({
  user: one(user, {
    fields: [apiKeys.userId],
    references: [user.id],
  }),
}));
