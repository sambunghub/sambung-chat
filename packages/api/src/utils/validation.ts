import { z } from 'zod';

/**
 * ULID Format Validation
 * ULID is 26 characters, Crockford's Base32 alphabet (0-9, A-Z except I, L, O, U)
 * Format: 01ARZ3NDEKTSV4RRFFQ69G5FAV
 */
export const ulidSchema = z
  .string()
  .length(26, 'ULID must be exactly 26 characters')
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'ULID must contain only valid Crockford Base32 characters');

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
 * Extract timestamp from ULID
 */
export function getTimestampFromULID(ulidString: string): Date {
  const timestamp = parseInt(ulidString.substring(0, 10), 32);
  return new Date(timestamp);
}
