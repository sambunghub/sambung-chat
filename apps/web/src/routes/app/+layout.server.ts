import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
  // Note: Auth check is now centralized in hooks.server.ts
  // This will only run if user is authenticated (hooks redirect otherwise)

  return {
    user: event.locals.user,
    session: event.locals.session,
  };
};
