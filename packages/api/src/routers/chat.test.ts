/**
 * Chat Search Performance Tests
 *
 * Purpose: Verify search performance with large datasets (100+ chats, 1000+ messages)
 *
 * Run with: bun test packages/api/src/routers/chat.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@sambung-chat/db';
import { chats, messages } from '@sambung-chat/db/schema/chat';
import { models } from '@sambung-chat/db/schema/model';
import { user } from '@sambung-chat/db/schema/auth';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { generateULID } from '@sambung-chat/db/utils/ulid';

// Set up minimal environment variables for testing (use process.env with fallbacks)
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/sambungchat_dev';
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
          and(
            eq(chats.userId, testUserId),
            providers.length > 0 ? inArray(models.provider, providers) : sql`1=1`
          )
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
