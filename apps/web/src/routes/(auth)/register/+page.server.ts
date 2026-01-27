import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Note: Auth check is now centralized in hooks.server.ts
  // This will only run if user is NOT authenticated (hooks redirect otherwise)

  // Check which authentication methods are enabled
  const isSSOEnabled = process.env.PUBLIC_KEYCLOAK_ENABLED === 'true';
  const isEmailPasswordEnabled =
    process.env.PUBLIC_EMAIL_PASSWORD_ENABLED !== 'false' &&
    process.env.EMAIL_PASSWORD_ENABLED !== 'false';

  return {
    title: 'Create Account - SambungChat',
    showSSO: isSSOEnabled,
    showEmailPassword: isEmailPasswordEnabled,
  };
};
