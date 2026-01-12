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
    provider: "groq",
    model: c.env.GROQ_MODEL || "llama-3.3-70b-versatile",
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

    // Verify Groq API key is configured
    const apiKey = c.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("GROQ_API_KEY not configured");
      return c.json(
        {
          error: "Groq API key not configured",
          details: "Please set GROQ_API_KEY in your environment variables",
        },
        500
      );
    }

    // Get model from environment or use default
    const modelId = c.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    // Log request (without sensitive data)
    console.log(`[Groq] Processing request with model: ${modelId}`);
    console.log(`[Groq] Message count: ${messages.length}`);

    // Create model instance with middleware
    const model = wrapLanguageModel({
      model: groq(modelId, {
        apiKey,
        // Optional: Custom base URL for proxies or custom endpoints
        baseURL: c.env.GROQ_BASE_URL,
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
        console.log(`[Groq] Generation complete:
          - Tokens: ${result.usage.totalTokens}
          - Prompt: ${result.usage.promptTokens}
          - Completion: ${result.usage.completionTokens}
        `);
      },
    });

    // Return UI message stream response
    return result.toDataStreamResponse();

  } catch (error) {
    console.error("[Groq] Error in /ai endpoint:", error);

    // Handle specific Groq errors
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
            error: "Authentication failed: Invalid Groq API key",
            details: "Please verify your GROQ_API_KEY is correct",
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
            details: "Groq rate limit exceeded. Please try again later.",
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
            details: `Groq model '${c.env.GROQ_MODEL || 'llama-3.3-70b-versatile'}' not found. Check GROQ_MODEL environment variable.`,
            availableModels: [
              "llama-3.3-70b-versatile",
              "llama-3.1-70b-versatile",
              "mixtral-8x7b-32768",
              "gemma2-9b-it"
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
          errorMessage.includes("context window")) {
        return c.json(
          {
            error: "Message too long",
            details: "The message exceeds the model's context window. Please reduce the length.",
            maxTokens: 131072, // Llama 3.3 context window
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
      id: "llama-3.3-70b-versatile",
      name: "Llama 3.3 70B Versatile",
      context: 131072,
      bestFor: "General purpose, reasoning, coding",
      cost: "Low",
      speed: "Ultra-fast",
    },
    {
      id: "llama-3.1-70b-versatile",
      name: "Llama 3.1 70B Versatile",
      context: 131072,
      bestFor: "General purpose, reasoning",
      cost: "Low",
      speed: "Ultra-fast",
    },
    {
      id: "mixtral-8x7b-32768",
      name: "Mixtral 8x7b",
      context: 32768,
      bestFor: "Complex reasoning, multilingual",
      cost: "Low",
      speed: "Very fast",
    },
    {
      id: "gemma2-9b-it",
      name: "Gemma 2 9B",
      context: 8192,
      bestFor: "Fast responses, simple tasks",
      cost: "Very low",
      speed: "Ultra-fast",
    },
  ];

  const currentModel = availableModels.find(
    (m) => m.id === (c.env.GROQ_MODEL || "llama-3.3-70b-versatile")
  );

  return c.json({
    current: currentModel || availableModels[0],
    available: availableModels,
  });
});

// Start server (if running directly)
const port = parseInt(process.env.PORT || "3001");

if (require.main === module) {
  console.log(`⚡ Groq AI Server starting on port ${port}`);
  console.log(`📝 Model: ${process.env.GROQ_MODEL || "llama-3.3-70b-versatile"}`);
  console.log(`🔑 API Key: ${process.env.GROQ_API_KEY ? "✅ Configured" : "❌ Missing"}`);
  console.log(`🌐 Health Check: http://localhost:${port}/health`);
  console.log(`💬 Chat Endpoint: http://localhost:${port}/ai`);
}

export default app;
