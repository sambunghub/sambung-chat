/**
 * Test Setup File
 *
 * Purpose: Global setup for all test files
 *
 * Usage: Imported before each test file runs
 */

import { vi } from 'vitest';

// Mock console methods to reduce noise during tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Setup that runs once before all tests
  console.log('🧪 Test suite starting...');
});

afterAll(() => {
  // Cleanup that runs once after all tests
  console.log('✅ Test suite complete');
});

beforeEach(() => {
  // Setup that runs before each test

  // Mock console.error to track errors without spamming output
  console.error = vi.fn((...args) => {
    // Still log errors but in a controlled way
    if (process.env.DEBUG_TESTS === 'true') {
      originalError(...args);
    }
  });

  console.warn = vi.fn((...args) => {
    if (process.env.DEBUG_TESTS === 'true') {
      originalWarn(...args);
    }
  });
});

afterEach(() => {
  // Cleanup that runs after each test

  // Restore console methods
  console.error = originalError;
  console.warn = originalWarn;

  // Clear all mocks
  vi.clearAllMocks();

  // Clear timers
  vi.clearAllTimers();
});

// Global test utilities
global.testUtils = {
  // Wait for specified milliseconds
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Generate random string
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  // Get test environment
  isCI: process.env.CI === 'true',

  // Check if running in debug mode
  isDebug: process.env.DEBUG_TESTS === 'true',
};

// Mock environment variables for testing
const mockEnv = {
  NODE_ENV: 'test',
  // Add provider API keys (use test keys, not production)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'sk-test-mock-key',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'sk-ant-test-mock-key',
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || 'AIza-test-mock-key',
  GROQ_API_KEY: process.env.GROQ_API_KEY || 'gsk-test-mock-key',
};

// Set mock environment variables
Object.entries(mockEnv).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});

// Export for use in tests
export { mockEnv };

/**
 * Customization Checklist:
 *
 * ✅ Add provider-specific environment variables
 * ✅ Add global test utilities
 * ✅ Configure mock behavior
 * ✅ Add setup/teardown for external services
 * ✅ Configure test database/services
 * ✅ Add custom matchers/assertions
 */
