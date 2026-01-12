import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// AI SDK imports
import { streamText, convertToCoreMessages } from "ai";

// Import provider factory helper functions
import {
  createModelAuto,
  getProviderInfo,
  parseProviderList,
  getFirstConfiguredProvider,
} from "./provider-factory";

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

/**
 * Health check endpoint
 *
 * Shows which provider is currently active and its configuration
 */
app.get("/health", (c) => {
  try {
    // Get provider list from environment
    const providers = parseProviderList(c.env.AI_PROVIDER);

    // Get the first configured provider
    const activeProvider = getFirstConfiguredProvider(providers, c.env);

    if (!activeProvider) {
      return c.json(
        {
          status: "error",
          message: "No AI provider configured",
          configuredProviders: [],
          availableProviders: providers,
        },
        503
      );
    }

    // Get provider info
    const providerInfo = getProviderInfo(activeProvider, c.env);

    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      provider: providerInfo.provider,
      model: providerInfo.model,
      configured: providerInfo.configured,
      baseURL: providerInfo.baseURL,
      availableProviders: providers,
    });
  } catch (error) {
    console.error("[Health Check] Error:", error);
    return c.json(
      {
        status: "error",
        message: "Failed to get provider information",
      },
      500
    );
  }
});

/**
 * Provider info endpoint
 *
 * Returns detailed information about all configured providers
 */
app.get("/ai/providers", (c) => {
  const providers = parseProviderList(c.env.AI_PROVIDER);

  const providerInfos = providers.map((provider) => getProviderInfo(provider, c.env));

  const activeProvider = getFirstConfiguredProvider(providers, c.env);

  return c.json({
    active: activeProvider,
    providers: providerInfos,
    count: {
      total: providers.length,
      configured: providerInfos.filter((p) => p.configured).length,
    },
  });
});

/**
 * AI chat endpoint
 *
 * This endpoint demonstrates the "Easy Switching" pattern:
 * - Provider is selected automatically based on AI_PROVIDER environment variable
 * - No code changes needed to switch between providers
 * - Supports fallback chains (e.g., AI_PROVIDER="openai,anthropic,groq")
 */
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

    // Log request
    const providers = parseProviderList(c.env.AI_PROVIDER);
    console.log(`[Multi-Provider] Processing request with provider chain: ${providers.join(", ")}`);
    console.log(`[Multi-Provider] Message count: ${messages.length}`);

    // Create model automatically (provider selection is handled by the factory)
    const model = createModelAuto(c.env);

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
        console.log(`[Multi-Provider] Generation complete:
          - Tokens: ${result.usage.totalTokens}
          - Prompt: ${result.usage.promptTokens}
          - Completion: ${result.usage.completionTokens}
        `);
      },
    });

    // Return UI message stream response
    return result.toDataStreamResponse();

  } catch (error) {
    console.error("[Multi-Provider] Error in /ai endpoint:", error);

    // Handle errors from provider factory
    if (error instanceof Error) {
      const errorMessage = error.message;

      // No provider configured
      if (errorMessage.includes("No AI provider configured")) {
        return c.json(
          {
            error: "No AI provider configured",
            details: errorMessage,
            hint: "Set AI_PROVIDER environment variable and corresponding API keys",
          },
          503
        );
      }

      // Missing API key for specific provider
      if (errorMessage.includes("API_KEY is required")) {
        return c.json(
          {
            error: "Missing API key",
            details: errorMessage,
            hint: "Please set the required API key in your environment variables",
          },
          500
        );
      }

      // Unsupported provider
      if (errorMessage.includes("Unsupported provider")) {
        return c.json(
          {
            error: "Unsupported provider",
            details: errorMessage,
            supportedProviders: ["openai", "anthropic", "google", "groq", "ollama"],
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

/**
 * Models endpoint
 *
 * Returns available models for the active provider
 */
app.get("/ai/models", (c) => {
  // Get active provider
  const providers = parseProviderList(c.env.AI_PROVIDER);
  const activeProvider = getFirstConfiguredProvider(providers, c.env);

  if (!activeProvider) {
    return c.json(
      {
        error: "No provider configured",
      },
      503
    );
  }

  // Define available models for each provider
  const modelsByProvider: Record<string, Array<{
    id: string;
    name: string;
    context: number;
    bestFor: string;
    cost: string;
  }>> = {
    openai: [
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
    ],
    anthropic: [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        context: 200000,
        bestFor: "Complex reasoning, code",
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
        bestFor: "Complex analysis, writing",
        cost: "High",
      },
    ],
    google: [
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        context: 1000000,
        bestFor: "Fast responses, multimodal",
        cost: "Very Low",
      },
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        context: 1000000,
        bestFor: "Complex reasoning",
        cost: "Low",
      },
    ],
    groq: [
      {
        id: "llama-3.3-70b-versatile",
        name: "Llama 3.3 70B",
        context: 131072,
        bestFor: "General purpose, ultra-fast",
        cost: "Very Low",
      },
      {
        id: "llama-3.1-70b-versatile",
        name: "Llama 3.1 70B",
        context: 131072,
        bestFor: "General purpose",
        cost: "Very Low",
      },
      {
        id: "mixtral-8x7b-32768",
        name: "Mixtral 8x7b",
        context: 32768,
        bestFor: "Fast responses",
        cost: "Very Low",
      },
    ],
    ollama: [
      {
        id: "llama3.2",
        name: "Llama 3.2",
        context: 128000,
        bestFor: "General purpose",
        cost: "Free (local)",
      },
      {
        id: "llama3.1",
        name: "Llama 3.1",
        context: 128000,
        bestFor: "General purpose",
        cost: "Free (local)",
      },
      {
        id: "mistral",
        name: "Mistral 7B",
        context: 32768,
        bestFor: "Fast responses",
        cost: "Free (local)",
      },
    ],
  };

  const availableModels = modelsByProvider[activeProvider] || [];
  const providerInfo = getProviderInfo(activeProvider, c.env);

  const currentModel = availableModels.find(
    (m) => m.id === providerInfo.model
  );

  return c.json({
    provider: activeProvider,
    current: currentModel || availableModels[0],
    available: availableModels,
  });
});

// Start server (if running directly)
const port = parseInt(process.env.PORT || "3001");

if (require.main === module) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  🚀 Multi-Provider AI Server                                    ║
║  Easy Provider Switching via Environment Variables              ║
╚════════════════════════════════════════════════════════════════╝

📡 Server running on port ${port}
🔄 Provider: ${process.env.AI_PROVIDER || "openai"} (auto-selected)
🔑 Configured Providers: ${parseProviderList(process.env.AI_PROVIDER).join(", ")}

Endpoints:
  🌐 Health Check:  http://localhost:${port}/health
  💬 Chat:          POST http://localhost:${port}/ai
  📊 Providers:     http://localhost:${port}/ai/providers
  📝 Models:        http://localhost:${port}/ai/models

Provider Switching:
  1️⃣  Set AI_PROVIDER=openai (or anthropic, google, groq, ollama)
  2️⃣  Set corresponding API key (e.g., OPENAI_API_KEY=sk-...)
  3️⃣  No code changes needed!

Fallback Chain Example:
  AI_PROVIDER=openai,anthropic,groq
  (Tries OpenAI first, falls back to Anthropic, then Groq)

`);
}

export default app;
