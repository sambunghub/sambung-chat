#!/usr/bin/env bun
/**
 * Generate a valid ENCRYPTION_KEY for development
 *
 * This script generates a cryptographically secure 32-byte (256-bit) key
 * encoded in base64, suitable for the ENCRYPTION_KEY environment variable.
 *
 * Usage:
 *   bun run scripts/generate-encryption-key.ts
 *
 * Output:
 *   A base64-encoded 32-byte key that can be copied to your .env file
 *
 * SECURITY:
 *   - This key is for development/testing purposes
 *   - Store the generated key securely in .env (never commit .env)
 *   - For production, generate a key using a secure method and rotate regularly
 *   - Losing this key will make all encrypted API keys permanently unreadable
 *
 * @example
 * ```bash
 * $ bun run scripts/generate-encryption-key.ts
 *
 * 🔐 Generated ENCRYPTION_KEY
 * ════════════════════════════════════════
 *
# Add this to your apps/server/.env file:
#
# ENCRYPTION_KEY=dGVzdC1leGFtcGxlLWtleS0zMmJ5dGVzLWJhc2U2NGVuY29kZWQ=
#
# ════════════════════════════════════════
# ⚠️  IMPORTANT SECURITY NOTES:
# ════════════════════════════════════════
# 1. Keep this key secret and never commit it to version control
# 2. Back up this key securely - losing it will permanently destroy
#    all encrypted API keys in your database
# 3. Rotate this key regularly (recommended: every 90 days)
# 4. Use different keys for development, staging, and production
# 5. If you need to rotate, follow the key rotation process in
#    docs/setup/api-keys.md
# ```

/**
 * Generate a cryptographically secure 32-byte (256-bit) key
 * encoded in base64 for use as ENCRYPTION_KEY
 *
 * @returns Base64-encoded 32-byte key
 */
function generateEncryptionKey(): string {
  // Generate 32 random bytes (256 bits) using cryptographically secure RNG
  // Bun provides crypto.getRandomValues() as Web Crypto API
  const key = new Uint8Array(32);
  crypto.getRandomValues(key);
  // Return as base64 for easy .env file storage
  return Buffer.from(key).toString('base64');
}

/**
 * Validate the generated key meets requirements
 *
 * @param key - Base64-encoded key to validate
 * @returns true if valid
 * @throws Error if key is invalid
 */
function validateKey(key: string): boolean {
  try {
    const decoded = Buffer.from(key, 'base64');
    if (decoded.length !== 32) {
      throw new Error(`Key must be 32 bytes, got ${decoded.length}`);
    }
    return true;
  } catch (error) {
    throw new Error(`Invalid base64 encoding: ${error}`);
  }
}

function main() {
  try {
    // Generate the key
    const key = generateEncryptionKey();

    // Validate it meets requirements
    validateKey(key);

    // Check for quiet mode (for scripting)
    const isQuiet = process.argv.includes('--quiet') || process.argv.includes('-q');

    if (isQuiet) {
      // Output only the key for easy parsing by scripts
      console.log(key);
      return;
    }

    // Display with clear formatting for interactive use
    console.log('\n🔐 Generated ENCRYPTION_KEY');
    console.log('═'.repeat(60));
    console.log('\n# Add this to your apps/server/.env file:');
    console.log('#');
    console.log(`# ENCRYPTION_KEY=${key}`);
    console.log('#');

    // Security warnings
    console.log('\n# ════════════════════════════════════════');
    console.log('# ⚠️  IMPORTANT SECURITY NOTES:');
    console.log('# ════════════════════════════════════════');
    console.log('# 1. Keep this key secret and never commit it to version control');
    console.log('# 2. Back up this key securely - losing it will permanently destroy');
    console.log('#    all encrypted API keys in your database');
    console.log('# 3. Rotate this key regularly (recommended: every 90 days)');
    console.log('# 4. Use different keys for development, staging, and production');
    console.log('# 5. If you need to rotate, follow the key rotation process in');
    console.log('#    docs/setup/api-keys.md');
    console.log('');
  } catch (error) {
    console.error('\n❌ Error generating encryption key:');
    console.error(error);
    process.exit(1);
  }
}

main();
