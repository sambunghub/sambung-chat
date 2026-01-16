import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, index, jsonb, boolean } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { generateULID } from '../utils/ulid';

export const folders = pgTable(
  'folders',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateULID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('folder_user_id_idx').on(table.userId)]
);

export const chats = pgTable(
  'chats',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateULID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    modelId: text('model_id').notNull(),
    folderId: text('folder_id').references(() => folders.id, { onDelete: 'set null' }),
    pinned: boolean('pinned').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('chat_user_id_idx').on(table.userId),
    index('chat_updated_at_idx').on(table.updatedAt),
    index('chat_pinned_idx').on(table.pinned),
    index('chat_folder_id_idx').on(table.folderId),
  ]
);

export const messages = pgTable(
  'messages',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateULID()),
    chatId: text('chat_id')
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

export const folderRelations = relations(folders, ({ one, many }) => ({
  user: one(user, {
    fields: [folders.userId],
    references: [user.id],
  }),
  chats: many(chats),
}));

export const chatRelations = relations(chats, ({ one, many }) => ({
  user: one(user, {
    fields: [chats.userId],
    references: [user.id],
  }),
  folder: one(folders, {
    fields: [chats.folderId],
    references: [folders.id],
  }),
  messages: many(messages),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));
