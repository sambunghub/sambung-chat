import { describe, it, expect } from 'vitest';
import { ulidSchema, ulidOptionalSchema, isValidULID, getTimestampFromULID } from './validation';

describe('Validation Utilities', () => {
  describe('ulidSchema', () => {
    it('should validate a correct lowercase ULID', () => {
      const result = ulidSchema.safeParse('01arz3ndektsv4rrffq69g5fav');
      expect(result.success).toBe(true);
    });

    it('should validate a correct uppercase ULID', () => {
      const result = ulidSchema.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FAV');
      expect(result.success).toBe(true);
    });

    it('should validate a mixed case ULID', () => {
      const result = ulidSchema.safeParse('01ArZ3NDeKtSv4RrFfQ69G5FaV');
      expect(result.success).toBe(true);
    });

    it('should reject ULID with invalid characters (I, L, O, U)', () => {
      expect(ulidSchema.safeParse('01arz3ndektsv4rrffq69g5fai').success).toBe(false); // contains I
      expect(ulidSchema.safeParse('01arz3ndektsv4rrffq69g5fal').success).toBe(false); // contains L
      expect(ulidSchema.safeParse('01arz3ndektsv4rrffq69g5fao').success).toBe(false); // contains O
      expect(ulidSchema.safeParse('01arz3ndektsv4rrffq69g5fau').success).toBe(false); // contains U
    });

    it('should reject ULID with special characters', () => {
      expect(ulidSchema.safeParse('01arz3ndektsv4rrffq69g5fa!').success).toBe(false);
      expect(ulidSchema.safeParse('01arz3ndektsv4rrffq69g5fa-').success).toBe(false);
    });

    it('should reject ULID that is too short', () => {
      const result = ulidSchema.safeParse('01arz3ndektsv4rrffq69g5fa');
      expect(result.success).toBe(false);
    });

    it('should reject ULID that is too long', () => {
      const result = ulidSchema.safeParse('01arz3ndektsv4rrffq69g5fava');
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = ulidSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(ulidSchema.safeParse(123).success).toBe(false);
      expect(ulidSchema.safeParse(null).success).toBe(false);
      expect(ulidSchema.safeParse(undefined).success).toBe(false);
      expect(ulidSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('ulidOptionalSchema', () => {
    it('should validate a correct ULID', () => {
      const result = ulidOptionalSchema.safeParse('01arz3ndektsv4rrffq69g5fav');
      expect(result.success).toBe(true);
    });

    it('should accept null', () => {
      const result = ulidOptionalSchema.safeParse(null);
      expect(result.success).toBe(true);
    });

    it('should accept undefined', () => {
      const result = ulidOptionalSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('should reject invalid ULID', () => {
      const result = ulidOptionalSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('isValidULID', () => {
    it('should return true for valid lowercase ULID', () => {
      expect(isValidULID('01arz3ndektsv4rrffq69g5fav')).toBe(true);
    });

    it('should return true for valid uppercase ULID', () => {
      expect(isValidULID('01ARZ3NDEKTSV4RRFFQ69G5FAV')).toBe(true);
    });

    it('should return true for valid mixed case ULID', () => {
      expect(isValidULID('01ArZ3NDeKtSv4RrFfQ69G5FaV')).toBe(true);
    });

    it('should return false for ULID with invalid characters', () => {
      expect(isValidULID('01arz3ndektsv4rrffq69g5fai')).toBe(false); // contains I
      expect(isValidULID('01arz3ndektsv4rrffq69g5fal')).toBe(false); // contains L
      expect(isValidULID('01arz3ndektsv4rrffq69g5fao')).toBe(false); // contains O
      expect(isValidULID('01arz3ndektsv4rrffq69g5fau')).toBe(false); // contains U
    });

    it('should return false for incorrect length', () => {
      expect(isValidULID('01arz3ndektsv4rrffq69g5fa')).toBe(false); // 25 chars
      expect(isValidULID('01arz3ndektsv4rrffq69g5fava')).toBe(false); // 27 chars
      expect(isValidULID('')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidULID('')).toBe(false);
    });

    it('should return false for special characters', () => {
      expect(isValidULID('01arz3ndektsv4rrffq69g5fa!')).toBe(false);
      expect(isValidULID('01arz3ndektsv4rrffq69g5fa-')).toBe(false);
    });

    it('should return false for non-string types', () => {
      expect(isValidULID(null as unknown as string)).toBe(false);
      expect(isValidULID(undefined as unknown as string)).toBe(false);
      expect(isValidULID(123 as unknown as string)).toBe(false);
      expect(isValidULID(0 as unknown as string)).toBe(false);
      expect(isValidULID(true as unknown as string)).toBe(false);
      expect(isValidULID(false as unknown as string)).toBe(false);
      expect(isValidULID({} as unknown as string)).toBe(false);
      expect(isValidULID([] as unknown as string)).toBe(false);
    });

    it('should return false for strings with whitespace', () => {
      expect(isValidULID(' 01arz3ndektsv4rrffq69g5fav')).toBe(false); // leading space
      expect(isValidULID('01arz3ndektsv4rrffq69g5fav ')).toBe(false); // trailing space
      expect(isValidULID('01arz3ndektsv4rrffq69g5 fav')).toBe(false); // space in middle
      expect(isValidULID('\t01arz3ndektsv4rrffq69g5fav')).toBe(false); // leading tab
      expect(isValidULID('01arz3ndektsv4rrffq69g5fav\n')).toBe(false); // trailing newline
    });

    it('should return false for strings with control characters', () => {
      expect(isValidULID('01arz3ndektsv4rrffq69g5fa\0')).toBe(false); // null byte
      expect(isValidULID('01arz3ndektsv4rrffq69g5fa\r')).toBe(false); // carriage return
      expect(isValidULID('01arz3ndektsv4rrffq69g5fa\n')).toBe(false); // newline
      expect(isValidULID('01arz3ndektsv4rrffq69g5fa\t')).toBe(false); // tab
    });

    it('should return false for very long strings', () => {
      const longString = '01arz3ndektsv4rrffq69g5fav' + 'a'.repeat(1000);
      expect(isValidULID(longString)).toBe(false);
    });

    it('should return false for strings with unicode characters', () => {
      expect(isValidULID('01arz3ndektsv4rrffq69g5fa日本')).toBe(false); // japanese characters
      expect(isValidULID('01arz3ndektsv4rrffq69g5fa😀')).toBe(false); // emoji
      expect(isValidULID('01arz3ndektsv4rrffq69g5fa©')).toBe(false); // copyright symbol
      expect(isValidULID('01arz3ndektsv4rrffq69g5fa🚀')).toBe(false); // rocket emoji
    });

    it('should return false for SQL injection attempts', () => {
      expect(isValidULID("'; DROP TABLE users; --")).toBe(false);
      expect(isValidULID("01arz3ndektsv4rrffq69g5fav'; OR '1'='1")).toBe(false);
      expect(isValidULID("01arz3ndektsv4rrffq69g5fa' UNION SELECT * FROM users--")).toBe(false);
    });

    it('should return false for XSS attempts', () => {
      expect(isValidULID('<script>alert("xss")</script>')).toBe(false);
      expect(isValidULID('01arz3ndektsv4rrffq69g5fa<img src=x onerror=alert(1)>')).toBe(false);
      expect(isValidULID('javascript:alert("xss")')).toBe(false);
    });

    it('should return false for strings with only invalid characters', () => {
      expect(isValidULID('ILOUaaaaaaaaaaaaaaaaaaa')).toBe(false);
      expect(isValidULID('!@#$%^&*()_+{}[]|\\:";\'<>?,./')).toBe(false);
      expect(isValidULID('__________________________')).toBe(false);
    });

    it('should return false for partial valid strings', () => {
      expect(isValidULID('01arz3ndektsv4rrffq69g5fa')).toBe(false); // missing one char
      expect(isValidULID('01arz3ndektsv4rrffq69g5')).toBe(false); // much shorter
      expect(isValidULID('01ARZ3NDEK')).toBe(false); // only first half
    });

    it('should return false for strings with mixed valid and invalid sections', () => {
      expect(isValidULID('01arz3ndektsv4rrffq69g5faVALID')).toBe(false); // too long
      expect(isValidULID('INVALID01arz3ndektsv4rrffq')).toBe(false); // wrong chars at start
      expect(isValidULID('01arz3ndIITSV4RRFFQ69G5FAV')).toBe(false); // I in middle
    });
  });

  describe('getTimestampFromULID', () => {
    it('should extract timestamp from lowercase ULID', () => {
      const ulid = '01arz3ndektsv4rrffq69g5fav';
      const timestamp = getTimestampFromULID(ulid);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should extract timestamp from uppercase ULID', () => {
      const ulid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
      const timestamp = getTimestampFromULID(ulid);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should extract same timestamp for same ULID regardless of case', () => {
      const lowerTimestamp = getTimestampFromULID('01arz3ndektsv4rrffq69g5fav');
      const upperTimestamp = getTimestampFromULID('01ARZ3NDEKTSV4RRFFQ69G5FAV');

      expect(lowerTimestamp.getTime()).toBe(upperTimestamp.getTime());
    });

    it('should extract different timestamps for different ULIDs', () => {
      const timestamp1 = getTimestampFromULID('01arz3ndektsv4rrffq69g5fav');
      const timestamp2 = getTimestampFromULID('02arz3ndektsv4rrffq69g5fav');

      expect(timestamp1.getTime()).not.toBe(timestamp2.getTime());
    });

    it('should handle ULID starting with minimum timestamp (0)', () => {
      const ulid = '00000000000000000000000000';
      const timestamp = getTimestampFromULID(ulid);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBe(0);
    });

    it('should handle ULID with high timestamp value', () => {
      const ulid = '7ZZZZZZZZZ' + 'A'.repeat(16);
      const timestamp = getTimestampFromULID(ulid);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should return valid Date for empty string (NaN timestamp)', () => {
      const timestamp = getTimestampFromULID('');

      expect(timestamp).toBeInstanceOf(Date);
      expect(isNaN(timestamp.getTime())).toBe(true);
    });

    it('should return valid Date for invalid ULID with special characters', () => {
      const timestamp = getTimestampFromULID('invalid!@#$%^&*()');

      expect(timestamp).toBeInstanceOf(Date);
    });

    it('should return valid Date for ULID with invalid characters (I, L, O, U)', () => {
      const timestamp1 = getTimestampFromULID('01arz3ndektsv4rrffq69g5fai');
      const timestamp2 = getTimestampFromULID('01arz3ndektsv4rrffq69g5fal');

      expect(timestamp1).toBeInstanceOf(Date);
      expect(timestamp2).toBeInstanceOf(Date);
    });

    it('should handle ULID shorter than 10 characters', () => {
      const timestamp = getTimestampFromULID('01arz3nde');

      // Function doesn't validate, it will parse whatever substring is available
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(0);
    });

    it('should handle mixed case with invalid characters', () => {
      const timestamp = getTimestampFromULID('01ArZ3NDeIiLlOoUu');

      expect(timestamp).toBeInstanceOf(Date);
    });

    it('should handle ULID with whitespace', () => {
      const timestamp1 = getTimestampFromULID(' 01arz3ndektsv4rrffq69g5fav');
      const timestamp2 = getTimestampFromULID('01arz3ndektsv4rrffq69g5fav ');

      expect(timestamp1).toBeInstanceOf(Date);
      expect(timestamp2).toBeInstanceOf(Date);
    });

    it('should handle very short strings', () => {
      const timestamp = getTimestampFromULID('abc');

      expect(timestamp).toBeInstanceOf(Date);
    });

    it('should handle strings with unicode characters', () => {
      const timestamp = getTimestampFromULID('01arz3nde日本語');

      expect(timestamp).toBeInstanceOf(Date);
    });

    it('should produce reasonable timestamps for valid ULIDs', () => {
      const ulid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
      const timestamp = getTimestampFromULID(ulid);
      const timestampMs = timestamp.getTime();

      // ULID timestamps are milliseconds since Unix epoch
      // This should be a reasonable date (after 1970 and before 2100)
      expect(timestampMs).toBeGreaterThan(0);
      expect(timestampMs).toBeLessThan(4102444800000); // Year 2100 in milliseconds
    });
  });
});
