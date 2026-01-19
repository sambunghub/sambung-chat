# ULID Migration Plan

## Overview

Migrate all database primary keys from auto-incrementing integers to ULIDs (Universally Unique Lexicographically Sortable Identifiers).

## Benefits

- **Security**: Doesn't expose record count (integer IDs expose this)
- **Scalability**: Can generate IDs without database coordination
- **Time Sorting**: ULIDs are time-sortable by default
- **Uniqueness**: Collision-resistant across distributed systems
- **URL-Safe**: Uses Crockford's Base32 alphabet

## Tables to Migrate

### 1. Users (user table)

- `id`: text → ULID
- **Impact**: High - affects authentication and all foreign keys

### 2. Sessions (session table)

- `id`: text → ULID (already text, just validate format)
- `user_id`: text → ULID

### 3. Chats (chats table)

- `id`: serial → ULID
- `user_id`: text → ULID
- `folder_id`: integer → ULID (nullable)

### 4. Messages (messages table)

- `id`: serial → ULID
- `chat_id`: integer → ULID

### 5. Folders (folders table)

- `id`: serial → ULID
- `user_id`: text → ULID

### 6. Prompts (prompts table) - if exists

- `id`: serial → ULID
- `user_id`: text → ULID

## Migration Strategy

### Phase 1: Install Dependencies

```bash
bun add ulidx
bun add -d @types/ulidx
```

### Phase 2: Update Database Schema

1. **Create new ULID columns** (add temporary columns)
2. **Backfill data** (migrate existing integer IDs to ULIDs)
3. **Update foreign keys** to point to new ULID columns
4. **Drop old columns**
5. **Rename new columns** to original names

### Phase 3: Update Drizzle Schema

**packages/db/src/schema/user.ts**

```typescript
import { ulid } from '../utils/ulid'; // Custom ULID utility

export const user = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  // ...
});
```

**packages/db/src/schema/chat.ts**

```typescript
import { ulid } from '../utils/ulid';

export const chats = pgTable('chats', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  folderId: text('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  // ...
});
```

### Phase 4: Update API Schemas

**packages/api/src/routers/chat.ts**

```typescript
import { z } from 'zod';
import { ulidSchema } from '@sambung-chat/api/utils/validation';

export const chatRouter = {
  getById: protectedProcedure
    .input(z.object({ id: ulidSchema })) // Changed from z.number()
    .handler(async ({ input, context }) => {
      // ...
    }),
  // ...
};
```

**packages/api/src/utils/validation.ts** (new file)

```typescript
import { z } from 'zod';

// ULID format: 26 characters, Crockford's Base32
export const ulidSchema = z
  .string()
  .length(26)
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
```

### Phase 5: Update Frontend Routes

**apps/web/src/routes/app/chat/[id]/+page.svelte**

- Already uses `[id]` parameter, just need to change type expectations
- Update `chatId()` derived function to handle string IDs

### Phase 6: Update ORPC Client

**apps/web/src/lib/orpc.ts**

- No changes needed - ORPC handles string types natively

### Phase 7: Update All ID References

**Files to update:**

1. `apps/web/src/lib/components/secondary-sidebar/ChatList.svelte`
   - Change `interface Chat { id: number }` to `id: string`

2. `apps/web/src/lib/components/secondary-sidebar/ChatListItem.svelte`
   - Same change

3. `apps/web/src/routes/app/chat/+page.svelte`
   - Change `currentChatId` from `number` to `string | null`

4. `apps/web/src/routes/app/chat/[id]/+page.svelte`
   - Update `chatId()` to handle string IDs

## Migration Script

**packages/db/scripts/migrate-to-ulid.ts**

```typescript
import { db } from '@sambung-chat/db';
import { ulid } from 'ulidx';

async function migrateToULID() {
  // 1. Create ULID mapping table
  // 2. Generate ULIDs for all existing records
  // 3. Update foreign keys in dependency order
  // 4. Drop old integer columns
}

migrateToULID();
```

## Rollback Plan

1. Keep integer ID columns as `legacy_id` temporarily
2. Create migration script to revert back to integers
3. Test rollback in development environment first

## Testing Checklist

- [ ] Create new chat with ULID
- [ ] View chat list
- [ ] Send message to chat
- [ ] Edit chat title
- [ ] Delete chat
- [ ] Create folder
- [ ] Move chat to folder
- [ ] Pin/unpin chat
- [ ] Export chat
- [ ] User authentication
- [ ] Session management

## Estimated Effort

- **Database Migration**: 4-6 hours
- **Schema Updates**: 2-3 hours
- **API Updates**: 2-3 hours
- **Frontend Updates**: 2-3 hours
- **Testing**: 2-3 hours

**Total**: 12-18 hours

## Risks

1. **Data Loss**: Ensure backups before migration
2. **Downtime**: Plan for maintenance window
3. **Foreign Key Issues**: Handle dependencies carefully
4. **Rollback Complexity**: Test rollback procedure

## Timeline

- **Week 1**: Development and testing
- **Week 2**: Staging deployment and testing
- **Week 3**: Production deployment during maintenance window

## References

- [ULID Spec](https://github.com/ulid/spec)
- [ulidx Package](https://github.com/ulid-js/ulidx)
- [Crockford's Base32](https://www.crockford.com/base32.html)
