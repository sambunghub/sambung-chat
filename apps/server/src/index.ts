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
app.all('/api/auth/*', async (c) => {
  try {
    const response = await auth.handler(c.req.raw);

    // For non-error responses, pass through directly (important for OAuth redirects)
    if (response.status < 400) {
      return response;
    }

    // For error responses, check if it's a redirect (3xx) which might be OAuth flow
    if (response.status >= 300 && response.status < 400) {
      return response;
    }

    // For other errors (4xx, 5xx), return the response as-is
    return response;
  } catch (error) {
    // Return error as JSON for unexpected exceptions
    return c.json(
      {
        error: 'Auth handler error',
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
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
  await createContext({ context: c });
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
  try {
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

    // Use Hono's streaming API with AI SDK
    const response = result.toUIMessageStreamResponse();

    // Convert AI SDK response to Hono-compatible response
    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('[AI] Error:', error);
    return c.json(
      {
        error: 'Failed to process AI request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/', (c) => {
  return c.text('OK');
});

// Test database connection
app.get('/debug/db', async (c) => {
  try {
    const { db } = await import('@sambung-chat/db');
    const result = await db.execute('SELECT 1 as test');
    return c.json({ success: true, result: result.rows });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Test Better Auth instance
app.get('/debug/auth', async (c) => {
  try {
    const { auth } = await import('@sambung-chat/auth');
    return c.json({
      success: true,
      authExists: !!auth,
      hasHandler: typeof auth.handler === 'function',
      hasAPI: typeof auth.api === 'object',
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Debug endpoint to test handler
app.get('/debug', (c) => {
  return c.json({ message: 'Debug works', time: new Date().toISOString() });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================
// Bun runtime uses export default with port and fetch properties
// ============================================================================
const port = env.PORT || 3000;

export default {
  port,
  fetch: app.fetch,
  // Increase timeout for AI requests (default is 10 seconds)
  idleTimeout: 120, // 2 minutes
};
