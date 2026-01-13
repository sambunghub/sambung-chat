import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Check which authentication methods are enabled
  // Read directly from process.env which is available in SSR
  const isSSOEnabled = process.env.PUBLIC_KEYCLOAK_ENABLED === 'true';
  // Check both PUBLIC_ and non-PUBLIC_ variants for flexibility
  const isEmailPasswordEnabled =
    process.env.PUBLIC_EMAIL_PASSWORD_ENABLED !== 'false' &&
    process.env.EMAIL_PASSWORD_ENABLED !== 'false';

  return {
    showSSO: isSSOEnabled,
    showEmailPassword: isEmailPasswordEnabled,
  };
};
