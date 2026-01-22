import { createHash } from 'crypto';
import { z } from 'zod';
import type { Context } from '../context';

/**
 * Cache Headers Middleware
 *
 * Adds HTTP caching headers to ORPC responses:
 * - ETag generation for cache validation
 * - Cache-Control header management
 * - Support for conditional requests (If-None-Match)
 *
 * @example
 * ```ts
 * import { cacheHeadersMiddleware, generateETag, buildCacheControl } from './middleware/cache-headers';
 * import { o } from '../index';
 *
 * // Use as ORPC middleware
 * export const myProcedure = publicProcedure.use(cacheHeadersMiddleware(o)({
 *   maxAge: 300, // 5 minutes
 *   scope: 'private'
 * }));
 *
 * // Or manually generate ETag
 * const etag = generateETag({ id: 1, name: 'Test' });
 * // Returns: "3389da0c..."
 * ```
 */

/**
 * Stable JSON stringify that recursively sorts object keys
 * This ensures consistent ETags for identical structures regardless of key order
 */
function stableStringify(data: unknown): string {
  if (data === null || data === undefined) {
    return String(data);
  }

  if (typeof data !== 'object' || data === null) {
    return JSON.stringify(data);
  }

  if (Array.isArray(data)) {
    return `[${data.map(stableStringify).join(',')}]`;
  }

  // For plain objects, sort keys recursively
  const sortedKeys = Object.keys(data).sort();
  const keyValuePairs = sortedKeys.map((key) => {
    const value = (data as Record<string, unknown>)[key];
    return `${JSON.stringify(key)}:${stableStringify(value)}`;
  });

  return `{${keyValuePairs.join(',')}}`;
}

/**
 * Generate ETag from data using SHA-256 hash
 *
 * This function creates a stable ETag by:
 * 1. Serializing data to JSON with sorted keys (deterministic)
 * 2. Creating a SHA-256 hash of the serialized data
 * 3. Returning the hash as an ETag (with quotes per HTTP spec)
 *
 * @param data - The data to generate an ETag for
 * @returns An ETag string (e.g., "3389da0c...")
 *
 * @example
 * ```ts
 * const etag = generateETag({ id: 1, name: 'Test' });
 * // Returns: "3389da0c..."
 * ```
 */
export function generateETag(data: unknown): string {
  // Serialize data to JSON string with stable sorting (including nested objects)
  const jsonString = stableStringify(data);

  // Create SHA-256 hash
  const hash = createHash('sha256').update(jsonString, 'utf-8').digest('hex');

  // Return ETag with quotes (HTTP spec requirement)
  return `"${hash}"`;
}

/**
 * Cache scope - determines who can cache the response
 * - private: Cache for single user (browser cache)
 * - public: Cache can be stored by any cache (CDN, proxy)
 */
export type CacheScope = 'private' | 'public';

/**
 * Zod schema for validating cache scope
 */
export const cacheScopeSchema = z.enum(['private', 'public']);

/**
 * Zod schema for validating cache configuration options
 *
 * @example
 * ```ts
 * const result = cacheOptionsSchema.safeParse({ maxAge: 300, scope: 'private' });
 * if (result.success) {
 *   // Valid cache options
 * }
 * ```
 */
export const cacheOptionsSchema = z.object({
  maxAge: z.number().int().positive('maxAge must be a positive integer'),
  scope: cacheScopeSchema.optional(),
  noTransform: z.boolean().optional(),
  mustRevalidate: z.boolean().optional(),
});

/**
 * Cache configuration options
 */
export interface CacheOptions {
  /** Maximum time to cache the response (in seconds) */
  maxAge: number;
  /** Whether cache is private or public */
  scope?: CacheScope;
  /** Whether to include no-transform directive */
  noTransform?: boolean;
  /** Whether to add must-revalidate directive */
  mustRevalidate?: boolean;
}

/**
 * Default cache configuration (5 minutes, private)
 */
const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  maxAge: 300,
  scope: 'private',
  noTransform: true,
};

/**
 * Validate if an object is a valid cache options configuration
 *
 * @param options - The object to validate
 * @returns true if the object is valid cache options
 *
 * @example
 * ```ts
 * if (isValidCacheOptions({ maxAge: 300, scope: 'private' })) {
 *   // Use the options
 * }
 * ```
 */
export function isValidCacheOptions(options: unknown): boolean {
  return cacheOptionsSchema.safeParse(options).success;
}

/**
 * Check if the client's ETag matches the current ETag
 *
 * This function checks the If-None-Match header against the
 * provided ETag. If they match, the client's cached version
 * is still valid.
 *
 * @param currentETag - The current ETag for the data
 * @param ifNoneMatch - The value of the If-None-Match header
 * @returns true if the ETags match (cache is valid)
 *
 * @example
 * ```ts
 * const etag = generateETag(data);
 * const clientEtag = context.headers['if-none-match'];
 *
 * if (shouldReturn304(etag, clientEtag)) {
 *   // Return 304 Not Modified
 * }
 * ```
 */
export function shouldReturn304(currentETag: string, ifNoneMatch: string | undefined): boolean {
  if (!ifNoneMatch) {
    return false;
  }

  // Remove quotes for comparison
  const normalizeETag = (etag: string) => etag.replace(/^"|"$/g, '');

  return normalizeETag(currentETag) === normalizeETag(ifNoneMatch);
}

/**
 * Build a Cache-Control header value from options
 *
 * @param options - Cache configuration options
 * @returns A complete Cache-Control header value
 *
 * @example
 * ```ts
 * const header = buildCacheControl({ maxAge: 300, scope: 'private' });
 * // Returns: "private, max-age=300, no-transform"
 * ```
 */
export function buildCacheControl(options: Partial<CacheOptions> = {}): string {
  const opts = { ...DEFAULT_CACHE_OPTIONS, ...options };

  const directives: string[] = [];

  // Add scope (private or public)
  directives.push(opts.scope || 'private');

  // Add max-age
  directives.push(`max-age=${opts.maxAge}`);

  // Add optional directives
  if (opts.noTransform) {
    directives.push('no-transform');
  }

  if (opts.mustRevalidate) {
    directives.push('must-revalidate');
  }

  return directives.join(', ');
}

/**
 * Middleware factory for adding cache headers to ORPC responses
 *
 * This middleware:
 * 1. Generates an ETag for the response data
 * 2. Checks If-None-Match header for conditional requests
 * 3. Returns 304 Not Modified if ETag matches
 * 4. Adds Cache-Control and ETag headers to successful responses
 *
 * Use this middleware on read-only procedures that return data
 * which can be safely cached (e.g., getAll, getById).
 *
 * @param o - The ORPC instance (e.g., `o` from index.ts)
 * @param options - Cache configuration options
 * @returns An ORPC middleware function
 *
 * @example
 * ```ts
 * import { cacheHeadersMiddleware } from './middleware/cache-headers';
 * import { o } from '../index';
 *
 * export const folderRouter = {
 *   getAll: protectedProcedure
 *     .use(cacheHeadersMiddleware(o)({ maxAge: 300, scope: 'private' }))
 *     .handler(async ({ context }) => {
 *       return await db.select().from(folders);
 *     })
 * };
 * ```
 */
export const cacheHeadersMiddleware =
  (o: any) =>
  (options: Partial<CacheOptions> = {}) => {
    return o.middleware(
      async ({
        context,
        next,
      }: {
        context: Context & { headers?: Headers };
        next: () => Promise<unknown>;
      }) => {
        // Get the If-None-Match header from the request
        const ifNoneMatch = context.headers?.get('if-none-match') || undefined;

        // Execute the procedure to get the response data
        const result = await next();

        // Generate ETag from the response data
        const etag = generateETag(result);

        // Check if we should return 304 Not Modified
        if (shouldReturn304(etag, ifNoneMatch)) {
          // The client's cached version is still valid
          // Return the result with cache metadata
          if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
            return {
              ...result,
              _orpcCacheStatus: 304,
              _orpcETag: etag,
            };
          }
          // For primitives or arrays, wrap in an object
          return {
            _data: result,
            _orpcCacheStatus: 304,
            _orpcETag: etag,
          };
        }

        // Add cache headers metadata to the response
        // These will be processed by the server's response interceptor
        if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
          return {
            ...result,
            _orpcCacheControl: buildCacheControl(options),
            _orpcETag: etag,
          };
        }
        // For primitives or arrays, wrap in an object
        return {
          _data: result,
          _orpcCacheControl: buildCacheControl(options),
          _orpcETag: etag,
        };
      }
    );
  };

/**
 * Cache duration presets for common scenarios
 *
 * @example
 * ```ts
 * // Short-lived cache (1 minute) - frequently changing data
 * cacheHeadersMiddleware(o)(CACHE_DURATIONS.SHORT)
 *
 * // Medium-lived cache (5 minutes) - moderately dynamic data
 * cacheHeadersMiddleware(o)(CACHE_DURATIONS.MEDIUM)
 *
 * // Long-lived cache (15 minutes) - rarely changing data
 * cacheHeadersMiddleware(o)(CACHE_DURATIONS.LONG)
 * ```
 */
export const CACHE_DURATIONS = {
  /** 30 seconds - for very frequently changing data */
  VERY_SHORT: { maxAge: 30, scope: 'private' as const, noTransform: true as const },

  /** 1 minute - for frequently changing data */
  SHORT: { maxAge: 60, scope: 'private' as const, noTransform: true as const },

  /** 5 minutes - default for most user-specific data */
  MEDIUM: { maxAge: 300, scope: 'private' as const, noTransform: true as const },

  /** 15 minutes - for rarely changing data */
  LONG: { maxAge: 900, scope: 'private' as const, noTransform: true as const },

  /** 1 hour - for static configuration data */
  VERY_LONG: { maxAge: 3600, scope: 'private' as const, noTransform: true as const },
} as const;

/**
 * Cache configuration presets for specific use cases
 *
 * These presets combine duration and scope for common scenarios
 * in the SambungChat application.
 *
 * @example
 * ```ts
 * // Use for folder/model configuration (rarely changes)
 * cacheHeadersMiddleware(o)(CACHE_PRESETS.CONFIGURATION)
 *
 * // Use for chat list (moderately dynamic)
 * cacheHeadersMiddleware(o)(CACHE_PRESETS.CHAT_LIST)
 *
 * // Use for messages (frequently changes)
 * cacheHeadersMiddleware(o)(CACHE_PRESETS.MESSAGES)
 * ```
 */
export const CACHE_PRESETS = {
  /** Configuration data - folders, models, API keys (15 minutes) */
  CONFIGURATION: { maxAge: 900, scope: 'private' as const, noTransform: true as const },

  /** Chat list - user's chat overview (5 minutes) */
  CHAT_LIST: { maxAge: 300, scope: 'private' as const, noTransform: true as const },

  /** Message list - chat messages (1 minute) */
  MESSAGES: { maxAge: 60, scope: 'private' as const, noTransform: true as const },

  /** Public data - can be cached by CDN (15 minutes, public) */
  PUBLIC: { maxAge: 900, scope: 'public' as const, noTransform: true as const },
} as const;

/**
 * Type for cache preset keys
 */
export type CachePresetKey = keyof typeof CACHE_PRESETS;

/**
 * Type for cache duration keys
 */
export type CacheDurationKey = keyof typeof CACHE_DURATIONS;

/**
 * Get a cache preset by key
 *
 * This is a type-safe helper to retrieve cache presets.
 *
 * @param preset - The preset key
 * @returns The cache configuration for the preset
 *
 * @example
 * ```ts
 * const config = getCachePreset('CONFIGURATION');
 * // Returns: { maxAge: 900, scope: 'private', noTransform: true }
 * ```
 */
export function getCachePreset(preset: CachePresetKey): CacheOptions {
  return CACHE_PRESETS[preset];
}

/**
 * Get a cache duration by key
 *
 * This is a type-safe helper to retrieve cache durations.
 *
 * @param duration - The duration key
 * @returns The cache configuration for the duration
 *
 * @example
 * ```ts
 * const config = getCacheDuration('MEDIUM');
 * // Returns: { maxAge: 300, scope: 'private', noTransform: true }
 * ```
 */
export function getCacheDuration(duration: CacheDurationKey): CacheOptions {
  return CACHE_DURATIONS[duration];
}

/**
 * Helper to extract cache metadata from ORPC response
 *
 * This is used by the server's response interceptor to apply
 * cache headers to the HTTP response.
 *
 * @internal
 */
export function extractCacheMetadata(response: unknown): {
  cacheControl?: string;
  etag?: string;
  status?: number;
} {
  if (typeof response !== 'object' || response === null) {
    return {};
  }

  const resp = response as Record<string, unknown>;

  return {
    cacheControl: resp._orpcCacheControl as string | undefined,
    etag: resp._orpcETag as string | undefined,
    status: resp._orpcCacheStatus as number | undefined,
  };
}
