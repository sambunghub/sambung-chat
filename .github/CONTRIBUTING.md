# Contributing to SambungChat

**Thank you for your interest in contributing to SambungChat!**

This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Backend-First Approach](#backend-first-approach)
6. [Testing Requirements](#testing-requirements)
7. [Commit Guidelines](#commit-guidelines)
8. [Pull Request Process](#pull-request-process)
9. [Resources](#resources)

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun** 1.0+
- **PostgreSQL** 14+
- **Git**

### Setup Development Environment

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/sambung-chat.git
cd sambung-chat

# 2. Install dependencies
bun install

# 3. Copy environment files
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env

# 4. Edit environment files
# Add your database URL and generate secrets
nano apps/server/.env

# 5. Start database
bun run db:start

# 6. Run migrations
bun run db:push

# 7. Start development servers
bun run dev
```

### Verify Setup

```bash
# Check types
bun run check-types

# Run tests
bun test

# Run linter
bun run lint

# Build all packages
bun run build
```

---

## Development Workflow

### 1. Choose an Issue

- Check [GitHub Issues](../../issues) for open issues
- Look for `good first issue` or `help wanted` labels
- Comment on the issue to claim it

### 2. Create a Branch

```bash
# From develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Or fix branch
git checkout -b fix/your-bug-fix
```

**Branch Naming:**

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

### 3. Development Process

Follow the **backend-first approach**:

```
┌─────────────────────────────────────────────────────────┐
│  1. BACKEND                                             │
│     ├── Define database schema                         │
│     ├── Create ORPC router                             │
│     ├── Write unit tests                               │
│     ├── Run tests (all pass) ✅                        │
│     └── Document API                                   │
│                                                         │
│  2. FRONTEND                                            │
│     ├── Create/update UI components                    │
│     ├── Integrate with ORPC API                        │
│     ├── Write component tests                          │
│     ├── Run tests (all pass) ✅                        │
│     └── Test in browser                                │
│                                                         │
│  3. VALIDATE                                            │
│     ├── Type check: bun run check-types ✅             │
│     ├── Lint: bun run lint ✅                          │
│     ├── Build: bun run build ✅                        │
│     └── Tests: bun test ✅                             │
└─────────────────────────────────────────────────────────┘
```

### 4. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with conventional message
git commit -m "feat(chat): add streaming message support"
```

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

---

## Coding Standards

### TypeScript

- Use **TypeScript strict mode**
- Avoid `any` type unless absolutely necessary
- Use type inference where appropriate
- Export types for reusable interfaces

```typescript
// ✅ Good
interface Chat {
  id: number;
  title: string;
  userId: string;
}

async function getChat(id: number): Promise<Chat> {
  // ...
}

// ❌ Bad
async function getChat(id: any): Promise<any> {
  // ...
}
```

### Svelte 5

- Use **runes** (`$state`, `$derived`, `$props`)
- Avoid deprecated Svelte 4 syntax
- Use snippets for children rendering

```svelte
<!-- ✅ Good (Svelte 5 Runes) -->
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);

  interface Props {
    initial?: number;
  }
  let { initial = 0 }: Props = $props();
</script>

<!-- ❌ Bad (Svelte 4 syntax) -->
<script lang="ts">
  export let count = 0;
  $: doubled = count * 2;
</script>
```

### ORPC Routers

- Use **Zod** for input validation
- Use **protectedProcedure** for authenticated endpoints
- Return typed data

```typescript
// ✅ Good
export const chatRouter = {
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        modelId: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      const chat = await db
        .insert(chats)
        .values({
          userId: context.session.user.id,
          ...input,
        })
        .returning();
      return chat[0];
    }),
};
```

### File Organization

```
packages/api/src/routers/
├── chat.ts          # Feature router
├── message.ts       # Feature router
├── __tests__/       # Tests co-located
│   ├── chat.unit.test.ts
│   └── chat.integration.test.ts
└── index.ts         # Root router
```

---

## Backend-First Approach

SambungChat follows a strict backend-first development methodology.

### Why Backend-First?

1. **API Stability** - Frontend depends on working API
2. **Type Safety** - ORPC ensures end-to-end type safety
3. **Parallel Work** - Backend and frontend can be developed independently
4. **Test Coverage** - Easier to test business logic in isolation

### Implementation Order

**Step 1: Database Schema**

```typescript
// packages/db/src/schema/chat.ts
export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  title: text('title').notNull(),
  modelId: text('model_id').notNull(),
});
```

**Step 2: ORPC Router**

```typescript
// packages/api/src/routers/chat.ts
export const chatRouter = {
  getAll: protectedProcedure.handler(async ({ context }) => {
    return await db.select().from(chats).where(eq(chats.userId, context.session.user.id));
  }),
};
```

**Step 3: Unit Tests**

```typescript
// packages/api/src/routers/__tests__/chat.test.ts
describe('chatRouter', () => {
  it('should return user chats', async () => {
    const result = await chatRouter.getAll.handler({
      context: mockContext,
    });
    expect(result).toBeInstanceOf(Array);
  });
});
```

**Step 4: Frontend Integration**

```svelte
<!-- apps/web/src/routes/chat/+page.svelte -->
<script lang="ts">
  const chatsQuery = createQuery(orpc.chat.getAll.queryOptions());
</script>
```

---

## Testing Requirements

### Test Coverage

| Layer                 | Minimum Coverage |
| --------------------- | ---------------- |
| Backend (API)         | 80%              |
| Frontend (Components) | 70%              |
| E2E (Critical Paths)  | 100%             |

### Running Tests

```bash
# All tests
bun test

# Unit tests
bun test:unit

# Integration tests
bun test:integration

# E2E tests
bun test:e2e

# Coverage
bun test:coverage
```

### Writing Tests

**Unit Tests:**

- Test business logic in isolation
- Mock external dependencies
- Fast execution (< 1s per test)

**Integration Tests:**

- Test API endpoints
- Use test database
- Verify end-to-end flows

**E2E Tests:**

- Test critical user paths
- Use Playwright
- Cover: auth, chat creation, messaging

---

## Commit Guidelines

### Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Usage                           |
| ---------- | ------------------------------- |
| `feat`     | New feature                     |
| `fix`      | Bug fix                         |
| `docs`     | Documentation changes           |
| `style`    | Code style changes (formatting) |
| `refactor` | Code refactoring                |
| `test`     | Adding or updating tests        |
| `chore`    | Maintenance tasks               |
| `perf`     | Performance improvements        |

### Examples

```bash
# Feature
git commit -m "feat(chat): add message streaming support"

# Bug fix
git commit -m "fix(auth): resolve session token expiration issue"

# Documentation
git commit -m "docs(api): update ORPC reference guide"

# Refactor
git commit -m "refactor(db): extract common query builders"

# Tests
git commit -m "test(chat): add integration tests for chat API"
```

### Breaking Changes

```bash
feat(api): change chat.create input schema

BREAKING CHANGE: title field is now required
```

---

## Pull Request Process

### Before Submitting

- [ ] All tests pass: `bun test`
- [ ] Type check passes: `bun run check-types`
- [ ] Linter passes: `bun run lint`
- [ ] Build succeeds: `bun run build`
- [ ] Code follows standards
- [ ] Tests added/updated
- [ ] Documentation updated

### PR Title

Use conventional commit format:

```
feat(chat): add message streaming support
fix(auth): resolve session validation error
docs(readme): update installation instructions
```

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests passing

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Comments added to complex code

## Related Issues

Fixes #123
Related to #456
```

### Review Process

1. **Automated Checks** - CI runs tests, lint, type check
2. **Code Review** - Maintainers review code
3. **Address Feedback** - Make requested changes
4. **Approval** - At least one maintainer approval
5. **Merge** - Squashed and merged to `develop`

---

## Project Structure

```
sambung-chat/
├── apps/
│   ├── web/          # SvelteKit frontend
│   └── server/       # Hono backend
├── packages/
│   ├── api/          # ORPC routers
│   ├── auth/         # Better Auth
│   ├── db/           # Drizzle schema
│   ├── env/          # Environment validation
│   └── ui/           # shadcn-svelte components
├── docs/             # Public documentation
├── plan-reference/   # Internal planning docs
└── .github/          # GitHub templates
```

### Where to Put Code

| What             | Where                                              |
| ---------------- | -------------------------------------------------- |
| New API endpoint | `packages/api/src/routers/[feature].ts`            |
| Database table   | `packages/db/src/schema/[table].ts`                |
| UI component     | `packages/ui/src/components/[Component].svelte`    |
| Page route       | `apps/web/src/routes/[route]/+page.svelte`         |
| Utility function | `apps/web/src/lib/utils.ts` or appropriate package |
| Tests            | Co-located: `__tests__/` next to source            |

---

## Getting Help

### Documentation

- [Getting Started](../docs/getting-started.md)
- [API Reference](../docs/api-reference.md)
- [Testing Guide](../docs/TESTING.md)
- [Database Docs](../docs/DATABASE.md)
- [Backend-First Dev Plan](../plan-reference/BACKEND-FIRST-DEVELOPMENT.md)

### AGENTS Reference

- [Main AGENTS.md](../plan-reference/AGENTS.md) - Project overview
- [ORPC Reference](../plan-reference/generated/orpc-todo-reference.md) - ORPC patterns

### Communication

- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - Questions and ideas
- **Pull Requests** - Code contributions

---

## Recognition

Contributors will be:

- Listed in `CONTRIBUTORS.md`
- Mentioned in release notes for significant contributions
- Credited in relevant documentation

---

## License

By contributing, you agree that your contributions will be licensed under the **AGPL-3.0** License.

---

## Resources

### External Links

- [Svelte 5 Documentation](https://svelte.dev/docs)
- [Hono Documentation](https://hono.dev)
- [ORPC Documentation](https://orpc.unnoq.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [Better Auth](https://www.better-auth.com)

### Internal Docs

- [Architecture](../docs/architecture.md)
- [Deployment](../docs/deployment.md)
- [Environment Config](../docs/ENVIRONMENT.md)

---

**Happy Contributing! 🚀**

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
