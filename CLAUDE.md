# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**SambungChat** is an open-source multi-model LLM client platform built as a Turborepo monorepo. The project emphasizes type safety, privacy-first architecture, and self-hosting capabilities.

**Tech Stack:**

- **Frontend:** SvelteKit 5 (Svelte 5 Runes), shadcn-svelte, TailwindCSS v4
- **Backend:** Hono, oRPC (type-safe APIs), Drizzle ORM
- **Database:** PostgreSQL (Docker)
- **Auth:** Better Auth (OAuth/SSO with Keycloak support)
- **Runtime:** Bun
- **AI Integration:** AI SDK v6 supporting OpenAI, Anthropic, Google, Groq, Ollama

---

## Critical Pre-Build Workflow

**BEFORE any build task, ALWAYS run TypeScript check:**

```bash
# Check entire monorepo
bun run check:types
```

If TypeScript check fails, **DO NOT proceed to build** - fix type errors first. This catches 90% of issues.

---

## Common Commands

### Development

```bash
bun run dev              # Start all services (web + server + db)
bun run dev:web          # Start only web app (port 5173)
bun run dev:server       # Start only server (port 3000)
bun run check:types      # TypeScript check (DO THIS FIRST)
bun run build            # Build entire monorepo
```

### Database

```bash
bun run db:start         # Start PostgreSQL via Docker
bun run db:stop          # Stop PostgreSQL
bun run db:push          # Push schema changes to database
bun run db:studio        # Open Drizzle Studio UI
bun run db:generate      # Generate migration files
bun run db:migrate       # Run database migrations
bun run db:down          # Remove database container
```

### Testing

```bash
bun run test             # Run all tests
bun run test:unit        # Run unit tests (Vitest)
bun run test:e2e         # Run E2E tests (Playwright)
bun run test:coverage    # Run with coverage
```

### Code Quality

```bash
bun run lint             # Run ESLint
bun run lint:fix         # Fix ESLint issues
bun run format           # Format with Prettier
```

---

## Architecture Overview

### Monorepo Structure

```
sambung-chat/
├── apps/
│   ├── web/                 # SvelteKit frontend → apps/web/agents.md
│   └── server/              # Hono backend → apps/server/agents.md
├── packages/
│   ├── api/                 # ORPC routers → packages/api/agents.md
│   ├── auth/                # Better Auth config
│   ├── db/                  # Drizzle ORM schemas → packages/db/agents.md
│   ├── env/                 # Environment validation
│   └── config/              # Shared TypeScript configs
├── docs/                    # Public documentation
│   ├── index.md             # Documentation navigation index
│   ├── README.md            # Documentation hub
│   ├── teams-concept.md     # Team model & access control
│   ├── routes.md            # URL structure & routing
│   ├── database.md          # Database tables & relationships
│   ├── i18n.md              # Internationalization guide
│   ├── troubleshooting.md   # Common build errors
│   ├── architecture.md      # System architecture
│   ├── getting-started.md   # Installation & setup
│   ├── deployment.md        # Deployment guides
│   └── api-reference.md     # API endpoint documentation
└── plan-reference/          # Planning docs
    ├── ROADMAP.md           # Development timeline
    ├── STATUS.md            # Current development status
    └── agents.md            # Root AI agent reference
```

### Key Architectural Patterns

**Type Safety:**

- Full-stack TypeScript with strict mode
- End-to-end type safety via oRPC
- Zod schema validation for all inputs
- Environment variables validated via `@sambung-chat/env`

**API Layer (oRPC):**

```typescript
// packages/api/src/routers/example.ts
export const router = {
  // Query - GET requests
  getAll: {
    input: z.object({ limit: z.number().optional() }),
    resolve: async ({ input, context }) => {
      return [];
    },
  },
  // Mutation - POST/PUT/DELETE
  create: {
    input: z.object({ title: z.string() }),
    resolve: async ({ input, context }) => {
      return { id: 1, ...input };
    },
  },
};
```

**Database (Drizzle ORM):**

- Schema-first approach in `packages/db/src/schema/`
- Use `bun run db:push` for development, `bun run db:migrate` for production
- All migrations tracked in `packages/db/drizzle/`

**Authentication (Better Auth):**

- Configured in `packages/auth/src/`
- Supports email/password and OAuth (Keycloak)
- Session management via `authClient` in frontend

**Dual-Sidebar Navigation System:**

- **Navigation Rail (64px)**: Icon-based primary navigation with collapsible support
- **Secondary Sidebar (280px)**: Context-aware content (chat history, agents list, prompts library)
- Configuration via JSON: [`apps/web/src/lib/navigation/nav-rail-menu.config.json`](apps/web/src/lib/navigation/nav-rail-menu.config.json) and [`apps/web/src/lib/navigation/secondary-sidebar-menu.config.json`](apps/web/src/lib/navigation/secondary-sidebar-menu.config.json)
- **See:** [`docs/sidebar-journey.md`](docs/sidebar-journey.md) for implementation details and troubleshooting

---

## Package-Specific Guidelines

### packages/api - ORPC Routers

**Router Pattern:**

```typescript
import { z } from 'zod';
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

### packages/db - Database Schemas

**Schema Pattern:**

```typescript
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const myTable = pgTable('my_table', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## Conventions & Standards

**Code Style:**

- Prettier + ESLint (auto-format on save)
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- File naming: `kebab-case` for files, `PascalCase` for components

**Branch Strategy:**

- `main` - production
- `develop` - development
- `feat/*` - feature branches

**TypeScript:**

- Strict mode enabled - **never use `any`**
- Always type props using `interface Props`
- Use Svelte 5 runes: `$state`, `$derived`, `$props`, `$effect`

---

## Security & Secrets

- **NEVER** commit tokens, API keys, or secrets
- Use `.env` files for environment variables
- All secrets validated through `@sambung-chat/env`
- Never log PII or sensitive data

---

## Common Pitfalls

| Issue                                    | Solution                                                         |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `@apply` with custom colors fails        | Use CSS variables: `background-color: hsl(var(--color-primary))` |
| Import `lucide-svelte` errors            | Change to `@lucide/svelte`                                       |
| `const` with `$state` errors             | Change to `let`                                                  |
| Files outside `src/lib/` not building    | Move to `src/lib/`                                               |
| **Sidebar Hydration Errors**             | **See [`docs/sidebar-journey.md`](docs/sidebar-journey.md)**     |
| Nested `Sidebar.Root` causing DOM errors | Use flex `<div>` container, don't nest `Sidebar.Root` components |
| Nested `Sidebar.Inset` in pages          | Only use `Sidebar.Inset` in layout, not in individual pages      |
| Tooltip SSR mismatch                     | Use `tooltipContent={undefined}` to disable when not needed      |

---

## Definition of Done

Before considering a task complete:

1. **TypeScript check passes:** `bun run check:types` ✓
2. **Build passes:** `bun run build` ✓
3. **No console errors** in browser/dev console ✓
4. **Code follows existing patterns** in that folder ✓
5. **Documentation updated** if adding new features ✓

---

## Troubleshooting

If you encounter build errors:

1. **Check `docs/TROUBLESHOOTING.md`** - Common errors and solutions
2. **Read sub-folder agents.md** - Location-specific patterns
3. **Run TypeScript check** - `bun run check:types`
4. **Check imports** - Ensure `@lucide/svelte` not `lucide-svelte`
5. **Verify CSS usage** - No `@apply` with custom colors

---

## Documentation References

**Start Here:**

- **[docs/index.md](docs/index.md)** - Documentation navigation hub
- **[docs/README.md](docs/README.md)** - Main documentation hub

**Team & Organization:**

- **[docs/teams-concept.md](docs/teams-concept.md)** - Team model, access control, workspaces
- **[docs/routes.md](docs/routes.md)** - Complete URL structure and routing
- **[docs/database.md](docs/database.md)** - Database tables and relationships

**Development Guides:**

- **[docs/getting-started.md](docs/getting-started.md)** - Installation & setup guide
- **[docs/i18n.md](docs/i18n.md)** - Internationalization with svelte-i18n
- **[docs/ai-provider-integration-guide.md](docs/ai-provider-integration-guide.md)** - AI provider integration

**Reference:**

- **[docs/architecture.md](docs/architecture.md)** - System architecture overview
- **[docs/api-reference.md](docs/api-reference.md)** - API endpoint documentation
- **[docs/troubleshooting.md](docs/troubleshooting.md)** - Common build errors
- **[docs/deployment.md](docs/deployment.md)** - Deployment guides
- **[plan-reference/ROADMAP.md](plan-reference/ROADMAP.md)** - Development timeline
- **[plan-reference/STATUS.md](plan-reference/STATUS.md)** - Current development status
