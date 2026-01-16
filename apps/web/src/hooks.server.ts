import { auth } from '@sambung-chat/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

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
    return redirect(302, '/login');
  }

  // Auth routes (login, register) - redirect to app if already logged in
  // Note: /logout is excluded - should always be accessible
  if (isLoggedIn && (path === '/login' || path === '/register')) {
    return redirect(302, '/app/chat');
  }

  // Root route - redirect based on auth state
  if (path === '/') {
    if (isLoggedIn) {
      return redirect(302, '/app/chat');
    } else {
      return redirect(302, '/login');
    }
  }
  return svelteKitHandler({ event, resolve, auth, building });
};
