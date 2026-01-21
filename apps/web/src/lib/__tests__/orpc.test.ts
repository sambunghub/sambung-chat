/**
 * ORPC Client Configuration Tests
 *
 * Tests for the ORPC client configuration
 * Run with: bun test apps/web/src/lib/__tests__/orpc.test.ts
 */

// Vitest globals enabled - no imports needed
describe('ORPC Client Configuration', () => {
  it('should have PUBLIC_API_URL defined for backend API calls', () => {
    expect(process.env.PUBLIC_API_URL).toBeDefined();
    expect(process.env.PUBLIC_API_URL).toBe('http://localhost:3000');
  });

  it('should have PUBLIC_SERVER_URL defined for frontend URL', () => {
    expect(process.env.PUBLIC_SERVER_URL).toBeDefined();
    // PUBLIC_SERVER_URL can be either port 3000, 5173, or 5174 depending on environment
    expect(['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174']).toContain(
      process.env.PUBLIC_SERVER_URL!
    );
  });

  it('should match CORS_ORIGIN with frontend', () => {
    // CORS_ORIGIN can be comma-separated list of URLs
    const frontendUrls = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
    ];
    expect(process.env.CORS_ORIGIN).toBeDefined();

    // Parse comma-separated CORS_ORIGIN and check if all are valid frontend URLs
    const corsOrigins = process.env.CORS_ORIGIN!.split(',').map((url) => url.trim());
    corsOrigins.forEach((origin) => {
      expect(frontendUrls).toContain(origin);
    });
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
    // Note: todo router moved to _example/ folder and is not exported
    expect(typeof api.appRouter.chat).toBe('object');
    expect(typeof api.appRouter.message).toBe('object');
    expect(typeof api.appRouter.folder).toBe('object');

    // Note: Type exports like AppRouter and AppRouterClient are compile-time only
    // and don't exist at runtime in JavaScript
  });
});
