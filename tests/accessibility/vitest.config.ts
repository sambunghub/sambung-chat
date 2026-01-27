/**
 * Accessibility Testing Configuration
 *
 * Purpose: Configure Vitest for automated accessibility testing with jest-axe
 *
 * Usage: Run accessibility tests with `bun run test:axe`
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/accessibility/**/*.spec.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/accessibility/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/accessibility/setup.ts'],
    },
  },
});
