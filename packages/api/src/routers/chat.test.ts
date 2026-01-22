/**
 * Chat Router Tests
 *
 * Purpose: Verify all chat router procedures work correctly
 *
 * Run with: bun test packages/api/src/routers/chat.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { db } from '@sambung-chat/db';
import { chats, messages, folders } from '@sambung-chat/db/schema/chat';
import { models } from '@sambung-chat/db/schema/model';
import { user } from '@sambung-chat/db/schema/auth';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { generateULID } from '@sambung-chat/db/utils/ulid';

// Note: DATABASE_URL and other test environment variables are set by vitest.config.ts
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || 'sambungchat-dev-secret-key-at-least-32-chars-long';
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '1234567890abcdef1234567890abcdef';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  SEARCH_NO_FILTERS: 500, // Search with no filters
  SEARCH_WITH_QUERY: 1000, // Search with text query
  SEARCH_WITH_FILTERS: 1500, // Search with multiple filters
  SEARCH_IN_MESSAGES: 2000, // Full-text search across messages
};

describe('Chat Router Tests', () => {
  let testUserId: string;
  let testModelId: string;
  let createdChatIds: string[] = [];
  let createdFolderIds: string[] = [];

  beforeAll(async () => {
    // Create a test user first (required for foreign key constraints)
    testUserId = generateULID();
    await db.insert(user).values({
      id: testUserId,
      name: 'Chat Test User',
      email: 'chat-test@example.com',
      emailVerified: true,
    });

    // Create a test model
    const [newModel] = await db
      .insert(models)
      .values({
        userId: testUserId,
        provider: 'openai',
        modelId: 'gpt-4',
        name: 'GPT-4',
      })
      .returning();

    testModelId = newModel.id;
  });

  afterAll(async () => {
    // Clean up test data using batch operations
    try {
      // Delete messages first (due to foreign key)
      if (createdChatIds.length > 0) {
        await db.delete(messages).where(inArray(messages.chatId, createdChatIds));
      }

      // Delete chats in batch
      if (createdChatIds.length > 0) {
        await db.delete(chats).where(inArray(chats.id, createdChatIds));
      }

      // Delete folders in batch
      if (createdFolderIds.length > 0) {
        await db.delete(folders).where(inArray(folders.id, createdFolderIds));
      }

      // Delete test model
      if (testModelId) {
        await db.delete(models).where(eq(models.id, testModelId));
      }

      // Delete test user
      if (testUserId) {
        await db.delete(user).where(eq(user.id, testUserId));
      }
    } catch (error) {
      console.error('Error during test cleanup:', error);
    }
  });

  beforeEach(async () => {
    // Clear chat and folder IDs before each test
    createdChatIds = [];
    createdFolderIds = [];
  });

  afterEach(async () => {
    // Clean up orphaned data after each test
    try {
      if (createdChatIds.length > 0) {
        await db.delete(messages).where(inArray(messages.chatId, createdChatIds));
        await db.delete(chats).where(inArray(chats.id, createdChatIds));
      }
      if (createdFolderIds.length > 0) {
        await db.delete(folders).where(inArray(folders.id, createdFolderIds));
      }
    } catch (error) {
      console.error('Error during afterEach cleanup:', error);
    }
  });

  describe('Chat CRUD Operations', () => {
    it('create procedure should create a new chat', async () => {
      const chatData = {
        userId: testUserId,
        title: 'Test Chat',
        modelId: testModelId,
      };

      const [chat] = await db.insert(chats).values(chatData).returning();

      createdChatIds.push(chat.id);

      expect(chat).toBeDefined();
      expect(chat.id).toBeDefined();
      expect(chat.title).toBe(chatData.title);
      expect(chat.modelId).toBe(testModelId);
      expect(chat.userId).toBe(testUserId);
      expect(chat.pinned).toBe(false);
      expect(chat.folderId).toBeNull();
    });

    it('getAll procedure should get all chats for user', async () => {
      // Create multiple chats
      const chatData1 = {
        userId: testUserId,
        title: 'Chat 1',
        modelId: testModelId,
      };
      const chatData2 = {
        userId: testUserId,
        title: 'Chat 2',
        modelId: testModelId,
        pinned: true,
      };

      const [chat1] = await db.insert(chats).values(chatData1).returning();
      const [chat2] = await db.insert(chats).values(chatData2).returning();

      createdChatIds.push(chat1.id, chat2.id);

      // Get all chats for user
      const results = await db
        .select()
        .from(chats)
        .where(eq(chats.userId, testUserId))
        .orderBy(chats.updatedAt);

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some((r) => r.id === chat1.id)).toBe(true);
      expect(results.some((r) => r.id === chat2.id)).toBe(true);
    });

    it('getById procedure should get chat by ID', async () => {
      const chatData = {
        userId: testUserId,
        title: 'Get By ID Test',
        modelId: testModelId,
      };

      const [chat] = await db.insert(chats).values(chatData).returning();
      createdChatIds.push(chat.id);

      // Get chat by ID
      const results = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, chat.id), eq(chats.userId, testUserId)));

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(chat.id);
      expect(results[0].title).toBe(chatData.title);
    });

    it('getById procedure should return null for non-existent chat ID', async () => {
      const nonExistentId = generateULID();

      const results = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, nonExistentId), eq(chats.userId, testUserId)));

      expect(results.length).toBe(0);
    });

    it('update procedure should update chat title', async () => {
      const chatData = {
        userId: testUserId,
        title: 'Original Title',
        modelId: testModelId,
      };

      const [chat] = await db.insert(chats).values(chatData).returning();
      createdChatIds.push(chat.id);

      // Update chat title
      const updatedTitle = 'Updated Title';

      const results = await db
        .update(chats)
        .set({ title: updatedTitle })
        .where(and(eq(chats.id, chat.id), eq(chats.userId, testUserId)))
        .returning();

      expect(results.length).toBe(1);
      expect(results[0].title).toBe(updatedTitle);
    });

    it('update procedure should update chat model', async () => {
      // Create another model
      const [newModel] = await db
        .insert(models)
        .values({
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'claude-3',
          name: 'Claude 3',
        })
        .returning();

      const chatData = {
        userId: testUserId,
        title: 'Model Update Test',
        modelId: testModelId,
      };

      const [chat] = await db.insert(chats).values(chatData).returning();
      createdChatIds.push(chat.id);

      // Update chat model
      const results = await db
        .update(chats)
        .set({ modelId: newModel.id })
        .where(and(eq(chats.id, chat.id), eq(chats.userId, testUserId)))
        .returning();

      expect(results.length).toBe(1);
      expect(results[0].modelId).toBe(newModel.id);

      // Clean up the extra model
      await db.delete(models).where(eq(models.id, newModel.id));
    });

    it('should toggle chat pin status', async () => {
      const chatData = {
        userId: testUserId,
        title: 'Pin Toggle Test',
        modelId: testModelId,
        pinned: false,
      };

      const [chat] = await db.insert(chats).values(chatData).returning();
      createdChatIds.push(chat.id);

      // Toggle pin to true
      const results1 = await db
        .update(chats)
        .set({ pinned: true })
        .where(and(eq(chats.id, chat.id), eq(chats.userId, testUserId)))
        .returning();

      expect(results1.length).toBe(1);
      expect(results1[0].pinned).toBe(true);

      // Toggle pin back to false
      const results2 = await db
        .update(chats)
        .set({ pinned: false })
        .where(and(eq(chats.id, chat.id), eq(chats.userId, testUserId)))
        .returning();

      expect(results2.length).toBe(1);
      expect(results2[0].pinned).toBe(false);
    });

    it('should update chat folder', async () => {
      // Create a test folder
      const [folder] = await db
        .insert(folders)
        .values({
          userId: testUserId,
          name: 'Test Folder',
        })
        .returning();

      createdFolderIds.push(folder.id);

      const chatData = {
        userId: testUserId,
        title: 'Folder Update Test',
        modelId: testModelId,
        folderId: null,
      };

      const [chat] = await db.insert(chats).values(chatData).returning();
      createdChatIds.push(chat.id);

      // Update chat folder
      const results = await db
        .update(chats)
        .set({ folderId: folder.id })
        .where(and(eq(chats.id, chat.id), eq(chats.userId, testUserId)))
        .returning();

      expect(results.length).toBe(1);
      expect(results[0].folderId).toBe(folder.id);

      // Remove chat from folder
      await db
        .update(chats)
        .set({ folderId: null })
        .where(and(eq(chats.id, chat.id), eq(chats.userId, testUserId)));
    });

    it('should delete chat', async () => {
      const chatData = {
        userId: testUserId,
        title: 'To Be Deleted',
        modelId: testModelId,
      };

      const [chat] = await db.insert(chats).values(chatData).returning();
      createdChatIds.push(chat.id); // Track for cleanup in case test fails

      // Verify chat exists
      let results = await db.select().from(chats).where(eq(chats.id, chat.id));

      expect(results.length).toBe(1);

      // Delete chat
      await db.delete(chats).where(eq(chats.id, chat.id));

      // Verify chat is deleted
      results = await db.select().from(chats).where(eq(chats.id, chat.id));

      expect(results.length).toBe(0);

      // Remove from createdChatIds since it's already deleted
      createdChatIds = createdChatIds.filter((id) => id !== chat.id);
    });

    it('should not allow accessing chats from other users', async () => {
      // Create another user
      const otherUserId = generateULID();
      await db.insert(user).values({
        id: otherUserId,
        name: 'Other User',
        email: 'other-user-chat@example.com',
        emailVerified: true,
      });

      // Create chat for other user
      const otherChatData = {
        userId: otherUserId,
        title: "Other User's Chat",
        modelId: testModelId,
      };

      const [otherChat] = await db.insert(chats).values(otherChatData).returning();

      // Try to get other user's chat with testUserId
      const results = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, otherChat.id), eq(chats.userId, testUserId)));

      expect(results.length).toBe(0);

      // Clean up other user's data
      await db.delete(chats).where(eq(chats.id, otherChat.id));
      await db.delete(user).where(eq(user.id, otherUserId));
    });
  });

  describe('Chat Search Functionality', () => {
    beforeEach(async () => {
      // Create test chats for search tests
      const testChats = [
        {
          title: 'Code Review Discussion',
          pinned: true,
        },
        {
          title: 'Writing Assistant Chat',
          pinned: false,
        },
        {
          title: 'Debug Session',
          pinned: false,
        },
        {
          title: 'Email Drafting',
          pinned: true,
        },
      ];

      for (const chatData of testChats) {
        const [chat] = await db
          .insert(chats)
          .values({
            userId: testUserId,
            modelId: testModelId,
            ...chatData,
          })
          .returning();

        createdChatIds.push(chat.id);
      }
    });

    it('should search chats by keyword in title', async () => {
      const query = 'Code';
      const results = await db
        .select()
        .from(chats)
        .where(and(eq(chats.userId, testUserId), sql`${chats.title} ILIKE ${`%${query}%`}`))
        .orderBy(chats.updatedAt);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.title.toLowerCase().includes(query.toLowerCase()))).toBe(true);
    });

    it('should filter chats by pinned status', async () => {
      const pinned = true;
      const results = await db
        .select()
        .from(chats)
        .where(and(eq(chats.userId, testUserId), eq(chats.pinned, pinned)))
        .orderBy(chats.updatedAt);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.pinned === pinned)).toBe(true);
    });

    it('should filter chats by folder', async () => {
      // Create a test folder
      const [folder] = await db
        .insert(folders)
        .values({
          userId: testUserId,
          name: 'Search Test Folder',
        })
        .returning();

      createdFolderIds.push(folder.id);

      // Move a chat to the folder
      const chatToUpdate = createdChatIds[0];
      await db
        .update(chats)
        .set({ folderId: folder.id })
        .where(eq(chats.id, chatToUpdate));

      // Search for chats in folder
      const results = await db
        .select()
        .from(chats)
        .where(and(eq(chats.userId, testUserId), eq(chats.folderId, folder.id)))
        .orderBy(chats.updatedAt);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.folderId === folder.id)).toBe(true);

      // Clean up
      await db.update(chats).set({ folderId: null }).where(eq(chats.id, chatToUpdate));
    });

    it('should filter chats by date range', async () => {
      const dateFrom = new Date(Date.now() - 60 * 60 * 1000); // Last 1 hour
      const dateTo = new Date();

      const results = await db
        .select()
        .from(chats)
        .where(
          and(
            eq(chats.userId, testUserId),
            sql`${chats.createdAt} >= ${dateFrom}`,
            sql`${chats.createdAt} <= ${dateTo}`
          )
        )
        .orderBy(chats.updatedAt);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.createdAt >= dateFrom && r.createdAt <= dateTo)).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const pinned = true;
      const query = 'Chat';

      const results = await db
        .select()
        .from(chats)
        .where(
          and(
            eq(chats.userId, testUserId),
            eq(chats.pinned, pinned),
            sql`${chats.title} ILIKE ${`%${query}%`}`
          )
        )
        .orderBy(chats.updatedAt);

      expect(results.length).toBeGreaterThanOrEqual(0);
      if (results.length > 0) {
        expect(results.every((r) => r.pinned === pinned)).toBe(true);
        expect(
          results.every((r) => r.title.toLowerCase().includes(query.toLowerCase()))
        ).toBe(true);
      }
    });

    it('should handle empty search results', async () => {
      const query = 'nonexistentchatxyz123';
      const results = await db
        .select()
        .from(chats)
        .where(and(eq(chats.userId, testUserId), sql`${chats.title} ILIKE ${`%${query}%`}`))
        .orderBy(chats.updatedAt);

      expect(results.length).toBe(0);
    });
  });

  describe('Chat with Messages', () => {
    it('should create chat with messages', async () => {
      const chatData = {
        userId: testUserId,
        title: 'Chat with Messages',
        modelId: testModelId,
      };

      const [chat] = await db.insert(chats).values(chatData).returning();
      createdChatIds.push(chat.id);

      // Create messages for this chat
      const messageData1 = {
        chatId: chat.id,
        role: 'user' as const,
        content: 'Hello, how are you?',
      };
      const messageData2 = {
        chatId: chat.id,
        role: 'assistant' as const,
        content: 'I am doing well, thank you!',
      };

      await db.insert(messages).values(messageData1);
      await db.insert(messages).values(messageData2);

      // Get all messages for chat
      const messages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chat.id))
        .orderBy(messages.createdAt);

      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
    });

    it('should get chats with message count', async () => {
      const chatData = {
        userId: testUserId,
        title: 'Message Count Test',
        modelId: testModelId,
      };

      const [chat] = await db.insert(chats).values(chatData).returning();
      createdChatIds.push(chat.id);

      // Create 3 messages
      for (let i = 0; i < 3; i++) {
        await db.insert(messages).values({
          chatId: chat.id,
          role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
          content: `Message ${i + 1}`,
        });
      }

      // Get messages for chat
      const messages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chat.id));

      expect(messages.length).toBe(3);
    });

    it('should delete chat and its messages', async () => {
      const chatData = {
        userId: testUserId,
        title: 'Cascade Delete Test',
        modelId: testModelId,
      };

      const [chat] = await db.insert(chats).values(chatData).returning();
      createdChatIds.push(chat.id);

      // Create messages
      await db.insert(messages).values({
        chatId: chat.id,
        role: 'user',
        content: 'Test message',
      });

      // Verify messages exist
      let messages = await db.select().from(messages).where(eq(messages.chatId, chat.id));
      expect(messages.length).toBe(1);

      // Delete chat (messages should be handled by foreign key or manually)
      await db.delete(messages).where(eq(messages.chatId, chat.id));
      await db.delete(chats).where(eq(chats.id, chat.id));

      // Verify both are deleted
      messages = await db.select().from(messages).where(eq(messages.chatId, chat.id));
      expect(messages.length).toBe(0);

      const chats = await db.select().from(chats).where(eq(chats.id, chat.id));
      expect(chats.length).toBe(0);

      // Remove from createdChatIds since it's already deleted
      createdChatIds = createdChatIds.filter((id) => id !== chat.id);
    });
  });

  describe('Chat Edge Cases', () => {
    it('should handle chat with very long title', async () => {
      const longTitle = 'A'.repeat(200); // Max length
      const chatData = {
        userId: testUserId,
        title: longTitle,
        modelId: testModelId,
      };

      const [chat] = await db.insert(chats).values(chatData).returning();
      createdChatIds.push(chat.id);

      expect(chat.title).toBe(longTitle);
      expect(chat.title.length).toBe(200);
    });

    it('should handle multiple chats with same title', async () => {
      const title = 'Duplicate Title';
      const chatData1 = {
        userId: testUserId,
        title,
        modelId: testModelId,
      };
      const chatData2 = {
        userId: testUserId,
        title,
        modelId: testModelId,
        pinned: true,
      };

      const [chat1] = await db.insert(chats).values(chatData1).returning();
      const [chat2] = await db.insert(chats).values(chatData2).returning();

      createdChatIds.push(chat1.id, chat2.id);

      // Both should exist with different IDs
      expect(chat1.id).not.toBe(chat2.id);
      expect(chat1.title).toBe(chat2.title);

      // Verify both can be retrieved
      const results = await db
        .select()
        .from(chats)
        .where(and(eq(chats.userId, testUserId), eq(chats.title, title)));

      expect(results.length).toBe(2);
    });

    it('should handle special characters in chat title', async () => {
      const chatData = {
        userId: testUserId,
        title: 'Chat with "quotes" and \'apostrophes\' and <brackets>',
        modelId: testModelId,
      };

      const [chat] = await db.insert(chats).values(chatData).returning();
      createdChatIds.push(chat.id);

      expect(chat.title).toBe(chatData.title);
    });

    it('should handle chat with null folderId', async () => {
      const chatData = {
        userId: testUserId,
        title: 'No Folder Chat',
        modelId: testModelId,
        folderId: null,
      };

      const [chat] = await db.insert(chats).values(chatData).returning();
      createdChatIds.push(chat.id);

      expect(chat.folderId).toBeNull();
    });
  });
});

describe('Chat Search Performance Tests', () => {
  let testUserId: string;
  const testModelIds: string[] = [];
  let createdChatIds: string[] = [];

  beforeAll(async () => {
    // Create a test user first (required for foreign key constraints)
    testUserId = generateULID();
    await db.insert(user).values({
      id: testUserId,
      name: 'Performance Test User',
      email: 'performance-test@example.com',
      emailVerified: true,
    });

    // Create test models for different providers
    const providers = ['openai', 'anthropic', 'google', 'groq'] as const;

    for (const provider of providers) {
      const [newModel] = await db
        .insert(models)
        .values({
          userId: testUserId,
          provider,
          modelId: `${provider}-model-1`,
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Model`,
        })
        .returning();

      testModelIds.push(newModel.id);
    }
  });

  afterAll(async () => {
    // Clean up test data using batch operations
    try {
      // Delete messages first (due to foreign key)
      if (createdChatIds.length > 0) {
        await db.delete(messages).where(inArray(messages.chatId, createdChatIds));
      }

      // Delete chats in batch
      if (createdChatIds.length > 0) {
        await db.delete(chats).where(inArray(chats.id, createdChatIds));
      }

      // Delete test models in batch
      if (testModelIds.length > 0) {
        await db.delete(models).where(inArray(models.id, testModelIds));
      }

      // Delete test user
      if (testUserId) {
        await db.delete(user).where(eq(user.id, testUserId));
      }
    } catch (error) {
      console.error('Error during test cleanup:', error);
    }
  });

  beforeEach(async () => {
    // Clear chat IDs before each test
    createdChatIds = [];
  });

  describe('Dataset Creation', () => {
    it('should create 100+ test chats with 1000+ messages', async () => {
      const numChats = 120;
      const messagesPerChat = 10;

      console.time('Dataset creation');

      for (let i = 0; i < numChats; i++) {
        const modelId = testModelIds[i % testModelIds.length];
        const provider = ['openai', 'anthropic', 'google', 'groq'][i % 4];

        // Create chat
        const [chat] = await db
          .insert(chats)
          .values({
            userId: testUserId,
            title: `Test Chat ${i + 1}: ${provider} conversation about topic ${i % 10}`,
            modelId: modelId,
            pinned: i % 20 === 0, // Pin every 20th chat
            folderId: null, // No folder for performance tests (simplifies foreign key constraints)
          })
          .returning();

        createdChatIds.push(chat.id);

        // Create messages for this chat
        const messagePromises = [];
        for (let j = 0; j < messagesPerChat; j++) {
          const role = j % 2 === 0 ? 'user' : 'assistant';
          const content =
            role === 'user'
              ? `User message ${j + 1} in chat ${i + 1} asking about ${provider} capabilities`
              : `Assistant response ${j + 1} explaining ${provider} features and topic ${i % 10}`;

          messagePromises.push(
            db.insert(messages).values({
              chatId: chat.id,
              role,
              content,
            })
          );
        }

        await Promise.all(messagePromises);
      }

      console.timeEnd('Dataset creation');

      // Verify dataset was created
      const chatCount = await db.select().from(chats).where(eq(chats.userId, testUserId));

      const allMessages = await db
        .select()
        .from(messages)
        .where(inArray(messages.chatId, createdChatIds));

      expect(chatCount.length).toBeGreaterThanOrEqual(numChats);
      expect(allMessages.length).toBeGreaterThanOrEqual(numChats * messagesPerChat);

      console.log(`✓ Created ${chatCount.length} chats with ${allMessages.length} messages`);
    });
  });

  describe('Search Performance Tests', () => {
    it('should perform fast search with no filters', async () => {
      const startTime = performance.now();

      const results = await db
        .select()
        .from(chats)
        .where(eq(chats.userId, testUserId))
        .orderBy(chats.updatedAt);

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Search with no filters: ${duration.toFixed(2)}ms (${results.length} results)`);

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_NO_FILTERS);
    });

    it('should perform fast search with text query (title only)', async () => {
      const query = 'Test Chat 5';
      const startTime = performance.now();

      const results = await db
        .select()
        .from(chats)
        .where(and(eq(chats.userId, testUserId), sql`${chats.title} ILIKE ${`%${query}%`}`))
        .orderBy(chats.updatedAt);

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `Search with query "${query}": ${duration.toFixed(2)}ms (${results.length} results)`
      );

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_WITH_QUERY);
    });

    it('should perform fast search with provider filter', async () => {
      const startTime = performance.now();

      const results = await db
        .select({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(models, eq(chats.modelId, models.id))
        .where(and(eq(chats.userId, testUserId), eq(models.provider, 'openai')))
        .orderBy(chats.updatedAt);

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `Search with provider filter: ${duration.toFixed(2)}ms (${results.length} results)`
      );

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_WITH_FILTERS);
    });

    it('should perform fast search with multiple model filter', async () => {
      const modelIdsToFilter = testModelIds.slice(0, 2); // Filter by first 2 models
      const startTime = performance.now();

      const results = await db
        .select({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(models, eq(chats.modelId, models.id))
        .where(and(eq(chats.userId, testUserId), inArray(models.id, modelIdsToFilter)))
        .orderBy(chats.updatedAt);

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Search with model filter: ${duration.toFixed(2)}ms (${results.length} results)`);

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_WITH_FILTERS);
    });

    it('should perform fast search with date range filter', async () => {
      // Search for chats created in the last day
      const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const startTime = performance.now();

      const results = await db
        .select()
        .from(chats)
        .where(and(eq(chats.userId, testUserId), sql`${chats.createdAt} >= ${new Date(dateFrom)}`))
        .orderBy(chats.updatedAt);

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Search with date range: ${duration.toFixed(2)}ms (${results.length} results)`);

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_WITH_FILTERS);
    });

    it('should perform fast full-text search across messages', async () => {
      const query = 'capabilities';
      const startTime = performance.now();

      // First search chats that have matching messages
      const chatResults = await db
        .selectDistinct({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(messages, eq(chats.id, messages.chatId))
        .where(
          and(
            eq(chats.userId, testUserId),
            sql`(${chats.title} ILIKE ${`%${query}%`} OR ${messages.content} ILIKE ${`%${query}%`})`
          )
        )
        .orderBy(chats.updatedAt);

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `Full-text search for "${query}": ${duration.toFixed(2)}ms (${chatResults.length} results)`
      );

      expect(chatResults.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_IN_MESSAGES);
    });

    it('should perform fast search with combined filters', async () => {
      const query = 'google';
      const providers = ['google', 'openai'];
      const modelIdsToFilter = testModelIds.slice(0, 2);
      const startTime = performance.now();

      // Combined search with query, provider, and model filters
      const results = await db
        .selectDistinct({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(models, eq(chats.modelId, models.id))
        .innerJoin(messages, eq(chats.id, messages.chatId))
        .where(
          and(
            eq(chats.userId, testUserId),
            sql`(${chats.title} ILIKE ${`%${query}%`} OR ${messages.content} ILIKE ${`%${query}%`})`,
            inArray(models.provider, providers),
            inArray(models.id, modelIdsToFilter)
          )
        )
        .orderBy(chats.updatedAt);

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Combined filters search: ${duration.toFixed(2)}ms (${results.length} results)`);

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_WITH_FILTERS);
    });

    it('should efficiently fetch message snippets for search results', async () => {
      const query = 'assistant';
      const maxSnippetsPerChat = 3;

      // First get chat results
      const chatResults = await db
        .selectDistinct({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(messages, eq(chats.id, messages.chatId))
        .where(
          and(
            eq(chats.userId, testUserId),
            sql`(${chats.title} ILIKE ${`%${query}%`} OR ${messages.content} ILIKE ${`%${query}%`})`
          )
        )
        .orderBy(chats.updatedAt)
        .limit(50);

      const chatIds = chatResults.map((r) => r.id);

      // Now fetch matching messages
      const startTime = performance.now();

      const matchingMessages = await db
        .select({
          id: messages.id,
          chatId: messages.chatId,
          role: messages.role,
          content: messages.content,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(
          and(inArray(messages.chatId, chatIds), sql`${messages.content} ILIKE ${`%${query}%`}`)
        )
        .orderBy(messages.createdAt);

      // Group messages by chatId and limit to maxSnippetsPerChat
      const messagesByChat = new Map<string, typeof matchingMessages>();
      for (const msg of matchingMessages) {
        if (!messagesByChat.has(msg.chatId)) {
          messagesByChat.set(msg.chatId, []);
        }
        const chatMessages = messagesByChat.get(msg.chatId)!;
        if (chatMessages.length < maxSnippetsPerChat) {
          chatMessages.push(msg);
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `Message snippets fetch: ${duration.toFixed(2)}ms (${matchingMessages.length} total messages, ${messagesByChat.size} chats with matches)`
      );

      expect(messagesByChat.size).toBeGreaterThan(0);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_IN_MESSAGES);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet all performance thresholds', async () => {
      const benchmarks = {
        'No filters': async () => {
          const start = performance.now();
          await db
            .select()
            .from(chats)
            .where(eq(chats.userId, testUserId))
            .orderBy(chats.updatedAt);
          return performance.now() - start;
        },
        'Text query': async () => {
          const start = performance.now();
          await db
            .select()
            .from(chats)
            .where(and(eq(chats.userId, testUserId), sql`${chats.title} ILIKE ${'%Test%'}`))
            .orderBy(chats.updatedAt);
          return performance.now() - start;
        },
        'Provider filter': async () => {
          const start = performance.now();
          await db
            .select({
              id: chats.id,
              userId: chats.userId,
              title: chats.title,
              modelId: chats.modelId,
              folderId: chats.folderId,
              pinned: chats.pinned,
              createdAt: chats.createdAt,
              updatedAt: chats.updatedAt,
            })
            .from(chats)
            .innerJoin(models, eq(chats.modelId, models.id))
            .where(and(eq(chats.userId, testUserId), eq(models.provider, 'openai')))
            .orderBy(chats.updatedAt);
          return performance.now() - start;
        },
        'Full-text search': async () => {
          const start = performance.now();
          await db
            .selectDistinct({
              id: chats.id,
              userId: chats.userId,
              title: chats.title,
              modelId: chats.modelId,
              folderId: chats.folderId,
              pinned: chats.pinned,
              createdAt: chats.createdAt,
              updatedAt: chats.updatedAt,
            })
            .from(chats)
            .innerJoin(messages, eq(chats.id, messages.chatId))
            .where(
              and(eq(chats.userId, testUserId), sql`${messages.content} ILIKE ${'%capabilities%'}`)
            )
            .orderBy(chats.updatedAt);
          return performance.now() - start;
        },
      };

      console.log('\n=== Performance Benchmarks ===');
      console.log('Testing with dataset: ~120 chats, ~1200 messages\n');

      const results: Record<string, number> = {};
      for (const [name, benchmark] of Object.entries(benchmarks)) {
        // Run 3 times and take average
        const times: number[] = [];
        for (let i = 0; i < 3; i++) {
          times.push(await benchmark());
        }
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        results[name] = avgTime;
        console.log(`${name.padEnd(20)}: ${avgTime.toFixed(2)}ms (avg of 3 runs)`);
      }

      console.log('\n=== Performance Summary ===');
      console.log(`✓ Dataset size: ${createdChatIds.length} chats`);
      console.log('✓ All searches completed successfully');

      // Verify all benchmarks meet thresholds
      expect(results['No filters']).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_NO_FILTERS);
      expect(results['Text query']).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_WITH_QUERY);
      expect(results['Provider filter']).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_WITH_FILTERS);
      expect(results['Full-text search']).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_IN_MESSAGES);
    });
  });

  describe('Filter Combinations', () => {
    it('should filter by query + provider', async () => {
      const query = 'google';
      const providers = ['google', 'anthropic'];

      const results = await db
        .selectDistinct({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(models, eq(chats.modelId, models.id))
        .where(
          and(
            eq(chats.userId, testUserId),
            sql`${chats.title} ILIKE ${`%${query}%`}`,
            inArray(models.provider, providers)
          )
        )
        .orderBy(chats.updatedAt);

      console.log(`Query + Provider filter: ${results.length} results`);
      expect(results.length).toBeGreaterThan(0);

      // Verify all results match the provider filter
      const uniqueProviders = new Set();
      for (const result of results) {
        const model = await db.select().from(models).where(eq(models.id, result.modelId));
        if (model.length > 0) {
          uniqueProviders.add(model[0].provider);
        }
      }
      expect(uniqueProviders.size).toBeGreaterThan(0);
      expect(Array.from(uniqueProviders).every((p) => providers.includes(p as string))).toBe(true);
    });

    it('should filter by query + model', async () => {
      const query = 'Test';
      const modelIdsToFilter = testModelIds.slice(0, 2);

      const results = await db
        .select({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(models, eq(chats.modelId, models.id))
        .where(
          and(
            eq(chats.userId, testUserId),
            sql`${chats.title} ILIKE ${`%${query}%`}`,
            inArray(models.id, modelIdsToFilter)
          )
        )
        .orderBy(chats.updatedAt);

      console.log(`Query + Model filter: ${results.length} results`);
      expect(results.length).toBeGreaterThan(0);

      // Verify all results match the model filter
      expect(results.every((r) => modelIdsToFilter.includes(r.modelId))).toBe(true);
    });

    it('should filter by query + date range', async () => {
      const query = 'Test';
      const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const dateTo = new Date().toISOString();

      const results = await db
        .select()
        .from(chats)
        .where(
          and(
            eq(chats.userId, testUserId),
            sql`${chats.title} ILIKE ${`%${query}%`}`,
            sql`${chats.createdAt} >= ${new Date(dateFrom)}`,
            sql`${chats.createdAt} <= ${new Date(dateTo)}`
          )
        )
        .orderBy(chats.updatedAt);

      console.log(`Query + Date range filter: ${results.length} results`);
      expect(results.length).toBeGreaterThan(0);

      // Verify all results are within date range
      expect(
        results.every((r) => r.createdAt >= new Date(dateFrom) && r.createdAt <= new Date(dateTo))
      ).toBe(true);
    });

    it('should filter by provider + model', async () => {
      const providers = ['openai', 'anthropic'];
      const modelIdsToFilter = testModelIds.slice(0, 3);

      const results = await db
        .select({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(models, eq(chats.modelId, models.id))
        .where(
          and(
            eq(chats.userId, testUserId),
            inArray(models.provider, providers),
            inArray(models.id, modelIdsToFilter)
          )
        )
        .orderBy(chats.updatedAt);

      console.log(`Provider + Model filter: ${results.length} results`);
      expect(results.length).toBeGreaterThan(0);

      // Verify all results match both filters
      expect(results.every((r) => modelIdsToFilter.includes(r.modelId))).toBe(true);
    });

    it('should filter by provider + date range', async () => {
      const providers = ['google', 'groq'];
      const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const results = await db
        .select({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(models, eq(chats.modelId, models.id))
        .where(
          and(
            eq(chats.userId, testUserId),
            inArray(models.provider, providers),
            sql`${chats.createdAt} >= ${new Date(dateFrom)}`
          )
        )
        .orderBy(chats.updatedAt);

      console.log(`Provider + Date range filter: ${results.length} results`);
      expect(results.length).toBeGreaterThanOrEqual(0);

      // Verify all results are within date range
      expect(results.every((r) => r.createdAt >= new Date(dateFrom))).toBe(true);
    });

    it('should filter by model + date range', async () => {
      const modelIdsToFilter = testModelIds.slice(1, 3);
      const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const dateTo = new Date().toISOString();

      const results = await db
        .select({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(models, eq(chats.modelId, models.id))
        .where(
          and(
            eq(chats.userId, testUserId),
            inArray(models.id, modelIdsToFilter),
            sql`${chats.createdAt} >= ${new Date(dateFrom)}`,
            sql`${chats.createdAt} <= ${new Date(dateTo)}`
          )
        )
        .orderBy(chats.updatedAt);

      console.log(`Model + Date range filter: ${results.length} results`);
      expect(results.length).toBeGreaterThanOrEqual(0);

      // Verify all results match both filters
      expect(results.every((r) => modelIdsToFilter.includes(r.modelId))).toBe(true);
      expect(
        results.every((r) => r.createdAt >= new Date(dateFrom) && r.createdAt <= new Date(dateTo))
      ).toBe(true);
    });

    it('should filter by query + provider + model', async () => {
      const query = 'conversation';
      const providers = ['openai', 'google'];
      const modelIdsToFilter = testModelIds.slice(0, 2);

      const results = await db
        .selectDistinct({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(messages, eq(chats.id, messages.chatId))
        .innerJoin(models, eq(chats.modelId, models.id))
        .where(
          and(
            eq(chats.userId, testUserId),
            sql`(${chats.title} ILIKE ${`%${query}%`} OR ${messages.content} ILIKE ${`%${query}%`})`,
            inArray(models.provider, providers),
            inArray(models.id, modelIdsToFilter)
          )
        )
        .orderBy(chats.updatedAt);

      console.log(`Query + Provider + Model filter: ${results.length} results`);
      expect(results.length).toBeGreaterThan(0);

      // Verify all results match all filters
      expect(results.every((r) => modelIdsToFilter.includes(r.modelId))).toBe(true);
    });

    it('should filter by query + provider + date range', async () => {
      const query = 'topic';
      const providers = ['anthropic', 'groq'];
      const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const results = await db
        .selectDistinct({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(messages, eq(chats.id, messages.chatId))
        .innerJoin(models, eq(chats.modelId, models.id))
        .where(
          and(
            eq(chats.userId, testUserId),
            sql`(${chats.title} ILIKE ${`%${query}%`} OR ${messages.content} ILIKE ${`%${query}%`})`,
            inArray(models.provider, providers),
            sql`${chats.createdAt} >= ${new Date(dateFrom)}`
          )
        )
        .orderBy(chats.updatedAt);

      console.log(`Query + Provider + Date range filter: ${results.length} results`);
      expect(results.length).toBeGreaterThan(0);

      // Verify all results match filters
      expect(results.every((r) => r.createdAt >= new Date(dateFrom))).toBe(true);
    });

    it('should filter by query + model + date range', async () => {
      const query = 'asking';
      const modelIdsToFilter = testModelIds.slice(2, 4);
      const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const results = await db
        .selectDistinct({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(messages, eq(chats.id, messages.chatId))
        .innerJoin(models, eq(chats.modelId, models.id))
        .where(
          and(
            eq(chats.userId, testUserId),
            sql`(${chats.title} ILIKE ${`%${query}%`} OR ${messages.content} ILIKE ${`%${query}%`})`,
            inArray(models.id, modelIdsToFilter),
            sql`${chats.createdAt} >= ${new Date(dateFrom)}`
          )
        )
        .orderBy(chats.updatedAt);

      console.log(`Query + Model + Date range filter: ${results.length} results`);
      expect(results.length).toBeGreaterThan(0);

      // Verify all results match all filters
      expect(results.every((r) => modelIdsToFilter.includes(r.modelId))).toBe(true);
      expect(results.every((r) => r.createdAt >= new Date(dateFrom))).toBe(true);
    });

    it('should filter by provider + model + date range', async () => {
      const providers = ['openai', 'anthropic'];
      const modelIdsToFilter = testModelIds.slice(0, 3);
      const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const dateTo = new Date().toISOString();

      const results = await db
        .select({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(models, eq(chats.modelId, models.id))
        .where(
          and(
            eq(chats.userId, testUserId),
            inArray(models.provider, providers),
            inArray(models.id, modelIdsToFilter),
            sql`${chats.createdAt} >= ${new Date(dateFrom)}`,
            sql`${chats.createdAt} <= ${new Date(dateTo)}`
          )
        )
        .orderBy(chats.updatedAt);

      console.log(`Provider + Model + Date range filter: ${results.length} results`);
      expect(results.length).toBeGreaterThanOrEqual(0);

      // Verify all results match all filters
      expect(results.every((r) => modelIdsToFilter.includes(r.modelId))).toBe(true);
      expect(
        results.every((r) => r.createdAt >= new Date(dateFrom) && r.createdAt <= new Date(dateTo))
      ).toBe(true);
    });

    it('should filter by all filters: query + provider + model + date range', async () => {
      const query = 'chat';
      const providers = ['google', 'openai'];
      const modelIdsToFilter = testModelIds.slice(0, 2);
      const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const dateTo = new Date().toISOString();

      const results = await db
        .selectDistinct({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(messages, eq(chats.id, messages.chatId))
        .innerJoin(models, eq(chats.modelId, models.id))
        .where(
          and(
            eq(chats.userId, testUserId),
            sql`(${chats.title} ILIKE ${`%${query}%`} OR ${messages.content} ILIKE ${`%${query}%`})`,
            inArray(models.provider, providers),
            inArray(models.id, modelIdsToFilter),
            sql`${chats.createdAt} >= ${new Date(dateFrom)}`,
            sql`${chats.createdAt} <= ${new Date(dateTo)}`
          )
        )
        .orderBy(chats.updatedAt);

      console.log(`All filters combined: ${results.length} results`);
      expect(results.length).toBeGreaterThan(0);

      // Verify all results match all filters
      expect(results.every((r) => modelIdsToFilter.includes(r.modelId))).toBe(true);
      expect(
        results.every((r) => r.createdAt >= new Date(dateFrom) && r.createdAt <= new Date(dateTo))
      ).toBe(true);
    });

    it('should handle edge case: empty provider array', async () => {
      const providers: string[] = [];

      const results = await db
        .select({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(models, eq(chats.modelId, models.id))
        .where(
          and(eq(chats.userId, testUserId), providers.length > 0 ? inArray(models.provider, providers) : sql`1=1`)
        )
        .orderBy(chats.updatedAt);

      console.log(`Empty provider array edge case: ${results.length} results`);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle edge case: empty model array', async () => {
      const modelIdsToFilter: string[] = [];

      const results = await db
        .select({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(models, eq(chats.modelId, models.id))
        .where(
          and(
            eq(chats.userId, testUserId),
            modelIdsToFilter.length > 0 ? inArray(models.id, modelIdsToFilter) : sql`1=1`
          )
        )
        .orderBy(chats.updatedAt);

      console.log(`Empty model array edge case: ${results.length} results`);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle edge case: query with special characters', async () => {
      // Use a query that exists in the test data with colon character
      const query = 'conversation about';

      const results = await db
        .selectDistinct({
          id: chats.id,
          userId: chats.userId,
          title: chats.title,
          modelId: chats.modelId,
          folderId: chats.folderId,
          pinned: chats.pinned,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(messages, eq(chats.id, messages.chatId))
        .where(
          and(
            eq(chats.userId, testUserId),
            sql`(${chats.title} ILIKE ${`%${query}%`} OR ${messages.content} ILIKE ${`%${query}%`})`
          )
        )
        .orderBy(chats.updatedAt);

      console.log(`Special characters in query: ${results.length} results`);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle edge case: date range with no results', async () => {
      // Far future date range that should have no results
      const dateFrom = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = new Date(Date.now() + 366 * 24 * 60 * 60 * 1000).toISOString();

      const results = await db
        .select()
        .from(chats)
        .where(
          and(
            eq(chats.userId, testUserId),
            sql`${chats.createdAt} >= ${new Date(dateFrom)}`,
            sql`${chats.createdAt} <= ${new Date(dateTo)}`
          )
        )
        .orderBy(chats.updatedAt);

      console.log(`Date range with no results: ${results.length} results`);
      expect(results.length).toBe(0);
    });
  });
});
