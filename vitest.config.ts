/**
 * Vitest Configuration
 *
 * Purpose: Configure Vitest for unit and integration tests
 *
 * Usage: Run tests with `bun test` or `bun run test:unit`
 */

import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // Enable globals (describe, it, expect, etc.)
    globals: true,

    // Test environment
    environment: 'node',

    // Include patterns
    include: ['**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.svelte-kit/**', '**/build/**'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['apps/*/src/**/*.{js,ts}', 'packages/*/src/**/*.{js,ts}'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
        '**/types/**',
        '**/fixtures/**',
      ],
    },

    // Setup files
    setupFiles: [],

    // Test timeout (milliseconds)
    testTimeout: 10000,

    // Hook timeout (milliseconds)
    hookTimeout: 10000,

    // Isolate tests (run in separate contexts)
    isolate: true,

    // Threads (parallel test execution)
    threads: true,

    // Max threads (0 = use CPU count)
    maxThreads: 4,

    // Min threads
    minThreads: 1,

    // Report configuration
    reporters: ['verbose'],

    // Watch mode
    watch: false,

    // Bail on first failure
    bail: 0,

    // Retry failed tests
    retry: 2,

    // Diff configuration
    diff: true,

    // Show full error stack
    showFullStackTrace: false,

    // Suppress console output during tests
    silent: false,

    // Pass environment variables to tests
    env: {
      NODE_ENV: 'test',
    },
  },

  // Path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web/src'),
      '@test': path.resolve(__dirname, './tests'),
    },
  },
});
