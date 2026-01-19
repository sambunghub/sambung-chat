# SambungChat: Backend-First Development Plan

**Version:** 1.0
**Last Updated:** January 11, 2026
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [UI/UX Documentation Analysis](#uiux-documentation-analysis)
3. [Recommended Improvements](#recommended-improvements)
4. [Navigation Layout Redesign](#navigation-layout-redesign)
5. [Backend Module Breakdown](#backend-module-breakdown)
6. [Testing Strategy](#testing-strategy)
7. [Implementation Order](#implementation-order)
8. [API Alignment with UI/UX](#api-alignment-with-uiux)
9. [ROADMAP Alignment](#roadmap-alignment)

---

## Executive Summary

This document outlines a **backend-first development approach** for SambungChat MVP (Phase 1: Weeks 1-12). The strategy prioritizes:

1. **Backend modules first** - Build and test each API endpoint before frontend
2. **Unit tests for every module** - Ensure business logic is validated
3. **Type safety through ORPC** - End-to-end type safety from DB to UI
4. **Iterative development** - Build one feature module at a time

### Key Principle

> **"Backend First, Then Frontend, Always Validated with Tests"**

---

## UI/UX Documentation Analysis

### Current State

The [ui-ux-design.md](./ui-ux-design.md) document provides:

| Section                                  | Status             | Quality     |
| ---------------------------------------- | ------------------ | ----------- |
| Design System (OKLCH colors, typography) | ✅ Complete        | Excellent   |
| Page Structure & Routes                  | ✅ Complete        | Good        |
| Component Hierarchy                      | ✅ Complete        | Good        |
| Layout Specifications                    | ⚠️ Needs Update    | See below   |
| User Flows                               | ✅ Complete        | Good        |
| Component Specifications                 | ✅ Complete        | Good        |
| Responsive Breakpoints                   | ✅ Complete        | Good        |
| Implementation Priority                  | ⚠️ Needs Alignment | See ROADMAP |

### What's Working Well

1. **Design System**: OKLCH color palette with teal primary (#208B8D) and orange accent (#E67E50) is modern and accessible
2. **Typography**: Inter font family with Tailwind scale is production-ready
3. **Component Specifications**: TypeScript interfaces are well-defined
4. **Accessibility**: WCAG 2.1 AA compliance with keyboard shortcuts

### What Needs Improvement

1. **Layout Pattern**: Current design shows single sidebar, but user wants **navigation rail + sidebar** pattern
2. **Mobile Experience**: Bottom nav is fine, but navigation rail could improve tablet experience
3. **Implementation Priority**: Doesn't align perfectly with backend-first approach
4. **API Integration References**: Some components reference APIs that don't exist yet

---

## Recommended Improvements

### 1. Navigation Layout Redesign

Based on user feedback and modern design patterns (Material Design 3), implement a **dual-sidebar layout**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Header (Logo, Search, User Menu)                │
├──────┬───────────────────────────────────────────────────────────────────────┤
│      │                                                                       │
│ Nav  │        Content Area                                                    │
│ Rail │  ┌─────────────────────────────────────────────────────────────────┐  │
│ (64px)│  │                                                                 │  │
│      │  │         Chat Interface / Prompts / Settings                      │  │
│ ┌──┐ │  │                                                                 │  │
│ │💬│ │  │                                                                 │  │
│ ├──┤ │  │                                                                 │  │
│ │✨│ │  │                                                                 │  │
│ ├──┤ │  │                                                                 │  │
│ │⚙️│ │  │                                                                 │  │
│ └──┘ │  └─────────────────────────────────────────────────────────────────┘  │
│      │                                                                       │
├──────┼───────────────────────────────────────────────────────────────────────┤
│      │       Secondary Sidebar (Context-Aware)                               │
│      │  ┌─────────────────────────────────────────────────────────────────┐  │
│      │  │  [+ New Chat]                                                   │  │
│      │  │  ────────────────────────────────────────────────────────────   │  │
│      │  │  📄 Chat: Meaninging of Life                     2m ago        │  │
│      │  │  📄 Chat: Python Tutorial                       1h ago        │  │
│      │  │  📄 Chat: React vs Svelte                      3h ago        │  │
│      │  │                                                                 │  │
│      │  │  [Search chats...]                                               │  │
│      │  └─────────────────────────────────────────────────────────────────┘  │
└──────┴───────────────────────────────────────────────────────────────────────┘
```

**Navigation Rail (64px)** - Always visible icons:

- 💬 Chats
- ✨ Prompts
- ⚙️ Settings

**Secondary Sidebar (280px)** - Context-aware:

- Chats page: Shows chat list
- Prompts page: Shows prompt categories
- Settings page: Shows settings navigation
- Collapsible on tablet/mobile

### 2. Component File Structure Update

```
apps/web/src/components/
├── layout/
│   ├── AppLayout.svelte              # Main layout wrapper
│   ├── NavigationRail.svelte         # Left icon rail (64px)
│   ├── SecondarySidebar.svelte       # Context sidebar (280px, collapsible)
│   └── Header.svelte                 # Top header
│
├── chat/
│   ├── ChatInterface.svelte
│   ├── MessageList.svelte
│   ├── Message.svelte
│   ├── ChatInput.svelte
│   └── ModelSelector.svelte
│
├── prompts/
│   ├── PromptLibrary.svelte
│   ├── PromptCard.svelte
│   └── PromptEditor.svelte
│
└── settings/
    ├── SettingsPage.svelte
    ├── APIKeyManager.svelte
    └── AppearanceSettings.svelte
```

### 3. Implementation Priority Updates

| Priority | Component                | Backend Dependency                    |
| -------- | ------------------------ | ------------------------------------- |
| P0       | NavigationRail           | None (static)                         |
| P0       | SecondarySidebar (chats) | `chat.getAll` API                     |
| P0       | ChatInterface            | `chat.getById`, `message.stream` APIs |
| P1       | PromptLibrary            | `prompt.getAll`, `prompt.create` APIs |
| P1       | APIKeyManager            | `apiKey.getAll`, `apiKey.create` APIs |
| P2       | Settings pages           | `user.updateSettings` API             |

---

## Navigation Layout Redesign

### Navigation Rail Component

**Purpose**: Always-visible, narrow navigation strip with icon-only buttons.

**Design Specifications**:

```typescript
// apps/web/src/components/layout/NavigationRail.svelte
interface Props {
  currentPage: 'chat' | 'prompts' | 'settings';
  onPageChange: (page: string) => void;
}

const NAVIGATION_ITEMS = [
  { id: 'chat', icon: 'MessageSquare', label: 'Chats' },
  { id: 'prompts', icon: 'Sparkles', label: 'Prompts' },
  { id: 'settings', icon: 'Settings', label: 'Settings' },
] as const;
```

**Styling**:

```css
.navigation-rail {
  width: 64px;
  background: var(--background);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
  gap: 0.5rem;
}

.nav-item {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.nav-item:hover {
  background: var(--muted);
}

.nav-item.active {
  background: var(--primary);
  color: var(--primary-foreground);
}
```

### Secondary Sidebar Component

**Purpose**: Context-aware panel that changes content based on current page.

**Design Specifications**:

```typescript
// apps/web/src/components/layout/SecondarySidebar.svelte
interface Props {
  currentPage: 'chat' | 'prompts' | 'settings';
  isCollapsed: boolean;
  onToggle: () => void;
}
```

**Responsive Behavior**:

- **Desktop (> 1024px)**: Always visible (280px)
- **Tablet (768px - 1024px)**: Collapsed to icons (64px), expands on hover
- **Mobile (< 768px)**: Hidden, slide-in drawer from left

### Updated Route Structure

```
apps/web/src/routes/
├── (app)/
│   ├── chat/
│   │   ├── +page.svelte              # Chat list / home
│   │   └── [id]/
│   │       └── +page.svelte          # Individual chat view
│   ├── prompts/
│   │   ├── +page.svelte              # Prompt library
│   │   └── new/+page.svelte          # Create prompt
│   ├── settings/
│   │   ├── +page.svelte              # Settings home
│   │   ├── api-keys/+page.svelte
│   │   └── appearance/+page.svelte
│   └── +layout.svelte                # App layout with dual sidebar
│
└── (auth)/
    ├── login/+page.svelte
    └── register/+page.svelte
```

---

## Backend Module Breakdown

### Module 1: Authentication (Foundation)

**Status**: ✅ Partially implemented (Better Auth setup exists)

**Required Endpoints**:

```typescript
// packages/api/src/routers/auth.ts
export const authRouter = {
  // GET /rpc/auth.getSession
  getSession: publicProcedure.handler(async ({ context }) => {
    return context.session;
  }),

  // POST /rpc/auth.signIn
  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .handler(async ({ input }) => {
      // Better Auth signIn
    }),

  // POST /rpc/auth.signUp
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
      })
    )
    .handler(async ({ input }) => {
      // Better Auth signUp
    }),

  // POST /rpc/auth.signOut
  signOut: publicProcedure.handler(async () => {
    // Better Auth signOut
  }),
};
```

**Unit Tests**:

```typescript
// packages/api/src/routers/__tests__/auth.test.ts
describe('authRouter', () => {
  describe('signIn', () => {
    it('should reject invalid email format', async () => {
      const result = await authRouter.signIn({
        input: { email: 'invalid', password: 'password123' },
      });
      expect(result).toThrow(ZodError);
    });

    it('should reject short password', async () => {
      const result = await authRouter.signIn({
        input: { email: 'user@example.com', password: 'short' },
      });
      expect(result).toThrow(ZodError);
    });

    it('should sign in with valid credentials', async () => {
      const result = await authRouter.signIn.handler({
        input: { email: 'user@example.com', password: 'password123' },
      });
      expect(result).toHaveProperty('session');
    });
  });
});
```

### Module 2: Chat Management

**Status**: ⏳ Not implemented

**Required Endpoints**:

```typescript
// packages/api/src/routers/chat.ts
export const chatRouter = {
  // GET /rpc/chat.getAll - List all user's chats
  getAll: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    return await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));
  }),

  // GET /rpc/chat.getById
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const results = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, input.id), eq(chats.userId, userId)));
      return results[0];
    }),

  // POST /rpc/chat.create
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).default('New Chat'),
        modelId: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const [chat] = await db
        .insert(chats)
        .values({
          userId,
          title: input.title,
          modelId: input.modelId,
        })
        .returning();
      return chat;
    }),

  // PATCH /rpc/chat.update
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        modelId: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { id, ...data } = input;
      const results = await db
        .update(chats)
        .set(data)
        .where(and(eq(chats.id, id), eq(chats.userId, userId)))
        .returning();
      return results[0];
    }),

  // DELETE /rpc/chat.delete
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      await db.delete(chats).where(and(eq(chats.id, input.id), eq(chats.userId, userId)));
      return { success: true };
    }),
};
```

**Database Schema**:

```typescript
// packages/db/src/schema/chat.ts
import { pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title').notNull(),
  modelId: text('model_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Unit Tests**:

```typescript
// packages/api/src/routers/__tests__/chat.test.ts
describe('chatRouter', () => {
  describe('getAll', () => {
    it("should return only user's own chats", async () => {
      const mockContext = {
        session: { user: { id: 'user-123' } },
      };

      const result = await chatRouter.getAll.handler({
        context: mockContext,
      });

      expect(result).toBeInstanceOf(Array);
      result.forEach((chat) => {
        expect(chat.userId).toBe('user-123');
      });
    });

    it('should order by updatedAt desc', async () => {
      // Test ordering
    });
  });

  describe('create', () => {
    it('should create chat with default title', async () => {
      const result = await chatRouter.create.handler({
        input: { modelId: 'gpt-4' },
        context: mockContext,
      });
      expect(result.title).toBe('New Chat');
    });
  });
});
```

### Module 3: Message Handling (Streaming)

**Status**: ⏳ Not implemented

**Required Endpoints**:

```typescript
// packages/api/src/routers/message.ts
export const messageRouter = {
  // POST /rpc/message.stream - Server-sent events streaming
  stream: protectedProcedure
    .input(
      z.object({
        chatId: z.number(),
        content: z.string().min(1),
        modelId: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      // Implementation with streaming support
      // Returns SSE stream
    }),

  // GET /rpc.message.getByChatId
  getByChatId: protectedProcedure
    .input(z.object({ chatId: z.number() }))
    .handler(async ({ input, context }) => {
      return await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, input.chatId))
        .orderBy(asc(messages.createdAt));
    }),
};
```

**Streaming Implementation** (Reference: [oRPC streaming guide](https://blog.logrocket.com/trpc-vs-orpc-type-safe-rpc/)):

```typescript
// Use Hono's streaming support
import { stream } from 'hono/streaming';

stream: protectedProcedure
  .input(
    z.object({
      chatId: z.number(),
      content: z.string().min(1),
      modelId: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. Save user message
          await db.insert(messages).values({
            chatId: input.chatId,
            role: 'user',
            content: input.content,
          });

          // 2. Get API key for provider
          const apiKey = await getApiKey(context.session.user.id, input.modelId);

          // 3. Stream AI response
          const response = await fetchAIResponse({
            model: input.modelId,
            messages: [{ role: 'user', content: input.content }],
            apiKey,
          });

          // 4. Stream chunks to client
          for await (const chunk of response) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }

          // 5. Save assistant message
          await db.insert(messages).values({
            chatId: input.chatId,
            role: 'assistant',
            content: fullResponse,
          });

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  });
```

### Module 4: Prompt Templates

**Status**: ⏳ Not implemented

**Required Endpoints**:

```typescript
// packages/api/src/routers/prompt.ts
export const promptRouter = {
  getAll: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    return await db.select().from(prompts).where(eq(prompts.userId, userId));
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        content: z.string().min(1),
        variables: z.array(z.string()).optional(),
        category: z.string().optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const [prompt] = await db
        .insert(prompts)
        .values({ userId, ...input })
        .returning();
      return prompt;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        variables: z.array(z.string()).optional(),
        category: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { id, ...data } = input;
      const results = await db
        .update(prompts)
        .set(data)
        .where(and(eq(prompts.id, id), eq(prompts.userId, userId)))
        .returning();
      return results[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      await db.delete(prompts).where(and(eq(prompts.id, input.id), eq(prompts.userId, userId)));
      return { success: true };
    }),
};
```

### Module 5: API Key Management

**Status**: ⏳ Not implemented

**Required Endpoints**:

```typescript
// packages/api/src/routers/apiKey.ts
export const apiKeyRouter = {
  getAll: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    const keys = await db
      .select({
        id: apiKeys.id,
        provider: apiKeys.provider,
        keyLast4: apiKeys.keyLast4,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId));
    return keys;
  }),

  create: protectedProcedure
    .input(
      z.object({
        provider: z.enum(['openai', 'anthropic', 'google', 'groq', 'ollama']),
        apiKey: z.string().min(20),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Encrypt API key
      const encryptedKey = await encrypt(input.apiKey);
      const keyLast4 = input.apiKey.slice(-4);

      const [key] = await db
        .insert(apiKeys)
        .values({
          userId,
          provider: input.provider,
          encryptedKey,
          keyLast4,
        })
        .returning({
          id: apiKeys.id,
          provider: apiKeys.provider,
          keyLast4: apiKeys.keyLast4,
        });

      return key;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      await db.delete(apiKeys).where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, userId)));
      return { success: true };
    }),
};
```

---

## Testing Strategy

### Test Pyramid

```
                    ┌─────────┐
                    │   E2E   │  ← Playwright (10%)
                    │  Tests  │
                   ─┴─────────┴─
                  ┌─────────────┐
                  │ Integration │  ← ORPC endpoint tests (20%)
                  │    Tests    │
                 ─┴─────────────┴─
                ┌─────────────────┐
                │  Unit Tests (70%)│  ← Vitest (business logic)
                └─────────────────┘
```

### Unit Testing with Vitest

**Setup** (already configured in project):

```bash
# Run unit tests
bun test

# Run with coverage
bun test:coverage

# Watch mode
bun test:watch
```

**Example Test Structure**:

```typescript
// packages/api/src/routers/__tests__/chat.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chatRouter } from '../chat';
import { db } from '@sambung-chat/db';

// Mock database
vi.mock('@sambung-chat/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('chatRouter', () => {
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
    });

    it("should return user's chats ordered by updatedAt", async () => {
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
    });
  });

  describe('create', () => {
    it('should create chat with provided title and model', async () => {
      const newChat = { id: 1, title: 'My Chat', modelId: 'gpt-4' };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newChat]),
        }),
      } as any);

      const result = await chatRouter.create.handler({
        input: { title: 'My Chat', modelId: 'gpt-4' },
        context: mockContext,
      });

      expect(result).toEqual(newChat);
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
  });
});
```

### Integration Testing

```typescript
// packages/api/src/__tests__/integration/chat-api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient } from '@orpc/client/test';
import { appRouter } from '../routers';

describe('Chat API Integration', () => {
  let testClient;
  let testUser;

  beforeAll(async () => {
    // Setup test database
    await setupTestDB();

    // Create test user
    testUser = await createTestUser();

    // Create ORPC test client
    testClient = createTestClient(appRouter, {
      context: { session: { user: testUser } },
    });
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  it('should create and retrieve chat', async () => {
    // Create chat
    const created = await testClient.chat.create({
      title: 'Test Chat',
      modelId: 'gpt-4',
    });

    expect(created).toHaveProperty('id');
    expect(created.title).toBe('Test Chat');

    // Retrieve chat
    const retrieved = await testClient.chat.getById({
      id: created.id,
    });

    expect(retrieved.id).toBe(created.id);
  });

  it("should prevent accessing other user's chats", async () => {
    const otherUser = await createTestUser();
    const otherChat = await createChatForUser(otherUser);

    await expect(testClient.chat.getById({ id: otherChat.id })).rejects.toThrow('NOT_FOUND');
  });
});
```

### E2E Testing with Playwright

```typescript
// apps/web/tests/e2e/chat.spec.ts
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
    await page.click('[data-testid="new-chat-button"]');

    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('Hello, AI!');
    await page.click('[data-testid="send-button"]');

    // Wait for streaming response
    await expect(page.locator('[data-testid="message-assistant"]')).toBeVisible();
  });

  test('should switch between nav items', async ({ page }) => {
    await page.click('[data-testid="nav-prompts"]');
    await expect(page).toHaveURL('/prompts');

    await page.click('[data-testid="nav-settings"]');
    await expect(page).toHaveURL('/settings');
  });
});
```

---

## Implementation Order

### Week 1-2: Foundation (Backend Only)

| Task                   | Backend | Unit Tests | Frontend |
| ---------------------- | ------- | ---------- | -------- |
| Auth module completion | ✅      | ✅         | ❌       |
| Database migrations    | ✅      | N/A        | ❌       |
| CI/CD pipeline         | ✅      | ✅         | ❌       |

### Week 3-4: Chat Backend

| Task               | Backend | Unit Tests | Frontend |
| ------------------ | ------- | ---------- | -------- |
| Chat CRUD API      | ✅      | ✅         | ❌       |
| Message API        | ✅      | ✅         | ❌       |
| Streaming endpoint | ✅      | ✅         | ❌       |

### Week 5-6: Frontend Foundation

| Task             | Backend       | Unit Tests | Frontend |
| ---------------- | ------------- | ---------- | -------- |
| NavigationRail   | N/A           | N/A        | ✅       |
| SecondarySidebar | ✅ API exists | N/A        | ✅       |
| Auth pages       | ✅ API exists | N/A        | ✅       |

### Week 7-8: Chat UI

| Task              | Backend       | Unit Tests | Frontend |
| ----------------- | ------------- | ---------- | -------- |
| ChatInterface     | ✅ API exists | N/A        | ✅       |
| Message component | ✅ API exists | N/A        | ✅       |
| Streaming UI      | ✅ API exists | N/A        | ✅       |

### Week 9-10: Additional Features

| Task         | Backend | Unit Tests | Frontend |
| ------------ | ------- | ---------- | -------- |
| Prompt CRUD  | ✅      | ✅         | ✅       |
| API Key CRUD | ✅      | ✅         | ✅       |

### Week 11: Testing & Polish

| Task                | Type             |
| ------------------- | ---------------- |
| Unit test coverage  | Vitest           |
| Integration tests   | ORPC test client |
| E2E tests           | Playwright       |
| Performance testing | Lighthouse       |

---

## API Alignment with UI/UX

### Component ↔ API Mapping

| UI Component             | Required API Endpoints                                             | Status      |
| ------------------------ | ------------------------------------------------------------------ | ----------- |
| NavigationRail           | None (static)                                                      | ✅          |
| SecondarySidebar (chats) | `chat.getAll`, `chat.create`, `chat.delete`                        | ⏳          |
| ChatInterface            | `chat.getById`, `message.getByChatId`, `message.stream`            | ⏳          |
| Message                  | (data from `message.getByChatId`)                                  | ⏳          |
| ModelSelector            | Config (static) or `model.list` API                                | ✅ (static) |
| PromptLibrary            | `prompt.getAll`, `prompt.create`, `prompt.update`, `prompt.delete` | ⏳          |
| APIKeyManager            | `apiKey.getAll`, `apiKey.create`, `apiKey.delete`                  | ⏳          |
| SettingsNav              | None (static)                                                      | ✅          |

### ORPC Router Structure (Target)

```typescript
export const appRouter = {
  // Health & Auth
  healthCheck: publicProcedure.handler(() => 'OK'),
  auth: authRouter,

  // Chat (Protected)
  chat: chatRouter, // getAll, getById, create, update, delete
  message: messageRouter, // getByChatId, stream

  // Content (Protected)
  prompt: promptRouter, // getAll, getById, create, update, delete

  // Settings (Protected)
  apiKey: apiKeyRouter, // getAll, create, delete
  user: userRouter, // getProfile, updateSettings

  // Example (Public - remove in production)
  todo: todoRouter,
};
```

---

## ROADMAP Alignment

### Updated Phase 1 (MVP) - Backend First

| Week | Backend Focus             | Testing                  | Frontend Focus               |
| ---- | ------------------------- | ------------------------ | ---------------------------- |
| 1-2  | Auth module, DB setup     | Unit tests for auth      | Layout setup                 |
| 3-4  | Chat + Message APIs       | Unit + integration tests | Auth pages                   |
| 5-6  | Streaming implementation  | Integration tests        | NavigationRail + Sidebar     |
| 7-8  | Prompt + API key APIs     | Unit tests               | ChatInterface                |
| 9-10 | User settings API         | Unit tests               | PromptLibrary, APIKeyManager |
| 11   | Performance optimization  | E2E tests                | Polish, animations           |
| 12   | Documentation, deployment | Final tests              | Final polish                 |

### Success Metrics (Updated)

| Metric               | Target              | Measurement            |
| -------------------- | ------------------- | ---------------------- |
| Backend API Coverage | >80%                | Vitest coverage        |
| Unit Test Pass Rate  | 100%                | CI checks              |
| Integration Tests    | All CRUD paths      | Vitest                 |
| E2E Tests            | Critical user flows | Playwright             |
| Type Safety          | 100%                | TypeScript strict mode |

---

## Quick Start: Backend Module Template

Use this template when creating new backend modules:

```bash
# 1. Create database schema
cat > packages/db/src/schema/resource.ts << 'EOF'
import { pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user";

export const resource = pgTable("resource", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
EOF

# 2. Export schema
echo "export * from './resource';" >> packages/db/src/schema/index.ts

# 3. Generate and push migration
bun run db:generate
bun run db:push

# 4. Create router
cat > packages/api/src/routers/resource.ts << 'EOF'
import { db } from "@sambung-chat/db";
import { resource } from "@sambung-chat/db/schema/resource";
import { eq, and } from "drizzle-orm";
import { protectedProcedure } from "../index";
import z from "zod";

export const resourceRouter = {
  getAll: protectedProcedure.handler(async ({ context }) => {
    return await db.select().from(resource)
      .where(eq(resource.userId, context.session.user.id));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const results = await db.select().from(resource)
        .where(and(
          eq(resource.id, input.id),
          eq(resource.userId, context.session.user.id)
        ));
      return results[0];
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const [created] = await db.insert(resource)
        .values({ userId: context.session.user.id, ...input })
        .returning();
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
    }))
    .handler(async ({ input, context }) => {
      const { id, ...data } = input;
      const results = await db.update(resource)
        .set(data)
        .where(and(
          eq(resource.id, id),
          eq(resource.userId, context.session.user.id)
        ))
        .returning();
      return results[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      await db.delete(resource)
        .where(and(
          eq(resource.id, input.id),
          eq(resource.userId, context.session.user.id)
        ));
      return { success: true };
    }),
};
EOF

# 5. Add to root router
# Edit packages/api/src/routers/index.ts

# 6. Create unit tests
cat > packages/api/src/routers/__tests__/resource.test.ts << 'EOF'
import { describe, it, expect, vi } from 'vitest';
import { resourceRouter } from '../resource';

describe('resourceRouter', () => {
  // TODO: Implement tests
});
EOF

# 7. Run tests
bun test
```

---

## Related Documents

- [UI/UX Design Document](./ui-ux-design.md) - Visual design and components
- [ROADMAP](./ROADMAP.md) - Development timeline
- [ORPC Implementation Reference](./generated/orpc-todo-reference.md) - ORPC patterns
- [API Reference](../docs/api-reference.md) - API documentation

---

## Sources

- [Best UX Practices for Designing a Sidebar](https://uxplanet.org/best-ux-practices-for-designing-a-sidebar-9174ee0ecaa2) - Sidebar width guidelines
- [Creating A Sidebar Menu Layout With SvelteKit](https://medium.com/stackanatomy/creating-a-sidebar-menu-layout-with-sveltekit-e2138d041875) - SvelteKit layout patterns
- [End-to-End Testing for Microservices: A 2025 Guide](https://www.bunnyshell.com/blog/end-to-end-testing-for-microservices-a-2025-guide/) - Testing strategies
- [tRPC vs oRPC Comparison](https://blog.logrocket.com/trpc-vs-orpc-type-safe-rpc/) - ORPC best practices
- [Microservices Testing: Strategies, Tools, and Best Practices](https://vfunction.com/blog/microservices-testing/) - Backend testing patterns

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
