import { auth } from '@sambung-chat/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { getSecurityHeaders } from '$lib/security/headers';

/**
 * Apply security headers to a Response object
 *
 * This helper function ensures all responses, including redirects,
 * have security headers applied to maintain consistent security posture.
 *
 * @param response - The response to apply headers to
 * @returns Response with security headers applied
 */
function applySecurityHeaders(response: Response): Response {
  const securityHeaders = getSecurityHeaders();
  for (const [name, value] of Object.entries(securityHeaders)) {
    response.headers.set(name, value);
  }
  return response;
}

export const handle: Handle = async ({ event, resolve }) => {
  // Fetch current session from Better Auth
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  // Make session and user available on server
  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  // Centralized auth redirect logic
  const path = event.url.pathname;
  const isLoggedIn = !!event.locals.user;

  // Protected routes (/app/*) - redirect to login if not logged in
  if (!isLoggedIn && path.startsWith('/app/')) {
    const response = new Response(null, {
      status: 302,
      headers: { Location: '/login' },
    });
    return applySecurityHeaders(response);
  }

  // Auth routes (login, register) - redirect to app if already logged in
  // Note: /logout is excluded - should always be accessible
  if (isLoggedIn && (path === '/login' || path === '/register')) {
    const response = new Response(null, {
      status: 302,
      headers: { Location: '/app/chat' },
    });
    return applySecurityHeaders(response);
  }

  // Root route - redirect based on auth state
  if (path === '/') {
    if (isLoggedIn) {
      const response = new Response(null, {
        status: 302,
        headers: { Location: '/app/chat' },
      });
      return applySecurityHeaders(response);
    } else {
      const response = new Response(null, {
        status: 302,
        headers: { Location: '/login' },
      });
      return applySecurityHeaders(response);
    }
  }

  // Let Better Auth handle the request
  const response = await svelteKitHandler({ event, resolve, auth, building });

  // Apply security headers to the response
  return applySecurityHeaders(response);
};
