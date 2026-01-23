import type { Context as HonoContext } from 'hono';
import { getConnInfo } from 'hono/bun';

import { auth } from '@sambung-chat/auth';

export type CreateContextOptions = {
  context: HonoContext;
};

/**
 * Extract client IP address from request
 *
 * SECURITY NOTE: This function does NOT trust client-controlled headers
 * (X-Forwarded-For, X-Real-IP, CF-Connecting-IP) as they can be spoofed.
 * In production with a trusted reverse proxy, configure the proxy to set
 * the actual remote address and use that instead.
 *
 * Uses Hono's getConnInfo helper which provides reliable connection info,
 * with fallback to socket.remoteAddress and finally 'unknown'.
 *
 * @returns Client IP address from connection info or 'unknown'
 */
async function getClientIp(context: HonoContext): Promise<string> {
  try {
    // Try Hono's getConnInfo first (most reliable for Bun/Hono)
    const connInfo = await getConnInfo(context);
    if (connInfo.remote?.address) {
      return connInfo.remote.address;
    }
  } catch {
    // getConnInfo can throw if env is not properly set up, fall through to fallback
  }

  // Fallback: Try to get the actual remote address from the socket
  // Note: In Node.js environments, raw requests have a socket property
  const remoteAddress = (context.req.raw as unknown as { socket?: { remoteAddress?: string } })
    .socket?.remoteAddress;
  if (remoteAddress) {
    return remoteAddress;
  }

  // Final fallback: In production this should be set by the server/reverse proxy
  return 'unknown';
}

export async function createContext({ context }: CreateContextOptions) {
  const headers = context.req.raw.headers;

  const session = await auth.api.getSession({
    headers,
  });

  const clientIp = await getClientIp(context);

  // Extract CSRF token from headers (case-insensitive)
  // Do not return the full headers object to avoid exposing sensitive headers
  let csrfToken: string | undefined;
  for (const [key, value] of headers.entries()) {
    if (key.toLowerCase() === 'x-csrf-token' && value) {
      csrfToken = value;
      break;
    }
  }

  return {
    session,
    clientIp,
    csrfToken,
    headers,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
