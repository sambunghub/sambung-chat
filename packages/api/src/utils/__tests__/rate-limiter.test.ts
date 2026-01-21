import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '../rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000, // 1 second for faster tests
    });
  });

  afterEach(() => {
    rateLimiter.destroy();
  });

  describe('checkLimit', () => {
    it('should allow requests within the limit', () => {
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.checkLimit('user-1')).toBe(true);
      }
    });

    it('should block requests exceeding the limit', () => {
      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit('user-1');
      }

      // 6th request should be blocked
      expect(rateLimiter.checkLimit('user-1')).toBe(false);
    });

    it('should track limits independently for different keys', () => {
      // User 1 makes 5 requests
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.checkLimit('user-1')).toBe(true);
      }

      // User 1 should be blocked
      expect(rateLimiter.checkLimit('user-1')).toBe(false);

      // User 2 should still be allowed
      expect(rateLimiter.checkLimit('user-2')).toBe(true);
    });

    it('should reset after window expires', async () => {
      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit('user-1');
      }

      // Should be blocked
      expect(rateLimiter.checkLimit('user-1')).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should be allowed again
      expect(rateLimiter.checkLimit('user-1')).toBe(true);
    });
  });

  describe('getRemainingRequests', () => {
    it('should return remaining requests count', () => {
      expect(rateLimiter.getRemainingRequests('user-1')).toBe(5);

      rateLimiter.checkLimit('user-1');
      expect(rateLimiter.getRemainingRequests('user-1')).toBe(4);

      rateLimiter.checkLimit('user-1');
      expect(rateLimiter.getRemainingRequests('user-1')).toBe(3);
    });

    it('should return 0 when limit is exceeded', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit('user-1');
      }

      expect(rateLimiter.getRemainingRequests('user-1')).toBe(0);
    });

    it('should return max requests for new keys', () => {
      expect(rateLimiter.getRemainingRequests('new-user')).toBe(5);
    });
  });

  describe('reset', () => {
    it('should reset the rate limit for a specific key', () => {
      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit('user-1');
      }

      expect(rateLimiter.checkLimit('user-1')).toBe(false);

      // Reset
      rateLimiter.reset('user-1');

      // Should be allowed again
      expect(rateLimiter.checkLimit('user-1')).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should remove old entries automatically', async () => {
      // Make requests for user-1
      rateLimiter.checkLimit('user-1');

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Trigger cleanup by making a request for a different user
      rateLimiter.checkLimit('user-2');

      // user-1 should have their count reset (expired)
      expect(rateLimiter.getRemainingRequests('user-1')).toBe(5);
    });
  });
});
