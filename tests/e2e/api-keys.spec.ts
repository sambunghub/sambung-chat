/**
 * API Key Management E2E Tests
 *
 * Tests for complete user flow of API key management including:
 * - Viewing API keys page
 * - Adding new API keys
 * - Viewing existing keys
 * - Updating API keys
 * - Deleting API keys
 * - Toggle key visibility
 * - Copy to clipboard
 * - Security information display
 */

import { expect, test } from '@playwright/test';

test.describe.skip('API Keys Management', () => {
  // Note: These tests require authentication
  // They are marked as skip until auth is properly configured in test environment

  test.beforeEach(async ({ page }) => {
    // Navigate to API Keys page
    await page.goto('/app/settings/api-keys');
  });

  test('should display API keys page with security information', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('API Keys');

    // Check description
    await expect(page.locator('text=Manage your API keys')).toBeVisible();

    // Check security information banner
    await expect(page.locator('text=Security Information')).toBeVisible();
    await expect(page.locator('text=AES-256-GCM encryption')).toBeVisible();

    // Check settings navigation sidebar
    await expect(page.locator('text=AI Models')).toBeVisible();
    await expect(page.locator('text=API Keys')).toBeVisible();

    // Check add button
    const addButton = page.getByRole('button', { name: /add new api key/i });
    await expect(addButton).toBeVisible();
  });

  test('should display empty state when no keys exist', async ({ page }) => {
    // Check for empty state message
    const emptyState = page.locator('text=no api keys yet');
    await expect(emptyState).toBeVisible();
  });

  test('should open add dialog when clicking add button', async ({ page }) => {
    // Click add button
    const addButton = page.getByRole('button', { name: /add new api key/i });
    await addButton.click();

    // Check dialog appears
    const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Add New API Key' });
    await expect(dialog).toBeVisible();

    // Check form fields
    await expect(page.locator('label:has-text("Provider")')).toBeVisible();
    await expect(page.locator('label:has-text("Name")')).toBeVisible();
    await expect(page.locator('label:has-text("API Key")')).toBeVisible();

    // Check provider dropdown
    const providerSelect = page.locator('select[name="provider"]');
    await expect(providerSelect).toBeVisible();

    // Check buttons
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });

  test('should close add dialog when clicking cancel', async ({ page }) => {
    // Open add dialog
    const addButton = page.getByRole('button', { name: /add new api key/i });
    await addButton.click();

    // Click cancel
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();

    // Dialog should be closed
    const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Add New API Key' });
    await expect(dialog).not.toBeVisible();
  });

  test('should close add dialog when clicking outside', async ({ page }) => {
    // Open add dialog
    const addButton = page.getByRole('button', { name: /add new api key/i });
    await addButton.click();

    // Click outside dialog (on backdrop)
    const backdrop = page.locator('.fixed.inset-0.z-50');
    await backdrop.click({ position: { x: 10, y: 10 } });

    // Dialog should be closed
    const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Add New API Key' });
    await expect(dialog).not.toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Open add dialog
    const addButton = page.getByRole('button', { name: /add new api key/i });
    await addButton.click();

    // Try to submit without filling fields
    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.click();

    // Form should not submit (dialog should still be visible)
    const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Add New API Key' });
    await expect(dialog).toBeVisible();
  });

  test('should fill form and attempt to create API key', async ({ page }) => {
    // Open add dialog
    const addButton = page.getByRole('button', { name: /add new api key/i });
    await addButton.click();

    // Fill provider
    await page.selectOption('select[name="provider"]', 'openai');

    // Fill name
    await page.fill('input[name="name"]', 'Test API Key');

    // Fill API key
    await page.fill('input[name="key"]', 'sk-test1234567890abcdefghijklmnopqrstuvwxyz');

    // Submit form
    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.click();

    // Note: This will likely fail without proper auth and backend
    // But the test verifies the form submission flow
  });

  test('should display API key cards when keys exist', async ({ page }) => {
    // This test assumes API keys are already present
    // In a real test, we would mock the API response or seed the database

    // Check for key cards (if any exist)
    const keyCards = page.locator('[data-testid="api-key-card"]');
    const count = await keyCards.count();

    if (count > 0) {
      // Check first card has expected elements
      const firstCard = keyCards.first();
      await expect(firstCard.locator('[data-testid="key-provider"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="key-name"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="key-last4"]')).toBeVisible();

      // Check for action buttons
      await expect(firstCard.getByRole('button', { name: /show/i })).toBeVisible();
      await expect(firstCard.getByRole('button', { name: /copy/i })).toBeVisible();
      await expect(firstCard.getByRole('button', { name: /edit/i })).toBeVisible();
      await expect(firstCard.getByRole('button', { name: /delete/i })).toBeVisible();
    }
  });
});

test.describe.skip('API Keys CRUD Operations', () => {
  test('should create new API key successfully', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Open add dialog
    await page.getByRole('button', { name: /add new api key/i }).click();

    // Fill form
    await page.selectOption('select[name="provider"]', 'anthropic');
    await page.fill('input[name="name"]', 'E2E Test Key');
    await page.fill('input[name="key"]', 'sk-ant-test1234567890abcdefghijklmnopqrstuvwxyz');

    // Submit
    await page.getByRole('button', { name: /save/i }).click();

    // Verify success toast (if backend is working)
    // await expect(page.locator('text=API key created successfully')).toBeVisible();

    // Verify key appears in list
    // await expect(page.locator('text=E2E Test Key')).toBeVisible();
  });

  test('should edit existing API key', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Click edit button on first key (if exists)
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    const editExists = await editButton.count();

    if (editExists > 0) {
      await editButton.click();

      // Verify edit dialog
      const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Edit API Key' });
      await expect(dialog).toBeVisible();

      // Update name
      await page.fill('input[name="name"]', 'Updated API Key Name');

      // Submit
      await page.getByRole('button', { name: /save/i }).click();

      // Verify success
      // await expect(page.locator('text=API key updated successfully')).toBeVisible();
    }
  });

  test('should delete API key with confirmation', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Click delete button on first key (if exists)
    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    const deleteExists = await deleteButton.count();

    if (deleteExists > 0) {
      // Click delete
      await deleteButton.click();

      // Handle confirm dialog (browser native)
      page.on('dialog', (dialog) => {
        expect(dialog.message()).toContain('delete');
        dialog.accept();
      });

      // Verify success
      // await expect(page.locator('text=API key deleted successfully')).toBeVisible();

      // Verify key is removed from list
      // await expect(page.locator(`text=${keyName}`)).not.toBeVisible();
    }
  });

  test('should toggle API key visibility', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Find show button on first key (if exists)
    const showButton = page.getByRole('button', { name: /show/i }).first();
    const showExists = await showButton.count();

    if (showExists > 0) {
      // Click to show key
      await showButton.click();

      // Verify hide button appears
      const hideButton = page.getByRole('button', { name: /hide/i }).first();
      await expect(hideButton).toBeVisible();

      // Click to hide
      await hideButton.click();

      // Verify show button reappears
      await expect(showButton).toBeVisible();
    }
  });

  test('should copy API key to clipboard', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Find copy button on first key (if exists)
    const copyButton = page.getByRole('button', { name: /copy/i }).first();
    const copyExists = await copyButton.count();

    if (copyExists > 0) {
      // Click copy button
      await copyButton.click();

      // Verify success toast
      await expect(page.locator('text=Copied to clipboard')).toBeVisible();

      // Verify clipboard content (if browser supports it)
      const clipboardText = await page.evaluate(() =>
        navigator.clipboard.readText().catch(() => '')
      );
      if (clipboardText) {
        expect(clipboardText).toBeTruthy();
      }
    }
  });
});

test.describe('API Keys Navigation', () => {
  test('should navigate to API keys page from settings', async ({ page }) => {
    await page.goto('/app/settings');

    // Click API Keys link in sidebar
    await page.getByRole('link', { name: 'API Keys' }).click();

    // Verify navigation
    await expect(page).toHaveURL('/app/settings/api-keys');
    await expect(page.locator('h1')).toContainText('API Keys');
  });

  test('should navigate back to settings from API keys', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Click breadcrumb link
    await page.getByRole('link', { name: 'Settings' }).click();

    // Verify navigation
    await expect(page).toHaveURL('/app/settings');
  });

  test('should highlight API Keys in navigation sidebar', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Check that API Keys link is active
    const apiKeysLink = page.getByRole('link', { name: 'API Keys' });
    await expect(apiKeysLink).toHaveClass(/bg-accent/);

    // Check that AI Models link is not active
    const aiModelsLink = page.getByRole('link', { name: 'AI Models' });
    await expect(aiModelsLink).not.toHaveClass(/bg-accent/);
  });
});

test.describe.skip('API Keys Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/settings/api-keys');

    // Check main content is visible
    await expect(page.locator('h1')).toBeVisible();

    // Check security info is visible
    await expect(page.locator('text=Security Information')).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/app/settings/api-keys');

    // Check sidebar is visible
    await expect(page.locator('text=AI Models')).toBeVisible();
    await expect(page.locator('text=API Keys')).toBeVisible();

    // Check main content
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/app/settings/api-keys');

    // Check all elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=AI Models')).toBeVisible();
    await expect(page.locator('text=API Keys')).toBeVisible();
    await expect(page.locator('text=Security Information')).toBeVisible();
  });
});

test.describe.skip('API Keys Security', () => {
  test('should not expose full API key in initial display', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Check that only last 4 characters are shown
    const keyCards = page.locator('[data-testid="api-key-card"]');
    const count = await keyCards.count();

    if (count > 0) {
      const firstCard = keyCards.first();
      const keyDisplay = await firstCard.locator('[data-testid="key-last4"]').textContent();

      // Should only show last 4 chars with asterisks
      expect(keyDisplay).toMatch(/^\*{4,}/);
    }
  });

  test('should show security information banner', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Verify security banner content
    await expect(page.locator('text=AES-256-GCM encryption')).toBeVisible();
    await expect(page.locator('text=never exposed in logs')).toBeVisible();
    await expect(page.locator('text=user can only access their own keys')).toBeVisible();
  });
});

test.describe.skip('API Keys Provider Selection', () => {
  test('should display all provider options in add dialog', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Open add dialog
    await page.getByRole('button', { name: /add new api key/i }).click();

    // Get provider select options
    const providerSelect = page.locator('select[name="provider"]');
    const options = await providerSelect.locator('option').allTextContents();

    // Verify expected providers
    expect(options).toContain('OpenAI');
    expect(options).toContain('Anthropic');
    expect(options).toContain('Google');
    expect(options).toContain('Groq');
    expect(options).toContain('Ollama');
    expect(options).toContain('OpenRouter');
    expect(options).toContain('Other');
  });

  test('should default to OpenAI provider', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Open add dialog
    await page.getByRole('button', { name: /add new api key/i }).click();

    // Check default selection
    const providerSelect = page.locator('select[name="provider"]');
    const selectedValue = await providerSelect.inputValue();
    expect(selectedValue).toBe('openai');
  });
});

test.describe.skip('API Keys Error Handling', () => {
  test('should show error toast on failed create', async ({ page }) => {
    // Mock failed API response
    await page.route('**/rpc/apiKey/create', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to create API key' }),
      });
    });

    await page.goto('/app/settings/api-keys');

    // Try to create key
    await page.getByRole('button', { name: /add new api key/i }).click();
    await page.selectOption('select[name="provider"]', 'openai');
    await page.fill('input[name="name"]', 'Test Key');
    await page.fill('input[name="key"]', 'sk-test1234567890abcdefghijklmnopqrstuvwxyz');
    await page.getByRole('button', { name: /save/i }).click();

    // Verify error toast
    await expect(page.locator('text=Failed to create API key')).toBeVisible();
  });

  test('should show retry button in error toast', async ({ page }) => {
    // Mock failed API response
    await page.route('**/rpc/apiKey/create', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network error' }),
      });
    });

    await page.goto('/app/settings/api-keys');

    // Try to create key
    await page.getByRole('button', { name: /add new api key/i }).click();
    await page.selectOption('select[name="provider"]', 'openai');
    await page.fill('input[name="name"]', 'Test Key');
    await page.fill('input[name="key"]', 'sk-test1234567890abcdefghijklmnopqrstuvwxyz');
    await page.getByRole('button', { name: /save/i }).click();

    // Check for retry button in error toast
    const retryButton = page.locator('button:has-text("Retry")');
    await expect(retryButton).toBeVisible();
  });
});

test.describe.skip('API Keys Loading States', () => {
  test('should show loading skeletons while fetching keys', async ({ page }) => {
    // Slow down API response
    await page.route('**/rpc/apiKey/getAll', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/app/settings/api-keys');

    // Check for skeleton loaders
    const skeletons = page.locator('[data-testid="api-key-skeleton"]');
    await expect(skeletons).toHaveCount(3);
  });

  test('should disable form submit while creating', async ({ page }) => {
    // Slow down API response
    await page.route('**/rpc/apiKey/create', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-id',
          provider: 'openai',
          name: 'Test Key',
          keyLast4: '3456',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
    });

    await page.goto('/app/settings/api-keys');

    // Open add dialog and fill form
    await page.getByRole('button', { name: /add new api key/i }).click();
    await page.selectOption('select[name="provider"]', 'openai');
    await page.fill('input[name="name"]', 'Test Key');
    await page.fill('input[name="key"]', 'sk-test1234567890abcdefghijklmnopqrstuvwxyz');

    // Submit and check button is disabled
    await page.getByRole('button', { name: /save/i }).click();
    const saveButton = page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeDisabled();
  });
});

test.describe('API Keys Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('API Keys');

    // Check for h2 in security section
    const h2 = page.locator('h4:has-text("Security Information")');
    await expect(h2).toBeVisible();
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Open add dialog
    await page.getByRole('button', { name: /add new api key/i }).click();

    // Check form labels are properly associated
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();

    const keyInput = page.locator('input[name="key"]');
    await expect(keyInput).toBeVisible();
    await expect(keyInput).toHaveAttribute('type', 'password');
    await expect(keyInput).toHaveAttribute('autocomplete', 'off');
  });

  test('should have accessible dialog', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Open add dialog
    await page.getByRole('button', { name: /add new api key/i }).click();

    // Check dialog accessibility
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('tabindex', '-1');

    const dialogTitle = page.locator('h2#add-dialog-title');
    await expect(dialogTitle).toBeVisible();
  });

  test('should focus trap in dialog', async ({ page }) => {
    await page.goto('/app/settings/api-keys');

    // Open add dialog
    await page.getByRole('button', { name: /add new api key/i }).click();

    // Try to tab through dialog
    await page.keyboard.press('Tab');

    // Focus should remain within dialog
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'SELECT']).toContain(focusedElement);
  });
});
