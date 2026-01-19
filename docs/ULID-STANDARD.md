# ULID Standard - ID Generation Policy

## Overview

**Decision Date:** 2026-01-16
**Status:** Active Standard
**Applies To:** All new database entities

**Policy:** All database IDs MUST use ULID (Universally Unique Lexicographically Sortable Identifier) instead of integer/auto-increment IDs.

## Why ULID Instead of Integer?

### Problems with Integer IDs

1. **Security Risk:** Exposes record count and makes enumeration attacks trivial
2. **Scalability Limits:** Requires database coordination for distributed systems
3. **Not Sortable:** Doesn't encode time information
4. **Collision Risk:** In sharded/distributed environments, coordination is expensive

### Advantages of ULID

1. **Security:** Doesn't expose database record counts or internal structure
2. **Time-Sortable:** Encodes timestamp in first 10 characters (milliseconds since Unix epoch)
3. **Collision Resistant:** 80-bit randomness provides extremely low collision probability
4. **URL-Safe:** Uses Crockford's Base32 alphabet (no special characters)
5. **No Coordination:** Distributed generation without coordination
6. **Compact:** 26 characters vs UUID's 36 characters
7. **Lexicographically Sortable:** Natural sorting = chronological sorting

## ULID Format

```
 01ARZ3NDEKTSV4RRFFQ69G5FAV
 |------------| |----------------|
  Timestamp     Randomness
  (48 bits)     (80 bits)
  (10 chars)    (16 chars)
```

- **Length:** 26 characters
- **Charset:** Crockford's Base32 (0-9, A-Z excluding I, L, O, U)
- **Timestamp:** Milliseconds since Unix epoch (valid until year 10889)
- **Randomness:** 80 bits of entropy
- **Example:** `01ARZ3NDEKTSV4RRFFQ69G5FAV`

## Implementation

### Library Used

```json
{
  "name": "ulidx",
  "version": "^2.4.1",
  "location": "packages/db/package.json"
}
```

### Utility Functions

Location: `packages/db/src/utils/ulid.ts`

```typescript
import { ulid } from 'ulidx';

// Generate new ULID
export function generateULID(): string {
  return ulid(); // Returns: "01ARZ3NDEKTSV4RRFFQ69G5FAV"
}

// Validate ULID format
export function isValidULID(id: string): boolean {
  const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/;
  return ulidRegex.test(id);
}

// Extract timestamp from ULID
export function getTimestampFromULID(ulidString: string): Date {
  const timestamp = parseInt(ulidString.substring(0, 10), 32);
  return new Date(timestamp);
}
```

### Database Schema

All tables use TEXT type with ULID default function:

```typescript
import { pgTable, text } from 'drizzle-orm/pg-core';
import { generateULID } from '../utils/ulid';

export const exampleTable = pgTable('example', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateULID()), // ULID instead of serial()
  // ... other fields
});
```

### API Validation

Location: `packages/api/src/utils/validation.ts`

```typescript
import { z } from 'zod';

export const ulidSchema = z
  .string()
  .length(26, 'ULID must be exactly 26 characters')
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'ULID must contain only valid Crockford Base32 characters');

export const ulidOptionalSchema = ulidSchema.optional().nullable();

// Usage in API routers
input: z.object({
  id: ulidSchema, // Instead of z.number()
});
```

## Migration Guide

### When Creating New Tables

```typescript
// ❌ DON'T: Use integer IDs
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
});

// ✅ DO: Use ULID
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateULID()),
});
```

### When Migrating Existing Tables

```sql
-- 1. Add new ULID column
ALTER TABLE chats ADD COLUMN id_ulid TEXT DEFAULT generate_ulid();

-- 2. Migrate data
UPDATE chats SET id_ulid = 'TEMP' || id::text;

-- 3. Update foreign keys in related tables
-- (This requires careful planning and execution)

-- 4. Drop old column and rename new one
ALTER TABLE chats DROP COLUMN id;
ALTER TABLE chats RENAME COLUMN id_ulid TO id;
```

## Testing ULID

### Validation Test

```typescript
import { isValidULID } from '@sambung-chat/db/utils/ulid';

const ulid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
console.log(isValidULID(ulid)); // true

const invalid = 'invalid-ulid!!!';
console.log(isValidULID(invalid)); // false
```

### Timestamp Extraction

```typescript
import { getTimestampFromULID } from '@sambung-chat/db/utils/ulid';

const ulid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const date = getTimestampFromULID(ulid);
console.log(date.toISOString()); // 2016-10-20T15:45:00.000Z
```

## Current Implementation Status

### Tables Migrated to ULID

✅ `folders` - Folder management
✅ `chats` - Chat conversations
✅ `messages` - Chat messages

### Tables Still Using Integer IDs

⚠️ `user` - Authentication table (managed by Better Auth)

### Frontend Types Updated

✅ All components using `id: string` instead of `id: number`
✅ All API calls passing ULID strings
✅ URL routing updated to match 26-character ULID pattern

## Performance Considerations

### Index Performance

- ULID indexes perform similarly to integer indexes
- Time-sortable property means recent IDs are grouped together
- Better cache locality for recently created records

### Storage

- 26 characters vs 4-8 bytes for integers
- Trade-off: Security and scalability vs minimal storage increase
- Mitigation: TEXT columns in PostgreSQL are efficient for short strings

## Security Benefits

### Before (Integer IDs)

```
GET /api/chats/1  ✓
GET /api/chats/2  ✓
GET /api/chats/3  ✓
# Attacker knows there are at least 3 chats
# Can enumerate all IDs easily
```

### After (ULID)

```
GET /api/chats/01ARZ3NDEKTSV4RRFFQ69G5FAV  ✓
# Attacker cannot guess next ID
# No information about database state exposed
```

## Best Practices

### ✅ DO

- Always use `generateULID()` for new IDs
- Validate ULIDs at API boundaries using `ulidSchema`
- Use ULID in URLs and API responses
- Extract timestamps when needed for queries
- **Use `string` type for ALL IDs in frontend/export types**
- **Ensure TypeScript interfaces use `id: string` not `id: number`**

### ❌ DON'T

- Don't use integer IDs for new tables
- Don't try to parse ULID as number
- Don't create custom ID formats
- Don't use UUID instead (ULID is better for our use case)
- **Don't use `number` type for ID fields in any TypeScript interface**
- **Don't convert ULID strings to numbers for export/validation**

## References

- [ULID Specification](https://github.com/ulid/spec)
- [Crockford's Base32](https://www.crockford.com/base32.html)
- [ulidx Library](https://github.com/joerx/ulidx)

## Migration History

- **2026-01-16:** Migrated `folders`, `chats`, `messages` from integer to ULID
- **2026-01-16:** Updated all API validation schemas to use ULID
- **2026-01-16:** Updated all frontend types to use string IDs
- **2026-01-16:** Updated URL routing to match ULID pattern

---

**Last Updated:** 2026-01-16
**Maintained By:** Development Team
