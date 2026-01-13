import { PUBLIC_SERVER_URL } from '$env/static/public';
import { createAuthClient } from 'better-auth/svelte';
import { genericOAuthClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: PUBLIC_SERVER_URL,
  plugins: [genericOAuthClient()],
});
