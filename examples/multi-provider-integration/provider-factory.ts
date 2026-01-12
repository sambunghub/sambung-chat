/**
 * Provider Factory - Helper Functions for Easy Provider Switching
 *
 * This module provides utility functions to:
 * 1. Create model instances from any supported provider
 * 2. Switch between providers via environment variables
 * 3. Implement multi-provider patterns (fallback, load balancing, etc.)
 * 4. Abstract provider-specific configuration
 */

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import type { LanguageModelV1 } from "@ai-sdk/provider";

import type { Env } from "./types";

/**
 * Provider configuration interface
 */
export interface ProviderConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseURL?: string;
  organization?: string;
}

/**
 * Create a model instance for any supported provider
 *
 * This is the main helper function that abstracts provider creation.
 * Just pass the provider name and model ID, and it returns a wrapped model.
 *
 * @param provider - Provider name ("openai" | "anthropic" | "google" | "groq" | "ollama")
 * @param modelId - Model identifier (e.g., "gpt-4o-mini", "claude-3-5-sonnet-20241022")
 * @param env - Environment variables containing API keys and configuration
 * @returns Wrapped language model ready for use with streamText()
 */
export function createProviderModel(
  provider: string,
  modelId: string,
  env: Partial<Env>
): LanguageModelV1 {
  let model: LanguageModelV1;

  switch (provider) {
    case "openai":
      if (!env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is required for OpenAI provider");
      }
      model = openai(modelId, {
        apiKey: env.OPENAI_API_KEY,
        baseURL: env.OPENAI_BASE_URL,
        organization: env.OPENAI_ORGANIZATION,
      });
      break;

    case "anthropic":
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY is required for Anthropic provider");
      }
      model = anthropic(modelId, {
        apiKey: env.ANTHROPIC_API_KEY,
        baseURL: env.ANTHROPIC_BASE_URL,
      });
      break;

    case "google": {
      // Google accepts either variable name
      const googleKey = env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_API_KEY;
      if (!googleKey) {
        throw new Error("GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_API_KEY is required for Google provider");
      }
      model = google(modelId, {
        apiKey: googleKey,
      });
      break;
    }

    case "groq":
      if (!env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is required for Groq provider");
      }
      model = groq(modelId, {
        apiKey: env.GROQ_API_KEY,
        baseURL: env.GROQ_BASE_URL,
      });
      break;

    case "ollama": {
      // Ollama uses OpenAI-compatible client
      const ollamaBaseURL = env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
      const ollamaClient = createOpenAI({
        baseURL: ollamaBaseURL,
        apiKey: "ollama", // Required but not used by Ollama
      });
      model = ollamaClient(modelId);
      break;
    }

    default:
      throw new Error(`Unsupported provider: ${provider}. Supported providers: openai, anthropic, google, groq, ollama`);
  }

  // Wrap with middleware (DevTools for debugging, can be replaced with custom middleware)
  return wrapLanguageModel({
    model,
    middleware: devToolsMiddleware(),
  });
}

/**
 * Get the default model ID for a provider
 *
 * @param provider - Provider name
 * @returns Default model ID for the provider
 */
export function getDefaultModel(provider: string): string {
  const defaults: Record<string, string> = {
    openai: "gpt-4o-mini",
    anthropic: "claude-3-5-sonnet-20241022",
    google: "gemini-2.5-flash",
    groq: "llama-3.3-70b-versatile",
    ollama: "llama3.2",
  };

  return defaults[provider] || "gpt-4o-mini";
}

/**
 * Parse AI_PROVIDER environment variable
 *
 * Handles both single provider ("openai") and fallback chains ("openai,anthropic,groq")
 *
 * @param aiProvider - Value from AI_PROVIDER environment variable
 * @returns Array of provider names
 */
export function parseProviderList(aiProvider?: string): string[] {
  if (!aiProvider) {
    return ["openai"]; // Default to OpenAI
  }

  return aiProvider.split(",").map((p) => p.trim().toLowerCase());
}

/**
 * Validate that required API keys are configured for a provider
 *
 * @param provider - Provider name
 * @param env - Environment variables
 * @returns True if provider is properly configured
 */
export function isProviderConfigured(provider: string, env: Partial<Env>): boolean {
  switch (provider) {
    case "openai":
      return !!env.OPENAI_API_KEY;
    case "anthropic":
      return !!env.ANTHROPIC_API_KEY;
    case "google":
      return !!(env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_API_KEY);
    case "groq":
      return !!env.GROQ_API_KEY;
    case "ollama":
      return true; // Ollama doesn't require API key (local)
    default:
      return false;
  }
}

/**
 * Get the first configured provider from a list
 *
 * Useful for implementing fallback chains
 *
 * @param providers - Array of provider names
 * @param env - Environment variables
 * @returns First configured provider, or null if none are configured
 */
export function getFirstConfiguredProvider(providers: string[], env: Partial<Env>): string | null {
  for (const provider of providers) {
    if (isProviderConfigured(provider, env)) {
      return provider;
    }
  }
  return null;
}

/**
 * Create model with automatic provider selection
 *
 * This function implements the "Easy Switching" pattern:
 * 1. Read AI_PROVIDER from environment
 * 2. Parse provider list (supports fallback chains)
 * 3. Use first configured provider
 * 4. Get default model or use environment-specific model
 *
 * @param env - Environment variables
 * @returns Wrapped language model
 * @throws Error if no provider is configured
 */
export function createModelAuto(env: Partial<Env>): LanguageModelV1 {
  // Parse provider list from environment
  const providers = parseProviderList(env.AI_PROVIDER);

  // Get the first configured provider
  const provider = getFirstConfiguredProvider(providers, env);

  if (!provider) {
    const availableProviders = providers.join(", ");
    throw new Error(
      `No AI provider configured. Please set API keys for one of: ${availableProviders}`
    );
  }

  // Get model ID from provider-specific environment variable or use default
  const modelId = env[`${provider.toUpperCase()}_MODEL` as keyof Env] as string ||
                  getDefaultModel(provider);

  console.log(`[Provider Factory] Using provider: ${provider}`);
  console.log(`[Provider Factory] Model: ${modelId}`);

  return createProviderModel(provider, modelId, env);
}

/**
 * Get provider info for metadata
 *
 * Useful for health checks and logging
 *
 * @param provider - Provider name
 * @param env - Environment variables
 * @returns Provider information object
 */
export function getProviderInfo(provider: string, env: Partial<Env>): {
  provider: string;
  model: string;
  configured: boolean;
  baseURL?: string;
} {
  const modelId = env[`${provider.toUpperCase()}_MODEL` as keyof Env] as string ||
                  getDefaultModel(provider);

  const info: {
    provider: string;
    model: string;
    configured: boolean;
    baseURL?: string;
  } = {
    provider,
    model: modelId,
    configured: isProviderConfigured(provider, env),
  };

  // Add base URL if available
  if (provider === "openai" && env.OPENAI_BASE_URL) {
    info.baseURL = env.OPENAI_BASE_URL;
  } else if (provider === "anthropic" && env.ANTHROPIC_BASE_URL) {
    info.baseURL = env.ANTHROPIC_BASE_URL;
  } else if (provider === "groq" && env.GROQ_BASE_URL) {
    info.baseURL = env.GROQ_BASE_URL;
  } else if (provider === "ollama") {
    info.baseURL = env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
  }

  return info;
}
