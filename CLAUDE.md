# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Quick Start

**Essential commands (80% of use cases):**

```bash
bun run check:types      # Type check FIRST before any build
bun run check:hydration  # SSR hydration validation
bun run dev              # Start all services
bun run build            # Build entire monorepo
```

**Pre-build workflow (MANDATORY order):**

1. `bun run check:types` → Fail? Fix type errors first
2. `bun run check:hydration` → Fail? Fix SSR issues
3. `bun run lint` → Fail? Fix linting

**If ANY step fails, STOP and fix before proceeding.**

---

## 📊 Project Status

**ALWAYS check current progress before starting any task:**

**Read**: `docs/status/current.md` - Real-time development status

This file contains:

- Current version and overall progress percentage
- Completed features and recent achievements
- Active development focus
- Blockers and next steps
- Database tables and API endpoints overview

**Why this matters:**

- Avoid duplicating work that's already done
- Understand what's implemented before suggesting changes
- Know the current priorities and blockers
- See what APIs and components are available

**Quick check command:**

```bash
cat docs/status/current.md | grep -A 5 "Overall Progress"
```

---

## 📝 Changelog Guidelines

### MANDATORY: Update CHANGELOG.md After Every Task

**CRITICAL**: After completing ANY task (bug fix, feature, refactor, documentation), you MUST update `CHANGELOG.md` before committing.

**Format**: Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

- Use categories: `Added`, `Fixed`, `Changed`, `Security`, etc.
- Include date in version header: `## [0.x.x] - YYYY-MM-DD`
- Write clear, concise descriptions
- Link to relevant files/docs where applicable

**Versioning**:

- Format: `x.y.z` (Semantic Versioning)
- `x.y` (MAJOR.MINOR): Manual updates only
- `z` (PATCH): Auto-increment per commit (0.0.1 → 0.0.2 → 0.0.3)
- Example: After 0.0.9, next commit is 0.0.10 (NOT 0.1.0)

**When to Update**:

- ✅ After EVERY task completion
- ✅ Before EVERY commit
- ✅ Include date (YYYY-MM-DD format)
- ❌ NEVER skip changelog updates

**Entry Example**:

```markdown
## [0.0.3] - 2025-01-18

### Fixed

- **Component Name**: Brief description of fix ([path/to/file.ts](path/to/file.ts:123))

### Added

- **Feature Name**: Description of new feature
```

---

## Project Overview

**SambungChat** - Open-source multi-model LLM client platform built as a Turborepo monorepo. Emphasizes type safety, privacy-first architecture, and self-hosting.

**Tech Stack:**

- **Frontend:** SvelteKit 5 (Svelte 5 Runes), shadcn-svelte, TailwindCSS v4
- **Backend:** Hono, oRPC (type-safe APIs), Drizzle ORM
- **Database:** PostgreSQL (Docker)
- **Auth:** Better Auth (OAuth/SSO with Keycloak)
- **Runtime:** Bun
- **AI:** AI SDK v6 (OpenAI, Anthropic, Google, Groq, Ollama)

---

## Architecture Map

```
sambung-chat/
├── apps/
│   ├── web/          # SvelteKit frontend → apps/web/agents.md
│   └── server/       # Hono backend → apps/server/agents.md
├── packages/
│   ├── api/          # ORPC routers → packages/api/agents.md
│   ├── auth/         # Better Auth config
│   ├── db/           # Drizzle schemas → packages/db/agents.md
│   ├── env/          # Environment validation
│   └── config/       # Shared TypeScript configs
└── docs/             # Public documentation → docs/index.md
```

**Critical Patterns:**

**oRPC Router:**

```typescript
import { router } from '@sambung-chat/orpc';

export const myRouter = router({
  procedureName: {
    input: z.object({
      /* schema */
    }),
    resolve: async ({ input, context }) => {
      // Access user via context.user
      return { data };
    },
  },
});
```

**Drizzle Schema:**

```typescript
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const myTable = pgTable('my_table', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Dual-Sidebar Navigation:**

- Navigation Rail (64px): Icon-based primary nav
- Secondary Sidebar (280px): Context-aware content
- Config: `apps/web/src/lib/navigation/nav-rail-menu.config.json`
- See: `docs/sidebar-journey.md`

---

## API & RPC Endpoints Reference

**CRITICAL:** Understanding endpoint routing is essential for avoiding 404 errors and CSP violations.

### Connection Architecture

**Development Mode (Direct Connection):**

- Frontend connects directly to backend: `http://localhost:3000`
- ORPC client: `apps/web/src/lib/orpc.ts` uses `http://localhost:SERVER_PORT`
- Chat AI endpoint: Uses `BACKEND_API_URL` = `http://localhost:3000`
- No proxy needed - eliminates restart issues

**Production Mode (Proxy/Reverse Proxy):**

- Frontend uses same-origin via `PUBLIC_API_URL`
- Backend behind reverse proxy (nginx/Docker)
- All requests go through proxy for security

### Server Endpoints Overview

**Backend Server:** `apps/server/src/index.ts` (Port 3000)

#### 1. REST API Endpoints

| Path               | Method | Auth        | Description                                           |
| ------------------ | ------ | ----------- | ----------------------------------------------------- |
| `/api/auth/*`      | ALL    | Cookie      | Better Auth OAuth flow (sign-in, sign-out, callbacks) |
| `/api/ai`          | POST   | Cookie      | AI streaming endpoint for chat completions            |
| `/rpc/*`           | POST   | CSRF+Cookie | ORPC procedures (see below)                           |
| `/api-reference/*` | GET    | None        | OpenAPI/Swagger documentation                         |
| `/`                | GET    | None        | Health check (returns "OK")                           |
| `/debug/*`         | GET    | None        | Debug endpoints (dev only, returns 404 in prod)       |

#### 2. ORPC Procedures (`/rpc/*`)

**Root Procedures:**

- `POST /rpc/healthCheck` - Public health check
- `POST /rpc/getCsrfToken` - Get CSRF token (rate-limited: 10 req/min)
- `POST /rpc/privateData` - Protected test endpoint

**Chat Procedures:**

- `POST /rpc/chat/getAll` - Get all user's chats
- `POST /rpc/chat/getAllChatsWithMessages` - Export all chats with messages
- `POST /rpc/chat/getChatsByFolder` - Get chats grouped by folder
- `POST /rpc/chat/getById` - Get single chat by ID
- `POST /rpc/chat/create` - Create new chat
- `POST /rpc/chat/update` - Update chat title/model
- `POST /rpc/chat/delete` - Delete chat (CSRF protected)
- `POST /rpc/chat/togglePin` - Toggle chat pin status (CSRF protected)
- `POST /rpc/chat/updateFolder` - Move chat to folder (CSRF protected)
- `POST /rpc/chat/search` - Search chats with filters (providers, models, dates, messages)

**Message Procedures:**

- `POST /rpc/message/getByChatId` - Get all messages for a chat
- `POST /rpc/message/create` - Create new message (CSRF protected)
- `POST /rpc/message/delete` - Delete message (CSRF protected)

**Folder Procedures:**

- `POST /rpc/folder/getAll` - Get all user's folders
- `POST /rpc/folder/getById` - Get folder with chat count
- `POST /rpc/folder/create` - Create new folder (CSRF protected)
- `POST /rpc/folder/update` - Update folder name (CSRF protected)
- `POST /rpc/folder/delete` - Delete folder (CSRF protected)

**Model Procedures:**

- `POST /rpc/model/getAll` - Get all user's models
- `POST /rpc/model/getById` - Get model by ID
- `POST /rpc/model/getActive` - Get user's active model
- `POST /rpc/model/create` - Create new model
- `POST /rpc/model/update` - Update model configuration
- `POST /rpc/model/setActive` - Set model as active
- `POST /rpc/model/delete` - Delete model

**API Key Procedures:**

- `POST /rpc/apiKey/getAll` - Get all user's API keys
- `POST /rpc/apiKey/getById` - Get API key by ID
- `POST /rpc/apiKey/create` - Create new API key (encrypted)
- `POST /rpc/apiKey/update` - Update API key
- `POST /rpc/apiKey/delete` - Delete API key

### Endpoint Routing Flow

```
Frontend (http://localhost:5174)
    ↓
ORPC Client (apps/web/src/lib/orpc.ts)
    ↓
Direct to http://localhost:3000/rpc/*  [DEV]
    ↓
Backend Server (apps/server/src/index.ts)
    ↓
RPC Middleware (line 124-141)
    ↓
ORPC Router (packages/api/src/routers/index.ts)
    ↓
Procedure Handlers (chat, model, folder, message, apiKey)
```

### Common Issues & Solutions

**404 on `/rpc/*` endpoints:**

- ✅ Ensure backend server is running: `curl http://localhost:3000/rpc/healthCheck`
- ✅ Check ORPC client uses correct URL (dev: `localhost:3000`, prod: `PUBLIC_API_URL`)
- ❌ Don't rely on Vite proxy for RPC in development (use direct connection)

**CSP violations:**

- ✅ CSP `connect-src` must include `http://localhost:3000` in development
- ✅ Check `apps/web/src/lib/security/headers.ts` for backend URL configuration
- ❌ Don't use `PUBLIC_API_URL` (frontend URL) for CSP backend source

**CSRF token errors:**

- ✅ All mutations (create, update, delete) require CSRF token
- ✅ Token automatically added by ORPC client link interceptor
- ✅ Token fetched on page load from `/rpc/getCsrfToken`

**AI endpoint errors:**

- ✅ `/api/ai` requires authentication cookie
- ✅ Must have active model configured in database
- ✅ Backend fetches API key from database (not from env vars)

---

## Critical: Hydration Rules

Hydration mismatch is the #1 cause of SSR failures in SambungChat. Follow these rules or code will be rejected.

### Core Rule 1: Snippet Child Pattern

**For ALL trigger components:** `Sidebar.Trigger`, `Dialog.Trigger`, `Tooltip.Trigger`, `DropdownMenuTrigger`, `MenuButton`

❌ **WRONG:**

```svelte
<Sidebar.Trigger>
  <Button>Menu</Button>
</Sidebar.Trigger>
```

✅ **RIGHT:**

```svelte
<Sidebar.Trigger let:child>
  {@render child({ class: buttonVariants({ variant: 'ghost', size: 'sm' }) })}
</Sidebar.Trigger>
```

### Core Rule 2: SSR-Safe State

```svelte
<script>
  // Always initialize with falsy value for SSR
  let sidebarOpen = $state(false);
  let mounted = $state(false);

  // Use $effect for client-only operations
  $effect(() => {
    if (browser) {
      // Safe to access localStorage here
      const saved = localStorage.getItem('sidebar');
      sidebarOpen = saved === 'open';
    }
  });
</script>

<Sidebar.Provider bind:open={sidebarOpen}>
  <!-- content -->
</Sidebar.Provider>
```

### Core Rule 3: No Nested Interactive Elements

❌ **WRONG:**

```svelte
<a href="/path">
  <Button>Click</Button>
</a>

<label>
  Text
  <input />
</label>
```

✅ **RIGHT:**

```svelte
<div role="button" class={buttonVariants()}>Click</div>

<label>
  <span>Text</span>
  <input />
</label>
```

### Validation Commands

```bash
bun run check:hydration      # Fail on SSR warnings
bun run build && bun run preview  # Full SSR test
```

**Console must be CLEAN** - no `hydration_mismatch`, `node_invalid_placement_ssr`

---

## Common Commands

### Development

```bash
bun run dev              # Start all services
bun run dev:web          # Web app only (port 5174)
bun run dev:server       # Server only (port 3000)
bun run check:types      # TypeScript check
bun run check:hydration  # SSR hydration check
bun run build            # Build all
bun run preview          # Test production build
```

### Database

```bash
bun run db:start         # Start PostgreSQL
bun run db:stop          # Stop PostgreSQL
bun run db:push          # Push schema (dev)
bun run db:migrate       # Run migrations (prod)
bun run db:studio        # Drizzle Studio UI
bun run db:generate      # Generate migration files
```

### Testing & Quality

```bash
bun run test             # Run all tests
bun run test:unit        # Unit tests (Vitest)
bun run test:e2e         # E2E tests (Playwright)
bun run lint             # ESLint
bun run lint:fix         # Fix ESLint issues
bun run format           # Prettier
```

---

## Conventions

**Code Style:**

- Prettier + ESLint (auto-format on save)
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- File naming: `kebab-case` files, `PascalCase` components

**TypeScript:**

- Strict mode enabled - **never use `any`**
- Always type props: `interface Props`
- Svelte 5 runes: `$state`, `$derived`, `$props`, `$effect`

**Branch Strategy:**

- `main` - production
- `develop` - development
- `feat/*` - feature branches

**Commit Rules (CRITICAL):**

- **PRE-COMPULSORY**: ALL commits MUST pass pre-commit hooks (`git commit` without `--no-verify`)
- **NO co-author tags** - Jangan gunakan `Co-Authored-By` di commit messages
- **Conventional commits**: `feat:`, `fix:`, `docs:`, `refactor:`, dll.
- **Hindari watermark** - Tidak menambahkan signature atau attribution di commits

**Pre-commit hooks validation** (enforced by Husky):

1. ✅ lint-staged (Prettier + ESLint auto-fix)
2. ✅ ESLint (0 errors allowed, warnings OK)
3. ✅ svelte-check (0 errors allowed, warnings OK)
4. ✅ Build (server + web must compile successfully)

**NEVER bypass pre-commit** with `--no-verify` unless explicitly instructed by user for infrastructure issues.

---

## Common Pitfalls

| Issue                                    | Solution                                         |
| ---------------------------------------- | ------------------------------------------------ |
| `@apply` custom colors fails             | Use CSS variables: `hsl(var(--color-primary))`   |
| Import `lucide-svelte` errors            | Use `@lucide/svelte` instead                     |
| `const` with `$state` errors             | Change to `let`                                  |
| Files outside `src/lib/` not building    | Move to `src/lib/`                               |
| Sidebar hydration errors                 | Use snippet child pattern (see above)            |
| Nested `Sidebar.Root` causing DOM errors | Use flex `<div>` wrapper, don't nest             |
| Tooltip SSR mismatch                     | Use `tooltipContent={undefined}` when not needed |

---

## Definition of Done

Before considering a task complete:

1. ✅ `bun run check:types` passes
2. ✅ `bun run check:hydration` passes (console clean)
3. ✅ `bun run build && bun run preview` - console 100% clean
4. ✅ Code follows existing patterns in that folder
5. ✅ Documentation updated if adding features

---

## Documentation References

**Start Here:**

- [docs/index.md](docs/index.md) - Documentation hub
- [docs/sidebar-journey.md](docs/sidebar-journey.md) - **Sidebar implementation (read first!)**

**Core Concepts:**

- [docs/teams-concept.md](docs/teams-concept.md) - Team model & access control
- [docs/routes.md](docs/routes.md) - URL structure
- [docs/database.md](docs/database.md) - Database tables

**Development:**

- [docs/getting-started.md](docs/getting-started.md) - Setup guide
- [docs/troubleshooting.md](docs/troubleshooting.md) - Common errors
- [docs/architecture.md](docs/architecture.md) - System architecture

---

## Security

- **NEVER** commit tokens, API keys, or secrets
- Use `.env` files for environment variables
- All secrets validated through `@sambung-chat/env`
- Never log PII or sensitive data

---

## 🚨 Critical Architecture Rules

### ORPC Response Handling - DO NOT MODIFY ORPC RESPONSES

**CRITICAL**: Never parse, modify, or re-serialize ORPC response bodies in middleware.

**The Problem**:
ORPC uses its own binary encoding format (not plain JSON). If middleware tries to:

1. Parse the response body as JSON
2. Extract or modify data
3. Re-serialize with `JSON.stringify()`

The ORPC client will receive `undefined` because the encoding format is broken.

**Correct Pattern** (from `apps/server/src/index.ts:160-164`):

```typescript
app.use('/rpc/*', async (c, next) => {
  try {
    const context = await createContext({ context: c });
    const rpcResult = await rpcHandler.handle(c.req.raw, {
      prefix: '/rpc',
      context: context,
    });

    if (rpcResult.matched) {
      // ✅ CORRECT: Pass through ORPC response without modification
      // ORPC uses its own encoding format, so we shouldn't parse/serialize it
      return c.newResponse(rpcResult.response.body, rpcResult.response);
    }
  } catch (error) {
    console.error('[RPC] Error:', error);
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }

  await next();
});
```

**What NOT to do**:

```typescript
// ❌ WRONG: This breaks ORPC encoding
const text = await rpcResult.response.clone().text();
const responseBody = JSON.parse(text);
const cleanBody = { ...responseBody };
delete cleanBody.someField;
return c.newResponse(JSON.stringify(cleanBody), statusCode, headers);
```

**Symptoms of this issue**:

- Frontend receives `undefined` from ORPC calls
- `console.log(orpc.model.getAll())` shows `undefined`
- Server logs show data being returned correctly
- Browser shows 200 OK but client gets nothing

**Why this happens**:
ORPC uses a custom encoding (SuperJSON) that preserves types like Date, Map, Set, etc. When you re-serialize with plain `JSON.stringify()`, you lose this encoding and the client can't decode the response.
