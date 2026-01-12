import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// AI SDK imports
import { openai } from "@ai-sdk/openai";
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
    provider: "openai",
    model: c.env.OPENAI_MODEL || "gpt-4o-mini",
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

    // Verify OpenAI API key is configured
    const apiKey = c.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY not configured");
      return c.json(
        {
          error: "OpenAI API key not configured",
          details: "Please set OPENAI_API_KEY in your environment variables",
        },
        500
      );
    }

    // Get model from environment or use default
    const modelId = c.env.OPENAI_MODEL || "gpt-4o-mini";

    // Log request (without sensitive data)
    console.log(`[OpenAI] Processing request with model: ${modelId}`);
    console.log(`[OpenAI] Message count: ${messages.length}`);

    // Create model instance with middleware
    const model = wrapLanguageModel({
      model: openai(modelId, {
        apiKey,
        // Optional: Add organization ID
        organization: c.env.OPENAI_ORGANIZATION,
        // Optional: Custom base URL (for proxies or Azure deployments)
        baseURL: c.env.OPENAI_BASE_URL,
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
        console.log(`[OpenAI] Generation complete:
          - Tokens: ${result.usage.totalTokens}
          - Prompt: ${result.usage.promptTokens}
          - Completion: ${result.usage.completionTokens}
        `);
      },
    });

    // Return UI message stream response
    return result.toDataStreamResponse();

  } catch (error) {
    console.error("[OpenAI] Error in /ai endpoint:", error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Authentication error
      if (errorMessage.includes("401") ||
          errorMessage.includes("403") ||
          errorMessage.includes("authentication") ||
          errorMessage.includes("unauthorized")) {
        return c.json(
          {
            error: "Authentication failed: Invalid OpenAI API key",
            details: "Please verify your OPENAI_API_KEY is correct",
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
            details: "OpenAI rate limit exceeded. Please try again later.",
            retryAfter: "60s",
          },
          429
        );
      }

      // Model not found
      if (errorMessage.includes("404") ||
          errorMessage.includes("model not found") ||
          errorMessage.includes("invalid model")) {
        return c.json(
          {
            error: "Model not found",
            details: `OpenAI model '${c.env.OPENAI_MODEL || 'gpt-4o-mini'}' not found. Check OPENAI_MODEL environment variable.`,
            availableModels: ["gpt-4o-mini", "gpt-4o", "o1-mini", "o1-preview"],
          },
          404
        );
      }

      // Context window exceeded
      if (errorMessage.includes("context") ||
          errorMessage.includes("tokens") ||
          errorMessage.includes("too long") ||
          errorMessage.includes("maximum")) {
        return c.json(
          {
            error: "Message too long",
            details: "The message exceeds the model's context window. Please reduce the length.",
            maxTokens: 128000, // GPT-4o context window
          },
          400
        );
      }

      // Invalid request format
      if (errorMessage.includes("invalid") ||
          errorMessage.includes("validation") ||
          errorMessage.includes("schema")) {
        return c.json(
          {
            error: "Invalid request format",
            details: error.message,
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
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      context: 128000,
      bestFor: "General chat, fast responses",
      cost: "Low",
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      context: 128000,
      bestFor: "Complex reasoning, vision",
      cost: "Medium",
    },
    {
      id: "o1-mini",
      name: "o1-mini",
      context: 128000,
      bestFor: "Code, math, logic",
      cost: "Medium",
    },
    {
      id: "o1-preview",
      name: "o1-preview",
      context: 128000,
      bestFor: "Complex problem-solving",
      cost: "High",
    },
  ];

  const currentModel = availableModels.find(
    (m) => m.id === (c.env.OPENAI_MODEL || "gpt-4o-mini")
  );

  return c.json({
    current: currentModel || availableModels[0],
    available: availableModels,
  });
});

// Start server (if running directly)
const port = parseInt(process.env.PORT || "3001");

if (require.main === module) {
  console.log(`🚀 OpenAI AI Server starting on port ${port}`);
  console.log(`📝 Model: ${process.env.OPENAI_MODEL || "gpt-4o-mini"}`);
  console.log(`🔑 API Key: ${process.env.OPENAI_API_KEY ? "✅ Configured" : "❌ Missing"}`);
  console.log(`🌐 Health Check: http://localhost:${port}/health`);
  console.log(`💬 Chat Endpoint: http://localhost:${port}/ai`);
}

export default app;
