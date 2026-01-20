/**
 * Chat Search Performance Tests
 *
 * Purpose: Verify search performance with large datasets (100+ chats, 1000+ messages)
 *
 * Run with: bun test packages/api/src/routers/chat.test.ts
 */

// Set up minimal environment variables for testing
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/sambungchat_dev';
process.env.BETTER_AUTH_SECRET = 'sambungchat-dev-secret-key-at-least-32-chars-long';
process.env.BETTER_AUTH_URL = 'http://localhost:3000';
process.env.ENCRYPTION_KEY = '1234567890abcdef1234567890abcdef';
process.env.NODE_ENV = 'test';

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@sambung-chat/db';
import { chats, messages } from '@sambung-chat/db/schema/chat';
import { models } from '@sambung-chat/db/schema/model';
import { user } from '@sambung-chat/db/schema/auth';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { generateULID } from '@sambung-chat/db/utils/ulid';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  SEARCH_NO_FILTERS: 500, // Search with no filters
  SEARCH_WITH_QUERY: 1000, // Search with text query
  SEARCH_WITH_FILTERS: 1500, // Search with multiple filters
  SEARCH_IN_MESSAGES: 2000, // Full-text search across messages
};

describe('Chat Search Performance Tests', () => {
  let testUserId: string;
  let testModelIds: string[] = [];
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
    const providers = ['openai', 'anthropic', 'google', 'groq'];

    for (const provider of providers) {
      const [newModel] = await db
        .insert(models)
        .values({
          userId: testUserId,
          provider: provider as any,
          modelId: `${provider}-model-1`,
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Model`,
        })
        .returning();

      testModelIds.push(newModel.id);
    }
  });

  afterAll(async () => {
    // Clean up test data
    // Delete messages first (due to foreign key)
    if (createdChatIds.length > 0) {
      await db.delete(messages).where(inArray(messages.chatId, createdChatIds));
    }

    // Delete chats
    for (const chatId of createdChatIds) {
      await db.delete(chats).where(eq(chats.id, chatId));
    }

    // Delete test models
    for (const modelId of testModelIds) {
      await db.delete(models).where(eq(models.id, modelId));
    }

    // Delete test user
    await db.delete(user).where(eq(user.id, testUserId));
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
              role: role as any,
              content: content,
            })
          );
        }

        await Promise.all(messagePromises);
      }

      console.timeEnd('Dataset creation');

      // Verify dataset was created
      const chatCount = await db
        .select()
        .from(chats)
        .where(eq(chats.userId, testUserId));

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

      console.log(`Search with query "${query}": ${duration.toFixed(2)}ms (${results.length} results)`);

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

      console.log(`Search with provider filter: ${duration.toFixed(2)}ms (${results.length} results)`);

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

      console.log(
        `Combined filters search: ${duration.toFixed(2)}ms (${results.length} results)`
      );

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
          and(
            inArray(messages.chatId, chatIds),
            sql`${messages.content} ILIKE ${`%${query}%`}`
          )
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
          await db.select().from(chats).where(eq(chats.userId, testUserId)).orderBy(chats.updatedAt);
          return performance.now() - start;
        },
        'Text query': async () => {
          const start = performance.now();
          await db
            .select()
            .from(chats)
            .where(
              and(eq(chats.userId, testUserId), sql`${chats.title} ILIKE ${'%Test%'}`)
            )
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
              and(
                eq(chats.userId, testUserId),
                sql`${messages.content} ILIKE ${'%capabilities%'}`
              )
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
});
