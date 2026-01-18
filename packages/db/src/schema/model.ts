import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, index, boolean, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { apiKeys } from './api-key';
import { generateULID } from '../utils/ulid';

export const models = pgTable(
  'models',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateULID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(), // "openai" | "anthropic" | "google" | "groq" | "ollama" | "custom"
    modelId: text('model_id').notNull(), // "gpt-4o" | "claude-3-5-sonnet-20241022" | etc.
    name: text('name').notNull(), // Display name: "GPT-4o", "Claude 3.5 Sonnet"
    baseUrl: text('base_url'), // Optional custom URL for OpenAI-compatible APIs
    apiKeyId: text('api_key_id').references(() => apiKeys.id, { onDelete: 'set null' }), // Reference to encrypted API key
    isActive: boolean('is_active').notNull().default(false), // Default model flag (only one per user should be true)
    avatarUrl: text('avatar_url'), // Optional avatar/icon URL
    settings: jsonb('settings').$type<{
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      topK?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
    }>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('model_user_id_idx').on(table.userId),
    index('model_provider_idx').on(table.provider),
    index('model_is_active_idx').on(table.isActive),
  ]
);

export const modelRelations = relations(models, ({ one }) => ({
  user: one(user, {
    fields: [models.userId],
    references: [user.id],
  }),
  apiKey: one(apiKeys, {
    fields: [models.apiKeyId],
    references: [apiKeys.id],
  }),
}));
