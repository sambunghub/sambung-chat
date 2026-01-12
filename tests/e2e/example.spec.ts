/**
 * Example E2E Test
 *
 * This is a placeholder test to verify Playwright setup is working correctly.
 * Replace this with actual E2E tests as you build out the application.
 */

import { expect, test } from '@playwright/test';

test.describe('Example Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Check that the page loaded
    await expect(page).toHaveTitle(/SambungChat/);
  });

  test('basic page navigation works', async ({ page }) => {
    await page.goto('/');

    // Get the current URL
    const url = page.url();
    expect(url).toContain('localhost');
  });
});
