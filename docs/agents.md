# SambungChat - AI Agent Reference

**IMPORTANT: Always read the relevant sub-folder AGENTS.md before making changes.**

---

## Project Snapshot

Monorepo (Turborepo) building an open-source multi-model LLM client platform.
**Tech Stack:** SvelteKit 5 + Svelte 5 Runes, Hono, Drizzle ORM, Better Auth, Tailwind CSS v4, PostgreSQL
**Runtime:** Bun

**CRITICAL: Before ANY build task, always run TypeScript check first:**

```bash
# ALWAYS run this before building
bun run check:types

# Or for specific package
cd packages/ui && bun run check
```

If TypeScript check fails, **DO NOT attempt build** - fix type errors first.

---

## Root Setup Commands

```bash
# Install dependencies
bun install

# Type check ENTIRE monorepo (DO THIS FIRST)
bun run check:types

# Build entire monorepo
bun run build

# Start all development servers
bun run dev

# Database operations
bun run db:generate  # Generate migrations
bun run db:push      # Push schema changes
bun run db:studio    # Open Drizzle Studio
```

---

## Universal Conventions

- **Code Style:** Prettier + ESLint (auto-format on save)
- **Commit Format:** Conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- **Branch Strategy:** `main` (production), `develop` (development), `feature/*` (features)
- **TypeScript:** Strict mode enabled - never use `any`, always type props
- **File Naming:** `kebab-case` for files, `PascalCase` for components, `camelCase` for functions

---

## Security & Secrets

- **NEVER** commit tokens, API keys, or secrets
- Use `.env` files for environment variables
- All secrets should use `@sambung-chat/env` package
- Never log PII or sensitive data

---

## JIT Index - Read Sub-Folder Documentation

### For UI Package Changes

- **Location:** `packages/ui/` → [see packages/ui/AGENTS.md](packages/ui/AGENTS.md)
- **Critical Read:** [docs/UI-PACKAGE-GUIDE.md](docs/UI-PACKAGE-GUIDE.md)
- **Pre-build Check:** `cd packages/ui && bun run check`

### For Web App Changes

- **Location:** `apps/web/` → [see apps/web/AGENTS.md](apps/web/AGENTS.md)
- **Pre-build Check:** `cd apps/web && bun run check`

### For API/Backend Changes

- **Location:** `apps/server/` → [see apps/server/AGENTS.md](apps/server/AGENTS.md)
- **Package API:** `packages/api/` → [see packages/api/AGENTS.md](packages/api/AGENTS.md)

### For Database Changes

- **Location:** `packages/db/` → [see packages/db/AGENTS.md](packages/db/AGENTS.md)

---

## Quick Find Commands

```bash
# Search function across all packages
rg -n "functionName" apps/** packages/**

# Find component by name
rg -n "ComponentName" packages/ui/src apps/web/src

# Find API routes
rg -n "export const (GET|POST|PUT|DELETE)" apps/server/src

# Find type definitions
rg -n "interface|type" packages/** --type ts

# Find all svelte files
find . -name "*.svelte" -type f

# Check for TODO/FIXME comments
rg -n "TODO|FIXME" apps/** packages/**
```

---

## Definition of Done

Before considering a task complete, ensure:

1. **TypeScript Check Passes:** `bun run check:types` ✓
2. **Build Passes:** `bun run build` ✓
3. **No Console Errors:** Check browser/dev console for errors
4. **Code Follows Patterns:** Matches existing code patterns in that folder
5. **Documentation Updated:** If adding new features, update relevant docs

---

## Troubleshooting - Read First!

If you encounter build errors, **ALWAYS** check these first:

1. **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common build errors and solutions
2. **[docs/UI-PACKAGE-GUIDE.md](docs/UI-PACKAGE-GUIDE.md)** - UI package development issues
3. **Sub-folder AGENTS.md** - Location-specific issues and patterns

**Most Common Errors:**

- `@apply` with custom colors → Use CSS variables instead (see TROUBLESHOOTING.md)
- Import `lucide-svelte` → Use `@lucide/svelte` instead
- `const` with `$state` → Use `let` instead
- Files outside `src/lib/` not building → Move to `src/lib/` for svelte-package

---

## Package Structure Overview

```
sambung-chat/
├── apps/
│   ├── web/          # SvelteKit frontend → apps/web/AGENTS.md
│   └── server/       # Hono backend → apps/server/AGENTS.md
├── packages/
│   ├── ui/           # UI component library → packages/ui/AGENTS.md ⚠️ CRITICAL
│   ├── api/          # API routers → packages/api/AGENTS.md
│   ├── auth/         # Better Auth → packages/auth/AGENTS.md
│   ├── db/           # Database schemas → packages/db/AGENTS.md
│   ├── env/          # Environment variables
│   └── config/       # Shared config
├── docs/             # Documentation → docs/README.md
│   ├── TROUBLESHOOTING.md
│   └── UI-PACKAGE-GUIDE.md
└── plan-reference/   # Planning docs
```

---

## Agent Workflow - CRITICAL

When starting ANY task:

1. **READ** the sub-folder AGENTS.md first
2. **CHECK** TypeScript: `bun run check:types`
3. **READ** relevant docs if troubleshooting
4. **MAKE** changes following existing patterns
5. **VERIFY** TypeScript check passes
6. **BUILD** to confirm everything works
7. **UPDATE** documentation if adding new patterns

**Never skip the TypeScript check!** It catches 90% of issues before build.
