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
 * const etag = generateETag({ data: 'example' });
 * const cacheControl = buildCacheControl({ maxAge: 300, scope: 'private' });
 * ```
 */

import { createHash } from 'crypto';
import type { Context } from '../context';

/**
 * Cache scope - determines who can cache the response
 * - private: Cache for single user (browser cache)
 * - public: Cache can be stored by any cache (CDN, proxy)
 */
type CacheScope = 'private' | 'public';

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
 * Generate an ETag for the given data
 *
 * ETags are used for cache validation. The client can send the ETag
 * in an If-None-Match header, and if the data hasn't changed, the
 * server returns 304 Not Modified with no body.
 *
 * This function creates a strong ETag by computing a SHA-256 hash
 * of the JSON-serialized data.
 *
 * @param data - The data to generate an ETag for
 * @returns An ETag string (with quotes, e.g., "abc123...")
 *
 * @example
 * ```ts
 * const etag = generateETag({ id: 1, name: 'Test' });
 * // Returns: "3389da0c..."
 * ```
 */
export function generateETag(data: unknown): string {
  // Serialize data to JSON string with stable sorting
  const jsonString = JSON.stringify(data, Object.keys(data instanceof Object ? data : {}).sort());

  // Create SHA-256 hash
  const hash = createHash('sha256').update(jsonString, 'utf-8').digest('hex');

  // Return ETag with quotes (HTTP spec requirement)
  return `"${hash}"`;
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
export const cacheHeadersMiddleware = (o: any) => (options: Partial<CacheOptions> = {}) => {
  return o.middleware(async ({ context, next }: { context: Context & { headers?: Headers }; next: () => Promise<unknown> }) => {
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
  });
};

/**
 * Cache duration presets for common scenarios
 *
 * @example
 * ```ts
 * // Short-lived cache (1 minute) - frequently changing data
 * cacheHeadersMiddleware(CACHE_DURATIONS.SHORT)
 *
 * // Medium-lived cache (5 minutes) - moderately dynamic data
 * cacheHeadersMiddleware(CACHE_DURATIONS.MEDIUM)
 *
 * // Long-lived cache (15 minutes) - rarely changing data
 * cacheHeadersMiddleware(CACHE_DURATIONS.LONG)
 * ```
 */
export const CACHE_DURATIONS = {
  /** 1 minute - for frequently changing data */
  SHORT: { maxAge: 60, scope: 'private' as const },

  /** 5 minutes - default for most user-specific data */
  MEDIUM: { maxAge: 300, scope: 'private' as const },

  /** 15 minutes - for rarely changing data */
  LONG: { maxAge: 900, scope: 'private' as const },
} as const;

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
