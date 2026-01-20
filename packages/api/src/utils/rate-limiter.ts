/**
 * Simple in-memory rate limiter to prevent abuse
 *
 * Tracks requests by key (IP address, user ID, etc.) and enforces
 * a maximum number of requests within a time window.
 *
 * @example
 * ```ts
 * const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });
 * if (!limiter.checkLimit('user-123')) {
 *   throw new Error('Rate limit exceeded');
 * }
 * ```
 */
export class RateLimiter {
  private requests: Map<string, number[]>;
  private maxRequests: number;
  private windowMs: number;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor(options: { maxRequests: number; windowMs: number }) {
    this.requests = new Map();
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.cleanupInterval = null;

    // Clean up old entries every 5 minutes to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if the request is within rate limits
   *
   * @param key Unique identifier for the requester (IP, user ID, etc.)
   * @returns true if request is allowed, false if rate limit exceeded
   */
  checkLimit(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing timestamps for this key
    let timestamps = this.requests.get(key) || [];

    // Filter out timestamps outside the current window
    timestamps = timestamps.filter((timestamp) => timestamp > windowStart);

    // Check if limit is exceeded
    if (timestamps.length >= this.maxRequests) {
      return false;
    }

    // Add current request timestamp
    timestamps.push(now);
    this.requests.set(key, timestamps);

    return true;
  }

  /**
   * Get the number of remaining requests for a key
   *
   * @param key Unique identifier for the requester
   * @returns Number of remaining requests, or 0 if limit is exceeded
   */
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter((timestamp) => timestamp > windowStart);

    return Math.max(0, this.maxRequests - validTimestamps.length);
  }

  /**
   * Reset the rate limit for a specific key
   *
   * @param key Unique identifier for the requester
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter((timestamp) => timestamp > windowStart);

      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }

  /**
   * Clean up and stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.requests.clear();
  }
}

/**
 * Rate limiter instance for CSRF token endpoint
 *
 * Limits: 10 requests per minute per IP address
 */
export const csrfRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
});
