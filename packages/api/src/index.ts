import { ORPCError, os } from '@orpc/server';

import type { Context } from './context';
import { validateCsrfToken } from './utils/csrf';

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError('UNAUTHORIZED');
  }
  return next({
    context: {
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

/**
 * CSRF protection middleware for state-changing operations.
 *
 * Validates CSRF tokens extracted from the X-CSRF-Token header.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @example
 * ```ts
 * const mutationProcedure = protectedProcedure.use(withCsrfProtection);
 * ```
 *
 * @throws {ORPCError} FORBIDDEN if CSRF token is missing or invalid
 */
const withCsrfProtection = o.middleware(async ({ context, next }) => {
  // CSRF token is already extracted in createContext (case-insensitive)
  const csrfToken = context.csrfToken;

  // Check if token is present
  if (!csrfToken) {
    console.warn('[SECURITY] CSRF token missing from request headers');
    throw new ORPCError('FORBIDDEN', {
      message: 'CSRF token is required for this operation',
    });
  }

  // Validate the token
  const isValid = validateCsrfToken(csrfToken);

  if (!isValid) {
    console.warn('[SECURITY] Invalid CSRF token provided');
    throw new ORPCError('FORBIDDEN', {
      message: 'Invalid CSRF token. Please refresh and try again.',
    });
  }

  // Token is valid, proceed with the request
  return next();
});

export { withCsrfProtection };
