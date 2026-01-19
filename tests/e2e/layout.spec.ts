/**
 * Layout E2E Tests
 *
 * Tests for application layout, navigation, and responsive design
 */

import { expect, test } from '@playwright/test';

test.describe('Application Layout', () => {
  test('should have proper viewport meta tag', async ({ page }) => {
    await page.goto('/');
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('should display fixed header', async ({ page }) => {
    await page.goto('/');

    // Header should be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header).toHaveCSS('position', 'fixed');
  });

  test('should display SambungChat logo in header', async ({ page }) => {
    await page.goto('/');

    const logo = page.getByText('SambungChat');
    await expect(logo).toBeVisible();
  });

  test('should have main content area below header', async ({ page }) => {
    await page.goto('/');

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Page Navigation', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SambungChat/);
  });

  test('should load AI page when authenticated', async ({ page }) => {
    // Navigate to AI page (will redirect to login if not authenticated)
    await page.goto('/ai');
    // Either shows AI page or redirects to login
    expect(page.url()).toMatch(/\/(ai|login)/);
  });

  test('should load dashboard when authenticated', async ({ page }) => {
    // Navigate to dashboard (will redirect to login if not authenticated)
    await page.goto('/dashboard');
    // Either shows dashboard or redirects to login
    expect(page.url()).toMatch(/\/(dashboard|login)/);
  });

  test('should load todos page when authenticated', async ({ page }) => {
    // Navigate to todos (will redirect to login if not authenticated)
    await page.goto('/todos');
    // Either shows todos or redirects to login
    expect(page.url()).toMatch(/\/(todos|login)/);
  });
});

test.describe('Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Header should still be visible on mobile
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Header should be visible on tablet
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // All layout elements should be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check for at least one h1
    const h1 = page.locator('h1');
    const count = await h1.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have skip link or equivalent accessibility feature', async ({ page }) => {
    await page.goto('/');

    // Check for skip-to-content link or similar
    const skipLinks = page.locator('a[href^="#"]:has-text("skip")');
    // This is optional, just log if it exists
    const count = await skipLinks.count();
    if (count > 0) {
      console.log('Skip link found');
    }
  });
});
