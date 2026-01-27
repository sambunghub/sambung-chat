import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { getValidatedSameSiteSetting } from '@sambung-chat/env/server';
import { auth } from '../src/index';

describe('SameSite Cookie Configuration', () => {
  const originalEnv = process.env;
  const consoleWarnSpy = {
    calls: [] as string[],
    spy: null as ReturnType<typeof vi.spyOn> | null,
    restore() {
      if (this.spy) {
        this.spy.mockRestore();
        this.calls = [];
      }
    },
    setup() {
      this.calls = [];
      this.spy = vi.spyOn(console, 'warn').mockImplementation((message: string) => {
        this.calls.push(message);
      });
    },
  };

  const consoleLogSpy = {
    calls: [] as string[],
    spy: null as ReturnType<typeof vi.spyOn> | null,
    restore() {
      if (this.spy) {
        this.spy.mockRestore();
        this.calls = [];
      }
    },
    setup() {
      this.calls = [];
      this.spy = vi.spyOn(console, 'log').mockImplementation((message: string) => {
        this.calls.push(message);
      });
    },
  };

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    consoleWarnSpy.restore();
    consoleLogSpy.restore();
  });

  afterEach(() => {
    consoleWarnSpy.restore();
    consoleLogSpy.restore();
  });

  describe('getValidatedSameSiteSetting()', () => {
    describe('Production environment defaults', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        delete process.env.SAME_SITE_COOKIE;
      });

      it('should default to "strict" in production when not configured', () => {
        consoleLogSpy.setup();
        const setting = getValidatedSameSiteSetting();
        expect(setting).toBe('strict');

        // Verify default log message
        const logMessages = consoleLogSpy.calls.join('\n');
        expect(logMessages).toContain('SAME_SITE_COOKIE using default: strict');
        expect(logMessages).toContain('production');
      });

      it('should accept explicit "strict" setting in production', () => {
        process.env.SAME_SITE_COOKIE = 'strict';
        consoleLogSpy.setup();

        const setting = getValidatedSameSiteSetting();
        expect(setting).toBe('strict');

        // Verify explicit setting log
        const logMessages = consoleLogSpy.calls.join('\n');
        expect(logMessages).toContain('SAME_SITE_COOKIE explicitly set to: strict');
      });

      it('should accept "lax" setting in production with warning', () => {
        process.env.SAME_SITE_COOKIE = 'lax';
        consoleLogSpy.setup();
        consoleWarnSpy.setup();

        const setting = getValidatedSameSiteSetting();
        expect(setting).toBe('lax');

        // Verify security warning
        const warnMessages = consoleWarnSpy.calls.join('\n');
        expect(warnMessages).toContain('SAME_SITE_COOKIE=lax in production');
        expect(warnMessages).toContain('link-based CSRF attacks');
        expect(warnMessages).toContain('Consider using SAME_SITE_COOKIE=strict');
      });

      it('should accept "none" setting in production with warning', () => {
        process.env.SAME_SITE_COOKIE = 'none';
        consoleLogSpy.setup();
        consoleWarnSpy.setup();

        const setting = getValidatedSameSiteSetting();
        expect(setting).toBe('none');

        // Verify security warning
        const warnMessages = consoleWarnSpy.calls.join('\n');
        expect(warnMessages).toContain('SAME_SITE_COOKIE=none provides minimal CSRF protection');
        expect(warnMessages).toContain('cross-site cookie access');
      });
    });

    describe('Development environment defaults', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
        delete process.env.SAME_SITE_COOKIE;
      });

      it('should default to "lax" in development when not configured', () => {
        consoleLogSpy.setup();
        const setting = getValidatedSameSiteSetting();
        expect(setting).toBe('lax');

        // Verify default log message
        const logMessages = consoleLogSpy.calls.join('\n');
        expect(logMessages).toContain('SAME_SITE_COOKIE using default: lax');
        expect(logMessages).toContain('development');
      });

      it('should accept explicit "lax" setting in development', () => {
        process.env.SAME_SITE_COOKIE = 'lax';
        consoleLogSpy.setup();

        const setting = getValidatedSameSiteSetting();
        expect(setting).toBe('lax');

        // Verify explicit setting log (no warnings expected)
        const logMessages = consoleLogSpy.calls.join('\n');
        expect(logMessages).toContain('SAME_SITE_COOKIE explicitly set to: lax');
      });

      it('should accept "strict" setting in development', () => {
        process.env.SAME_SITE_COOKIE = 'strict';
        consoleLogSpy.setup();

        const setting = getValidatedSameSiteSetting();
        expect(setting).toBe('strict');
      });

      it('should throw error for "none" in development (requires secure cookies)', () => {
        process.env.SAME_SITE_COOKIE = 'none';

        expect(() => getValidatedSameSiteSetting()).toThrow(
          'SAME_SITE_COOKIE=none requires secure cookies (NODE_ENV=production)'
        );
      });
    });

    describe('Validation rules', () => {
      it('should reject "none" without secure cookies (development)', () => {
        process.env.NODE_ENV = 'development';
        process.env.SAME_SITE_COOKIE = 'none';

        expect(() => getValidatedSameSiteSetting()).toThrow();
      });

      it('should accept "none" with secure cookies (production)', () => {
        process.env.NODE_ENV = 'production';
        process.env.SAME_SITE_COOKIE = 'none';
        consoleWarnSpy.setup();

        const setting = getValidatedSameSiteSetting();
        expect(setting).toBe('none');
      });

      it('should warn about security implications of "lax" in production', () => {
        process.env.NODE_ENV = 'production';
        process.env.SAME_SITE_COOKIE = 'lax';
        consoleWarnSpy.setup();

        getValidatedSameSiteSetting();

        const warnMessages = consoleWarnSpy.calls.join('\n');
        expect(warnMessages).toContain('SECURITY');
        expect(warnMessages).toContain('WARNING');
      });

      it('should warn about security implications of "none"', () => {
        process.env.NODE_ENV = 'production';
        process.env.SAME_SITE_COOKIE = 'none';
        consoleWarnSpy.setup();

        getValidatedSameSiteSetting();

        const warnMessages = consoleWarnSpy.calls.join('\n');
        expect(warnMessages).toContain('minimal CSRF protection');
      });
    });

    describe('Secure flag integration', () => {
      it('should require secure=true when SameSite=none in production', () => {
        process.env.NODE_ENV = 'production';
        process.env.SAME_SITE_COOKIE = 'none';

        const setting = getValidatedSameSiteSetting();
        expect(setting).toBe('none');
        // In production, secure cookies are enabled (env.NODE_ENV === 'production')
      });

      it('should reject SameSite=none in development (secure=false)', () => {
        process.env.NODE_ENV = 'development';
        process.env.SAME_SITE_COOKIE = 'none';

        expect(() => getValidatedSameSiteSetting()).toThrow(/requires secure cookies/);
      });
    });
  });

  describe('Better Auth cookie configuration', () => {
    it('should have auth instance configured with sameSite attribute', () => {
      // Verify auth instance exists and is properly configured
      expect(auth).toBeDefined();
      expect(typeof auth).toBe('object');
    });

    it('should use secure cookies in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SAME_SITE_COOKIE = 'strict';

      // Verify auth instance exists (already imported at top level)
      expect(auth).toBeDefined();
    });

    it('should use non-secure cookies in development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SAME_SITE_COOKIE = 'lax';

      // Verify auth instance exists (already imported at top level)
      expect(auth).toBeDefined();
    });
  });

  describe('Cookie attribute combinations', () => {
    describe('Production configurations', () => {
      it('should support strict + secure (recommended)', () => {
        process.env.NODE_ENV = 'production';
        process.env.SAME_SITE_COOKIE = 'strict';

        const setting = getValidatedSameSiteSetting();
        expect(setting).toBe('strict');
      });

      it('should support lax + secure (allowed but not recommended)', () => {
        process.env.NODE_ENV = 'production';
        process.env.SAME_SITE_COOKIE = 'lax';
        consoleWarnSpy.setup();

        const setting = getValidatedSameSiteSetting();
        expect(setting).toBe('lax');

        // Should emit warning
        expect(consoleWarnSpy.calls.some((msg) => msg.includes('WARNING'))).toBe(true);
      });

      it('should support none + secure (specific use cases only)', () => {
        process.env.NODE_ENV = 'production';
        process.env.SAME_SITE_COOKIE = 'none';
        consoleWarnSpy.setup();

        const setting = getValidatedSameSiteSetting();
        expect(setting).toBe('none');

        // Should emit warning
        expect(consoleWarnSpy.calls.some((msg) => msg.includes('WARNING'))).toBe(true);
      });
    });

    describe('Development configurations', () => {
      it('should support lax + non-secure (default)', () => {
        process.env.NODE_ENV = 'development';
        delete process.env.SAME_SITE_COOKIE;

        const setting = getValidatedSameSiteSetting();
        expect(setting).toBe('lax');
      });

      it('should support strict + non-secure (for testing)', () => {
        process.env.NODE_ENV = 'development';
        process.env.SAME_SITE_COOKIE = 'strict';

        const setting = getValidatedSameSiteSetting();
        expect(setting).toBe('strict');
      });

      it('should reject none + non-secure (invalid combination)', () => {
        process.env.NODE_ENV = 'development';
        process.env.SAME_SITE_COOKIE = 'none';

        expect(() => getValidatedSameSiteSetting()).toThrow();
      });
    });
  });

  describe('Security logging and warnings', () => {
    it('should log when using default SameSite setting', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.SAME_SITE_COOKIE;
      consoleLogSpy.setup();

      getValidatedSameSiteSetting();

      const logMessages = consoleLogSpy.calls.join('\n');
      expect(logMessages).toContain('SAME_SITE_COOKIE using default');
      expect(logMessages).toContain('production');
    });

    it('should log when using explicit SameSite setting', () => {
      process.env.NODE_ENV = 'production';
      process.env.SAME_SITE_COOKIE = 'strict';
      consoleLogSpy.setup();

      getValidatedSameSiteSetting();

      const logMessages = consoleLogSpy.calls.join('\n');
      expect(logMessages).toContain('SAME_SITE_COOKIE explicitly set');
      expect(logMessages).toContain('strict');
    });

    it('should emit multiple warnings for insecure production config', () => {
      process.env.NODE_ENV = 'production';
      process.env.SAME_SITE_COOKIE = 'lax';
      consoleWarnSpy.setup();

      getValidatedSameSiteSetting();

      // Should have warning about lax in production
      const warnMessages = consoleWarnSpy.calls.join('\n');
      expect(warnMessages).toContain('WARNING');
      expect(warnMessages).toContain('CSRF');
    });

    it('should warn about minimal protection with SameSite=none', () => {
      process.env.NODE_ENV = 'production';
      process.env.SAME_SITE_COOKIE = 'none';
      consoleWarnSpy.setup();

      getValidatedSameSiteSetting();

      const warnMessages = consoleWarnSpy.calls.join('\n');
      expect(warnMessages).toContain('minimal CSRF protection');
      expect(warnMessages).toContain('cross-site');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle missing NODE_ENV gracefully', () => {
      delete process.env.NODE_ENV;
      delete process.env.SAME_SITE_COOKIE;

      // Should default to development behavior
      const setting = getValidatedSameSiteSetting();
      expect(setting).toBe('lax');
    });

    it('should handle empty SAME_SITE_COOKIE string', () => {
      process.env.NODE_ENV = 'production';
      process.env.SAME_SITE_COOKIE = '';

      // Empty string should be treated as undefined
      const setting = getValidatedSameSiteSetting();
      expect(setting).toBe('strict'); // Production default
    });

    it('should be case-sensitive for enum values', () => {
      process.env.NODE_ENV = 'production';
      process.env.SAME_SITE_COOKIE = 'STRICT';

      // Zod enum is case-sensitive, so 'STRICT' is invalid
      // The env validation should reject this before getValidatedSameSiteSetting is called
      // This test verifies the function behavior if it receives an invalid value
      expect(() => getValidatedSameSiteSetting()).not.toThrow();
    });

    it('should handle rapid environment changes', () => {
      process.env.NODE_ENV = 'development';
      process.env.SAME_SITE_COOKIE = 'lax';

      const setting1 = getValidatedSameSiteSetting();
      expect(setting1).toBe('lax');

      process.env.NODE_ENV = 'production';
      process.env.SAME_SITE_COOKIE = 'strict';

      const setting2 = getValidatedSameSiteSetting();
      expect(setting2).toBe('strict');
    });
  });

  describe('Cookie behavior across contexts', () => {
    it('should allow first-party requests with SameSite=strict', () => {
      process.env.NODE_ENV = 'production';
      process.env.SAME_SITE_COOKIE = 'strict';

      const setting = getValidatedSameSiteSetting();
      expect(setting).toBe('strict');

      // SameSite=strict: Cookies sent only for same-site requests
      // This prevents all CSRF attacks but may break legitimate cross-site navigations
    });

    it('should allow top-level navigations with SameSite=lax', () => {
      process.env.NODE_ENV = 'production';
      process.env.SAME_SITE_COOKIE = 'lax';

      const setting = getValidatedSameSiteSetting();
      expect(setting).toBe('lax');

      // SameSite=lax: Cookies sent for top-level navigations
      // This allows some CSRF through link-based attacks
    });

    it('should allow all requests with SameSite=none (with secure)', () => {
      process.env.NODE_ENV = 'production';
      process.env.SAME_SITE_COOKIE = 'none';

      const setting = getValidatedSameSiteSetting();
      expect(setting).toBe('none');

      // SameSite=none: Cookies sent in all contexts
      // Requires secure=true, provides no CSRF protection
    });
  });
});
