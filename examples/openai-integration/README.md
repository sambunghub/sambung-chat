# OpenAI Integration Example

A complete, production-ready example of integrating OpenAI as an AI provider in SambungChat.

## Overview

This example demonstrates how to:

1. Install and configure the OpenAI provider package
2. Set up environment variables
3. Implement server-side streaming with OpenAI
4. Test the integration
5. Handle errors and edge cases
6. Deploy to production

## Prerequisites

- Node.js 18+ and npm
- An OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Existing SambungChat project setup

## Installation

### Step 1: Install the OpenAI-Compatible Provider Package

```bash
cd apps/server
npm install @ai-sdk/openai-compatible
```

### Step 2: Configure Environment Variables

Create or update `.env.local` in the project root:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Custom configuration
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_ORGANIZATION=org-your-organization-id
# OPENAI_MODEL=gpt-4o-mini
```

**Important:** Never commit `.env.local` to version control. Use `.env.example` for documentation.

### Step 3: Verify Installation

```bash
# From apps/server directory
npm run dev
```

If the server starts without errors, the package is installed correctly.

## Server Implementation

### File: `apps/server/src/index.ts`

```typescript
import { hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// AI SDK imports
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, convertToCoreMessages } from "ai";
import { wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";

// Type definitions
import type { CoreMessage } from "ai";

const app = hono();

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

// Create OpenAI-compatible client
const openai = createOpenAICompatible({
  name: 'openai-compatible',
  baseURL: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY ?? '',
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", provider: "openai" });
});

// AI chat endpoint
app.post("/ai", async (c) => {
  try {
    // Parse request body
    const { messages } = await c.req.json();

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return c.json(
        { error: "Invalid request: messages array required" },
        400
      );
    }

    // Verify OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY not configured");
      return c.json(
        { error: "OpenAI API key not configured" },
        500
      );
    }

    // Get model from environment or use default
    const modelId = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // Create model instance with middleware
    const model = wrapLanguageModel({
      model: openai(modelId),
      middleware: devToolsMiddleware(),
    });

    // Convert UI messages to core messages
    const coreMessages = messages as CoreMessage[];

    // Stream text generation
    const result = streamText({
      model,
      messages: convertToCoreMessages(coreMessages),
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1,
    });

    // Return UI message stream response
    return result.toDataStreamResponse();

  } catch (error) {
    console.error("Error in /ai endpoint:", error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      // Authentication error
      if (error.message.includes("401") || error.message.includes("authentication")) {
        return c.json(
          { error: "Invalid OpenAI API key" },
          401
        );
      }

      // Rate limit error
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        return c.json(
          { error: "OpenAI rate limit exceeded. Please try again later." },
          429
        );
      }

      // Model not found
      if (error.message.includes("404") || error.message.includes("model")) {
        return c.json(
          { error: "OpenAI model not found. Check OPENAI_MODEL environment variable." },
          404
        );
      }

      // Context window exceeded
      if (error.message.includes("context") || error.message.includes("tokens")) {
        return c.json(
          { error: "Message too long. Please reduce the length of your message." },
          400
        );
      }
    }

    // Generic error response
    return c.json(
      { error: "Internal server error processing your request" },
      500
    );
  }
});

// Start server
const port = parseInt(process.env.PORT || "3001");

console.log(`🚀 OpenAI AI Server starting on port ${port}`);
console.log(`📝 Model: ${process.env.OPENAI_MODEL || "gpt-4o-mini"}`);
console.log(`🔑 API Key: ${process.env.OPENAI_API_KEY ? "✅ Configured" : "❌ Missing"}`);

export default app;
```

## Frontend Implementation

The frontend (`apps/web`) requires **no changes** when switching providers. The existing Chat component from `@ai-sdk/svelte` works with any provider.

### File: `apps/web/src/routes/ai/+page.svelte`

```svelte
<script lang="ts">
  import { Chat } from "@ai-sdk/svelte";
  import { DefaultChatTransport } from "@ai-sdk/svelte";

  // No provider-specific code needed!
  const transport = new DefaultChatTransport({
    url: "/ai",
  });
</script>

<Chat {transport} />
```

## Testing the Integration

### Manual Testing

#### Test 1: Verify Server Starts

```bash
cd apps/server
npm run dev
```

Expected output:
```
🚀 OpenAI AI Server starting on port 3001
📝 Model: gpt-4o-mini
🔑 API Key: ✅ Configured
```

#### Test 2: Test with cURL

```bash
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "Hello, OpenAI!" }
    ]
  }'
```

Expected response: Streaming text response from OpenAI.

#### Test 3: Test with Frontend

1. Start the web server: `cd apps/web && npm run dev`
2. Open browser to `http://localhost:5173/ai`
3. Send a message: "Hello, can you hear me?"
4. Verify you receive a streaming response

#### Test 4: Test Error Handling

```bash
# Test invalid API key
OPENAI_API_KEY=invalid npm run dev

curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Test"}]}'
```

Expected response: `401 Unauthorized` with error message.

### Automated Testing

Create a test file: `apps/server/src/__tests__/openai.test.ts`

```typescript
import { describe, it, expect, beforeAll } from "vitest";

describe("OpenAI Integration", () => {
  beforeAll(() => {
    // Verify environment is set up
    expect(process.env.OPENAI_API_KEY).toBeDefined();
  });

  describe("Environment Configuration", () => {
    it("should have OpenAI API key configured", () => {
      const apiKey = process.env.OPENAI_API_KEY;
      expect(apiKey).toBeDefined();
      expect(apiKey?.length).toBeGreaterThan(0);
      expect(apiKey).toMatch(/^sk-/);
    });

    it("should have a valid model configured", () => {
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      expect(model).toMatch(/^(gpt-|o1-)/);
    });
  });

  describe("API Endpoint", () => {
    it("should respond to health check", async () => {
      const response = await fetch("http://localhost:3001/health");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.provider).toBe("openai");
    });

    it("should handle AI requests", async () => {
      const response = await fetch("http://localhost:3001/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Say 'test passed'" }
          ]
        }),
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get("content-type")).toContain("text/event-stream");
    });

    it("should handle empty messages error", async () => {
      const response = await fetch("http://localhost:3001/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      });

      expect(response.status).toBe(400);
    });
  });
});
```

Run tests:
```bash
npm test
```

## Available OpenAI Models

### Recommended Models

| Model | Context | Best For | Cost |
|-------|---------|----------|------|
| `gpt-4o-mini` | 128K | General chat, fast responses | Low |
| `gpt-4o` | 128K | Complex reasoning, vision | Medium |
| `o1-mini` | 128K | Code, math, logic | Medium |
| `o1-preview` | 128K | Complex problem-solving | High |

### Changing Models

Update the `OPENAI_MODEL` environment variable:

```bash
# Use the latest GPT-4o model
OPENAI_MODEL=gpt-4o

# Use the o1 reasoning model
OPENAI_MODEL=o1-preview

# Use the cost-effective mini model
OPENAI_MODEL=gpt-4o-mini
```

## Best Practices

### 1. Error Handling

Always implement comprehensive error handling:
- Authentication errors (401)
- Rate limiting (429)
- Model not found (404)
- Context window exceeded
- Network timeouts

### 2. Rate Limiting

OpenAI has rate limits based on:
- Requests per minute (RPM)
- Tokens per minute (TPM)

Implement retry logic with exponential backoff:

```typescript
import { retryWithExponentialBackoff } from "./utils/retry";

const result = await retryWithExponentialBackoff(
  () => streamText({ model, messages }),
  { maxRetries: 3, baseDelay: 1000 }
);
```

### 3. Cost Monitoring

Track token usage to control costs:

```typescript
const result = await streamText({
  model,
  messages,
  onChunk: ({ chunk }) => {
    if (chunk.type === "finish") {
      console.log(`Tokens used: ${chunk.usage.totalTokens}`);
      console.log(`Cost: $${chunk.usage.totalTokens * 0.00001}`);
    }
  },
});
```

### 4. Environment-Specific Models

Use different models for different environments:

```bash
# Development: Fast, cheap model
OPENAI_MODEL=gpt-4o-mini

# Staging: Production-like model
OPENAI_MODEL=gpt-4o

# Production: Best model for the task
OPENAI_MODEL=gpt-4o
```

### 5. API Key Security

- Never commit API keys to version control
- Use environment-specific keys (dev, staging, prod)
- Rotate keys regularly (every 90 days)
- Monitor usage in OpenAI dashboard
- Set up budget alerts

## Troubleshooting

### "Cannot find module '@ai-sdk/openai-compatible'"

**Solution:** Install the package:
```bash
npm install @ai-sdk/openai-compatible
```

### "OPENAI_API_KEY not found"

**Solution:** Set the environment variable:
```bash
export OPENAI_API_KEY=sk-your-key-here
```

### "401 Unauthorized" or "Invalid API key"

**Solution:** Verify your API key is correct:
1. Check OpenAI dashboard
2. Regenerate key if needed
3. Ensure no extra spaces in `.env.local`

### "429 Too Many Requests"

**Solution:** Implement rate limiting:
```typescript
// Simple in-memory rate limiter
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(userId) || [];
  const recentRequests = requests.filter(t => now - t < 60000);

  if (recentRequests.length >= 60) {
    return false; // Rate limited
  }

  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
  return true;
}
```

### "Model not found" error

**Solution:** Check the model name:
```bash
# List available models
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Very slow response times

**Solutions:**
1. Use a faster model (e.g., `gpt-4o-mini` instead of `gpt-4o`)
2. Reduce `maxTokens` parameter
3. Check network latency
4. Consider using Groq for ultra-fast responses

## Deployment

### Production Environment Variables

```bash
# .env.production
OPENAI_API_KEY=sk-prod-your-production-key
OPENAI_MODEL=gpt-4o
NODE_ENV=production
PORT=3001
```

### Deployment Checklist

- [ ] API keys are production-specific (not dev keys)
- [ ] Model is appropriate for production workload
- [ ] Error handling is comprehensive
- [ ] Rate limiting is implemented
- [ ] Monitoring and logging are configured
- [ ] Budget alerts are set in OpenAI dashboard
- [ ] Key rotation schedule is documented
- [ ] Fallback strategy is defined

### Monitoring

Track these metrics in production:

```typescript
// Example monitoring metrics
const metrics = {
  requestCount: 0,
  errorCount: 0,
  totalTokens: 0,
  totalCost: 0,
  averageLatency: 0,
};

// Log metrics regularly
setInterval(() => {
  console.log("OpenAI Metrics:", metrics);
}, 60000); // Every minute
```

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [AI SDK OpenAI Provider](https://sdk.vercel.ai/docs/ai-sdk/providers/openai)
- [OpenAI Models](https://platform.openai.com/docs/models)
- [OpenAI Pricing](https://openai.com/pricing)
- [OpenAI Rate Limits](https://platform.openai.com/docs/guides/rate-limits)

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [main integration guide](../../docs/ai-provider-integration-guide.md)
3. Check [OpenAI Status](https://status.openai.com/)
4. Open an issue on GitHub

## License

This example is part of SambungChat and follows the same license.
