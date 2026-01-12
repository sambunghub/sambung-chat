/**
 * Environment variable types for Groq integration
 */

export interface Env {
  // Required: Groq API key
  GROQ_API_KEY: string;

  // Optional: Model selection
  GROQ_MODEL?: string;

  // Optional: Custom base URL (for proxies or custom endpoints)
  GROQ_BASE_URL?: string;

  // Server configuration
  PORT?: string;
  NODE_ENV?: string;
}
