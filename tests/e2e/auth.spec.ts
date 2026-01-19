/**
 * Authentication E2E Tests
 *
 * Tests for authentication flow and user menu
 */

import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display sign in button when not authenticated', async ({ page }) => {
    // Sign in button should be visible in the header
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing AI chat without authentication', async ({
    page,
  }) => {
    // Try to access AI chat without authentication
    await page.goto('/ai');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should display header with logo on all pages', async ({ page }) => {
    // Check homepage
    await page.goto('/');
    const logo = page.getByText('SambungChat');
    await expect(logo).toBeVisible();

    // Check login page
    await page.goto('/login');
    await expect(logo).toBeVisible();
  });
});

test.describe('User Menu (Authenticated)', () => {
  // Note: These tests require authentication setup
  // They are marked as skipped until auth is properly configured in test environment

  test.skip('should display user email when authenticated', async ({ page }) => {
    // This test requires valid authentication
    // TODO: Setup test authentication
    await page.goto('/');

    // Should show user email or name instead of sign in button
    const userInfo = page.locator('[title*="@"]');
    await expect(userInfo).toBeVisible();
  });

  test.skip('should display sign out button when authenticated', async ({ page }) => {
    // This test requires valid authentication
    // TODO: Setup test authentication
    await page.goto('/');

    const signOutButton = page.getByRole('button', { name: /sign out/i });
    await expect(signOutButton).toBeVisible();
  });

  test.skip('should sign out and redirect to login', async ({ page }) => {
    // This test requires valid authentication
    // TODO: Setup test authentication
    await page.goto('/');

    const signOutButton = page.getByRole('button', { name: /sign out/i });
    await signOutButton.click();

    // Should redirect to login or homepage
    await expect(page).toHaveURL(/\/(login|)/);
  });
});
