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
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

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
    model: c.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
    timestamp: new Date().toISOString(),
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
        {
          error: "Invalid request: messages array required",
          details: "Expected format: { messages: [{ role: 'user', content: '...' }] }",
        },
        400
      );
    }

    // Verify Anthropic API key is configured
    const apiKey = c.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not configured");
      return c.json(
        {
          error: "Anthropic API key not configured",
          details: "Please set ANTHROPIC_API_KEY in your environment variables",
        },
        500
      );
    }

    // Get model from environment or use default
    const modelId = c.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";

    // Log request (without sensitive data)
    console.log(`[Anthropic] Processing request with model: ${modelId}`);
    console.log(`[Anthropic] Message count: ${messages.length}`);

    // Create model instance with middleware
    const model = wrapLanguageModel({
      model: anthropic(modelId, {
        apiKey,
        // Optional: Custom base URL
        baseURL: c.env.ANTHROPIC_BASE_URL,
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
      // Optional: Add callbacks for monitoring
      onFinish: (result) => {
        console.log(`[Anthropic] Generation complete:
          - Tokens: ${result.usage.totalTokens}
          - Prompt: ${result.usage.promptTokens}
          - Completion: ${result.usage.completionTokens}
        `);
      },
    });

    // Return UI message stream response
    return result.toDataStreamResponse();

  } catch (error) {
    console.error("[Anthropic] Error in /ai endpoint:", error);

    // Handle specific Anthropic errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Authentication error
      if (errorMessage.includes("401") ||
          errorMessage.includes("403") ||
          errorMessage.includes("authentication") ||
          errorMessage.includes("unauthorized") ||
          errorMessage.includes("invalid api key")) {
        return c.json(
          {
            error: "Authentication failed: Invalid Anthropic API key",
            details: "Please verify your ANTHROPIC_API_KEY is correct",
          },
          401
        );
      }

      // Rate limit error
      if (errorMessage.includes("429") ||
          errorMessage.includes("rate limit") ||
          errorMessage.includes("too many requests")) {
        return c.json(
          {
            error: "Rate limit exceeded",
            details: "Anthropic rate limit exceeded. Please try again later.",
            retryAfter: "60s",
          },
          429
        );
      }

      // Model not found
      if (errorMessage.includes("404") ||
          errorMessage.includes("model not found") ||
          errorMessage.includes("invalid model") ||
          errorMessage.includes("unknown model")) {
        return c.json(
          {
            error: "Model not found",
            details: `Anthropic model '${c.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'}' not found. Check ANTHROPIC_MODEL environment variable.`,
            availableModels: [
              "claude-3-5-sonnet-20241022",
              "claude-3-5-haiku-20241022",
              "claude-3-opus-20240229",
              "claude-3-sonnet-20240229",
              "claude-3-haiku-20240307"
            ],
          },
          404
        );
      }

      // Context window exceeded
      if (errorMessage.includes("context") ||
          errorMessage.includes("tokens") ||
          errorMessage.includes("too long") ||
          errorMessage.includes("maximum") ||
          errorMessage.includes("context_window_exceeded")) {
        return c.json(
          {
            error: "Message too long",
            details: "The message exceeds the model's context window. Please reduce the length.",
            maxTokens: 200000, // Claude 3.5 Sonnet context window
          },
          400
        );
      }

      // Invalid request format
      if (errorMessage.includes("invalid") ||
          errorMessage.includes("validation") ||
          errorMessage.includes("schema") ||
          errorMessage.includes("invalid request")) {
        return c.json(
          {
            error: "Invalid request format",
            details: error.message,
          },
          400
        );
      }

      // Content filtering (Anthropic specific)
      if (errorMessage.includes("content") ||
          errorMessage.includes("policy") ||
          errorMessage.includes("filtered")) {
        return c.json(
          {
            error: "Content policy violation",
            details: "The request content was flagged by Anthropic's content filters. Please modify your message and try again.",
          },
          400
        );
      }
    }

    // Generic error response
    return c.json(
      {
        error: "Internal server error",
        details: "An error occurred while processing your request. Please try again.",
      },
      500
    );
  }
});

// Model info endpoint
app.get("/ai/models", (c) => {
  const availableModels = [
    {
      id: "claude-3-5-sonnet-20241022",
      name: "Claude 3.5 Sonnet",
      context: 200000,
      bestFor: "Complex reasoning, coding, analysis",
      cost: "Medium",
    },
    {
      id: "claude-3-5-haiku-20241022",
      name: "Claude 3.5 Haiku",
      context: 200000,
      bestFor: "Fast responses, simple tasks",
      cost: "Low",
    },
    {
      id: "claude-3-opus-20240229",
      name: "Claude 3 Opus",
      context: 200000,
      bestFor: "Most complex tasks, highest quality",
      cost: "High",
    },
    {
      id: "claude-3-sonnet-20240229",
      name: "Claude 3 Sonnet",
      context: 200000,
      bestFor: "Balanced performance and speed",
      cost: "Medium",
    },
    {
      id: "claude-3-haiku-20240307",
      name: "Claude 3 Haiku",
      context: 200000,
      bestFor: "Quick responses, cost optimization",
      cost: "Low",
    },
  ];

  const currentModel = availableModels.find(
    (m) => m.id === (c.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022")
  );

  return c.json({
    current: currentModel || availableModels[0],
    available: availableModels,
  });
});

// Start server (if running directly)
const port = parseInt(process.env.PORT || "3001");

if (require.main === module) {
  console.log(`🤖 Anthropic AI Server starting on port ${port}`);
  console.log(`📝 Model: ${process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022"}`);
  console.log(`🔑 API Key: ${process.env.ANTHROPIC_API_KEY ? "✅ Configured" : "❌ Missing"}`);
  console.log(`🌐 Health Check: http://localhost:${port}/health`);
  console.log(`💬 Chat Endpoint: http://localhost:${port}/ai`);
}

export default app;
