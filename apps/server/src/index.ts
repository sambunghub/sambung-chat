console.log('[SERVER LOADING] index.ts is being executed...');

import { devToolsMiddleware } from '@ai-sdk/devtools';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins';
import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { createContext } from '@sambung-chat/api/context';
import { appRouter } from '@sambung-chat/api/routers/index';
import { auth } from '@sambung-chat/auth';
import { env, getValidatedCorsOrigins } from '@sambung-chat/env/server';
import { createAIProvider, type ProviderConfig } from '@sambung-chat/api/lib/ai-provider-factory';
import { decrypt } from '@sambung-chat/api/lib/encryption';
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

const app = new Hono();
const APP_ID = crypto.randomUUID();
console.log('[INIT] Created Hono app with ID:', APP_ID);

// ============================================================================
// AI Provider Schema
// ============================================================================

// Zod schema for validating AI provider values from database
const aiProviderSchema = z.enum([
  'openai',
  'anthropic',
  'google',
  'groq',
  'ollama',
  'openrouter',
  'custom',
]);

// ============================================================================
// CORS - Must be registered before auth handler
// ============================================================================
// Validate and sanitize CORS origins on startup
const allowedOrigins = getValidatedCorsOrigins();

// Handle wildcard CORS: if '*' is in allowed origins, echo the request's Origin
// Otherwise, use the validated origins array
const corsOrigin =
  allowedOrigins.length === 1 && allowedOrigins[0] === '*'
    ? // Echo the incoming Origin header for wildcard
      (origin: string) => origin
    : // Use the validated origins array
      allowedOrigins;

app.use(
  '/*',
  cors({
    origin: corsOrigin,
    allowMethods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie', 'X-CSRF-Token'],
    exposeHeaders: ['Set-Cookie', 'Content-Length', 'Content-Type'],
    credentials: true,
    maxAge: 86400,
  })
);

// Custom middleware to manually set Access-Control-Allow-Origin header
// This fixes a bug in Hono's CORS middleware where the header is not set on actual endpoints
// Must be AFTER the CORS middleware to ensure the header is set
console.log('[INIT] Registering global CORS middleware...');
app.use('/*', async (c, next) => {
  console.log('[CORS FIX] Middleware called!');
  const requestOrigin = c.req.header('Origin');

  // Set Access-Control-Allow-Origin header
  if (requestOrigin) {
    // Check if the origin is allowed
    const isAllowed =
      allowedOrigins.length === 1 && allowedOrigins[0] === '*'
        ? true
        : allowedOrigins.includes(requestOrigin);

    if (isAllowed) {
      console.log('[CORS FIX] Setting Access-Control-Allow-Origin:', requestOrigin);
      c.header('Access-Control-Allow-Origin', requestOrigin);
    } else {
      console.log('[CORS FIX] Origin NOT allowed:', requestOrigin);
    }
  } else {
    console.log('[CORS FIX] No Origin header in request');
  }

  await next();
  console.log('[CORS FIX] Request completed, response status:', c.res.status);
});
console.log('[INIT] Global CORS middleware registered');

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

// RPC middleware - applies context to RPC routes
console.log('[INIT] Registering RPC middleware...');
app.use('/rpc/*', async (c, next) => {
  console.log('[RPC CORS] Middleware called!');
  // Fix: Set Access-Control-Allow-Origin header for RPC requests
  // This fixes a bug in Hono's CORS middleware where the header is not set on actual endpoints
  const requestOrigin = c.req.header('Origin');
  console.log('[RPC CORS] Origin:', requestOrigin);
  if (requestOrigin) {
    const isAllowed =
      allowedOrigins.length === 1 && allowedOrigins[0] === '*'
        ? true
        : allowedOrigins.includes(requestOrigin);
    console.log('[RPC CORS] Allowed?', isAllowed, 'Origins:', allowedOrigins);
    if (isAllowed) {
      c.header('Access-Control-Allow-Origin', requestOrigin);
      console.log('[RPC CORS] Set header on context:', requestOrigin);
    }
  }

  try {
    const context = await createContext({ context: c });
    const rpcResult = await rpcHandler.handle(c.req.raw, {
      prefix: '/rpc',
      context: context,
    });

    if (rpcResult.matched) {
      // Pass through ORPC response without modification
      // ORPC uses its own encoding format, so we shouldn't parse/serialize it
      // IMPORTANT: Copy headers from context to response
      const response = c.newResponse(rpcResult.response.body, rpcResult.response);
      // Manually copy the Access-Control-Allow-Origin header if it was set
      if (requestOrigin) {
        const isAllowed =
          allowedOrigins.length === 1 && allowedOrigins[0] === '*'
            ? true
            : allowedOrigins.includes(requestOrigin);
        if (isAllowed) {
          response.headers.set('Access-Control-Allow-Origin', requestOrigin);
          console.log('[RPC CORS] Set header on response:', requestOrigin);
        }
      }
      return response;
    }
  } catch (error) {
    console.error('[RPC] Error:', error);
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
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
// AI ENDPOINT (/api/ai)
// ============================================================================
// AI SDK-compatible endpoint that retrieves model configuration from database
app.post('/api/ai', async (c) => {
  const requestId = crypto.randomUUID?.()?.slice(0, 8) ?? Math.random().toString(36).slice(2, 10);
  const startTime = Date.now();

  // IMMEDIATE LOG to verify request reaches this point
  console.log(`\n========== AI REQUEST ==========`); // Force flush
  console.log(`[AI:${requestId}] ============================================`);
  console.log(`[AI:${requestId}] 📨 REQUEST RECEIVED`);
  console.log(`[AI:${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`[AI:${requestId}] URL: ${c.req.url}`);
  console.log(`[AI:${requestId}] Method: ${c.req.method}`);
  console.log(`====================================\n`); // Force flush

  try {
    // Authentication check
    console.log(`[AI:${requestId}] 🔐 Checking authentication...`);
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user) {
      console.log(`[AI:${requestId}] ❌ UNAUTHORIZED - No session found`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = session.user.id;
    console.log(`[AI:${requestId}] ✅ Authenticated - User ID: ${userId}`);

    // Parse and validate request body
    console.log(`[AI:${requestId}] 📋 Parsing request body...`);
    const body = await c.req.json();

    // Input validation
    const uiMessages = body.messages;
    if (!Array.isArray(uiMessages)) {
      console.log(`[AI:${requestId}] ❌ Invalid request - messages is not an array`);
      return c.json({ error: 'Invalid request: messages must be an array' }, 400);
    }

    if (uiMessages.length === 0) {
      console.log(`[AI:${requestId}] ❌ Invalid request - messages is empty`);
      return c.json({ error: 'Invalid request: messages cannot be empty' }, 400);
    }

    if (uiMessages.length > 100) {
      console.log(
        `[AI:${requestId}] ❌ Invalid request - too many messages (${uiMessages.length})`
      );
      return c.json({ error: 'Invalid request: too many messages (max 100)' }, 400);
    }

    console.log(`[AI:${requestId}] ✅ Messages validated - ${uiMessages.length} message(s)`);

    // Validate AI SDK message format
    // Expected: { role: 'user'|'assistant'|'system', parts: [{ type: 'text', text: '...' }] }
    for (const msg of uiMessages) {
      if (!msg.role) {
        return c.json({ error: 'Invalid message format: missing role' }, 400);
      }
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        return c.json({ error: `Invalid message role: ${msg.role}` }, 400);
      }
      // Validate parts array exists and is not empty
      if (!msg.parts || !Array.isArray(msg.parts) || msg.parts.length === 0) {
        return c.json({ error: 'Invalid message format: missing or empty parts array' }, 400);
      }
      // Validate each part has type and text
      for (const part of msg.parts) {
        if (!part.type) {
          return c.json({ error: 'Invalid part format: missing type' }, 400);
        }
      }
    }

    const { db } = await import('@sambung-chat/db');
    const { models } = await import('@sambung-chat/db/schema/model');
    const { apiKeys } = await import('@sambung-chat/db/schema/api-key');

    // Always use active model (ignore modelId from request)
    console.log(`[AI:${requestId}] 🔍 Fetching active model from database...`);
    const modelResults = await db
      .select()
      .from(models)
      .where(and(eq(models.userId, userId), eq(models.isActive, true)))
      .limit(1);

    if (modelResults.length === 0) {
      console.log(`[AI:${requestId}] ❌ No active model found for user ${userId}`);
      return c.json(
        {
          error: 'No active model found',
          message: 'Please configure an active model in Settings',
        },
        400
      );
    }

    const model = modelResults[0]!;
    console.log(
      `[AI:${requestId}] ✅ Active model found: ${model.name} (${model.provider}/${model.modelId})`
    );

    // Get decrypted API key if needed
    let apiKey = '';
    if (model.apiKeyId) {
      console.log(`[AI:${requestId}] 🔑 Fetching API key from database...`);
      const apiKeyResults = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, model.apiKeyId))
        .limit(1);

      if (apiKeyResults.length === 0) {
        console.log(`[AI:${requestId}] ❌ API key not found (ID: ${model.apiKeyId})`);
        return c.json(
          {
            error: 'API key not found',
            message: 'The API key associated with this model no longer exists',
          },
          404
        );
      }

      const apiKeyRecord = apiKeyResults[0]!;

      // Decrypt API key using the existing decryption utility
      apiKey = decrypt(apiKeyRecord.encryptedKey);
      console.log(`[AI:${requestId}] ✅ API key decrypted (${apiKeyRecord.provider})`);
    } else if (model.provider !== 'ollama') {
      console.log(`[AI:${requestId}] ❌ Missing API key for provider: ${model.provider}`);
      return c.json(
        {
          error: 'Missing API key',
          message: `Model "${model.name}" is missing an API key. Please add an API Key in Settings.`,
        },
        400
      );
    } else {
      apiKey = 'ollama'; // Placeholder for Ollama
      console.log(`[AI:${requestId}] ✅ Using Ollama (no API key required)`);
    }

    // Validate provider value from database
    console.log(`[AI:${requestId}] 🧩 Validating provider configuration...`);
    const validatedProvider = aiProviderSchema.safeParse(model.provider);
    if (!validatedProvider.success) {
      console.log(`[AI:${requestId}] ❌ Invalid provider: ${model.provider}`);
      return c.json(
        {
          error: 'Invalid provider',
          message: `Model "${model.name}" has an invalid provider: ${model.provider}`,
        },
        400
      );
    }

    // Build provider configuration
    const config: ProviderConfig = {
      provider: validatedProvider.data,
      modelId: model.modelId,
      apiKey,
    };

    // Add custom base URL if specified
    if (model.baseUrl) {
      config.baseURL = model.baseUrl;
      console.log(`[AI:${requestId}] 📍 Using custom base URL: ${model.baseUrl}`);
    }

    // Create AI provider instance
    console.log(`[AI:${requestId}] 🤖 Creating AI provider instance...`);
    const aiProvider = createAIProvider(config);
    console.log(`[AI:${requestId}] ✅ AI provider created successfully`);

    // Wrap model with dev tools
    console.log(`[AI:${requestId}] 🔧 Wrapping model with dev tools...`);
    const wrappedModel = wrapLanguageModel({
      model: aiProvider,
      middleware: devToolsMiddleware(),
    });

    // Stream text using AI SDK
    console.log(`[AI:${requestId}] 📡 Starting AI stream...`);
    const setupTime = Date.now() - startTime;
    console.log(`[AI:${requestId}] ⏱️  Setup time: ${setupTime}ms`);

    const result = streamText({
      model: wrappedModel,
      messages: await convertToModelMessages(uiMessages),
    });

    // Use Hono's streaming API with AI SDK
    const response = result.toUIMessageStreamResponse();

    console.log(`[AI:${requestId}] ✅ Streaming started - sending response to client`);

    // Convert AI SDK response to Hono-compatible response
    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Request-ID': requestId,
      },
    });
  } catch (error) {
    // Log error for debugging
    const errorTime = Date.now() - startTime;
    console.error(`[AI:${requestId}] ❌ ERROR after ${errorTime}ms:`, error);
    console.error(
      `[AI:${requestId}] Error details:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    console.error(
      `[AI:${requestId}] Stack trace:`,
      error instanceof Error ? error.stack : 'No stack trace'
    );

    return c.json(
      {
        error: 'Failed to process AI request',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      500
    );
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================
// Root endpoint for basic connectivity test
app.get('/', (c) => {
  return c.text('OK');
});

// Health check endpoint for Docker healthcheck probes
// Returns detailed health status including database connectivity
app.get('/health', async (c) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? Math.floor(process.uptime()) : 0,
    environment: env.NODE_ENV || 'unknown',
    checks: {
      database: 'unknown',
    },
  };

  // Check database connectivity
  try {
    const { db } = await import('@sambung-chat/db');
    await db.execute('SELECT 1 as test');
    health.checks.database = 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'degraded';
    // Return 503 on database failure
    return c.json(health, 503);
  }

  return c.json(health);
});

// Test database connection (development only)
app.get('/debug/db', async (c) => {
  // Disable debug endpoints in production
  if (env.NODE_ENV === 'production') {
    return c.json({ error: 'Not Found' }, 404);
  }

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

// Test Better Auth instance (development only)
app.get('/debug/auth', async (c) => {
  // Disable debug endpoints in production
  if (env.NODE_ENV === 'production') {
    return c.json({ error: 'Not Found' }, 404);
  }

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

// Debug endpoint to test handler (development only)
app.get('/debug', (c) => {
  // Disable debug endpoints in production
  if (env.NODE_ENV === 'production') {
    return c.json({ error: 'Not Found' }, 404);
  }

  return c.json({ message: 'Debug works', time: new Date().toISOString() });
});

// Debug endpoint to test session (development only)
app.get('/debug/session', async (c) => {
  // Disable debug endpoints in production
  if (env.NODE_ENV === 'production') {
    return c.json({ error: 'Not Found' }, 404);
  }

  const cookieHeader = c.req.raw.headers.get('cookie');
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  return c.json({
    hasCookie: !!cookieHeader,
    hasSession: !!session,
    user: session?.user
      ? {
          id: session.user.id,
        }
      : null,
  });
});

// ============================================================================
// DEBUG ENDPOINT
// ============================================================================
console.log('[INIT] Registering /app-id route...');
app.get('/app-id', (c) => {
  console.log('[DEBUG /app-id] Route called!');
  return c.json({ appId: APP_ID, message: 'This should match the logs' });
});
console.log('[INIT] /app-id route registered');
console.log('[INIT] Registering /test-simple route...');
app.get('/test-simple', (c) => {
  console.log('[DEBUG /test-simple] Route called!');
  return c.json({ message: 'Simple test works!' });
});
console.log('[INIT] /test-simple route registered');

// ============================================================================
// SERVER STARTUP
// ============================================================================
// Bun runtime uses export default with port and fetch properties
// ============================================================================
const port = env.PORT || 3000;

console.log('[INIT] About to export app object with ID:', APP_ID);
console.log('[INIT] App has', Object.keys(app).length, 'keys');
console.log('[INIT] App fetch type:', typeof app.fetch);

export default {
  port,
  fetch: app.fetch,
  // Increase timeout for AI requests (default is 10 seconds)
  idleTimeout: 120, // 2 minutes
};
