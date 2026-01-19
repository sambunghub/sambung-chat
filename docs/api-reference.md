# SambungChat API Reference

**Version:** 0.1.0
**Base URL:** `http://localhost:3000/rpc`
**Last Updated:** January 17, 2026

> **⚠️ Important Notice**
>
> This document describes the **planned API** for SambungChat. Some endpoints may not be implemented yet. Refer to the [ROADMAP](../plan-reference/ROADMAP.md) for implementation status.
>
> **Before implementing new endpoints**, read [ORPC + TODO Implementation Reference](../plan-reference/generated/orpc-todo-reference.md) for complete patterns and best practices.

---

## Overview

SambungChat uses **ORPC** (OpenAPI-compatible RPC) for type-safe API communication. All endpoints are POST requests to `/rpc/*` paths.

> **Team & Organization API**
>
> For team-related API endpoints (team management, members, invitations), see **[Teams Concept](./teams-concept.md)** for the team model and access control patterns.
>
> Team endpoints follow the same ORPC patterns documented below, with additional team context validation.

### Authentication

Most endpoints require authentication via session cookies. Set by Better Auth during sign in.

### Request Format

```json
{
  "input": {
    /* Zod-validated input */
  }
}
```

### Response Format

```json
{
  "result": {
    /* Response data */
  },
  "error": {
    /* ORPCError if failed */
  }
}
```

---

## Endpoints

### AI Streaming

#### `POST /ai`

Stream AI responses (Server-Sent Events). This endpoint provides direct access to AI streaming functionality and is used by the chat interface.

**Authentication:** **Required** (via Better Auth session cookie)

**Request:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    },
    {
      "role": "assistant",
      "content": "I'm doing well!"
    }
  ]
}
```

**Request Validation:**

- `messages` must be an array
- Minimum 1 message, maximum 100 messages
- Each message must have `role` (user/assistant/system) and `content` (string, max 100,000 characters)

**Response (SSE):**

```
data: {"type":"text","content":"Hello"}

data: {"type":"text","content":" there"}

data: {"type":"done"}
```

**Errors:**

- `401 Unauthorized` - No valid session or user not authenticated
- `400 Invalid request` - Messages must be an array
- `400 Invalid request` - Messages cannot be empty
- `400 Invalid request` - Too many messages (max 100)
- `400 Invalid message format` - Each message must have role and content
- `400 Invalid message role` - Role must be user, assistant, or system
- `400 Invalid message content` - Content must be string and max 100,000 characters

**Notes:**

- This endpoint uses the AI SDK v6 for streaming
- Supports OpenAI-compatible providers (configurable via OPENAI_BASE_URL)
- Model configured via OPENAI_MODEL environment variable (default: gpt-4o-mini)

---

### Health Check

#### `POST /rpc/healthCheck`

Check API health status.

**Authentication:** None

**Request:**

```json
{}
```

**Response:**

```json
{
  "result": "OK"
}
```

---

## Authentication

### Sign In

#### `POST /rpc/auth.signIn`

Authenticate user with email and password.

**Authentication:** None

**Request:**

```json
{
  "input": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

**Response:**

```json
{
  "result": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "session": {
      "id": "session_123",
      "expiresAt": "2026-01-18T00:00:00Z"
    }
  }
}
```

**Errors:**

- `INVALID_CREDENTIALS`: Email or password incorrect
- `USER_NOT_FOUND`: User does not exist

### Sign Out

#### `POST /rpc/auth.signOut`

End current session.

**Authentication:** Required

**Request:**

```json
{}
```

**Response:**

```json
{
  "result": { "success": true }
}
```

### Get Session

#### `POST /rpc/auth.getSession`

Get current session data.

**Authentication:** Required (via cookie)

**Request:**

```json
{}
```

**Response:**

```json
{
  "result": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

---

## User

### Get Profile

#### `POST /rpc/user.getProfile`

Get current user profile.

**Authentication:** Required

**Request:**

```json
{}
```

**Response:**

```json
{
  "result": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2026-01-11T00:00:00Z"
  }
}
```

### Update Settings

#### `POST /rpc/user.updateSettings`

Update user preferences.

**Authentication:** Required

**Request:**

```json
{
  "input": {
    "theme": "dark",
    "language": "en"
  }
}
```

**Response:**

```json
{
  "result": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "settings": {
      "theme": "dark",
      "language": "en"
    }
  }
}
```

---

## Chat

### Get All Chats

#### `POST /rpc/chat.getAll`

Get all chats for current user.

**Authentication:** Required

**Request:**

```json
{
  "input": {
    "limit": 50,
    "offset": 0
  }
}
```

**Response:**

```json
{
  "result": [
    {
      "id": 1,
      "title": "My Chat",
      "modelId": "gpt-4",
      "createdAt": "2026-01-11T00:00:00Z",
      "updatedAt": "2026-01-11T01:00:00Z",
      "messageCount": 5
    }
  ]
}
```

### Get Chat by ID

#### `POST /rpc/chat.getById`

Get single chat with messages.

**Authentication:** Required

**Request:**

```json
{
  "input": {
    "id": 1
  }
}
```

**Response:**

```json
{
  "result": {
    "id": 1,
    "title": "My Chat",
    "modelId": "gpt-4",
    "messages": [
      {
        "id": 1,
        "role": "user",
        "content": "Hello!",
        "createdAt": "2026-01-11T00:00:00Z"
      },
      {
        "id": 2,
        "role": "assistant",
        "content": "Hi there!",
        "tokens": 10,
        "cost": 0.0001,
        "createdAt": "2026-01-11T00:00:01Z"
      }
    ]
  }
}
```

**Errors:**

- `NOT_FOUND`: Chat does not exist
- `FORBIDDEN`: User does not own this chat

### Create Chat

#### `POST /rpc/chat.create`

Create new chat.

**Authentication:** Required

**Request:**

```json
{
  "input": {
    "title": "New Chat",
    "modelId": "gpt-4"
  }
}
```

**Response:**

```json
{
  "result": {
    "id": 2,
    "title": "New Chat",
    "modelId": "gpt-4",
    "createdAt": "2026-01-11T02:00:00Z"
  }
}
```

### Update Chat

#### `POST /rpc/chat.update`

Update chat title or model.

**Authentication:** Required

**Request:**

```json
{
  "input": {
    "id": 1,
    "title": "Updated Title"
  }
}
```

**Response:**

```json
{
  "result": {
    "id": 1,
    "title": "Updated Title",
    "modelId": "gpt-4",
    "updatedAt": "2026-01-11T03:00:00Z"
  }
}
```

### Delete Chat

#### `POST /rpc/chat.delete`

Delete chat and all messages.

**Authentication:** Required

**Request:**

```json
{
  "input": {
    "id": 1
  }
}
```

**Response:**

```json
{
  "result": { "success": true }
}
```

---

## Messages

### Stream Message

#### `POST /rpc/message.stream`

Stream AI response (Server-Sent Events).

**Authentication:** Required

**Request:**

```json
{
  "input": {
    "chatId": 1,
    "content": "Hello, how are you?"
  }
}
```

**Response (SSE):**

```
data: {"type":"token","content":"Hello"}

data: {"type":"token","content":"!"}

data: {"type":"done","tokens":10,"cost":0.0001}
```

**Errors:**

- `CHAT_NOT_FOUND`: Chat does not exist
- `API_KEY_MISSING`: No API key configured for this model
- `PROVIDER_ERROR`: AI provider returned an error

### Create Message

#### `POST /rpc/message.create`

Create message (non-streaming).

**Authentication:** Required

**Request:**

```json
{
  "input": {
    "chatId": 1,
    "role": "user",
    "content": "Hello!"
  }
}
```

**Response:**

```json
{
  "result": {
    "id": 3,
    "chatId": 1,
    "role": "user",
    "content": "Hello!",
    "createdAt": "2026-01-11T04:00:00Z"
  }
}
```

---

## Prompt Templates

### Get All Prompts

#### `POST /rpc.prompt.getAll`

Get all prompt templates for current user.

**Authentication:** Required

**Request:**

```json
{
  "input": {
    "category": "productivity"
  }
}
```

**Response:**

```json
{
  "result": [
    {
      "id": 1,
      "name": "Summarize Text",
      "content": "Please summarize: {{text}}",
      "variables": ["text"],
      "category": "productivity",
      "isPublic": false
    }
  ]
}
```

### Create Prompt

#### `POST /rpc.prompt.create`

Create new prompt template.

**Authentication:** Required

**Request:**

```json
{
  "input": {
    "name": "Translate",
    "content": "Translate to {{language}}: {{text}}",
    "variables": ["language", "text"],
    "category": "utility",
    "isPublic": false
  }
}
```

**Response:**

```json
{
  "result": {
    "id": 2,
    "name": "Translate",
    "content": "Translate to {{language}}: {{text}}",
    "variables": ["language", "text"],
    "category": "utility",
    "isPublic": false,
    "createdAt": "2026-01-11T05:00:00Z"
  }
}
```

### Update Prompt

#### `POST /rpc.prompt.update`

Update prompt template.

**Authentication:** Required

**Request:**

```json
{
  "input": {
    "id": 1,
    "name": "Updated Name"
  }
}
```

**Response:**

```json
{
  "result": {
    "id": 1,
    "name": "Updated Name",
    "updatedAt": "2026-01-11T06:00:00Z"
  }
}
```

### Delete Prompt

#### `POST /rpc.prompt.delete`

Delete prompt template.

**Authentication:** Required

**Request:**

```json
{
  "input": {
    "id": 1
  }
}
```

**Response:**

```json
{
  "result": { "success": true }
}
```

---

## API Keys

### Get All Keys

#### `POST /rpc.apiKey.getAll`

Get all stored API keys (masked).

**Authentication:** Required

**Request:**

```json
{}
```

**Response:**

```json
{
  "result": [
    {
      "id": 1,
      "provider": "openai",
      "keyLast4": "sk...1234",
      "createdAt": "2026-01-11T00:00:00Z"
    }
  ]
}
```

### Create Key

#### `POST /rpc.apiKey.create`

Store new API key (encrypted).

**Authentication:** Required

**Request:**

```json
{
  "input": {
    "provider": "openai",
    "apiKey": "sk-proj-abc123..."
  }
}
```

**Response:**

```json
{
  "result": {
    "id": 2,
    "provider": "openai",
    "keyLast4": "sk...5678",
    "createdAt": "2026-01-11T07:00:00Z"
  }
}
```

**Errors:**

- `INVALID_KEY`: API key validation failed
- `DUPLICATE_KEY`: Key already exists for this provider

### Delete Key

#### `POST /rpc.apiKey.delete`

Delete stored API key.

**Authentication:** Required

**Request:**

```json
{
  "input": {
    "id": 1
  }
}
```

**Response:**

```json
{
  "result": { "success": true }
}
```

---

## Error Codes

| Code              | Description               |
| ----------------- | ------------------------- |
| `UNAUTHORIZED`    | Authentication required   |
| `FORBIDDEN`       | Insufficient permissions  |
| `NOT_FOUND`       | Resource not found        |
| `INVALID_INPUT`   | Request validation failed |
| `INTERNAL_ERROR`  | Server error              |
| `RATE_LIMITED`    | Too many requests         |
| `API_KEY_MISSING` | No API key configured     |
| `PROVIDER_ERROR`  | AI provider error         |

---

## TypeScript Types

```typescript
// Available in @sambung-chat/api
import type { AppRouter } from '@sambung-chat/api/routers';

// Full router type
type Router = typeof AppRouter;

// Individual procedure types
type HealthCheck = Router['healthCheck'];
type ChatGetAll = Router['chat']['getAll'];
```

---

## Client Usage

### Using ORPC Client (TypeScript)

```typescript
import { orpc } from '@sambung-chat/api';

// Query
const chats = await orpc.chat.getAll({ limit: 50 });

// Mutation
const newChat = await orpc.chat.create({
  title: 'New Chat',
  modelId: 'gpt-4',
});
```

### Using Fetch (Generic)

```bash
curl -X POST http://localhost:3000/rpc/chat.getAll \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{"input": {"limit": 50}}'
```

---

## Rate Limiting

| Endpoint         | Limit         | Window |
| ---------------- | ------------- | ------ |
| `message.stream` | 100 requests  | 1 hour |
| All other        | 1000 requests | 1 hour |

---

## Implementation Status

Current implementation status of each endpoint group:

| Endpoint Group | Status                           | Phase      |
| -------------- | -------------------------------- | ---------- |
| `healthCheck`  | ✅ Implemented                   | Foundation |
| `auth.*`       | ✅ Implemented (via Better Auth) | Foundation |
| `privateData`  | ✅ Implemented                   | Foundation |
| `chat.*`       | ✅ Implemented                   | Foundation |
| `message.*`    | ✅ Implemented                   | Foundation |
| `folder.*`     | ✅ Implemented                   | Foundation |
| `user.*`       | ⏳ Planned                       | MVP        |
| `prompt.*`     | ⏳ Planned                       | MVP        |
| `apiKey.*`     | ⏳ Planned                       | MVP        |

**Note:** The `todo.*` router has been moved to `_example/` folder for reference purposes only. It demonstrates ORPC patterns but is not production-ready. See `packages/api/src/routers/_example/todo.ts`.

See [ROADMAP](../plan-reference/ROADMAP.md) for detailed timeline.

---

## References

| Document                                                                    | Purpose                                  |
| --------------------------------------------------------------------------- | ---------------------------------------- |
| [ORPC + TODO Reference](../plan-reference/generated/orpc-todo-reference.md) | Implementation patterns & best practices |
| [Architecture](./architecture.md)                                           | System architecture overview             |
| [Getting Started](./getting-started.md)                                     | Installation & setup guide               |
| [Deployment](./deployment.md)                                               | Deployment guides                        |

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
