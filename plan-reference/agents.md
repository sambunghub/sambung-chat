# SAMBUNG CHAT - AI Agent Reference

**Version:** 1.0
**Last Updated:** January 11, 2026
**Status:** Active Development

---

## Overview

Documentation untuk AI agents yang bekerja pada project SambungChat - platform multi-model LLM client dengan lisensi AGPL-3.0.

---

## 🚨 CRITICAL RULES

### ⛔ NEVER DO:

1. **NEVER edit generated shadcn-svelte components directly**
   - Komponen UI ada di `apps/web/src/lib/components/ui/`
   - Ini adalah generated code dari shadcn-svelte CLI
   - Perubahan akan di-overwrite saat update komponen
   - Solusi: Gunakan wrapper component atau className props

2. **NEVER commit sensitive data**
   - `plan-reference/.notes` adalah RAHASIA (PRD SaaS)
   - Jangan commit API keys, passwords, tokens
   - `.notes` sudah di .gitignore

3. **NEVER use OpenAI directly without checking**
   - Project menggunakan OpenAI-Compatible provider
   - Cek `apps/web/src/routes/ai/+page.svelte` untuk referensi

### ✅ ALWAYS DO:

1. **ALWAYS use TypeScript**
   - Strict types required
   - Avoid `any` unless absolutely necessary

2. **ALWAYS follow Svelte 5 patterns**
   - Use runes (`$state`, `$derived`, `$props`)
   - Use snippets for children rendering

3. **ALWAYS run type check before committing**
   ```bash
   bun run check-types
   ```

---

## 📁 Project Structure

### Current Structure

```
sambung-chat/
├── apps/
│   ├── web/                 # SvelteKit frontend
│   │   └── src/
│   │       ├── routes/      # SvelteKit file-based routing
│   │       ├── components/  # UI components (shadcn-svelte + custom)
│   │       └── lib/         # Utilities, ORPC client
│   │
│   └── server/              # Hono backend
│       └── src/
│           └── index.ts     # Hono app + ORPC handler
│
├── packages/
│   ├── api/                 # ORPC routers & procedures
│   │   └── src/
│   │       ├── routers/     # Feature routers (chat, prompts, etc.)
│   │       ├── context.ts   # Auth context creation
│   │       └── index.ts     # ORPC setup (public/protected procedures)
│   │
│   ├── auth/                # Better Auth configuration
│   ├── db/                  # Drizzle ORM schema & client
│   │   ├── src/
│   │   │   └── schema/      # Database tables
│   │   ├── docker-compose.yml
│   │   └── drizzle.config.ts
│   │
│   ├── ui/                  # ⚠️ shadcn-svelte components
│   │   └── src/
│   │       ├── lib/
│   │       │   └── components/
│   │       │       └── ui/  # ← NEVER EDIT THIS (generated)
│   │       ├── components/  # ← Custom components here
│   │       └── tokens/      # Design tokens
│   │
│   ├── env/                 # Environment validation (Zod)
│   └── config/              # Shared TypeScript configs
│
├── plan-reference/          # Documentation
│   ├── PRD-OpenSource.md    # Open source PRD
│   ├── ROADMAP.md           # Development timeline
│   ├── ui-ux-design.md      # Frontend design
│   ├── agents.md            # This file
│   ├── .notes               # ⚠️ SECRET (ignored)
│   └── generated/           # Auto-generated docs
│
├── volume-data/             # Docker volumes (gitignored)
├── turbo.json               # Turborepo config
├── package.json             # Root workspace
└── tsconfig.json            # Root TypeScript config
```

---

## 🔧 Key Technologies

| Layer             | Technology     | Purpose             |
| ----------------- | -------------- | ------------------- |
| **Frontend**      | SvelteKit 5    | Web framework       |
| **UI Components** | shadcn-svelte  | Reusable UI         |
| **Styling**       | TailwindCSS    | Utility CSS         |
| **Backend**       | Hono           | Server framework    |
| **API Layer**     | ORPC           | Type-safe RPC       |
| **Database**      | PostgreSQL     | Relational DB       |
| **ORM**           | Drizzle ORM    | Type-safe queries   |
| **Auth**          | Better Auth    | Authentication      |
| **Validation**    | Zod            | Schema validation   |
| **Query**         | TanStack Query | Data fetching       |
| **Runtime**       | Bun            | JavaScript runtime  |
| **Monorepo**      | Turborepo      | Build orchestration |

---

## 🎯 Development Priorities

### Phase 1: Foundation (Weeks 1-12)

**Status:** In Progress

#### Week 1-2: Repository Setup ✅

- [x] Monorepo structure
- [x] SvelteKit 5 + Hono setup
- [x] Better Auth integration
- [x] Database setup
- [ ] LICENSE file (AGPL-3.0)
- [ ] .github/ templates
- [ ] CI/CD setup
- [ ] Linting/Formatting (ESLint, Prettier)

#### Week 3-4: Authentication 🔄

- [ ] Complete auth UI
- [ ] Session management
- [ ] Protected routes
- [ ] User profile

#### Week 5-8: Chat Interface ⏳

- [ ] Multi-model integration
- [ ] Streaming responses
- [ ] Chat history
- [ ] Model selector

#### Week 9-12: Additional Features

- [ ] Prompt templates
- [ ] Settings pages
- [ ] API key management
- [ ] Testing & polish

---

## 🔄 ORPC Architecture

### Data Flow

```
Client (Svelte)
    ↓ (TanStack Query)
ORPC Client
    ↓ (HTTP/fetch)
Server (Hono)
    ↓ (ORPC Handler)
Router (appRouter)
    ↓ (Procedure)
Database (Drizzle ORM)
    ↓
PostgreSQL
```

### Creating a New Feature

#### Step 1: Define Schema

```typescript
// packages/db/src/schema/chat.ts
import { pgTable, text, serial, timestamp } from 'drizzle-orm/pg-core';

export const chat = pgTable('chat', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  userId: text('user_id').notNull(), // From Better Auth
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### Step 2: Create Router

```typescript
// packages/api/src/routers/chat.ts
import { db } from '@sambung-chat/db';
import { chat } from '@sambung-chat/db/schema/chat';
import { protectedProcedure } from '../index';
import { eq } from 'drizzle-orm';

export const chatRouter = {
  getAll: protectedProcedure.handler(async ({ context }) => {
    return await db.select().from(chat).where(eq(chat.userId, context.session.user.id));
  }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      return await db.insert(chat).values({
        title: input.title,
        userId: context.session.user.id,
      });
    }),
};
```

#### Step 3: Add to Root Router

```typescript
// packages/api/src/routers/index.ts
import { chatRouter } from './chat';

export const appRouter = {
  // ...existing
  chat: chatRouter,
};
```

#### Step 4: Use in Frontend

```svelte
<!-- apps/web/src/routes/chat/+page.svelte -->
<script lang="ts">
  import { orpc } from '$lib/orpc';
  import { createQuery, createMutation } from '@tanstack/svelte-query';

  const chatsQuery = createQuery(orpc.chat.getAll.queryOptions());

  const createChat = createMutation({
    ...orpc.chat.create.mutationOptions(),
    onSuccess: () => $chatsQuery.refetch(),
  });
</script>
```

---

## 🎨 UI Component Guidelines

### Using shadcn-svelte Components

```svelte
<script>
  import { Button, Card, Input } from '$lib/components/ui';
</script>

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Input placeholder="Type..." />
    <Button>Submit</Button>
  </CardContent>
</Card>
```

### Creating Custom Components

**WRONG** (editing generated files):

```svelte
<!-- ❌ apps/web/src/lib/components/ui/button/Button.svelte -->
<!-- DO NOT EDIT THIS FILE -->
```

**CORRECT** (creating wrapper):

```svelte
<!-- ✅ apps/web/src/lib/components/GradientButton.svelte -->
<script>
  import { Button } from '$lib/components/ui';

  export let children;
</script>

<Button class="bg-gradient-to-r from-teal-500 to-orange-500">
  {@render children()}
</Button>
```

---

## 🚀 Common Commands

### Development

```bash
# Start all services
bun run dev

# Start only web
bun run dev:web

# Start only server
bun run dev:server

# Type check
bun run check-types

# Build all
bun run build
```

### Database

```bash
# Start PostgreSQL
bun run db:start

# Stop PostgreSQL
bun run db:stop

# Push schema changes
bun run db:push

# Open Drizzle Studio
bun run db:studio

# Generate migration
bun run db:generate
```

### Adding shadcn-svelte Components

```bash
cd apps/web
npx shadcn-svelte@latest add [component-name]
```

---

## 📝 Code Patterns

### Svelte 5 Runes

```svelte
<script lang="ts">
  // Local state
  let count = $state(0);

  // Derived state
  let double = $derived(count * 2);

  // Props
  interface Props {
    initial?: number;
  }
  let { initial = 0 }: Props = $props();

  // Effect
  $effect(() => {
    console.log('Count changed:', count);
  });
</script>
```

### TanStack Query + ORPC

```svelte
<script lang="ts">
  import { orpc } from '$lib/orpc';
  import { createQuery, createMutation } from '@tanstack/svelte-query';

  // Query
  const dataQuery = createQuery(orpc.resource.getAll.queryOptions());

  // Mutation
  const createMutation = createMutation({
    ...orpc.resource.create.mutationOptions(),
    onSuccess: () => $dataQuery.refetch(),
  });

  // Derived state
  const data = $derived($dataQuery.data ?? []);
  const isLoading = $derived($dataQuery.isLoading);
</script>

{#if isLoading}
  <p>Loading...</p>
{:else}
  {#each data as item}
    <div>{item.name}</div>
  {/each}
{/if}
```

### Protected Routes

```typescript
// packages/api/src/routers/user.ts
import { protectedProcedure } from '../index';

export const userRouter = {
  getProfile: protectedProcedure.handler(async ({ context }) => {
    // context.session is guaranteed to exist
    return context.session?.user;
  }),
};
```

---

## 🐛 Troubleshooting

### Issue: Types not resolving

**Solution:**

```bash
# Rebuild packages
bun run build

# Restart dev server
bun run dev
```

### Issue: Database connection failed

**Solution:**

```bash
# Check PostgreSQL is running
bun run db:start

# Verify DATABASE_URL in apps/server/.env
cat apps/server/.env | grep DATABASE_URL

# Test connection
bun run db:studio
```

### Issue: Auth not working

**Solution:**

```typescript
// Ensure credentials: "include" in ORPC client
// apps/web/src/lib/orpc.ts
export const link = new RPCLink({
  url: `${PUBLIC_SERVER_URL}/rpc`,
  fetch(url, options) {
    return fetch(url, {
      ...options,
      credentials: 'include', // ← Required for cookies
    });
  },
});
```

### Issue: Component not found

**Solution:**

```bash
# Verify export in packages/ui/src/lib/index.ts
export * from './components/ui/button';
export * from './components/ui/card';
// etc.

# Verify import in component
import { Button } from '@sambung-chat/ui';
```

---

## 📚 Related Documentation

| Document      | Location                                                                              | Purpose              |
| ------------- | ------------------------------------------------------------------------------------- | -------------------- |
| PRD           | [plan-reference/PRD-OpenSource.md](./PRD-OpenSource.md)                               | Product requirements |
| Roadmap       | [plan-reference/ROADMAP.md](./ROADMAP.md)                                             | Development timeline |
| UI/UX         | [plan-reference/ui-ux-design.md](./ui-ux-design.md)                                   | Frontend design      |
| UI Components | [apps/web/src/lib/components/](../apps/web/src/lib/components/)                       | UI component library |
| ORPC Ref      | [plan-reference/generated/orpc-todo-reference.md](./generated/orpc-todo-reference.md) | ORPC patterns        |

---

## 🎯 Quick Reference

### File Locations

| What             | Where                                            |
| ---------------- | ------------------------------------------------ |
| Add new route    | `apps/web/src/routes/[route]/+page.svelte`       |
| Add API endpoint | `packages/api/src/routers/[feature].ts`          |
| Add DB table     | `packages/db/src/schema/[table].ts`              |
| Add UI component | `apps/web/src/lib/components/[Component].svelte` |
| Environment vars | `apps/server/.env`, `apps/web/.env`              |

### Important Files

| File                                      | Purpose                   |
| ----------------------------------------- | ------------------------- |
| `turbo.json`                              | Monorepo task definitions |
| `package.json`                            | Workspace config          |
| `packages/api/src/routers/index.ts`       | Root API router           |
| `apps/web/src/lib/components/ui/index.ts` | UI exports                |
| `apps/web/src/lib/orpc.ts`                | ORPC client setup         |
| `apps/server/src/index.ts`                | Hono server setup         |

---

## 🔐 Security Considerations

1. **API Keys**: Store encrypted in database, never in frontend
2. **Session Management**: Use Better Auth, never implement custom auth
3. **SQL Injection**: Always use Drizzle ORM parameterized queries
4. **XSS**: Svelte auto-escapes, but be careful with `{@html}`
5. **CORS**: Configure properly in Hono server

---

## 📋 Before You Code

- [ ] Read PRD for feature context
- [ ] Check ROADMAP for priority
- [ ] Read UI-UX-DESIGN for component specs
- [ ] Run `bun run check-types` to verify no errors
- [ ] Check if similar component already exists in `$lib/components/ui`

---

## ✅ Quality Checklist

Before marking a task complete:

- [ ] TypeScript compiles without errors
- [ ] No `any` types (unless absolutely necessary)
- [ ] Svelte 5 runes used correctly
- [ ] Responsive design (mobile + desktop)
- [ ] Accessible (keyboard navigation, ARIA labels)
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Dark mode compatible (if applicable)

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
