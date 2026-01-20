import type { Context as HonoContext } from 'hono';

import { auth } from '@sambung-chat/auth';

export type CreateContextOptions = {
  context: HonoContext;
};

/**
 * Extract client IP address from request headers
 *
 * Checks multiple headers in order of reliability:
 * 1. X-Forwarded-For (proxy)
 * 2. X-Real-IP (nginx)
 * 3. CF-Connecting-IP (Cloudflare)
 * 4. Fallback to remote address
 */
function getClientIp(context: HonoContext): string {
  // Check X-Forwarded-For header (may contain multiple IPs)
  const forwardedFor = context.req.raw.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP (original client)
    return forwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const realIp = context.req.raw.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Check Cloudflare header
  const cfConnectingIp = context.req.raw.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback: In production, this should be set by the server
  // For now, return a placeholder
  return 'unknown';
}

export async function createContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });

  const clientIp = getClientIp(context);

  return {
    session,
    clientIp,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
