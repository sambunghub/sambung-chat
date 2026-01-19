// ============================================================================
// EXAMPLE SCHEMA - NOT FOR PRODUCTION USE
// ============================================================================
//
// This is an EXAMPLE schema to demonstrate database patterns.
// It lacks userId field for multi-user isolation.
//
// For production use:
// 1. Add userId field: userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
// 2. Use ULID for id instead of serial
// 3. Add indexes for better query performance
//
// See packages/api/src/routers/_example/todo.ts for example router usage.
// ============================================================================

import { pgTable, text, boolean, serial } from 'drizzle-orm/pg-core';

export const todo = pgTable('todo', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  completed: boolean('completed').default(false).notNull(),
});
