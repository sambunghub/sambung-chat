/**
 * Environment variable types for Anthropic integration
 */
export interface Env {
  // Required
  ANTHROPIC_API_KEY: string;

  // Optional
  ANTHROPIC_MODEL?: string;
  ANTHROPIC_BASE_URL?: string;
  ANTHROPIC_VERSION?: string;
  ANTHROPIC_DANGEROUS_DIRECT_BROWSER_ACCESS?: string;

  // Server configuration
  PORT?: string;
  NODE_ENV?: "development" | "production" | "test";
}
