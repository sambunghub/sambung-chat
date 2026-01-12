import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// AI SDK imports - Using OpenAI-compatible approach for Ollama
import { createOpenAI } from "@ai-sdk/openai";
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
    provider: "ollama",
    model: c.env.OLLAMA_MODEL || "llama3.2",
    serverUrl: c.env.OLLAMA_BASE_URL || "http://localhost:11434",
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

    // Get Ollama configuration
    const baseURL = c.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const modelId = c.env.OLLAMA_MODEL || "llama3.2";

    // Log request
    console.log(`[Ollama] Processing request with model: ${modelId}`);
    console.log(`[Ollama] Server URL: ${baseURL}`);
    console.log(`[Ollama] Message count: ${messages.length}`);

    // Create OpenAI-compatible client for Ollama
    const ollamaClient = createOpenAI({
      baseURL: `${baseURL}/v1`,
      apiKey: "ollama", // Ollama doesn't require a real API key
    });

    // Create model instance with middleware
    const model = wrapLanguageModel({
      model: ollamaClient(modelId),
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
      // Optional: Add callbacks for monitoring
      onFinish: (result) => {
        console.log(`[Ollama] Generation complete:
          - Tokens: ${result.usage.totalTokens}
          - Prompt: ${result.usage.promptTokens}
          - Completion: ${result.usage.completionTokens}
        `);
      },
    });

    // Return UI message stream response
    return result.toDataStreamResponse();

  } catch (error) {
    console.error("[Ollama] Error in /ai endpoint:", error);

    // Handle specific Ollama errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Connection error (Ollama not running)
      if (errorMessage.includes("econnrefused") ||
          errorMessage.includes("connect") ||
          errorMessage.includes("network") ||
          errorMessage.includes("fetch")) {
        return c.json(
          {
            error: "Cannot connect to Ollama server",
            details: "Make sure Ollama is running. Start it with: ollama serve",
            troubleshooting: [
              "Check if Ollama is installed: ollama --version",
              "Start Ollama server: ollama serve",
              "Verify Ollama is running at: " + (c.env.OLLAMA_BASE_URL || "http://localhost:11434"),
            ],
          },
          503
        );
      }

      // Model not found or not pulled
      if (errorMessage.includes("404") ||
          errorMessage.includes("model") ||
          errorMessage.includes("not found")) {
        return c.json(
          {
            error: "Model not found",
            details: `Model '${c.env.OLLAMA_MODEL || 'llama3.2'}' not found in Ollama.`,
            troubleshooting: [
              `Pull the model: ollama pull ${c.env.OLLAMA_MODEL || 'llama3.2'}`,
              "List available models: ollama list",
              "Verify model name is correct",
            ],
            availableModels: [
              "llama3.2",
              "llama3.1",
              "llama2",
              "mistral",
              "codellama",
              "phi3",
              "gemma2",
              "qwen2.5",
            ],
          },
          404
        );
      }

      // Context window exceeded
      if (errorMessage.includes("context") ||
          errorMessage.includes("tokens") ||
          errorMessage.includes("too long")) {
        return c.json(
          {
            error: "Message too long",
            details: "The message exceeds the model's context window. Please reduce the length.",
            recommendation: "Try using a larger model or breaking your message into smaller parts",
          },
          400
        );
      }

      // Invalid request format
      if (errorMessage.includes("invalid") ||
          errorMessage.includes("validation")) {
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
      id: "llama3.2",
      name: "Llama 3.2",
      parameterSize: "3B-70B",
      context: 128000,
      bestFor: "General purpose, fast responses",
      hardware: "CPU/GPU",
      pullCommand: "ollama pull llama3.2",
    },
    {
      id: "llama3.1",
      name: "Llama 3.1",
      parameterSize: "8B-405B",
      context: 128000,
      bestFor: "General purpose, reasoning",
      hardware: "CPU/GPU",
      pullCommand: "ollama pull llama3.1",
    },
    {
      id: "llama2",
      name: "Llama 2",
      parameterSize: "7B-70B",
      context: 4096,
      bestFor: "Basic tasks, limited resources",
      hardware: "CPU",
      pullCommand: "ollama pull llama2",
    },
    {
      id: "mistral",
      name: "Mistral 7B",
      parameterSize: "7B",
      context: 8192,
      bestFor: "Fast, efficient responses",
      hardware: "CPU/GPU",
      pullCommand: "ollama pull mistral",
    },
    {
      id: "codellama",
      name: "Code Llama",
      parameterSize: "7B-34B",
      context: 16384,
      bestFor: "Code generation, programming",
      hardware: "CPU/GPU",
      pullCommand: "ollama pull codellama",
    },
    {
      id: "phi3",
      name: "Phi-3",
      parameterSize: "3.8B-14B",
      context: 128000,
      bestFor: "Lightweight, efficient",
      hardware: "CPU",
      pullCommand: "ollama pull phi3",
    },
    {
      id: "gemma2",
      name: "Gemma 2",
      parameterSize: "2B-27B",
      context: 8192,
      bestFor: "Fast, lightweight tasks",
      hardware: "CPU/GPU",
      pullCommand: "ollama pull gemma2",
    },
    {
      id: "qwen2.5",
      name: "Qwen 2.5",
      parameterSize: "0.5B-72B",
      context: 32768,
      bestFor: "Multilingual, coding",
      hardware: "CPU/GPU",
      pullCommand: "ollama pull qwen2.5",
    },
  ];

  const currentModel = availableModels.find(
    (m) => m.id === (c.env.OLLAMA_MODEL || "llama3.2")
  );

  return c.json({
    current: currentModel || availableModels[0],
    available: availableModels,
    note: "Models must be pulled first with: ollama pull <model-name>",
  });
});

// Start server (if running directly)
const port = parseInt(process.env.PORT || "3001");

if (require.main === module) {
  console.log(`🦙 Ollama AI Server starting on port ${port}`);
  console.log(`📝 Model: ${process.env.OLLAMA_MODEL || "llama3.2"}`);
  console.log(`🔗 Server URL: ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}`);
  console.log(`🌐 Health Check: http://localhost:${port}/health`);
  console.log(`💬 Chat Endpoint: http://localhost:${port}/ai`);
  console.log(`\n⚠️  Make sure Ollama is running: ollama serve`);
  console.log(`⚠️  Make sure the model is pulled: ollama pull ${process.env.OLLAMA_MODEL || "llama3.2"}`);
}

export default app;
