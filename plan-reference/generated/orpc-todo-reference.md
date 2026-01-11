# ORPC + TODO Implementation Reference

Complete reference guide for building type-safe APIs with ORPC (OpenAPI-compatible RPC framework) in the SambungChat project.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [File Structure](#file-structure)
4. [Layer-by-Layer Breakdown](#layer-by-layer-breakdown)
   - [Database Layer (Drizzle ORM)](#1-database-layer-drizzle-orm)
   - [API Layer (ORPC)](#2-api-layer-orpc)
   - [Server Layer (Hono)](#3-server-layer-hono)
   - [Client Layer (TanStack Query)](#4-client-layer-tanstack-query)
5. [Complete Code Examples](#complete-code-examples)
6. [Common Patterns](#common-patterns)
7. [Quick Start Template](#quick-start-template)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐  │
│  │  Svelte 5 Page  │───▶│ TanStack Query   │───▶│   ORPC Client       │  │
│  │  (+page.svelte) │    │  (createQuery)   │    │  (createORPCClient) │  │
│  └─────────────────┘    └──────────────────┘    └─────────────────────┘  │
│           │                                               │               │
│           ▼                                               ▼               │
│  ┌─────────────────┐    ┌──────────────────┐                           │  │
│  │  UI Components  │◀───│  Reactive State  │                           │  │
│  │  (display)      │    │  ($state, $derived)                           │  │
│  └─────────────────┘    └──────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP (fetch)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVER LAYER                                    │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐  │
│  │  Hono App       │───▶│  RPCHandler      │───▶│   ORPC Router       │  │
│  │  (index.ts)     │    │  (/rpc prefix)   │    │   (appRouter)       │  │
│  └─────────────────┘    └──────────────────┘    └─────────────────────┘  │
│                                  │                        │                │
│                                  │                        ▼                │
│                           ┌──────┴─────┐      ┌─────────────────────┐     │
│                           │  Context   │      │  todoRouter         │     │
│                           │  Injection │      │  - getAll()         │     │
│                           │  (session) │      │  - create()         │     │
│                           └────────────┘      │  - toggle()         │     │
│                                              │  - delete()         │     │
│                                              └─────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                                           │
                                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATABASE LAYER                                     │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐  │
│  │  Drizzle ORM    │───▶│  PostgreSQL      │◀───│  Schema Definition  │  │
│  │  (db client)    │    │  Database        │    │  (todo.ts)          │  │
│  └─────────────────┘    └──────────────────┘    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Example (Create Todo)

1. **User Action**: User types text and clicks "Add" button
2. **Mutation**: `addMutation.mutate({ text: "Buy milk" })`
3. **Client**: ORPC client sends POST to `/rpc/todo.create`
4. **Server**: Hono receives request → creates context → routes to ORPC handler
5. **Router**: Validates input with Zod → calls handler
6. **Handler**: Inserts to database using Drizzle ORM
7. **Response**: Returns new todo record
8. **Success**: `onSuccess` callback → `refetch()` queries
9. **UI Update**: Svelte reactive state updates automatically

---

## Technology Stack

| Layer               | Technology     | Version | Purpose                    |
| ------------------- | -------------- | ------- | -------------------------- |
| **Database**        | PostgreSQL     | -       | Relational database        |
| **ORM**             | Drizzle ORM    | ^0.45.1 | Type-safe database queries |
| **Validation**      | Zod            | ^4.1.13 | Schema validation          |
| **Auth**            | Better Auth    | ^1.4.9  | Authentication & sessions  |
| **RPC**             | ORPC           | ^1.12.2 | Type-safe API layer        |
| **Server**          | Hono           | ^4.6.13 | Web framework              |
| **Client Query**    | TanStack Query | ^5.85.3 | Data fetching & caching    |
| **Frontend**        | Svelte         | ^5.38.1 | Reactive UI framework      |
| **Build**           | Turbo          | ^2.6.3  | Monorepo orchestration     |
| **Package Manager** | Bun            | 1.2.23  | Dependency management      |

---

## File Structure

```
sambung-chat/
├── packages/
│   ├── db/
│   │   └── src/
│   │       └── schema/
│   │           ├── todo.ts              # ← Database schema
│   │           ├── auth.ts
│   │           └── index.ts
│   ├── api/
│   │   └── src/
│   │       ├── context.ts               # ← Auth context creation
│   │       ├── index.ts                 # ← Procedure setup
│   │       └── routers/
│   │           ├── todo.ts              # ← Todo router
│   │           └── index.ts             # ← Root app router
│   ├── auth/
│   │   └── src/
│   │       └── index.ts                 # ← Better Auth setup
│   └── env/
│       └── src/
│           ├── server.ts                # ← Server env validation
│           └── client.ts
├── apps/
│   ├── server/
│   │   └── src/
│   │       └── index.ts                 # ← Hono server + ORPC handlers
│   └── web/
│       └── src/
│           ├── lib/
│           │   └── orpc.ts              # ← ORPC client setup
│           └── routes/
│               └── todos/
│                   └── +page.svelte     # ← Frontend usage example
```

---

## Layer-by-Layer Breakdown

### 1. Database Layer (Drizzle ORM)

#### Schema Definition

**File**: [packages/db/src/schema/todo.ts](../packages/db/src/schema/todo.ts)

```typescript
import { pgTable, text, boolean, serial } from 'drizzle-orm/pg-core';

export const todo = pgTable('todo', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  completed: boolean('completed').default(false).notNull(),
});
```

**Key Concepts**:

- `pgTable`: Defines a PostgreSQL table
- `serial("id")`: Auto-incrementing integer (primary key)
- `text("text")`: Variable-length text field
- `.notNull()`: Adds NOT NULL constraint
- `boolean("completed")`: Boolean field
- `.default(false)`: Sets default value

#### Available Field Types

```typescript
import { pgTable, serial, text, boolean, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

// Common patterns:
id: serial('id').primaryKey(); // Auto-increment ID
name: text('name').notNull(); // Required text
email: text('email').unique(); // Unique text
age: integer('age'); // Integer
isActive: boolean('is_active').default(true);
createdAt: timestamp('created_at').defaultNow();
userId: uuid('user_id').references(() => user.id); // Foreign key
```

#### Database Client

**File**: [packages/db/src/index.ts](../packages/db/src/index.ts)

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

---

### 2. API Layer (ORPC)

#### Context Creation

**File**: [packages/api/src/context.ts](../packages/api/src/context.ts)

```typescript
import type { Context as HonoContext } from 'hono';
import { auth } from '@sambung-chat/auth';

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

**Key Points**:

- Context is created for each request
- Extracts session from Better Auth cookies
- Session is passed to all procedures via context

#### Procedure Setup

**File**: [packages/api/src/index.ts](../packages/api/src/index.ts)

```typescript
import { ORPCError, os } from '@orpc/server';
import type { Context } from './context';

// Create ORPC instance with Context type
export const o = os.$context<Context>();

// Public procedure (no auth required)
export const publicProcedure = o;

// Protected procedure (requires auth)
const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError('UNAUTHORIZED');
  }
  return next({
    context: {
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);
```

**Procedure Types**:
| Type | Description | Use Case |
|------|-------------|----------|
| `publicProcedure` | No authentication | Public data, health checks |
| `protectedProcedure` | Requires valid session | User-specific data |

#### Router Implementation

**File**: [packages/api/src/routers/todo.ts](../packages/api/src/routers/todo.ts)

```typescript
import { db } from '@sambung-chat/db';
import { todo } from '@sambung-chat/db/schema/todo';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { publicProcedure } from '../index';

export const todoRouter = {
  // GET: Fetch all todos
  getAll: publicProcedure.handler(async () => {
    return await db.select().from(todo);
  }),

  // POST: Create new todo
  create: publicProcedure
    .input(z.object({ text: z.string().min(1) }))
    .handler(async ({ input }) => {
      return await db.insert(todo).values({
        text: input.text,
      });
    }),

  // PATCH: Update todo completion
  toggle: publicProcedure
    .input(z.object({ id: z.number(), completed: z.boolean() }))
    .handler(async ({ input }) => {
      return await db.update(todo).set({ completed: input.completed }).where(eq(todo.id, input.id));
    }),

  // DELETE: Remove todo
  delete: publicProcedure.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    return await db.delete(todo).where(eq(todo.id, input.id));
  }),
};
```

**Router Pattern Breakdown**:

1. **Procedure Definition**: Each key becomes an RPC endpoint
2. **Input Validation**: `.input(z.object(...))` defines request schema
3. **Handler**: `.handler(async ({ input, context }) => { ... })`
4. **Return Value**: Automatically serialized and sent as JSON

#### Root App Router

**File**: [packages/api/src/routers/index.ts](../packages/api/src/routers/index.ts)

```typescript
import type { RouterClient } from '@orpc/server';
import { protectedProcedure, publicProcedure } from '../index';
import { todoRouter } from './todo';

export const appRouter = {
  // Health check endpoint
  healthCheck: publicProcedure.handler(() => {
    return 'OK';
  }),

  // Protected endpoint example
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: 'This is private',
      user: context.session?.user,
    };
  }),

  // Nested router
  todo: todoRouter,
};

// Type exports for client
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
```

**Resulting Endpoints**:

- `POST /rpc/healthCheck`
- `POST /rpc/privateData` (requires auth)
- `POST /rpc/todo.getAll`
- `POST /rpc/todo.create`
- `POST /rpc/todo.toggle`
- `POST /rpc/todo.delete`

---

### 3. Server Layer (Hono)

#### Server Integration

**File**: [apps/server/src/index.ts](../apps/server/src/index.ts)

```typescript
import { RPCHandler, onError } from '@orpc/server';
import { createContext } from '@sambung-chat/api/context';
import { appRouter } from '@sambung-chat/api/routers/index';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use(logger());
app.use(
  '/*',
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true, // Allow cookies
  })
);

// Create ORPC handler
export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

// Route all requests through ORPC
app.use('/*', async (c, next) => {
  // 1. Create context for this request
  const context = await createContext({ context: c });

  // 2. Try to handle with ORPC
  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: '/rpc',
    context: context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  // 3. Fall through to other routes
  await next();
});

app.get('/', (c) => c.text('OK'));

export default app;
```

**Request Flow**:

1. Hono receives request
2. Middleware runs (logger, cors)
3. Context created from request (session extracted)
4. ORPC handler attempts to match route
5. If matched: route through ORPC router → procedure handler → database
6. If not matched: fall through to next handler

---

### 4. Client Layer (TanStack Query)

#### Client Setup

**File**: [apps/web/src/lib/orpc.ts](../apps/web/src/lib/orpc.ts)

```typescript
import type { AppRouterClient } from '@sambung-chat/api/routers/index';
import { PUBLIC_SERVER_URL } from '$env/static/public';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { QueryCache, QueryClient } from '@tanstack/svelte-query';

// TanStack Query setup
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error(`Error: ${error.message}`);
    },
  }),
});

// ORPC link (HTTP transport)
export const link = new RPCLink({
  url: `${PUBLIC_SERVER_URL}/rpc`,
  fetch(url, options) {
    return fetch(url, {
      ...options,
      credentials: 'include', // Send cookies for auth
    });
  },
});

// Type-safe client
export const client: AppRouterClient = createORPCClient(link);

// TanStack Query integration
export const orpc = createTanstackQueryUtils(client);
```

**Key Points**:

- `credentials: "include"` ensures cookies are sent (required for auth)
- Type safety flows from `AppRouterClient` export
- `orpc` utility provides TanStack Query integration

#### Frontend Usage

**File**: [apps/web/src/routes/todos/+page.svelte](../apps/web/src/routes/todos/+page.svelte)

```svelte
<script lang="ts">
  import { orpc } from '$lib/orpc';
  import { createQuery, createMutation } from '@tanstack/svelte-query';

  // ===== STATE =====
  let newTodoText = $state('');

  // ===== QUERY =====
  const todosQuery = createQuery(orpc.todo.getAll.queryOptions());

  // ===== MUTATIONS =====
  const addMutation = createMutation(
    orpc.todo.create.mutationOptions({
      onSuccess: () => {
        $todosQuery.refetch();
        newTodoText = '';
      },
      onError: (error) => {
        console.error('Failed to create todo:', error?.message ?? error);
      },
    })
  );

  const toggleMutation = createMutation(
    orpc.todo.toggle.mutationOptions({
      onSuccess: () => {
        $todosQuery.refetch();
      },
    })
  );

  const deleteMutation = createMutation(
    orpc.todo.delete.mutationOptions({
      onSuccess: () => {
        $todosQuery.refetch();
      },
    })
  );

  // ===== DERIVED STATE =====
  const todos = $derived($todosQuery.data ?? []);
  const hasTodos = $derived(todos.length > 0);
  const isLoadingTodos = $derived($todosQuery.isLoading);
  const isAdding = $derived($addMutation.isPending);
  const canAdd = $derived(!isAdding && newTodoText.trim().length > 0);

  // ===== HANDLERS =====
  function handleAddTodo(event: SubmitEvent) {
    event.preventDefault();
    if (newTodoText.trim()) {
      $addMutation.mutate({ text: newTodoText.trim() });
    }
  }

  function handleToggleTodo(id: number, completed: boolean) {
    $toggleMutation.mutate({ id, completed: !completed });
  }

  function handleDeleteTodo(id: number) {
    $deleteMutation.mutate({ id });
  }
</script>

<div class="p-4">
  <h1 class="text-xl mb-4">Todos (oRPC)</h1>

  <!-- Loading State -->
  {#if isLoadingTodos}
    <p>Loading...</p>
  {:else if !hasTodos}
    <p>No todos yet.</p>
  {:else}
    <ul class="space-y-1">
      {#each todos as todo (todo.id)}
        <li class="flex items-center justify-between p-2">
          <label class:line-through={todo.completed}>
            <input
              type="checkbox"
              checked={todo.completed}
              onchange={() => handleToggleTodo(todo.id, todo.completed)}
            />
            {todo.text}
          </label>
          <button onclick={() => handleDeleteTodo(todo.id)}> Delete </button>
        </li>
      {/each}
    </ul>
  {/if}

  <!-- Add Form -->
  <form onsubmit={handleAddTodo} class="flex gap-2 mb-4">
    <input type="text" bind:value={newTodoText} placeholder="New task..." disabled={isAdding} />
    <button type="submit" disabled={!canAdd}>
      {#if isAdding}Adding...{:else}Add{/if}
    </button>
  </form>

  <!-- Error States -->
  {#if $todosQuery.isError}
    <p class="text-red-500">
      Error loading: {$todosQuery.error?.message ?? 'Unknown error'}
    </p>
  {/if}
</div>
```

**Svelte 5 Runes Used**:
| Rune | Purpose |
|------|---------|
| `$state` | Reactive local state |
| `$derived` | Computed values |
| `$queryName` | Access query/mutation state |

---

## Complete Code Examples

### Example 1: Public Router (No Auth)

```typescript
// packages/api/src/routers/public.ts
import { db } from '@sambung-chat/db';
import { publicProcedure } from '../index';
import z from 'zod';

export const publicRouter = {
  // Simple GET
  getStatus: publicProcedure.handler(async () => {
    return { status: 'operational', version: '1.0.0' };
  }),

  // GET with input validation
  getItem: publicProcedure.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    const item = await db.query.item.findFirst({
      where: eq(item.id, input.id),
    });
    return item;
  }),
};
```

### Example 2: Protected Router (Requires Auth)

```typescript
// packages/api/src/routers/user.ts
import { db } from '@sambung-chat/db';
import { protectedProcedure } from '../index';
import z from 'zod';

export const userRouter = {
  // Access current user from context
  getProfile: protectedProcedure.handler(async ({ context }) => {
    return context.session?.user;
  }),

  // Update user settings
  updateSettings: protectedProcedure
    .input(
      z.object({
        theme: z.enum(['light', 'dark']),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user.id;
      await db.update(user).set({ settings: input }).where(eq(user.id, userId));
      return { success: true };
    }),
};
```

### Example 3: Advanced Query Patterns

```typescript
import { db } from '@sambung-chat/db';
import { todo, user } from '@sambung-chat/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// With joins
const getTodosWithUser = async () => {
  return await db
    .select({
      todo: todo,
      userName: user.name,
    })
    .from(todo)
    .leftJoin(user, eq(todo.userId, user.id))
    .orderBy(desc(todo.createdAt));
};

// With filtering
const getCompletedTodos = async (userId: number) => {
  return await db
    .select()
    .from(todo)
    .where(and(eq(todo.userId, userId), eq(todo.completed, true)));
};

// With pagination
const getPaginatedTodos = async (userId: number, limit: number, offset: number) => {
  return await db.select().from(todo).where(eq(todo.userId, userId)).limit(limit).offset(offset);
};

// Aggregation
const getTodoStats = async (userId: number) => {
  const result = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when completed then 1 else 0 end)`,
    })
    .from(todo)
    .where(eq(todo.userId, userId));
  return result[0];
};
```

---

## Common Patterns

### Pattern 1: Optimistic Updates

Instead of refetching after mutation, update local data immediately:

```typescript
const toggleMutation = createMutation({
  ...orpc.todo.toggle.mutationOptions(),
  onMutate: async ({ id, completed }) => {
    // Cancel ongoing queries
    await queryClient.cancelQueries({ queryKey: orpc.todo.getAll.queryKey() });

    // Snapshot previous value
    const previousTodos = queryClient.getQueryData(orpc.todo.getAll.queryKey());

    // Optimistically update
    queryClient.setQueryData(orpc.todo.getAll.queryKey(), (old) => {
      return old?.map((t) => (t.id === id ? { ...t, completed } : t));
    });

    return { previousTodos };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(orpc.todo.getAll.queryKey(), context?.previousTodos);
  },
});
```

### Pattern 2: Loading State per Item

```svelte
<script>
  const deleteMutation = createMutation(orpc.todo.delete.mutationOptions());

  function getIsDeleting(id) {
    return $deleteMutation.isPending && $deleteMutation.variables?.id === id;
  }
</script>

{#each todos as todo (todo.id)}
  <button disabled={getIsDeleting(todo.id)}>
    {#if getIsDeleting(todo.id)}Deleting...{:else}Delete{/if}
  </button>
{/each}
```

### Pattern 3: Form Validation

```typescript
import { z } from 'zod';

// Define schema
const todoSchema = z.object({
  text: z.string().min(1, 'Required').max(100, 'Too long'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

// Use in router
create: publicProcedure.input(todoSchema).handler(async ({ input }) => {
  // input is fully typed and validated
  await db.insert(todo).values(input);
});
```

### Pattern 4: Error Boundaries

```svelte
{#if $todosQuery.isError}
  <div class="error">
    <p>Error: {$todosQuery.error.message}</p>
    <button onclick={() => $todosQuery.refetch()}>Retry</button>
  </div>
{:else}
  <!-- Normal content -->
{/if}
```

---

## Quick Start Template

### Creating a New Resource

#### Step 1: Define Database Schema

**Create**: `packages/db/src/schema/resource.ts`

```typescript
import { pgTable, text, serial, timestamp } from 'drizzle-orm/pg-core';

export const resource = pgTable('resource', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Update**: `packages/db/src/schema/index.ts`

```typescript
export * from './resource';
```

#### Step 2: Create Router

**Create**: `packages/api/src/routers/resource.ts`

```typescript
import { db } from '@sambung-chat/db';
import { resource } from '@sambung-chat/db/schema/resource';
import { eq } from 'drizzle-orm';
import { publicProcedure, protectedProcedure } from '../index';
import z from 'zod';

export const resourceRouter = {
  getAll: publicProcedure.handler(async () => {
    return await db.select().from(resource);
  }),

  getById: publicProcedure.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    const results = await db.select().from(resource).where(eq(resource.id, input.id));
    return results[0];
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      return await db.insert(resource).values(input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      const { id, ...data } = input;
      return await db.update(resource).set(data).where(eq(resource.id, id));
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    return await db.delete(resource).where(eq(resource.id, input.id));
  }),
};
```

#### Step 3: Add to Root Router

**Update**: `packages/api/src/routers/index.ts`

```typescript
import { resourceRouter } from './resource';

export const appRouter = {
  // ... existing routes
  resource: resourceRouter,
};
```

#### Step 4: Run Migration

```bash
# Generate migration
bun run db:generate

# Push to database
bun run db:push
```

#### Step 5: Create Frontend Page

**Create**: `apps/web/src/routes/resources/+page.svelte`

```svelte
<script lang="ts">
  import { orpc } from '$lib/orpc';
  import { createQuery, createMutation } from '@tanstack/svelte-query';

  const resourcesQuery = createQuery(orpc.resource.getAll.queryOptions());

  const createMutation = createMutation({
    ...orpc.resource.create.mutationOptions(),
    onSuccess: () => $resourcesQuery.refetch(),
  });
</script>

{#if $resourcesQuery.isLoading}
  <p>Loading...</p>
{:else}
  <ul>
    {#each $resourcesQuery.data as resource}
      <li>{resource.name}</li>
    {/each}
  </ul>
{/if}
```

---

## Troubleshooting

### Issue: Types not autocomplete in client

**Solution**: Ensure `AppRouterClient` is properly exported and imported:

```typescript
// packages/api/src/routers/index.ts
export type AppRouterClient = RouterClient<typeof appRouter>;

// apps/web/src/lib/orpc.ts
import type { AppRouterClient } from '@sambung-chat/api/routers/index';
export const client: AppRouterClient = createORPCClient(link);
```

### Issue: Auth not working (always unauthorized)

**Solution**: Check cookies are being sent:

```typescript
// In orpc.ts
export const link = new RPCLink({
  url: `${PUBLIC_SERVER_URL}/rpc`,
  fetch(url, options) {
    return fetch(url, {
      ...options,
      credentials: 'include', // ← Must be "include"
    });
  },
});
```

### Issue: CORS errors

**Solution**: Check server CORS config:

```typescript
app.use(
  '/*',
  cors({
    origin: env.CORS_ORIGIN, // ← Must match frontend URL
    credentials: true, // ← Must be true for auth
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);
```

### Issue: Query always returns stale data

**Solution**: Check stale time configuration:

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // ← 0 = always refetch on mount
      refetchOnWindowFocus: true,
    },
  },
});
```

### Issue: Database connection errors

**Solution**: Verify DATABASE_URL in `.env`:

```bash
# Correct format:
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Run database:
bun run db:start

# Check connection:
bun run db:studio
```

---

## Summary

This reference covers the complete ORPC + TODO implementation pattern:

1. **Database Layer**: Drizzle ORM schema definitions
2. **API Layer**: ORPC routers with Zod validation
3. **Server Layer**: Hono with ORPC handler integration
4. **Client Layer**: TanStack Query with Svelte 5

Use the Quick Start Template to create new resources following the same patterns.

**Next Steps**:

- Branding & design system update (teal/orange colors)
- MVP feature implementation (chat system)
