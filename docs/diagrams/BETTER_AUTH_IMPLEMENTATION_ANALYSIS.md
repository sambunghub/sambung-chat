# Better-Auth Implementation Analysis

**Analysis Date:** 2026-01-12
**Project:** SambungChat
**Purpose:** Comprehensive review of Better-Auth configuration, middleware usage, and session handling for authentication flow diagram creation

---

## Executive Summary

SambungChat uses **Better-Auth** v1+ with Drizzle ORM adapter for authentication. The implementation follows a modular architecture with clear separation between frontend (SvelteKit), backend (Hono), API layer (ORPC), and authentication logic (Better-Auth).

**Key Features:**

- Email/password authentication
- Session-based auth with HTTP-only cookies
- Server-side session validation via ORPC middleware
- Client-side session management with reactive Svelte stores
- Protected and public API procedures

---

## 1. Authentication Configuration

### 1.1 Better-Auth Instance (`packages/auth/src/index.ts`)

```typescript
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
      httpOnly: true,
    },
  },
  plugins: [],
});
```

**Configuration Details:**

| Setting              | Value                | Purpose                           |
| -------------------- | -------------------- | --------------------------------- |
| **Database Adapter** | Drizzle (PostgreSQL) | Persist sessions, users, accounts |
| **Email/Password**   | Enabled              | Traditional authentication        |
| **Cookie sameSite**  | `none`               | Cross-origin cookie support       |
| **Cookie secure**    | `true`               | HTTPS-only cookies (production)   |
| **Cookie httpOnly**  | `true`               | Prevent XSS attacks               |
| **Trusted Origins**  | `env.CORS_ORIGIN`    | CORS whitelist                    |
| **Plugins**          | None (empty array)   | No additional auth providers      |

**Security Notes:**

- `sameSite: "none"` requires `secure: true` (browser requirement)
- Cookies are HTTP-only to prevent JavaScript access (XSS protection)
- No OAuth providers configured (email/password only)
- No 2FA or additional security plugins

---

## 2. Database Schema

### 2.1 Authentication Tables (`packages/db/src/schema/auth.ts`)

Better-Auth uses 4 tables for authentication:

#### **user** Table

```typescript
{
  id: text (PK)
  name: text (NOT NULL)
  email: text (NOT NULL, UNIQUE)
  emailVerified: boolean (DEFAULT: false, NOT NULL)
  image: text (nullable)
  createdAt: timestamp (DEFAULT: now(), NOT NULL)
  updatedAt: timestamp (DEFAULT: now(), ON UPDATE, NOT NULL)
}
```

**Purpose:** Store user account information and email verification status

#### **session** Table

```typescript
{
  id: text (PK)
  expiresAt: timestamp (NOT NULL)
  token: text (NOT NULL, UNIQUE)
  createdAt: timestamp (DEFAULT: now(), NOT NULL)
  updatedAt: timestamp (DEFAULT: now(), ON UPDATE, NOT NULL)
  ipAddress: text (nullable)
  userAgent: text (nullable)
  userId: text (NOT NULL, FK → user.id ON DELETE CASCADE)
}
// Index: session_userId_idx on userId
```

**Purpose:** Store active user sessions with metadata (IP, user agent)

#### **account** Table

```typescript
{
  id: text (PK)
  accountId: text (NOT NULL)
  providerId: text (NOT NULL)
  userId: text (NOT NULL, FK → user.id ON DELETE CASCADE)
  accessToken: text (nullable)
  refreshToken: text (nullable)
  idToken: text (nullable)
  accessTokenExpiresAt: timestamp (nullable)
  refreshTokenExpiresAt: timestamp (nullable)
  scope: text (nullable)
  password: text (nullable)
  createdAt: timestamp (DEFAULT: now(), NOT NULL)
  updatedAt: timestamp (DEFAULT: now(), ON UPDATE, NOT NULL)
}
// Index: account_userId_idx on userId
```

**Purpose:** Store OAuth tokens and password credentials for multiple auth providers

#### **verification** Table

```typescript
{
  id: text (PK)
  identifier: text (NOT NULL)
  value: text (NOT NULL)
  expiresAt: timestamp (NOT NULL)
  createdAt: timestamp (DEFAULT: now(), NOT NULL)
  updatedAt: timestamp (DEFAULT: now(), ON UPDATE, NOT NULL)
}
// Index: verification_identifier_idx on identifier
```

**Purpose:** Store email verification tokens and password reset codes

### 2.2 Drizzle Relations

```typescript
// User relations (one-to-many)
userRelations = {
  sessions: many(session),
  accounts: many(account),
};

// Session relations (many-to-one)
sessionRelations = {
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
};

// Account relations (many-to-one)
accountRelations = {
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
};
```

**Cascade Behavior:**

- When a `user` is deleted → all related `sessions` are deleted (ON DELETE CASCADE)
- When a `user` is deleted → all related `accounts` are deleted (ON DELETE CASCADE)

---

## 3. Backend Integration

### 3.1 Server Setup (`apps/server/src/index.ts`)

**Hono Server Configuration:**

```typescript
const app = new Hono();

// CORS middleware with credentials support
app.use(
  '/*',
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Required for cookie-based auth
  })
);

// Better-Auth handler mounted at /api/auth/*
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));
```

**Key Points:**

- All Better-Auth endpoints are prefixed with `/api/auth/*`
- CORS enabled with `credentials: true` for cookie support
- Supports both GET and POST methods for auth endpoints

**Better-Auth Endpoints Automatically Created:**

| Endpoint                  | Method | Purpose                        |
| ------------------------- | ------ | ------------------------------ |
| `/api/auth/sign-in/email` | POST   | Sign in with email/password    |
| `/api/auth/sign-up/email` | POST   | Sign up with email/password    |
| `/api/auth/sign-out`      | POST   | Sign out user (clears session) |
| `/api/auth/get-session`   | GET    | Retrieve current session       |
| `/api/auth/verify-email`  | POST   | Verify email address           |

### 3.2 ORPC Context Creation (`packages/api/src/context.ts`)

```typescript
export async function createContext({ context }: CreateContextOptions) {
  // Extract session from request headers using Better-Auth
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });

  return {
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

**How It Works:**

1. ORPC calls `createContext` for each request
2. `auth.api.getSession()` reads session cookie from request headers
3. Session is validated against database (check token, expiration)
4. Session object (with user data) is added to ORPC context
5. Context is available in all API procedures

**Session Object Structure:**

```typescript
{
  session: {
    id: string,
    userId: string,
    token: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
    user?: {
      id: string,
      name: string,
      email: string,
      emailVerified: boolean,
      image?: string,
    }
  } | null // null if not authenticated
}
```

### 3.3 ORPC Middleware (`packages/api/src/index.ts`)

**Public Procedures:**

```typescript
export const publicProcedure = o; // No auth required
```

**Protected Procedures (Auth Middleware):**

```typescript
const requireAuth = o.middleware(async ({ context, next }) => {
  // Check if session exists and has user data
  if (!context.session?.user) {
    throw new ORPCError('UNAUTHORIZED');
  }

  // Pass authenticated context to next middleware/procedure
  return next({
    context: {
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);
```

**Middleware Flow:**

1. Request arrives at protected procedure
2. `requireAuth` middleware checks `context.session?.user`
3. If no session/user → throws `ORPCError("UNAUTHORIZED")`
4. If session exists → calls `next()` with authenticated context
5. Procedure handler receives guaranteed authenticated session

---

## 4. Frontend Integration

### 4.1 Auth Client (`apps/web/src/lib/auth-client.ts`)

```typescript
import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
  baseURL: PUBLIC_SERVER_URL, // e.g., http://localhost:3000
});
```

**Better-Auth Svelte Integration:**

- Uses `better-auth/svelte` for Svelte-specific optimizations
- Provides reactive stores for session state
- Automatically handles cookie management
- Uses `PUBLIC_SERVER_URL` environment variable

### 4.2 Client-Side Usage Patterns

#### **Sign In** (`apps/web/src/components/SignInForm.svelte`)

```typescript
import { authClient } from '$lib/auth-client';

await authClient.signIn.email(
  { email: value.email, password: value.password },
  {
    onSuccess: () => goto('/dashboard'),
    onError: (error) => {
      console.log(error.error.message || 'Sign in failed');
    },
  }
);
```

**Flow:**

1. User submits email/password
2. `authClient.signIn.email()` sends POST to `/api/auth/sign-in/email`
3. Server validates credentials against `user` and `account` tables
4. On success → creates session in `session` table
5. Server sets HTTP-only session cookie in response
6. Browser stores cookie automatically
7. `onSuccess` callback navigates to dashboard

#### **Session Query** (`apps/web/src/components/UserMenu.svelte`)

```typescript
import { authClient } from '$lib/auth-client';

const sessionQuery = authClient.useSession();

// Reactive store with states:
// $sessionQuery.isPending - loading state
// $sessionQuery.data - session object or null
// $sessionQuery.error - error if request failed
```

**How `useSession()` Works:**

1. Calls GET `/api/auth/get-session` on mount
2. Automatically includes session cookie in request
3. Returns reactive Svelte store
4. Store updates when session changes (login/logout)
5. Automatically refetches on window focus (optional)

#### **Protected Route** (`apps/web/src/routes/dashboard/+page.svelte`)

```typescript
const sessionQuery = authClient.useSession();

$effect(() => {
  if (!$sessionQuery.isPending && !$sessionQuery.data) {
    goto('/login'); // Redirect if not authenticated
  }
});
```

**Client-Side Auth Check:**

1. Page mounts and queries session
2. If session is null → redirect to login
3. If session exists → render protected content

**Note:** This is a UI-level check only. Server-side validation via `protectedProcedure` is the real security measure.

#### **Sign Out** (`apps/web/src/components/UserMenu.svelte`)

```typescript
async function handleSignOut() {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => goto('/'),
      onError: (error) => {
        console.error('Sign out failed:', error);
      },
    },
  });
}
```

**Flow:**

1. User clicks sign out
2. `authClient.signOut()` sends POST to `/api/auth/sign-out`
3. Server deletes session from `session` table
4. Server clears session cookie (sets with expired date)
5. Browser removes cookie
6. `onSuccess` callback navigates to home

---

## 5. Authentication Flow Analysis

### 5.1 Sign In Flow

```
┌─────────┐                    ┌──────────────┐                 ┌─────────────┐
│ Browser │                    │ SvelteKit    │                 │ Server      │
│ (User)  │                    │ Frontend     │                 │ (Hono)      │
└────┬────┘                    └──────┬───────┘                 └──────┬──────┘
     │                                │                                │
     │ 1. Enter email/password        │                                │
     ├───────────────────────────────>│                                │
     │                                │                                │
     │                                │ 2. authClient.signIn.email()  │
     │                                ├───────────────────────────────>│
     │                                │    POST /api/auth/sign-in/email│
     │                                │    { email, password }         │
     │                                │                                │
     │                                │                                │ 3. Better-Auth handler
     │                                │                                │    - Validate credentials
     │                                │                                │    - Query user table
     │                                │                                │    - Verify password hash
     │                                │                                │
     │                                │                                │ 4. Create session record
     │                                │                                │    - Generate token
     │                                │                                │    - Insert into session table
     │                                │                                │
     │                                │ 5. Response with session cookie│
     │                                │<───────────────────────────────┤
     │                                │    Set-Cookie: session_token   │
     │                                │                                │
     │ 6. Navigate to dashboard       │                                │
     │<───────────────────────────────┤                                │
     │                                │                                │
```

### 5.2 Protected API Request Flow

```
┌─────────┐                    ┌──────────────┐                 ┌─────────────┐
│ Browser │                    │ SvelteKit    │                 │ Server      │
│ (User)  │                    │ Frontend     │                 │ (Hono)      │
└────┬────┘                    └──────┬───────┘                 └──────┬──────┘
     │                                │                                │
     │ 1. Call protectedProcedure     │                                │
     ├───────────────────────────────>│                                │
     │    orpc.privateData.query()    │                                │
     │                                │                                │
     │                                │ 2. Fetch /rpc/privateData      │
     │                                ├───────────────────────────────>│
     │                                │    Cookie: session_token       │
     │                                │                                │
     │                                │                                │ 3. ORPC handler
     │                                │                                │    - createContext()
     │                                │                                │    - auth.api.getSession()
     │                                │                                │
     │                                │                                │ 4. Validate session
     │                                │                                │    - Read cookie
     │                                │                                │    - Query session table
     │                                │                                │    - Check expiration
     │                                │                                │    - Join with user table
     │                                │                                │
     │                                │                                │ 5. requireAuth middleware
     │                                │                                │    - Check context.session?.user
     │                                │                                │    - Throw if missing
     │                                │                                │
     │                                │                                │ 6. Execute procedure
     │                                │                                │    - Access context.session.user
     │                                │                                │
     │                                │ 7. Response with data          │
     │                                │<───────────────────────────────┤
     │                                │    { message, user }           │
     │                                │                                │
     │ 8. Display data                │                                │
     │<───────────────────────────────┤                                │
     │                                │                                │
```

### 5.3 Session Management

**Session Creation:**

- Triggered by successful sign in
- Token: cryptographically random string
- Expiration: configurable (default: 30 days)
- Metadata: IP address, user agent captured

**Session Validation (Every Request):**

1. Extract session token from cookie
2. Query `session` table by token
3. Check if session exists and not expired
4. Join with `user` table to get user data
5. Return session object with user

**Session Destruction:**

- Triggered by sign out
- Session record deleted from `session` table
- Cookie cleared by setting expired date
- All client queries return null session

---

## 6. Security Considerations

### 6.1 Current Security Measures

✅ **Implemented:**

- HTTP-only cookies (XSS protection)
- Secure cookies (HTTPS-only, prevents MITM)
- Password hashing (via Better-Auth)
- Session token validation (every request)
- CORS with trusted origins
- Server-side session validation (protectedProcedure)
- Cascade deletes for data integrity

⚠️ **Potential Enhancements:**

- CSRF protection (Better-Auth can add)
- Session fixation protection (rotate tokens)
- Rate limiting on auth endpoints
- Password strength requirements
- 2FA/MFA support (via Better-Auth plugins)
- Session refresh mechanism
- IP-based session validation
- Device fingerprinting

### 6.2 Attack Mitigation

**XSS (Cross-Site Scripting):**

- HTTP-only cookies prevent JavaScript access
- No sensitive data in localStorage

**CSRF (Cross-Site Request Forgery):**

- `sameSite: "none"` allows cross-origin requests (required for SPA)
- Consider `sameSite: "lax"` if frontend and backend share origin
- Better-Auth has CSRF plugin available

**Session Hijacking:**

- IP address and user agent stored (can validate on request)
- Secure cookies prevent network interception
- Short session expiration reduces window

**Brute Force:**

- No rate limiting detected
- Recommend implementing rate limiting on `/api/auth/sign-in`

---

## 7. Integration Points

### 7.1 ORPC + Better-Auth Integration

**Key Files:**

- `packages/api/src/context.ts` - Session extraction
- `packages/api/src/index.ts` - Auth middleware
- `packages/auth/src/index.ts` - Better-Auth instance

**Benefits:**

- Type-safe session context (inferred from Better-Auth types)
- Centralized auth logic (middleware, not per-route)
- Easy to add new protected procedures
- Automatic error handling (ORPCError)

### 7.2 Frontend + Backend Communication

**Protocol:** HTTP with JSON
**Auth Method:** Session cookies (HTTP-only)
**Base URL:** `PUBLIC_SERVER_URL` environment variable
**CORS:** Enabled with credentials

**Request Headers:**

```
Cookie: session_token=<token>
Content-Type: application/json
```

**Response Headers:**

```
Set-Cookie: session_token=<token>; Path=/; HttpOnly; Secure; SameSite=None
```

---

## 8. Configuration Files

### 8.1 Environment Variables (`packages/env/src/server.ts`)

```typescript
DATABASE_URL: string; // PostgreSQL connection string
BETTER_AUTH_SECRET: string; // Min 32 chars - signs session tokens
BETTER_AUTH_URL: url; // Origin URL for auth endpoints
CORS_ORIGIN: url; // Frontend origin for CORS
NODE_ENV: 'development' | 'production' | 'test';
```

### 8.2 Public Environment Variables

```
PUBLIC_SERVER_URL // Server URL (e.g., http://localhost:3000)
```

---

## 9. Key Observations for Diagram Creation

### 9.1 Components to Visualize

**Authentication Flow:**

- User → SvelteKit Frontend → Hono Server → Better-Auth → Drizzle → PostgreSQL
- Session cookie flow (request/response)
- Context creation flow
- Middleware validation flow

**Sequence Diagrams Needed:**

1. Sign in (email/password) → session creation → cookie setting
2. Protected API request → session validation → middleware → procedure
3. Sign out → session deletion → cookie clearing
4. Session refresh/validation

### 9.2 Data Flow

**Request Flow:**

```
Frontend (SvelteKit)
  ↓ HTTP request with cookie
Backend (Hono)
  ↓ Route to /api/auth/* or /rpc/*
Better-Auth Handler OR ORPC Handler
  ↓ Context creation (getSession)
Drizzle ORM
  ↓ SQL query
PostgreSQL Database
```

**Session Object Flow:**

```
PostgreSQL (session table)
  ↓ Drizzle query
Better-Auth (getSession)
  ↓ Session object with user
ORPC Context
  ↓ context.session
Middleware/Procedures
  ↓ Access to user data
Business Logic
```

### 9.3 Middleware Chain

```
Request → Hono (logger, CORS)
  → ORPC Handler (prefix: /rpc)
    → createContext (auth.api.getSession)
      → requireAuth middleware (check session?.user)
        → Procedure handler (use context.session.user)
```

---

## 10. Recommendations

### 10.1 Documentation

- ✅ Clear separation of concerns (auth, API, frontend)
- ✅ Type-safe integration (TypeScript inference)
- ✅ Simple, maintainable code

### 10.2 Security Enhancements

1. Add CSRF protection via Better-Auth plugin
2. Implement rate limiting on auth endpoints
3. Add session rotation (regenerate token after sensitive actions)
4. Consider IP validation on session changes
5. Add password strength requirements

### 10.3 Developer Experience

1. Add auth utilities (e.g., `requireAuth()` helper for SvelteKit load functions)
2. Add session refresh mechanism
3. Add error handling utilities (auth error formatting)
4. Add auth state debugging tools (dev mode)

---

## Appendix: Code Reference

### Key Files by Package

**packages/auth:**

- `src/index.ts` - Better-Auth configuration

**packages/api:**

- `src/context.ts` - Session extraction for ORPC
- `src/index.ts` - Protected/public procedure middleware
- `src/routers/index.ts` - Example protected procedures

**packages/db:**

- `src/schema/auth.ts` - User, session, account, verification tables

**packages/env:**

- `src/server.ts` - Server environment variables

**apps/server:**

- `src/index.ts` - Hono server with auth handler mount

**apps/web:**

- `src/lib/auth-client.ts` - Better-Auth Svelte client
- `src/components/SignInForm.svelte` - Sign in implementation
- `src/components/UserMenu.svelte` - Session display and sign out
- `src/routes/dashboard/+page.svelte` - Protected route example

---

**End of Analysis**

This document provides comprehensive understanding of Better-Auth implementation in SambungChat, serving as the foundation for creating authentication flow sequence diagrams in the next phase.
