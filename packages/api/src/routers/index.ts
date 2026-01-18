import type { RouterClient } from '@orpc/server';

import { protectedProcedure, publicProcedure } from '../index';
import { chatRouter } from './chat';
import { messageRouter } from './message';
import { folderRouter } from './folder';
import { modelRouter } from './model';

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
  chat: chatRouter,
  message: messageRouter,
  folder: folderRouter,
  model: modelRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
