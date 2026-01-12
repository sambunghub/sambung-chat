# Anthropic Integration Example

A complete, production-ready example of integrating Anthropic's Claude AI as an AI provider in SambungChat.

## Overview

This example demonstrates how to:

1. Install and configure the Anthropic provider package
2. Set up environment variables for Claude AI models
3. Implement server-side streaming with Anthropic
4. Test the integration comprehensively
5. Handle errors and edge cases
6. Deploy to production
7. Monitor usage and costs

## Prerequisites

- Node.js 18+ and npm
- An Anthropic API key ([Get one here](https://console.anthropic.com/))
- Existing SambungChat project setup

## Installation

### Step 1: Install the Anthropic Provider Package

```bash
cd apps/server
npm install @ai-sdk/anthropic
```

### Step 2: Configure Environment Variables

Create or update `.env.local` in the project root:

```bash
# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Optional: Custom configuration
# ANTHROPIC_BASE_URL=https://api.anthropic.com
# ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
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
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// AI SDK imports
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToCoreMessages } from "ai";
import { wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";

// Type definitions
import type { CoreMessage } from "ai";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    provider: "anthropic",
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
  });
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

    // Verify Anthropic API key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not configured");
      return c.json(
        { error: "Anthropic API key not configured" },
        500
      );
    }

    // Get model from environment or use default
    const modelId = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";

    // Create model instance with middleware
    const model = wrapLanguageModel({
      model: anthropic(modelId, {
        apiKey,
        // Optional: Custom base URL
        baseURL: process.env.ANTHROPIC_BASE_URL,
      }),
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

    // Handle specific Anthropic errors
    if (error instanceof Error) {
      // Authentication error
      if (error.message.includes("401") || error.message.includes("authentication")) {
        return c.json(
          { error: "Invalid Anthropic API key" },
          401
        );
      }

      // Rate limit error
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        return c.json(
          { error: "Anthropic rate limit exceeded. Please try again later." },
          429
        );
      }

      // Model not found
      if (error.message.includes("404") || error.message.includes("model")) {
        return c.json(
          { error: "Anthropic model not found. Check ANTHROPIC_MODEL environment variable." },
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

console.log(`🤖 Anthropic AI Server starting on port ${port}`);
console.log(`📝 Model: ${process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022"}`);
console.log(`🔑 API Key: ${process.env.ANTHROPIC_API_KEY ? "✅ Configured" : "❌ Missing"}`);

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
🤖 Anthropic AI Server starting on port 3001
📝 Model: claude-3-5-sonnet-20241022
🔑 API Key: ✅ Configured
```

#### Test 2: Test with cURL

```bash
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "Hello, Claude!" }
    ]
  }'
```

Expected response: Streaming text response from Anthropic.

#### Test 3: Test with Frontend

1. Start the web server: `cd apps/web && npm run dev`
2. Open browser to `http://localhost:5173/ai`
3. Send a message: "Hello, can you hear me?"
4. Verify you receive a streaming response

#### Test 4: Test Error Handling

```bash
# Test invalid API key
ANTHROPIC_API_KEY=invalid npm run dev

curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Test"}]}'
```

Expected response: `401 Unauthorized` with error message.

### Automated Testing

Create a test file: `apps/server/src/__tests__/anthropic.test.ts`

```typescript
import { describe, it, expect, beforeAll } from "vitest";

describe("Anthropic Integration", () => {
  beforeAll(() => {
    // Verify environment is set up
    expect(process.env.ANTHROPIC_API_KEY).toBeDefined();
  });

  describe("Environment Configuration", () => {
    it("should have Anthropic API key configured", () => {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      expect(apiKey).toBeDefined();
      expect(apiKey?.length).toBeGreaterThan(0);
      expect(apiKey).toMatch(/^sk-ant-/);
    });

    it("should have a valid model configured", () => {
      const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
      expect(model).toMatch(/^(claude-)/);
    });
  });

  describe("API Endpoint", () => {
    it("should respond to health check", async () => {
      const response = await fetch("http://localhost:3001/health");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.provider).toBe("anthropic");
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

## Available Anthropic Models

### Recommended Models

| Model | Context | Best For | Cost |
|-------|---------|----------|------|
| `claude-3-5-sonnet-20241022` | 200K | Complex reasoning, coding, analysis | Medium |
| `claude-3-5-haiku-20241022` | 200K | Fast responses, simple tasks | Low |
| `claude-3-opus-20240229` | 200K | Most complex tasks, highest quality | High |
| `claude-3-sonnet-20240229` | 200K | Balanced performance and speed | Medium |
| `claude-3-haiku-20240307` | 200K | Quick responses, cost optimization | Low |

### Changing Models

Update the `ANTHROPIC_MODEL` environment variable:

```bash
# Use the latest Sonnet model (recommended)
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Use the fast Haiku model for cost optimization
ANTHROPIC_MODEL=claude-3-5-haiku-20241022

# Use Opus for the most complex tasks
ANTHROPIC_MODEL=claude-3-opus-20240229
```

### Anthropic Special Features

**Extended Context Window:**
- All Claude models support 200K tokens context
- Great for analyzing large documents, long conversations

**Thinking Mode (Beta):**
- Enhanced reasoning for complex problems
- Available through special API parameters
- See [Anthropic documentation](https://docs.anthropic.com/) for details

## Best Practices

### 1. Leverage Long Context

Claude's 200K token context window is perfect for:
- Document analysis
- Long conversation history
- Code review of large files
- Multi-step reasoning tasks

### 2. Use Haiku for Simple Tasks

For straightforward tasks:
```bash
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
```

Benefits:
- 3x faster response time
- 10x lower cost
- Still excellent quality for simple queries

### 3. Handle Rate Limits

Anthropic has rate limits based on:
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

### 4. Cost Optimization

Track token usage to control costs:

```typescript
const result = await streamText({
  model,
  messages,
  onFinish: (result) => {
    const { promptTokens, completionTokens } = result.usage;
    const totalCost = (promptTokens * 0.003 + completionTokens * 0.015) / 1000;
    console.log(`Cost: $${totalCost.toFixed(4)}`);
  },
});
```

### 5. API Key Security

- Never commit API keys to version control
- Use environment-specific keys (dev, staging, prod)
- Rotate keys regularly (every 90 days)
- Monitor usage in Anthropic dashboard
- Set up budget alerts

## Troubleshooting

### "Cannot find module '@ai-sdk/anthropic'"

**Solution:** Install the package:
```bash
npm install @ai-sdk/anthropic
```

### "ANTHROPIC_API_KEY not found"

**Solution:** Set the environment variable:
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### "401 Unauthorized" or "Invalid API key"

**Solution:** Verify your API key is correct:
1. Check Anthropic console
2. Regenerate key if needed
3. Ensure no extra spaces in `.env.local`
4. Verify key starts with `sk-ant-`

### "429 Too Many Requests"

**Solution:** Implement rate limiting:
```typescript
// Simple in-memory rate limiter
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(userId) || [];
  const recentRequests = requests.filter(t => now - t < 60000);

  if (recentRequests.length >= 50) { // Anthropic free tier limit
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
# Verify model ID format
echo $ANTHROPIC_MODEL
# Should be like: claude-3-5-sonnet-20241022
```

### Very slow response times

**Solutions:**
1. Use a faster model (e.g., `claude-3-5-haiku-20241022`)
2. Reduce `maxTokens` parameter
3. Check network latency
4. Consider using Groq for ultra-fast responses

### "Content policy violation" error

**Solution:** Anthropic has content filters. If you see this error:
- Review your prompt content
- Ensure it complies with Anthropic's usage policies
- See [Anthropic policies](https://www.anthropic.com/legal/aup)

## Deployment

### Production Environment Variables

```bash
# .env.production
ANTHROPIC_API_KEY=sk-ant-prod-your-production-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
NODE_ENV=production
PORT=3001
```

### Deployment Checklist

- [ ] API keys are production-specific (not dev keys)
- [ ] Model is appropriate for production workload
- [ ] Error handling is comprehensive
- [ ] Rate limiting is implemented
- [ ] Monitoring and logging are configured
- [ ] Budget alerts are set in Anthropic dashboard
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
  console.log("Anthropic Metrics:", metrics);
}, 60000); // Every minute
```

### Cost Management

Claude pricing (as of 2024):
- **Sonnet 3.5:** $3/M input, $15/M output
- **Haiku 3.5:** $0.80/M input, $4/M output
- **Opus 3:** $15/M input, $75/M output

Set up alerts in Anthropic console:
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Navigate to Settings > Billing
3. Set monthly spending limits
4. Configure email alerts

## Additional Resources

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [AI SDK Anthropic Provider](https://sdk.vercel.ai/docs/ai-sdk/providers/anthropic)
- [Claude Models](https://docs.anthropic.com/en/docs/about-claude/models)
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Anthropic Rate Limits](https://docs.anthropic.com/en/api/rate-limits)

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [main integration guide](../../docs/ai-provider-integration-guide.md)
3. Check [Anthropic Status](https://status.anthropic.com/)
4. Open an issue on GitHub

## License

This example is part of SambungChat and follows the same license.
