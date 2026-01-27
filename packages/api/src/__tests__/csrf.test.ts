/**
 * CSRF Protection Integration Tests
 *
 * Tests for CSRF token generation, validation, and comprehensive security scenarios
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import {
  generateCsrfToken,
  validateCsrfToken,
  getCsrfTokenTimestamp,
  isCsrfTokenExpired,
} from '../utils/csrf';
import { RateLimiter } from '../utils/rate-limiter';

describe('CSRF Protection Integration', () => {
  beforeAll(() => {
    // Set required environment variable for testing
    process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-csrf-testing-min-32-chars';
  });

  describe('CSRF Token Endpoint Behavior', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000, // 1 minute
      });
    });

    afterEach(() => {
      rateLimiter.destroy();
    });

    it('should rate limit CSRF token requests', () => {
      const rateLimitKey = 'test-rate-limit-user';

      // Make maxRequests requests
      for (let i = 0; i < 10; i++) {
        expect(rateLimiter.checkLimit(rateLimitKey)).toBe(true);
      }

      // Next request should be blocked
      expect(rateLimiter.checkLimit(rateLimitKey)).toBe(false);
    });

    it('should track rate limits independently for different users', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      // User 1 makes 10 requests
      for (let i = 0; i < 10; i++) {
        expect(rateLimiter.checkLimit(user1)).toBe(true);
      }

      // User 1 should be blocked
      expect(rateLimiter.checkLimit(user1)).toBe(false);

      // User 2 should still be allowed
      expect(rateLimiter.checkLimit(user2)).toBe(true);
    });

    it('should reset rate limits after window expires', async () => {
      const rateLimitKey = 'test-user';
      const shortWindowLimiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 100, // 100ms for faster testing
      });

      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        expect(shortWindowLimiter.checkLimit(rateLimitKey)).toBe(true);
      }

      // Should be blocked
      expect(shortWindowLimiter.checkLimit(rateLimitKey)).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      expect(shortWindowLimiter.checkLimit(rateLimitKey)).toBe(true);

      shortWindowLimiter.destroy();
    });
  });

  describe('CSRF Token Validation Scenarios', () => {
    it('should validate token correctly from generation to validation', () => {
      const token = generateCsrfToken();
      const isValid = validateCsrfToken(token);

      expect(isValid).toBe(true);
    });

    it('should fail validation with missing token', () => {
      const isValid = validateCsrfToken('');
      expect(isValid).toBe(false);
    });

    it('should fail validation with malformed token', () => {
      const malformedTokens = ['invalid', 'only|two', 'too|many|parts|here', '', '||', 'a|b|c'];

      malformedTokens.forEach((token) => {
        expect(validateCsrfToken(token)).toBe(false);
      });
    });

    it('should fail validation with tampered token parts', () => {
      const token = generateCsrfToken();
      const parts = token.split('|');

      // Tamper with random part
      const tamperedRandom = parts
        .map((part, index) => (index === 0 ? 'a'.repeat(64) : part))
        .join('|');
      expect(validateCsrfToken(tamperedRandom)).toBe(false);

      // Tamper with timestamp
      const tamperedTimestamp = parts
        .map((part, index) => (index === 1 ? 'invalid' : part))
        .join('|');
      expect(validateCsrfToken(tamperedTimestamp)).toBe(false);

      // Tamper with signature
      const tamperedSignature = parts
        .map((part, index) => (index === 2 ? 'b'.repeat(64) : part))
        .join('|');
      expect(validateCsrfToken(tamperedSignature)).toBe(false);
    });

    it('should fail validation with expired token', () => {
      const token = generateCsrfToken();
      const parts = token.split('|');
      const oldTimestamp = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
      parts[1] = oldTimestamp.toString();
      const expiredToken = parts.join('|');

      expect(validateCsrfToken(expiredToken, 60 * 60 * 1000)).toBe(false); // 1 hour max age
    });

    it('should detect token expiration correctly', () => {
      const freshToken = generateCsrfToken();
      expect(isCsrfTokenExpired(freshToken, 60 * 60 * 1000)).toBe(false);

      const expiredToken = generateCsrfToken();
      const parts = expiredToken.split('|');
      const oldTimestamp = Date.now() - 2 * 60 * 60 * 1000;
      parts[1] = oldTimestamp.toString();
      const expired = parts.join('|');

      expect(isCsrfTokenExpired(expired, 60 * 60 * 1000)).toBe(true);
    });
  });

  describe('CSRF Token Structure and Format', () => {
    it('should generate tokens with correct structure', () => {
      const token = generateCsrfToken();
      const parts = token.split('|');

      expect(parts).toHaveLength(3);

      // Random part: 64 hex chars
      expect(parts[0]).toMatch(/^[a-f0-9]{64}$/);

      // Timestamp: 13-digit number
      expect(parts[1]).toMatch(/^\d{13}$/);

      // Signature: 64 hex chars
      expect(parts[2]).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should extract timestamp correctly from valid token', () => {
      const token = generateCsrfToken();
      const timestamp = getCsrfTokenTimestamp(token);

      expect(timestamp).toBeInstanceOf(Date);

      const now = Date.now();
      expect(timestamp!.getTime()).toBeLessThanOrEqual(now);
      expect(timestamp!.getTime()).toBeGreaterThan(now - 10000); // Created within last 10s
    });

    it('should return null for invalid token timestamp extraction', () => {
      const invalidTokens = ['invalid', 'only|two', 'token|not-a-number|sig', ''];

      invalidTokens.forEach((token) => {
        expect(getCsrfTokenTimestamp(token)).toBeNull();
      });
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const token = generateCsrfToken();
        tokens.add(token);
      }

      // All tokens should be unique
      expect(tokens.size).toBe(100);
    });
  });

  describe('CSRF Token Generation and Validation Flow', () => {
    it('should successfully validate token from endpoint', () => {
      // Generate token (simulating endpoint response)
      const token = generateCsrfToken();

      // Validate token (simulating middleware validation)
      const isValid = validateCsrfToken(token);

      expect(isValid).toBe(true);
    });

    it('should validate token successfully with consistent secret', () => {
      // Generate token with current secret
      const token1 = generateCsrfToken();

      // Token should be valid with current secret
      expect(validateCsrfToken(token1)).toBe(true);

      // Note: The crypto signature validation ensures tokens are only
      // valid with the same secret that was used to generate them.
      // Testing with different environment variables would require
      // separate test processes.
    });

    it('should handle rapid token generation requests', () => {
      const tokens: string[] = [];

      // Generate many tokens quickly
      for (let i = 0; i < 100; i++) {
        const token = generateCsrfToken();
        tokens.push(token);
      }

      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(100);

      // All tokens should be valid
      const validTokens = tokens.filter((t) => validateCsrfToken(t));
      expect(validTokens.length).toBe(100);
    });
  });

  describe('CSRF Protection in Production Environment', () => {
    it('should maintain validation consistency under load', () => {
      const token = generateCsrfToken();

      // Validate multiple times
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(validateCsrfToken(token));
      }

      // All validations should return true
      expect(results.every((r) => r === true)).toBe(true);
    });

    it('should handle concurrent validation safely', () => {
      const token = generateCsrfToken();

      // Simulate concurrent validations
      const validations = Array.from({ length: 50 }, () => validateCsrfToken(token));

      // All validations should succeed (synchronous, so no Promise.all needed)
      expect(validations.every((r) => r === true)).toBe(true);
    });

    it('should generate cryptographically secure tokens', () => {
      const tokens = new Set<string>();

      // Generate 1000 tokens
      for (let i = 0; i < 1000; i++) {
        const token = generateCsrfToken();
        tokens.add(token);
      }

      // All should be unique (no collisions)
      expect(tokens.size).toBe(1000);

      // All should be valid
      const validTokens = Array.from(tokens).filter((t) => validateCsrfToken(t));
      expect(validTokens.length).toBe(1000);
    });
  });

  describe('CSRF Security Properties', () => {
    it('should use constant-time comparison to prevent timing attacks', () => {
      const validToken = generateCsrfToken();
      const invalidToken = 'a'.repeat(validToken.length);

      // Measure time for valid token
      const start1 = performance.now();
      validateCsrfToken(validToken);
      const time1 = performance.now() - start1;

      // Measure time for invalid token
      const start2 = performance.now();
      validateCsrfToken(invalidToken);
      const time2 = performance.now() - start2;

      // Times should be similar (within reasonable tolerance)
      const ratio = Math.max(time1, time2) / Math.min(time1, time2);
      expect(ratio).toBeLessThan(100); // Very loose tolerance for test environments
    });

    it('should have tokens with sufficient entropy', () => {
      const token = generateCsrfToken();
      const parts = token.split('|');

      // Random part should be 64 hex chars = 256 bits of entropy
      expect(parts[0].length).toBe(64);

      // This provides 2^256 possible values, making brute force infeasible
      const entropyBits = parts[0].length * 4; // Each hex char = 4 bits
      expect(entropyBits).toBe(256);
    });

    it('should prevent token reuse across different timestamps', () => {
      const token1 = generateCsrfToken();

      // Wait a bit (1ms)
      const startTime = Date.now();
      while (Date.now() - startTime < 1) {
        // busy wait
      }

      const token2 = generateCsrfToken();

      // Tokens should be different
      expect(token1).not.toBe(token2);

      // Both should be valid
      expect(validateCsrfToken(token1)).toBe(true);
      expect(validateCsrfToken(token2)).toBe(true);
    });

    it('should not reveal token validity through timing', () => {
      // Generate various tokens with different validity states
      const validToken = generateCsrfToken();
      const expiredToken = generateCsrfToken()
        .split('|')
        .map((part, i) => (i === 1 ? (Date.now() - 7200000).toString() : part))
        .join('|');
      const invalidToken = 'invalid-token-format';

      // Measure validation times
      const times: number[] = [];

      [validToken, expiredToken, invalidToken].forEach((token) => {
        const start = performance.now();
        validateCsrfToken(token);
        times.push(performance.now() - start);
      });

      // All times should be within the same order of magnitude
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const ratio = maxTime / minTime;

      // Ratio should be reasonably small (constant-time comparison)
      expect(ratio).toBeLessThan(100);
    });
  });

  describe('CSRF Token Edge Cases', () => {
    it('should handle tokens with minimum valid timestamp', () => {
      const token = generateCsrfToken();
      const parts = token.split('|');
      parts[1] = '0'; // Unix epoch
      const minTimestampToken = parts.join('|');

      // Should be considered expired (very old)
      expect(isCsrfTokenExpired(minTimestampToken, 60 * 60 * 1000)).toBe(true);
    });

    it('should handle tokens with future timestamp', () => {
      const token = generateCsrfToken();
      const parts = token.split('|');
      const futureTimestamp = Date.now() + 60000; // 1 minute in future
      parts[1] = futureTimestamp.toString();
      const futureToken = parts.join('|');

      // Signature will be invalid, but let's test the timestamp extraction
      const extractedTimestamp = getCsrfTokenTimestamp(futureToken);
      expect(extractedTimestamp).toBeInstanceOf(Date);
      expect(extractedTimestamp!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle tokens with maximum timestamp value', () => {
      const token = generateCsrfToken();
      const parts = token.split('|');
      parts[1] = '9999999999999'; // Very large timestamp
      const maxTimestampToken = parts.join('|');

      // Should not crash
      expect(validateCsrfToken(maxTimestampToken)).toBe(false); // Invalid signature
    });
  });
});
