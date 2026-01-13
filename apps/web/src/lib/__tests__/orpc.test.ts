/**
 * ORPC Client Configuration Tests
 *
 * Tests for the ORPC client configuration
 * Run with: bun test apps/web/src/lib/__tests__/orpc.test.ts
 */

import { describe, it, expect } from 'bun:test';

describe('ORPC Client Configuration', () => {
  it('should have PUBLIC_SERVER_URL defined', () => {
    expect(process.env.PUBLIC_SERVER_URL).toBeDefined();
    expect(process.env.PUBLIC_SERVER_URL).toBe('http://localhost:3000');
  });

  it('should match CORS_ORIGIN with frontend', () => {
    const frontendUrl = 'http://localhost:5173';
    expect(process.env.CORS_ORIGIN).toBe(frontendUrl);
  });
});

describe('ORPC Client Type Exports', () => {
  it('should export API router module with all routes', async () => {
    const api = await import('@sambung-chat/api/routers/index');

    expect(api).toBeDefined();
    expect(api.appRouter).toBeDefined();

    // Verify all expected routes exist
    expect(typeof api.appRouter.healthCheck).toBe('object');
    expect(typeof api.appRouter.privateData).toBe('object');
    expect(typeof api.appRouter.todo).toBe('object');
    expect(typeof api.appRouter.chat).toBe('object');
    expect(typeof api.appRouter.message).toBe('object');

    // Note: Type exports like AppRouter and AppRouterClient are compile-time only
    // and don't exist at runtime in JavaScript
  });
});
