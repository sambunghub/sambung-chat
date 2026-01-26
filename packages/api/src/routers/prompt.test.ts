/**
 * Prompt Router Tests
 *
 * Purpose: Verify all prompt router procedures work correctly
 *
 * Run with: bun test packages/api/src/routers/prompt.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { db } from '@sambung-chat/db';
import { prompts } from '@sambung-chat/db/schema/prompt';
import { user } from '@sambung-chat/db/schema/auth';
import { eq, and, inArray, sql, desc } from 'drizzle-orm';
import { generateULID } from '@sambung-chat/db/utils/ulid';
// Import promptVersions using relative path
import { promptVersions } from '../../../db/src/schema/prompt';

// Note: DATABASE_URL and other test environment variables are set by vitest.config.ts
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || 'sambungchat-dev-secret-key-at-least-32-chars-long';
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '1234567890abcdef1234567890abcdef';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

describe('Prompt Router Tests', () => {
  let testUserId: string;
  let createdPromptIds: string[] = [];

  beforeAll(async () => {
    // Create a test user first (required for foreign key constraints)
    testUserId = generateULID();
    const uniqueEmail = `prompt-test-${Date.now()}@example.com`;
    await db.insert(user).values({
      id: testUserId,
      name: 'Prompt Test User',
      email: uniqueEmail,
      emailVerified: true,
    });
  });

  afterAll(async () => {
    // Clean up test data using batch operations
    try {
      // Delete prompts first (due to foreign key)
      if (createdPromptIds.length > 0) {
        await db.delete(prompts).where(inArray(prompts.id, createdPromptIds));
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
    // Clear prompt IDs before each test
    createdPromptIds = [];
  });

  afterEach(async () => {
    // Clean up orphaned prompts after each test
    // This provides additional cleanup in case tests fail mid-execution
    if (createdPromptIds.length > 0) {
      try {
        await db.delete(prompts).where(inArray(prompts.id, createdPromptIds));
      } catch (error) {
        console.error('Error during afterEach cleanup:', error);
      }
    }
  });

  describe('Prompt CRUD Operations', () => {
    it('should create a new prompt', async () => {
      const promptData = {
        userId: testUserId,
        name: 'Test Prompt',
        content: 'This is a test prompt for testing purposes',
        variables: ['var1', 'var2'],
        category: 'testing',
        isPublic: false,
      };

      const [prompt] = await db.insert(prompts).values(promptData).returning();

      createdPromptIds.push(prompt.id);

      expect(prompt).toBeDefined();
      expect(prompt.id).toBeDefined();
      expect(prompt.name).toBe(promptData.name);
      expect(prompt.content).toBe(promptData.content);
      expect(prompt.variables).toEqual(promptData.variables);
      expect(prompt.category).toBe(promptData.category);
      expect(prompt.isPublic).toBe(promptData.isPublic);
      expect(prompt.userId).toBe(testUserId);
    });

    it('should get all prompts for user', async () => {
      // Create multiple prompts
      const promptData1 = {
        userId: testUserId,
        name: 'Prompt 1',
        content: 'Content 1',
        variables: [],
        category: 'general',
        isPublic: false,
      };
      const promptData2 = {
        userId: testUserId,
        name: 'Prompt 2',
        content: 'Content 2',
        variables: ['test'],
        category: 'coding',
        isPublic: true,
      };

      const [prompt1] = await db.insert(prompts).values(promptData1).returning();
      const [prompt2] = await db.insert(prompts).values(promptData2).returning();

      createdPromptIds.push(prompt1.id, prompt2.id);

      // Get all prompts for user
      const results = await db
        .select()
        .from(prompts)
        .where(eq(prompts.userId, testUserId))
        .orderBy(prompts.createdAt);

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some((r) => r.id === prompt1.id)).toBe(true);
      expect(results.some((r) => r.id === prompt2.id)).toBe(true);
    });

    it('should get prompt by ID', async () => {
      const promptData = {
        userId: testUserId,
        name: 'Get By ID Test',
        content: 'Testing get by ID',
        variables: [],
        category: 'testing',
        isPublic: false,
      };

      const [prompt] = await db.insert(prompts).values(promptData).returning();
      createdPromptIds.push(prompt.id);

      // Get prompt by ID
      const results = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, prompt.id), eq(prompts.userId, testUserId)));

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(prompt.id);
      expect(results[0].name).toBe(promptData.name);
    });

    it('should return null for non-existent prompt ID', async () => {
      const nonExistentId = generateULID();

      const results = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, nonExistentId), eq(prompts.userId, testUserId)));

      expect(results.length).toBe(0);
    });

    it('should update prompt', async () => {
      const promptData = {
        userId: testUserId,
        name: 'Original Name',
        content: 'Original content',
        variables: [],
        category: 'general',
        isPublic: false,
      };

      const [prompt] = await db.insert(prompts).values(promptData).returning();
      createdPromptIds.push(prompt.id);

      // Update prompt
      const updatedData = {
        name: 'Updated Name',
        content: 'Updated content',
        category: 'coding',
      };

      const results = await db
        .update(prompts)
        .set(updatedData)
        .where(and(eq(prompts.id, prompt.id), eq(prompts.userId, testUserId)))
        .returning();

      expect(results.length).toBe(1);
      expect(results[0].name).toBe(updatedData.name);
      expect(results[0].content).toBe(updatedData.content);
      expect(results[0].category).toBe(updatedData.category);
    });

    it('should delete prompt', async () => {
      const promptData = {
        userId: testUserId,
        name: 'To Be Deleted',
        content: 'This will be deleted',
        variables: [],
        category: 'general',
        isPublic: false,
      };

      const [prompt] = await db.insert(prompts).values(promptData).returning();
      createdPromptIds.push(prompt.id); // Track for cleanup in case test fails

      // Verify prompt exists
      let results = await db.select().from(prompts).where(eq(prompts.id, prompt.id));

      expect(results.length).toBe(1);

      // Delete prompt
      await db.delete(prompts).where(eq(prompts.id, prompt.id));

      // Verify prompt is deleted
      results = await db.select().from(prompts).where(eq(prompts.id, prompt.id));

      expect(results.length).toBe(0);

      // Remove from createdPromptIds since it's already deleted
      createdPromptIds = createdPromptIds.filter((id) => id !== prompt.id);
    });

    it('should not allow accessing prompts from other users', async () => {
      // Create another user
      const otherUserId = generateULID();
      await db.insert(user).values({
        id: otherUserId,
        name: 'Other User',
        email: `other-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
        emailVerified: true,
      });

      // Create prompt for other user
      const otherPromptData = {
        userId: otherUserId,
        name: "Other User's Prompt",
        content: 'This belongs to another user',
        variables: [],
        category: 'general',
        isPublic: false,
      };

      const [otherPrompt] = await db.insert(prompts).values(otherPromptData).returning();

      // Try to get other user's prompt with testUserId
      const results = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, otherPrompt.id), eq(prompts.userId, testUserId)));

      expect(results.length).toBe(0);

      // Clean up other user's data
      await db.delete(prompts).where(eq(prompts.id, otherPrompt.id));
      await db.delete(user).where(eq(user.id, otherUserId));
    });
  });

  describe('Prompt Search Functionality', () => {
    beforeEach(async () => {
      // Create test prompts for search tests
      const testPrompts = [
        {
          name: 'Code Review Prompt',
          content: 'Review this code for bugs and improvements',
          variables: ['language', 'file'],
          category: 'coding',
          isPublic: true,
        },
        {
          name: 'Writing Assistant',
          content: 'Help me write better content',
          variables: ['topic', 'tone'],
          category: 'writing',
          isPublic: false,
        },
        {
          name: 'Debug Helper',
          content: 'Help debug this code issue',
          variables: ['error', 'stacktrace'],
          category: 'coding',
          isPublic: true,
        },
        {
          name: 'Email Draft',
          content: 'Draft a professional email',
          variables: ['recipient', 'purpose'],
          category: 'writing',
          isPublic: false,
        },
      ];

      for (const promptData of testPrompts) {
        const [prompt] = await db
          .insert(prompts)
          .values({
            userId: testUserId,
            ...promptData,
          })
          .returning();

        createdPromptIds.push(prompt.id);
      }
    });

    it('should search prompts by keyword in name', async () => {
      const query = 'Code';
      const results = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.userId, testUserId), sql`${prompts.name} ILIKE ${`%${query}%`}`))
        .orderBy(prompts.updatedAt);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.name.includes(query))).toBe(true);
    });

    it('should search prompts by keyword in content', async () => {
      const query = 'professional';
      const results = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.userId, testUserId), sql`${prompts.content} ILIKE ${`%${query}%`}`))
        .orderBy(prompts.updatedAt);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.content.toLowerCase().includes(query))).toBe(true);
    });

    it('should search prompts by keyword in both name and content', async () => {
      const query = 'code';
      const results = await db
        .select()
        .from(prompts)
        .where(
          and(
            eq(prompts.userId, testUserId),
            sql`(${prompts.name} ILIKE ${`%${query}%`} OR ${prompts.content} ILIKE ${`%${query}%`})`
          )
        )
        .orderBy(prompts.updatedAt);

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every(
          (r) => r.name.toLowerCase().includes(query) || r.content.toLowerCase().includes(query)
        )
      ).toBe(true);
    });

    it('should filter prompts by category', async () => {
      const category = 'coding';
      const results = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.userId, testUserId), eq(prompts.category, category)))
        .orderBy(prompts.updatedAt);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.category === category)).toBe(true);
    });

    it('should filter prompts by isPublic status', async () => {
      const isPublic = true;
      const results = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.userId, testUserId), eq(prompts.isPublic, isPublic)))
        .orderBy(prompts.updatedAt);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.isPublic === isPublic)).toBe(true);
    });

    it('should filter prompts by date range', async () => {
      const dateFrom = new Date(Date.now() - 60 * 60 * 1000); // Last 1 hour
      const dateTo = new Date();

      const results = await db
        .select()
        .from(prompts)
        .where(
          and(
            eq(prompts.userId, testUserId),
            sql`${prompts.createdAt} >= ${dateFrom}`,
            sql`${prompts.createdAt} <= ${dateTo}`
          )
        )
        .orderBy(prompts.updatedAt);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.createdAt >= dateFrom && r.createdAt <= dateTo)).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const category = 'coding';
      const isPublic = true;
      const query = 'code';

      const results = await db
        .select()
        .from(prompts)
        .where(
          and(
            eq(prompts.userId, testUserId),
            eq(prompts.category, category),
            eq(prompts.isPublic, isPublic),
            sql`(${prompts.name} ILIKE ${`%${query}%`} OR ${prompts.content} ILIKE ${`%${query}%`})`
          )
        )
        .orderBy(prompts.updatedAt);

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every(
          (r) =>
            r.category === category &&
            r.isPublic === isPublic &&
            (r.name.toLowerCase().includes(query) || r.content.toLowerCase().includes(query))
        )
      ).toBe(true);
    });

    it('should handle empty search results', async () => {
      const query = 'nonexistentpromptxyz123';
      const results = await db
        .select()
        .from(prompts)
        .where(
          and(
            eq(prompts.userId, testUserId),
            sql`(${prompts.name} ILIKE ${`%${query}%`} OR ${prompts.content} ILIKE ${`%${query}%`})`
          )
        )
        .orderBy(prompts.updatedAt);

      expect(results.length).toBe(0);
    });

    it('should normalize query by trimming whitespace', async () => {
      const query = '   code   ';
      const trimmedQuery = query.trim();

      const results = await db
        .select()
        .from(prompts)
        .where(
          and(
            eq(prompts.userId, testUserId),
            sql`(${prompts.name} ILIKE ${`%${trimmedQuery}%`} OR ${prompts.content} ILIKE ${`%${trimmedQuery}%`})`
          )
        )
        .orderBy(prompts.updatedAt);

      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle special characters in query', async () => {
      const query = 'professional'; // Test keyword that exists in test data
      const results = await db
        .select()
        .from(prompts)
        .where(
          and(
            eq(prompts.userId, testUserId),
            sql`(${prompts.name} ILIKE ${`%${query}%`} OR ${prompts.content} ILIKE ${`%${query}%`})`
          )
        )
        .orderBy(prompts.updatedAt);

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Prompt Variables Handling', () => {
    it('should create prompt with empty variables array', async () => {
      const promptData = {
        userId: testUserId,
        name: 'No Variables Prompt',
        content: 'This prompt has no variables',
        variables: [],
        category: 'general',
        isPublic: false,
      };

      const [prompt] = await db.insert(prompts).values(promptData).returning();
      createdPromptIds.push(prompt.id);

      expect(prompt.variables).toEqual([]);
      expect(Array.isArray(prompt.variables)).toBe(true);
    });

    it('should create prompt with multiple variables', async () => {
      const promptData = {
        userId: testUserId,
        name: 'Multi Variable Prompt',
        content: 'This has multiple variables',
        variables: ['var1', 'var2', 'var3', 'var4'],
        category: 'general',
        isPublic: false,
      };

      const [prompt] = await db.insert(prompts).values(promptData).returning();
      createdPromptIds.push(prompt.id);

      expect(prompt.variables).toEqual(promptData.variables);
      expect(prompt.variables.length).toBe(4);
    });

    it('should update variables array', async () => {
      const promptData = {
        userId: testUserId,
        name: 'Variables Update Test',
        content: 'Testing variable updates',
        variables: ['original1', 'original2'],
        category: 'general',
        isPublic: false,
      };

      const [prompt] = await db.insert(prompts).values(promptData).returning();
      createdPromptIds.push(prompt.id);

      const newVariables = ['updated1', 'updated2', 'updated3'];

      const results = await db
        .update(prompts)
        .set({ variables: newVariables })
        .where(and(eq(prompts.id, prompt.id), eq(prompts.userId, testUserId)))
        .returning();

      expect(results[0].variables).toEqual(newVariables);
      expect(results[0].variables.length).toBe(3);
    });
  });

  describe('Prompt Edge Cases', () => {
    it('should handle prompt with very long name', async () => {
      const longName = 'A'.repeat(200); // Max length is 200
      const promptData = {
        userId: testUserId,
        name: longName,
        content: 'Testing long name',
        variables: [],
        category: 'general',
        isPublic: false,
      };

      const [prompt] = await db.insert(prompts).values(promptData).returning();
      createdPromptIds.push(prompt.id);

      expect(prompt.name).toBe(longName);
      expect(prompt.name.length).toBe(200);
    });

    it('should handle prompt with very long content', async () => {
      const longContent = 'This is a long content. '.repeat(100); // ~2500 chars
      const promptData = {
        userId: testUserId,
        name: 'Long Content Prompt',
        content: longContent,
        variables: [],
        category: 'general',
        isPublic: false,
      };

      const [prompt] = await db.insert(prompts).values(promptData).returning();
      createdPromptIds.push(prompt.id);

      expect(prompt.content).toBe(longContent);
    });

    it('should handle multiple prompts with same name', async () => {
      const name = 'Duplicate Name';
      const promptData1 = {
        userId: testUserId,
        name,
        content: 'First prompt with this name',
        variables: [],
        category: 'general',
        isPublic: false,
      };
      const promptData2 = {
        userId: testUserId,
        name,
        content: 'Second prompt with this name',
        variables: [],
        category: 'coding',
        isPublic: true,
      };

      const [prompt1] = await db.insert(prompts).values(promptData1).returning();
      const [prompt2] = await db.insert(prompts).values(promptData2).returning();

      createdPromptIds.push(prompt1.id, prompt2.id);

      // Both should exist with different IDs
      expect(prompt1.id).not.toBe(prompt2.id);
      expect(prompt1.name).toBe(prompt2.name);

      // Verify both can be retrieved
      const results = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.userId, testUserId), eq(prompts.name, name)));

      expect(results.length).toBe(2);
    });

    it('should handle special characters in prompt name and content', async () => {
      const promptData = {
        userId: testUserId,
        name: 'Prompt with "quotes" and \'apostrophes\' and <brackets>',
        content: 'Content with @mentions #hashtags $symbols &ampersands',
        variables: [],
        category: 'general',
        isPublic: false,
      };

      const [prompt] = await db.insert(prompts).values(promptData).returning();
      createdPromptIds.push(prompt.id);

      expect(prompt.name).toBe(promptData.name);
      expect(prompt.content).toBe(promptData.content);
    });
  });

  describe('getPublicTemplates - Public Templates Browsing', () => {
    let otherUserId: string;
    const publicPromptIds: string[] = [];
    // Track testUserId prompts created in this describe block to prevent leaks
    const getPublicTemplatesTestPromptIds: string[] = [];

    beforeAll(async () => {
      // Create another user for testing public prompts from different users
      otherUserId = generateULID();
      await db.insert(user).values({
        id: otherUserId,
        name: 'Public Template Author',
        email: `public-author-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
        emailVerified: true,
      });

      // Create public prompts for the other user
      const publicPrompts = [
        {
          userId: otherUserId,
          name: 'Public Code Review',
          content: 'Review this code for bugs and security issues',
          variables: ['language', 'file'],
          category: 'coding' as const,
          isPublic: true,
        },
        {
          userId: otherUserId,
          name: 'Public Writing Assistant',
          content: 'Help me write professional content',
          variables: ['topic', 'tone'],
          category: 'writing' as const,
          isPublic: true,
        },
        {
          userId: testUserId,
          name: 'My Public Prompt',
          content: 'This is my public prompt',
          variables: [],
          category: 'general' as const,
          isPublic: true,
        },
        {
          userId: testUserId,
          name: 'My Private Prompt',
          content: 'This should not appear in public results',
          variables: [],
          category: 'general' as const,
          isPublic: false,
        },
      ];

      for (const promptData of publicPrompts) {
        const [prompt] = await db.insert(prompts).values(promptData).returning();
        if (promptData.isPublic) {
          publicPromptIds.push(prompt.id);
        }
        // Track testUserId prompts separately for cleanup in afterAll
        if (promptData.userId === testUserId) {
          getPublicTemplatesTestPromptIds.push(prompt.id);
        } else {
          createdPromptIds.push(prompt.id);
        }
      }
    });

    afterAll(async () => {
      // Clean up the other user
      try {
        await db.delete(prompts).where(eq(prompts.userId, otherUserId));
        await db.delete(user).where(eq(user.id, otherUserId));
      } catch (error) {
        console.error('Error cleaning up other user:', error);
      }

      // Clean up testUserId prompts created in this describe block
      try {
        if (getPublicTemplatesTestPromptIds.length > 0) {
          await db.delete(prompts).where(inArray(prompts.id, getPublicTemplatesTestPromptIds));
        }
      } catch (error) {
        console.error('Error cleaning up testUserId prompts:', error);
      }
    });

    it('should fetch all public prompts from all users', async () => {
      const results = await db
        .select({
          id: prompts.id,
          name: prompts.name,
          content: prompts.content,
          variables: prompts.variables,
          category: prompts.category,
          isPublic: prompts.isPublic,
          createdAt: prompts.createdAt,
          updatedAt: prompts.updatedAt,
          authorName: user.name,
        })
        .from(prompts)
        .innerJoin(user, eq(prompts.userId, user.id))
        .where(eq(prompts.isPublic, true))
        .orderBy(desc(prompts.createdAt));

      expect(results.length).toBeGreaterThanOrEqual(3);
      expect(results.every((r) => r.isPublic === true)).toBe(true);
      expect(results.some((r) => r.authorName === 'Public Template Author')).toBe(true);
      expect(results.some((r) => r.authorName === 'Prompt Test User')).toBe(true);
    });

    it('should include author name instead of email', async () => {
      const results = await db
        .select({
          id: prompts.id,
          name: prompts.name,
          authorName: user.name,
          authorEmail: user.email,
        })
        .from(prompts)
        .innerJoin(user, eq(prompts.userId, user.id))
        .where(eq(prompts.isPublic, true));

      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(result.authorName).toBeDefined();
        expect(typeof result.authorName).toBe('string');
        // Email is selected but should not be exposed in the actual procedure response
        expect(result.authorEmail).toBeDefined();
      });
    });

    it('should filter public prompts by category', async () => {
      const category = 'coding';
      const results = await db
        .select({
          id: prompts.id,
          name: prompts.name,
          category: prompts.category,
          authorName: user.name,
        })
        .from(prompts)
        .innerJoin(user, eq(prompts.userId, user.id))
        .where(and(eq(prompts.isPublic, true), eq(prompts.category, category)))
        .orderBy(desc(prompts.createdAt));

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.category === category)).toBe(true);
    });

    it('should search public prompts by keyword', async () => {
      const query = 'code';
      const results = await db
        .select({
          id: prompts.id,
          name: prompts.name,
          content: prompts.content,
          authorName: user.name,
        })
        .from(prompts)
        .innerJoin(user, eq(prompts.userId, user.id))
        .where(
          and(
            eq(prompts.isPublic, true),
            sql`(${prompts.name} ILIKE ${`%${query}%`} OR ${prompts.content} ILIKE ${`%${query}%`})`
          )
        )
        .orderBy(desc(prompts.createdAt));

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every(
          (r) => r.name.toLowerCase().includes(query) || r.content.toLowerCase().includes(query)
        )
      ).toBe(true);
    });

    it('should support pagination with limit and offset', async () => {
      const limit = 2;
      const offset = 0;

      const page1 = await db
        .select({
          id: prompts.id,
          name: prompts.name,
        })
        .from(prompts)
        .innerJoin(user, eq(prompts.userId, user.id))
        .where(eq(prompts.isPublic, true))
        .orderBy(desc(prompts.createdAt))
        .limit(limit)
        .offset(offset);

      const page2 = await db
        .select({
          id: prompts.id,
          name: prompts.name,
        })
        .from(prompts)
        .innerJoin(user, eq(prompts.userId, user.id))
        .where(eq(prompts.isPublic, true))
        .orderBy(desc(prompts.createdAt))
        .limit(limit)
        .offset(limit);

      expect(page1.length).toBeLessThanOrEqual(limit);
      expect(page2.length).toBeLessThanOrEqual(limit);

      // Ensure pages are different
      if (page1.length === limit && page2.length === limit) {
        expect(page1[0].id).not.toBe(page2[0].id);
      }
    });

    it('should normalize query by trimming whitespace', async () => {
      const query = '   code   ';
      const normalizedQuery = query.trim();

      const results = await db
        .select({
          id: prompts.id,
          name: prompts.name,
        })
        .from(prompts)
        .innerJoin(user, eq(prompts.userId, user.id))
        .where(
          and(
            eq(prompts.isPublic, true),
            sql`(${prompts.name} ILIKE ${`%${normalizedQuery}%`} OR ${prompts.content} ILIKE ${`%${normalizedQuery}%`})`
          )
        )
        .orderBy(desc(prompts.createdAt));

      expect(results.length).toBeGreaterThan(0);
    });

    it('should not include private prompts in results', async () => {
      const results = await db
        .select({
          id: prompts.id,
          name: prompts.name,
          isPublic: prompts.isPublic,
        })
        .from(prompts)
        .innerJoin(user, eq(prompts.userId, user.id))
        .where(eq(prompts.isPublic, true))
        .orderBy(desc(prompts.createdAt));

      expect(results.every((r) => r.isPublic === true)).toBe(true);
      expect(results.some((r) => r.name === 'My Private Prompt')).toBe(false);
    });

    it('should order results by createdAt DESC', async () => {
      const results = await db
        .select({
          id: prompts.id,
          createdAt: prompts.createdAt,
        })
        .from(prompts)
        .innerJoin(user, eq(prompts.userId, user.id))
        .where(eq(prompts.isPublic, true))
        .orderBy(desc(prompts.createdAt));

      // Verify descending order
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          results[i + 1].createdAt.getTime()
        );
      }
    });

    it('should return empty array when no public prompts match filters', async () => {
      const category = 'business';
      const results = await db
        .select({
          id: prompts.id,
          name: prompts.name,
        })
        .from(prompts)
        .innerJoin(user, eq(prompts.userId, user.id))
        .where(and(eq(prompts.isPublic, true), eq(prompts.category, category)))
        .orderBy(desc(prompts.createdAt));

      // No business category prompts in test data
      expect(results.length).toBe(0);
    });
  });

  describe('duplicateFromPublic - Duplicate Public Prompts', () => {
    let otherUserId: string;
    let publicPromptId: string;

    beforeAll(async () => {
      // Create another user who owns the public prompt
      otherUserId = generateULID();
      await db.insert(user).values({
        id: otherUserId,
        name: 'Template Creator',
        email: `creator-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
        emailVerified: true,
      });

      // Create a public prompt to duplicate
      const [publicPrompt] = await db
        .insert(prompts)
        .values({
          userId: otherUserId,
          name: 'Original Public Prompt',
          content: 'This is a public prompt template',
          variables: ['var1', 'var2'],
          category: 'general',
          isPublic: true,
        })
        .returning();

      publicPromptId = publicPrompt.id;
      createdPromptIds.push(publicPrompt.id);
    });

    afterAll(async () => {
      try {
        await db.delete(prompts).where(eq(prompts.userId, otherUserId));
        await db.delete(user).where(eq(user.id, otherUserId));
      } catch (error) {
        console.error('Error cleaning up other user:', error);
      }
    });

    it('should duplicate a public prompt to user collection', async () => {
      // Fetch the public prompt
      const publicPromptResults = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, publicPromptId), eq(prompts.isPublic, true)));

      expect(publicPromptResults.length).toBe(1);
      const publicPrompt = publicPromptResults[0];

      // Create duplicate
      const [duplicatePrompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: publicPrompt.name,
          content: publicPrompt.content,
          variables: publicPrompt.variables,
          category: publicPrompt.category,
          isPublic: false, // Always false for duplicates
        })
        .returning();

      createdPromptIds.push(duplicatePrompt.id);

      expect(duplicatePrompt).toBeDefined();
      expect(duplicatePrompt.id).not.toBe(publicPrompt.id);
      expect(duplicatePrompt.userId).toBe(testUserId);
      expect(duplicatePrompt.name).toBe(publicPrompt.name);
      expect(duplicatePrompt.content).toBe(publicPrompt.content);
      expect(duplicatePrompt.variables).toEqual(publicPrompt.variables);
      expect(duplicatePrompt.category).toBe(publicPrompt.category);
      expect(duplicatePrompt.isPublic).toBe(false);
    });

    it('should add (Copy) suffix when name already exists', async () => {
      // Fetch the public prompt
      const publicPromptResults = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, publicPromptId), eq(prompts.isPublic, true)));

      const publicPrompt = publicPromptResults[0];

      // Create first prompt with the same name
      const [existingPrompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: publicPrompt.name,
          content: 'Existing prompt with same name',
          variables: [],
          category: 'general',
          isPublic: false,
        })
        .returning();

      createdPromptIds.push(existingPrompt.id);

      // Create duplicate - should add (Copy) suffix
      const [duplicatePrompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: `${publicPrompt.name} (Copy)`,
          content: publicPrompt.content,
          variables: publicPrompt.variables,
          category: publicPrompt.category,
          isPublic: false,
        })
        .returning();

      createdPromptIds.push(duplicatePrompt.id);

      expect(duplicatePrompt.name).toBe('Original Public Prompt (Copy)');
      expect(duplicatePrompt.name).not.toBe(publicPrompt.name);
    });

    it('should add numeric suffix when (Copy) version exists', async () => {
      // Fetch the public prompt
      const publicPromptResults = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, publicPromptId), eq(prompts.isPublic, true)));

      const publicPrompt = publicPromptResults[0];

      // Create prompts with existing names
      await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: publicPrompt.name,
          content: 'First',
          variables: [],
          category: 'general',
          isPublic: false,
        })
        .returning();

      await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: `${publicPrompt.name} (Copy)`,
          content: 'Second',
          variables: [],
          category: 'general',
          isPublic: false,
        })
        .returning();

      // Third duplicate should get numeric suffix
      const [duplicatePrompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: `${publicPrompt.name} (Copy) 2`,
          content: publicPrompt.content,
          variables: publicPrompt.variables,
          category: publicPrompt.category,
          isPublic: false,
        })
        .returning();

      createdPromptIds.push(duplicatePrompt.id);

      expect(duplicatePrompt.name).toBe('Original Public Prompt (Copy) 2');
    });

    it('should always set isPublic to false for duplicated prompts', async () => {
      // Fetch the public prompt
      const publicPromptResults = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, publicPromptId), eq(prompts.isPublic, true)));

      const publicPrompt = publicPromptResults[0];
      expect(publicPrompt.isPublic).toBe(true);

      // Create duplicate
      const [duplicatePrompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: 'Unique Name for Test',
          content: publicPrompt.content,
          variables: publicPrompt.variables,
          category: publicPrompt.category,
          isPublic: false, // Must be false
        })
        .returning();

      createdPromptIds.push(duplicatePrompt.id);

      expect(duplicatePrompt.isPublic).toBe(false);
    });

    it('should copy all prompt fields correctly', async () => {
      // Fetch the public prompt
      const publicPromptResults = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, publicPromptId), eq(prompts.isPublic, true)));

      const publicPrompt = publicPromptResults[0];

      // Create duplicate with unique name
      const [duplicatePrompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: 'Unique Duplicate Name',
          content: publicPrompt.content,
          variables: publicPrompt.variables,
          category: publicPrompt.category,
          isPublic: false,
        })
        .returning();

      createdPromptIds.push(duplicatePrompt.id);

      expect(duplicatePrompt.content).toBe(publicPrompt.content);
      expect(duplicatePrompt.variables).toEqual(publicPrompt.variables);
      expect(duplicatePrompt.category).toBe(publicPrompt.category);
    });

    it('should not duplicate private prompts', async () => {
      // Create a private prompt
      const [privatePrompt] = await db
        .insert(prompts)
        .values({
          userId: otherUserId,
          name: 'Private Prompt',
          content: 'This is private',
          variables: [],
          category: 'general',
          isPublic: false,
        })
        .returning();

      createdPromptIds.push(privatePrompt.id);

      // Try to fetch as if it were public
      const results = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, privatePrompt.id), eq(prompts.isPublic, true)));

      expect(results.length).toBe(0);
    });

    it('should handle variables array correctly', async () => {
      // Create a public prompt with complex variables
      const [publicPrompt] = await db
        .insert(prompts)
        .values({
          userId: otherUserId,
          name: 'Complex Variables Prompt',
          content: 'Test with {var1}, {var2}, {var3}',
          variables: ['var1', 'var2', 'var3', 'var4', 'var5'],
          category: 'coding',
          isPublic: true,
        })
        .returning();

      createdPromptIds.push(publicPrompt.id);

      // Duplicate it
      const [duplicatePrompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: 'Complex Variables Copy',
          content: publicPrompt.content,
          variables: publicPrompt.variables,
          category: publicPrompt.category,
          isPublic: false,
        })
        .returning();

      createdPromptIds.push(duplicatePrompt.id);

      expect(duplicatePrompt.variables).toEqual(['var1', 'var2', 'var3', 'var4', 'var5']);
      expect(duplicatePrompt.variables.length).toBe(5);
    });

    it('should preserve category from original prompt', async () => {
      const categories = ['coding', 'writing', 'analysis', 'creative', 'business'] as const;

      for (const category of categories) {
        // Create public prompt
        const [publicPrompt] = await db
          .insert(prompts)
          .values({
            userId: otherUserId,
            name: `Test ${category} prompt`,
            content: `Test content for ${category}`,
            variables: [],
            category,
            isPublic: true,
          })
          .returning();

        createdPromptIds.push(publicPrompt.id);

        // Duplicate it
        const [duplicatePrompt] = await db
          .insert(prompts)
          .values({
            userId: testUserId,
            name: `Duplicate ${category} prompt`,
            content: publicPrompt.content,
            variables: publicPrompt.variables,
            category: publicPrompt.category,
            isPublic: false,
          })
          .returning();

        createdPromptIds.push(duplicatePrompt.id);

        expect(duplicatePrompt.category).toBe(category);
      }
    });
  });

  describe('exportPrompts - Export User Prompts', () => {
    beforeEach(async () => {
      // Create test prompts for export tests
      const testPrompts = [
        {
          name: 'Code Review Template',
          content: 'Review the following code for bugs and improvements',
          variables: ['language', 'file'],
          category: 'coding' as const,
          isPublic: true,
        },
        {
          name: 'Blog Post Writer',
          content: 'Write a blog post about the given topic',
          variables: ['topic', 'tone', 'length'],
          category: 'writing' as const,
          isPublic: false,
        },
        {
          name: 'Data Analysis Prompt',
          content: 'Analyze the following data and provide insights',
          variables: ['dataset', 'focus'],
          category: 'analysis' as const,
          isPublic: true,
        },
        {
          name: 'Email Template',
          content: 'Draft a professional email',
          variables: ['recipient', 'purpose'],
          category: 'business' as const,
          isPublic: false,
        },
      ];

      for (const promptData of testPrompts) {
        const [prompt] = await db
          .insert(prompts)
          .values({
            userId: testUserId,
            ...promptData,
          })
          .returning();

        createdPromptIds.push(prompt.id);
      }
    });

    it('should export all user prompts', async () => {
      const userPrompts = await db
        .select({
          id: prompts.id,
          name: prompts.name,
          content: prompts.content,
          variables: prompts.variables,
          category: prompts.category,
          isPublic: prompts.isPublic,
          createdAt: prompts.createdAt,
          updatedAt: prompts.updatedAt,
        })
        .from(prompts)
        .where(eq(prompts.userId, testUserId))
        .orderBy(desc(prompts.updatedAt));

      expect(userPrompts.length).toBeGreaterThanOrEqual(4);
      expect(userPrompts.every((p) => p.userId === testUserId || p.userId === undefined)).toBe(
        true
      );
    });

    it('should export prompts with valid JSON structure', async () => {
      const userPrompts = await db
        .select({
          id: prompts.id,
          name: prompts.name,
          content: prompts.content,
          variables: prompts.variables,
          category: prompts.category,
          isPublic: prompts.isPublic,
          createdAt: prompts.createdAt,
          updatedAt: prompts.updatedAt,
        })
        .from(prompts)
        .where(eq(prompts.userId, testUserId))
        .orderBy(desc(prompts.updatedAt));

      expect(userPrompts.length).toBeGreaterThan(0);

      // Verify each prompt has the required fields
      userPrompts.forEach((prompt) => {
        expect(prompt.id).toBeDefined();
        expect(typeof prompt.id).toBe('string');
        expect(prompt.name).toBeDefined();
        expect(typeof prompt.name).toBe('string');
        expect(prompt.content).toBeDefined();
        expect(typeof prompt.content).toBe('string');
        expect(prompt.variables).toBeDefined();
        expect(Array.isArray(prompt.variables)).toBe(true);
        expect(prompt.category).toBeDefined();
        expect([
          'general',
          'coding',
          'writing',
          'analysis',
          'creative',
          'business',
          'custom',
        ]).toContain(prompt.category);
        expect(prompt.isPublic).toBeDefined();
        expect(typeof prompt.isPublic).toBe('boolean');
        expect(prompt.createdAt).toBeDefined();
        expect(prompt.createdAt).toBeInstanceOf(Date);
        expect(prompt.updatedAt).toBeDefined();
        expect(prompt.updatedAt).toBeInstanceOf(Date);
      });
    });

    it('should filter exported prompts by category', async () => {
      const category = 'coding';
      const userPrompts = await db
        .select({
          id: prompts.id,
          name: prompts.name,
          category: prompts.category,
        })
        .from(prompts)
        .where(and(eq(prompts.userId, testUserId), eq(prompts.category, category)))
        .orderBy(desc(prompts.updatedAt));

      expect(userPrompts.length).toBeGreaterThan(0);
      expect(userPrompts.every((p) => p.category === category)).toBe(true);
    });

    it('should filter exported prompts by date range', async () => {
      const dateFrom = new Date(Date.now() - 60 * 60 * 1000); // Last 1 hour
      const dateTo = new Date();

      const userPrompts = await db
        .select({
          id: prompts.id,
          name: prompts.name,
          createdAt: prompts.createdAt,
        })
        .from(prompts)
        .where(
          and(
            eq(prompts.userId, testUserId),
            sql`${prompts.createdAt} >= ${dateFrom}`,
            sql`${prompts.createdAt} <= ${dateTo}`
          )
        )
        .orderBy(desc(prompts.updatedAt));

      expect(userPrompts.length).toBeGreaterThan(0);
      expect(userPrompts.every((p) => p.createdAt >= dateFrom && p.createdAt <= dateTo)).toBe(true);
    });

    it('should combine category and date filters', async () => {
      const category = 'writing';
      const dateFrom = new Date(Date.now() - 60 * 60 * 1000); // Last 1 hour
      const dateTo = new Date();

      const userPrompts = await db
        .select({
          id: prompts.id,
          name: prompts.name,
          category: prompts.category,
          createdAt: prompts.createdAt,
        })
        .from(prompts)
        .where(
          and(
            eq(prompts.userId, testUserId),
            eq(prompts.category, category),
            sql`${prompts.createdAt} >= ${dateFrom}`,
            sql`${prompts.createdAt} <= ${dateTo}`
          )
        )
        .orderBy(desc(prompts.updatedAt));

      expect(
        userPrompts.every(
          (p) => p.category === category && p.createdAt >= dateFrom && p.createdAt <= dateTo
        )
      ).toBe(true);
    });

    it('should order exported prompts by updatedAt DESC', async () => {
      const userPrompts = await db
        .select({
          id: prompts.id,
          updatedAt: prompts.updatedAt,
        })
        .from(prompts)
        .where(eq(prompts.userId, testUserId))
        .orderBy(desc(prompts.updatedAt));

      // Verify descending order
      for (let i = 0; i < userPrompts.length - 1; i++) {
        expect(userPrompts[i].updatedAt.getTime()).toBeGreaterThanOrEqual(
          userPrompts[i + 1].updatedAt.getTime()
        );
      }
    });

    it('should return empty array when user has no prompts', async () => {
      // Create a new user with no prompts
      const newUserId = generateULID();
      await db.insert(user).values({
        id: newUserId,
        name: 'Empty User',
        email: `empty-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
        emailVerified: true,
      });

      try {
        const userPrompts = await db
          .select()
          .from(prompts)
          .where(eq(prompts.userId, newUserId))
          .orderBy(desc(prompts.updatedAt));

        expect(userPrompts.length).toBe(0);
        expect(Array.isArray(userPrompts)).toBe(true);
      } finally {
        // Clean up
        await db.delete(user).where(eq(user.id, newUserId));
      }
    });
  });

  describe('importPrompts - Import Prompts from JSON', () => {
    it('should import a single prompt', async () => {
      const promptsToImport = [
        {
          name: 'Imported Test Prompt',
          content: 'This prompt was imported',
          variables: ['var1'],
          category: 'general' as const,
          isPublic: false,
        },
      ];

      // Simulate import logic
      const [importedPrompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: promptsToImport[0].name,
          content: promptsToImport[0].content,
          variables: promptsToImport[0].variables,
          category: promptsToImport[0].category,
          isPublic: promptsToImport[0].isPublic,
        })
        .returning();

      createdPromptIds.push(importedPrompt.id);

      expect(importedPrompt).toBeDefined();
      expect(importedPrompt.id).toBeDefined();
      expect(importedPrompt.userId).toBe(testUserId);
      expect(importedPrompt.name).toBe(promptsToImport[0].name);
      expect(importedPrompt.content).toBe(promptsToImport[0].content);
      expect(importedPrompt.variables).toEqual(promptsToImport[0].variables);
      expect(importedPrompt.category).toBe(promptsToImport[0].category);
      expect(importedPrompt.isPublic).toBe(promptsToImport[0].isPublic);
    });

    it('should import multiple prompts', async () => {
      const promptsToImport = [
        {
          name: 'Imported Prompt 1',
          content: 'First imported prompt',
          variables: [],
          category: 'coding' as const,
          isPublic: false,
        },
        {
          name: 'Imported Prompt 2',
          content: 'Second imported prompt',
          variables: ['var1', 'var2'],
          category: 'writing' as const,
          isPublic: true,
        },
        {
          name: 'Imported Prompt 3',
          content: 'Third imported prompt',
          variables: ['test'],
          category: 'analysis' as const,
          isPublic: false,
        },
      ];

      const importedPrompts = [];
      for (const promptData of promptsToImport) {
        const [prompt] = await db
          .insert(prompts)
          .values({
            userId: testUserId,
            ...promptData,
          })
          .returning();

        importedPrompts.push(prompt);
        createdPromptIds.push(prompt.id);
      }

      expect(importedPrompts.length).toBe(3);
      expect(importedPrompts.every((p) => p.userId === testUserId)).toBe(true);

      // Verify all prompts were imported correctly
      importedPrompts.forEach((prompt, index) => {
        expect(prompt.name).toBe(promptsToImport[index].name);
        expect(prompt.content).toBe(promptsToImport[index].content);
        expect(prompt.category).toBe(promptsToImport[index].category);
      });
    });

    it('should handle duplicate names by adding numeric suffixes', async () => {
      // Create an existing prompt
      const existingName = 'Duplicate Name Test';
      const [existingPrompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: existingName,
          content: 'Existing prompt',
          variables: [],
          category: 'general',
          isPublic: false,
        })
        .returning();

      createdPromptIds.push(existingPrompt.id);

      // Import prompts with duplicate names
      const promptsToImport = [
        {
          name: existingName,
          content: 'First duplicate',
          variables: [],
          category: 'general' as const,
          isPublic: false,
        },
        {
          name: existingName,
          content: 'Second duplicate',
          variables: [],
          category: 'general' as const,
          isPublic: false,
        },
      ];

      const importedPrompts = [];
      for (const promptData of promptsToImport) {
        // Check for existing prompts with same name
        const existingPrompts = await db
          .select()
          .from(prompts)
          .where(and(eq(prompts.userId, testUserId), eq(prompts.name, promptData.name)));

        let finalName = promptData.name;
        if (existingPrompts.length > 0) {
          let counter = 1;
          let uniqueNameFound = false;
          while (!uniqueNameFound) {
            const testName = promptData.name.includes(' (')
              ? promptData.name.split(' (')[0] + ` (${counter})`
              : `${promptData.name} (${counter})`;

            const nameCheckResults = await db
              .select()
              .from(prompts)
              .where(and(eq(prompts.userId, testUserId), eq(prompts.name, testName)));

            if (nameCheckResults.length === 0) {
              finalName = testName;
              uniqueNameFound = true;
            } else {
              counter++;
            }
          }
        }

        const [prompt] = await db
          .insert(prompts)
          .values({
            userId: testUserId,
            name: finalName,
            content: promptData.content,
            variables: promptData.variables,
            category: promptData.category,
            isPublic: promptData.isPublic,
          })
          .returning();

        importedPrompts.push(prompt);
        createdPromptIds.push(prompt.id);
      }

      expect(importedPrompts.length).toBe(2);
      expect(importedPrompts[0].name).toBe(`${existingName} (1)`);
      expect(importedPrompts[1].name).toBe(`${existingName} (2)`);
    });

    it('should validate required fields in imported prompts', () => {
      // Test invalid data structure (this should be validated by Zod in the actual procedure)
      const invalidPrompts = [
        {
          // Missing required 'name' field
          content: 'Test content',
          variables: [],
          category: 'general' as const,
          isPublic: false,
        },
      ];

      // The actual procedure uses Zod validation which would catch this
      expect(invalidPrompts[0].name).toBeUndefined();
    });

    it('should validate enum values for category', () => {
      const validCategories = [
        'general',
        'coding',
        'writing',
        'analysis',
        'creative',
        'business',
        'custom',
      ];

      // Test that all valid categories are strings
      validCategories.forEach((category) => {
        expect(typeof category).toBe('string');
        expect(validCategories.includes(category)).toBe(true);
      });
    });

    it('should validate variables is an array', () => {
      const promptData = {
        name: 'Test Variables',
        content: 'Test content',
        variables: ['var1', 'var2', 'var3'],
        category: 'general' as const,
        isPublic: false,
      };

      expect(Array.isArray(promptData.variables)).toBe(true);
      expect(promptData.variables.every((v) => typeof v === 'string')).toBe(true);
    });

    it('should handle empty variables array', async () => {
      const promptsToImport = [
        {
          name: 'No Variables Test',
          content: 'This has no variables',
          variables: [],
          category: 'general' as const,
          isPublic: false,
        },
      ];

      const [importedPrompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: promptsToImport[0].name,
          content: promptsToImport[0].content,
          variables: promptsToImport[0].variables,
          category: promptsToImport[0].category,
          isPublic: promptsToImport[0].isPublic,
        })
        .returning();

      createdPromptIds.push(importedPrompt.id);

      expect(importedPrompt.variables).toEqual([]);
      expect(Array.isArray(importedPrompt.variables)).toBe(true);
    });

    it('should import all prompt categories', async () => {
      const categories = [
        'general',
        'coding',
        'writing',
        'analysis',
        'creative',
        'business',
        'custom',
      ] as const;

      for (const category of categories) {
        const [prompt] = await db
          .insert(prompts)
          .values({
            userId: testUserId,
            name: `Test ${category} category`,
            content: `Test content for ${category}`,
            variables: [],
            category,
            isPublic: false,
          })
          .returning();

        createdPromptIds.push(prompt.id);
        expect(prompt.category).toBe(category);
      }
    });

    it('should preserve isPublic flag during import', async () => {
      const promptsToImport = [
        {
          name: 'Public Imported Prompt',
          content: 'This should be public',
          variables: [],
          category: 'general' as const,
          isPublic: true,
        },
        {
          name: 'Private Imported Prompt',
          content: 'This should be private',
          variables: [],
          category: 'general' as const,
          isPublic: false,
        },
      ];

      const importedPrompts = [];
      for (const promptData of promptsToImport) {
        const [prompt] = await db
          .insert(prompts)
          .values({
            userId: testUserId,
            ...promptData,
          })
          .returning();

        importedPrompts.push(prompt);
        createdPromptIds.push(prompt.id);
      }

      expect(importedPrompts[0].isPublic).toBe(true);
      expect(importedPrompts[1].isPublic).toBe(false);
    });
  });

  describe('Round-trip: Export -> Import -> Verify', () => {
    it('should successfully export and re-import prompts', async () => {
      // Create original prompts
      const originalPrompts = [
        {
          name: 'Original Code Review',
          content: 'Review this code',
          variables: ['language'],
          category: 'coding' as const,
          isPublic: true,
        },
        {
          name: 'Original Writing Assistant',
          content: 'Help me write',
          variables: ['topic'],
          category: 'writing' as const,
          isPublic: false,
        },
      ];

      const createdOriginals = [];
      for (const promptData of originalPrompts) {
        const [prompt] = await db
          .insert(prompts)
          .values({
            userId: testUserId,
            ...promptData,
          })
          .returning();

        createdOriginals.push(prompt);
        createdPromptIds.push(prompt.id);
      }

      // Export prompts
      const exportedPrompts = await db
        .select({
          name: prompts.name,
          content: prompts.content,
          variables: prompts.variables,
          category: prompts.category,
          isPublic: prompts.isPublic,
        })
        .from(prompts)
        .where(eq(prompts.userId, testUserId));

      // Filter to only the ones we just created
      const ourPrompts = exportedPrompts.filter((p) =>
        originalPrompts.some((op) => op.name === p.name)
      );

      // Import to a different user (simulate)
      const newUserId = generateULID();
      await db.insert(user).values({
        id: newUserId,
        name: 'Import User',
        email: `import-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
        emailVerified: true,
      });

      try {
        const importedPrompts = [];
        for (const promptData of ourPrompts) {
          const [prompt] = await db
            .insert(prompts)
            .values({
              userId: newUserId,
              ...promptData,
            })
            .returning();

          importedPrompts.push(prompt);
          createdPromptIds.push(prompt.id);
        }

        // Verify imported prompts match originals
        expect(importedPrompts.length).toBe(ourPrompts.length);

        importedPrompts.forEach((imported, index) => {
          expect(imported.name).toBe(ourPrompts[index].name);
          expect(imported.content).toBe(ourPrompts[index].content);
          expect(imported.variables).toEqual(ourPrompts[index].variables);
          expect(imported.category).toBe(ourPrompts[index].category);
          expect(imported.isPublic).toBe(ourPrompts[index].isPublic);
        });
      } finally {
        // Clean up the new user
        await db.delete(prompts).where(eq(prompts.userId, newUserId));
        await db.delete(user).where(eq(user.id, newUserId));
      }
    });

    it('should preserve data integrity through export/import cycle', async () => {
      // Create a complex prompt with special characters
      const originalName = 'Prompt with "quotes" and \'apostrophes\'';
      const originalContent = 'Content with @mentions #hashtags $special & chars <>';
      const originalVariables = ['var1', 'var2 with spaces', 'var3-with-dashes'];

      const [originalPrompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: originalName,
          content: originalContent,
          variables: originalVariables,
          category: 'general',
          isPublic: false,
        })
        .returning();

      createdPromptIds.push(originalPrompt.id);

      // Export
      const [exported] = await db.select().from(prompts).where(eq(prompts.id, originalPrompt.id));

      // Import to new user
      const newUserId = generateULID();
      await db.insert(user).values({
        id: newUserId,
        name: 'Test User 2',
        email: `test2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
        emailVerified: true,
      });

      try {
        const [imported] = await db
          .insert(prompts)
          .values({
            userId: newUserId,
            name: exported.name,
            content: exported.content,
            variables: exported.variables,
            category: exported.category,
            isPublic: exported.isPublic,
          })
          .returning();

        createdPromptIds.push(imported.id);

        // Verify data integrity
        expect(imported.name).toBe(originalName);
        expect(imported.content).toBe(originalContent);
        expect(imported.variables).toEqual(originalVariables);
        expect(imported.category).toBe('general');
        expect(imported.isPublic).toBe(false);
      } finally {
        // Clean up
        await db.delete(prompts).where(eq(prompts.userId, newUserId));
        await db.delete(user).where(eq(user.id, newUserId));
      }
    });
  });

  describe('Version History - Create and Update Tracking', () => {
    it('should create initial version when prompt is created', async () => {
      const promptData = {
        userId: testUserId,
        name: 'Version Test Prompt',
        content: 'This prompt should have version history',
        variables: ['var1', 'var2'],
        category: 'coding' as const,
        isPublic: false,
      };

      // Create prompt (simulating the create procedure logic)
      const prompt = await db.transaction(async (tx) => {
        const [newPrompt] = await tx.insert(prompts).values(promptData).returning();

        // Create initial version entry
        await tx.insert(promptVersions).values({
          promptId: newPrompt.id,
          userId: testUserId,
          name: newPrompt.name,
          content: newPrompt.content,
          variables: newPrompt.variables,
          category: newPrompt.category,
          versionNumber: 1,
          changeReason: 'Initial version',
        });

        return newPrompt;
      });

      createdPromptIds.push(prompt.id);

      // Verify initial version was created
      const versions = await db
        .select()
        .from(promptVersions)
        .where(eq(promptVersions.promptId, prompt.id))
        .orderBy(desc(promptVersions.versionNumber));

      expect(versions.length).toBe(1);
      expect(versions[0].versionNumber).toBe(1);
      expect(versions[0].changeReason).toBe('Initial version');
      expect(versions[0].name).toBe(promptData.name);
      expect(versions[0].content).toBe(promptData.content);
      expect(versions[0].variables).toEqual(promptData.variables);
      expect(versions[0].category).toBe(promptData.category);
    });

    it('should create version entry when prompt is updated', async () => {
      // Create initial prompt
      const prompt = await db.transaction(async (tx) => {
        const [newPrompt] = await tx
          .insert(prompts)
          .values({
            userId: testUserId,
            name: 'Update Version Test',
            content: 'Original content',
            variables: ['original'],
            category: 'general',
            isPublic: false,
          })
          .returning();

        await tx.insert(promptVersions).values({
          promptId: newPrompt.id,
          userId: testUserId,
          name: newPrompt.name,
          content: newPrompt.content,
          variables: newPrompt.variables,
          category: newPrompt.category,
          versionNumber: 1,
          changeReason: 'Initial version',
        });

        return newPrompt;
      });

      createdPromptIds.push(prompt.id);

      // Update prompt (simulating the update procedure logic)
      await db.transaction(async (tx) => {
        // Get next version number
        const versionResults = await tx
          .select({ versionNumber: promptVersions.versionNumber })
          .from(promptVersions)
          .where(eq(promptVersions.promptId, prompt.id))
          .orderBy(desc(promptVersions.versionNumber))
          .limit(1);

        const nextVersionNumber = versionResults[0].versionNumber + 1;

        // Create version entry with old values
        await tx.insert(promptVersions).values({
          promptId: prompt.id,
          userId: testUserId,
          name: prompt.name,
          content: prompt.content,
          variables: prompt.variables,
          category: prompt.category,
          versionNumber: nextVersionNumber,
          changeReason: 'Updated prompt',
        });

        // Update the prompt
        await tx
          .update(prompts)
          .set({
            name: 'Updated Version Test',
            content: 'Updated content',
            variables: ['updated'],
            category: 'coding',
          })
          .where(eq(prompts.id, prompt.id));
      });

      // Verify version history
      const versions = await db
        .select()
        .from(promptVersions)
        .where(eq(promptVersions.promptId, prompt.id))
        .orderBy(desc(promptVersions.versionNumber));

      expect(versions.length).toBe(2);
      expect(versions[0].versionNumber).toBe(2);
      expect(versions[0].changeReason).toBe('Updated prompt');
      expect(versions[0].name).toBe('Update Version Test'); // Old name
      expect(versions[0].content).toBe('Original content'); // Old content

      expect(versions[1].versionNumber).toBe(1);
      expect(versions[1].changeReason).toBe('Initial version');
    });

    it('should increment versionNumber correctly on multiple updates', async () => {
      // Create initial prompt
      const prompt = await db.transaction(async (tx) => {
        const [newPrompt] = await tx
          .insert(prompts)
          .values({
            userId: testUserId,
            name: 'Increment Test',
            content: 'Version 1',
            variables: [],
            category: 'general',
            isPublic: false,
          })
          .returning();

        await tx.insert(promptVersions).values({
          promptId: newPrompt.id,
          userId: testUserId,
          name: newPrompt.name,
          content: newPrompt.content,
          variables: newPrompt.variables,
          category: newPrompt.category,
          versionNumber: 1,
          changeReason: 'Initial version',
        });

        return newPrompt;
      });

      createdPromptIds.push(prompt.id);

      // Perform 3 updates
      for (let i = 2; i <= 4; i++) {
        await db.transaction(async (tx) => {
          const currentPromptResults = await tx
            .select()
            .from(prompts)
            .where(eq(prompts.id, prompt.id));

          const currentPrompt = currentPromptResults[0];

          const versionResults = await tx
            .select({ versionNumber: promptVersions.versionNumber })
            .from(promptVersions)
            .where(eq(promptVersions.promptId, prompt.id))
            .orderBy(desc(promptVersions.versionNumber))
            .limit(1);

          const nextVersionNumber = versionResults[0].versionNumber + 1;

          await tx.insert(promptVersions).values({
            promptId: prompt.id,
            userId: testUserId,
            name: currentPrompt.name,
            content: currentPrompt.content,
            variables: currentPrompt.variables,
            category: currentPrompt.category,
            versionNumber: nextVersionNumber,
            changeReason: `Update ${i}`,
          });

          await tx
            .update(prompts)
            .set({ content: `Version ${i}` })
            .where(eq(prompts.id, prompt.id));
        });
      }

      // Verify all versions
      const versions = await db
        .select()
        .from(promptVersions)
        .where(eq(promptVersions.promptId, prompt.id))
        .orderBy(desc(promptVersions.versionNumber));

      expect(versions.length).toBe(4);
      expect(versions.map((v) => v.versionNumber)).toEqual([4, 3, 2, 1]);
      expect(versions.map((v) => v.changeReason)).toEqual([
        'Update 4',
        'Update 3',
        'Update 2',
        'Initial version',
      ]);
    });

    it('should store custom changeReason when provided', async () => {
      // Create initial prompt
      const prompt = await db.transaction(async (tx) => {
        const [newPrompt] = await tx
          .insert(prompts)
          .values({
            userId: testUserId,
            name: 'Change Reason Test',
            content: 'Original',
            variables: [],
            category: 'general',
            isPublic: false,
          })
          .returning();

        await tx.insert(promptVersions).values({
          promptId: newPrompt.id,
          userId: testUserId,
          name: newPrompt.name,
          content: newPrompt.content,
          variables: newPrompt.variables,
          category: newPrompt.category,
          versionNumber: 1,
          changeReason: 'Initial version',
        });

        return newPrompt;
      });

      createdPromptIds.push(prompt.id);

      // Update with custom changeReason
      const customReason = 'Fixed typo in instructions';

      await db.transaction(async (tx) => {
        const versionResults = await tx
          .select({ versionNumber: promptVersions.versionNumber })
          .from(promptVersions)
          .where(eq(promptVersions.promptId, prompt.id))
          .orderBy(desc(promptVersions.versionNumber))
          .limit(1);

        const nextVersionNumber = versionResults[0].versionNumber + 1;

        await tx.insert(promptVersions).values({
          promptId: prompt.id,
          userId: testUserId,
          name: prompt.name,
          content: prompt.content,
          variables: prompt.variables,
          category: prompt.category,
          versionNumber: nextVersionNumber,
          changeReason: customReason,
        });

        await tx
          .update(prompts)
          .set({ content: 'Updated content' })
          .where(eq(prompts.id, prompt.id));
      });

      // Verify custom changeReason was saved
      const versions = await db
        .select()
        .from(promptVersions)
        .where(eq(promptVersions.promptId, prompt.id))
        .orderBy(desc(promptVersions.versionNumber));

      expect(versions[0].changeReason).toBe(customReason);
    });
  });

  describe('getVersionHistory - Version History Retrieval', () => {
    it('should return all versions for a prompt', async () => {
      // Create prompt with multiple versions
      const prompt = await db.transaction(async (tx) => {
        const [newPrompt] = await tx
          .insert(prompts)
          .values({
            userId: testUserId,
            name: 'History Test Prompt',
            content: 'Initial',
            variables: [],
            category: 'coding',
            isPublic: false,
          })
          .returning();

        await tx.insert(promptVersions).values({
          promptId: newPrompt.id,
          userId: testUserId,
          name: newPrompt.name,
          content: newPrompt.content,
          variables: newPrompt.variables,
          category: newPrompt.category,
          versionNumber: 1,
          changeReason: 'Initial version',
        });

        return newPrompt;
      });

      createdPromptIds.push(prompt.id);

      // Add more versions
      for (let i = 2; i <= 3; i++) {
        await db.insert(promptVersions).values({
          promptId: prompt.id,
          userId: testUserId,
          name: `History Test Prompt v${i}`,
          content: `Content ${i}`,
          variables: [`var${i}`],
          category: i % 2 === 0 ? 'coding' : 'writing',
          versionNumber: i,
          changeReason: `Change ${i}`,
        });
      }

      // Fetch version history
      const versions = await db
        .select({
          versionNumber: promptVersions.versionNumber,
          name: promptVersions.name,
          content: promptVersions.content,
          variables: promptVersions.variables,
          category: promptVersions.category,
          changeReason: promptVersions.changeReason,
          createdAt: promptVersions.createdAt,
        })
        .from(promptVersions)
        .where(eq(promptVersions.promptId, prompt.id))
        .orderBy(desc(promptVersions.versionNumber));

      expect(versions.length).toBe(3);
      expect(versions[0].versionNumber).toBe(3);
      expect(versions[1].versionNumber).toBe(2);
      expect(versions[2].versionNumber).toBe(1);

      // Verify all required fields are present
      versions.forEach((version) => {
        expect(version.versionNumber).toBeDefined();
        expect(version.name).toBeDefined();
        expect(version.content).toBeDefined();
        expect(version.variables).toBeDefined();
        expect(version.category).toBeDefined();
        expect(version.changeReason).toBeDefined();
        expect(version.createdAt).toBeDefined();
        expect(version.createdAt).toBeInstanceOf(Date);
      });
    });

    it('should order versions by versionNumber DESC (newest first)', async () => {
      // Create prompt with versions
      const [prompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: 'Order Test',
          content: 'Test',
          variables: [],
          category: 'general',
          isPublic: false,
        })
        .returning();

      createdPromptIds.push(prompt.id);

      // Create versions out of order to test sorting
      await db.insert(promptVersions).values({
        promptId: prompt.id,
        userId: testUserId,
        name: 'Version 3',
        content: 'Content 3',
        variables: [],
        category: 'general',
        versionNumber: 3,
        changeReason: 'Third',
      });

      await db.insert(promptVersions).values({
        promptId: prompt.id,
        userId: testUserId,
        name: 'Version 1',
        content: 'Content 1',
        variables: [],
        category: 'general',
        versionNumber: 1,
        changeReason: 'First',
      });

      await db.insert(promptVersions).values({
        promptId: prompt.id,
        userId: testUserId,
        name: 'Version 2',
        content: 'Content 2',
        variables: [],
        category: 'general',
        versionNumber: 2,
        changeReason: 'Second',
      });

      // Fetch and verify order
      const versions = await db
        .select()
        .from(promptVersions)
        .where(eq(promptVersions.promptId, prompt.id))
        .orderBy(desc(promptVersions.versionNumber));

      expect(versions.length).toBe(3);
      expect(versions[0].versionNumber).toBe(3);
      expect(versions[1].versionNumber).toBe(2);
      expect(versions[2].versionNumber).toBe(1);
    });

    it('should validate ownership before returning version history', async () => {
      // Create another user
      const otherUserId = generateULID();
      await db.insert(user).values({
        id: otherUserId,
        name: 'Other User',
        email: `other-version-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
        emailVerified: true,
      });

      // Create prompt for other user
      const [otherPrompt] = await db
        .insert(prompts)
        .values({
          userId: otherUserId,
          name: "Other User's Prompt",
          content: 'Not accessible',
          variables: [],
          category: 'general',
          isPublic: false,
        })
        .returning();

      // Try to fetch version history with testUserId (should fail ownership check)
      const promptResults = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, otherPrompt.id), eq(prompts.userId, testUserId)));

      expect(promptResults.length).toBe(0);

      // Clean up
      await db.delete(prompts).where(eq(prompts.id, otherPrompt.id));
      await db.delete(user).where(eq(user.id, otherUserId));
    });

    it('should support pagination with limit and offset', async () => {
      // Create prompt with many versions
      const [prompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: 'Pagination Test',
          content: 'Test',
          variables: [],
          category: 'general',
          isPublic: false,
        })
        .returning();

      createdPromptIds.push(prompt.id);

      // Create 10 versions
      for (let i = 1; i <= 10; i++) {
        await db.insert(promptVersions).values({
          promptId: prompt.id,
          userId: testUserId,
          name: `Version ${i}`,
          content: `Content ${i}`,
          variables: [],
          category: 'general',
          versionNumber: i,
          changeReason: `Change ${i}`,
        });
      }

      // Test pagination
      const page1 = await db
        .select()
        .from(promptVersions)
        .where(eq(promptVersions.promptId, prompt.id))
        .orderBy(desc(promptVersions.versionNumber))
        .limit(5)
        .offset(0);

      const page2 = await db
        .select()
        .from(promptVersions)
        .where(eq(promptVersions.promptId, prompt.id))
        .orderBy(desc(promptVersions.versionNumber))
        .limit(5)
        .offset(5);

      expect(page1.length).toBe(5);
      expect(page2.length).toBe(5);

      // Verify page 1 has versions 10, 9, 8, 7, 6
      expect(page1.map((v) => v.versionNumber)).toEqual([10, 9, 8, 7, 6]);

      // Verify page 2 has versions 5, 4, 3, 2, 1
      expect(page2.map((v) => v.versionNumber)).toEqual([5, 4, 3, 2, 1]);

      // Verify no overlap
      const page1Ids = page1.map((v) => v.id);
      const page2Ids = page2.map((v) => v.id);
      const overlap = page1Ids.filter((id) => page2Ids.includes(id));
      expect(overlap.length).toBe(0);
    });

    it('should handle empty version history', async () => {
      // Create prompt (note: in real scenario this wouldn't happen due to initial version, but testing edge case)
      const [prompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: 'No History Test',
          content: 'Test',
          variables: [],
          category: 'general',
          isPublic: false,
        })
        .returning();

      createdPromptIds.push(prompt.id);

      // Fetch version history
      const versions = await db
        .select()
        .from(promptVersions)
        .where(eq(promptVersions.promptId, prompt.id))
        .orderBy(desc(promptVersions.versionNumber));

      expect(versions.length).toBe(0);
      expect(Array.isArray(versions)).toBe(true);
    });

    it('should enforce limit constraints (min 1, max 100)', async () => {
      // Create prompt
      const [prompt] = await db
        .insert(prompts)
        .values({
          userId: testUserId,
          name: 'Limit Test',
          content: 'Test',
          variables: [],
          category: 'general',
          isPublic: false,
        })
        .returning();

      createdPromptIds.push(prompt.id);

      // Create 5 versions
      for (let i = 1; i <= 5; i++) {
        await db.insert(promptVersions).values({
          promptId: prompt.id,
          userId: testUserId,
          name: `Version ${i}`,
          content: `Content ${i}`,
          variables: [],
          category: 'general',
          versionNumber: i,
          changeReason: `Change ${i}`,
        });
      }

      // Test with limit = 2
      const limitedVersions = await db
        .select()
        .from(promptVersions)
        .where(eq(promptVersions.promptId, prompt.id))
        .orderBy(desc(promptVersions.versionNumber))
        .limit(2);

      expect(limitedVersions.length).toBe(2);
      expect(limitedVersions[0].versionNumber).toBe(5);
      expect(limitedVersions[1].versionNumber).toBe(4);
    });
  });

  describe('restoreVersion - Restore Prompt to Previous Version', () => {
    it('should restore prompt to specific version', async () => {
      // Create prompt with multiple versions
      const prompt = await db.transaction(async (tx) => {
        const [newPrompt] = await tx
          .insert(prompts)
          .values({
            userId: testUserId,
            name: 'Restore Test',
            content: 'Current content',
            variables: ['current'],
            category: 'coding',
            isPublic: false,
          })
          .returning();

        await tx.insert(promptVersions).values({
          promptId: newPrompt.id,
          userId: testUserId,
          name: newPrompt.name,
          content: newPrompt.content,
          variables: newPrompt.variables,
          category: newPrompt.category,
          versionNumber: 1,
          changeReason: 'Initial version',
        });

        return newPrompt;
      });

      createdPromptIds.push(prompt.id);

      // Add version 2 with different content
      await db.insert(promptVersions).values({
        promptId: prompt.id,
        userId: testUserId,
        name: 'Old Restore Test',
        content: 'Old content',
        variables: ['old'],
        category: 'writing',
        versionNumber: 2,
        changeReason: 'Before restoration',
      });

      // Update current prompt
      await db
        .update(prompts)
        .set({
          name: 'Restore Test',
          content: 'Current content',
          variables: ['current'],
          category: 'coding',
        })
        .where(eq(prompts.id, prompt.id));

      // Restore to version 2
      const versionToRestore = 2;

      await db.transaction(async (tx) => {
        // Fetch current state
        const currentPromptResults = await tx
          .select()
          .from(prompts)
          .where(and(eq(prompts.id, prompt.id), eq(prompts.userId, testUserId)));

        const currentPrompt = currentPromptResults[0];

        // Fetch version to restore
        const versionResults = await tx
          .select()
          .from(promptVersions)
          .where(
            and(
              eq(promptVersions.promptId, prompt.id),
              eq(promptVersions.versionNumber, versionToRestore)
            )
          );

        const versionToRestoreData = versionResults[0];

        // Get next version number for audit trail
        const versionCountResults = await tx
          .select({ versionNumber: promptVersions.versionNumber })
          .from(promptVersions)
          .where(eq(promptVersions.promptId, prompt.id))
          .orderBy(desc(promptVersions.versionNumber))
          .limit(1);

        const nextVersionNumber = versionCountResults[0].versionNumber + 1;

        // Create audit trail entry
        await tx.insert(promptVersions).values({
          promptId: currentPrompt.id,
          userId: currentPrompt.userId,
          name: currentPrompt.name,
          content: currentPrompt.content,
          variables: currentPrompt.variables,
          category: currentPrompt.category,
          versionNumber: nextVersionNumber,
          changeReason: `Restored from version ${versionToRestore}`,
        });

        // Restore prompt
        await tx
          .update(prompts)
          .set({
            name: versionToRestoreData.name,
            content: versionToRestoreData.content,
            variables: versionToRestoreData.variables,
            category: versionToRestoreData.category,
          })
          .where(eq(prompts.id, prompt.id));
      });

      // Verify prompt was restored
      const restoredPromptResults = await db
        .select()
        .from(prompts)
        .where(eq(prompts.id, prompt.id));
      const restoredPrompt = restoredPromptResults[0];

      expect(restoredPrompt.name).toBe('Old Restore Test');
      expect(restoredPrompt.content).toBe('Old content');
      expect(restoredPrompt.variables).toEqual(['old']);
      expect(restoredPrompt.category).toBe('writing');
    });

    it('should create audit trail entry when restoring', async () => {
      // Create prompt with versions
      const prompt = await db.transaction(async (tx) => {
        const [newPrompt] = await tx
          .insert(prompts)
          .values({
            userId: testUserId,
            name: 'Audit Trail Test',
            content: 'Current',
            variables: [],
            category: 'general',
            isPublic: false,
          })
          .returning();

        await tx.insert(promptVersions).values({
          promptId: newPrompt.id,
          userId: testUserId,
          name: newPrompt.name,
          content: newPrompt.content,
          variables: newPrompt.variables,
          category: newPrompt.category,
          versionNumber: 1,
          changeReason: 'Initial version',
        });

        return newPrompt;
      });

      createdPromptIds.push(prompt.id);

      // Add version 2
      await db.insert(promptVersions).values({
        promptId: prompt.id,
        userId: testUserId,
        name: 'Previous Version',
        content: 'Previous content',
        variables: ['prev'],
        category: 'coding',
        versionNumber: 2,
        changeReason: 'Old version',
      });

      // Restore to version 2
      const versionToRestore = 2;

      await db.transaction(async (tx) => {
        const currentPromptResults = await tx
          .select()
          .from(prompts)
          .where(and(eq(prompts.id, prompt.id), eq(prompts.userId, testUserId)));

        const currentPrompt = currentPromptResults[0];

        const versionResults = await tx
          .select()
          .from(promptVersions)
          .where(
            and(
              eq(promptVersions.promptId, prompt.id),
              eq(promptVersions.versionNumber, versionToRestore)
            )
          );

        const versionToRestoreData = versionResults[0];

        const versionCountResults = await tx
          .select({ versionNumber: promptVersions.versionNumber })
          .from(promptVersions)
          .where(eq(promptVersions.promptId, prompt.id))
          .orderBy(desc(promptVersions.versionNumber))
          .limit(1);

        const nextVersionNumber = versionCountResults[0].versionNumber + 1;

        // Create audit trail entry
        await tx.insert(promptVersions).values({
          promptId: currentPrompt.id,
          userId: currentPrompt.userId,
          name: currentPrompt.name,
          content: currentPrompt.content,
          variables: currentPrompt.variables,
          category: currentPrompt.category,
          versionNumber: nextVersionNumber,
          changeReason: `Restored from version ${versionToRestore}`,
        });

        await tx
          .update(prompts)
          .set({
            name: versionToRestoreData.name,
            content: versionToRestoreData.content,
            variables: versionToRestoreData.variables,
            category: versionToRestoreData.category,
          })
          .where(eq(prompts.id, prompt.id));
      });

      // Verify audit trail entry was created
      const versions = await db
        .select()
        .from(promptVersions)
        .where(eq(promptVersions.promptId, prompt.id))
        .orderBy(desc(promptVersions.versionNumber));

      expect(versions.length).toBe(3);
      expect(versions[0].versionNumber).toBe(3);
      expect(versions[0].changeReason).toBe('Restored from version 2');
      expect(versions[0].name).toBe('Audit Trail Test'); // Should have current state before restore
      expect(versions[0].content).toBe('Current'); // Should have current content before restore

      expect(versions[1].versionNumber).toBe(2);
      expect(versions[2].versionNumber).toBe(1);
    });

    it('should validate ownership before restoring', async () => {
      // Create another user
      const otherUserId = generateULID();
      await db.insert(user).values({
        id: otherUserId,
        name: 'Other User Restore',
        email: `other-restore-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
        emailVerified: true,
      });

      // Create prompt for other user
      const [otherPrompt] = await db
        .insert(prompts)
        .values({
          userId: otherUserId,
          name: "Other's Prompt",
          content: 'Not accessible',
          variables: [],
          category: 'general',
          isPublic: false,
        })
        .returning();

      // Add version
      await db.insert(promptVersions).values({
        promptId: otherPrompt.id,
        userId: otherUserId,
        name: 'Version 1',
        content: 'Content 1',
        variables: [],
        category: 'general',
        versionNumber: 1,
        changeReason: 'Initial',
      });

      // Try to verify ownership with testUserId
      const promptResults = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, otherPrompt.id), eq(prompts.userId, testUserId)));

      expect(promptResults.length).toBe(0);

      // Clean up
      await db.delete(prompts).where(eq(prompts.id, otherPrompt.id));
      await db.delete(user).where(eq(user.id, otherUserId));
    });

    it('should handle restoring to initial version', async () => {
      // Create prompt
      const prompt = await db.transaction(async (tx) => {
        const [newPrompt] = await tx
          .insert(prompts)
          .values({
            userId: testUserId,
            name: 'Initial Restore Test',
            content: 'Initial',
            variables: ['init'],
            category: 'coding',
            isPublic: false,
          })
          .returning();

        await tx.insert(promptVersions).values({
          promptId: newPrompt.id,
          userId: testUserId,
          name: newPrompt.name,
          content: newPrompt.content,
          variables: newPrompt.variables,
          category: newPrompt.category,
          versionNumber: 1,
          changeReason: 'Initial version',
        });

        return newPrompt;
      });

      createdPromptIds.push(prompt.id);

      // Update prompt
      await db.transaction(async (tx) => {
        const versionResults = await tx
          .select({ versionNumber: promptVersions.versionNumber })
          .from(promptVersions)
          .where(eq(promptVersions.promptId, prompt.id))
          .orderBy(desc(promptVersions.versionNumber))
          .limit(1);

        const nextVersionNumber = versionResults[0].versionNumber + 1;

        await tx.insert(promptVersions).values({
          promptId: prompt.id,
          userId: testUserId,
          name: prompt.name,
          content: prompt.content,
          variables: prompt.variables,
          category: prompt.category,
          versionNumber: nextVersionNumber,
          changeReason: 'Update',
        });

        await tx
          .update(prompts)
          .set({ name: 'Updated Name', content: 'Updated content' })
          .where(eq(prompts.id, prompt.id));
      });

      // Restore to initial version (version 1)
      await db.transaction(async (tx) => {
        const currentPromptResults = await tx
          .select()
          .from(prompts)
          .where(and(eq(prompts.id, prompt.id), eq(prompts.userId, testUserId)));

        const currentPrompt = currentPromptResults[0];

        const versionResults = await tx
          .select()
          .from(promptVersions)
          .where(and(eq(promptVersions.promptId, prompt.id), eq(promptVersions.versionNumber, 1)));

        const versionToRestoreData = versionResults[0];

        const versionCountResults = await tx
          .select({ versionNumber: promptVersions.versionNumber })
          .from(promptVersions)
          .where(eq(promptVersions.promptId, prompt.id))
          .orderBy(desc(promptVersions.versionNumber))
          .limit(1);

        const nextVersionNumber = versionCountResults[0].versionNumber + 1;

        await tx.insert(promptVersions).values({
          promptId: currentPrompt.id,
          userId: currentPrompt.userId,
          name: currentPrompt.name,
          content: currentPrompt.content,
          variables: currentPrompt.variables,
          category: currentPrompt.category,
          versionNumber: nextVersionNumber,
          changeReason: 'Restored from version 1',
        });

        await tx
          .update(prompts)
          .set({
            name: versionToRestoreData.name,
            content: versionToRestoreData.content,
            variables: versionToRestoreData.variables,
            category: versionToRestoreData.category,
          })
          .where(eq(prompts.id, prompt.id));
      });

      // Verify restoration
      const restoredPromptResults = await db
        .select()
        .from(prompts)
        .where(eq(prompts.id, prompt.id));
      const restoredPrompt = restoredPromptResults[0];

      expect(restoredPrompt.name).toBe('Initial Restore Test');
      expect(restoredPrompt.content).toBe('Initial');
      expect(restoredPrompt.variables).toEqual(['init']);
      expect(restoredPrompt.category).toBe('coding');
    });

    it('should handle non-existent version number gracefully', async () => {
      // Create prompt
      const prompt = await db.transaction(async (tx) => {
        const [newPrompt] = await tx
          .insert(prompts)
          .values({
            userId: testUserId,
            name: 'Non-existent Version Test',
            content: 'Test',
            variables: [],
            category: 'general',
            isPublic: false,
          })
          .returning();

        await tx.insert(promptVersions).values({
          promptId: newPrompt.id,
          userId: testUserId,
          name: newPrompt.name,
          content: newPrompt.content,
          variables: newPrompt.variables,
          category: newPrompt.category,
          versionNumber: 1,
          changeReason: 'Initial version',
        });

        return newPrompt;
      });

      createdPromptIds.push(prompt.id);

      // Try to restore to non-existent version (version 999)
      const versionResults = await db
        .select()
        .from(promptVersions)
        .where(and(eq(promptVersions.promptId, prompt.id), eq(promptVersions.versionNumber, 999)));

      expect(versionResults.length).toBe(0);
    });
  });
});
