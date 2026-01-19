import { z } from 'zod';

/**
 * ULID Format Validation
 * ULID is 26 characters, Crockford's Base32 alphabet (0-9, A-Z except I, L, O, U)
 * Format: 01arz3ndektsv4rrffq69g5fav (lowercase)
 * Note: Validation is case-insensitive for backward compatibility
 */
export const ulidSchema = z
  .string()
  .length(26, 'ULID must be exactly 26 characters')
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/i, 'ULID must contain only valid Crockford Base32 characters');

/**
 * Optional ULID schema
 */
export const ulidOptionalSchema = ulidSchema.optional().nullable();

/**
 * Validate if a string is a valid ULID
 */
export function isValidULID(id: string): boolean {
  return ulidSchema.safeParse(id).success;
}

/**
 * Extract timestamp from ULID (case-insensitive)
 */
export function getTimestampFromULID(ulidString: string): Date {
  // Normalize to uppercase for parsing
  const normalized = ulidString.toUpperCase();
  const timestamp = parseInt(normalized.substring(0, 10), 32);
  return new Date(timestamp);
}
