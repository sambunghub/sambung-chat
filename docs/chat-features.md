# Chat & Message Features

## 📊 Current Feature Status

### ✅ Fully Implemented (Core Features)

#### Chat Operations

- **Create** - New chat with default title
- **Read** - Get all chats or by ID with messages
- **Update** - Update chat title and/or modelId
- **Delete** - Delete chat (cascades to messages)
- **Pin/Unpin** - Pin important chats to top
- **Search** - Advanced search with query, folder filter, pinned-only (API ready)

#### Message Operations

- **Create** - Send user/assistant messages
- **Read** - Get all messages for a chat
- **Delete** - Delete message with ownership verification
- **Regenerate** - Regenerate AI response
- **Streaming** - Real-time AI streaming responses
- **Stop** - Stop generation mid-stream
- **Retry** - Auto-retry on failure with backoff

#### Organization

- **Folders** - Create, rename, delete folders
- **Folder Assignment** - Move chats to folders
- **Recent Chats** - Time-based chat list
- **Pinned Chats** - Priority chat display

#### Export

- **JSON Export** - Full data with metadata
- **Markdown Export** - Formatted for documentation
- **Plain Text Export** - Simple format
- **Metadata** - Model, tokens, finishReason preserved

#### UI/UX

- **Auto-scroll** - Scroll to bottom on new messages
- **Markdown Rendering** - Rich text formatting
- **Auto-resize** - Textarea grows with content
- **Keyboard Shortcuts** - Enter to send, Shift+Enter for newline
- **Error Handling** - User-friendly error messages
- **Optimistic UI** - Show messages immediately, save after AI success

---

### ⚠️ Partially Implemented

#### Search UI

- ✅ Backend API: `orpc.chat.search` with filters
- ❌ Frontend UI: Search input exists but not connected
- ❌ Filter UI: No folder/pinned filter UI

#### Folder Management

- ✅ Backend: Complete CRUD operations
- ⚠️ Frontend: Basic sidebar display
- ❌ Drag-and-drop: Not implemented
- ❌ Dynamic count: Not connected

---

### ❌ Missing Features

#### Message-Level Operations

- Edit messages after sending
- Delete individual messages (with undo)
- Message reactions/emojis
- Message threading/replies
- Quote/mention specific messages

#### Collaboration

- Real-time collaboration (multiple users)
- Message sharing (public links)
- @mentions

#### Advanced Search

- Full-text search across message content
- Search by date ranges
- Search by model used
- Search by message metadata
- Search result highlighting

#### Message Management

- Bulk operations (select multiple messages)
- Message categories/tags
- Message starring/favoriting
- Message branching/forking

#### AI Features

- Message summarization
- Topic extraction
- Related suggestions
- Code execution capabilities

#### Analytics & Insights

- Chat statistics (word count, token usage)
- Model performance metrics
- User activity tracking
- Cost estimation per model

#### Advanced Organization

- Nested folders
- Chat templates
- Saved replies/prompts
- Message snippets

#### Notifications

- New message alerts
- Offline support
- Push notifications

---

## 🗄️ Database Schema

### `chats` Table

```typescript
{
  id: ULID              // Unique identifier
  userId: string        // Owner reference
  title: string         // Chat title
  modelId: string       // AI model used
  folderId?: string     // Optional folder reference
  pinned: boolean       // Pin status
  createdAt: timestamp
  updatedAt: timestamp
}
```

### `messages` Table

```typescript
{
  id: ULID; // Unique identifier
  chatId: string; // Chat reference
  role: 'user' | 'assistant' | 'system';
  content: string; // Message text
  metadata: JSONB; // { model, tokens, finishReason, ... }
  createdAt: timestamp;
}
```

### `folders` Table

```typescript
{
  id: ULID; // Unique identifier
  userId: string; // Owner reference
  name: string; // Folder name
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

---

## 🔌 API Endpoints

### Chat Router (`/rpc/chat/*`)

- `getAll()` - Get all user's chats
- `getById({ id })` - Get chat with messages
- `create({ title })` - Create new chat
- `update({ id, title, modelId })` - Update chat
- `delete({ id })` - Delete chat
- `togglePin({ id })` - Pin/unpin chat
- `updateFolder({ id, folderId })` - Move to folder
- `search({ query, folderId, pinnedOnly })` - Advanced search

### Message Router (`/rpc/message/*`)

- `getByChatId({ chatId })` - Get all messages
- `create({ chatId, content, role })` - Create message
- `delete({ id })` - Delete message

### Folder Router (`/rpc/folder/*`)

- `getAll()` - Get all folders
- `getById({ id })` - Get folder with chat count
- `create({ name })` - Create folder
- `update({ id, name })` - Rename folder
- `delete({ id })` - Delete folder

---

## 🚀 Development Roadmap

### Phase 1: Quick Wins (High Impact, Low Effort)

1. ✅ Search UI Implementation
2. ✅ Chat Statistics Display
3. ⏳ Message Delete with Undo

### Phase 2: Model Management

4. ✅ Model Management Backend
5. ✅ Model Management UI

### Phase 3: Quality of Life

6. ✅ Chat Rename in Sidebar
7. ⏳ Folder Auto-Arrange
8. ⏳ Message Branching (Fork)
9. ✅ Collapsible ChatList Sidebar
10. ✅ Folder Badge UI
11. ✅ Pin Indicator UI

### Phase 4: Advanced Features

9. ⏳ Full-Text Search
10. ⏳ Chat Templates
11. ⏳ Export All Chats

---

## 📝 Architecture Notes

### Strengths

- Clean separation: Schema → API → UI
- Type-safe with oRPC + Drizzle ORM
- ULID-based IDs for distributed systems
- Comprehensive error handling
- Modern Svelte 5 with runes
- shadcn-svelte with proper hydration

### Patterns

- Optimistic UI for better UX
- Server-side rendering with SvelteKit
- Protected procedures with auth
- Database cascade deletes
- JSONB for flexible metadata

---

_Last updated: 2025-01-18_
