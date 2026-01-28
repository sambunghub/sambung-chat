/**
 * Vitest Setup File
 *
 * Purpose: Setup before tests run
 *
 * Note: Environment variables are set in vitest.config.ts to avoid
 * conflicts with local .env file. Do not load .env here during tests.
 */

import { afterEach, vi } from 'vitest';

// Clear all mocks after each test to ensure test isolation
// This prevents mocks from one test leaking into others
// Using clearAllMocks() to clear mock history without resetting implementations
// Note: resetAllMocks() would break test-specific mock setups
afterEach(() => {
  vi.clearAllMocks();
});
