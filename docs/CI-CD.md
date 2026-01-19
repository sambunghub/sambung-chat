# CI/CD Guide for SambungChat

**Version:** 1.0.0
**Last Updated:** January 19, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [CI Pipeline Architecture](#ci-pipeline-architecture)
3. [Required Environment Variables](#required-environment-variables)
4. [Simulating CI Locally](#simulating-ci-locally)
5. [Pre-commit Hooks](#pre-commit-hooks)
6. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
7. [AI Guidelines for CI](#ai-guidelines-for-ci)

---

## Overview

SambungChat uses GitHub Actions for continuous integration. All code must pass CI checks before merging to `develop` or `main` branches.

### CI Jobs

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions CI                        │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │Type Check  │  │   Lint     │  │PR Title    │           │
│  │  (10s)     │  │  (15s)     │  │  Check     │           │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘           │
│        │               │               │                    │
│        └───────────────┴───────────────┘                    │
│                        │                                    │
│                        ▼                                    │
│  ┌────────────────────────────────────────────────────┐   │
│  │                  Build (45s)                       │   │
│  └──────────────────────────┬─────────────────────────┘   │
│                             │                              │
│              ┌──────────────┼──────────────┐              │
│              ▼              ▼              ▼              │
│     ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│     │Unit Tests  │  │E2E Tests   │  │  Status    │        │
│     │  (20s)     │  │  (2min)    │  │  Check     │        │
│     └────────────┘  └────────────┘  └────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## CI Pipeline Architecture

### Job Dependencies

```yaml
pr-title-check ───→ (5s - no dependencies)
type-check   ────┐
lint         ────┼──→ test-unit (~20s)
pr-title-check┘          └──→ build (~45s)
```

> **NOTE:** Jobs are now ordered by execution time (fastest to slowest). E2E tests are temporarily disabled.

### Workflow File

**Location:** `.github/workflows/ci.yml`

**Critical Sections:**

#### 1. Unit Test Job (CRITICAL - Must Include Env Vars)

```yaml
test-unit:
  name: Unit Tests
  runs-on: ubuntu-latest
  needs: [type-check, lint]
  steps:
    - uses: actions/checkout@v4

    - uses: oven-sh/setup-bun@v2
      with:
        bun-version: latest

    - name: Install dependencies
      run: bun install

    - name: Run unit tests
      run: bun run test:unit
      env:
        # ⚠️ REQUIRED - Tests will FAIL without these
        DATABASE_URL: postgresql://test:test@localhost:5432/test
        BETTER_AUTH_SECRET: test-secret-minimum-32-characters-long
        BETTER_AUTH_URL: http://localhost:3000
        BETTER_AUTH_CLIENT_ID: test-client-id
        CORS_ORIGIN: http://localhost:5174
        PUBLIC_SERVER_URL: http://localhost:3000
        PUBLIC_API_URL: http://localhost:3000
```

#### 2. Build Job

```yaml
build:
  name: Build
  runs-on: ubuntu-latest
  needs: [type-check, lint]
  steps:
    - uses: actions/checkout@v4

    - uses: oven-sh/setup-bun@v2
      with:
        bun-version: latest

    - name: Install dependencies
      run: bun install

    - name: Build
      run: bun run build
      env:
        # Required for build-time environment variables
        PUBLIC_SERVER_URL: http://localhost:3000
```

---

## Required Environment Variables

### For Unit Tests

| Variable                | Value                                        | Purpose            | Required By         |
| ----------------------- | -------------------------------------------- | ------------------ | ------------------- |
| `DATABASE_URL`          | `postgresql://test:test@localhost:5432/test` | Test DB connection | `@sambung-chat/env` |
| `BETTER_AUTH_SECRET`    | `test-secret-minimum-32-characters-long`     | Auth validation    | `@sambung-chat/env` |
| `BETTER_AUTH_URL`       | `http://localhost:3000`                      | Auth base URL      | `@sambung-chat/env` |
| `BETTER_AUTH_CLIENT_ID` | `test-client-id`                             | OAuth client ID    | `@sambung-chat/env` |
| `CORS_ORIGIN`           | `http://localhost:5174`                      | CORS settings      | `@sambung-chat/env` |
| `PUBLIC_SERVER_URL`     | `http://localhost:3000`                      | Server URL         | `@sambung-chat/env` |
| `PUBLIC_API_URL`        | `http://localhost:3000`                      | API URL            | `@sambung-chat/env` |

### For Build

| Variable            | Value                   | Purpose               |
| ------------------- | ----------------------- | --------------------- |
| `PUBLIC_SERVER_URL` | `http://localhost:3000` | Build-time public URL |

### For Development

**File:** `.env` (root directory)

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sambung_chat"

# Auth
BETTER_AUTH_SECRET="your-secret-minimum-32-characters-long"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_CLIENT_ID="sambung-chat"

# CORS
CORS_ORIGIN="http://localhost:5174"

# Public URLs
PUBLIC_SERVER_URL="http://localhost:3000"
PUBLIC_API_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

---

## Simulating CI Locally

### Method 1: Direct Export (Linux/Mac)

```bash
# Export all required environment variables
export DATABASE_URL="postgresql://test:test@localhost:5432/test"
export BETTER_AUTH_SECRET="test-secret-minimum-32-characters-long"
export BETTER_AUTH_URL="http://localhost:3000"
export BETTER_AUTH_CLIENT_ID="test-client-id"
export CORS_ORIGIN="http://localhost:5174"
export PUBLIC_SERVER_URL="http://localhost:3000"
export PUBLIC_API_URL="http://localhost:3000"

# Run tests
bun run test:unit
```

### Method 2: Using .env.test

**File:** `.env.test`

```bash
DATABASE_URL="postgresql://test:test@localhost:5432/test"
BETTER_AUTH_SECRET="test-secret-minimum-32-characters-long"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_CLIENT_ID="test-client-id"
CORS_ORIGIN="http://localhost:5174"
PUBLIC_SERVER_URL="http://localhost:3000"
PUBLIC_API_URL="http://localhost:3000"
```

**Run with:**

```bash
# Load .env.test before running tests
export $(cat .env.test | xargs) && bun run test:unit

# Or use dotenv-cli
bunx dotenv-cli -e .env.test -- bun run test:unit
```

### Method 3: Full CI Simulation

```bash
# Run all checks in sequence (same as CI)
bun run check-types  # Type check
bun run lint         # ESLint
bun run build        # Build
bun run test:unit    # Unit tests
```

---

## Pre-commit Hooks

### What Runs Before Commit

**File:** `.husky/pre-commit`

```bash
# 1. Format staged files
bunx lint-staged

# 2. Run ESLint
bun run lint

# 3. Run svelte-check (web app)
cd apps/web && bun run check && cd ../..

# 4. Full build
bun run build
```

### Requirements for Commit

| Check      | Command         | Status                      |
| ---------- | --------------- | --------------------------- |
| Format     | `lint-staged`   | ✅ Must pass                |
| Lint       | `bun run lint`  | ✅ Warnings OK, errors fail |
| Type Check | `svelte-check`  | ✅ Must pass                |
| Build      | `bun run build` | ✅ Must pass                |

### Skipping Pre-commit (Not Recommended)

```bash
# Skip with --no-verify (USE SPARINGLY)
git commit --no-verify -m "WIP: work in progress"
```

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Tests Fail with "Undefined Environment Variables"

**Error:**

```
Invalid environment variables: [
  { path: ['DATABASE_URL'], message: 'expected string, received undefined' }
]
```

**Cause:** CI job doesn't have environment variables set.

**Solution:** Add `env:` section to `test-unit` job in `.github/workflows/ci.yml`

```yaml
- name: Run unit tests
  run: bun run test:unit
  env:
    DATABASE_URL: postgresql://test:test@localhost:5432/test
    # ... add all required vars
```

---

### ❌ Pitfall 2: Type Check Fails with "Cannot find name 'describe'"

**Error:**

```
Cannot find name 'describe'. Do you need to install type definitions for a test runner?
```

**Cause:** TypeScript doesn't know about Vitest globals.

**Solution:** Add `vitest/globals` to tsconfig types array

```json
// apps/server/tsconfig.json
{
  "compilerOptions": {
    "types": ["vitest/globals", "bun"]
  }
}
```

---

### ❌ Pitfall 3: Pre-commit Hook Fails

**Error:**

```
🔍 Pre-commit checks started...
❌ ESLint failed - fix errors before committing
```

**Cause:** Code has linting errors.

**Solution:** Fix linting errors first

```bash
# Auto-fix what can be fixed
bun run lint:fix

# Commit again
git add .
git commit -m "fix: resolve linting errors"
```

---

### ❌ Pitfall 4: Port Mismatch in Tests

**Error:**

```
expected 'http://localhost:5174' to be 'http://localhost:5173'
```

**Cause:** Test assertions use old port number.

**Solution:** Update test to use current port

```typescript
// Check your .env file for correct port
expect(process.env.CORS_ORIGIN).toBe('http://localhost:5174');
```

---

### ❌ Pitfall 5: Workflow Push Fails with "workflow scope"

**Error:**

```
refusing to allow an OAuth App to create or update workflow
without `workflow` scope
```

**Cause:** GitHub token doesn't have workflow scope.

**Solution:** Use SSH instead of HTTPS

```bash
# Switch to SSH
git remote set-url origin git@github.com:sambunghub/sambung-chat.git

# Or refresh token with workflow scope
gh auth refresh -h github.com -s workflow
```

---

## AI Guidelines for CI

### For AI Assistants (Claude, Copilot, etc.)

#### ✅ DO - When Working with CI

1. **Always check CI environment variables first** when tests fail
2. **Update `.github/workflows/ci.yml`** when adding new environment variables
3. **Test locally with CI environment** before pushing
4. **Follow the pre-commit checklist** - don't skip checks

#### ❌ DON'T - Common AI Mistakes

1. **Don't rely on `.env` file being loaded in CI** - It's NOT loaded
2. **Don't add tests that require secrets** - Use test values instead
3. **Don't skip environment variables in test jobs** - Tests WILL fail
4. **Don't assume CI has the same environment** as local development

### Code Review Checklist for AI

Before suggesting code changes, verify:

- [ ] Does this change require new environment variables?
- [ ] If yes, are they added to `.github/workflows/ci.yml`?
- [ ] Are tests updated to handle new environment?
- [ ] Does this work in CI environment (no `.env` file)?
- [ ] Are port numbers correct in test assertions?

### Example: Correct AI Response

````markdown
I noticed you're adding a new environment variable `NEW_FEATURE_ENABLED`.
For this to work in CI, we need to:

1. Add it to the test-unit job in `.github/workflows/ci.yml`:
   ```yaml
   env:
     NEW_FEATURE_ENABLED: 'true'
   ```
````

2. Update the test to check for the value:

   ```typescript
   expect(process.env.NEW_FEATURE_ENABLED).toBeDefined();
   ```

3. Document it in `.env.example` for other developers.

Would you like me to make these changes?

````

---

## Quick Reference

### CI Commands

```bash
# Type check (runs in CI)
bun run check-types

# Lint (runs in CI)
bun run lint

# Build (runs in CI)
bun run build

# Unit tests (runs in CI)
bun run test:unit

# E2E tests (runs in CI)
bun run test:e2e

# Full CI simulation
bun run check-types && bun run lint && bun run build && bun run test:unit
````

### Environment Variable Locations

| Purpose               | File                       | Loaded By      |
| --------------------- | -------------------------- | -------------- |
| **Local Development** | `.env`                     | Bun, Node.js   |
| **CI Unit Tests**     | `.github/workflows/ci.yml` | GitHub Actions |
| **Documentation**     | `.env.example`             | Developers     |
| **Production**        | GitHub Secrets             | Deployment     |

### Port Reference

| Port   | Service          | Environment |
| ------ | ---------------- | ----------- |
| `3000` | Backend (Server) | All         |
| `5173` | Web (Old)        | Legacy      |
| `5174` | Web (Current)    | Development |
| `5432` | PostgreSQL       | All         |

---

## Related Documents

- [Testing Guide](./testing.md) - Comprehensive testing strategies
- [Environment Variables](./ENVIRONMENT.md) - Full environment reference
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and fixes
- [CLAUDE.md](../CLAUDE.md) - Project guidelines for AI

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
