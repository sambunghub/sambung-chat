/**
 * Accessibility Test Setup
 *
 * Purpose: Configure jest-axe for automated accessibility testing
 *
 * Usage: This file is loaded by vitest.config.ts before running accessibility tests
 */

import { toHaveNoViolations } from 'jest-axe';

// Extend Vitest's expect with jest-axe custom matcher
expect.extend(toHaveNoViolations);

// Set up global test configuration
beforeEach(() => {
  // Clear any mocks or state before each test
  vi.clearAllMocks();
});
