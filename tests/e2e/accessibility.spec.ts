/**
 * Accessibility E2E Tests with Playwright and axe-core
 *
 * Purpose: End-to-end accessibility testing using @axe-core/playwright
 *
 * Usage: Run with `bun run test:e2e tests/e2e/accessibility.spec.ts`
 */

import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Helper function to run accessibility audit
async function runAxeAudit(page: Page, context: string = 'page') {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  // Log violations for debugging
  if (accessibilityScanResults.violations.length > 0) {
    console.log(
      `\n🔴 Accessibility violations found in ${context}:`,
      accessibilityScanResults.violations.length
    );

    accessibilityScanResults.violations.forEach((violation) => {
      console.log(`\n❌ ${violation.id}: ${violation.description}`);
      console.log(`   Impact: ${violation.impact}`);
      console.log(`   Help: ${violation.helpUrl}`);
      console.log(`   Nodes affected: ${violation.nodes.length}`);

      // Show first few targets for context
      violation.nodes.slice(0, 3).forEach((node) => {
        console.log(`   - ${node.target.join(', ')}`);
      });

      if (violation.nodes.length > 3) {
        console.log(`   ... and ${violation.nodes.length - 3} more`);
      }
    });
  }

  expect(accessibilityScanResults.violations).toEqual([]);
}

test.describe('Accessibility E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to base URL
    await page.goto('/');
  });

  test('Homepage should have no accessibility violations', async ({ page }) => {
    await runAxeAudit(page, 'homepage');
  });

  test('Navigation should be keyboard accessible', async ({ page }) => {
    // Test tab order through navigation
    await page.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
  });

  test('Main content should have proper landmarks', async ({ page }) => {
    // Check for main landmark
    const main = await page.locator('main').count();
    expect(main).toBeGreaterThan(0);

    // Check for nav landmark
    const nav = await page.locator('nav').count();
    expect(nav).toBeGreaterThan(0);
  });

  test('Headings should have proper hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

    // Check that there's exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Check heading hierarchy (no skipping levels)
    let previousLevel = 0;
    for (const heading of headings) {
      const tag = await heading.evaluate((el) => el.tagName);
      const level = parseInt(tag[1]);

      if (previousLevel > 0) {
        // Heading level should not jump more than 1 level down
        expect(level - previousLevel).toBeLessThanOrEqual(1);
      }

      previousLevel = level;
    }
  });

  test('All interactive elements should be keyboard accessible', async ({ page }) => {
    // Get all interactive elements
    const interactiveElements = await page
      .locator('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      .all();

    // Test each element for keyboard accessibility
    for (const element of interactiveElements.slice(0, 10)) {
      // Click to focus
      await element.click();

      // Check if element is focused
      const isFocused = await element.evaluate((el) => document.activeElement === el);

      if (!isFocused) {
        const tagName = await element.evaluate((el) => el.tagName);
        throw new Error(`Interactive element <${tagName}> cannot receive keyboard focus`);
      }
    }
  });

  test('Links should have descriptive text', async ({ page }) => {
    const links = await page.locator('a[href]').all();

    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');

      const hasDescription = (text && text.trim().length > 0) || ariaLabel || title;

      if (!hasDescription) {
        const href = await link.getAttribute('href');
        console.warn(`Link with href="${href}" has no descriptive text`);
      }

      // Allow some exceptions (like icon-only links with aria-label)
      if (!hasDescription && !ariaLabel) {
        throw new Error('Link without descriptive text found');
      }
    }
  });

  test('Images should have alt text', async ({ page }) => {
    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      // Decorative images should have empty alt or role="presentation"
      if (role === 'presentation' || alt === '') {
        continue;
      }

      // All other images should have alt text
      if (alt === null) {
        const src = await img.getAttribute('src');
        throw new Error(`Image without alt text: ${src}`);
      }
    }
  });

  test('Form inputs should have labels', async ({ page }) => {
    const inputs = await page.locator('input, select, textarea').all();

    for (const input of inputs) {
      const type = await input.getAttribute('type');

      // Skip hidden and submit inputs
      if (type === 'hidden' || type === 'submit') {
        continue;
      }

      // Check for explicit label
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      let hasLabel = false;

      if (ariaLabel || ariaLabelledBy) {
        hasLabel = true;
      } else if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        hasLabel = label > 0;
      } else {
        // Check if input is wrapped in a label
        const parentLabel = await input.locator('..').locator('label').count();
        hasLabel = parentLabel > 0;
      }

      if (!hasLabel) {
        throw new Error('Form input without associated label found');
      }
    }
  });

  test('Color contrast should meet WCAG AA standards', async ({ page }) => {
    // Note: This test requires visual regression testing or manual verification
    // axe-core will catch some color contrast issues automatically
    await runAxeAudit(page, 'color contrast check');
  });

  test('Focus indicators should be visible', async ({ page }) => {
    // Test that focus indicators are present and visible
    const firstButton = page.locator('button, a[href]').first();
    if ((await firstButton.count()) > 0) {
      await firstButton.focus();

      // Check if focused element has outline or other focus indicator
      const hasFocusIndicator = await firstButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return (
          styles.outline !== 'none' ||
          styles.boxShadow !== 'none' ||
          styles.borderBottomStyle !== 'none' ||
          el.hasAttribute('data-focus')
        );
      });

      expect(hasFocusIndicator).toBe(true);
    }
  });

  test('Modal dialogs should trap focus', async ({ page }) => {
    // This test assumes there's a way to open a modal
    // Adjust selector based on your application

    // Example: Open settings modal if it exists
    const settingsButton = page.locator(
      'button[aria-label*="settings"], button:has-text("Settings")'
    );

    if ((await settingsButton.count()) > 0) {
      await settingsButton.first().click();

      // Wait for modal to appear
      await page.waitForTimeout(500);

      // Check that focus is trapped in modal
      const modal = page.locator('[role="dialog"], .modal, [data-modal]');

      if ((await modal.count()) > 0) {
        // Press Tab multiple times and check focus stays in modal
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
        }

        // Check that focus is still within modal
        const activeElement = await page.evaluate(() => document.activeElement);
        const isInModal = await modal.evaluate((el: HTMLElement) =>
          el.contains(document.activeElement)
        );

        expect(isInModal).toBe(true);

        // Close modal with Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
  });

  test('ARIA live regions should announce changes', async ({ page }) => {
    // Test that dynamic content updates are announced
    // This is a placeholder - adjust based on your app's live regions

    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all();

    console.log(`Found ${liveRegions.length} ARIA live regions`);

    // Verify live regions exist where expected (e.g., chat messages, toasts)
    // and that they have appropriate aria-live values
    for (const region of liveRegions) {
      const ariaLive = await region.getAttribute('aria-live');
      const role = await region.getAttribute('role');

      expect(['polite', 'assertive', 'status', 'alert']).toContain(ariaLive || role);
    }
  });
});
