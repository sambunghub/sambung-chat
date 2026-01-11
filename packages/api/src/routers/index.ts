import type { RouterClient } from '@orpc/server';

import { protectedProcedure, publicProcedure } from '../index';
import { todoRouter } from './todo';
import { chatRouter } from './chat';
import { messageRouter } from './message';

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
  todo: todoRouter,
  chat: chatRouter,
  message: messageRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
