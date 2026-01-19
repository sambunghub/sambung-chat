# packages/db - Database Schemas & Drizzle ORM

Database schemas and migrations for SambungChat using Drizzle ORM + PostgreSQL.

---

## 🚨 MANDATORY PRE-BUILD CHECKLIST

**BEFORE doing any build, YOU MUST do this first:**

```bash
# Step 1: Type check
bun run check

# Step 2: If there are errors, READ and FIX those errors

# Step 3: ONLY after type check is clean, you may build
bun run build
```

**RULE: If type check fails, DO NOT proceed to build!**

---

## Setup & Run

```bash
# Generate migration from schema changes
bun run db:generate

# Push schema directly to database (dev only)
bun run db:push

# Open Drizzle Studio (database GUI)
bun run db:studio
```

---

## Structure

```
packages/db/
├── src/
│   └── schema/
│       ├── user.ts          # User schema (from Better Auth)
│       ├── chat.ts          # Chat schema
│       ├── message.ts       # Message schema
│       ├── prompt.ts        # Prompt schema
│       ├── api-keys.ts      # API keys schema
│       └── index.ts         # Schema export
├── drizzle/
│   └── migrations/          # Migration files
└── package.json
```

---

## Schema Pattern

```typescript
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
```

---

## Migration Workflow

1. **Create/Edit Schema:** Add/modify schema files in `src/schema/`
2. **Generate Migration:** `bun run db:generate`
3. **Apply Migration:** `bun run db:push` (dev) or run migration (prod)
4. **Type Check:** `bun run check` to verify types

---

## Common Gotchas

- **NEVER** edit migration files manually
- **ALWAYS** use `drizzle-orm` types for type safety
- **NEVER** run `db:push` in production (use migrations instead)

---

## Pre-PR Checklist

- [ ] `bun run check` passes
- [ ] Schema changes followed by `db:generate`
- [ ] Migration tested locally
- [ ] Types are properly exported
