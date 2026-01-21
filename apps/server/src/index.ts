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
app.use('/rpc/*', async (c, next) => {
  try {
    const context = await createContext({ context: c });
    const rpcResult = await rpcHandler.handle(c.req.raw, {
      prefix: '/rpc',
      context: context,
    });

    if (rpcResult.matched) {
      return c.newResponse(rpcResult.response.body, rpcResult.response);
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
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = session.user.id;

    // Parse and validate request body
    const body = await c.req.json();

    // Input validation
    const uiMessages = body.messages;
    if (!Array.isArray(uiMessages)) {
      return c.json({ error: 'Invalid request: messages must be an array' }, 400);
    }

    if (uiMessages.length === 0) {
      return c.json({ error: 'Invalid request: messages cannot be empty' }, 400);
    }

    if (uiMessages.length > 100) {
      return c.json({ error: 'Invalid request: too many messages (max 100)' }, 400);
    }

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
    const modelResults = await db
      .select()
      .from(models)
      .where(and(eq(models.userId, userId), eq(models.isActive, true)))
      .limit(1);

    if (modelResults.length === 0) {
      return c.json(
        {
          error: 'No active model found',
          message: 'Please configure an active model in Settings',
        },
        400
      );
    }

    const model = modelResults[0]!;

    // Get decrypted API key if needed
    let apiKey = '';
    if (model.apiKeyId) {
      const apiKeyResults = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, model.apiKeyId))
        .limit(1);

      if (apiKeyResults.length === 0) {
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
    } else if (model.provider !== 'ollama') {
      return c.json(
        {
          error: 'Missing API key',
          message: `Model "${model.name}" is missing an API key. Please add an API Key in Settings.`,
        },
        400
      );
    } else {
      apiKey = 'ollama'; // Placeholder for Ollama
    }

    // Validate provider value from database
    const validatedProvider = aiProviderSchema.safeParse(model.provider);
    if (!validatedProvider.success) {
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
    }

    // Create AI provider instance
    const aiProvider = createAIProvider(config);

    // Wrap model with dev tools
    const wrappedModel = wrapLanguageModel({
      model: aiProvider,
      middleware: devToolsMiddleware(),
    });

    // Stream text using AI SDK
    const result = streamText({
      model: wrappedModel,
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
    // Log error for debugging
    console.error('[AI] Error processing request:', error);
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
