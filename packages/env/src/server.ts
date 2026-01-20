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
    // ENCRYPTION CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Encryption key for API key storage (AES-256-GCM).
     *
     * This key is used to encrypt API keys at rest in the database.
     * Must be a 32-byte base64-encoded key (256 bits).
     *
     * Generate one with:
     * - OpenSSL: openssl rand -base64 32
     * - Node.js: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     * - Bun: bun -e "console.log(crypto.randomBytes(32).toString('base64'))"
     *
     * SECURITY: Keep this key secret! Rotate it only with proper migration.
     * Losing this key will make all encrypted API keys permanently unreadable.
     *
     * @example "dGhpc2lzYW5leGFtcGxlb2ZhMzJieXRlYmFzZTY0ZW5jb2RlZGtleQ=="
     */
    ENCRYPTION_KEY: z
      .string()
      .min(1, 'ENCRYPTION_KEY is required for API key encryption')
      .refine(
        (val) => {
          try {
            const decoded = Buffer.from(val, 'base64');
            // Check if it's valid base64 and exactly 32 bytes (256 bits)
            return decoded.length === 32;
          } catch {
            return false;
          }
        },
        {
          message:
            'ENCRYPTION_KEY must be a 32-byte base64-encoded key (256 bits). ' +
            'Generate one with: openssl rand -base64 32',
        }
      ),

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
    // AI PROVIDER CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════
    //
    // AI providers are now configured via the web UI (Settings → Models).
    // API keys are stored securely in the database (encrypted with AES-256-GCM).
    //
    // No environment variables are needed for AI provider configuration.
    //
    // ═══════════════════════════════════════════════════════════════════

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

// Validate and export the environment
export const env = envSchema;
