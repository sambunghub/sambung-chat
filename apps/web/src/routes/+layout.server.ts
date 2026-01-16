import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
  // Provide user data to all routes from event.locals (populated by hooks.server.ts)
  return {
    user: event.locals.user,
    session: event.locals.session,
  };
};
