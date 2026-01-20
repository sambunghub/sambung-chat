/**
 * Vitest Configuration
 *
 * Purpose: Configure Vitest for unit and integration tests
 *
 * Usage: Run tests with `bun test` or `bun run test:unit`
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Enable globals (describe, it, expect, etc.)
    globals: true,

    // Test environment
    environment: 'node',

    // Load environment variables from .env file
    envDir: '.',

    // Include patterns
    include: ['**/*.{test,spec}.{js,ts}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.svelte-kit/**',
      '**/build/**',
      '**/examples/**',
      '**/tests/e2e/**',
    ],

    // Setup files - loads .env before tests run
    setupFiles: ['./vitest.setup.ts'],

    // Test timeout (milliseconds)
    testTimeout: 10000,

    // Report configuration
    reporters: ['verbose'],

    // Watch mode
    watch: false,

    // Pass environment variables to tests
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      ENCRYPTION_KEY: '6zntUQJc/2ah8bfoSky0ttJmfBvAKHs1n+DGykcXW1E=',
      BETTER_AUTH_SECRET: 'test-secret-minimum-32-characters-long-for-test',
      BETTER_AUTH_URL: 'http://localhost:3000',
      BETTER_AUTH_CLIENT_ID: 'test-client-id',
      CORS_ORIGIN: 'http://localhost:5174',
      PORT: '3000',
      PUBLIC_SERVER_URL: 'http://localhost:3000',
      PUBLIC_API_URL: 'http://localhost:3000',
    },
  },
});
