import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('ENCRYPTION_KEY Validation Logic', () => {
  // Extract the same validation schema used in server.ts
  const encryptionKeySchema = z
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
    );

  it('should accept a valid 32-byte base64-encoded key', () => {
    // Valid 32-byte key (base64 encoded) - 44 chars with padding
    // This decodes to exactly 32 bytes
    const validKey = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    const result = encryptionKeySchema.safeParse(validKey);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(validKey);
      // Verify it decodes to exactly 32 bytes
      const decoded = Buffer.from(result.data, 'base64');
      expect(decoded.length).toBe(32);
    }
  });

  it('should reject a key that is not base64', () => {
    const invalidKey = 'not-valid-base64!!!';
    const result = encryptionKeySchema.safeParse(invalidKey);

    expect(result.success).toBe(false);
  });

  it('should reject a key that is too short (less than 32 bytes when decoded)', () => {
    // Only 16 bytes when decoded
    const shortKey = 'AAAAAAAAAAAAAAAAAAAAAA=='; // 16 bytes
    const result = encryptionKeySchema.safeParse(shortKey);

    expect(result.success).toBe(false);
  });

  it('should reject a key that is too long (more than 32 bytes when decoded)', () => {
    // 64 bytes when decoded - 88 chars with padding
    const longKey =
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    const result = encryptionKeySchema.safeParse(longKey);

    expect(result.success).toBe(false);
  });

  it('should reject empty string', () => {
    const result = encryptionKeySchema.safeParse('');

    expect(result.success).toBe(false);
  });

  it('should generate valid keys with crypto.randomBytes(32).toString("base64")', () => {
    // Simulate how users should generate keys - exactly 32 bytes
    const key = Buffer.alloc(32, 'a').toString('base64');
    const result = encryptionKeySchema.safeParse(key);

    expect(result.success).toBe(true);
    if (result.success) {
      // Verify it decodes to exactly 32 bytes
      const decoded = Buffer.from(result.data, 'base64');
      expect(decoded.length).toBe(32);
    }
  });
});
