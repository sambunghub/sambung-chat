/**
 * Vitest Configuration
 *
 * Purpose: Configure Vitest for unit and integration tests
 *
 * Usage: Place in root of project or test directory
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Enable globals (describe, it, expect, etc.)
    globals: true,

    // Test environment
    environment: 'node',

    // Include patterns
    include: ['**/*.{test,spec}.{js,ts}'],

    // Exclude patterns
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],

    // Coverage configuration
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{js,ts}'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
        '**/types/**',
        '**/fixtures/**',
      ],
      // Coverage thresholds
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
      // Per-file thresholds
      perFile: true,
    },

    // Setup files
    setupFiles: ['./setup/tests/setup.ts'],

    // Global setup files (run once before all tests)
    globalSetup: ['./setup/tests/global-setup.ts'],

    // Test timeout (milliseconds)
    testTimeout: 10000, // 10 seconds default

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
    reporters: ['verbose', 'json', 'html'],

    // Output directory
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html',
    },

    // Watch mode
    watch: false,

    // Bail on first failure
    bail: 0, // 0 = don't bail

    // Retry failed tests
    retry: 2,

    // Diff configuration
    diff: true,
    diffBase: 'git', // or 'main' branch name

    // Show full error stack
    showFullStackTrace: false,

    // Suppress console output during tests
    silent: false,

    // Pass environment variables to tests
    env: {
      NODE_ENV: 'test',
    },

    // Benchmark configuration
    benchmark: {
      // Include samples
      include: ['**/*.bench.{js,ts}'],

      // Exclude samples
      exclude: ['node_modules/', 'dist/'],

      // Results output file
      outputFile: './benchmarks/results.json',
    },
  },

  // Path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@test': path.resolve(__dirname, '../tests'),
      '@fixtures': path.resolve(__dirname, './fixtures'),
      '@utils': path.resolve(__dirname, './utils'),
    },
  },

  // Define global constants
  define: {
    __TEST__: 'true',
    __VERSION__: '"1.0.0"',
  },
});
