import type { RouterClient } from '@orpc/server';

import { ORPCError } from '@orpc/server';
import { protectedProcedure, publicProcedure } from '../index';
import { chatRouter } from './chat';
import { messageRouter } from './message';
import { folderRouter } from './folder';
import { modelRouter } from './model';
import { apiKeyRouter } from './api-keys';
import { generateCsrfToken } from '../utils/csrf';
import { csrfRateLimiter } from '../utils/rate-limiter';

// NOTE: Example routers are in _example/ folder for reference only
// They are NOT exported to production API
// See _example/todo.ts for ORPC implementation examples

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return 'OK';
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: 'This is private',
      user: context.session?.user,
    };
  }),

  // CSRF token endpoint - public but only returns token for authenticated users
  getCsrfToken: publicProcedure.handler(async ({ context }) => {
    // Use IP address for rate limiting anonymous users
    // Use user ID for rate limiting authenticated users
    const rateLimitKey = context.session?.user?.id || context.clientIp || 'anonymous';

    // Check rate limit
    if (!csrfRateLimiter.checkLimit(rateLimitKey)) {
      throw new ORPCError('TOO_MANY_REQUESTS', {
        message: 'Too many CSRF token requests. Please try again later.',
      });
    }

    // Only return token for authenticated users
    if (!context.session?.user) {
      return {
        token: null,
        authenticated: false,
      };
    }

    // Generate and return CSRF token
    const token = generateCsrfToken();

    return {
      token,
      authenticated: true,
      expiresIn: 3600, // 1 hour in seconds
    };
  }),

  chat: chatRouter,
  message: messageRouter,
  folder: folderRouter,
  model: modelRouter,
  apiKey: apiKeyRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
