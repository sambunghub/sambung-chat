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

- **NO co-author tags** - Jangan gunakan `Co-Authored-By` di commit messages
- **Conventional commits**: `feat:`, `fix:`, `docs:`, `refactor:`, dll.
- **Hindari watermark** - Tidak menambahkan signature atau attribution di commits

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
