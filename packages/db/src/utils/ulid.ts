/**
 * ULID (Universally Unique Lexicographically Sortable Identifier)
 *
 * Format: 01arz3ndektsv4rrffq69g5fav (lowercase)
 * - 26 characters
 * - Crockford's Base32 encoding (lowercase for URL-friendly display)
 * - 48-bit timestamp (milliseconds since Unix epoch)
 * - 80-bit randomness
 *
 * Benefits:
 * - URL-safe (lowercase is more readable)
 * - Time-sortable
 * - Collision-resistant
 * - No coordination needed for generation
 *
 * Note: Existing IDs in database may be uppercase (backward compatible)
 */

import { ulid } from 'ulidx';

/**
 * Generate a new ULID (lowercase for URL-friendly display)
 * @returns A new 26-character ULID string in lowercase
 */
export function generateULID(): string {
  return ulid().toLowerCase();
}

/**
 * Validate if a string is a valid ULID format (case-insensitive)
 * @param id The string to validate
 * @returns true if valid ULID format
 */
export function isValidULID(id: string): boolean {
  // ULID is 26 characters, Crockford's Base32 (0-9, A-Z except I, L, O, U)
  // Case-insensitive to support both existing (uppercase) and new (lowercase) IDs
  const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
  return ulidRegex.test(id);
}

/**
 * Extract timestamp from ULID (case-insensitive)
 * @param ulidString The ULID string
 * @returns Date object representing the ULID timestamp
 */
export function getTimestampFromULID(ulidString: string): Date {
  // Normalize to uppercase for parsing
  const normalized = ulidString.toUpperCase();
  const timestamp = parseInt(normalized.substring(0, 10), 32);
  return new Date(timestamp);
}

/**
 * Drizzle ORM default function for ULID columns
 * Use this as $defaultFn(() => generateULID())
 */
export { ulid as defaultULIDFn } from 'ulidx';
