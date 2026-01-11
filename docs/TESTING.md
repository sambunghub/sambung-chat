# SambungChat Testing Guide

**Version:** 0.1.0
**Last Updated:** January 11, 2026

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Structure](#test-structure)
3. [Coverage Requirements](#coverage-requirements)
4. [Unit Testing](#unit-testing)
5. [Integration Testing](#integration-testing)
6. [E2E Testing](#e2e-testing)
7. [Test Data Management](#test-data-management)
8. [Running Tests](#running-tests)
9. [CI/CD Integration](#cicd-integration)

---

## Testing Philosophy

SambungChat follows a **backend-first testing approach**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Testing Pyramid                          │
│                                                             │
│                    ┌─────────┐                              │
│                    │   E2E   │  ← Playwright (10%)         │
│                   ─┴─────────┴─                              │
│                  ┌─────────────┐                            │
│                  │ Integration │  ← ORPC tests (20%)       │
│                 ─┴─────────────┴─                            │
│                ┌─────────────────┐                          │
│                │  Unit Tests (70%)│  ← Vitest              │
│                └─────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Principles

1. **Test First, Code Later** - Write tests before implementation (TDD)
2. **Backend Before Frontend** - API must be tested before UI integration
3. **Fast Feedback** - Unit tests should run in seconds
4. **Realistic Data** - Use factory pattern for test data
5. **Isolation** - Each test should be independent

---

## Test Structure

### Directory Layout

```
sambung-chat/
├── packages/
│   ├── api/
│   │   └── src/
│   │       ├── routers/
│   │       │   ├── chat.ts
│   │       │   ├── __tests__/
│   │       │   │   ├── chat.unit.test.ts      # Unit tests
│   │       │   │   └── chat.integration.test.ts # API integration
│   │       │   ├── message.ts
│   │       │   └── __tests__/
│   │       └── index.ts
│   │
│   └── db/
│       └── src/
│           └── schema/
│               └── __tests__/
│                   └── schema.test.ts
│
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── components/
│   │       │   ├── chat/
│   │       │   │   ├── ChatInterface.svelte
│   │       │   │   └── ChatInterface.test.ts
│   │       │   └── layout/
│   │       │       ├── NavigationRail.svelte
│   │       │       └── NavigationRail.test.ts
│   │       └── lib/
│   │           └── __tests__/
│   │               └── orpc.test.ts
│   │
│   └── tests/
│       └── e2e/
│           ├── auth.spec.ts
│           ├── chat.spec.ts
│           ├── prompt.spec.ts
│           └── settings.spec.ts
│
├── test/
│   ├── setup.ts             # Global test setup
│   ├── database.ts          # Test database utilities
│   ├── factories.ts         # Test data factories
│   └── mock-server.ts       # Mock API server
│
└── vitest.config.ts         # Vitest configuration
```

---

## Coverage Requirements

### Minimum Coverage Targets

| Layer                     | Target | Enforced       |
| ------------------------- | ------ | -------------- |
| **Backend (API)**         | 80%    | ✅ CI Required |
| **Database (Schema)**     | 70%    | ✅ CI Required |
| **Frontend (Components)** | 70%    | ⚠️ Recommended |
| **E2E (Critical Paths)**  | 100%   | ✅ CI Required |

### Critical Paths (Must Cover)

- ✅ User authentication (sign up, sign in, sign out)
- ✅ Chat creation and deletion
- ✅ Message sending and streaming
- ✅ API key management (CRUD)
- ✅ Prompt template management (CRUD)

---

## Unit Testing

### Setup: Vitest Configuration

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', '**/*.test.ts', '**/*.spec.ts', '**/dist/**'],
    },
  },
  resolve: {
    alias: {
      '@sambung-chat/api': './packages/api/src',
      '@sambung-chat/db': './packages/db/src',
      '@sambung-chat/ui': './packages/ui/src',
      $lib: './apps/web/src/lib',
    },
  },
});
```

### Test Setup

**File:** `test/setup.ts`

```typescript
import { vi } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.BETTER_AUTH_SECRET = 'test-secret-key';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

### Backend Unit Tests

**File:** `packages/api/src/routers/__tests__/chat.unit.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chatRouter } from '../chat';
import { db } from '@sambung-chat/db';
import { eq } from 'drizzle-orm';

// Mock database
vi.mock('@sambung-chat/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('chatRouter - Unit Tests', () => {
  const mockContext = {
    session: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return empty array when no chats exist', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const result = await chatRouter.getAll.handler({
        context: mockContext,
      });

      expect(result).toEqual([]);
      expect(db.select).toHaveBeenCalledTimes(1);
    });

    it('should return user chats ordered by updatedAt desc', async () => {
      const mockChats = [
        { id: 2, title: 'Chat 2', updatedAt: new Date('2026-01-11') },
        { id: 1, title: 'Chat 1', updatedAt: new Date('2026-01-10') },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockChats),
          }),
        }),
      } as any);

      const result = await chatRouter.getAll.handler({
        context: mockContext,
      });

      expect(result).toEqual(mockChats);
      expect(result[0].id).toBe(2); // Most recent first
    });

    it('should only return chats for current user', async () => {
      const mockChats = [{ id: 1, userId: 'test-user-id', title: 'My Chat' }];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockChats),
          }),
        }),
      } as any);

      await chatRouter.getAll.handler({ context: mockContext });

      // Verify where clause was called with user filter
      const whereFn = vi.mocked(db.select().from).mock.results[0].value.where;
      expect(whereFn).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create chat with provided title and model', async () => {
      const newChat = { id: 1, title: 'Test Chat', modelId: 'gpt-4' };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newChat]),
        }),
      } as any);

      const result = await chatRouter.create.handler({
        input: { title: 'Test Chat', modelId: 'gpt-4' },
        context: mockContext,
      });

      expect(result).toEqual(newChat);
      expect(db.insert).toHaveBeenCalledTimes(1);
    });

    it('should use default title when not provided', async () => {
      const newChat = { id: 1, title: 'New Chat', modelId: 'gpt-4' };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newChat]),
        }),
      } as any);

      const result = await chatRouter.create.handler({
        input: { modelId: 'gpt-4' },
        context: mockContext,
      });

      expect(result.title).toBe('New Chat');
    });

    it('should validate input with Zod schema', async () => {
      // Test invalid input
      await expect(
        chatRouter.create.handler({
          input: { title: '', modelId: 'gpt-4' }, // Empty title
          context: mockContext,
        })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete chat owned by user', async () => {
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowCount: 1 }),
      } as any);

      const result = await chatRouter.delete.handler({
        input: { id: 1 },
        context: mockContext,
      });

      expect(result).toEqual({ success: true });
    });
  });
});
```

### Frontend Component Tests

**File:** `apps/web/src/components/layout/__tests__/NavigationRail.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import NavigationRail from '../NavigationRail.svelte';

describe('NavigationRail', () => {
  const mockItems = [
    { id: 'chat', icon: 'MessageSquare', label: 'Chats' },
    { id: 'prompts', icon: 'Sparkles', label: 'Prompts' },
    { id: 'settings', icon: 'Settings', label: 'Settings' },
  ];

  it('should render all navigation items', () => {
    render(NavigationRail, {
      props: {
        items: mockItems,
        currentPage: 'chat',
      },
    });

    expect(screen.getByRole('button', { name: /chats/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /prompts/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('should highlight current page', () => {
    render(NavigationRail, {
      props: {
        items: mockItems,
        currentPage: 'chat',
      },
    });

    const chatButton = screen.getByRole('button', { name: /chats/i });
    expect(chatButton).toHaveClass('active');
  });

  it('should call onPageChange when item clicked', async () => {
    const mockPageChange = vi.fn();

    render(NavigationRail, {
      props: {
        items: mockItems,
        currentPage: 'chat',
        onPageChange: mockPageChange,
      },
    });

    const promptsButton = screen.getByRole('button', { name: /prompts/i });
    await fireEvent.click(promptsButton);

    expect(mockPageChange).toHaveBeenCalledWith('prompts');
  });
});
```

---

## Integration Testing

### API Integration Tests

**File:** `packages/api/src/routers/__tests__/chat.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient } from '@orpc/client/test';
import { appRouter } from '../index';
import { setupTestDB, teardownTestDB, seedTestData } from '@/test/database';

describe('chatRouter - Integration Tests', () => {
  let testClient;
  let testUser;

  beforeAll(async () => {
    // Setup test database
    await setupTestDB();

    // Create test user
    testUser = await seedTestData({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    // Create ORPC test client
    testClient = createTestClient(appRouter, {
      context: { session: { user: testUser } },
    });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should create and retrieve chat', async () => {
    // Create chat
    const created = await testClient.chat.create({
      title: 'Integration Test Chat',
      modelId: 'gpt-4',
    });

    expect(created).toHaveProperty('id');
    expect(created.title).toBe('Integration Test Chat');
    expect(created.userId).toBe(testUser.id);

    // Retrieve chat
    const retrieved = await testClient.chat.getById({
      id: created.id,
    });

    expect(retrieved.id).toBe(created.id);
    expect(retrieved.title).toBe(created.title);
  });

  it('should list all user chats', async () => {
    // Create multiple chats
    await testClient.chat.create({
      title: 'Chat 1',
      modelId: 'gpt-4',
    });

    await testClient.chat.create({
      title: 'Chat 2',
      modelId: 'gpt-4',
    });

    // List chats
    const chats = await testClient.chat.getAll();

    expect(chats.length).toBeGreaterThanOrEqual(2);
    chats.forEach((chat) => {
      expect(chat.userId).toBe(testUser.id);
    });
  });

  it('should prevent accessing other user chats', async () => {
    // Create another user
    const otherUser = await seedTestData({
      email: 'other@example.com',
      password: 'password123',
      name: 'Other User',
    });

    // Create chat as other user
    const otherClient = createTestClient(appRouter, {
      context: { session: { user: otherUser } },
    });

    const otherChat = await otherClient.chat.create({
      title: 'Other User Chat',
      modelId: 'gpt-4',
    });

    // Try to access as first user
    await expect(testClient.chat.getById({ id: otherChat.id })).rejects.toThrow();
  });

  it('should update chat title', async () => {
    const chat = await testClient.chat.create({
      title: 'Original Title',
      modelId: 'gpt-4',
    });

    const updated = await testClient.chat.update({
      id: chat.id,
      title: 'Updated Title',
    });

    expect(updated.title).toBe('Updated Title');
  });

  it('should delete chat', async () => {
    const chat = await testClient.chat.create({
      title: 'To Delete',
      modelId: 'gpt-4',
    });

    await testClient.chat.delete({ id: chat.id });

    // Verify deletion
    await expect(testClient.chat.getById({ id: chat.id })).rejects.toThrow();
  });
});
```

---

## E2E Testing

### Playwright Setup

**File:** `apps/web/tests/e2e/chat.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/chat');
  });

  test('should display navigation rail', async ({ page }) => {
    const navRail = page.locator('.navigation-rail');
    await expect(navRail).toBeVisible();

    const chatItem = page.locator('[data-testid="nav-chats"]');
    await expect(chatItem).toHaveClass(/active/);
  });

  test('should create new chat', async ({ page }) => {
    // Click new chat button
    await page.click('[data-testid="new-chat-button"]');

    // Verify new chat interface
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible();

    // Type message
    await chatInput.fill('Hello, AI!');
    await page.click('[data-testid="send-button"]');

    // Wait for user message
    await expect(page.locator('[data-testid="message-user"]')).toContainText('Hello, AI!');

    // Wait for AI response (with timeout for streaming)
    await expect(page.locator('[data-testid="message-assistant"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should switch between navigation items', async ({ page }) => {
    // Navigate to prompts
    await page.click('[data-testid="nav-prompts"]');
    await expect(page).toHaveURL('/prompts');

    // Navigate to settings
    await page.click('[data-testid="nav-settings"]');
    await expect(page).toHaveURL('/settings');

    // Navigate back to chats
    await page.click('[data-testid="nav-chats"]');
    await expect(page).toHaveURL('/chat');
  });

  test('should display chat list in secondary sidebar', async ({ page }) => {
    const sidebar = page.locator('.secondary-sidebar');
    await expect(sidebar).toBeVisible();

    // Should have new chat button
    const newChatBtn = page.locator('[data-testid="new-chat-button"]');
    await expect(newChatBtn).toBeVisible();
  });

  test('should delete chat', async ({ page }) => {
    // Create a chat first
    await page.click('[data-testid="new-chat-button"]');
    await page.fill('[data-testid="chat-input"]', 'Test chat');
    await page.click('[data-testid="send-button"]');

    // Go back to chat list
    await page.click('[data-testid="back-button"]');

    // Find and delete the chat
    const chatItem = page.locator('[data-testid="chat-item"]').first();
    await chatItem.click();
    await page.click('[data-testid="delete-chat-button"]');
    await page.click('[data-testid="confirm-delete"]');

    // Verify chat is deleted
    await expect(chatItem).not.toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('should sign up new user', async ({ page }) => {
    await page.goto('/register');

    await page.fill('[name="name"]', 'New User');
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to chat
    await expect(page).toHaveURL('/chat');
  });

  test('should sign out', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Sign out
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="sign-out"]');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});
```

---

## Test Data Management

### Factory Pattern

**File:** `test/factories.ts`

```typescript
import { db } from '@sambung-chat/db';
import { chats, messages, prompts, users } from '@sambung-chat/db/schema';

export const chatFactory = {
  build: (overrides = {}) => ({
    title: 'Test Chat',
    modelId: 'gpt-4',
    userId: 'test-user-id',
    ...overrides,
  }),

  create: async (overrides = {}) => {
    const data = chatFactory.build(overrides);
    const [chat] = await db.insert(chats).values(data).returning();
    return chat;
  },
};

export const messageFactory = {
  build: (overrides = {}) => ({
    chatId: 1,
    role: 'user',
    content: 'Test message',
    ...overrides,
  }),

  create: async (overrides = {}) => {
    const data = messageFactory.build(overrides);
    const [message] = await db.insert(messages).values(data).returning();
    return message;
  },
};

export const promptFactory = {
  build: (overrides = {}) => ({
    userId: 'test-user-id',
    name: 'Test Prompt',
    content: 'Test prompt content',
    variables: [],
    category: 'general',
    isPublic: false,
    ...overrides,
  }),

  create: async (overrides = {}) => {
    const data = promptFactory.build(overrides);
    const [prompt] = await db.insert(prompts).values(data).returning();
    return prompt;
  },
};
```

### Database Test Utilities

**File:** `test/database.ts`

```typescript
import { db } from '@sambung-chat/db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { users, chats, messages, prompts } from '@sambung-chat/db/schema';
import { eq } from 'drizzle-orm';

export async function setupTestDB() {
  // Run migrations
  await migrate(db, { migrationsFolder: 'migrations' });
}

export async function teardownTestDB() {
  // Clean up test data
  await db.delete(messages);
  await db.delete(chats);
  await db.delete(prompts);
  await db.delete(users);
}

export async function seedTestData(userData) {
  const [user] = await db
    .insert(users)
    .values({
      email: userData.email,
      name: userData.name,
      passwordHash: await hash(userData.password),
    })
    .returning();

  return user;
}

export async function createTestChat(userId, overrides = {}) {
  const [chat] = await db
    .insert(chats)
    .values({
      userId,
      title: 'Test Chat',
      modelId: 'gpt-4',
      ...overrides,
    })
    .returning();

  return chat;
}
```

---

## Running Tests

### Commands

```bash
# Run all tests
bun test

# Run unit tests only
bun test:unit

# Run integration tests only
bun test:integration

# Run E2E tests
bun test:e2e

# Run with coverage
bun test:coverage

# Watch mode
bun test:watch

# Run specific test file
bun test packages/api/src/routers/__tests__/chat.test.ts
```

### VS Code Integration

**Recommended Extensions:**

- `vitest.explorer` - Test explorer UI
- `Playwright Test for VSCode` - E2E test explorer

---

## CI/CD Integration

### GitHub Actions

**File:** `.github/workflows/ci.yml` (already configured)

```yaml
test:
  name: Test
  runs-on: ubuntu-latest
  needs: [build]
  steps:
    - name: Install dependencies
      run: bun install

    - name: Start database
      run: bun run db:start

    - name: Run tests
      run: bun test

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/coverage-final.json
```

---

## Best Practices

### DO ✅

1. **Write tests first** (TDD)
2. **Use descriptive test names** - `should return user chats when authenticated`
3. **Test one thing per test** - Single responsibility
4. **Use factories** instead of hardcoded data
5. **Clean up after tests** - Avoid state leakage
6. **Mock external services** - AI APIs, databases
7. **Test edge cases** - Empty results, errors, boundaries

### DON'T ❌

1. **Don't test implementation details** - Test behavior
2. **Don't use shared state** between tests
3. **Don't ignore flaky tests** - Fix them
4. **Don't test third-party code** - Trust the library
5. **Don't write slow tests** - Keep unit tests fast
6. **Don't over-mock** - Only mock external dependencies
7. **Don't skip tests** - They're there for a reason

---

## Troubleshooting

### Tests timing out

**Problem:** Tests timeout after 5 seconds

**Solution:**

```typescript
test('should stream response', async () => {
  // Increase timeout for this test
  await page.waitForSelector('[data-testid="done"]', {
    timeout: 30000, // 30 seconds
  });
});
```

### Database not connecting in tests

**Problem:** Tests fail with connection refused

**Solution:**

```bash
# Start test database
bun run db:start

# Verify connection
bun run db:studio
```

### Mock not working

**Problem:** vi.mock() doesn't mock the module

**Solution:**

```typescript
// Move mock to top of file, before imports
vi.mock('@sambung-chat/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

// Then import
import { db } from '@sambung-chat/db';
```

---

## Related Documents

- [BACKEND-FIRST-DEVELOPMENT](../plan-reference/BACKEND-FIRST-DEVELOPMENT.md) - Testing strategy
- [ORPC Reference](../plan-reference/generated/orpc-todo-reference.md) - ORPC test patterns
- [Architecture](./architecture.md) - System architecture

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
