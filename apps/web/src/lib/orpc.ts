import type { AppRouterClient } from '@sambung-chat/api/routers/index';

import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { QueryCache, QueryClient } from '@tanstack/svelte-query';

// Use PUBLIC_API_URL from environment (backend URL)
const PUBLIC_API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error(`Error: ${error.message}`);
    },
  }),
});

export const link = new RPCLink({
  url: `${PUBLIC_API_URL}/rpc`,
  fetch(url, options) {
    return fetch(url, {
      ...options,
      credentials: 'include',
    });
  },
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
