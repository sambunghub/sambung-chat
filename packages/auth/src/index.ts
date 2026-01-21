import { db } from '@sambung-chat/db';
import * as schema from '@sambung-chat/db/schema/auth';
import { env, getValidatedSameSiteSetting } from '@sambung-chat/env/server';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { genericOAuth, keycloak } from 'better-auth/plugins';

// Check if email/password auth is enabled
const isEmailPasswordEnabled = env.EMAIL_PASSWORD_ENABLED !== 'false';

const keycloakIssuer =
  env.KEYCLOAK_ISSUER || `${env.KEYCLOAK_URL || ''}/realms/${env.KEYCLOAK_REALM || ''}`;

// Get and log the validated SameSite cookie setting
const sameSiteSetting = getValidatedSameSiteSetting();
console.log('[AUTH CONFIG] SameSite cookie setting:', sameSiteSetting);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schema,
  }),
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'],
  emailAndPassword: {
    enabled: isEmailPasswordEnabled,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache for 5 minutes to reduce DB calls
    },
  },
  advanced: {
    cookiePrefix: 'sambungchat-auth',
    useSecureCookies: env.NODE_ENV === 'production',
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      sameSite: sameSiteSetting, // Use validated setting from environment (strict in production, lax in development)
      secure: env.NODE_ENV === 'production', // Secure cookies only in production
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    },
  },
  plugins: [
    // Generic OAuth with Keycloak provider
    genericOAuth({
      config: [
        keycloak({
          clientId: env.KEYCLOAK_CLIENT_ID || '',
          clientSecret: env.KEYCLOAK_CLIENT_SECRET || '',
          issuer: keycloakIssuer,
        }),
      ],
    }),
  ],
});
