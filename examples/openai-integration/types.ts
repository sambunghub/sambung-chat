/**
 * Environment variable types for OpenAI integration
 */
export interface Env {
  // Required
  OPENAI_API_KEY: string;

  // Optional
  OPENAI_MODEL?: string;
  OPENAI_ORGANIZATION?: string;
  OPENAI_BASE_URL?: string;

  // Server configuration
  PORT?: string;
  NODE_ENV?: "development" | "production" | "test";
}
