# Groq Integration Example

A complete, production-ready example of integrating Groq's ultra-fast AI as an AI provider in SambungChat.

## Overview

This example demonstrates how to:

1. Install and configure the Groq provider package
2. Set up environment variables for Groq AI models
3. Implement server-side streaming with Groq
4. Test the integration comprehensively
5. Handle errors and edge cases
6. Deploy to production
7. Monitor usage and costs

## Why Groq?

**Groq offers the fastest inference in the industry:**

- ⚡ **Ultra-Low Latency:** 10-20x faster than other providers
- 💰 **Low Cost:** Significantly cheaper than GPT-4 or Claude
- 🔓 **Open Models:** Uses open-source models (Llama, Mixtral, Gemma)
- 🚀 **LPU Inference:** Custom Language Processing Units for speed
- 📊 **Production Ready:** High reliability and scalability

## Prerequisites

- Node.js 18+ and npm
- A Groq API key ([Get one here - it's free](https://console.groq.com/keys))
- Existing SambungChat project setup

## Installation

### Step 1: Install the Groq Provider Package

```bash
cd apps/server
npm install @ai-sdk/groq
```

### Step 2: Configure Environment Variables

Create or update `.env.local` in the project root:

```bash
# Groq Configuration
GROQ_API_KEY=gsk_your-groq-api-key-here

# Optional: Select a specific model
GROQ_MODEL=llama-3.3-70b-versatile
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
import { groq } from "@ai-sdk/groq";
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
    provider: "groq",
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
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

    // Verify Groq API key is configured
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("GROQ_API_KEY not configured");
      return c.json(
        { error: "Groq API key not configured" },
        500
      );
    }

    // Get model from environment or use default
    const modelId = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    // Create model instance with middleware
    const model = wrapLanguageModel({
      model: groq(modelId, {
        apiKey,
        // Optional: Custom base URL
        baseURL: process.env.GROQ_BASE_URL,
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

    // Handle specific Groq errors
    if (error instanceof Error) {
      // Authentication error
      if (error.message.includes("401") || error.message.includes("authentication")) {
        return c.json(
          { error: "Invalid Groq API key" },
          401
        );
      }

      // Rate limit error
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        return c.json(
          { error: "Groq rate limit exceeded. Please try again later." },
          429
        );
      }

      // Model not found
      if (error.message.includes("404") || error.message.includes("model")) {
        return c.json(
          { error: "Groq model not found. Check GROQ_MODEL environment variable." },
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

console.log(`⚡ Groq AI Server starting on port ${port}`);
console.log(`📝 Model: ${process.env.GROQ_MODEL || "llama-3.3-70b-versatile"}`);
console.log(`🔑 API Key: ${process.env.GROQ_API_KEY ? "✅ Configured" : "❌ Missing"}`);

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
⚡ Groq AI Server starting on port 3001
📝 Model: llama-3.3-70b-versatile
🔑 API Key: ✅ Configured
```

#### Test 2: Test with cURL

```bash
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "Hello, Groq!" }
    ]
  }'
```

Expected response: Ultra-fast streaming text response from Groq.

#### Test 3: Test with Frontend

1. Start the web server: `cd apps/web && npm run dev`
2. Open browser to `http://localhost:5173/ai`
3. Send a message: "Hello, can you hear me?"
4. Verify you receive a streaming response
5. **Notice the speed!** Groq is significantly faster than other providers

#### Test 4: Test Error Handling

```bash
# Test invalid API key
GROQ_API_KEY=invalid npm run dev

curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Test"}]}'
```

Expected response: `401 Unauthorized` with error message.

### Automated Testing

Create a test file: `apps/server/src/__tests__/groq.test.ts`

```typescript
import { describe, it, expect, beforeAll } from "vitest";

describe("Groq Integration", () => {
  beforeAll(() => {
    // Verify environment is set up
    expect(process.env.GROQ_API_KEY).toBeDefined();
  });

  describe("Environment Configuration", () => {
    it("should have Groq API key configured", () => {
      const apiKey = process.env.GROQ_API_KEY;
      expect(apiKey).toBeDefined();
      expect(apiKey?.length).toBeGreaterThan(0);
      expect(apiKey).toMatch(/^gsk_/);
    });

    it("should have a valid model configured", () => {
      const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
      expect(model).toMatch(/^(llama|mixtral|gemma)/);
    });
  });

  describe("API Endpoint", () => {
    it("should respond to health check", async () => {
      const response = await fetch("http://localhost:3001/health");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.provider).toBe("groq");
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

## Available Groq Models

### Recommended Models

| Model | Context | Best For | Cost | Speed |
|-------|---------|----------|------|-------|
| `llama-3.3-70b-versatile` | 131K | General purpose, reasoning, coding | Low | Ultra-fast |
| `llama-3.1-70b-versatile` | 131K | General purpose, reasoning | Low | Ultra-fast |
| `mixtral-8x7b-32768` | 32K | Complex reasoning, multilingual | Low | Very fast |
| `gemma2-9b-it` | 8K | Fast responses, simple tasks | Very low | Ultra-fast |

### Changing Models

Update the `GROQ_MODEL` environment variable:

```bash
# Use the latest Llama model (recommended)
GROQ_MODEL=llama-3.3-70b-versatile

# Use Gemma for fastest responses
GROQ_MODEL=gemma2-9b-it

# Use Mixtral for complex reasoning
GROQ_MODEL=mixtral-8x7b-32768
```

### Groq Special Features

**Ultra-Fast Inference:**
- LPU (Language Processing Unit) inference
- 10-20x faster than traditional GPUs
- Sub-100ms time to first token

**Cost Efficiency:**
- Significantly cheaper than GPT-4 or Claude
- Open-source models mean lower licensing costs
- High throughput = lower cost per request

**Large Context Windows:**
- Llama 3.3: 131K tokens
- Mixtral: 32K tokens
- Great for long conversations and document analysis

## Best Practices

### 1. Leverage Speed for Real-Time Applications

Groq's ultra-fast inference is perfect for:
- Real-time chat applications
- Live customer support
- Interactive coding assistants
- Streaming responses

### 2. Model Selection by Use Case

```bash
# General purpose (best overall)
GROQ_MODEL=llama-3.3-70b-versatile

# Fastest responses (simple tasks)
GROQ_MODEL=gemma2-9b-it

# Complex reasoning (better quality)
GROQ_MODEL=mixtral-8x7b-32768
```

### 3. Cost Monitoring

Track token usage to control costs:

```typescript
const result = await streamText({
  model,
  messages,
  onFinish: (result) => {
    const { promptTokens, completionTokens } = result.usage;
    // Groq pricing varies by model
    // Llama 3.3 70B: ~$0.59/M input, ~$0.79/M output
    console.log(`Tokens: ${result.usage.totalTokens}`);
  },
});
```

### 4. Handle Rate Limits

Groq has generous rate limits, but you should still implement retry logic:

```typescript
import { retryWithExponentialBackoff } from "./utils/retry";

const result = await retryWithExponentialBackoff(
  () => streamText({ model, messages }),
  { maxRetries: 3, baseDelay: 1000 }
);
```

### 5. API Key Security

- Never commit API keys to version control
- Use environment-specific keys (dev, staging, prod)
- Monitor usage in Groq console
- Set up alerts for unusual activity

## Performance Optimization

### Why Groq is Faster

**Traditional GPU Inference:**
- Batch processing
- Variable latency (500-2000ms)
- Limited throughput

**Groq LPU Inference:**
- Deterministic performance
- Sub-100ms time to first token
- 500+ tokens/second throughput

### Optimization Tips

1. **Use streaming always:** Groq's speed advantage is most apparent with streaming
2. **Reduce maxTokens for short responses:** Faster generation for simple queries
3. **Choose the right model:** Not all tasks need 70B parameters
4. **Monitor latency:** Track time to first token (TTFT) metrics

### Monitoring Performance

```typescript
const startTime = Date.now();

const result = await streamText({
  model,
  messages,
  onFinish: () => {
    const totalTime = Date.now() - startTime;
    const tokensPerSecond = result.usage.completionTokens / (totalTime / 1000);
    console.log(`Performance: ${tokensPerSecond.toFixed(2)} tokens/second`);
  },
});
```

## Troubleshooting

### "Cannot find module '@ai-sdk/groq'"

**Solution:** Install the package:
```bash
npm install @ai-sdk/groq
```

### "GROQ_API_KEY not found"

**Solution:** Set the environment variable:
```bash
export GROQ_API_KEY=gsk-your-key-here
```

### "401 Unauthorized" or "Invalid API key"

**Solution:** Verify your API key is correct:
1. Check Groq console
2. Regenerate key if needed
3. Ensure no extra spaces in `.env.local`
4. Verify key starts with `gsk_`

### "429 Too Many Requests"

**Solution:** Implement rate limiting:
```typescript
// Simple in-memory rate limiter
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(userId) || [];
  const recentRequests = requests.filter(t => now - t < 60000);

  if (recentRequests.length >= 60) { // Adjust based on your tier
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
echo $GROQ_MODEL
# Should be like: llama-3.3-70b-versatile
```

### Responses are slower than expected

**Solutions:**
1. Check network latency
2. Verify you're using Groq's endpoint (not a proxy)
3. Ensure your Groq account is in good standing
4. Try a different model (Gemma is fastest)

### Context window errors

**Solution:** Reduce message length or use Llama 3.3 (131K context):
```bash
GROQ_MODEL=llama-3.3-70b-versatile
```

## Deployment

### Production Environment Variables

```bash
# .env.production
GROQ_API_KEY=gsk_prod-your-production-key
GROQ_MODEL=llama-3.3-70b-versatile
NODE_ENV=production
PORT=3001
```

### Deployment Checklist

- [ ] API keys are production-specific (not dev keys)
- [ ] Model is appropriate for production workload
- [ ] Error handling is comprehensive
- [ ] Rate limiting is implemented
- [ ] Monitoring and logging are configured
- [ ] Cost alerts are set in Groq console
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
  averageTokensPerSecond: 0,
};

// Log metrics regularly
setInterval(() => {
  console.log("Groq Metrics:", metrics);
}, 60000); // Every minute
```

### Cost Management

Groq pricing (as of 2025):
- **Llama 3.3 70B:** ~$0.59/M input, ~$0.79/M output
- **Llama 3.1 70B:** ~$0.59/M input, ~$0.79/M output
- **Mixtral 8x7B:** ~$0.27/M input, ~$0.27/M output
- **Gemma 2 9B:** ~$0.08/M input, ~$0.08/M output

Set up alerts in Groq console:
1. Go to [console.groq.com](https://console.groq.com/)
2. Navigate to Settings > Billing
3. Set monthly spending limits
4. Configure email alerts

## Performance Comparison

### Groq vs. Other Providers

| Provider | Model | Time to First Token | Tokens/Second | Cost (per 1M tokens) |
|----------|-------|-------------------|---------------|---------------------|
| **Groq** | Llama 3.3 70B | **~50ms** | **500+** | **$0.59** |
| OpenAI | GPT-4o-mini | ~500ms | ~80 | $0.15 |
| Anthropic | Claude 3.5 Haiku | ~600ms | ~70 | $0.80 |
| Google | Gemini 2.5 Flash | ~400ms | ~100 | $0.075 |

**Groq is 10-20x faster than traditional providers!**

## Additional Resources

- [Groq API Documentation](https://console.groq.com/docs)
- [AI SDK Groq Provider](https://sdk.vercel.ai/docs/ai-sdk/providers/groq)
- [Groq Models](https://groq.com/)
- [Groq Pricing](https://groq.com/pricing)
- [Groq Status](https://status.groq.com/)

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [main integration guide](../../docs/ai-provider-integration-guide.md)
3. Check [Groq Status](https://status.groq.com/)
4. Open an issue on GitHub

## License

This example is part of SambungChat and follows the same license.
