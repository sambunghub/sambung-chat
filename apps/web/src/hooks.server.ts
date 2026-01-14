import { auth } from '@sambung-chat/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // === DIAGNOSTIC LOGGING: Phase 1 - Root Cause Investigation ===
  console.log('[AUTH DEBUG] === Request Start ===');
  console.log('[AUTH DEBUG] Method:', event.request.method);
  console.log('[AUTH DEBUG] URL:', event.url.pathname);
  console.log('[AUTH DEBUG] Headers cookies:', event.request.headers.get('cookie'));

  try {
    // Fetch current session from Better Auth
    console.log('[AUTH DEBUG] Calling auth.api.getSession...');
    const session = await auth.api.getSession({
      headers: event.request.headers,
    });
    console.log('[AUTH DEBUG] getSession result:', session ? 'Session found' : 'No session');

    // Make session and user available on server
    if (session) {
      event.locals.session = session.session;
      event.locals.user = session.user;
      console.log('[AUTH DEBUG] Session set for user:', session.user?.email);
    }

    console.log('[AUTH DEBUG] Calling svelteKitHandler...');
    return svelteKitHandler({ event, resolve, auth, building });
  } catch (error) {
    // === DIAGNOSTIC LOGGING: Capture exact error ===
    console.error('[AUTH DEBUG] === ERROR in hooks.server.ts ===');
    console.error('[AUTH DEBUG] Error:', error);
    console.error(
      '[AUTH DEBUG] Error message:',
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      '[AUTH DEBUG] Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );

    // Re-throw to let SvelteKit handle it as 500 error
    throw error;
  }
};
