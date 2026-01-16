/**
 * ULID (Universally Unique Lexicographically Sortable Identifier)
 *
 * Format: 01ARZ3NDEKTSV4RRFFQ69G5FAV
 * - 26 characters
 * - Crockford's Base32 encoding
 * - 48-bit timestamp (milliseconds since Unix epoch)
 * - 80-bit randomness
 *
 * Benefits:
 * - URL-safe
 * - Time-sortable
 * - Collision-resistant
 * - No coordination needed for generation
 */

import { ulid } from 'ulidx';

/**
 * Generate a new ULID
 * @returns A new 26-character ULID string
 */
export function generateULID(): string {
  return ulid();
}

/**
 * Validate if a string is a valid ULID format
 * @param id The string to validate
 * @returns true if valid ULID format
 */
export function isValidULID(id: string): boolean {
  // ULID is 26 characters, Crockford's Base32 (0-9, A-Z except I, L, O, U)
  const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/;
  return ulidRegex.test(id);
}

/**
 * Extract timestamp from ULID
 * @param ulidString The ULID string
 * @returns Date object representing the ULID timestamp
 */
export function getTimestampFromULID(ulidString: string): Date {
  const timestamp = parseInt(ulidString.substring(0, 10), 32);
  return new Date(timestamp);
}

/**
 * Drizzle ORM default function for ULID columns
 * Use this as $defaultFn(() => generateULID())
 */
export { ulid as defaultULIDFn } from 'ulidx';
