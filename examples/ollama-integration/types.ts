/**
 * Environment variable types for Ollama integration
 */

export interface Env {
  // Optional: Ollama model selection (default: llama3.2)
  OLLAMA_MODEL?: string;

  // Optional: Ollama server URL (default: http://localhost:11434)
  OLLAMA_BASE_URL?: string;

  // Server configuration
  PORT?: string;
  NODE_ENV?: string;
}
