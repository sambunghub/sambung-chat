/**
 * Server/API Tests
 *
 * Run with: bun test
 */

import { describe, it, expect } from 'bun:test';

describe('Server Environment', () => {
  it('should have DATABASE_URL defined', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL).toContain('postgresql://');
  });

  it('should have BETTER_AUTH_SECRET defined (min 32 chars)', () => {
    expect(process.env.BETTER_AUTH_SECRET).toBeDefined();
    expect(process.env.BETTER_AUTH_SECRET!.length).toBeGreaterThanOrEqual(32);
  });

  it('should have BETTER_AUTH_URL defined', () => {
    expect(process.env.BETTER_AUTH_URL).toBeDefined();
    expect(process.env.BETTER_AUTH_URL).toBe('http://localhost:3000');
  });

  it('should have CORS_ORIGIN defined', () => {
    expect(process.env.CORS_ORIGIN).toBeDefined();
    expect(process.env.CORS_ORIGIN).toBe('http://localhost:5173');
  });

  it('should have NODE_ENV set', () => {
    expect(process.env.NODE_ENV).toBeDefined();
    expect(['development', 'test', 'production']).toContain(process.env.NODE_ENV);
  });
});

describe('Auth Module', () => {
  it('should import auth module successfully', async () => {
    const { auth } = await import('@sambung-chat/auth');

    expect(auth).toBeDefined();
    expect(typeof auth.handler).toBe('function');
    expect(typeof auth.api).toBe('object');
  });
});

describe('API Router', () => {
  it('should import API router successfully', async () => {
    const { appRouter } = await import('@sambung-chat/api/routers/index');

    expect(appRouter).toBeDefined();
    expect(typeof appRouter.healthCheck).toBe('object');
    expect(typeof appRouter.privateData).toBe('object');
    expect(typeof appRouter.todo).toBe('object');
    expect(typeof appRouter.chat).toBe('object');
    expect(typeof appRouter.message).toBe('object');
  });
});
