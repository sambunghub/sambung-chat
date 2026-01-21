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
    // SECURITY CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * SameSite attribute for session cookies.
     *
     * Security levels:
     * - 'strict': Best security - cookies only sent in first-party context
     * - 'lax': Moderate security - cookies sent with top-level navigations
     * - 'none': Lowest security - cookies sent in all contexts (requires secure=true)
     *
     * Recommended: 'strict' for production, 'lax' for development
     *
     * @default 'strict' in production, 'lax' in development
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
     */
    SAME_SITE_COOKIE: z.enum(['lax', 'strict', 'none']).optional(),

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
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

/**
 * Type guard for SameSite cookie attribute values
 */
function isSameSite(value: string): value is 'lax' | 'strict' | 'none' {
  return ['lax', 'strict', 'none'].includes(value);
}

/**
 * Validates and returns the SameSite cookie setting.
 *
 * Rules:
 * - Defaults to 'strict' in production, 'lax' in development
 * - 'none' is only allowed with secure cookies (production)
 * - Logs the final setting for debugging
 *
 * @throws Error if 'none' is used without secure cookies
 */
export function getValidatedSameSiteSetting(): 'lax' | 'strict' | 'none' {
  // Read directly from process.env for testability
  const nodeEnv = process.env.NODE_ENV || 'development';
  const sameSiteCookie = process.env.SAME_SITE_COOKIE;

  const isProduction = nodeEnv === 'production';
  const isSecure = isProduction; // Secure cookies are only enabled in production

  // Get the user-configured value or use default
  // Empty string should be treated as undefined
  const configuredValue =
    sameSiteCookie && sameSiteCookie.trim() !== '' ? sameSiteCookie : undefined;
  const defaultValue: 'lax' | 'strict' | 'none' = isProduction ? 'strict' : 'lax';

  // Validate that configured value is one of the allowed values using type guard
  const isValidConfig = configuredValue && isSameSite(configuredValue);

  const sameSiteValue: 'lax' | 'strict' | 'none' = isValidConfig ? configuredValue : defaultValue;

  // Validate that 'none' is only used with secure cookies
  if (sameSiteValue === 'none' && !isSecure) {
    throw new Error(
      'SAME_SITE_COOKIE=none requires secure cookies (NODE_ENV=production). ' +
        'Either set NODE_ENV=production or use SAME_SITE_COOKIE=strict|lax'
    );
  }

  // Log the final setting for security debugging
  if (configuredValue) {
    console.log(`[SECURITY] SAME_SITE_COOKIE explicitly set to: ${sameSiteValue}`);
  } else {
    console.log(`[SECURITY] SAME_SITE_COOKIE using default: ${sameSiteValue} (${nodeEnv})`);
  }

  // Warn if using 'lax' in production
  if (isProduction && sameSiteValue === 'lax') {
    console.warn(
      '[SECURITY] WARNING: SAME_SITE_COOKIE=lax in production allows link-based CSRF attacks. ' +
        'Consider using SAME_SITE_COOKIE=strict for better security.'
    );
  }

  // Warn if using 'none'
  if (sameSiteValue === 'none') {
    console.warn(
      '[SECURITY] WARNING: SAME_SITE_COOKIE=none provides minimal CSRF protection. ' +
        'Only use this if you have a specific requirement for cross-site cookie access.'
    );
  }

  return sameSiteValue;
}

// Note: AI provider validation has been removed because AI providers are now
// configured per-user in the database (models table with apiKeyId references).
// The environment variables below are still available for backward compatibility
// and optional global defaults, but are no longer required.

/**
 * Validates and returns sanitized CORS origins.
 *
 * Rules:
 * - Validates each origin as a properly formatted URL
 * - Rejects malformed URLs
 * - Warns about wildcard or overly permissive origins
 * - Logs all allowed origins on startup
 * - Trims whitespace and removes trailing slashes
 * - Rejects origins with embedded credentials (username:password@)
 *
 * @returns Array of validated and sanitized CORS origins
 * @throws Error if any origin is malformed
 */
export function getValidatedCorsOrigins(): string[] {
  const corsOrigin = process.env.CORS_ORIGIN;
  const nodeEnv = process.env.NODE_ENV || 'development';
  const defaultOrigin = 'http://localhost:5174';

  // Use default if not configured
  const rawOrigins = corsOrigin
    ? corsOrigin.split(',').map((origin) => origin.trim())
    : [defaultOrigin];

  const validatedOrigins: string[] = [];
  const warnings: string[] = [];

  for (const origin of rawOrigins) {
    // Skip empty origins
    if (!origin) {
      continue;
    }

    // Check for wildcard
    if (origin === '*' || origin === '*') {
      warnings.push(
        '[SECURITY] WARNING: CORS_ORIGIN=* allows requests from ANY origin. ' +
          'This is highly insecure and should NEVER be used in production.'
      );
      validatedOrigins.push('*');
      continue;
    }

    // Reject origins with embedded credentials
    if (origin.includes('@') && origin.includes('://')) {
      const urlParts = origin.split('://');
      if (urlParts[1]?.includes('@')) {
        throw new Error(
          `Invalid CORS origin "${origin}": Origins with embedded credentials (username:password@) are not allowed.`
        );
      }
    }

    // Validate URL format
    try {
      const url = new URL(origin);

      // Ensure protocol is http or https
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error(`Only http:// and https:// protocols are allowed.`);
      }

      // Warn if URL has pathname, search, or hash (these will be discarded)
      if (url.pathname !== '/' || url.search || url.hash) {
        console.warn(
          `[SECURITY] WARNING: CORS origin "${origin}" contains path, query, or fragment. ` +
            `Only the origin (scheme://host[:port]) will be used.`
        );
      }

      // Use url.origin to get only scheme://host[:port]
      validatedOrigins.push(url.origin);

      // Warn about HTTP in production
      if (nodeEnv === 'production' && url.protocol === 'http:') {
        warnings.push(
          `[SECURITY] WARNING: CORS origin "${url.origin}" uses HTTP in production. ` +
            `HTTPS should be used for security.`
        );
      }

      // Warn about localhost in production
      if (nodeEnv === 'production' && url.hostname === 'localhost') {
        warnings.push(
          `[SECURITY] WARNING: CORS origin "${url.origin}" points to localhost in production. ` +
            `This is likely a misconfiguration.`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        // Don't duplicate the error prefix if it's already there
        const message = error.message.startsWith('Invalid CORS origin')
          ? error.message
          : `Invalid CORS origin "${origin}": ${error.message}`;
        throw new Error(message);
      }
      throw new Error(`Invalid CORS origin "${origin}": Malformed URL`);
    }
  }

  // Log all warnings
  for (const warning of warnings) {
    console.warn(warning);
  }

  // Log all allowed origins
  console.log(
    `[SECURITY] CORS origins: ${validatedOrigins.length === 1 ? validatedOrigins[0] : validatedOrigins.join(', ')}`
  );

  // Warn if no origins configured
  if (validatedOrigins.length === 0) {
    console.warn(
      '[SECURITY] WARNING: No valid CORS origins configured. Using default: http://localhost:5174'
    );
    return [defaultOrigin];
  }

  return validatedOrigins;
}

export const env = envSchema;
