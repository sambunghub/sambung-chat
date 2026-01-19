# SambungChat Database Documentation

**Version:** 0.1.0
**Last Updated:** January 11, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Entity Relationship Diagram](#entity-relationship-diagram)
4. [Table Definitions](#table-definitions)
   - [Better Auth Tables](#better-auth-tables)
   - [Team Tables](#team-tables)
   - [Chat & Message Tables](#chat--message-tables)
   - [Organization Tables](#organization-tables)
   - [Content Tables](#content-tables)
5. [Migration Guide](#migration-guide)
6. [Commands Reference](#commands-reference)
7. [Drizzle Studio](#drizzle-studio)
8. [Seeding & Test Data](#seeding--test-data)
9. [Backup & Restore](#backup--restore)

---

## Overview

SambungChat uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations.

### Technology Stack

| Component      | Technology                | Version |
| -------------- | ------------------------- | ------- |
| **Database**   | PostgreSQL                | 16+     |
| **ORM**        | Drizzle ORM               | ^0.45.1 |
| **Migrations** | Drizzle Kit               | ^0.28.1 |
| **Connection** | postgres.js (via Drizzle) |

### Database Connection

**File:** `packages/db/src/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
```

---

## Database Schema

### Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                │
│                                                                             │
│  ┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐    │
│  │  users   │──────▶│ sessions │       │  chats   │──────▶│ messages │    │
│  │ (auth)   │       │ (auth)   │       │          │       │          │    │
│  └──────────┘       └──────────┘       └──────────┘       └──────────┘    │
│       │                                        │                            │
│       │                                        │                            │
│       ▼                                        ▼                            │
│  ┌──────────┐                          ┌──────────┐                       │
│  │ api_keys │                          │ prompts  │                       │
│  │          │                          │          │                       │
│  └──────────┘                          └──────────┘                       │
│                                                                             │
│  Note: users, sessions managed by Better Auth                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Tables

| Table            | Purpose                | Managed By  |
| ---------------- | ---------------------- | ----------- |
| `users`          | User accounts          | Better Auth |
| `sessions`       | User sessions          | Better Auth |
| `teams`          | Team/Organization data | Custom      |
| `team_members`   | Team membership        | Custom      |
| `team_invites`   | Team invitations       | Custom      |
| `slug_redirects` | Slug change redirects  | Custom      |
| `chats`          | Chat conversations     | Custom      |
| `chat_tags`      | Chat-tag relationships | Custom      |
| `messages`       | Chat messages          | Custom      |
| `folders`        | Chat folders           | Custom      |
| `tags`           | Chat tags              | Custom      |
| `prompts`        | User prompt templates  | Custom      |
| `api_keys`       | Encrypted API keys     | Custom      |

**Related:**

- [teams-concept.md](./teams-concept.md) - Team model explained
- [routes.md](./routes.md) - URL structure for teams

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENTITY RELATIONSHIP DIAGRAM                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│      users       │         │     sessions     │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │────┬────│ id (PK)          │
│ email (unique)   │    │    │ userId (FK)      │
│ name             │    │    │ expiresAt        │
│ passwordHash     │    │    │ token            │
│ createdAt        │    │    └──────────────────┘
│ updatedAt        │    │
└──────────────────┘    │
                         │
                         │ 1:N
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌──────────────────┐         ┌──────────────────┐
│      chats       │         │     api_keys     │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │
│ userId (FK)      │         │ userId (FK)      │
│ title            │         │ provider         │
│ modelId          │         │ encryptedKey     │
│ createdAt        │         │ keyLast4         │
│ updatedAt        │         │ createdAt        │
└──────────────────┘         └──────────────────┘
        │
        │ 1:N
        │
        ▼
┌──────────────────┐
│     messages     │
├──────────────────┤
│ id (PK)          │
│ chatId (FK)      │
│ role             │
│ content          │
│ metadata (JSONB) │
│ createdAt        │
└──────────────────┘

┌──────────────────┐
│     prompts      │
├──────────────────┤
│ id (PK)          │
│ userId (FK)      │
│ name             │
│ content          │
│ variables (JSON) │
│ category         │
│ isPublic         │
│ createdAt        │
│ updatedAt        │
└──────────────────┘
```

---

## Table Definitions

### Better Auth Tables

These tables are managed automatically by Better Auth.

**File:** `packages/db/src/schema/auth.ts`

```typescript
import { authTables } from '@better-auth/drizzle';
import { pgTable } from 'drizzle-orm/pg-core';

export const user = authTables.user;
export const session = authTables.session;
export const account = authTables.account;
export const verification = authTables.verification;
```

### Team Tables

**File:** `packages/db/src/schema/team.ts`

```typescript
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { teams } from './team';

// Teams table (Team = Organization for open-source version)
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // User-selectable, validated format
  description: text('description'),
  createdBy: uuid('created_by')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  settings: jsonb('settings').default('{}'), // Extensible: future team settings
  metadata: jsonb('metadata').default('{}'), // Extensible: future metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

// Team members table (Basic: 2 roles - admin/member)
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id')
    .references(() => teams.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  role: text('role').notNull().default('member'), // 'admin' | 'member'
  // Future: Add roleId REFERENCES roles(id) for RBAC
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

// Team invites table (Email invitations)
export const teamInvites = pgTable('team_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id')
    .references(() => teams.id, { onDelete: 'cascade' })
    .notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'),
  token: text('token').notNull().unique(),
  invitedBy: uuid('invited_by')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  acceptedAt: timestamp('accepted_at'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type TeamInvite = typeof teamInvites.$inferSelect;
export type NewTeamInvite = typeof teamInvites.$inferInsert;

// Slug redirects table (For team slug changes)
export const slugRedirects = pgTable('slug_redirects', {
  id: uuid('id').primaryKey().defaultRandom(),
  oldSlug: text('old_slug').notNull(),
  newSlug: text('new_slug').notNull(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type SlugRedirect = typeof slugRedirects.$inferSelect;
export type NewSlugRedirect = typeof slugRedirects.$inferInsert;
```

**Indexes:**

```typescript
// Teams
export const teamSlugIdx = index('team_slug_idx').on(teams.slug);
export const teamCreatedByIdx = index('team_created_by_idx').on(teams.createdBy);

// Team members
export const teamMemberTeamIdIdx = index('team_member_team_id_idx').on(teamMembers.teamId);
export const teamMemberUserIdIdx = index('team_member_user_id_idx').on(teamMembers.userId);
export const teamMemberTeamUserIdx = index('team_member_team_user_idx').on(
  teamMembers.teamId,
  teamMembers.userId
);

// Team invites
export const teamInviteTokenIdx = index('team_invite_token_idx').on(teamInvites.token);
export const teamInviteEmailIdx = index('team_invite_email_idx').on(teamInvites.email);

// Slug redirects
export const slugRedirectOldSlugIdx = index('slug_redirect_old_slug_idx').on(slugRedirects.oldSlug);
```

---

### Chat Table

**File:** `packages/db/src/schema/chat.ts`

```typescript
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { teams } from './team';
import { folders } from './folder';

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }), // NULL = personal, NOT NULL = team
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }), // Optional folder
  title: text('title').notNull(),
  model: text('model').notNull(), // e.g., "gpt-4", "claude-3-opus"
  provider: text('provider').notNull(), // e.g., "openai", "anthropic"
  settings: jsonb('settings').default('{}').$type<{
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }>(),
  metadata: jsonb('metadata').default('{}'), // Extensible: future metadata
  publicToken: text('public_token').unique(), // For /p/[token] public shares
  isPublic: boolean('is_public').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
```

**Indexes:**

```typescript
// Create index for faster user chat queries
export const chatUserIdIdx = index('chat_user_id_idx').on(chats.userId);
// Create index for team chats
export const chatTeamIdIdx = index('chat_team_id_idx').on(chats.teamId);
// Create composite index for user+team filtering
export const chatUserTeamIdx = index('chat_user_team_idx').on(chats.userId, chats.teamId);
// Create index for folder
export const chatFolderIdIdx = index('chat_folder_id_idx').on(chats.folderId);
// Create index for sorting by updated date
export const chatUpdatedAtIdx = index('chat_updated_at_idx').on(chats.updatedAt);
// Create index for public shares
export const chatPublicTokenIdx = index('chat_public_token_idx')
  .on(chats.publicToken)
  .where(sql`${chats.isPublic} = true`);
```

**Chat Isolation:**

```typescript
// Personal chat (user_id only)
const personalChat = {
  userId: 'user-123',
  teamId: null, // No team
  folderId: 'folder-abc',
};

// Team chat (team_id set)
const teamChat = {
  userId: 'user-123', // Creator
  teamId: 'team-xyz', // Team members can see
  folderId: 'folder-def', // Team folder
};

// Access control logic
async function canAccessChat(userId: string, chat: Chat): Promise<boolean> {
  // Personal chat: only owner
  if (!chat.teamId) {
    return chat.userId === userId;
  }

  // Team chat: check team membership
  const membership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, chat.teamId), eq(teamMembers.userId, userId)),
  });

  return !!membership;
}
```

### Message Table

**File:** `packages/db/src/schema/message.ts`

```typescript
import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { chats } from './chat';

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  chatId: serial('chat_id')
    .references(() => chats.id, { onDelete: 'cascade' })
    .notNull(),
  role: text('role').notNull(), // "user" | "assistant" | "system"
  content: text('content').notNull(),
  metadata: jsonb('metadata').$type<{
    model?: string;
    tokens?: number;
    finishReason?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
```

**Indexes:**

```typescript
export const messageChatIdIdx = index('message_chat_id_idx').on(messages.chatId);
export const messageCreatedAtIdx = index('message_created_at_idx').on(messages.createdAt);
```

### Prompt Table

**File:** `packages/db/src/schema/prompt.ts`

```typescript
import { pgTable, serial, text, timestamp, boolean, uuid, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const prompts = pgTable('prompts', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  content: text('content').notNull(),
  variables: jsonb('variables').$type<string[]>().default([]).notNull(),
  category: text('category').default('general'),
  isPublic: boolean('is_public').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;
```

**Indexes:**

```typescript
export const promptUserIdIdx = index('prompt_user_id_idx').on(prompts.userId);
export const promptCategoryIdx = index('prompt_category_idx').on(prompts.category);
export const promptIsPublicIdx = index('prompt_is_public_idx').on(prompts.isPublic);
```

### API Key Table

**File:** `packages/db/src/schema/api-key.ts`

```typescript
import { pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  provider: text('provider').notNull(), // "openai" | "anthropic" | "google" | "groq" | "ollama"
  encryptedKey: text('encrypted_key').notNull(), // AES-256 encrypted
  keyLast4: text('key_last4').notNull(), // Last 4 chars for identification
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
```

**Indexes:**

```typescript
export const apiKeyUserIdIdx = index('api_key_user_id_idx').on(apiKeys.userId);
export const apiKeyProviderIdx = index('api_key_provider_idx').on(apiKeys.provider);
```

---

### Folder Table

**File:** `packages/db/src/schema/folder.ts`

```typescript
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { teams } from './team';

// Folders for organizing chats (personal OR team-scoped)
export const folders = pgTable('folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }), // NULL = team folder
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }), // NULL = personal folder
  name: text('name').notNull(),
  parentId: uuid('parent_id').references(() => folders.id, { onDelete: 'cascade' }), // For nested folders
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
```

**Constraint:**

```sql
-- A folder is EITHER personal OR team, never both
ALTER TABLE folders ADD CONSTRAINT folder_scope_check CHECK (
  (user_id IS NOT NULL AND team_id IS NULL) OR  -- Personal folder
  (user_id IS NULL AND team_id IS NOT NULL)     -- Team folder
);
```

**Indexes:**

```typescript
// Index for personal folders
export const folderUserIdIdx = index('folder_user_id_idx')
  .on(folders.userId)
  .where(sql`${folders.teamId} IS NULL`);
// Index for team folders
export const folderTeamIdIdx = index('folder_team_id_idx')
  .on(folders.teamId)
  .where(sql`${folders.userId} IS NULL`);
// Index for parent-child relationships
export const folderParentIdIdx = index('folder_parent_id_idx').on(folders.parentId);
```

---

### Tag Table

**File:** `packages/db/src/schema/tag.ts`

```typescript
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { teams } from './team';

// Tags for labeling chats (public, personal, OR team-scoped)
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  color: text('color'), // Hex color for UI: "#ff5733"
  userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }), // NULL = not personal
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }), // NULL = not team
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
```

**Constraint:**

```sql
-- Tag scopes: public (both NULL), personal (user_id only), team (team_id only)
ALTER TABLE tags ADD CONSTRAINT tag_scope_check CHECK (
  (user_id IS NULL AND team_id IS NULL) OR  -- Public tag
  (user_id IS NOT NULL AND team_id IS NULL) OR  -- Personal tag
  (user_id IS NULL AND team_id IS NOT NULL)     -- Team tag
);
```

**Indexes:**

```typescript
// Index for personal tags
export const tagUserIdIdx = index('tag_user_id_idx')
  .on(tags.userId)
  .where(sql`${tags.teamId} IS NULL`);
// Index for team tags
export const tagTeamIdIdx = index('tag_team_id_idx')
  .on(tags.teamId)
  .where(sql`${tags.userId} IS NULL`);
// Index for name search
export const tagNameIdx = index('tag_name_idx').on(tags.name);
```

---

### Chat Tags Table (Many-to-Many)

**File:** `packages/db/src/schema/chat-tag.ts`

```typescript
import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { chats } from './chat';
import { tags } from './tag';

// Many-to-many relationship between chats and tags
export const chatTags = pgTable(
  'chat_tags',
  {
    chatId: uuid('chat_id')
      .references(() => chats.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.tagId] }),
  })
);

export type ChatTag = typeof chatTags.$inferSelect;
export type NewChatTag = typeof chatTags.$inferInsert;
```

**Indexes:**

```typescript
// Index for finding all tags of a chat
export const chatTagChatIdIdx = index('chat_tag_chat_id_idx').on(chatTags.chatId);
// Index for finding all chats with a tag
export const chatTagTagIdIdx = index('chat_tag_tag_id_idx').on(chatTags.tagId);
```

---

### Schema Exports

**File:** `packages/db/src/schema/index.ts`

```typescript
export * from './auth';
export * from './chat';
export * from './message';
export * from './prompt';
export * from './api-key';
```

---

## Migration Guide

### Creating Migrations

```bash
# 1. Modify schema files
# Edit packages/db/src/schema/[table].ts

# 2. Generate migration
bun run db:generate

# This creates: packages/db/drizzle/[timestamp]-[name].sql
```

### Running Migrations

```bash
# Push schema directly (development)
bun run db:push

# Or run migrations (production)
bun run db:migrate
```

### Migration Files

**Example:** `packages/db/drizzle/0001_create_chats.sql`

```sql
-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  model_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS chat_user_id_idx ON chats(user_id);
CREATE INDEX IF NOT EXISTS chat_updated_at_idx ON chats(updated_at);
```

---

## Commands Reference

### Development Commands

```bash
# Start PostgreSQL (Docker)
bun run db:start

# Stop PostgreSQL
bun run db:stop

# Restart PostgreSQL
bun run db:restart

# View logs
bun run db:logs
```

### Migration Commands

```bash
# Generate migration from schema
bun run db:generate

# Push schema to database (dev)
bun run db:push

# Run migrations (prod)
bun run db:migrate

# Rollback last migration
bun run db:rollback

# Drop all tables (⚠️ dangerous)
bun run db:drop
```

### Database Inspection

```bash
# Open Drizzle Studio (GUI)
bun run db:studio

# Open at http://localhost:4983

# View database schema
bun run db:schema

# Check migration status
bun run db:status
```

### Docker Compose

**File:** `packages/db/docker-compose.yml`

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: sambungchat-db
    environment:
      POSTGRES_USER: sambungchat
      POSTGRES_PASSWORD: sambungchat
      POSTGRES_DB: sambungchat
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U sambungchat']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## Drizzle Studio

### Opening Studio

```bash
bun run db:studio
```

Studio opens at `http://localhost:4983`

### Features

- **Browse tables** - View all data
- **Edit records** - Update data inline
- **Run queries** - SQL editor
- **View schema** - Table relationships

### Screenshot

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Drizzle Studio                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Tables:  │  Data                                                  │
│ □ chats  │  ┌─────────────────────────────────────────────────┐   │
│ □ messages│  │  id  │ title         │ user_id  │ updated_at   │   │
│ □ prompts│  │  1   │ Hello AI      │ abc-123  │ 2026-01-11   │   │
│ □ api_keys│  │  2   │ Python Help   │ abc-123  │ 2026-01-10   │   │
│ □ users  │  │  3   │ Test Chat     │ def-456  │ 2026-01-09   │   │
│          │  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Seeding & Test Data

### Seed Script

**File:** `packages/db/src/seed.ts`

````typescript
import { db } from './index';
import { chats, messages, prompts } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create sample chats
  const [chat1] = await db
    .insert(chats)
    .values({
      userId: 'default-user-id',
      title: 'Sample Chat',
      modelId: 'gpt-4',
    })
    .returning();

  // Create sample messages
  await db.insert(messages).values([
    {
      chatId: chat1.id,
      role: 'user',
      content: 'Hello, AI!',
    },
    {
      chatId: chat1.id,
      role: 'assistant',
      content: 'Hello! How can I help you today?',
    },
  ]);

  // Create sample prompts
  await db.insert(prompts).values({
    userId: 'default-user-id',
    name: 'Code Review',
    content: 'Review this code:\n```\n{code}\n```',
    variables: ['code'],
    category: 'coding',
  });

  console.log('✅ Seed complete!');
}

seed().catch(console.error);
````

### Running Seed

```bash
bun run db:seed
```

---

## Backup & Restore

### Backup Database

```bash
# Dump database to SQL file
docker exec sambungchat-db pg_dump -U sambungchat sambungchat > backup.sql

# Or with timestamp
docker exec sambungchat-db pg_dump -U sambungchat sambungchat > backup-$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Restore from SQL file
cat backup.sql | docker exec -i sambungchat-db psql -U sambungchat sambungchat
```

### Backup Volume

```bash
# Backup Docker volume
docker run --rm \
  -v sambungchat_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Restore volume
docker run --rm \
  -v sambungchat_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

---

## Environment Variables

**File:** `apps/server/.env`

```bash
# Database
DATABASE_URL=postgresql://sambungchat:sambungchat@localhost:5432/sambungchat

# For Docker
DATABASE_URL=postgresql://sambungchat:sambungchat@localhost:5432/sambungchat
```

---

## Common Queries

### Using Drizzle ORM

```typescript
import { db } from '@sambung-chat/db';
import { chats, messages } from '@sambung-chat/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

// Get user's chats with message count
const userChats = await db
  .select({
    chat: chats,
    messageCount: sql<number>`count(${messages.id})`,
  })
  .from(chats)
  .leftJoin(messages, eq(chats.id, messages.chatId))
  .where(eq(chats.userId, userId))
  .groupBy(chats.id)
  .orderBy(desc(chats.updatedAt));

// Get chat with messages
const chatWithMessages = await db.query.chats.findFirst({
  where: eq(chats.id, chatId),
  with: {
    messages: {
      orderBy: [asc(messages.createdAt)],
    },
  },
});

// Full-text search on prompts
const searchResults = await db
  .select()
  .from(prompts)
  .where(
    sql`${prompts.name} ILIKE ${`%${searchTerm}%`} OR ${prompts.content} ILIKE ${`%${searchTerm}%`}`
  );
```

---

## Troubleshooting

### Database Connection Failed

**Problem:** `connection refused`

**Solution:**

```bash
# Check if PostgreSQL is running
docker ps | grep sambungchat-db

# Start if not running
bun run db:start

# Check logs
bun run db:logs
```

### Migration Conflicts

**Problem:** Migration fails with "table already exists"

**Solution:**

```bash
# Drop and recreate (development only)
bun run db:drop
bun run db:push

# Or manually resolve conflict
bun run db:studio
# Delete conflicting table manually
# Re-run migration
```

### Permission Denied

**Problem:** `permission denied for table chats`

**Solution:**

```bash
# Grant permissions
docker exec -it sambungchat-db psql -U sambungchat -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sambungchat;"
```

---

## Related Documents

- [TESTING](./TESTING.md) - Test database setup
- [ENVIRONMENT](./ENVIRONMENT.md) - Environment variables
- [Architecture](./architecture.md) - System architecture
- [API Reference](./api-reference.md) - API endpoints

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
