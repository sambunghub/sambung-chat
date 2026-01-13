import { devToolsMiddleware } from '@ai-sdk/devtools';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins';
import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { createContext } from '@sambung-chat/api/context';
import { appRouter } from '@sambung-chat/api/routers/index';
import { auth } from '@sambung-chat/auth';
import { env } from '@sambung-chat/env/server';
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Test route - should be the first route registered
app.get('/test', (c) => {
  console.log('[TEST] Test route called!');
  return c.json({ message: 'Test route works', timestamp: Date.now() });
});

// ============================================================================
// CORS - Must be registered before auth handler
// ============================================================================
app.use(
  '/*',
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ============================================================================
// BETTER AUTH HANDLER
// ============================================================================
// According to Hono + Better Auth examples:
// https://hono.dev/examples/better-auth
// auth.handler() returns a Response directly
// ============================================================================
app.all('/api/auth/*', (c) => {
  console.log('[AUTH] Handler called:', c.req.method, c.req.url);
  try {
    return auth.handler(c.req.raw);
  } catch (error) {
    console.error('[AUTH] Error:', error);
    throw error;
  }
});

// ============================================================================
// RPC & API HANDLERS
// ============================================================================
// These handle the ORPC handlers for /rpc and /api-reference routes
// IMPORTANT: This middleware should NOT interfere with /api/auth/* routes
// because those are handled by the app.on() route handler above which runs
// AFTER the middleware chain completes.
// ============================================================================
export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error('[API ERROR]:', error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error('[RPC ERROR]:', error);
    }),
  ],
});

// Only apply this middleware to non-auth routes
app.use('/ai', async (c, next) => {
  const context = await createContext({ context: c });
  c.set('context', context);
  await next();
});

app.use('/rpc/*', async (c, next) => {
  const context = await createContext({ context: c });
  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: '/rpc',
    context: context,
  });
  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }
  await next();
});

app.use('/api-reference/*', async (c, next) => {
  const context = await createContext({ context: c });
  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: '/api-reference',
    context: context,
  });
  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }
  await next();
});

// ============================================================================
// AI ENDPOINT
// ============================================================================
const openai = createOpenAICompatible({
  name: 'openai-compatible',
  baseURL: env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  apiKey: env.OPENAI_API_KEY ?? '',
});

app.post('/ai', async (c) => {
  const body = await c.req.json();
  const uiMessages = body.messages || [];
  const model = wrapLanguageModel({
    model: openai(env.OPENAI_MODEL ?? 'gpt-4o-mini'),
    middleware: devToolsMiddleware(),
  });
  const result = streamText({
    model,
    messages: await convertToModelMessages(uiMessages),
  });

  return result.toUIMessageStreamResponse();
});

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/', (c) => {
  console.log('[ROOT] Root endpoint called');
  return c.text('OK');
});

// Debug endpoint to test handler
app.get('/debug', (c) => {
  console.log('[DEBUG] Debug endpoint called');
  return c.json({ message: 'Debug works', time: new Date().toISOString() });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================
// Bun runtime uses export default with port and fetch properties
// ============================================================================
const port = env.PORT || 3000;

console.log(`[SERVER] Configured for port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
