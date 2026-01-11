/**
 * Test Data Factories
 *
 * Factory pattern for creating test data
 * Usage: const chat = await chatFactory.create({ title: 'Test' })
 */

import { db } from '@sambung-chat/db';
import { chats, messages, prompts, apiKeys, user } from '@sambung-chat/db/schema';

// Helper to generate random strings
const randomString = (length: number) => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
};

// Helper to generate random UUID
const randomUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Chat Factory
 */
export const chatFactory = {
  build: (overrides = {}) => ({
    userId: randomUUID(),
    title: `Test Chat ${randomString(4)}`,
    modelId: 'gpt-4',
    ...overrides,
  }),

  create: async (overrides = {}) => {
    const data = chatFactory.build(overrides);
    const [chat] = await db.insert(chats).values(data).returning();
    return chat;
  },
};

/**
 * Message Factory
 */
export const messageFactory = {
  build: (overrides = {}) => ({
    chatId: 1,
    role: 'user' as const,
    content: `Test message ${randomString(4)}`,
    metadata: null,
    ...overrides,
  }),

  create: async (overrides = {}) => {
    const data = messageFactory.build(overrides);
    const [message] = await db.insert(messages).values(data).returning();
    return message;
  },

  createPair: async (chatId: number, userContent: string, assistantContent: string) => {
    const [userMsg] = await db
      .insert(messages)
      .values({
        chatId,
        role: 'user',
        content: userContent,
      })
      .returning();

    const [assistantMsg] = await db
      .insert(messages)
      .values({
        chatId,
        role: 'assistant',
        content: assistantContent,
        metadata: { model: 'gpt-4', tokens: 100 },
      })
      .returning();

    return { userMsg, assistantMsg };
  },
};

/**
 * Prompt Factory
 */
export const promptFactory = {
  build: (overrides = {}) => ({
    userId: randomUUID(),
    name: `Test Prompt ${randomString(4)}`,
    content: 'Test prompt content with {{variable}}',
    variables: ['variable'],
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

/**
 * API Key Factory
 */
export const apiKeyFactory = {
  build: (overrides = {}) => ({
    userId: randomUUID(),
    provider: 'openai' as const,
    encryptedKey: `encrypted_${randomString(32)}`,
    keyLast4: randomString(4),
    ...overrides,
  }),

  create: async (overrides = {}) => {
    const data = apiKeyFactory.build(overrides);
    const [apiKey] = await db.insert(apiKeys).values(data).returning();
    return apiKey;
  },
};

/**
 * User Factory (for Better Auth)
 */
export const userFactory = {
  build: (overrides = {}) => ({
    email: `test${randomString(4)}@example.com`,
    name: `Test User ${randomString(4)}`,
    ...overrides,
  }),

  create: async (overrides = {}) => {
    const data = userFactory.build(overrides);
    const [newUser] = await db
      .insert(user)
      .values({
        ...data,
        passwordHash: 'hashed_password_placeholder', // In real tests, use bcrypt
      })
      .returning();
    return newUser;
  },
};

/**
 * Scenario Builders
 */
export const scenarioFactory = {
  /**
   * Create a complete chat scenario with messages
   */
  createChatScenario: async (messageCount: number = 3) => {
    const userId = randomUUID();
    const chat = await chatFactory.create({ userId });

    for (let i = 0; i < messageCount; i++) {
      await messageFactory.createPair(
        chat.id,
        `User message ${i + 1}`,
        `Assistant response ${i + 1}`
      );
    }

    return { userId, chat };
  },

  /**
   * Create a user with multiple chats
   */
  createUserWithChats: async (chatCount: number = 5) => {
    const userId = randomUUID();
    const chats = [];

    for (let i = 0; i < chatCount; i++) {
      const chat = await chatFactory.create({
        userId,
        title: `Chat ${i + 1}`,
      });
      chats.push(chat);
    }

    return { userId, chats };
  },

  /**
   * Create a user with API keys for multiple providers
   */
  createUserWithApiKeys: async () => {
    const userId = randomUUID();

    const providers = ['openai', 'anthropic', 'google', 'groq'] as const;
    const keys = [];

    for (const provider of providers) {
      const key = await apiKeyFactory.create({
        userId,
        provider,
        keyLast4: `${provider.slice(0, 4)}${randomString(2)}`,
      });
      keys.push(key);
    }

    return { userId, keys };
  },
};
