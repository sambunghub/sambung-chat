/**
 * Security Headers Utility Module for SvelteKit
 *
 * This module provides centralized configuration for security headers to prevent
 * XSS, clickjacking, and other attacks. It follows OWASP guidelines and supports
 * security compliance requirements (SOC2, PCI-DSS).
 *
 * @see https://owasp.org/www-project-secure-headers/
 * @module security/headers
 */

/**
 * CSP (Content-Security-Policy) configuration
 *
 * @description
 * Controls which resources the user agent is allowed to load for a given page.
 * This is the most critical security header for preventing XSS attacks.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 * @see https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/11-Client-side_Testing/11-Testing_for_Content-Security_Policy
 */

/**
 * Environment-specific CSP configuration
 */
interface CSPConfig {
  /** Whether to use report-only mode (for testing) */
  reportOnly: boolean;
  /** Optional URI for receiving CSP violation reports */
  reportUri?: string;
  /** Additional sources for connect-src (API endpoints, Keycloak) */
  connectSources?: string[];
}

/**
 * Get the Content-Security-Policy header value
 *
 * @param config - CSP configuration options
 * @returns CSP header value
 *
 * @example
 * ```ts
 * const csp = getCSPHeader({ reportOnly: false });
 * // Returns: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; ..."
 * ```
 */
export function getCSPHeader(config: CSPConfig = { reportOnly: false }): string {
  // Get NODE_ENV from server environment
  // In Vite/SvelteKit dev mode, default to development for safety
  const nodeEnv =
    typeof process !== 'undefined' ? process.env.NODE_ENV || 'development' : 'development';
  const isDev = nodeEnv !== 'production'; // Treat non-production as development

  // Log CSP mode for debugging (remove in production if desired)
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.log(`[CSP] Mode: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'} (NODE_ENV=${nodeEnv})`);
  }

  // Get backend server URL for CSP connect-src
  // In development, allow direct connections to backend server (SERVER_PORT)
  // In production with proxy, PUBLIC_API_URL is sufficient
  let backendServerUrl = 'http://localhost:3000'; // Default fallback
  const serverPort = typeof process !== 'undefined' ? process.env.SERVER_PORT : undefined;
  const serverUrl = typeof process !== 'undefined' ? process.env.SERVER_URL : undefined;

  if (isDev) {
    // In development, always allow connections to backend server
    // Use SERVER_URL if provided, otherwise construct from SERVER_PORT
    if (serverUrl) {
      try {
        backendServerUrl = new URL(serverUrl).origin;
      } catch {
        backendServerUrl = `http://localhost:${serverPort || 3000}`;
      }
    } else {
      backendServerUrl = `http://localhost:${serverPort || 3000}`;
    }
  } else {
    // In production, backend is behind proxy, so use PUBLIC_API_URL
    const publicApiUrlEnv = typeof process !== 'undefined' ? process.env.PUBLIC_API_URL : undefined;
    if (publicApiUrlEnv) {
      try {
        backendServerUrl = new URL(publicApiUrlEnv).origin;
      } catch {
        backendServerUrl = 'http://localhost:3000';
      }
    }
  }

  // Get Keycloak URL from server environment, with defensive error handling
  let keycloakUrl = '';
  const keycloakUrlEnv = typeof process !== 'undefined' ? process.env.KEYCLOAK_URL : undefined;
  if (keycloakUrlEnv) {
    try {
      keycloakUrl = new URL(keycloakUrlEnv).origin;
    } catch {
      // If KEYCLOAK_URL is malformed, fall back to empty string
      console.warn('[SECURITY] Invalid KEYCLOAK_URL, ignoring');
      keycloakUrl = '';
    }
  }

  // Build connect-src with API endpoints and Keycloak
  const connectSources = [
    "'self'", // Same origin (frontend)
    backendServerUrl, // Backend API server
    keycloakUrl, // Keycloak OAuth
    ...(config.connectSources || []),
  ]
    .filter(Boolean)
    .join(' ');

  // Build CSP directives based on OWASP recommendations
  const directives = [
    // Default policy for all content types
    `default-src 'self'`,

    // Scripts: Allow same-origin and Mermaid.js CDN for diagrams
    // Allow unsafe-eval and unsafe-inline in development for Vite HMR
    `script-src 'self' https://cdn.jsdelivr.net${isDev ? " 'unsafe-eval' 'unsafe-inline'" : ''}`,

    // Workers: Allow blob: URLs for Vite HMR module workers in development
    ...(isDev ? [`worker-src 'self' blob:`] : [`worker-src 'self'`]),

    // Styles: Allow inline styles for shadcn-svelte components
    `style-src 'self' 'unsafe-inline'`,

    // Images: Allow data URLs (for avatars) and HTTPS
    `img-src 'self' data: https:`,

    // Connect: Allow API calls to backend and Keycloak
    `connect-src ${connectSources}`,

    // Fonts: Only allow same-origin (no external fonts)
    `font-src 'self'`,

    // Objects: Disallow plugins (Flash, etc.)
    `object-src 'none'`,

    // Base URL: Restrict base tag to same origin
    `base-uri 'self'`,

    // Form actions: Only allow same-origin form submissions
    `form-action 'self'`,

    // Frame ancestors: Prevent embedding in iframes (clickjacking protection)
    `frame-ancestors 'none'`,

    // Upgrade insecure requests: Automatically upgrade HTTP to HTTPS
    // Only apply in production to avoid breaking local HTTP/HMR workflows
    ...(isDev ? [] : ['upgrade-insecure-requests']),

    // Block all mixed content: Prevent HTTP resources on HTTPS pages
    // Only apply in production to avoid breaking local HTTP/HMR workflows
    ...(isDev ? [] : ['block-all-mixed-content']),
  ];

  // Add report-uri if provided
  if (config.reportUri) {
    directives.push(`report-uri ${config.reportUri}`);
  }

  return directives.join('; ');
}

/**
 * Get the CSP header name based on report-only mode
 *
 * @param reportOnly - Whether to use report-only mode
 * @returns Header name ('Content-Security-Policy' or 'Content-Security-Policy-Report-Only')
 */
export function getCSPHeaderName(reportOnly = false): string {
  return reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
}

/**
 * X-Frame-Options header value
 *
 * @description
 * Prevents clickjacking attacks by controlling whether the page can be embedded in iframes.
 * DEPRECATED: Use CSP frame-ancestors instead, but include for backward compatibility.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
 */
export const X_FRAME_OPTIONS = 'DENY';

/**
 * X-Content-Type-Options header value
 *
 * @description
 * Prevents MIME-sniffing attacks by forcing the browser to use the declared content type.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
 */
export const X_CONTENT_TYPE_OPTIONS = 'nosniff';

/**
 * Strict-Transport-Security (HSTS) header value
 *
 * @description
 * Enforces HTTPS connections and prevents man-in-the-middle attacks.
 * Only applied in production to avoid issues with local HTTP development.
 *
 * @returns HSTS header value or empty string if not in production
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
 * @see https://owasp.org/www-project-secure-headers/#hsts
 */
export function getHSTSHeader(): string {
  // Get NODE_ENV from server environment
  const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : 'development';

  // Only apply HSTS in production with HTTPS
  if (nodeEnv === 'production') {
    return 'max-age=31536000; includeSubDomains; preload';
  }
  // Return empty string in development/test (will be filtered out)
  return '';
}

/**
 * Permissions-Policy header value
 *
 * @description
 * Controls which browser features and APIs can be used in the browser.
 * Disables sensitive features that are not needed by the application.
 *
 * @returns Permissions-Policy header value
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy
 */
export function getPermissionsPolicyHeader(): string {
  const policies = [
    // Geolocation: Allow same-origin only (if needed)
    'geolocation=(self)',

    // Microphone: Disable (not needed)
    'microphone=()',

    // Camera: Disable (not needed)
    'camera=()',

    // Payment: Disable (not needed)
    'payment=()',

    // USB: Disable (not needed)
    'usb=()',

    // Magnetometer: Disable (not needed)
    'magnetometer=()',

    // Gyroscope: Disable (not needed)
    'gyroscope=()',

    // XR/VR: Disable (not needed)
    // Use xr-spatial-tracking instead of deprecated vr/xr
    'xr-spatial-tracking=()',
  ];

  return policies.join(', ');
}

/**
 * Referrer-Policy header value
 *
 * @description
 * Controls how much referrer information is sent with navigation requests.
 * Prevents leaking sensitive URLs in the Referer header.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
 */
export const REFERRER_POLICY = 'strict-origin-when-cross-origin';

/**
 * Cross-Origin-Opener-Policy header value
 *
 * @description
 * Isolates the browsing context to prevent cross-origin attacks.
 * Provides process-level isolation for same-origin pages.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy
 */
export const CROSS_ORIGIN_OPENER_POLICY = 'same-origin';

/**
 * Configuration for getting all security headers
 */
interface SecurityHeadersConfig {
  /** CSP report-only mode (default: false) */
  cspReportOnly?: boolean;
  /** CSP violation report URI (optional) */
  cspReportUri?: string;
  /** Whether to include HSTS (default: auto-detect based on NODE_ENV) */
  includeHSTS?: boolean;
}

/**
 * Get all security headers for SvelteKit responses
 *
 * @param config - Security headers configuration
 * @returns Record of header name to header value
 *
 * @example
 * ```ts
 * import { getSecurityHeaders } from '$lib/security/headers';
 *
 * // In hooks.server.ts:
 * export const handle: Handle = async ({ event, resolve }) => {
 *   const response = await resolve(event);
 *   const headers = getSecurityHeaders();
 *
 *   // Apply headers to response
 *   response.headers.set('Content-Security-Policy', headers['Content-Security-Policy']);
 *   // ... apply other headers
 *
 *   return response;
 * };
 * ```
 */
export function getSecurityHeaders(config: SecurityHeadersConfig = {}): Record<string, string> {
  // Get NODE_ENV from server environment
  const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : 'development';

  const { cspReportOnly = false, cspReportUri, includeHSTS = nodeEnv === 'production' } = config;

  const headers: Record<string, string> = {};

  // Content-Security-Policy (most critical)
  const cspHeaderName = getCSPHeaderName(cspReportOnly);
  headers[cspHeaderName] = getCSPHeader({ reportOnly: cspReportOnly, reportUri: cspReportUri });

  // X-Frame-Options (clickjacking protection)
  headers['X-Frame-Options'] = X_FRAME_OPTIONS;

  // X-Content-Type-Options (MIME-sniffing protection)
  headers['X-Content-Type-Options'] = X_CONTENT_TYPE_OPTIONS;

  // Strict-Transport-Security (HTTPS enforcement)
  if (includeHSTS) {
    const hsts = getHSTSHeader();
    if (hsts) {
      headers['Strict-Transport-Security'] = hsts;
    }
  }

  // Permissions-Policy (browser feature control)
  headers['Permissions-Policy'] = getPermissionsPolicyHeader();

  // Referrer-Policy (referrer information control)
  headers['Referrer-Policy'] = REFERRER_POLICY;

  // Cross-Origin-Opener-Policy (browsing context isolation)
  headers['Cross-Origin-Opener-Policy'] = CROSS_ORIGIN_OPENER_POLICY;

  return headers;
}

/**
 * Type definition for security headers
 */
export type SecurityHeaders = ReturnType<typeof getSecurityHeaders>;
