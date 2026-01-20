import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins';
import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { createContext } from '@sambung-chat/api/context';
import { appRouter } from '@sambung-chat/api/routers/index';
import { createAIProvider, type ProviderConfig } from '@sambung-chat/api/lib/ai-provider-factory';
import { decrypt } from '@sambung-chat/api/lib/encryption';
import { auth } from '@sambung-chat/auth';
import { db } from '@sambung-chat/db';
import { models } from '@sambung-chat/db/schema/model';
import { apiKeys } from '@sambung-chat/db/schema/api-key';
import { env } from '@sambung-chat/env/server';
import { streamText, convertToModelMessages } from 'ai';
import { eq, and } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// ============================================================================
// CORS - Must be registered before auth handler
// ============================================================================
app.use(
  '/*',
  cors({
    origin: (env.CORS_ORIGIN || 'http://localhost:5174').split(','),
    allowMethods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
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
// Handle OPTIONS first for CORS preflight
app.options('/rpc/*', (c) => {
  return c.text('', 200);
});

// Handle GET/POST for RPC calls
app.all('/rpc/*', async (c, next) => {
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

/**
 * Helper function to get decrypted API key
 */
async function getDecryptedApiKey(apiKeyId: string): Promise<string> {
  const apiKeyResults = await db.select().from(apiKeys).where(eq(apiKeys.id, apiKeyId)).limit(1);

  if (apiKeyResults.length === 0 || !apiKeyResults[0]) {
    throw new Error('API key not found');
  }

  return decrypt(apiKeyResults[0].encryptedKey);
}

// ============================================================================
// AI ENDPOINT
// ============================================================================
app.post('/ai', async (c) => {
  try {
    // Debug: Log request headers
    const cookieHeader = c.req.raw.headers.get('cookie');
    console.log('[AI] Request cookies:', cookieHeader);

    // Authentication check
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    console.log('[AI] Session retrieved:', session ? 'Yes' : 'No');
    console.log('[AI] User:', session?.user?.email || 'None');

    if (!session?.user) {
      console.log('[AI] Unauthorized - No session or user found');
      return c.json({ error: 'Unauthorized' }, 401);
    }

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

    // Get user's active model from database
    const userId = session.user.id;
    const activeModels = await db
      .select()
      .from(models)
      .where(and(eq(models.userId, userId), eq(models.isActive, true)));

    const providerConfig: ProviderConfig = {} as ProviderConfig;

    if (activeModels.length === 0) {
      // No active model set - user needs to configure a model via Settings
      console.log('[AI] No active model found');
      return c.json(
        {
          error: 'No active model configured',
          details:
            'Please configure and activate an AI model in Settings → Models. ' +
            'You need to add an API Key first, then create a Model and set it as Active.',
        },
        400
      );
    }

    // Use user's active model
    const activeModel = activeModels[0]!;
    console.log(
      '[AI] Using active model:',
      activeModel.provider,
      activeModel.modelId,
      activeModel.name
    );

    // Build provider config with decrypted API key
    const config: ProviderConfig = {
      provider: activeModel.provider as
        | 'openai'
        | 'anthropic'
        | 'google'
        | 'groq'
        | 'ollama'
        | 'openrouter'
        | 'custom',
      modelId: activeModel.modelId,
      apiKey: '', // Will be set from API key below
      baseURL: activeModel.baseUrl ?? undefined,
    };

    // Get decrypted API key - this is now required
    if (activeModel.apiKeyId) {
      try {
        config.apiKey = await getDecryptedApiKey(activeModel.apiKeyId);
        console.log('[AI] API key loaded from database');
      } catch (error) {
        console.error('[AI] Failed to load API key:', error);
        return c.json(
          {
            error: 'Configuration error',
            details: 'Failed to decrypt API key. Please reconfigure your model.',
          },
          500
        );
      }
    } else if (activeModel.provider !== 'ollama') {
      // Ollama doesn't require API key, but other providers do
      return c.json(
        {
          error: 'Configuration error',
          details: `Model "${activeModel.name}" is missing an API key. Please add an API Key in Settings and assign it to this model.`,
        },
        400
      );
    } else {
      config.apiKey = 'ollama'; // Placeholder for Ollama
    }

    // Assign to providerConfig
    Object.assign(providerConfig, config);

    // Validate request parameters based on provider
    if (providerConfig.provider === 'anthropic') {
      // Anthropic-specific parameter validation

      // Validate temperature (0-1 for Anthropic)
      if (body.temperature !== undefined) {
        if (typeof body.temperature !== 'number') {
          return c.json(
            {
              error: 'Invalid parameter',
              details: 'Temperature must be a number',
            },
            400
          );
        }
        if (body.temperature < 0 || body.temperature > 1) {
          return c.json(
            {
              error: 'Invalid temperature',
              details: 'Temperature must be between 0 and 1 for Anthropic models',
              parameter: 'temperature',
              min: 0,
              max: 1,
              provided: body.temperature,
            },
            400
          );
        }
      }

      // Validate maxTokens (1-8192 for most Anthropic models)
      if (body.maxTokens !== undefined) {
        if (typeof body.maxTokens !== 'number') {
          return c.json(
            {
              error: 'Invalid parameter',
              details: 'maxTokens must be a number',
            },
            400
          );
        }
        if (body.maxTokens < 1 || body.maxTokens > 8192) {
          return c.json(
            {
              error: 'Invalid maxTokens',
              details: 'maxTokens must be between 1 and 8192 for Anthropic models',
              parameter: 'maxTokens',
              min: 1,
              max: 8192,
              provided: body.maxTokens,
            },
            400
          );
        }
      }

      // Validate topK (0-40 for Anthropic)
      if (body.topK !== undefined) {
        if (typeof body.topK !== 'number') {
          return c.json(
            {
              error: 'Invalid parameter',
              details: 'topK must be a number',
            },
            400
          );
        }
        if (body.topK < 0 || body.topK > 40) {
          return c.json(
            {
              error: 'Invalid topK',
              details: 'topK must be between 0 and 40 for Anthropic models',
              parameter: 'topK',
              min: 0,
              max: 40,
              provided: body.topK,
            },
            400
          );
        }
      }

      // Validate topP (0-1 for Anthropic, same as OpenAI)
      if (body.topP !== undefined) {
        if (typeof body.topP !== 'number') {
          return c.json(
            {
              error: 'Invalid parameter',
              details: 'topP must be a number',
            },
            400
          );
        }
        if (body.topP < 0 || body.topP > 1) {
          return c.json(
            {
              error: 'Invalid topP',
              details: 'topP must be between 0 and 1',
              parameter: 'topP',
              min: 0,
              max: 1,
              provided: body.topP,
            },
            400
          );
        }
      }
    }

    // Create AI model using provider factory
    const model = createAIProvider(providerConfig);

    // Build generation options with validated parameters
    const generationOptions: Record<string, any> = {};

    if (body.temperature !== undefined) {
      generationOptions.temperature = body.temperature;
    }
    if (body.maxTokens !== undefined) {
      generationOptions.maxTokens = body.maxTokens;
    }
    if (body.topP !== undefined) {
      generationOptions.topP = body.topP;
    }
    if (body.topK !== undefined) {
      generationOptions.topK = body.topK;
    }

    const result = streamText({
      model,
      messages: await convertToModelMessages(uiMessages),
      ...generationOptions,
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

    // Handle specific Anthropic errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Authentication error
      if (
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('invalid api key') ||
        errorMessage.includes('api key is required')
      ) {
        return c.json(
          {
            error: 'Authentication failed',
            details:
              'Invalid or missing API key. Please check your API key configuration in Settings.',
          },
          401
        );
      }

      // Rate limit error
      if (
        errorMessage.includes('429') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests')
      ) {
        return c.json(
          {
            error: 'Rate limit exceeded',
            details: 'API rate limit exceeded. Please try again later.',
            retryAfter: '60s',
          },
          429
        );
      }

      // Model not found
      if (
        errorMessage.includes('404') ||
        errorMessage.includes('model not found') ||
        errorMessage.includes('invalid model') ||
        errorMessage.includes('unknown model')
      ) {
        return c.json(
          {
            error: 'Model not found',
            details: 'The configured model was not found. Please check your model settings.',
            availableModels: [
              'claude-3-5-sonnet-20241022',
              'claude-3-5-haiku-20241022',
              'claude-3-opus-20240229',
              'claude-3-sonnet-20240229',
              'claude-3-haiku-20240307',
            ],
          },
          404
        );
      }

      // Context window exceeded
      if (
        errorMessage.includes('context') ||
        errorMessage.includes('tokens') ||
        errorMessage.includes('too long') ||
        errorMessage.includes('maximum') ||
        errorMessage.includes('context_window_exceeded')
      ) {
        return c.json(
          {
            error: 'Message too long',
            details: 'The conversation exceeds the model context limit. Please start a new chat.',
            maxTokens: 200000, // Claude 3.5 Sonnet context window
          },
          400
        );
      }

      // Content filtering (Anthropic specific)
      if (
        errorMessage.includes('content') &&
        (errorMessage.includes('policy') || errorMessage.includes('filtered'))
      ) {
        return c.json(
          {
            error: 'Content policy violation',
            details:
              'The request content was flagged by Anthropic content filters. Please modify your message and try again.',
          },
          400
        );
      }

      // Invalid request format
      if (
        errorMessage.includes('invalid') ||
        errorMessage.includes('validation') ||
        errorMessage.includes('schema')
      ) {
        return c.json(
          {
            error: 'Invalid request format',
            details: error.message,
          },
          400
        );
      }
    }

    // Generic error response
    return c.json(
      {
        error: 'Internal server error',
        details: 'An error occurred while processing your request. Please try again.',
        troubleshooting: [
          'Check your API key configuration in Settings',
          'Verify your network connection',
          'Try selecting a different model',
          'Contact support if the issue persists',
        ],
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

// Debug endpoint to test session
app.get('/debug/session', async (c) => {
  const cookieHeader = c.req.raw.headers.get('cookie');
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  return c.json({
    hasCookie: !!cookieHeader,
    cookiePreview: cookieHeader?.substring(0, 100) || 'None',
    hasSession: !!session,
    user: session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
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
