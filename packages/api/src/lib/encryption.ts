import * as crypto from 'node:crypto';

/**
 * Encryption result containing the encrypted data and metadata
 */
export interface EncryptedData {
  /** Base64-encoded ciphertext (includes IV and auth tag) */
  encrypted: string;
  /** Initialization vector used for encryption (hex) */
  iv: string;
  /** Authentication tag (hex) */
  authTag: string;
}

/**
 * Encryption utility using AES-256-GCM for secure API key storage
 *
 * Security features:
 * - AES-256-GCM: Authenticated encryption with associated data
 * - Random IV: Unique initialization vector for each encryption
 * - Key derivation: Uses scrypt for memory-hard key derivation
 * - Auth tags: Prevents tampering with encrypted data
 *
 * @example
 * ```ts
 * const encrypted = await encrypt('sk-...');
 * console.log(encrypted.encrypted); // Base64 encrypted data
 *
 * const decrypted = await decrypt(encrypted.encrypted);
 * console.log(decrypted); // 'sk-...'
 * ```
 */

/**
 * Algorithm used for encryption
 */
const ALGORITHM = 'aes-256-gcm';

/**
 * Length of the IV (Initialization Vector) in bytes
 * GCM mode recommends 12 bytes for optimal performance
 */
const IV_LENGTH = 12;

/**
 * Length of the authentication tag in bytes (128 bits for GCM)
 */
const AUTH_TAG_LENGTH = 16;

/**
 * Key derivation parameters using scrypt
 * scrypt is a memory-hard KDF, resistant to GPU/ASIC attacks
 */
const SCRYPT_PARAMS = {
  // CPU/memory cost parameter (must be a power of 2)
  // 16384 = 2^14, recommended for interactive use (2024)
  cost: 16384,
  // Block size parameter
  blockSize: 8,
  // Parallelization parameter
  parallelization: 1,
  // Key length in bytes (256 bits = 32 bytes for AES-256)
  keyLength: 32,
} as const;

/**
 * Get or derive the encryption key from environment variable
 *
 * The ENCRYPTION_KEY must be a base64-encoded string.
 * It's derived using scrypt with a static salt to ensure consistency.
 *
 * @throws {Error} If ENCRYPTION_KEY is not set or is invalid
 * @returns Buffer containing the derived encryption key
 */
function getEncryptionKey(): Buffer {
  const encryptionKeyBase64 = process.env.ENCRYPTION_KEY;

  if (!encryptionKeyBase64) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. ' +
        'Please set a 32-byte base64-encoded key. ' +
        'Generate one with: openssl rand -base64 32'
    );
  }

  try {
    // Decode the base64 encryption key
    const keyMaterial = Buffer.from(encryptionKeyBase64, 'base64');

    // Validate key length
    if (keyMaterial.length !== 32) {
      throw new Error(
        `ENCRYPTION_KEY must be exactly 32 bytes (256 bits), got ${keyMaterial.length} bytes. ` +
          'Generate a valid key with: openssl rand -base64 32'
      );
    }

    // Use scrypt to derive the final encryption key
    // We use a static salt to ensure the same input produces the same key
    // This is acceptable because the IV provides randomness for each encryption
    const salt = Buffer.from('sambung-chat-api-key-encryption-salt-v1', 'utf-8');

    const derivedKey = crypto.scryptSync(keyMaterial, salt, SCRYPT_PARAMS.keyLength, {
      cost: SCRYPT_PARAMS.cost,
      blockSize: SCRYPT_PARAMS.blockSize,
      parallelization: SCRYPT_PARAMS.parallelization,
    });

    if (!derivedKey) {
      throw new Error('Failed to derive encryption key using scrypt');
    }

    return derivedKey;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid ENCRYPTION_KEY: ${error.message}`);
    }
    throw new Error('Invalid ENCRYPTION_KEY: Unknown error');
  }
}

/**
 * Encrypt plaintext using AES-256-GCM
 *
 * Each encryption operation uses a unique random IV, ensuring that
 * the same plaintext encrypted multiple times produces different ciphertexts.
 *
 * @param plaintext - The sensitive data to encrypt (e.g., API key)
 * @returns Encrypted data object with base64-encoded ciphertext
 * @throws {Error} If encryption fails
 *
 * @example
 * ```ts
 * const result = await encrypt('sk-1234567890abcdef');
 * // Result contains: encrypted (base64), iv (hex), authTag (hex)
 * ```
 */
export function encrypt(plaintext: string): EncryptedData {
  try {
    // Validate input
    if (!plaintext || typeof plaintext !== 'string') {
      throw new Error('Plaintext must be a non-empty string');
    }

    // Get the encryption key
    const key = getEncryptionKey();

    // Generate a random IV for each encryption (critical for security)
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the data
    const ciphertextPart1 = cipher.update(plaintext, 'utf-8');
    const ciphertextPart2 = cipher.final();
    const ciphertext = Buffer.concat([ciphertextPart1, ciphertextPart2]);

    // Get the authentication tag (important for GCM mode)
    const authTag = cipher.getAuthTag();

    // Combine IV + auth tag + ciphertext
    // Format: [IV (12 bytes)][Auth Tag (16 bytes)][Ciphertext]
    const combined = Buffer.concat([iv, authTag, ciphertext]);

    // Return as base64 for easy storage
    return {
      encrypted: combined.toString('base64'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
    throw new Error('Encryption failed: Unknown error');
  }
}

/**
 * Decrypt ciphertext that was encrypted using the encrypt() function
 *
 * @param encryptedBase64 - Base64-encoded encrypted data (from encrypt().encrypted)
 * @returns The original plaintext
 * @throws {Error} If decryption fails or authentication tag is invalid
 *
 * @example
 * ```ts
 * const encrypted = await encrypt('sk-1234567890abcdef');
 * const decrypted = await decrypt(encrypted.encrypted);
 * // decrypted === 'sk-1234567890abcdef'
 * ```
 */
export function decrypt(encryptedBase64: string): string {
  try {
    // Validate input
    if (!encryptedBase64 || typeof encryptedBase64 !== 'string') {
      throw new Error('Encrypted data must be a non-empty string');
    }

    // Get the encryption key
    const key = getEncryptionKey();

    // Decode the base64 data
    const combined = Buffer.from(encryptedBase64, 'base64');

    // Validate minimum length (IV + auth tag)
    const minExpectedLength = IV_LENGTH + AUTH_TAG_LENGTH;
    if (combined.length < minExpectedLength) {
      throw new Error(
        `Invalid encrypted data: too short (expected at least ${minExpectedLength} bytes, got ${combined.length})`
      );
    }

    // Extract IV, auth tag, and ciphertext
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Set the authentication tag (critical for GCM mode)
    decipher.setAuthTag(authTag);

    // Decrypt the data
    let plaintext = decipher.update(ciphertext, undefined, 'utf-8');
    plaintext += decipher.final('utf-8');

    return plaintext;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
    throw new Error('Decryption failed: Unknown error');
  }
}

/**
 * Generate a random encryption key for development/testing
 *
 * This function should ONLY be used for generating a new ENCRYPTION_KEY
 * for the .env file. It should never be used to generate keys on-the-fly
 * in production code.
 *
 * @returns A base64-encoded 32-byte (256-bit) key suitable for ENCRYPTION_KEY
 *
 * @example
 * ```bash
 * # Run this once to generate a key for your .env file
 * bun run -e "import { generateEncryptionKey } from './packages/api/src/lib/encryption.ts'; console.log(generateEncryptionKey())"
 * ```
 */
export function generateEncryptionKey(): string {
  // Generate 32 random bytes (256 bits)
  const key = crypto.randomBytes(32);
  // Return as base64 for easy .env file storage
  return key.toString('base64');
}

/**
 * Extract the last N characters from a string for identification
 *
 * This is useful for displaying the last 4 characters of an API key
 * without exposing the entire key.
 *
 * @param key - The full API key or sensitive string
 * @param count - Number of characters to extract (default: 4)
 * @returns The last N characters, or fewer if the string is shorter
 *
 * @example
 * ```ts
 * const last4 = extractLastChars('sk-1234567890abcdef', 4);
 * // last4 === 'cdef'
 * ```
 */
export function extractLastChars(key: string, count: number = 4): string {
  if (!key || typeof key !== 'string') {
    return '';
  }
  return key.slice(-count);
}

/**
 * Validate encryption configuration without performing actual encryption
 *
 * This is useful for startup validation to ensure the ENCRYPTION_KEY
 * is properly configured before the application accepts requests.
 *
 * @returns true if configuration is valid
 * @throws {Error} If configuration is invalid
 *
 * @example
 * ```ts
 * // During application startup
 * try {
 *   validateEncryptionConfig();
 *   console.log('Encryption configuration is valid');
 * } catch (error) {
 *   console.error('Encryption configuration error:', error);
 *   process.exit(1);
 * }
 * ```
 */
export function validateEncryptionConfig(): boolean {
  // This will throw if ENCRYPTION_KEY is invalid
  getEncryptionKey();
  return true;
}
