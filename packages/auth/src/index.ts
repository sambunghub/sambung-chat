import { db } from '@sambung-chat/db';
import * as schema from '@sambung-chat/db/schema/auth';
import { env } from '@sambung-chat/env/server';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { genericOAuth, keycloak } from 'better-auth/plugins';

console.log('[BETTERAUTH] ===============================================');
console.log('[BETTERAUTH] Initializing Better Auth with Keycloak');
console.log('[BETTERAUTH] Keycloak URL:', env.KEYCLOAK_URL);
console.log('[BETTERAUTH] Keycloak Realm:', env.KEYCLOAK_REALM);
console.log('[BETTERAUTH] BetterAuth URL:', env.BETTER_AUTH_URL);
console.log('[BETTERAUTH] ===============================================');

// Check if email/password auth is enabled
const isEmailPasswordEnabled = env.EMAIL_PASSWORD_ENABLED !== 'false';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schema,
  }),
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: isEmailPasswordEnabled,
  },
  advanced: {
    cookiePrefix: 'sambungchat-auth',
    useSecureCookies: env.NODE_ENV === 'production',
    crossSubDomainCookies: {
      enabled: false,
    },
    sameSite: 'lax',
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
    },
  },
  plugins: [
    // Generic OAuth with Keycloak provider
    genericOAuth({
      config: [
        keycloak({
          clientId: env.KEYCLOAK_CLIENT_ID || '',
          clientSecret: env.KEYCLOAK_CLIENT_SECRET || '',
          issuer:
            env.KEYCLOAK_ISSUER || `${env.KEYCLOAK_URL || ''}/realms/${env.KEYCLOAK_REALM || ''}`,
        }),
      ],
    }),
  ],
});

console.log('[BETTERAUTH] ===============================================');
console.log('[BETTERAUTH] ✅ Better Auth Configuration Complete');
console.log('[BETTERAUTH] - Keycloak SSO:', env.KEYCLOAK_CLIENT_ID ? 'ENABLED' : 'DISABLED');
console.log('[BETTERAUTH] - Email/Password:', isEmailPasswordEnabled ? 'ENABLED' : 'DISABLED');
console.log('[BETTERAUTH] ===============================================');
