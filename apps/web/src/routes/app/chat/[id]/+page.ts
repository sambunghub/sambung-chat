import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  // Note: Chat data is loaded on the client side for streaming support
  // We only set the page title here
  return {
    title: 'Chat - SambungChat',
  };
};
