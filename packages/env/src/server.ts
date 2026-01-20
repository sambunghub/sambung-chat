import 'dotenv/config';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

const envSchema = createEnv({
  server: {
    // ═══════════════════════════════════════════════════════════════════
    // EXISTING VARIABLES (maintained for backward compatibility)
    // ═══════════════════════════════════════════════════════════════════

    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.string().optional(), // Accept comma-separated origins
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),

    // ═══════════════════════════════════════════════════════════════════
    // AUTHENTICATION METHOD CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Enable email/password authentication.
     * Set to "false" to disable email/password login (e.g., when using SSO only).
     *
     * @default "true"
     */
    EMAIL_PASSWORD_ENABLED: z.string().optional(),
    PUBLIC_EMAIL_PASSWORD_ENABLED: z.string().optional(),

    // ═══════════════════════════════════════════════════════════════════
    // AI PROVIDER SELECTION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Primary AI provider selection.
     * Can be a single provider or comma-separated fallback chain.
     *
     * Examples:
     * - "openai" - Use OpenAI
     * - "anthropic" - Use Anthropic
     * - "openai,anthropic,groq" - Fallback chain (try OpenAI, then Anthropic, then Groq)
     *
     * @default undefined - Auto-select based on available API keys
     */
    AI_PROVIDER: z.string().optional(),

    /**
     * Default AI model (used when provider-specific model is not set).
     *
     * Examples: "gpt-4o-mini", "claude-3-5-sonnet-20241022", "gemini-2.5-flash"
     */
    AI_MODEL: z.string().optional(),

    // ═══════════════════════════════════════════════════════════════════
    // OPENAI CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * OpenAI API key.
     * Get your key from: https://platform.openai.com/api-keys
     *
     * Format: sk-...
     */
    OPENAI_API_KEY: z.string().min(1).optional(),

    /**
     * OpenAI model selection.
     * Defaults to gpt-4o-mini if not specified.
     *
     * Options: gpt-4o-mini, gpt-4o, o1-mini, o1-preview
     */
    OPENAI_MODEL: z.string().optional(),

    /**
     * Custom OpenAI base URL (for proxies or Azure deployments).
     * Defaults to https://api.openai.com/v1
     */
    OPENAI_BASE_URL: z.string().url().optional(),

    /**
     * OpenAI organization ID (for org-level billing).
     */
    OPENAI_ORGANIZATION: z.string().optional(),

    // ═══════════════════════════════════════════════════════════════════
    // ANTHROPIC CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Anthropic API key.
     * Get your key from: https://console.anthropic.com/
     *
     * Format: sk-ant-...
     */
    ANTHROPIC_API_KEY: z.string().min(1).optional(),

    /**
     * Anthropic model selection.
     * Defaults to claude-3-5-sonnet-20241022 if not specified.
     *
     * Options: claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, claude-3-opus-20240229
     */
    ANTHROPIC_MODEL: z.string().optional(),

    /**
     * Custom Anthropic base URL.
     * Defaults to https://api.anthropic.com
     */
    ANTHROPIC_BASE_URL: z.string().url().optional(),

    /**
     * Anthropic API version.
     * Defaults to latest if not specified.
     */
    ANTHROPIC_VERSION: z.string().optional(),

    // ═══════════════════════════════════════════════════════════════════
    // GOOGLE CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Google Generative AI API key (preferred).
     * Get your key from: https://aistudio.google.com/app/apikey
     *
     * Format: AIza...
     *
     * Alternative: GOOGLE_API_KEY (also accepted for backward compatibility)
     */
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
    GOOGLE_API_KEY: z.string().min(1).optional(),

    /**
     * Google model selection.
     * Defaults to gemini-2.5-flash if not specified.
     *
     * Options: gemini-2.5-flash, gemini-2.5-pro
     */
    GOOGLE_MODEL: z.string().optional(),

    // ═══════════════════════════════════════════════════════════════════
    // GROQ CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Groq API key.
     * Get your key from: https://console.groq.com/keys
     *
     * Format: gsk_...
     */
    GROQ_API_KEY: z.string().min(1).optional(),

    /**
     * Groq model selection.
     * Defaults to llama-3.3-70b-versatile if not specified.
     *
     * Options: llama-3.3-70b-versatile, llama-3.1-70b-versatile, mixtral-8x7b-32768
     */
    GROQ_MODEL: z.string().optional(),

    /**
     * Custom Groq base URL.
     * Defaults to https://api.groq.com/openai/v1
     */
    GROQ_BASE_URL: z.string().url().optional(),

    // ═══════════════════════════════════════════════════════════════════
    // OLLAMA CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Ollama model selection.
     * Defaults to llama3.2 if not specified.
     *
     * Note: Ollama runs locally, so no API key is required.
     * Make sure to pull the model first: ollama pull llama3.2
     *
     * Options: llama3.2, llama3.1, mistral, codellama, gemma2, etc.
     */
    OLLAMA_MODEL: z.string().optional(),

    /**
     * Ollama server URL.
     * Defaults to http://localhost:11434/v1
     */
    OLLAMA_BASE_URL: z.string().url().optional(),

    // ═══════════════════════════════════════════════════════════════════
    // KEYCLOAK OIDC CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Keycloak base URL.
     * Format: https://your-keycloak-domain
     * Example: https://keycloak.example.com
     */
    KEYCLOAK_URL: z.string().url().optional(),

    /**
     * Keycloak realm name.
     * Example: myrealm
     */
    KEYCLOAK_REALM: z.string().optional(),

    /**
     * Keycloak client ID for OIDC authentication.
     * Create a client in your Keycloak realm to get this value.
     */
    KEYCLOAK_CLIENT_ID: z.string().optional(),

    /**
     * Keycloak client secret for OIDC authentication.
     * Create a confidential client in Keycloak to get this value.
     */
    KEYCLOAK_CLIENT_SECRET: z.string().optional(),

    /**
     * Keycloak issuer URL (optional, will be constructed from KEYCLOAK_URL and KEYCLOAK_REALM if not provided).
     * Format: https://your-keycloak-domain/realms/your-realm
     * Example: https://keycloak.example.com/realms/myrealm
     */
    KEYCLOAK_ISSUER: z.string().url().optional(),

    // ═══════════════════════════════════════════════════════════════════
    // SECURITY HEADERS CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Enable security headers in production.
     * Set to "false" to disable security headers (useful for development/debugging).
     *
     * @default "true" in production, "false" in development
     */
    SECURITY_HEADERS_ENABLED: z.string().optional(),

    /**
     * Content Security Policy (CSP) header.
     * Controls which resources the browser is allowed to load.
     *
     * Format: semicolon-separated directives
     * Example: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
     *
     * Leave undefined to use default policy (enables necessary resources for the app).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
     */
    CSP_HEADER: z.string().optional(),

    /**
     * Enable CSP Report-Only mode.
     * When set to "true", CSP violations are reported but not enforced.
     * Useful for testing CSP policies before enforcing them.
     *
     * @default "false"
     */
    CSP_REPORT_ONLY: z.string().optional(),

    /**
     * HTTP Strict Transport Security (HSTS) max-age in seconds.
     * Tells browsers to only use HTTPS for the specified duration.
     *
     * Recommended values:
     * - 31536000 (1 year) for production
     * - 0 (disable) for development
     *
     * @default undefined (uses environment-based defaults)
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
     */
    HSTS_MAX_AGE: z.coerce.number().optional(),

    /**
     * HSTS includeSubDomains directive.
     * When set to "true", HSTS applies to all subdomains.
     *
     * @default "true" in production
     */
    HSTS_INCLUDE_SUBDOMAINS: z.string().optional(),

    /**
     * HSTS preload directive.
     * When set to "true", allows domain inclusion in HSTS preload list.
     *
     * @default "false"
     *
     * @see https://hstspreload.org/
     */
    HSTS_PRELOAD: z.string().optional(),

    /**
     * X-Frame-Options header.
     * Controls whether the page can be embedded in frames/iframes.
     *
     * Options:
     * - "DENY": No framing allowed
     * - "SAMEORIGIN": Only allow framing from same origin
     * - "ALLOW-FROM uri": Allow framing from specific URI (deprecated)
     *
     * @default "SAMEORIGIN"
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
     */
    X_FRAME_OPTIONS: z.string().optional(),

    /**
     * X-Content-Type-Options header.
     * Prevents MIME type sniffing.
     *
     * Set to "nosniff" to enable (recommended).
     *
     * @default "nosniff"
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
     */
    X_CONTENT_TYPE_OPTIONS: z.string().optional(),

    /**
     * Referrer-Policy header.
     * Controls how much referrer information is sent.
     *
     * Options:
     * - "no-referrer": No referrer information
     * - "no-referrer-when-downgrade": Full URL when same protocol, otherwise no referrer
     * - "strict-origin-when-cross-origin": Origin only when cross-origin (recommended)
     * - "same-origin": Same origin only
     *
     * @default "strict-origin-when-cross-origin"
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
     */
    REFERRER_POLICY: z.string().optional(),

    /**
     * Permissions-Policy header.
     * Controls which browser features/APIs can be used.
     *
     * Format: comma-separated feature=origin directives
     * Example: "geolocation=(), camera=(self), microphone=()"
     *
     * Leave undefined to use default restrictive policy.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy
     */
    PERMISSIONS_POLICY: z.string().optional(),

    /**
     * Cross-Origin-Embedder-Policy (COOP) header.
     * Isolates the process from same-origin documents.
     *
     * Options:
     * - "unsafe-none": No isolation (default)
     * - "same-origin": Same-origin isolation
     *
     * @default "unsafe-none"
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy
     */
    CROSS_ORIGIN_OPENER_POLICY: z.string().optional(),

    /**
     * Cross-Origin-Resource-Policy (CORP) header.
     * Controls how the resource can be shared across origins.
     *
     * Options:
     * - "same-origin": Same origin only
     * - "same-site": Same site only
     * - "cross-origin": Any origin
     *
     * @default "same-origin"
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy
     */
    CROSS_ORIGIN_RESOURCE_POLICY: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

// Validate that at least one AI provider is configured
function validateAIProviders(env: typeof envSchema): void {
  // Check if at least one provider API key is configured
  const hasAnyProvider =
    env.OPENAI_API_KEY ||
    env.ANTHROPIC_API_KEY ||
    env.GOOGLE_GENERATIVE_AI_API_KEY ||
    env.GOOGLE_API_KEY ||
    env.GROQ_API_KEY ||
    env.AI_PROVIDER === 'ollama'; // Ollama doesn't need API key

  if (!hasAnyProvider) {
    throw new Error(
      'At least one AI provider API key is required. Please configure one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, GROQ_API_KEY, or set AI_PROVIDER=ollama'
    );
  }

  // If AI_PROVIDER is set, validate that all specified providers have API keys
  if (env.AI_PROVIDER) {
    const providers = env.AI_PROVIDER.split(',').map((p) => p.trim().toLowerCase());
    const availableProviders = {
      openai: !!env.OPENAI_API_KEY,
      anthropic: !!env.ANTHROPIC_API_KEY,
      google: !!(env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_API_KEY),
      groq: !!env.GROQ_API_KEY,
      ollama: true, // Always available (no API key needed)
    };

    for (const provider of providers) {
      if (!availableProviders[provider as keyof typeof availableProviders]) {
        throw new Error(
          `Provider "${provider}" is specified in AI_PROVIDER but is missing required API key or configuration.`
        );
      }
    }
  }
}

// Validate and export the environment
// Only run AI provider validation in Node.js/server context
const isBrowserContext = typeof process === 'undefined';

if (!isBrowserContext) {
  // Server context - validate AI providers
  try {
    validateAIProviders(envSchema);
  } catch (error) {
    // Only throw in production, allow test/dev to continue with warning
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    // For test/dev, just log warning
    console.warn('AI provider validation warning:', error);
  }
}

export const env = envSchema;
