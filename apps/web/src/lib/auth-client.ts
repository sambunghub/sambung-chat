import { createAuthClient } from 'better-auth/svelte';
import { genericOAuthClient } from 'better-auth/client/plugins';

// Use PUBLIC_API_URL from environment (backend URL)
const PUBLIC_API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

export const authClient = createAuthClient({
  baseURL: PUBLIC_API_URL,
  plugins: [genericOAuthClient()],
});
