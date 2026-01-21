/**
 * Security Headers Middleware for Hono API Server
 *
 * This middleware provides centralized security headers for API endpoints to prevent
 * XSS, clickjacking, and other attacks. It follows OWASP guidelines and supports
 * security compliance requirements (SOC2, PCI-DSS).
 *
 * @see https://owasp.org/www-project-secure-headers/
 * @module middleware/security
 */

import type { MiddlewareHandler } from 'hono';

/**
 * X-Frame-Options header value
 *
 * @description
 * Prevents clickjacking attacks by controlling whether the page can be embedded in iframes.
 * Set to DENY to prevent all iframe embedding (API endpoints should never be embedded).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
 */
const X_FRAME_OPTIONS = 'DENY';

/**
 * X-Content-Type-Options header value
 *
 * @description
 * Prevents MIME-sniffing attacks by forcing the browser to use the declared content type.
 * Critical for API endpoints to prevent malicious file execution.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
 */
const X_CONTENT_TYPE_OPTIONS = 'nosniff';

/**
 * Get Strict-Transport-Security (HSTS) header value
 *
 * @description
 * Enforces HTTPS connections and prevents man-in-the-middle attacks.
 * Only applied in production to avoid issues with local HTTP development.
 *
 * @returns HSTS header value or null if not in production
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
 * @see https://owasp.org/www-project-secure-headers/#hsts
 */
function getHSTSHeader(): string | null {
  // Get NODE_ENV from server environment
  const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : 'development';

  // Only apply HSTS in production with HTTPS
  if (nodeEnv === 'production') {
    return 'max-age=31536000; includeSubDomains';
  }

  // Return null in development/test (will not be set)
  return null;
}

/**
 * Get Permissions-Policy header value
 *
 * @description
 * Controls which browser features and APIs can be used.
 * For API endpoints, all sensitive features should be disabled since API responses
 * are not rendered in a browser and should not access browser features.
 *
 * @returns Permissions-Policy header value
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy
 */
function getPermissionsPolicyHeader(): string {
  const policies = [
    // Geolocation: Disable (API should not access location)
    'geolocation=()',

    // Microphone: Disable
    'microphone=()',

    // Camera: Disable
    'camera=()',

    // Payment: Disable
    'payment=()',

    // USB: Disable
    'usb=()',

    // Magnetometer: Disable
    'magnetometer=()',

    // Gyroscope: Disable
    'gyroscope=()',

    // Speaker selection: Disable
    'speaker-selection=()',

    // VR/AR: Disable
    'vr=()',
    'xr=()',
  ];

  return policies.join(', ');
}

/**
 * Cross-Origin-Resource-Policy header value
 *
 * @description
 * Controls how resources can be loaded cross-origin.
 * Set to 'same-site' to allow requests from same-site origins only,
 * preventing cross-site leakage of API responses.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy
 */
const CROSS_ORIGIN_RESOURCE_POLICY = 'same-site';

/**
 * Security middleware configuration options
 */
interface SecurityMiddlewareConfig {
  /** Whether to include HSTS header (default: auto-detect based on NODE_ENV) */
  includeHSTS?: boolean;
}

/**
 * Hono middleware to apply security headers to all API responses
 *
 * @param config - Security middleware configuration
 * @returns Hono middleware handler
 *
 * @example
 * ```ts
 * import { securityMiddleware } from './middleware/security';
 *
 * // Apply to all routes
 * app.use('/*', securityMiddleware());
 *
 * // Apply with custom config
 * app.use('/*', securityMiddleware({ includeHSTS: false }));
 * ```
 *
 * @description
 * This middleware applies the following security headers:
 * - X-Frame-Options: DENY (prevents clickjacking)
 * - X-Content-Type-Options: nosniff (prevents MIME-sniffing)
 * - Strict-Transport-Security: max-age=31536000; includeSubDomains (production only, enforces HTTPS)
 * - Permissions-Policy: disables all browser features (geolocation, microphone, camera, etc.)
 * - Cross-Origin-Resource-Policy: same-site (controls cross-origin access)
 *
 * Headers are applied to all responses, including error responses and redirects.
 *
 * Note: Content-Security-Policy is NOT included because API endpoints don't render HTML.
 * Note: Referrer-Policy is NOT included because API responses don't have referrer context.
 * Note: Cross-Origin-Opener-Policy is NOT included because it's for HTML documents, not APIs.
 */
export function securityMiddleware(config: SecurityMiddlewareConfig = {}): MiddlewareHandler {
  // Get NODE_ENV from server environment
  const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : 'development';

  const { includeHSTS = nodeEnv === 'production' } = config;

  return async (c, next) => {
    // Wait for the route handler to complete
    await next();

    // Apply X-Frame-Options (clickjacking protection)
    c.header('X-Frame-Options', X_FRAME_OPTIONS);

    // Apply X-Content-Type-Options (MIME-sniffing protection)
    c.header('X-Content-Type-Options', X_CONTENT_TYPE_OPTIONS);

    // Apply Strict-Transport-Security (HTTPS enforcement) - production only
    if (includeHSTS) {
      const hsts = getHSTSHeader();
      if (hsts) {
        c.header('Strict-Transport-Security', hsts);
      }
    }

    // Apply Permissions-Policy (browser feature control)
    c.header('Permissions-Policy', getPermissionsPolicyHeader());

    // Apply Cross-Origin-Resource-Policy (cross-origin access control)
    c.header('Cross-Origin-Resource-Policy', CROSS_ORIGIN_RESOURCE_POLICY);
  };
}

/**
 * Individual header getters for advanced use cases
 *
 * @example
 * ```ts
 * import { getXFrameOptionsHeader, getHSTSHeader } from './middleware/security';
 *
 * // Apply individual headers manually
 * c.header('X-Frame-Options', getXFrameOptionsHeader());
 * ```
 */
export const getXFrameOptionsHeader = () => X_FRAME_OPTIONS;
export const getXContentTypeOptionsHeader = () => X_CONTENT_TYPE_OPTIONS;
export const getHSTSHeaderValue = getHSTSHeader;
export const getPermissionsPolicyHeaderValue = getPermissionsPolicyHeader;
export const getCrossOriginResourcePolicyHeader = () => CROSS_ORIGIN_RESOURCE_POLICY;
