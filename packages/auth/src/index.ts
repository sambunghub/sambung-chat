import { db } from '@sambung-chat/db';
import * as schema from '@sambung-chat/db/schema/auth';
import { env } from '@sambung-chat/env/server';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

// In development, use laxer cookie settings for localhost
// In production, use secure cookie settings
const isDevelopment = env.NODE_ENV === 'development';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: isDevelopment
      ? {
          // Development: lax settings for localhost
          sameSite: 'lax',
          secure: false,
          httpOnly: true,
        }
      : {
          // Production: secure settings for HTTPS
          sameSite: 'none',
          secure: true,
          httpOnly: true,
        },
  },
  plugins: [],
});
