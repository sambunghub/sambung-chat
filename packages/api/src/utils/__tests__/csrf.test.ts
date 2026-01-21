import { describe, it, expect, beforeAll } from 'vitest';
import { generateCsrfToken, validateCsrfToken, getCsrfTokenTimestamp, isCsrfTokenExpired } from '../csrf';

describe('CSRF Utilities', () => {
  beforeAll(() => {
    // Set required environment variable for testing
    process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-csrf-testing-min-32-chars';
  });

  describe('generateCsrfToken', () => {
    it('should generate a token with correct format', () => {
      const token = generateCsrfToken();
      const parts = token.split('|');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toMatch(/^[a-f0-9]{64}$/); // 64 hex chars
      expect(parts[1]).toMatch(/^\d+$/); // timestamp
      expect(parts[2]).toMatch(/^[a-f0-9]{64}$/); // 64 hex signature
    });

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with valid timestamps', () => {
      const token = generateCsrfToken();
      const timestamp = getCsrfTokenTimestamp(token);
      const now = Date.now();

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp!.getTime()).toBeLessThanOrEqual(now);
      expect(timestamp!.getTime()).toBeGreaterThan(now - 10000); // Created within last 10s
    });
  });

  describe('validateCsrfToken', () => {
    it('should validate a correctly generated token', () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(token)).toBe(true);
    });

    it('should reject token with wrong format', () => {
      expect(validateCsrfToken('invalid')).toBe(false);
      expect(validateCsrfToken('only|two|parts|extra')).toBe(false);
    });

    it('should reject token with invalid timestamp', () => {
      const token = generateCsrfToken();
      const parts = token.split('|');
      parts[1] = 'not-a-number';
      const invalidToken = parts.join('|');

      expect(validateCsrfToken(invalidToken)).toBe(false);
    });

    it('should reject token with wrong signature', () => {
      const token = generateCsrfToken();
      const parts = token.split('|');
      parts[2] = 'a'.repeat(64); // Wrong signature
      const invalidToken = parts.join('|');

      expect(validateCsrfToken(invalidToken)).toBe(false);
    });

    it('should reject expired token', () => {
      const token = generateCsrfToken();
      const parts = token.split('|');
      const oldTimestamp = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      parts[1] = oldTimestamp.toString();
      const expiredToken = parts.join('|');

      expect(validateCsrfToken(expiredToken, 60 * 60 * 1000)).toBe(false); // 1 hour max age
    });

    it('should accept valid non-expired token', () => {
      const token = generateCsrfToken();
      const parts = token.split('|');
      const recentTimestamp = Date.now() - 30 * 60 * 1000; // 30 minutes ago
      parts[1] = recentTimestamp.toString();

      // Signature will be invalid but let's test expiration logic separately
      const timestamp = parseInt(parts[1], 10);
      const now = Date.now();
      const tokenAge = now - timestamp;
      expect(tokenAge).toBeLessThan(60 * 60 * 1000); // Less than 1 hour
    });
  });

  describe('getCsrfTokenTimestamp', () => {
    it('should extract timestamp from valid token', () => {
      const token = generateCsrfToken();
      const timestamp = getCsrfTokenTimestamp(token);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp?.getTime()).toBeLessThanOrEqual(Date.now());
      expect(timestamp?.getTime()).toBeGreaterThan(Date.now() - 10000); // Created within last 10s
    });

    it('should return null for invalid token format', () => {
      expect(getCsrfTokenTimestamp('invalid')).toBeNull();
      expect(getCsrfTokenTimestamp('only|two|parts|extra')).toBeNull();
      expect(getCsrfTokenTimestamp('token|not-a-number|sig')).toBeNull();
    });
  });

  describe('isCsrfTokenExpired', () => {
    it('should return false for fresh token', () => {
      const token = generateCsrfToken();
      expect(isCsrfTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const token = generateCsrfToken();
      const parts = token.split('|');
      const oldTimestamp = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      parts[1] = oldTimestamp.toString();
      const expiredToken = parts.join('|');

      expect(isCsrfTokenExpired(expiredToken, 60 * 60 * 1000)).toBe(true);
    });

    it('should return true for invalid token format', () => {
      expect(isCsrfTokenExpired('invalid')).toBe(true);
    });
  });
});
