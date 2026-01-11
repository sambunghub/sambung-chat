import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, index, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const chats = pgTable(
  'chats',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    modelId: text('model_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('chat_user_id_idx').on(table.userId),
    index('chat_updated_at_idx').on(table.updatedAt),
  ]
);

export const messages = pgTable(
  'messages',
  {
    id: serial('id').primaryKey(),
    chatId: serial('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // "user" | "assistant" | "system"
    content: text('content').notNull(),
    metadata: jsonb('metadata').$type<{
      model?: string;
      tokens?: number;
      finishReason?: string;
    }>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('message_chat_id_idx').on(table.chatId),
    index('message_created_at_idx').on(table.createdAt),
  ]
);

export const chatRelations = relations(chats, ({ one, many }) => ({
  user: one(user, {
    fields: [chats.userId],
    references: [user.id],
  }),
  messages: many(messages),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));
