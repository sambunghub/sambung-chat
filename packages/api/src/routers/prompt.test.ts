/**
 * Prompt Router Tests
 *
 * Purpose: Verify all prompt router procedures work correctly
 *
 * Run with: bun test packages/api/src/routers/prompt.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@sambung-chat/db';
import { prompts } from '@sambung-chat/db/schema/prompt';
import { user } from '@sambung-chat/db/schema/auth';
import { eq, and, inArray } from 'drizzle-orm';
import { generateULID } from '@sambung-chat/db/utils/ulid';

// Set up minimal environment variables for testing (use process.env with fallbacks)
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/sambungchat_dev';
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
    await db.insert(user).values({
      id: testUserId,
      name: 'Prompt Test User',
      email: 'prompt-test@example.com',
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
      let results = await db
        .select()
        .from(prompts)
        .where(eq(prompts.id, prompt.id));

      expect(results.length).toBe(1);

      // Delete prompt
      await db.delete(prompts).where(eq(prompts.id, prompt.id));

      // Verify prompt is deleted
      results = await db
        .select()
        .from(prompts)
        .where(eq(prompts.id, prompt.id));

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
        email: 'other-user@example.com',
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
        .where(
          and(
            eq(prompts.userId, testUserId),
            sql`${prompts.name} ILIKE ${`%${query}%`}`
          )
        )
        .orderBy(prompts.updatedAt);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.name.includes(query))).toBe(true);
    });

    it('should search prompts by keyword in content', async () => {
      const query = 'professional';
      const results = await db
        .select()
        .from(prompts)
        .where(
          and(
            eq(prompts.userId, testUserId),
            sql`${prompts.content} ILIKE ${`%${query}%`}`
          )
        )
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
      expect(
        results.every((r) => r.createdAt >= dateFrom && r.createdAt <= dateTo)
      ).toBe(true);
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
      const query = 'Help!'; // Contains special character
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
});
