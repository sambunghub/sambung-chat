/**
 * CORS Origin Validation and Sanitization Tests
 *
 * Tests for CORS origin validation, sanitization, and security hardening
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getValidatedCorsOrigins } from '@sambung-chat/env/server';

describe('CORS Origin Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Set up spies for console.warn and console.log
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;

    // Restore console methods
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('Valid CORS Origins', () => {
    it('should accept single valid HTTP origin', () => {
      process.env.CORS_ORIGIN = 'http://localhost:5174';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['http://localhost:5174']);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should accept single valid HTTPS origin', () => {
      process.env.CORS_ORIGIN = 'https://example.com';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['https://example.com']);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should accept multiple valid origins', () => {
      process.env.CORS_ORIGIN = 'http://localhost:5174,https://example.com,https://api.example.com';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual([
        'http://localhost:5174',
        'https://example.com',
        'https://api.example.com',
      ]);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should accept origin with port number', () => {
      process.env.CORS_ORIGIN = 'https://example.com:8443';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['https://example.com:8443']);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should accept origin with subdomain', () => {
      process.env.CORS_ORIGIN = 'https://api.example.com';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['https://api.example.com']);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should accept localhost with different ports', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:5174,http://localhost:8080';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual([
        'http://localhost:3000',
        'http://localhost:5174',
        'http://localhost:8080',
      ]);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Origin Sanitization', () => {
    it('should trim whitespace from origins', () => {
      process.env.CORS_ORIGIN = '  http://localhost:5174  ,  https://example.com  ';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['http://localhost:5174', 'https://example.com']);
    });

    it('should remove trailing slashes from origins', () => {
      process.env.CORS_ORIGIN = 'https://example.com/,http://localhost:5174/';
      const origins = getValidatedCorsOrigins();

      // url.origin strips trailing slashes (they're part of path)
      expect(origins).toEqual(['https://example.com', 'http://localhost:5174']);
    });

    it('should handle multiple trailing slashes', () => {
      process.env.CORS_ORIGIN = 'https://example.com///';
      const origins = getValidatedCorsOrigins();

      // url.origin strips path (trailing slashes are part of path)
      expect(origins).toEqual(['https://example.com']);
    });

    it('should trim and remove trailing slashes combined', () => {
      process.env.CORS_ORIGIN = '  https://example.com/  ';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['https://example.com']);
    });
  });

  describe('Invalid CORS Origins', () => {
    it('should reject malformed URLs', () => {
      process.env.CORS_ORIGIN = 'not-a-valid-url';

      expect(() => getValidatedCorsOrigins()).toThrow('Invalid CORS origin');
    });

    it('should reject origin with embedded credentials', () => {
      process.env.CORS_ORIGIN = 'http://user:password@example.com';

      expect(() => getValidatedCorsOrigins()).toThrow(
        'Origins with embedded credentials (username:password@) are not allowed'
      );
    });

    it('should reject origin with only username', () => {
      process.env.CORS_ORIGIN = 'http://user@example.com';

      expect(() => getValidatedCorsOrigins()).toThrow(
        'Origins with embedded credentials (username:password@) are not allowed'
      );
    });

    it('should reject non-HTTP protocols (ftp)', () => {
      process.env.CORS_ORIGIN = 'ftp://example.com';

      expect(() => getValidatedCorsOrigins()).toThrow(
        'Only http:// and https:// protocols are allowed'
      );
    });

    it('should reject non-HTTP protocols (file)', () => {
      process.env.CORS_ORIGIN = 'file:///path/to/file';

      expect(() => getValidatedCorsOrigins()).toThrow(
        'Only http:// and https:// protocols are allowed'
      );
    });

    it('should reject non-HTTP protocols (ws)', () => {
      process.env.CORS_ORIGIN = 'ws://example.com';

      expect(() => getValidatedCorsOrigins()).toThrow(
        'Only http:// and https:// protocols are allowed'
      );
    });

    it('should reject data URLs', () => {
      process.env.CORS_ORIGIN = 'data:text/plain,hello';

      expect(() => getValidatedCorsOrigins()).toThrow();
    });

    it('should reject empty origin', () => {
      process.env.CORS_ORIGIN = '';

      // Should return default origin
      const origins = getValidatedCorsOrigins();
      expect(origins).toEqual(['http://localhost:5174']);
    });
  });

  describe('Wildcard Origins', () => {
    it('should accept wildcard origin with security warning', () => {
      process.env.CORS_ORIGIN = '*';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['*']);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY] WARNING: CORS_ORIGIN=*')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('highly insecure'));
    });

    it('should warn about wildcard in both development and production', () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGIN = '*';

      getValidatedCorsOrigins();

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('highly insecure'));
    });
  });

  describe('Production Security Warnings', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should warn about HTTP in production', () => {
      process.env.CORS_ORIGIN = 'http://example.com';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['http://example.com']);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('uses HTTP in production')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('HTTPS should be used'));
    });

    it('should warn about localhost in production', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['http://localhost:3000']);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('points to localhost in production')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('likely a misconfiguration')
      );
    });

    it('should warn about both HTTP and localhost in production', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      getValidatedCorsOrigins();

      // Should have multiple warnings
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should not warn about HTTPS in production', () => {
      process.env.CORS_ORIGIN = 'https://example.com';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['https://example.com']);
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('uses HTTP in production')
      );
    });

    it('should not warn about non-localhost domains in production', () => {
      process.env.CORS_ORIGIN = 'https://api.example.com';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['https://api.example.com']);
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('localhost in production')
      );
    });
  });

  describe('Development Mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should allow HTTP without warnings in development', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['http://localhost:3000']);
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('uses HTTP in production')
      );
    });

    it('should allow localhost without warnings in development', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['http://localhost:3000']);
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('localhost in production')
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle duplicate origins', () => {
      process.env.CORS_ORIGIN = 'http://localhost:5174,http://localhost:5174';
      const origins = getValidatedCorsOrigins();

      // Duplicates are preserved (order matters for some CORS implementations)
      expect(origins).toEqual(['http://localhost:5174', 'http://localhost:5174']);
    });

    it('should handle origin with path', () => {
      process.env.CORS_ORIGIN = 'https://example.com/path';
      const origins = getValidatedCorsOrigins();

      // url.origin strips path (only returns scheme://host[:port])
      expect(origins).toEqual(['https://example.com']);
    });

    it('should handle origin with query parameters', () => {
      process.env.CORS_ORIGIN = 'https://example.com?query=param';
      const origins = getValidatedCorsOrigins();

      // url.origin strips query params (only returns scheme://host[:port])
      expect(origins).toEqual(['https://example.com']);
    });

    it('should handle origin with hash', () => {
      process.env.CORS_ORIGIN = 'https://example.com#section';
      const origins = getValidatedCorsOrigins();

      // url.origin strips hash fragment (only returns scheme://host[:port])
      expect(origins).toEqual(['https://example.com']);
    });

    it('should handle international domain names', () => {
      process.env.CORS_ORIGIN = 'https://müller.example.com';
      const origins = getValidatedCorsOrigins();

      // IDN (Internationalized Domain Names) should be handled by URL constructor
      expect(origins).toHaveLength(1);
      expect(origins[0]).toContain('https://');
    });

    it('should handle IP address origins', () => {
      process.env.CORS_ORIGIN = 'http://192.168.1.1:3000';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['http://192.168.1.1:3000']);
    });

    it('should filter out empty origins from comma-separated list', () => {
      process.env.CORS_ORIGIN = 'http://localhost:5174,,https://example.com';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['http://localhost:5174', 'https://example.com']);
    });
  });

  describe('Default Behavior', () => {
    it('should return default origin when CORS_ORIGIN is not set', () => {
      delete process.env.CORS_ORIGIN;
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['http://localhost:5174']);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('CORS origins:'));
    });

    it('should return default origin when CORS_ORIGIN is empty string', () => {
      process.env.CORS_ORIGIN = '';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['http://localhost:5174']);
    });

    it('should log allowed origins', () => {
      process.env.CORS_ORIGIN = 'http://localhost:5174,https://example.com';
      getValidatedCorsOrigins();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY] CORS origins:')
      );
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error message for malformed URL', () => {
      process.env.CORS_ORIGIN = 'not-a-url';

      expect(() => getValidatedCorsOrigins()).toThrow('Invalid CORS origin "not-a-url"');
    });

    it('should include the problematic origin in error message', () => {
      process.env.CORS_ORIGIN = 'ftp://example.com';

      expect(() => getValidatedCorsOrigins()).toThrow(/ftp:\/\/example\.com/);
    });

    it('should indicate the specific validation error', () => {
      process.env.CORS_ORIGIN = 'http://user:pass@example.com';

      expect(() => getValidatedCorsOrigins()).toThrow(/embedded credentials/);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical development configuration', () => {
      process.env.NODE_ENV = 'development';
      process.env.CORS_ORIGIN = 'http://localhost:5174';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['http://localhost:5174']);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should handle typical production configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGIN = 'https://app.example.com,https://api.example.com';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['https://app.example.com', 'https://api.example.com']);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should handle staging environment configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGIN = 'https://staging.example.com';
      const origins = getValidatedCorsOrigins();

      expect(origins).toEqual(['https://staging.example.com']);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should detect and warn about production misconfiguration', () => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      getValidatedCorsOrigins();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('uses HTTP in production')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('points to localhost in production')
      );
    });
  });
});
