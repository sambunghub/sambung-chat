# SambungChat Architecture

**Version:** 0.1.0
**Last Updated:** January 11, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Data Flow](#data-flow)
5. [Database Schema](#database-schema)
6. [API Architecture](#api-architecture)
7. [Authentication Flow](#authentication-flow)
8. [Deployment Architecture](#deployment-architecture)

---

## Overview

SambungChat follows a **monorepo architecture** using Turborepo for orchestration. The application is split into:

- **Frontend**: SvelteKit 5 web application
- **Backend**: Hono API server with ORPC
- **Shared Packages**: Reusable business logic and UI components

### Architecture Goals

- **Type Safety**: End-to-end TypeScript with ORPC
- **Separation of Concerns**: Clear boundaries between layers
- **Scalability**: Easy to extend with new features
- **Self-Hosting**: Simple deployment on any infrastructure

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                               │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐  │
│  │  SvelteKit App  │◀──▶│  TanStack Query  │◀──▶│  ORPC Client│  │
│  │   (Web UI)      │    │  (Data Fetching) │    │  (Type-safe)│  │
│  └─────────────────┘    └──────────────────┘    └─────────────┘  │
│                                  │                                 │
└──────────────────────────────────┼─────────────────────────────────┘
                                   │ HTTP/JSON
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           SERVER LAYER                               │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐  │
│  │   Hono App      │◀──▶│  ORPC Handler    │◀──▶│   Routers   │  │
│  │  (Web Server)   │    │  (RPC Dispatch)  │    │  (Procedures)│  │
│  └─────────────────┘    └──────────────────┘    └─────────────┘  │
│                                  │                                 │
│  ┌─────────────────┐             │                                 │
│  │  Better Auth    │◀────────────┤                                 │
│  │  (Session Mgmt) │             │                                 │
│  └─────────────────┘             │                                 │
└──────────────────────────────────┼─────────────────────────────────┘
                                   │ SQL
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                              │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐  │
│  │  Drizzle ORM    │◀──▶│   PostgreSQL     │◀──▶│    Data     │  │
│  │  (Query Builder)│    │   (Database)     │    │  (Stored)   │  │
│  └─────────────────┘    └──────────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Stack

| Component         | Technology     | Purpose                   |
| ----------------- | -------------- | ------------------------- |
| **Framework**     | SvelteKit 5    | Meta-framework for Svelte |
| **UI Library**    | Svelte 5       | Reactive UI framework     |
| **Styling**       | TailwindCSS    | Utility-first CSS         |
| **Components**    | shadcn-svelte  | Reusable UI components    |
| **State**         | Svelte 5 Runes | Reactive state management |
| **Data Fetching** | TanStack Query | Server state management   |
| **Type Safety**   | ORPC Client    | End-to-end type safety    |
| **Icons**         | Lucide Svelte  | Icon library              |

### Backend Stack

| Component      | Technology  | Purpose                    |
| -------------- | ----------- | -------------------------- |
| **Framework**  | Hono        | Lightweight web framework  |
| **API Layer**  | ORPC        | Type-safe RPC framework    |
| **Validation** | Zod         | Schema validation          |
| **Auth**       | Better Auth | Authentication & sessions  |
| **ORM**        | Drizzle ORM | Type-safe database queries |
| **Database**   | PostgreSQL  | Relational database        |

### DevOps Stack

| Component           | Technology | Purpose                 |
| ------------------- | ---------- | ----------------------- |
| **Runtime**         | Bun        | Fast JavaScript runtime |
| **Monorepo**        | Turborepo  | Build orchestration     |
| **Package Manager** | Bun        | Dependency management   |
| **Type Checking**   | TypeScript | Type safety             |
| **Linting**         | ESLint     | Code linting            |
| **Formatting**      | Prettier   | Code formatting         |

---

## Data Flow

### Request Flow

```
1. User Action
   ↓
2. Svelte Component (Frontend)
   ↓
3. TanStack Query Mutation
   ↓
4. ORPC Client (Type-safe Call)
   ↓
5. HTTP Request to /rpc/*
   ↓
6. Hono Server Receives
   ↓
7. CORS & Middleware
   ↓
8. ORPC Handler Routes
   ↓
9. Procedure Executes
   ↓
10. Drizzle ORM Query
   ↓
11. PostgreSQL Database
   ↓
12. Result Returns
   ↓
13. ORPC Serializes Response
   ↓
14. HTTP Response
   ↓
15. TanStack Query Caches
   ↓
16. UI Updates Automatically
```

### Authentication Flow

```
1. User submits credentials
   ↓
2. Frontend calls ORPC auth endpoint
   ↓
3. Better Auth validates credentials
   ↓
4. Creates session in database
   ↓
5. Sets secure HTTP-only cookie
   ↓
6. Returns user data
   ↓
7. Frontend stores user in state
   ↓
8. Subsequent requests include cookie
   ↓
9. Backend validates session
   ↓
10. Grants access to protected routes
```

---

## Database Schema

### Core Tables

```sql
-- Users (via Better Auth)
user (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Sessions (via Better Auth)
session (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user(id),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Chats
chat (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES user(id) NOT NULL,
  title TEXT NOT NULL,
  model_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Messages
message (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES chat(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  tokens INTEGER,
  cost DECIMAL(10, 4),
  created_at TIMESTAMP DEFAULT NOW()
)

-- Prompt Templates
prompt_template (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES user(id) NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB,
  category TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- API Keys (Encrypted)
api_key (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES user(id) NOT NULL,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  key_last_4 TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Relationships

```
user (1) ───< (N) session
user (1) ───< (N) chat
user (1) ───< (N) prompt_template
user (1) ───< (N) api_key

chat (1) ───< (N) message
```

---

## API Architecture

### ORPC Router Structure

```typescript
appRouter
├── healthCheck          // Public: Health check
├── auth                 // Public: Authentication
│   ├── signIn
│   ├── signOut
│   └── getSession
├── user                 // Protected: User operations
│   ├── getProfile
│   └── updateSettings
├── chat                 // Protected: Chat operations
│   ├── getAll
│   ├── getById
│   ├── create
│   ├── update
│   └── delete
├── message              // Protected: Message operations
│   ├── stream           // Server-sent events
│   └── create
├── prompt               // Protected: Prompt templates
│   ├── getAll
│   ├── create
│   ├── update
│   └── delete
└── apiKey               // Protected: API key management
    ├── getAll
    ├── create
    └── delete
```

### Endpoint Mapping

| ORPC Route        | HTTP Endpoint               | Auth      |
| ----------------- | --------------------------- | --------- |
| `healthCheck`     | `POST /rpc/healthCheck`     | Public    |
| `auth.signIn`     | `POST /rpc/auth.signIn`     | Public    |
| `user.getProfile` | `POST /rpc/user.getProfile` | Protected |
| `chat.getAll`     | `POST /rpc/chat.getAll`     | Protected |
| `message.stream`  | `POST /rpc/message.stream`  | Protected |

---

## Authentication Flow

### Better Auth Integration

```typescript
// packages/auth/src/index.ts
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  database: drizzleAdapter(db),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
```

### Protected Route Pattern

```typescript
// packages/api/src/index.ts
const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError('UNAUTHORIZED');
  }
  return next({
    context: {
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);
```

---

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────┐
│          Developer Machine               │
│  ┌──────────────┐   ┌──────────────┐   │
│  │ Frontend     │   │ Backend      │   │
│  │ :5173 (Dev)  │   │ :3000 (Dev)  │   │
│  └──────────────┘   └──────────────┘   │
│         │                   │          │
│         └─────────┬─────────┘          │
│                   ▼                    │
│          ┌──────────────┐             │
│          │ PostgreSQL   │             │
│          │ :5432 (Docker)│             │
│          └──────────────┘             │
└─────────────────────────────────────────┘
```

### Production Environment

```
                    ┌─────────────┐
                    │   Internet  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Reverse    │
                    │  Proxy      │
                    │  (Nginx)    │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
      ┌─────▼─────┐  ┌─────▼─────┐  ┌────▼────┐
      │ Frontend  │  │ Backend   │  │   DB    │
      │ (Static)  │  │ (Node)    │  │ (Postgres)│
      └───────────┘  └───────────┘  └─────────┘
```

### Self-Hosting Options

1. **Docker Compose** (Simple)
   - Single command deployment
   - Suitable for small deployments

2. **Kubernetes** (Scalable)
   - High availability
   - Auto-scaling

3. **Bare Metal** (Performance)
   - Maximum performance
   - Full control

See [Deployment Guide](./deployment.md) for details.

---

## Security Considerations

### Data Security

- **API Keys**: Encrypted at rest using AES-256
- **Sessions**: HTTP-only, secure cookies
- **Passwords**: Hashed using bcrypt
- **Database**: SSL/TLS in production

### Application Security

- **Input Validation**: Zod schemas on all inputs
- **SQL Injection**: Prevented by Drizzle ORM
- **XSS**: Svelte auto-escapes by default
- **CSRF**: Better Auth built-in protection

---

## Performance Optimization

### Frontend

- **Code Splitting**: SvelteKit automatic splitting
- **Lazy Loading**: Components loaded on demand
- **Caching**: TanStack Query aggressive caching
- **Optimistic Updates**: Instant UI feedback

### Backend

- **Connection Pooling**: Drizzle connection pool
- **Query Optimization**: Indexed columns
- **Caching**: Redis for session cache (future)
- **CDN**: Static assets via CDN (production)

---

## Monitoring & Observability

### Logging

- **Development**: Console logs
- **Production**: Structured logging (future)

### Metrics

- **Response Times**: Per endpoint
- **Database Queries**: Slow query log
- **Error Rates**: Per procedure

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
