import { db } from '@sambung-chat/db';
import * as schema from '@sambung-chat/db/schema/auth';
import { env } from '@sambung-chat/env/server';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { genericOAuth, keycloak } from 'better-auth/plugins';

// === DIAGNOSTIC LOGGING: Phase 1 - Root Cause Investigation ===
console.log('[AUTH CONFIG] === Initializing Better Auth ===');
console.log('[AUTH CONFIG] DATABASE_URL:', env.DATABASE_URL ? 'Set' : 'NOT SET');
console.log('[AUTH CONFIG] BETTER_AUTH_URL:', env.BETTER_AUTH_URL);
console.log('[AUTH CONFIG] CORS_ORIGIN:', env.CORS_ORIGIN);
console.log('[AUTH CONFIG] EMAIL_PASSWORD_ENABLED:', env.EMAIL_PASSWORD_ENABLED);

// Keycloak configuration logging
console.log('[AUTH CONFIG] KEYCLOAK_CLIENT_ID:', env.KEYCLOAK_CLIENT_ID ? 'Set' : 'NOT SET');
console.log(
  '[AUTH CONFIG] KEYCLOAK_CLIENT_SECRET:',
  env.KEYCLOAK_CLIENT_SECRET ? 'Set' : 'NOT SET'
);
console.log('[AUTH CONFIG] KEYCLOAK_URL:', env.KEYCLOAK_URL);
console.log('[AUTH CONFIG] KEYCLOAK_REALM:', env.KEYCLOAK_REALM);
console.log('[AUTH CONFIG] KEYCLOAK_ISSUER:', env.KEYCLOAK_ISSUER);

// Check if email/password auth is enabled
const isEmailPasswordEnabled = env.EMAIL_PASSWORD_ENABLED !== 'false';

const keycloakIssuer =
  env.KEYCLOAK_ISSUER || `${env.KEYCLOAK_URL || ''}/realms/${env.KEYCLOAK_REALM || ''}`;
console.log('[AUTH CONFIG] Final Keycloak issuer:', keycloakIssuer);

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
      sameSite: 'lax', // Use 'lax' for localhost (works with Vite proxy on same domain)
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

console.log('[AUTH CONFIG] Better Auth initialized successfully');
