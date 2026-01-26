import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@sambung-chat/db';
import { userPreferences } from '@sambung-chat/db/schema/user-preferences';
import { user } from '@sambung-chat/db/schema/auth';
import { eq } from 'drizzle-orm';
import { userPreferencesRouter } from './user-preferences';
import { createContext } from '../index';
import { faker } from '@faker-js/faker';
import { generateULID } from '@sambung-chat/db/utils/ulid';

// Helper to create mock Hono context
function createMockContext(userId: string) {
  const headers = new Headers();
  const mockReq = {
    raw: {
      headers,
    },
  };
  return {
    req: mockReq,
    session: { user: { id: userId } },
  };
}

describe('User Preferences Router', () => {
  let testUserId: string;
  let createdPreferenceIds: string[] = [];

  beforeAll(async () => {
    // Create test user
    testUserId = generateULID();
    await db
      .insert(user)
      .values({
        id: testUserId,
        email: `user-preferences-test-${Date.now()}@example.com`,
        name: faker.person.fullName(),
        emailVerified: true,
      })
      .returning();
  });

  afterAll(async () => {
    // Cleanup created preferences
    if (createdPreferenceIds.length > 0) {
      await db.delete(userPreferences).where(eq(userPreferences.userId, testUserId));
    }

    // Cleanup test user
    await db.delete(user).where(eq(user.id, testUserId));
  });

  beforeEach(() => {
    createdPreferenceIds = [];
  });

  describe('get', () => {
    it('should create default preferences if not exists', async () => {
      const mockHonoContext = createMockContext(testUserId);
      const context = await createContext({
        context: mockHonoContext as never,
      });

      // First call should create defaults
      const result = await userPreferencesRouter.get({ context } as never);

      expect(result).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.sidebarWidth).toBe(280);
      expect(result.fontSize).toBe('medium');
      expect(result.privacyMode).toBe(false);

      createdPreferenceIds.push(result.id);
    });

    it('should return existing preferences', async () => {
      const mockHonoContext = createMockContext(testUserId);
      const context = await createContext({
        context: mockHonoContext as never,
      });

      // Create initial preferences
      const initial = await userPreferencesRouter.get({ context } as never);

      // Call again should return same preferences
      const result = await userPreferencesRouter.get({ context } as never);

      expect(result.id).toBe(initial.id);
      expect(result.userId).toBe(testUserId);

      createdPreferenceIds.push(result.id);
    });
  });

  describe('update', () => {
    it('should update sidebar width', async () => {
      const mockHonoContext = createMockContext(testUserId);
      const context = await createContext({
        context: mockHonoContext as never,
      });

      // Create initial preferences
      await userPreferencesRouter.get({ context } as never);

      // Update sidebar width
      const result = await userPreferencesRouter.update({
        context: context as never,
        input: { sidebarWidth: 350 },
      });

      expect(result.sidebarWidth).toBe(350);
      expect(result.fontSize).toBe('medium'); // Should remain unchanged
      expect(result.privacyMode).toBe(false); // Should remain unchanged

      createdPreferenceIds.push(result.id);
    });

    it('should update font size', async () => {
      const mockHonoContext = createMockContext(testUserId);
      const context = await createContext({
        context: mockHonoContext as never,
      });

      // Create initial preferences
      await userPreferencesRouter.get({ context } as never);

      // Update font size
      const result = await userPreferencesRouter.update({
        context: context as never,
        input: { fontSize: 'large' },
      });

      expect(result.fontSize).toBe('large');

      createdPreferenceIds.push(result.id);
    });

    it('should update privacy mode', async () => {
      const mockHonoContext = createMockContext(testUserId);
      const context = await createContext({
        context: mockHonoContext as never,
      });

      // Create initial preferences
      await userPreferencesRouter.get({ context } as never);

      // Update privacy mode
      const result = await userPreferencesRouter.update({
        context: context as never,
        input: { privacyMode: true },
      });

      expect(result.privacyMode).toBe(true);

      createdPreferenceIds.push(result.id);
    });

    it('should update multiple fields at once', async () => {
      const mockHonoContext = createMockContext(testUserId);
      const context = await createContext({
        context: mockHonoContext as never,
      });

      // Create initial preferences
      await userPreferencesRouter.get({ context } as never);

      // Update multiple fields
      const result = await userPreferencesRouter.update({
        context: context as never,
        input: {
          sidebarWidth: 300,
          fontSize: 'small',
          privacyMode: true,
        },
      });

      expect(result.sidebarWidth).toBe(300);
      expect(result.fontSize).toBe('small');
      expect(result.privacyMode).toBe(true);

      createdPreferenceIds.push(result.id);
    });

    it('should reject invalid sidebar width', async () => {
      const mockHonoContext = createMockContext(testUserId);
      const context = await createContext({
        context: mockHonoContext as never,
      });

      // Create initial preferences
      await userPreferencesRouter.get({ context } as never);

      // Try to update with invalid width (too small)
      await expect(
        userPreferencesRouter.update({
          context: context as never,
          input: { sidebarWidth: 150 },
        })
      ).rejects.toThrow();

      // Try to update with invalid width (too large)
      await expect(
        userPreferencesRouter.update({
          context: context as never,
          input: { sidebarWidth: 500 },
        })
      ).rejects.toThrow();
    });

    it('should reject invalid font size', async () => {
      const mockHonoContext = createMockContext(testUserId);
      const context = await createContext({
        context: mockHonoContext as never,
      });

      // Create initial preferences
      await userPreferencesRouter.get({ context } as never);

      // Try to update with invalid font size
      await expect(
        userPreferencesRouter.update({
          context: context as never,
          input: { fontSize: 'invalid' as never },
        })
      ).rejects.toThrow();
    });
  });
});
