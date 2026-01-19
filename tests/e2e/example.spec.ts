/**
 * Example E2E Test
 *
 * Basic tests to verify Playwright setup is working correctly.
 */

import { expect, test } from '@playwright/test';

test.describe('Basic Application Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Check that the page loaded
    await expect(page).toHaveTitle(/SambungChat/);
  });

  test('page has no console errors', async ({ page }) => {
    // Collect console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Check for no errors
    expect(errors).toHaveLength(0);
  });

  test('basic page navigation works', async ({ page }) => {
    await page.goto('/');

    // Get the current URL
    const url = page.url();
    expect(url).toContain('localhost');
  });

  test('page is responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check page loads without errors
    await expect(page).toHaveTitle(/SambungChat/);
  });

  test('page loads successfully on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Check page loads without errors
    await expect(page).toHaveTitle(/SambungChat/);
  });
});
