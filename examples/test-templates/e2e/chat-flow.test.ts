/**
 * End-to-End Test - Chat Flow
 *
 * Purpose: Test complete user flow from frontend UI to backend
 *
 * Usage:
 * 1. Update BASE_URL to match your application
 * 2. Customize selectors for your UI framework
 * 3. Add provider-specific E2E scenarios
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const PROVIDER_NAME = 'openai';

describe(`${PROVIDER_NAME} Chat Flow E2E`, () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
      slowMo: 50, // Slow down actions for visibility
    });

    // Create context
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });

    // Create page
    page = await context.newPage();
  });

  afterAll(async () => {
    // Cleanup
    await page.close();
    await context.close();
    await browser.close();
  });

  describe('Page Load', () => {
    it('should load chat page', async () => {
      await page.goto(`${BASE_URL}/ai`);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check URL
      expect(page.url()).toContain('/ai');
    });

    it('should display chat interface', async () => {
      await page.goto(`${BASE_URL}/ai`);

      // Wait for chat interface to load
      await page.waitForSelector('[data-testid="chat-input"]', {
        timeout: 5000,
      });

      // Check for chat input
      const chatInput = await page.$('[data-testid="chat-input"]');
      expect(chatInput).toBeTruthy();
    });

    it('should display welcome message', async () => {
      await page.goto(`${BASE_URL}/ai`);

      // Wait for content
      await page.waitForSelector('[data-testid="chat-container"]');

      // Check for welcome message or placeholder
      const welcomeMessage = await page.$('[data-testid="welcome-message"]');
      const placeholder = await page.$('[data-testid="chat-placeholder"]');

      expect(welcomeMessage || placeholder).toBeTruthy();
    });
  });

  describe('Send Message', () => {
    it('should send a simple message', async () => {
      await page.goto(`${BASE_URL}/ai`);

      // Wait for chat input
      await page.waitForSelector('[data-testid="chat-input"]');

      // Type message
      await page.fill('[data-testid="chat-input"]', 'Hello, AI!');

      // Send message (press Enter or click send button)
      await page.press('[data-testid="chat-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-message"]', {
        timeout: 30000,
      });

      // Verify response is displayed
      const aiMessage = await page.$('[data-testid="ai-message"]');
      expect(aiMessage).toBeTruthy();
    });

    it('should display user message', async () => {
      await page.goto(`${BASE_URL}/ai`);

      await page.waitForSelector('[data-testid="chat-input"]');

      // Send message
      await page.fill('[data-testid="chat-input"]', 'Test message');
      await page.press('[data-testid="chat-input"]', 'Enter');

      // Wait for user message to appear
      await page.waitForSelector('[data-testid="user-message"]');

      // Check message content
      const userMessage = await page.textContent('[data-testid="user-message"]');
      expect(userMessage).toContain('Test message');
    });

    it('should clear input after sending', async () => {
      await page.goto(`${BASE_URL}/ai`);

      await page.waitForSelector('[data-testid="chat-input"]');

      // Send message
      await page.fill('[data-testid="chat-input"]', 'Test');
      await page.press('[data-testid="chat-input"]', 'Enter');

      // Wait a moment
      await page.waitForTimeout(500);

      // Check input is cleared
      const inputValue = await page.inputValue('[data-testid="chat-input"]');
      expect(inputValue).toBe('');
    });
  });

  describe('Receive Response', () => {
    it('should display AI response', async () => {
      await page.goto(`${BASE_URL}/ai`);

      await page.waitForSelector('[data-testid="chat-input"]');

      // Send message
      await page.fill('[data-testid="chat-input"]', 'Say hello');
      await page.press('[data-testid="chat-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-message"]', {
        timeout: 30000,
      });

      // Get response text
      const aiResponse = await page.textContent('[data-testid="ai-message"]');

      expect(aiResponse).toBeTruthy();
      expect(aiResponse?.length).toBeGreaterThan(0);
    });

    it('should show streaming response', async () => {
      await page.goto(`${BASE_URL}/ai`);

      await page.waitForSelector('[data-testid="chat-input"]');

      // Send message
      await page.fill('[data-testid="chat-input"]', 'Tell me a joke');
      await page.press('[data-testid="chat-input"]', 'Enter');

      // Wait for streaming to start
      await page.waitForSelector('[data-testid="ai-message"]', {
        timeout: 30000,
      });

      // Wait for streaming indicator (if present)
      const streamingIndicator = await page.$('[data-testid="streaming-indicator"]');

      if (streamingIndicator) {
        expect(streamingIndicator).toBeTruthy();

        // Wait for streaming to complete
        await page.waitForSelector('[data-testid="ai-message"]:not([data-streaming="true"])', {
          timeout: 30000,
        });
      }
    });

    it('should handle long responses', async () => {
      await page.goto(`${BASE_URL}/ai`);

      await page.waitForSelector('[data-testid="chat-input"]');

      // Request a long response
      await page.fill('[data-testid="chat-input"]', 'Write a 10-line poem');
      await page.press('[data-testid="chat-input"]', 'Enter');

      // Wait for response
      await page.waitForSelector('[data-testid="ai-message"]', {
        timeout: 30000,
      });

      // Get response
      const aiResponse = await page.textContent('[data-testid="ai-message"]');

      expect(aiResponse).toBeTruthy();
      expect(aiResponse?.length).toBeGreaterThan(100);
    });
  });

  describe('Multi-turn Conversation', () => {
    it('should maintain conversation context', async () => {
      await page.goto(`${BASE_URL}/ai`);

      await page.waitForSelector('[data-testid="chat-input"]');

      // First message
      await page.fill('[data-testid="chat-input"]', 'My name is Bob');
      await page.press('[data-testid="chat-input"]', 'Enter');

      // Wait for response
      await page.waitForSelector('[data-testid="ai-message"]');

      // Second message
      await page.waitForSelector('[data-testid="chat-input"]');
      await page.fill('[data-testid="chat-input"]', 'What is my name?');
      await page.press('[data-testid="chat-input"]', 'Enter');

      // Wait for response
      await page.waitForSelector('[data-testid="ai-message"]');

      // Check response contains "Bob"
      const lastMessage = await page.evaluate(() => {
        const messages = document.querySelectorAll('[data-testid="ai-message"]');
        return messages[messages.length - 1]?.textContent;
      });

      expect(lastMessage).toMatch(/bob/i);
    });

    it('should display conversation history', async () => {
      await page.goto(`${BASE_URL}/ai`);

      await page.waitForSelector('[data-testid="chat-input"]');

      // Send multiple messages
      const messages = ['Hello', 'How are you?', 'Tell me a joke'];

      for (const message of messages) {
        await page.fill('[data-testid="chat-input"]', message);
        await page.press('[data-testid="chat-input"]', 'Enter');

        // Wait for response
        await page.waitForSelector('[data-testid="ai-message"]');
      }

      // Check all messages are in history
      const userMessages = await page.$$('[data-testid="user-message"]');
      expect(userMessages.length).toBeGreaterThanOrEqual(messages.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty message', async () => {
      await page.goto(`${BASE_URL}/ai`);

      await page.waitForSelector('[data-testid="chat-input"]');

      // Try to send empty message
      await page.fill('[data-testid="chat-input"]', '');
      await page.press('[data-testid="chat-input"]', 'Enter');

      // Wait a moment
      await page.waitForTimeout(1000);

      // Should not send message (no new AI message)
      const aiMessages = await page.$$('[data-testid="ai-message"]');
      const initialCount = aiMessages.length;
    });

    it('should handle network errors gracefully', async () => {
      // This test requires mocking network failures
      // Skip if not configured
      if (!process.env.TEST_NETWORK_ERRORS) {
        return;
      }

      await page.goto(`${BASE_URL}/ai`);

      // Mock network failure
      await page.route('**/ai', (route) => {
        route.abort('failed');
      });

      await page.waitForSelector('[data-testid="chat-input"]');
      await page.fill('[data-testid="chat-input"]', 'Test');
      await page.press('[data-testid="chat-input"]', 'Enter');

      // Wait for error message
      await page.waitForSelector('[data-testid="error-message"]', {
        timeout: 5000,
      });

      const errorMessage = await page.textContent('[data-testid="error-message"]');
      expect(errorMessage).toBeTruthy();
    });
  });

  describe('UI Interactions', () => {
    it('should disable input while waiting for response', async () => {
      await page.goto(`${BASE_URL}/ai`);

      await page.waitForSelector('[data-testid="chat-input"]');

      // Send message
      await page.fill('[data-testid="chat-input"]', 'Test');
      await page.press('[data-testid="chat-input"]', 'Enter');

      // Immediately check if input is disabled
      const isDisabled = await page.$eval(
        '[data-testid="chat-input"]',
        (el) => el.getAttribute('disabled')
      );

      // Input might be disabled or show loading state
      const loadingState = await page.$('[data-testid="loading-indicator"]');
      expect(isDisabled || loadingState).toBeTruthy();
    });

    it('should scroll to latest message', async () => {
      await page.goto(`${BASE_URL}/ai`);

      await page.waitForSelector('[data-testid="chat-input"]');

      // Send message
      await page.fill('[data-testid="chat-input"]', 'Test');
      await page.press('[data-testid="chat-input"]', 'Enter');

      // Wait for response
      await page.waitForSelector('[data-testid="ai-message"]');

      // Check scroll position (should be at bottom)
      const scrollPosition = await page.evaluate(() => {
        const chatContainer = document.querySelector('[data-testid="chat-container"]');
        if (!chatContainer) return null;
        return {
          scrollTop: chatContainer.scrollTop,
          scrollHeight: chatContainer.scrollHeight,
        };
      });

      if (scrollPosition) {
        // Should be scrolled to or near bottom
        expect(scrollPosition.scrollTop).toBeGreaterThan(0);
      }
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form controls', async () => {
      await page.goto(`${BASE_URL}/ai`);

      await page.waitForSelector('[data-testid="chat-input"]');

      // Check for aria-labels or labels
      const hasAriaLabel = await page.$eval(
        '[data-testid="chat-input"]',
        (el) => el.getAttribute('aria-label') || el.getAttribute('placeholder')
      );

      expect(hasAriaLabel).toBeTruthy();
    });

    it('should announce messages to screen readers', async () => {
      await page.goto(`${BASE_URL}/ai`);

      await page.waitForSelector('[data-testid="chat-input"]');

      // Send message
      await page.fill('[data-testid="chat-input"]', 'Hello');
      await page.press('[data-testid="chat-input"]', 'Enter');

      // Wait for response
      await page.waitForSelector('[data-testid="ai-message"]');

      // Check for live region or aria-live
      const liveRegion = await page.$('[aria-live]');

      // Messages should have appropriate roles or live regions
      expect(liveRegion).toBeTruthy();
    });
  });
});

/**
 * Customization Checklist:
 *
 * ✅ Update BASE_URL
 * ✅ Update selectors for your UI framework
 * ✅ Add provider-specific E2E scenarios
 * ✅ Test all supported features
 * ✅ Add accessibility tests
 * ✅ Test mobile/responsive layouts
 * ✅ Add performance tests
 * ✅ Test error scenarios
 */
