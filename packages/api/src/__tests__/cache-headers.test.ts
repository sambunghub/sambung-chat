/**
 * Cache Headers Middleware Unit Tests
 *
 * Tests for ETag generation, Cache-Control header management,
 * and comprehensive caching scenarios
 */

import { describe, it, expect } from 'vitest';
import {
  generateETag,
  shouldReturn304,
  buildCacheControl,
  isValidCacheOptions,
  cacheOptionsSchema,
  CACHE_DURATIONS,
  CACHE_PRESETS,
  getCachePreset,
  getCacheDuration,
  extractCacheMetadata,
  type CacheOptions,
} from '../middleware/cache-headers';

describe('Cache Headers Middleware', () => {
  describe('ETag Generation', () => {
    it('should generate consistent ETags for identical data', () => {
      const data = { id: 1, name: 'Test' };
      const etag1 = generateETag(data);
      const etag2 = generateETag(data);

      expect(etag1).toBe(etag2);
    });

    it('should generate different ETags for different data', () => {
      const data1 = { id: 1, name: 'Test' };
      const data2 = { id: 2, name: 'Test' };

      const etag1 = generateETag(data1);
      const etag2 = generateETag(data2);

      expect(etag1).not.toBe(etag2);
    });

    it('should generate ETags with proper format (quoted SHA-256 hash)', () => {
      const data = { test: 'data' };
      const etag = generateETag(data);

      // ETag should be quoted
      expect(etag).toMatch(/^"[a-f0-9]+"$/);

      // SHA-256 hash is 64 hex characters
      const hash = etag.replace(/"/g, '');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate ETags for complex nested objects', () => {
      const data = {
        user: {
          id: 1,
          profile: {
            name: 'Test User',
            settings: {
              theme: 'dark',
            },
          },
        },
      };

      const etag = generateETag(data);

      expect(etag).toMatch(/^"[a-f0-9]+"$/);
      expect(etag.replace(/"/g, '')).toHaveLength(64);
    });

    it('should generate ETags for arrays', () => {
      const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];

      const etag = generateETag(data);

      expect(etag).toMatch(/^"[a-f0-9]+"$/);
      expect(etag.replace(/"/g, '')).toHaveLength(64);
    });

    it('should handle arrays with nested objects', () => {
      // NOTE: Current implementation uses stableStringify for deterministic serialization,
      // which recursively sorts object keys to ensure consistent ETags regardless of
      // property order. Arrays with nested objects will generate stable ETags.
      const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];

      const etag = generateETag(data);

      expect(etag).toMatch(/^"[a-f0-9]+"$/);
      expect(etag.replace(/"/g, '')).toHaveLength(64);
    });

    it('should generate ETags for primitive values', () => {
      const stringETag = generateETag('test string');
      const numberETag = generateETag(42);
      const booleanETag = generateETag(true);
      const nullETag = generateETag(null);

      expect(stringETag).toMatch(/^"[a-f0-9]+"$/);
      expect(numberETag).toMatch(/^"[a-f0-9]+"$/);
      expect(booleanETag).toMatch(/^"[a-f0-9]+"$/);
      expect(nullETag).toMatch(/^"[a-f0-9]+"$/);
    });

    it('should handle objects with same keys in different orders consistently', () => {
      const data1 = { b: 2, a: 1, c: 3 };
      const data2 = { a: 1, c: 3, b: 2 };

      const etag1 = generateETag(data1);
      const etag2 = generateETag(data2);

      expect(etag1).toBe(etag2);
    });
  });

  describe('304 Not Modified Detection', () => {
    it('should return false when If-None-Match header is missing', () => {
      const currentETag = '"abc123"';
      const result = shouldReturn304(currentETag, undefined);

      expect(result).toBe(false);
    });

    it('should return false when If-None-Match header is empty', () => {
      const currentETag = '"abc123"';
      const result = shouldReturn304(currentETag, '');

      expect(result).toBe(false);
    });

    it('should return true when ETags match', () => {
      const currentETag = '"abc123"';
      const ifNoneMatch = '"abc123"';
      const result = shouldReturn304(currentETag, ifNoneMatch);

      expect(result).toBe(true);
    });

    it('should return true when ETags match without quotes', () => {
      const currentETag = '"abc123"';
      const ifNoneMatch = 'abc123';
      const result = shouldReturn304(currentETag, ifNoneMatch);

      expect(result).toBe(true);
    });

    it('should return false when ETags do not match', () => {
      const currentETag = '"abc123"';
      const ifNoneMatch = '"def456"';
      const result = shouldReturn304(currentETag, ifNoneMatch);

      expect(result).toBe(false);
    });

    it('should handle ETags with extra whitespace', () => {
      const currentETag = '"abc123"';
      const ifNoneMatch = ' "abc123" ';
      const result = shouldReturn304(currentETag, ifNoneMatch);

      expect(result).toBe(false); // Whitespace is part of the ETag
    });

    it('should handle weak ETags (W/ prefix)', () => {
      const currentETag = '"abc123"';
      const weakETag = 'W/"abc123"';
      const result = shouldReturn304(currentETag, weakETag);

      // Should not match - we don't strip the W/ prefix
      expect(result).toBe(false);
    });
  });

  describe('Cache-Control Header Building', () => {
    it('should build cache control with default options', () => {
      const header = buildCacheControl();

      expect(header).toBe('private, max-age=300, no-transform');
    });

    it('should build cache control with custom maxAge', () => {
      const header = buildCacheControl({ maxAge: 600 });

      expect(header).toBe('private, max-age=600, no-transform');
    });

    it('should build cache control with public scope', () => {
      const header = buildCacheControl({ scope: 'public' });

      expect(header).toContain('public');
      expect(header).toContain('max-age=300');
      expect(header).toContain('no-transform');
    });

    it('should build cache control with private scope', () => {
      const header = buildCacheControl({ scope: 'private' });

      expect(header).toContain('private');
      expect(header).toContain('max-age=300');
      expect(header).toContain('no-transform');
    });

    it('should include must-revalidate when specified', () => {
      const header = buildCacheControl({ mustRevalidate: true });

      expect(header).toContain('must-revalidate');
      expect(header).toContain('private');
      expect(header).toContain('max-age=300');
    });

    it('should exclude no-transform when set to false', () => {
      const header = buildCacheControl({ noTransform: false });

      expect(header).not.toContain('no-transform');
      expect(header).toContain('private');
      expect(header).toContain('max-age=300');
    });

    it('should combine all directives correctly', () => {
      const header = buildCacheControl({
        maxAge: 900,
        scope: 'public',
        noTransform: true,
        mustRevalidate: true,
      });

      expect(header).toBe('public, max-age=900, no-transform, must-revalidate');
    });

    it('should handle zero maxAge', () => {
      const header = buildCacheControl({ maxAge: 0 });

      expect(header).toContain('max-age=0');
    });

    it('should handle large maxAge values', () => {
      const header = buildCacheControl({ maxAge: 31536000 }); // 1 year

      expect(header).toContain('max-age=31536000');
    });
  });

  describe('Cache Options Validation', () => {
    it('should validate correct cache options', () => {
      const validOptions = {
        maxAge: 300,
        scope: 'private',
        noTransform: true,
      };

      expect(isValidCacheOptions(validOptions)).toBe(true);
    });

    it('should validate cache options without optional fields', () => {
      const validOptions = {
        maxAge: 300,
      };

      expect(isValidCacheOptions(validOptions)).toBe(true);
    });

    it('should reject invalid maxAge (negative)', () => {
      const invalidOptions = {
        maxAge: -10,
      };

      expect(isValidCacheOptions(invalidOptions)).toBe(false);
    });

    it('should reject invalid maxAge (zero)', () => {
      const invalidOptions = {
        maxAge: 0,
      };

      expect(isValidCacheOptions(invalidOptions)).toBe(false);
    });

    it('should reject invalid maxAge (not an integer)', () => {
      const invalidOptions = {
        maxAge: 300.5,
      };

      expect(isValidCacheOptions(invalidOptions)).toBe(false);
    });

    it('should reject invalid scope', () => {
      const invalidOptions = {
        maxAge: 300,
        scope: 'invalid',
      };

      expect(isValidCacheOptions(invalidOptions)).toBe(false);
    });

    it('should accept valid scope values', () => {
      const privateScope = { maxAge: 300, scope: 'private' };
      const publicScope = { maxAge: 300, scope: 'public' };

      expect(isValidCacheOptions(privateScope)).toBe(true);
      expect(isValidCacheOptions(publicScope)).toBe(true);
    });

    it('should reject non-object input', () => {
      expect(isValidCacheOptions(null)).toBe(false);
      expect(isValidCacheOptions(undefined)).toBe(false);
      expect(isValidCacheOptions('string')).toBe(false);
      expect(isValidCacheOptions(123)).toBe(false);
      expect(isValidCacheOptions([])).toBe(false);
    });

    it('should use Zod schema for validation', () => {
      const validOptions = { maxAge: 300, scope: 'private' };
      const invalidOptions = { maxAge: -10 };

      const validResult = cacheOptionsSchema.safeParse(validOptions);
      const invalidResult = cacheOptionsSchema.safeParse(invalidOptions);

      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('Cache Durations Presets', () => {
    it('should have VERY_SHORT duration preset', () => {
      expect(CACHE_DURATIONS.VERY_SHORT).toEqual({
        maxAge: 30,
        scope: 'private',
        noTransform: true,
      });
    });

    it('should have SHORT duration preset', () => {
      expect(CACHE_DURATIONS.SHORT).toEqual({
        maxAge: 60,
        scope: 'private',
        noTransform: true,
      });
    });

    it('should have MEDIUM duration preset', () => {
      expect(CACHE_DURATIONS.MEDIUM).toEqual({
        maxAge: 300,
        scope: 'private',
        noTransform: true,
      });
    });

    it('should have LONG duration preset', () => {
      expect(CACHE_DURATIONS.LONG).toEqual({
        maxAge: 900,
        scope: 'private',
        noTransform: true,
      });
    });

    it('should have VERY_LONG duration preset', () => {
      expect(CACHE_DURATIONS.VERY_LONG).toEqual({
        maxAge: 3600,
        scope: 'private',
        noTransform: true,
      });
    });

    it('should get cache duration by key', () => {
      const medium = getCacheDuration('MEDIUM');

      expect(medium).toEqual({
        maxAge: 300,
        scope: 'private',
        noTransform: true,
      });
    });
  });

  describe('Cache Presets', () => {
    it('should have CONFIGURATION preset', () => {
      expect(CACHE_PRESETS.CONFIGURATION).toEqual({
        maxAge: 900,
        scope: 'private',
        noTransform: true,
      });
    });

    it('should have CHAT_LIST preset', () => {
      expect(CACHE_PRESETS.CHAT_LIST).toEqual({
        maxAge: 300,
        scope: 'private',
        noTransform: true,
      });
    });

    it('should have MESSAGES preset', () => {
      expect(CACHE_PRESETS.MESSAGES).toEqual({
        maxAge: 60,
        scope: 'private',
        noTransform: true,
      });
    });

    it('should have PUBLIC preset', () => {
      expect(CACHE_PRESETS.PUBLIC).toEqual({
        maxAge: 900,
        scope: 'public',
        noTransform: true,
      });
    });

    it('should get cache preset by key', () => {
      const config = getCachePreset('CONFIGURATION');

      expect(config).toEqual({
        maxAge: 900,
        scope: 'private',
        noTransform: true,
      });
    });
  });

  describe('Cache Metadata Extraction', () => {
    it('should extract metadata from response with cache headers', () => {
      const response = {
        _orpcCacheControl: 'private, max-age=300',
        _orpcETag: '"abc123"',
        _orpcCacheStatus: 200,
        data: 'test',
      };

      const metadata = extractCacheMetadata(response);

      expect(metadata).toEqual({
        cacheControl: 'private, max-age=300',
        etag: '"abc123"',
        status: 200,
      });
    });

    it('should extract partial metadata from response', () => {
      const response = {
        _orpcCacheControl: 'private, max-age=300',
        data: 'test',
      };

      const metadata = extractCacheMetadata(response);

      expect(metadata).toEqual({
        cacheControl: 'private, max-age=300',
        etag: undefined,
        status: undefined,
      });
    });

    it('should return empty object for response without metadata', () => {
      const response = {
        data: 'test',
        id: 1,
      };

      const metadata = extractCacheMetadata(response);

      expect(metadata).toEqual({
        cacheControl: undefined,
        etag: undefined,
        status: undefined,
      });
    });

    it('should handle null response', () => {
      const metadata = extractCacheMetadata(null);

      expect(metadata).toEqual({});
    });

    it('should handle undefined response', () => {
      const metadata = extractCacheMetadata(undefined);

      expect(metadata).toEqual({});
    });

    it('should handle primitive responses', () => {
      const metadata = extractCacheMetadata('string');

      expect(metadata).toEqual({});
    });

    it('should handle array responses', () => {
      const metadata = extractCacheMetadata([1, 2, 3]);

      expect(metadata).toEqual({});
    });

    it('should extract 304 status from response', () => {
      const response = {
        _orpcCacheStatus: 304,
        _orpcETag: '"abc123"',
      };

      const metadata = extractCacheMetadata(response);

      expect(metadata.status).toBe(304);
    });
  });

  describe('ETag Generation Edge Cases', () => {
    it('should handle empty object', () => {
      const etag = generateETag({});

      expect(etag).toMatch(/^"[a-f0-9]+"$/);
    });

    it('should handle empty array', () => {
      const etag = generateETag([]);

      expect(etag).toMatch(/^"[a-f0-9]+"$/);
    });

    it('should handle special characters in data', () => {
      const data = {
        message: 'Hello 世界 🌍',
        unicode: 'Ñoño',
        emoji: '😀',
      };

      const etag = generateETag(data);

      expect(etag).toMatch(/^"[a-f0-9]+"$/);
    });

    it('should handle deeply nested objects', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: 'deep',
                },
              },
            },
          },
        },
      };

      const etag = generateETag(data);

      expect(etag).toMatch(/^"[a-f0-9]+"$/);
    });

    it('should handle objects with many properties', () => {
      const data: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        data[`key${i}`] = i;
      }

      const etag = generateETag(data);

      expect(etag).toMatch(/^"[a-f0-9]+"$/);
    });

    it('should handle circular references gracefully', () => {
      const data: Record<string, unknown> & { self?: unknown } = { name: 'test' };
      data.self = data;

      // JSON.stringify will throw on circular references
      expect(() => generateETag(data)).toThrow();
    });
  });

  describe('Cache-Control Header Edge Cases', () => {
    it('should handle very small maxAge', () => {
      const header = buildCacheControl({ maxAge: 1 });

      expect(header).toContain('max-age=1');
    });

    it('should handle undefined scope (should default to private)', () => {
      const header = buildCacheControl({ maxAge: 300, scope: undefined });

      expect(header).toContain('private');
    });

    it('should build header with only maxAge', () => {
      const header = buildCacheControl({ maxAge: 600 });

      expect(header).toBe('private, max-age=600, no-transform');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle typical cache workflow for folder data', () => {
      const folders = [
        { id: 1, name: 'Work' },
        { id: 2, name: 'Personal' },
      ];

      // Generate ETag for the data
      const etag = generateETag(folders);

      // Build cache control for configuration data
      const cacheControl = buildCacheControl(CACHE_PRESETS.CONFIGURATION);

      // Check if client has cached version
      const clientETag = etag;
      const should304 = shouldReturn304(etag, clientETag);

      expect(etag).toMatch(/^"[a-f0-9]+"$/);
      expect(cacheControl).toContain('max-age=900');
      expect(should304).toBe(true);
    });

    it('should handle typical cache workflow for chat list', () => {
      const chats = [
        { id: 1, title: 'Chat 1' },
        { id: 2, title: 'Chat 2' },
      ];

      const etag = generateETag(chats);
      const cacheControl = buildCacheControl(CACHE_PRESETS.CHAT_LIST);

      // Simulate client with different ETag
      const differentETag = '"differenthash"';
      const should304 = shouldReturn304(etag, differentETag);

      expect(cacheControl).toContain('max-age=300');
      expect(should304).toBe(false); // Should return fresh data
    });

    it('should handle cache metadata extraction for ORPC response', () => {
      const mockResponse = {
        data: { id: 1, name: 'Test' },
        _orpcCacheControl: buildCacheControl({ maxAge: 300 }),
        _orpcETag: generateETag({ id: 1, name: 'Test' }),
      };

      const metadata = extractCacheMetadata(mockResponse);

      expect(metadata.cacheControl).toBeDefined();
      expect(metadata.etag).toBeDefined();
      expect(metadata.status).toBeUndefined();
    });

    it('should handle 304 response with cache metadata', () => {
      const mockResponse = {
        _orpcCacheStatus: 304,
        _orpcETag: '"unchanged"',
      };

      const metadata = extractCacheMetadata(mockResponse);

      expect(metadata.status).toBe(304);
      expect(metadata.etag).toBe('"unchanged"');
    });
  });

  describe('Cache Properties and Security', () => {
    it('should generate unique ETags for similar but different data', () => {
      const data1 = { id: 1, name: 'Test' };
      const data2 = { id: 1, name: 'Test ' }; // Extra space

      const etag1 = generateETag(data1);
      const etag2 = generateETag(data2);

      expect(etag1).not.toBe(etag2);
    });

    it('should have sufficient entropy in ETags', () => {
      const data = { test: 'data' };
      const etag = generateETag(data);

      // SHA-256 provides 256 bits of entropy
      const hash = etag.replace(/"/g, '');
      expect(hash).toHaveLength(64); // 64 hex chars = 256 bits
    });

    it('should not leak sensitive information in ETags', () => {
      const sensitiveData = {
        password: 'secret123',
        apiKey: 'API_KEY_PLACEHOLDER',
      };

      const etag = generateETag(sensitiveData);

      // ETag should be a hash, not contain the original data
      expect(etag).not.toContain('secret');
      expect(etag).not.toContain('sk-');
      expect(etag).toMatch(/^"[a-f0-9]+"$/);
    });

    it('should maintain cache control directives for security', () => {
      const header = buildCacheControl({
        maxAge: 300,
        scope: 'private',
        noTransform: true,
      });

      // Private scope ensures data is not cached in shared caches
      expect(header).toContain('private');

      // no-transform prevents proxies from modifying the response
      expect(header).toContain('no-transform');
    });
  });

  describe('Type Safety', () => {
    it('should have correct types for cache options', () => {
      const options: CacheOptions = {
        maxAge: 300,
        scope: 'private',
        noTransform: true,
        mustRevalidate: false,
      };

      expect(isValidCacheOptions(options)).toBe(true);
    });

    it('should accept partial cache options', () => {
      const partialOptions: Partial<CacheOptions> = {
        maxAge: 300,
      };

      const header = buildCacheControl(partialOptions);

      expect(header).toBeDefined();
      expect(header).toContain('max-age=300');
    });

    it('should work with cache presets as CacheOptions', () => {
      const preset = getCachePreset('CONFIGURATION');
      const options: CacheOptions = preset;

      expect(isValidCacheOptions(options)).toBe(true);

      const header = buildCacheControl(options);
      expect(header).toContain('max-age=900');
    });
  });
});
