# Chat Domain Module

## Overview

The Chat Domain Module provides a complete API for managing chat conversations, messages, and organization in SambungChat. It handles conversation management, message history, folder organization, search functionality, and export capabilities.

## Architecture

The module is organized into domain-specific submodules, following the single responsibility principle:

```text
packages/api/src/routers/chat/
├── index.ts           # Main entry point - combines all routers
├── crud.ts            # CRUD operations (create, read, update, delete)
├── search.ts          # Advanced search and filtering
├── export.ts          # Export and reporting procedures
├── organization.ts    # Organization features (pinning, folders)
└── README.md          # This file
```

### Module Composition

The main `chatRouter` combines all domain routers:

```typescript
export const chatRouter = {
  ...crudRouter, // Basic CRUD operations
  ...searchRouter, // Search and filtering
  ...exportRouter, // Export procedures
  ...organizationRouter, // Pinning and folder management
};
```

---

## API Procedures

### CRUD Operations (`crud.ts`)

Basic chat lifecycle management operations.

#### `getAll`

Get all chats for the authenticated user, ordered by most recently updated.

**Procedure**: `POST /rpc/chat/getAll`

**Authentication**: Required (cookie-based session)

**Cache**: Short-term caching enabled

**Returns**: Array of chat objects

```typescript
// Request
{
}

// Response
[
  {
    id: 'string', // ULID
    userId: 'string', // User ULID
    title: 'string',
    modelId: 'string',
    folderId: 'string | null',
    pinned: boolean,
    createdAt: Date,
    updatedAt: Date,
  },
];
```

**Example Usage**:

```typescript
const chats = await orpc.chat.getAll();
```

---

#### `getById`

Get a single chat by ID with all associated messages.

**Procedure**: `POST /rpc/chat/getById`

**Authentication**: Required

**Cache**: Short-term caching enabled

**Input**:

```typescript
{
  id: string; // ULID of the chat
}
```

**Returns**: Chat object with messages array, or `null` if not found

```typescript
// Response
{
  id: "string",
  title: "string",
  modelId: "string",
  // ... other chat fields
  messages: [
    {
      id: "string",
      chatId: "string",
      role: "user" | "assistant" | "system",
      content: "string",
      createdAt: Date
    }
  ]
}
```

**Example Usage**:

```typescript
const chat = await orpc.chat.getById({ id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' });
if (chat) {
  console.log(chat.messages);
}
```

---

#### `create`

Create a new chat conversation.

**Procedure**: `POST /rpc/chat/create`

**Authentication**: Required

**CSRF Protection**: Required

**Input**:

```typescript
{
  title: string,      // Default: "New Chat"
  modelId: string     // Required - ID of the AI model to use
}
```

**Returns**: Created chat object

**Example Usage**:

```typescript
const newChat = await orpc.chat.create({
  title: 'My Conversation',
  modelId: 'model_ulid',
});
```

---

#### `update`

Update chat properties (title or model).

**Procedure**: `POST /rpc/chat/update`

**Authentication**: Required

**CSRF Protection**: Required

**Input**:

```typescript
{
  id: string,
  title?: string,     // Optional new title
  modelId?: string    // Optional new model ID
}
```

**Returns**: Updated chat object

**Example Usage**:

```typescript
const updated = await orpc.chat.update({
  id: 'chat_ulid',
  title: 'Updated Title',
});
```

---

#### `delete`

Delete a chat and all its messages.

**Procedure**: `POST /rpc/chat/delete`

**Authentication**: Required

**CSRF Protection**: Required

**Input**:

```typescript
{
  id: string; // ULID of the chat to delete
}
```

**Returns**: Success confirmation

```typescript
// Response
{
  success: true;
}
```

**Example Usage**:

```typescript
await orpc.chat.delete({ id: 'chat_ulid' });
```

---

### Search & Filter (`search.ts`)

Advanced search functionality with multiple filter options.

#### `search`

Search chats with comprehensive filtering capabilities.

**Procedure**: `POST /rpc/chat/search`

**Authentication**: Required

**Input**:

```typescript
{
  query?: string,                    // Search query (title and/or messages)
  folderId?: string | null,          // Filter by folder (null = uncategorized)
  pinnedOnly?: boolean,              // Show only pinned chats
  providers?: Provider[],            // Filter by AI provider(s)
  modelIds?: string[],               // Filter by model ID(s)
  dateFrom?: Date,                   // Start date filter
  dateTo?: Date,                     // End date filter
  searchInMessages?: boolean         // Include message content in search
}

type Provider = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama' | 'custom';
```

**Returns**: Array of matching chats with optional message snippets

**Advanced Features**:

1. **Query Search**:
   - Searches in chat titles by default
   - With `searchInMessages: true`, also searches message content
   - Case-insensitive partial matching

2. **Multi-Select Filters**:
   - Can filter by multiple providers: `providers: ['openai', 'anthropic']`
   - Can filter by multiple models: `modelIds: ['model1', 'model2']`

3. **Date Range Filtering**:
   - `dateFrom`: Only chats created on or after this date
   - `dateTo`: Only chats created on or before this date

4. **Message Snippets**:
   - When `searchInMessages: true` and query matches, returns up to 3 matching message snippets per chat
   - Snippets show the role, content, and timestamp of matching messages

**Example Usage**:

```typescript
// Search by query
const results = await orpc.chat.search({
  query: 'API authentication',
  searchInMessages: true,
});

// Filter by provider and date range
const filtered = await orpc.chat.search({
  providers: ['openai', 'anthropic'],
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date('2024-12-31'),
});

// Get uncategorized chats
const uncategorized = await orpc.chat.search({
  folderId: null,
});

// Complex multi-filter search
const complex = await orpc.chat.search({
  query: 'typescript',
  providers: ['openai'],
  modelIds: ['gpt-4-ulid'],
  dateFrom: new Date('2024-06-01'),
  searchInMessages: true,
});
```

**Response with Message Snippets**:

```typescript
[
  {
    id: 'string',
    title: 'TypeScript API Design',
    // ... other chat fields
    matchingMessages: [
      {
        id: 'string',
        role: 'user',
        content: 'How do I design APIs with TypeScript?',
        createdAt: Date,
      },
      {
        role: 'assistant',
        content: "Here's a comprehensive guide to TypeScript API design...",
        createdAt: Date,
      },
    ],
  },
];
```

**Performance**:

- Optimized database queries with selective joins
- Distinct operations to avoid duplicate results
- Efficient batch operations for message snippets
- Short-term caching for repeated queries

---

### Export Operations (`export.ts`)

Bulk data export for backups and reporting.

#### `getAllChatsWithMessages`

Get all user's chats with complete message history and folder information.

**Procedure**: `POST /rpc/chat/getAllChatsWithMessages`

**Authentication**: Required

**Returns**: Array of chats with messages and folder details

```typescript
// Response
[
  {
    id: 'string',
    title: 'string',
    // ... other chat fields
    messages: [
      {
        id: 'string',
        role: 'user' | 'assistant' | 'system',
        content: 'string',
        createdAt: Date,
      },
    ],
    folder:
      {
        id: 'string',
        name: 'string',
      } | null,
  },
];
```

**Performance Optimizations**:

- Batch-fetches all messages in a single query (avoids N+1 problem)
- Batch-fetches all folders in a single query
- Groups data in-memory for efficient response construction
- Handles empty chat sets gracefully

**Example Usage**:

```typescript
const allData = await orpc.chat.getAllChatsWithMessages();

// Export to JSON
const exportData = JSON.stringify(allData, null, 2);

// Calculate statistics
const totalMessages = allData.reduce((sum, chat) => sum + chat.messages.length, 0);
```

---

#### `getChatsByFolder`

Get chats organized by folder structure.

**Procedure**: `POST /rpc/chat/getChatsByFolder`

**Authentication**: Required

**Returns**: Chats grouped by folders plus uncategorized chats

```typescript
// Response
{
  folders: [
    {
      id: "string",
      name: "Work Projects",
      chats: [
        {
          id: "string",
          title: "string",
          // ... other chat fields
          messages: [...],
          folder: { id: "string", name: "Work Projects" }
        }
      ]
    }
  ],
  uncategorized: [
    {
      id: "string",
      title: "string",
      // ... other chat fields
      messages: [],
      folder: null
    }
  ]
}
```

**Use Cases**:

- Folder-based backup/export
- Displaying organized chat list
- Folder-specific analysis
- Structured data export

**Example Usage**:

```typescript
const organized = await orpc.chat.getChatsByFolder();

// Iterate through folders
organized.folders.forEach((folder) => {
  console.log(`${folder.name}: ${folder.chats.length} chats`);
});

// Process uncategorized chats
console.log(`Uncategorized: ${organized.uncategorized.length} chats`);
```

---

### Organization (`organization.ts`)

Chat organization features for pinning and folder management.

#### `togglePin`

Toggle the pinned status of a chat.

**Procedure**: `POST /rpc/chat/togglePin`

**Authentication**: Required

**CSRF Protection**: Required

**Input**:

```typescript
{
  id: string; // ULID of the chat
}
```

**Returns**: Updated chat with new pin status

```typescript
// Response
{
  id: "string",
  title: "string",
  pinned: boolean,  // Toggled value
  // ... other chat fields
}
```

**Behavior**:

- If chat is pinned, becomes unpinned
- If chat is unpinned, becomes pinned
- Throws error if chat not found

**Example Usage**:

```typescript
const updated = await orpc.chat.togglePin({ id: 'chat_ulid' });
console.log(`Chat is now ${updated.pinned ? 'pinned' : 'unpinned'}`);
```

---

#### `updateFolder`

Move a chat to a different folder or remove it from folders.

**Procedure**: `POST /rpc/chat/updateFolder`

**Authentication**: Required

**CSRF Protection**: Required

**Input**:

```typescript
{
  id: string,
  folderId: string | null  // null = remove from folder (uncategorized)
}
```

**Returns**: Updated chat object

**Example Usage**:

```typescript
// Move to a folder
const moved = await orpc.chat.updateFolder({
  id: 'chat_ulid',
  folderId: 'folder_ulid',
});

// Remove from folder (uncategorized)
const uncategorized = await orpc.chat.updateFolder({
  id: 'chat_ulid',
  folderId: null,
});
```

---

## Security

### Authentication

All procedures require authentication via Better Auth session cookies. The `userId` is automatically extracted from the session context.

### Authorization

All queries automatically filter by `userId` to ensure users can only access their own chats. Database queries use `eq(chats.userId, userId)` to enforce this.

### CSRF Protection

Mutating operations (create, update, delete, togglePin, updateFolder) require CSRF tokens. The `withCsrfProtection` middleware validates the token before execution.

### Input Validation

All inputs are validated using Zod schemas:

- ULID format validation for IDs (`ulidSchema`)
- String constraints (min length for titles)
- Enum validation for providers
- Date coercion for date ranges

---

## Performance Optimizations

### Database Query Optimization

1. **Selective Joins**: Search only joins with `models` and `messages` tables when needed
2. **Batch Operations**: Export procedures fetch all related data in single queries
3. **Distinct Operations**: Prevents duplicate results in multi-table joins
4. **Indexed Queries**: Filters use indexed columns (`userId`, `id`, `modelId`)

### N+1 Prevention

The export procedures use batch-fetching patterns:

```typescript
// Instead of N queries:
// for (chat of chats) { messages = await getMessages(chat.id); }

// Use single batch query:
const allMessages = await db.select().from(messages).where(inArray(messages.chatId, chatIds));
```

### Caching

Read operations (`getAll`, `getById`) use short-term cache headers to reduce database load while maintaining data freshness.

---

## Related Files

### Database Schema

- `packages/db/src/schema/chat.ts` - Chat, message, and folder table definitions
- `packages/db/src/schema/model.ts` - Model table for provider filtering

### API Infrastructure

- `packages/api/src/index.ts` - Main router configuration and middleware
- `packages/api/src/middleware/cache-headers.ts` - HTTP caching middleware
- `packages/api/src/utils/validation.ts` - ULID validation schemas

### Testing

- `packages/api/src/routers/chat.test.ts` - Comprehensive test suite
- `packages/api/src/routers/TESTING_GUIDE.md` - Testing documentation

### Frontend Integration

- `apps/web/src/lib/orpc.ts` - ORPC client configuration
- `apps/web/src/lib/components/secondary-sidebar/ChatList.svelte` - Chat list UI with search

---

## Migration from Monolithic Router

This module was refactored from a single `chat.ts` file into domain-specific modules:

**Before**:

```text
packages/api/src/routers/chat.ts (900+ lines)
```

**After**:

```text
packages/api/src/routers/chat/
├── index.ts          # 29 lines - module composition
├── crud.ts           # 120 lines - basic operations
├── search.ts         # 223 lines - search logic
├── export.ts         # 170 lines - export procedures
└── organization.ts   # 58 lines - pinning/folders
```

**Benefits**:

- ✅ Better code organization and maintainability
- ✅ Clear separation of concerns
- ✅ Easier testing and debugging
- ✅ Simpler code reviews
- ✅ Reduced merge conflicts

---

## Usage Examples

### Common Workflows

#### Creating a new chat

```typescript
// 1. Get user's active model
const activeModel = await orpc.model.getActive();

// 2. Create new chat
const chat = await orpc.chat.create({
  title: 'My Conversation',
  modelId: activeModel.id,
});

// 3. Send first message
const message = await orpc.message.create({
  chatId: chat.id,
  role: 'user',
  content: 'Hello, AI!',
});
```

#### Searching and organizing

```typescript
// Search for specific conversations
const results = await orpc.chat.search({
  query: 'database design',
  providers: ['openai'],
  dateFrom: new Date('2024-01-01'),
  searchInMessages: true,
});

// Pin important chats
await orpc.chat.togglePin({ id: results[0].id });

// Organize into folder
await orpc.chat.updateFolder({
  id: results[0].id,
  folderId: 'work-folder-ulid',
});
```

#### Export and backup

```typescript
// Get all data
const allData = await orpc.chat.getAllChatsWithMessages();

// Export to file
const blob = new Blob([JSON.stringify(allData, null, 2)], {
  type: 'application/json',
});

// Or get organized by folders
const organized = await orpc.chat.getChatsByFolder();
```

---

## Testing

See `TESTING_GUIDE.md` for comprehensive testing documentation, including:

- Backend API test suite (25 tests)
- Frontend manual testing procedures
- Filter combination test scenarios
- Performance benchmarks

Run tests:

```bash
bun test packages/api/src/routers/chat.test.ts
```

---

## Future Enhancements

Potential improvements for the module:

1. **Pagination**: Add pagination support for `getAll` and `search` to handle large chat sets
2. **Batch Operations**: Support batch delete/update operations
3. **Full-Text Search**: Integrate PostgreSQL full-text search for better performance
4. **Chat Sharing**: Add procedures for sharing chats between users
5. **Version History**: Track chat changes and restore previous versions
6. **Archiving**: Add archive folder and soft-delete functionality
7. **Analytics**: Add procedures for chat statistics and usage patterns

---

## Support

For issues or questions about the chat module:

1. Check the test suite for usage examples
2. Review database schema in `packages/db/src/schema/chat.ts`
3. Consult main API documentation in `packages/api/README.md`
4. Check troubleshooting guide in project documentation
