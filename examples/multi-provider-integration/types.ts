/**
 * Environment Variable Types for Multi-Provider Integration
 *
 * This template supports easy switching between AI providers
 * through environment configuration.
 */

export interface Env {
  // Provider Selection (choose which provider to use)
  AI_PROVIDER?: "openai" | "anthropic" | "google" | "groq" | "ollama";

  // OpenAI Configuration
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_ORGANIZATION?: string;

  // Anthropic Configuration
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  ANTHROPIC_BASE_URL?: string;

  // Google Configuration
  GOOGLE_GENERATIVE_AI_API_KEY?: string;
  GOOGLE_API_KEY?: string; // Alternative
  GOOGLE_MODEL?: string;

  // Groq Configuration
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
  GROQ_BASE_URL?: string;

  // Ollama Configuration
  OLLAMA_BASE_URL?: string;
  OLLAMA_MODEL?: string;

  // Multi-Provider Fallback Configuration (optional)
  AI_PROVIDER_FALLBACK?: string; // Comma-separated list, e.g., "openai,anthropic,groq"

  // Runtime provider selection (for testing multiple providers)
  AI_PROVIDER_MODE?: "single" | "fallback" | "load-balancing" | "cost-based";

  // Server Configuration
  PORT?: string;
  NODE_ENV?: "development" | "production";
}
