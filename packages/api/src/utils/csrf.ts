import { env } from '@sambung-chat/env/server';
import crypto from 'node:crypto';

/**
 * Default CSRF token expiration time (1 hour in milliseconds)
 */
const DEFAULT_TOKEN_EXPIRATION = 60 * 60 * 1000;

/**
 * Generates a cryptographically secure CSRF token.
 *
 * The token is a combination of:
 * - A random 32-byte value (hex-encoded, 64 characters)
 * - A timestamp for expiration validation
 * - An HMAC signature using BETTER_AUTH_SECRET
 *
 * @returns Signed CSRF token string
 * @throws Error if BETTER_AUTH_SECRET is not configured
 *
 * @example
 * ```ts
 * const token = generateCsrfToken();
 * // Returns: "abc123...|1737360000|signature123..."
 * ```
 */
export function generateCsrfToken(): string {
  const secret = env.BETTER_AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters for CSRF protection');
  }

  // Generate cryptographically secure random token (32 bytes -> 64 hex chars)
  const randomToken = crypto.randomBytes(32).toString('hex');

  // Add timestamp for expiration
  const timestamp = Date.now();

  // Create the token payload
  const payload = `${randomToken}|${timestamp}`;

  // Sign the payload with HMAC using the secret
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  // Return format: token|timestamp|signature
  return `${payload}|${signature}`;
}

/**
 * Validates a CSRF token.
 *
 * Validation checks:
 * 1. Token format (must have 3 parts separated by |)
 * 2. Signature integrity (HMAC verification)
 * 3. Token expiration (default: 1 hour)
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param tokenString The CSRF token string to validate
 * @param maxAge Maximum token age in milliseconds (default: 1 hour)
 * @returns true if token is valid, false otherwise
 *
 * @example
 * ```ts
 * const isValid = validateCsrfToken(tokenFromRequest);
 * if (!isValid) {
 *   throw new Error('Invalid CSRF token');
 * }
 * ```
 */
export function validateCsrfToken(tokenString: string, maxAge: number = DEFAULT_TOKEN_EXPIRATION): boolean {
  const secret = env.BETTER_AUTH_SECRET;

  if (!secret || secret.length < 32) {
    console.error('[SECURITY] BETTER_AUTH_SECRET not configured for CSRF validation');
    return false;
  }

  // Check token format: must be "token|timestamp|signature"
  const parts = tokenString.split('|');
  if (parts.length !== 3) {
    console.warn('[SECURITY] CSRF token has invalid format');
    return false;
  }

  const [randomToken, timestampStr, providedSignature] = parts;

  // Verify timestamp is a valid number
  if (!timestampStr) {
    console.warn('[SECURITY] CSRF token has missing timestamp');
    return false;
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    console.warn('[SECURITY] CSRF token has invalid timestamp');
    return false;
  }

  // Verify signature is present
  if (!providedSignature) {
    console.warn('[SECURITY] CSRF token has missing signature');
    return false;
  }

  // Check token expiration
  const now = Date.now();
  const tokenAge = now - timestamp;
  if (tokenAge > maxAge) {
    console.warn(`[SECURITY] CSRF token expired (age: ${Math.floor(tokenAge / 1000)}s)`);
    return false;
  }

  // Reconstruct the payload for signature verification
  const payload = `${randomToken}|${timestamp}`;

  // Calculate expected signature
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  // Use constant-time comparison to prevent timing attacks
  // This prevents attackers from learning if their guess is partially correct
  let isValid = false;
  try {
    isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.warn('[SECURITY] CSRF token signature verification error:', error);
    return false;
  }

  if (!isValid) {
    console.warn('[SECURITY] CSRF token signature verification failed');
  }

  return isValid;
}

/**
 * Extracts the timestamp from a CSRF token for debugging/logging purposes.
 *
 * @param tokenString The CSRF token string
 * @returns Date object representing when the token was created, or null if invalid
 *
 * @example
 * ```ts
 * const createdAt = getCsrfTokenTimestamp(token);
 * console.log(`Token created at: ${createdAt.toISOString()}`);
 * ```
 */
export function getCsrfTokenTimestamp(tokenString: string): Date | null {
  const parts = tokenString.split('|');
  if (parts.length !== 3) {
    return null;
  }

  const timestampStr = parts[1];
  if (!timestampStr) {
    return null;
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp);
}

/**
 * Checks if a CSRF token is expired without validating the signature.
 *
 * Useful for pre-validation or logging purposes.
 *
 * @param tokenString The CSRF token string
 * @param maxAge Maximum token age in milliseconds (default: 1 hour)
 * @returns true if token is expired, false if valid or unable to determine
 *
 * @example
 * ```ts
 * if (isCsrfTokenExpired(token)) {
 *   // Fetch a new token
 * }
 * ```
 */
export function isCsrfTokenExpired(tokenString: string, maxAge: number = DEFAULT_TOKEN_EXPIRATION): boolean {
  const timestamp = getCsrfTokenTimestamp(tokenString);
  if (!timestamp) {
    return true; // Invalid format, consider as expired
  }

  const now = Date.now();
  const tokenAge = now - timestamp.getTime();
  return tokenAge > maxAge;
}
