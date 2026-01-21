import type { AppRouterClient } from '@sambung-chat/api/routers/index';

import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

// Get API URL dynamically - use same origin for cookie forwarding
const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    // CSR: Use current origin for same-origin requests (cookies work)
    // e.g., "http://localhost:5174"
    return window.location.origin;
  }
  // SSR: Need full URL from env
  return import.meta.env.PUBLIC_API_URL || 'http://localhost:5174';
};

// Initial API URL (will be updated in browser if needed)
let API_URL = getApiUrl();

// Update API URL when DOM is ready
if (typeof window !== 'undefined') {
  // Ensure we have the correct origin after page load
  API_URL = window.location.origin;
}

/**
 * CSRF Token Manager
 *
 * Manages CSRF tokens in-memory for security.
 * Tokens are never stored in localStorage to prevent XSS attacks.
 */
class CsrfTokenManager {
  private token: string | null = null;
  private tokenPromise: Promise<string | null> | null = null;
  private isRefreshing = false;

  /**
   * Fetch a new CSRF token from the server using the ORPC protocol
   */
  private async fetchToken(): Promise<string | null> {
    try {
      const response = await fetch(`${API_URL}/rpc/getCsrfToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        console.warn('[CSRF] Failed to fetch CSRF token:', response.status);
        return null;
      }

      const data = await response.json();

      // The response structure from getCsrfToken endpoint
      // ORPC wraps responses in { json: { ... } }
      if (data.json && data.json.authenticated && data.json.token) {
        this.token = data.json.token;
        console.info('[CSRF] Token fetched successfully');
        return this.token;
      }

      // User not authenticated, that's okay
      if (data.json && !data.json.authenticated) {
        console.info('[CSRF] User not authenticated, no token needed yet');
        return null;
      }

      return null;
    } catch (error) {
      console.warn('[CSRF] Error fetching CSRF token:', error);
      return null;
    }
  }

  /**
   * Get the current CSRF token, fetching one if necessary
   */
  async getToken(): Promise<string | null> {
    // Return existing token if available
    if (this.token) {
      return this.token;
    }

    // If already fetching, wait for that request
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    // Fetch a new token
    this.tokenPromise = this.fetchToken().finally(() => {
      this.tokenPromise = null;
    });

    return this.tokenPromise;
  }

  /**
   * Invalidate the current token (e.g., after 403 error)
   */
  invalidateToken(): void {
    this.token = null;
  }

  /**
   * Refresh the token (fetch a new one)
   */
  async refreshToken(): Promise<string | null> {
    this.invalidateToken();
    return this.getToken();
  }
}

// Global CSRF token manager instance
const csrfManager = new CsrfTokenManager();

/**
 * Detect if a request is a mutation (state-changing operation)
 * Mutations typically use POST/PUT/PATCH/DELETE methods
 */
function isMutationRequest(method: string = 'POST'): boolean {
  // ORPC uses POST for all RPC calls by default
  // We need to check the procedure path to determine if it's a mutation
  return true; // Default to treating all as mutations for safety
}

/**
 * Custom RPCLink that adds CSRF token to requests
 */
export const link = new RPCLink({
  url: `${API_URL}/rpc`,
  async fetch(url, options) {
    // Clone options to avoid mutation
    const modifiedOptions: RequestInit = {
      ...options,
      credentials: 'include',
    };

    // Add CSRF token to request headers
    const csrfToken = await csrfManager.getToken();

    if (csrfToken) {
      modifiedOptions.headers = {
        ...modifiedOptions.headers,
        'X-CSRF-Token': csrfToken,
      };
    }

    // Make the request
    let response = await fetch(url, modifiedOptions);

    // Handle 403 Forbidden errors (potentially expired/invalid CSRF token)
    if (response.status === 403 && csrfToken) {
      // Try refreshing the token and retrying once
      const newToken = await csrfManager.refreshToken();

      if (newToken) {
        console.info('[CSRF] Retrying request with fresh token');

        modifiedOptions.headers = {
          ...modifiedOptions.headers,
          'X-CSRF-Token': newToken,
        };

        response = await fetch(url, modifiedOptions);
      }
    }

    return response;
  },
});

export const client: AppRouterClient = createORPCClient(link);

// Simple wrapper for ORPC calls without TanStack
export const orpc = client;

// Export CSRF manager for manual token refresh if needed
export { csrfManager };
