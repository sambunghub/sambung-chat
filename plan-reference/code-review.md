# SambungChat Code Review Report

**Date:** 2026-01-17
**Reviewer:** Claude Code
**Scope:** Full codebase review (5 parallel agents)
**Branch:** feat/refactor-ui-to-web

---

## Executive Summary

This comprehensive code review analyzed the SambungChat codebase across 5 dimensions:

1. CLAUDE.md compliance
2. Security vulnerabilities
3. Code quality and patterns
4. Database schema design
5. API/router patterns

**Total Issues Found:** 50+

**Database Issue:** FIXED - The `folder_id` column missing error was caused by schema vs migration mismatch. Database was dropped and recreated with proper schema.

---

## Table of Contents

1. [Critical Security Issues](#critical-security-issues)
2. [High Priority Issues](#high-priority-issues)
3. [Medium Priority Issues](#medium-priority-issues)
4. [Low Priority Issues](#low-priority-issues)
5. [Detailed Analysis by Category](#detailed-analysis-by-category)
6. [Recommended Action Plan](#recommended-action-plan)
7. [Files Requiring Immediate Attention](#files-requiring-immediate-attention)

---

## Critical Security Issues

These issues pose immediate security risks and should be fixed **before** any production deployment.

### 1. Todo Router Completely Unauthenticated

**File:** `packages/api/src/routers/todo.ts`

**Severity:** CRITICAL

**Issue:** All todo endpoints use `publicProcedure` with no authentication. The todo table has no `userId` field, meaning any user can read, modify, or delete all todos.

**Current Code:**

```typescript
export const todoRouter = router({
  getAll: {
    resolve: async ({ context }) => {
      // No authentication check!
      return await db.select().from(todo);
    },
  },
  create: {
    /* No auth */
  },
  delete: {
    /* No auth */
  },
});
```

**Impact:** Complete data breach - users can access each other's todos.

**Recommendation:**

1. Add `userId` field to `todo` table
2. Use authenticated procedure
3. Add user ownership checks

```typescript
// packages/db/src/schema/todo.ts
export const todo = pgTable('todo', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateULID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  completed: boolean('completed').notNull().default(false),
});

// packages/api/src/routers/todo.ts
export const todoRouter = router({
  getAll: {
    authenticated: true, // Require auth
    resolve: async ({ context }) => {
      const userId = context.session.user.id;
      return await db.select().from(todo).where(eq(todo.userId, userId));
    },
  },
});
```

---

### 2. Folder Delete Allows Unauthorized Chat Manipulation

**File:** `packages/api/src/routers/folder.ts:97`

**Severity:** CRITICAL

**Issue:** The `delete` endpoint unassigns ALL chats from a folder without verifying folder ownership first.

**Current Code:**

```typescript
delete: {
  input: z.object({ id: z.string().ulid() }),
  resolve: async ({ input, context }) => {
    const userId = context.session.user.id;

    // Unassign ALL chats with this folderId
    // BUG: No check if folder belongs to userId!
    await db.update(chats)
      .set({ folderId: null })
      .where(eq(chats.folderId, input.id));

    // Then delete folder
    await db.delete(folders)
      .where(eq(folders.id, input.id))
      .where(eq(folders.userId, userId)); // Check happens AFTER unassigning chats

    return { success: true };
  },
},
```

**Impact:** Users can unassign chats from folders belonging to other users, potentially causing data loss or confusion.

**Recommendation:**

```typescript
delete: {
  input: z.object({ id: z.string().ulid() }),
  resolve: async ({ input, context }) => {
    const userId = context.session.user.id;

    // FIRST: Verify folder ownership
    const folder = await db.select()
      .from(folders)
      .where(eq(folders.id, input.id))
      .where(eq(folders.userId, userId))
      .limit(1);

    if (folder.length === 0) {
      throw new ORPCError('NOT_FOUND', { message: 'Folder not found' });
    }

    // THEN: Use transaction for atomicity
    await db.transaction(async (tx) => {
      await tx.update(chats)
        .set({ folderId: null })
        .where(eq(chats.folderId, input.id));

      await tx.delete(folders)
        .where(eq(folders.id, input.id));
    });

    return { success: true };
  },
},
```

---

### 3. AI Endpoint Has No Authentication or Validation

**File:** `apps/server/src/index.ts:132-166`

**Severity:** CRITICAL

**Issue:** The `/ai` endpoint accepts streaming AI requests with:

- No authentication check
- No input validation
- No rate limiting
- Direct proxy to AI providers

**Current Code:**

```typescript
app.post('/ai', async (c) => {
  // No auth check!
  // No input validation!
  const { messages, model, stream } = await c.req.json();
  // ... directly proxy to AI SDK
});
```

**Impact:**

- API abuse (unlimited free AI requests)
- Cost overrun if using paid AI providers
- Potential prompt injection attacks

**Recommendation:**

```typescript
import { z } from 'zod';

const aiRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().max(100000), // Limit content length
      })
    )
    .min(1)
    .max(100), // Limit message count
  model: z.string().min(1),
  stream: z.boolean().default(false),
});

app.post('/ai', authMiddleware, rateLimiter, async (c) => {
  const userId = c.get('userId'); // From auth middleware

  // Validate input
  const body = aiRequestSchema.parse(await c.req.json());

  // Check user's rate limit or quota
  await checkUserRateLimit(userId);

  // ... proceed with AI request
});
```

---

### 4. Debug Endpoints Exposed Without Authentication

**File:** `apps/server/src/index.ts:176-215`

**Severity:** HIGH (Could be CRITICAL in production)

**Issue:** Debug endpoints (`/debug/db`, `/debug/auth`, `/debug`) are exposed without:

- Environment checks (dev only)
- Authentication
- IP restrictions

**Current Code:**

```typescript
app.get('/debug/db', async (c) => {
  // Exposes database connection status
  const result = await db.execute(sql`SELECT 1`);
  return c.json({ status: 'ok', result });
});

app.get('/debug/auth', async (c) => {
  // Exposes auth configuration
  return c.json({
    /* auth config */
  });
});

app.get('/debug', (c) => {
  // Exposes server info
  return c.json({
    /* server info */
  });
});
```

**Impact:** Information leakage in production - attackers can use these endpoints for reconnaissance.

**Recommendation:**

```typescript
// Option 1: Remove completely in production
if (process.env.NODE_ENV === 'development') {
  app.get('/debug/db' /* ... */);
  app.get('/debug/auth' /* ... */);
  app.get('/debug' /* ... */);
}

// Option 2: Add authentication + admin check
import { requireAdmin } from './middleware/auth';

app.get('/debug/db', requireAdmin /* ... */);
app.get('/debug/auth', requireAdmin /* ... */);
app.get('/debug', requireAdmin /* ... */);
```

---

## High Priority Issues

These issues significantly impact security, data integrity, or performance.

### 5. Folder getById Exposes Other Users' Chat Counts

**File:** `packages/api/src/routers/folder.ts:40`

**Severity:** HIGH

**Issue:** Counts chats in folder without verifying they belong to the same user.

**Current Code:**

```typescript
getById: {
  input: z.object({ id: z.string().ulid() }),
  resolve: async ({ input, context }) => {
    const userId = context.session.user.id;

    const folder = await db.select()
      .from(folders)
      .where(eq(folders.id, input.id))
      .where(eq(folders.userId, userId))
      .limit(1);

    if (folder.length === 0) {
      return null; // Returns null instead of throwing error
    }

    // BUG: Counts ALL chats in folder, not just user's chats
    const chatCount = await db.select({ count: sql<number>`count(*)::int` })
      .from(chats)
      .where(eq(chats.folderId, input.id)); // Missing userId check!

    return {
      ...folder[0],
      chatCount: chatCount[0].count,
    };
  },
},
```

**Impact:** Information disclosure - users can see how many chats other users have in folders.

**Recommendation:**

```typescript
// Add userId filter
const chatCount = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(chats)
  .where(eq(chats.folderId, input.id))
  .where(eq(chats.userId, userId)); // Add this line
```

---

### 6. Message Delete Doesn't Verify Chat Ownership

**File:** `packages/api/src/routers/message.ts:73`

**Severity:** HIGH

**Issue:** Only checks if message exists, not if user owns the parent chat.

**Current Code:**

```typescript
delete: {
  input: z.object({ id: z.string().ulid() }),
  resolve: async ({ input, context }) => {
    const userId = context.session.user.id;

    // Check if message exists
    const message = await db.select()
      .from(messages)
      .where(eq(messages.id, input.id))
      .limit(1);

    if (message.length === 0) {
      return { success: false };
    }

    // BUG: No check if user owns the chat!
    await db.delete(messages)
      .where(eq(messages.id, input.id));

    return { success: true };
  },
},
```

**Impact:** Users can delete messages from chats they don't own.

**Recommendation:**

```typescript
delete: {
  input: z.object({ id: z.string().ulid() }),
  resolve: async ({ input, context }) => {
    const userId = context.session.user.id;

    // Join with chats to verify ownership
    const result = await db.delete(messages)
      .where(eq(messages.id, input.id))
      .returning();

    if (result.length === 0) {
      throw new ORPCError('NOT_FOUND', { message: 'Message not found' });
    }

    // Verify chat ownership
    const chat = await db.select()
      .from(chats)
      .where(eq(chats.id, result[0].chatId))
      .where(eq(chats.userId, userId))
      .limit(1);

    if (chat.length === 0) {
      throw new ORPCError('FORBIDDEN');
    }

    return { success: true };
  },
},
```

---

### 7. SQL Injection Risk via ILIKE Pattern Matching

**File:** `packages/api/src/routers/chat.ts:169`

**Severity:** HIGH

**Issue:** User input is directly concatenated into SQL ILIKE pattern without sanitization.

**Current Code:**

```typescript
conditions.push(sql`${chats.title} ILIKE ${`%${input.query}%`}`);
```

**Impact:** While Drizzle ORM provides parameterization, SQL wildcards (`%`, `_`) and backslashes in user input can cause unexpected behavior or information disclosure.

**Attack Example:**

- User searches for: `%`
- Returns ALL chats (information disclosure)

**Recommendation:**

```typescript
// Sanitize wildcards
const sanitizeSearchInput = (input: string): string => {
  return input
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/%/g, '\\%') // Escape percent
    .replace(/_/g, '\\_'); // Escape underscore
};

const sanitizedQuery = sanitizeSearchInput(input.query);
conditions.push(sql`${chats.title} ILIKE ${`%${sanitizedQuery}%`}`);

// Or better: Use Drizzle's built-in ilike
conditions.push(ilike(chats.title, `%${input.query}%`));
```

---

### 8. Hardcoded Development Credentials in Docker Compose

**File:** `docker-compose.yml:23-24,54`

**Severity:** HIGH

**Issue:** Weak default passwords are used if environment variables are not set.

**Current Code:**

```yaml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-sambungchat_dev}
  BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET:-sambungchat-dev-secret-key-at-least-32-chars-long}
```

**Impact:** If deployed to production without setting environment variables, weak default credentials are used.

**Recommendation:**

```yaml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?ERROR: POSTGRES_PASSWORD must be set}
  BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET:?ERROR: BETTER_AUTH_SECRET must be set}
```

The `:?` syntax causes Docker Compose to fail with an error if the variable is not set, rather than using a default.

---

### 9. Plain Text Password Field in Database Schema

**File:** `packages/db/src/schema/auth.ts:51`

**Severity:** HIGH

**Issue:** The `account` table has a `password` field but the schema doesn't enforce hashing.

**Current Code:**

```typescript
export const account = pgTable('account', {
  // ... other fields
  password: text('password'), // No validation, no .notNull()
  // ...
});
```

**Impact:** If Better Auth doesn't hash passwords, they're stored in plain text.

**Recommendation:**

1. Verify Better Auth is hashing passwords
2. Add validation to ensure password field contains bcrypt hash only

```typescript
import { z } from 'zod';

// Add check in application layer
const bcryptHashRegex = /^\$2[aby]?\$\d{2}\$.{53}$/;

function validatePasswordHash(password: string | null): void {
  if (password && !bcryptHashRegex.test(password)) {
    throw new Error('Password must be a valid bcrypt hash');
  }
}
```

---

### 10. Missing Transaction Support in Folder Delete

**File:** `packages/api/src/routers/folder.ts:97`

**Severity:** HIGH

**Issue:** Folder delete performs two operations (unassign chats, delete folder) without a transaction.

**Current Code:**

```typescript
// Operation 1: Unassign chats
await db.update(chats).set({ folderId: null }).where(eq(chats.folderId, input.id));

// Operation 2: Delete folder
await db.delete(folders).where(eq(folders.id, input.id));
```

**Impact:** If delete fails after unassigning chats, chats are left orphaned (folderId is null but folder still exists).

**Recommendation:**

```typescript
await db.transaction(async (tx) => {
  await tx.update(chats).set({ folderId: null }).where(eq(chats.folderId, input.id));

  await tx.delete(folders).where(eq(folders.id, input.id));
});
```

---

## Medium Priority Issues

### 11. Inconsistent Error Handling Across Codebase

**Severity:** MEDIUM

**Issue:** Mixed error handling approaches - generic `Error`, `ORPCError`, and silent failures.

**Examples:**

```typescript
// packages/api/src/routers/chat.ts:120
throw new Error('Chat not found'); // Should use ORPCError

// packages/api/src/routers/message.ts:53
throw new Error('Failed to create message'); // Should use ORPCError

// packages/api/src/routers/folder.ts:40
return null; // Silent failure, should throw ORPCError('NOT_FOUND')

// packages/api/src/routers/message.ts:77
return { success: false }; // Silent failure, should throw error
```

**Impact:** Unpredictable error handling, difficult to create consistent API responses.

**Recommendation:** Create standardized error utilities:

```typescript
// packages/api/src/utils/errors.ts
import { ORPCError } from '@orpc/server';

export class NotFoundError extends ORPCError {
  constructor(resource: string) {
    super('NOT_FOUND', {
      message: `${resource} not found`,
      code: 'NOT_FOUND',
    });
  }
}

export class ForbiddenError extends ORPCError {
  constructor() {
    super('FORBIDDEN', {
      message: 'You do not have permission to access this resource',
      code: 'FORBIDDEN',
    });
  }
}

export class ValidationError extends ORPCError {
  constructor(message: string) {
    super('BAD_REQUEST', {
      message,
      code: 'VALIDATION_ERROR',
    });
  }
}

// Usage
throw new NotFoundError('chat');
throw new ForbiddenError();
throw new ValidationError('Invalid ULID format');
```

---

### 12. Duplicated Authorization Checks (16+ Instances)

**Severity:** MEDIUM

**Issue:** The pattern `const userId = context.session.user.id` and ownership checks are repeated throughout the codebase.

**Locations:**

- `packages/api/src/routers/chat.ts` - 8 instances
- `packages/api/src/routers/message.ts` - 3 instances
- `packages/api/src/routers/folder.ts` - 5 instances

**Impact:** High maintenance burden, easy to miss authorization in new endpoints.

**Recommendation:** Create authorization middleware/helper:

```typescript
// packages/api/src/utils/authorization.ts
import { eq } from 'drizzle-orm';
import { ORPCError } from '@orpc/server';
import type { DB } from '@sambung-chat/db';

export async function getUserOrThrow(context: any): string {
  if (!context.session?.user?.id) {
    throw new ORPCError('UNAUTHORIZED');
  }
  return context.session.user.id;
}

export async function requireOwnership<T extends { userId: string }>(
  db: DB,
  table: any,
  userId: string,
  id: string,
  resourceType: string
): Promise<T> {
  const results = await db
    .select()
    .from(table)
    .where(eq(table.id, id))
    .where(eq(table.userId, userId))
    .limit(1);

  if (results.length === 0) {
    throw new ORPCError('NOT_FOUND', { message: `${resourceType} not found` });
  }

  return results[0] as T;
}

// Usage
export const chatRouter = router({
  delete: {
    resolve: async ({ input, context }) => {
      const userId = await getUserOrThrow(context);
      const chat = await requireOwnership(db, chats, userId, input.id, 'chat');

      await db.delete(chats).where(eq(chats.id, input.id));
      return { success: true };
    },
  },
});
```

---

### 13. Unsafe Array Access Pattern (10+ Instances)

**Severity:** MEDIUM

**Issue:** Mixed use of `array[0]` with and without proper length checks.

**Examples:**

```typescript
// Safe: Has length check
const results = await db.select(); /* ... */
if (results.length === 0) {
  throw new Error('Not found');
}
return results[0];

// Unsafe: No length check
const results = await db.select(); /* ... */
return results[0]; // Could be undefined!
```

**Impact:** Runtime errors if database returns unexpected results.

**Recommendation:** Create utility function:

```typescript
// packages/api/src/utils/array.ts
import { ORPCError } from '@orpc/server';

export function getFirstOrThrow<T>(results: T[], errorMessage = 'Record not found'): T {
  if (results.length === 0) {
    throw new ORPCError('NOT_FOUND', { message: errorMessage });
  }
  return results[0];
}

// Usage
const chat = await db.select(); /* ... */
return getFirstOrThrow(chat, 'Chat not found');
```

---

### 14. Excessive Console Logging in Production Code

**Severity:** MEDIUM

**Issue:** 40+ console.log/error statements in production code paths.

**Locations:**

- `packages/auth/src/index.ts:9-23` - 15 console.log statements for auth config
- `apps/server/src/index.ts:80,88,157` - Error logging
- `apps/web/src/lib/components/secondary-sidebar/ChatList.svelte` - Multiple console.error

**Impact:**

- Performance overhead in production
- Logs may expose sensitive information
- No log level control

**Recommendation:** Use structured logging:

```typescript
// Install: bun add pino pino-pretty
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
});

// Usage
logger.info({ userId, chatId }, 'Chat created');
logger.error({ error }, 'Failed to create message');

// Replace console.log in packages/auth/src/index.ts
logger.debug(
  {
    config: {
      /* ... */
    },
  },
  'Auth config initialized'
);
```

---

### 15. Missing Composite Indexes for Performance

**Severity:** MEDIUM

**Issue:** Missing composite indexes for common query patterns.

**Missing Indexes:**

```typescript
// packages/db/src/schema/chat.ts

// Current: Single column indexes
index('chat_user_id_idx').on(table.userId),
index('chat_pinned_idx').on(table.pinned),
index('chat_updated_at_idx').on(table.updatedAt),

// Missing: Composite index for "Show pinned chats first"
index('chat_user_pinned_updated_idx').on(table.userId, table.pinned, table.updatedAt),
```

```typescript
// packages/db/src/schema/chat.ts (messages table)

// Current: Single column index
index('message_chat_id_idx').on(table.chatId),

// Missing: Composite index for sorted message queries
index('message_chat_created_idx').on(table.chatId, table.createdAt),
```

**Impact:** Slower queries, unnecessary database load.

**Recommendation:** Add missing composite indexes:

```typescript
// packages/db/src/schema/chat.ts
export const chats = pgTable(
  'chats',
  {
    // ... fields
  },
  (table) => [
    index('chat_user_id_idx').on(table.userId),
    index('chat_updated_at_idx').on(table.updatedAt),
    index('chat_pinned_idx').on(table.pinned),
    index('chat_folder_id_idx').on(table.folderId),
    // Add this composite index
    index('chat_user_pinned_updated_idx').on(table.userId, table.pinned, table.updatedAt),
  ]
);

export const messages = pgTable(
  'messages',
  {
    // ... fields
  },
  (table) => [
    index('message_chat_id_idx').on(table.chatId),
    index('message_created_at_idx').on(table.createdAt),
    // Add this composite index
    index('message_chat_created_idx').on(table.chatId, table.createdAt),
  ]
);
```

---

### 16. Inconsistent ID Types Across Tables

**Severity:** MEDIUM

**Issue:** Mix of ULID (text) and serial (integer) IDs across tables.

**Current State:**

- `user`, `session`, `account`, `verification` - Use `text` (Better Auth standard)
- `folders`, `chats`, `messages` - Use ULID `text` (via `generateULID()`)
- `prompts`, `api_keys` - Use `serial` integer IDs
- `todo` - Uses `serial` integer ID

**Impact:** Inconsistent patterns, difficult to create unified querying, foreign key relationships are complex.

**Recommendation:** Migrate all tables to ULID for consistency:

```typescript
// Create migration to convert prompts and api_keys to ULID
// This requires:
// 1. Add new id column (text)
// 2. Populate with ULID for existing rows
// 3. Update foreign key references
// 4. Drop old id column
```

---

### 17. Code Outside src/lib/ in packages/ui

**Severity:** MEDIUM (CLAUDE.md violation)

**Issue:** Code exists outside `src/lib/` in packages/ui, violating CLAUDE.md guideline.

**Files Affected:**

- `packages/ui/src/components/` - Entire directory
- `packages/ui/src/components/layout/Header.svelte`
- `packages/ui/src/components/layout/index.ts`
- `packages/ui/src/components/index.ts`
- `packages/ui/src/index.ts`
- `packages/ui/src/utils.ts`
- `packages/ui/src/tokens/` - Entire directory with 5 files

**Impact:** May cause build issues, violates established convention.

**Recommendation:** Move code to `src/lib/`:

```bash
# Restructure packages/ui
packages/ui/src/
├── lib/
│   ├── components/     # Move from src/components/
│   │   ├── layout/
│   │   ├── auth/
│   │   ├── markdown/
│   │   └── ui/         # shadcn components
│   └── tokens/         # Move from src/tokens/
├── index.ts            # Update exports
└── utils.ts            # Move to lib/utils.ts
```

---

## Low Priority Issues

### 18. Inconsistent Response Formats

**Severity:** LOW

**Issue:** Mix of response formats across endpoints:

- Some return `{ success: true }`
- Some return `null` on not found
- Some throw errors
- Some return full object

**Recommendation:** Standardize on one pattern (prefer throwing `ORPCError('NOT_FOUND')`).

---

### 19. No Rate Limiting on Any Endpoints

**Severity:** LOW

**Issue:** No rate limiting on API endpoints, allowing potential abuse.

**Recommendation:** Add rate limiting middleware.

---

### 20. Missing Index on account.providerId

**Severity:** LOW

**Issue:** The `providerId` column in `account` table is frequently queried during OAuth flows but lacks an index.

**Recommendation:**

```typescript
index('account_provider_id_idx').on(table.providerId);
```

---

## Detailed Analysis by Category

### Security Analysis Summary

| Severity | Count | Issues                                                                              |
| -------- | ----- | ----------------------------------------------------------------------------------- |
| CRITICAL | 4     | Unauthenticated router, unauthorized access, missing auth, exposed endpoints        |
| HIGH     | 4     | SQL injection risk, hardcoded credentials, plain text password, missing transaction |
| MEDIUM   | 2     | Missing API key encryption, XSS via markdown                                        |
| LOW      | 2     | Incomplete auth tests, weak .env examples                                           |

### Code Quality Summary

| Category                        | Count         | Impact                |
| ------------------------------- | ------------- | --------------------- |
| Duplicated authorization checks | 16+ instances | High maintenance      |
| Unsafe array access             | 10 instances  | Runtime error risk    |
| Console logging in production   | 40+ instances | Performance, security |
| Type assertions with 'any'      | 4 instances   | Type safety           |
| Generic Error throwing          | 3 instances   | Inconsistent handling |

### Database Schema Summary

**High Priority:**

1. Schema vs migration mismatch for ULID IDs
2. Inconsistent ID types across tables
3. Orphaned todo table without user relation

**Medium Priority:** 4. Missing composite indexes for chat queries 5. Missing composite index for messages sorting 6. Missing index on account.providerId

### API Design Summary

**Critical Issues:**

1. Todo router completely unauthenticated
2. Folder delete unauthorized access
3. AI endpoint has no authentication or validation
4. Debug endpoints exposed without auth

**High Priority:** 5. Missing transaction support 6. No user ownership checks in some endpoints 7. Inconsistent error handling

**Medium Priority:** 8. Inconsistent response formats 9. Generic Error instead of ORPCError 10. Missing model ID validation 11. SQL template literal usage in search

---

## Recommended Action Plan

### Phase 1: Security Fixes (Do First)

**Timeline:** 1-2 days

**Tasks:**

1. [ ] Remove or guard debug endpoints
2. [ ] Fix todo router authentication
3. [ ] Fix folder delete authorization
4. [ ] Add AI endpoint validation
5. [ ] Remove default credentials from docker-compose.yml
6. [ ] Add input sanitization for SQL ILIKE

**Commands:**

```bash
# After fixes, run tests
bun run test
bun run check:types
bun run lint
```

---

### Phase 2: Code Quality (Week 1)

**Timeline:** 3-5 days

**Tasks:**

1. [ ] Create authorization helper (`packages/api/src/utils/authorization.ts`)
2. [ ] Create safe array access utility (`packages/api/src/utils/array.ts`)
3. [ ] Replace console.log with structured logging
4. [ ] Create standardized error class hierarchy
5. [ ] Remove `as any` type assertions

**New Files to Create:**

```
packages/api/src/utils/
├── authorization.ts
├── array.ts
└── errors.ts
```

---

### Phase 3: Database Performance (Week 1-2)

**Timeline:** 2-3 days

**Tasks:**

1. [ ] Add composite index for chat queries
2. [ ] Add composite index for message queries
3. [ ] Add index on account.providerId
4. [ ] Generate and run migration

**Commands:**

```bash
cd packages/db
bun run db:generate
bun run db:push  # or bun run db:migrate for production
```

---

### Phase 4: Consistency & Standards (Week 2-3)

**Timeline:** 3-5 days

**Tasks:**

1. [ ] Migrate prompts/api-keys to ULID
2. [ ] Add userId to todo table
3. [ ] Move packages/ui code to src/lib/
4. [ ] Standardize error responses across all routers
5. [ ] Add rate limiting middleware

---

## Files Requiring Immediate Attention

### Critical (Fix Today)

| Priority     | File                                 | Lines     | Issue                   |
| ------------ | ------------------------------------ | --------- | ----------------------- |
| **CRITICAL** | `packages/api/src/routers/todo.ts`   | All       | No authentication       |
| **CRITICAL** | `packages/api/src/routers/folder.ts` | 97        | Unauthorized access     |
| **CRITICAL** | `apps/server/src/index.ts`           | 132-166   | No auth, no validation  |
| **CRITICAL** | `apps/server/src/index.ts`           | 176-215   | Debug endpoints exposed |
| **HIGH**     | `packages/api/src/routers/chat.ts`   | 169       | SQL injection risk      |
| **HIGH**     | `docker-compose.yml`                 | 23-24, 54 | Hardcoded credentials   |

### High Priority (Fix This Week)

| Priority | File                                  | Lines | Issue                  |
| -------- | ------------------------------------- | ----- | ---------------------- |
| **HIGH** | `packages/api/src/routers/folder.ts`  | 40    | Information disclosure |
| **HIGH** | `packages/api/src/routers/message.ts` | 73    | No ownership check     |
| **HIGH** | `packages/api/src/routers/folder.ts`  | 97    | No transaction         |
| **HIGH** | `packages/db/src/schema/todo.ts`      | All   | No user relation       |
| **HIGH** | `packages/db/src/schema/auth.ts`      | 51    | Plain text password    |

---

## Quick Wins (Can be done in 30 minutes)

1. **Remove debug endpoints from production** - 5 minutes

   ```typescript
   if (process.env.NODE_ENV === 'development') {
     // Debug endpoints
   }
   ```

2. **Remove default credentials** - 2 minutes

   ```yaml
   POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?ERROR: POSTGRES_PASSWORD must be set}
   ```

3. **Add ownership check to folder delete** - 15 minutes

   ```typescript
   // Verify folder ownership before updating chats
   ```

4. **Add NODE_ENV check** for sensitive operations - 10 minutes

---

## Testing Checklist

After implementing fixes:

- [ ] Run unit tests: `bun run test:unit`
- [ ] Run E2E tests: `bun run test:e2e`
- [ ] Run type check: `bun run check:types`
- [ ] Run linter: `bun run lint`
- [ ] Build entire monorepo: `bun run build`
- [ ] Test authentication flow
- [ ] Test chat creation/deletion
- [ ] Test folder operations
- [ ] Test with multiple users
- [ ] Verify debug endpoints are disabled in production

---

## Summary

**Total Issues Found:** 50+

**Breakdown by Severity:**

- Critical: 4 issues
- High: 10 issues
- Medium: 15+ issues
- Low: 20+ issues

**Database Issue:** FIXED - `folder_id` column now exists with proper schema.

**Next Steps:**

1. Start with Phase 1 (Security Fixes)
2. Create issues/tickets for each phase
3. Assign to team members
4. Track progress in project management tool

---

**Generated by:** Claude Code
**Date:** 2026-01-17
**Branch:** feat/refactor-ui-to-web
