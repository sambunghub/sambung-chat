/**
 * Encryption Unit Tests
 *
 * Purpose: Test AES-256-GCM encryption/decryption functionality for API key storage
 *
 * Security Tests:
 * - Encrypt/decrypt cycle integrity
 * - IV uniqueness (same plaintext produces different ciphertexts)
 * - Authentication tag validation
 * - Key length validation
 * - Environment variable handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  encrypt,
  decrypt,
  generateEncryptionKey,
  extractLastChars,
  validateEncryptionConfig,
} from './encryption';

// Store original ENCRYPTION_KEY to restore after tests
let originalEncryptionKey: string | undefined;

describe('Encryption Utilities', () => {
  beforeEach(() => {
    // Save original ENCRYPTION_KEY
    originalEncryptionKey = process.env.ENCRYPTION_KEY;
  });

  afterEach(() => {
    // Restore original ENCRYPTION_KEY
    if (originalEncryptionKey === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = originalEncryptionKey;
    }
  });

  describe('generateEncryptionKey', () => {
    it('should generate a valid 32-byte base64-encoded key', () => {
      const key = generateEncryptionKey();

      // Should be a non-empty string
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);

      // Should be valid base64
      const decoded = Buffer.from(key, 'base64');
      expect(decoded.length).toBe(32); // 256 bits

      // Should only contain base64 characters
      expect(key).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should generate different keys on each call', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });

    it('should generate keys that can be used as ENCRYPTION_KEY', () => {
      const key = generateEncryptionKey();
      process.env.ENCRYPTION_KEY = key;

      // Should not throw when used with encrypt
      expect(() => encrypt('test-api-key')).not.toThrow();
    });
  });

  describe('extractLastChars', () => {
    it('should extract last 4 characters by default', () => {
      const key = 'sk-1234567890abcdef';
      const result = extractLastChars(key);

      expect(result).toBe('cdef');
    });

    it('should extract specified number of characters', () => {
      const key = 'sk-1234567890abcdef';
      const result = extractLastChars(key, 8);

      expect(result).toBe('90abcdef');
    });

    it('should return entire string if count exceeds length', () => {
      const key = 'sk-test';
      const result = extractLastChars(key, 10);

      expect(result).toBe('sk-test');
    });

    it('should return empty string for null input', () => {
      const result = extractLastChars(null as any);

      expect(result).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const result = extractLastChars(undefined as any);

      expect(result).toBe('');
    });

    it('should return empty string for empty string', () => {
      const result = extractLastChars('');

      expect(result).toBe('');
    });

    it('should handle single character string', () => {
      const result = extractLastChars('a');

      expect(result).toBe('a');
    });
  });

  describe('validateEncryptionConfig', () => {
    it('should return true when ENCRYPTION_KEY is valid', () => {
      const validKey = Buffer.alloc(32, 'a').toString('base64');
      process.env.ENCRYPTION_KEY = validKey;

      const result = validateEncryptionConfig();

      expect(result).toBe(true);
    });

    it('should throw when ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;

      expect(() => validateEncryptionConfig()).toThrow(
        'ENCRYPTION_KEY environment variable is not set'
      );
    });

    it('should throw when ENCRYPTION_KEY is invalid base64', () => {
      process.env.ENCRYPTION_KEY = 'not-valid-base64!!!';

      expect(() => validateEncryptionConfig()).toThrow('Invalid ENCRYPTION_KEY');
    });

    it('should throw when ENCRYPTION_KEY is too short', () => {
      const shortKey = Buffer.alloc(16, 'a').toString('base64');
      process.env.ENCRYPTION_KEY = shortKey;

      expect(() => validateEncryptionConfig()).toThrow('must be exactly 32 bytes');
    });

    it('should throw when ENCRYPTION_KEY is too long', () => {
      const longKey = Buffer.alloc(64, 'a').toString('base64');
      process.env.ENCRYPTION_KEY = longKey;

      expect(() => validateEncryptionConfig()).toThrow('must be exactly 32 bytes');
    });
  });

  describe('encrypt', () => {
    beforeEach(() => {
      // Set up a valid ENCRYPTION_KEY for each test
      const validKey = Buffer.alloc(32, 'a').toString('base64');
      process.env.ENCRYPTION_KEY = validKey;
    });

    it('should encrypt plaintext successfully', () => {
      const plaintext = 'sk-1234567890abcdef';
      const result = encrypt(plaintext);

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('authTag');

      // Encrypted data should be base64
      expect(result.encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/);

      // IV should be hex (12 bytes = 24 hex chars)
      expect(result.iv).toMatch(/^[a-f0-9]{24}$/i);

      // Auth tag should be hex (16 bytes = 32 hex chars)
      expect(result.authTag).toMatch(/^[a-f0-9]{32}$/i);
    });

    it('should throw when ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;

      expect(() => encrypt('test-key')).toThrow('ENCRYPTION_KEY environment variable is not set');
    });

    it('should throw for empty string', () => {
      expect(() => encrypt('')).toThrow('Plaintext must be a non-empty string');
    });

    it('should throw for null input', () => {
      expect(() => encrypt(null as any)).toThrow('Plaintext must be a non-empty string');
    });

    it('should throw for undefined input', () => {
      expect(() => encrypt(undefined as any)).toThrow('Plaintext must be a non-empty string');
    });

    it('should throw for non-string input', () => {
      expect(() => encrypt(123 as any)).toThrow('Plaintext must be a non-empty string');
    });

    it('should produce different ciphertexts for the same plaintext', () => {
      const plaintext = 'sk-1234567890abcdef';

      const result1 = encrypt(plaintext);
      const result2 = encrypt(plaintext);

      // Different ciphertexts due to random IV
      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);

      // But both should decrypt successfully
      expect(decrypt(result1.encrypted)).toBe(plaintext);
      expect(decrypt(result2.encrypted)).toBe(plaintext);
    });

    it('should handle long API keys', () => {
      const longKey = 'sk-' + 'a'.repeat(200);
      const result = encrypt(longKey);

      expect(result.encrypted.length).toBeGreaterThan(0);
      expect(decrypt(result.encrypted)).toBe(longKey);
    });

    it('should handle special characters', () => {
      const specialKey = 'sk-!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const result = encrypt(specialKey);

      expect(decrypt(result.encrypted)).toBe(specialKey);
    });

    it('should handle Unicode characters', () => {
      const unicodeKey = 'sk-世界🔑🚀test';
      const result = encrypt(unicodeKey);

      expect(decrypt(result.encrypted)).toBe(unicodeKey);
    });

    it('should handle newlines and tabs', () => {
      const multilineKey = 'sk-test\nkey\twith\nnewlines';
      const result = encrypt(multilineKey);

      expect(decrypt(result.encrypted)).toBe(multilineKey);
    });

    it('should include IV and auth tag in combined encrypted output', () => {
      const plaintext = 'sk-test';
      const result = encrypt(plaintext);

      // Decode the base64 encrypted data
      const combined = Buffer.from(result.encrypted, 'base64');

      // Should be at least IV (12) + auth tag (16) bytes
      expect(combined.length).toBeGreaterThanOrEqual(28);
    });
  });

  describe('decrypt', () => {
    beforeEach(() => {
      // Set up a valid ENCRYPTION_KEY for each test
      const validKey = Buffer.alloc(32, 'a').toString('base64');
      process.env.ENCRYPTION_KEY = validKey;
    });

    it('should decrypt encrypted data successfully', () => {
      const plaintext = 'sk-1234567890abcdef';
      const encrypted = encrypt(plaintext);

      const decrypted = decrypt(encrypted.encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw when ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;

      expect(() => decrypt('dummy-data')).toThrow('ENCRYPTION_KEY environment variable is not set');
    });

    it('should throw for empty string', () => {
      expect(() => decrypt('')).toThrow('Encrypted data must be a non-empty string');
    });

    it('should throw for null input', () => {
      expect(() => decrypt(null as any)).toThrow('Encrypted data must be a non-empty string');
    });

    it('should throw for undefined input', () => {
      expect(() => decrypt(undefined as any)).toThrow('Encrypted data must be a non-empty string');
    });

    it('should throw for non-string input', () => {
      expect(() => decrypt(123 as any)).toThrow('Encrypted data must be a non-empty string');
    });

    it('should throw for invalid base64', () => {
      expect(() => decrypt('not-valid-base64!!!')).toThrow('Decryption failed');
    });

    it('should throw for truncated encrypted data', () => {
      // Valid base64 but too short to contain IV + auth tag
      const shortData = Buffer.alloc(10, 'a').toString('base64');

      expect(() => decrypt(shortData)).toThrow('too short');
    });

    it('should throw for tampered encrypted data', () => {
      const plaintext = 'sk-1234567890abcdef';
      const encrypted = encrypt(plaintext);

      // Tamper with the encrypted data
      const tampered = Buffer.from(encrypted.encrypted, 'base64');
      tampered[28] = tampered[28] ^ 0xff; // Flip a bit in the ciphertext
      const tamperedBase64 = tampered.toString('base64');

      // Decryption should fail due to auth tag mismatch
      expect(() => decrypt(tamperedBase64)).toThrow('Decryption failed');
    });

    it('should throw for data encrypted with different key', () => {
      const plaintext = 'sk-1234567890abcdef';

      // Encrypt with one key
      process.env.ENCRYPTION_KEY = Buffer.alloc(32, 'a').toString('base64');
      const encrypted = encrypt(plaintext);

      // Try to decrypt with different key
      process.env.ENCRYPTION_KEY = Buffer.alloc(32, 'b').toString('base64');

      expect(() => decrypt(encrypted.encrypted)).toThrow('Decryption failed');
    });

    it('should handle encrypted data with special characters', () => {
      const specialKey = 'sk-!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const encrypted = encrypt(specialKey);

      expect(decrypt(encrypted.encrypted)).toBe(specialKey);
    });

    it('should handle encrypted data with Unicode characters', () => {
      const unicodeKey = 'sk-世界🔑🚀test';
      const encrypted = encrypt(unicodeKey);

      expect(decrypt(encrypted.encrypted)).toBe(unicodeKey);
    });

    it('should handle encrypted long keys', () => {
      const longKey = 'sk-' + 'a'.repeat(200);
      const encrypted = encrypt(longKey);

      expect(decrypt(encrypted.encrypted)).toBe(longKey);
    });
  });

  describe('encrypt/decrypt cycle', () => {
    beforeEach(() => {
      // Set up a valid ENCRYPTION_KEY for each test
      const validKey = Buffer.alloc(32, 'a').toString('base64');
      process.env.ENCRYPTION_KEY = validKey;
    });

    it('should maintain data integrity through multiple cycles', () => {
      const original = 'sk-1234567890abcdef';

      let current = original;
      for (let i = 0; i < 5; i++) {
        const encrypted = encrypt(current);
        current = decrypt(encrypted.encrypted);
      }

      expect(current).toBe(original);
    });

    it('should handle common API key formats', () => {
      const apiKeys = [
        // OpenAI
        'sk-1234567890abcdef1234567890abcdef1234567890abcdef',
        // Anthropic
        'sk-ant-api03-1234567890abcdef1234567890abcdef1234567890abcdef',
        // Google
        'AIza1234567890abcdef1234567890abcdef1234567890abcdef',
        // Groq
        'gsk_1234567890abcdef1234567890abcdef1234567890abcdef',
        // Generic
        'pk_test_1234567890abcdef',
      ];

      apiKeys.forEach((apiKey) => {
        const encrypted = encrypt(apiKey);
        const decrypted = decrypt(encrypted.encrypted);

        expect(decrypted).toBe(apiKey);
      });
    });

    it('should preserve exact byte representation', () => {
      const testStrings = [
        '',
        'a',
        'ab',
        'abc',
        'sk-test',
        'sk-1234567890abcdef',
        'sk-' + 'x'.repeat(100),
      ];

      testStrings.forEach((testString) => {
        if (testString.length === 0) {
          // Empty string should throw during encryption
          expect(() => encrypt(testString)).toThrow();
        } else {
          const encrypted = encrypt(testString);
          const decrypted = decrypt(encrypted.encrypted);

          expect(decrypted).toBe(testString);
          expect(decrypted.length).toBe(testString.length);
        }
      });
    });

    it('should be deterministic with same encrypted data', () => {
      const plaintext = 'sk-test';
      const encrypted = encrypt(plaintext);

      // Decrypt the same encrypted data multiple times
      const decrypted1 = decrypt(encrypted.encrypted);
      const decrypted2 = decrypt(encrypted.encrypted);
      const decrypted3 = decrypt(encrypted.encrypted);

      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
      expect(decrypted3).toBe(plaintext);
    });
  });

  describe('Security properties', () => {
    beforeEach(() => {
      // Set up a valid ENCRYPTION_KEY for each test
      const validKey = Buffer.alloc(32, 'a').toString('base64');
      process.env.ENCRYPTION_KEY = validKey;
    });

    it('should not expose plaintext in encrypted output', () => {
      const plaintext = 'sk-1234567890abcdef';
      const encrypted = encrypt(plaintext);

      // Encrypted data should not contain the plaintext
      expect(encrypted.encrypted).not.toContain(plaintext);
      expect(encrypted.iv).not.toContain(plaintext);
      expect(encrypted.authTag).not.toContain(plaintext);
    });

    it('should produce unique IVs for each encryption', () => {
      const plaintext = 'sk-test';

      const ivs = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const encrypted = encrypt(plaintext);
        ivs.add(encrypted.iv);
      }

      // All IVs should be unique
      expect(ivs.size).toBe(iterations);
    });

    it('should have consistent encrypted data length', () => {
      const plaintext = 'sk-test';

      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      // Same plaintext should produce same encrypted length
      expect(encrypted1.encrypted.length).toBe(encrypted2.encrypted.length);
    });

    it('should have IV length of 12 bytes (24 hex chars)', () => {
      const plaintext = 'sk-test';
      const encrypted = encrypt(plaintext);

      expect(encrypted.iv.length).toBe(24); // 12 bytes * 2 hex chars
    });

    it('should have auth tag length of 16 bytes (32 hex chars)', () => {
      const plaintext = 'sk-test';
      const encrypted = encrypt(plaintext);

      expect(encrypted.authTag.length).toBe(32); // 16 bytes * 2 hex chars
    });

    it('should fail with tampered IV', () => {
      const plaintext = 'sk-test';
      const encrypted = encrypt(plaintext);

      // Tamper with the combined data (modifies IV in storage)
      const tampered = Buffer.from(encrypted.encrypted, 'base64');
      tampered[5] = tampered[5] ^ 0xff; // Flip a bit in the IV
      const tamperedBase64 = tampered.toString('base64');

      expect(() => decrypt(tamperedBase64)).toThrow('Decryption failed');
    });

    it('should fail with tampered auth tag', () => {
      const plaintext = 'sk-test';
      const encrypted = encrypt(plaintext);

      // Tamper with the auth tag in the combined data
      const tampered = Buffer.from(encrypted.encrypted, 'base64');
      // Auth tag starts at byte 12 (after IV)
      tampered[14] = tampered[14] ^ 0xff; // Flip a bit in the auth tag
      const tamperedBase64 = tampered.toString('base64');

      expect(() => decrypt(tamperedBase64)).toThrow('Decryption failed');
    });
  });
});
