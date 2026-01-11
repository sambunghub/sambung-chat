# SambungChat Environment Configuration

**Version:** 0.1.0
**Last Updated:** January 11, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [Configuration Files](#configuration-files)
4. [Setup Guide](#setup-guide)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Overview

SambungChat uses environment variables for configuration across multiple applications:

```
sambung-chat/
├── apps/
│   ├── server/
│   │   └── .env          # Server environment
│   └── web/
│       └── .env          # Web client environment
└── packages/
    ├── env/
    │   ├── src/
    │   │   ├── server.ts  # Server env validation
    │   │   └── client.ts  # Client env validation
    │   └── src/
    │       └── index.ts
```

---

## Environment Variables

### Server Environment (`apps/server/.env`)

#### Required Variables

| Variable             | Description                   | Example                               | Default                 |
| -------------------- | ----------------------------- | ------------------------------------- | ----------------------- |
| `DATABASE_URL`       | PostgreSQL connection string  | `postgresql://user:pass@host:5432/db` | -                       |
| `BETTER_AUTH_SECRET` | Secret for session encryption | `random-min-32-chars`                 | -                       |
| `BETTER_AUTH_URL`    | Base URL for auth             | `http://localhost:3000`               | `http://localhost:3000` |
| `CORS_ORIGIN`        | Allowed CORS origins          | `http://localhost:5173`               | `*`                     |

```bash
# apps/server/.env

# Database
DATABASE_URL=postgresql://sambungchat:sambungchat@localhost:5432/sambungchat

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-min-32-characters-long
BETTER_AUTH_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:5173

# Port (optional)
PORT=3000
```

#### Optional Variables

| Variable         | Description                | Example                          | Default       |
| ---------------- | -------------------------- | -------------------------------- | ------------- |
| `ENCRYPTION_KEY` | Key for API key encryption | `random-32-char-hex`             | -             |
| `NODE_ENV`       | Environment mode           | `production`                     | `development` |
| `LOG_LEVEL`      | Logging verbosity          | `debug`, `info`, `warn`, `error` | `info`        |

```bash
# apps/server/.env (continued)

# Encryption (for API keys)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef

# Environment
NODE_ENV=development

# Logging
LOG_LEVEL=debug
```

### Client Environment (`apps/web/.env`)

**Note:** Client variables must be prefixed with `PUBLIC_` to be exposed to browser.

| Variable            | Description     | Example                 |
| ------------------- | --------------- | ----------------------- |
| `PUBLIC_SERVER_URL` | Backend API URL | `http://localhost:3000` |

```bash
# apps/web/.env

PUBLIC_SERVER_URL=http://localhost:3000
```

---

## Configuration Files

### Server Environment Validation

**File:** `packages/env/src/server.ts`

```typescript
import { z } from 'zod';

export const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Optional
  ENCRYPTION_KEY: z.string().length(32).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Server
  PORT: z.coerce.number().default(3000),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
```

### Client Environment Validation

**File:** `packages/env/src/client.ts`

```typescript
import { z } from 'zod';

export const clientEnvSchema = z.object({
  PUBLIC_SERVER_URL: z.string().url(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
```

### Environment Export

**File:** `packages/env/src/index.ts`

```typescript
import { serverEnvSchema } from './server';
import { clientEnvSchema } from './client';

// Validate server environment
export const serverEnv = serverEnvSchema.parse(process.env);

// Validate client environment (build-time)
export const clientEnv = clientEnvSchema.parse({
  PUBLIC_SERVER_URL: process.env.PUBLIC_SERVER_URL,
});
```

---

## Setup Guide

### Step 1: Generate Secrets

```bash
# Generate Better Auth secret (32+ chars)
openssl rand -base64 32

# Generate encryption key (32 hex chars)
openssl rand -hex 16
```

### Step 2: Create Server Environment

```bash
# Copy example
cp apps/server/.env.example apps/server/.env

# Edit with your values
nano apps/server/.env
```

**Example `.env` file:**

```bash
# apps/server/.env

# ===========================================
# DATABASE
# ===========================================
DATABASE_URL=postgresql://sambungchat:sambungchat@localhost:5432/sambungchat

# ===========================================
# AUTHENTICATION
# ===========================================
BETTER_AUTH_SECRET=9K8jM3nB5pL7xR2tV4wY6zA8cD0eF1gH2iJ3kL4mN5oP
BETTER_AUTH_URL=http://localhost:3000

# ===========================================
# CORS
# ===========================================
CORS_ORIGIN=http://localhost:5173

# ===========================================
# ENCRYPTION (for API keys)
# ===========================================
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef

# ===========================================
# SERVER
# ===========================================
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### Step 3: Create Client Environment

```bash
# Copy example
cp apps/web/.env.example apps/web/.env

# Edit with your values
nano apps/web/.env
```

**Example `.env` file:**

```bash
# apps/web/.env

# ===========================================
# API
# ===========================================
PUBLIC_SERVER_URL=http://localhost:3000
```

### Step 4: Create `.env.example` Templates

**File:** `apps/server/.env.example`

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sambungchat

# Better Auth (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=change-me-to-random-32-char-string
BETTER_AUTH_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:5173

# Encryption (generate with: openssl rand -hex 16)
ENCRYPTION_KEY=change-me-to-32-char-hex-key

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

**File:** `apps/web/.env.example`

```bash
# API
PUBLIC_SERVER_URL=http://localhost:3000
```

---

## Security Best Practices

### 1. Never Commit `.env` Files

**File:** `.gitignore`

```gitignore
# Environment files
.env
.env.local
.env.*.local
apps/server/.env
apps/web/.env
```

### 2. Use Strong Secrets

```bash
# ✅ Good (32+ random characters)
BETTER_AUTH_SECRET=a7xK9mP3nL5vR8tY2wB4cD6eF8gH0jK2lM4nP6rQ8sT

# ❌ Bad (guessable)
BETTER_AUTH_SECRET=secret123
BETTER_AUTH_SECRET=password
```

### 3. Different Secrets per Environment

```bash
# Development
BETTER_AUTH_SECRET=dev-secret-32-chars-minimum-length

# Production
BETTER_AUTH_SECRET=prod-secret-different-from-dev-32-chars

# Use separate .env files
# .env.development
# .env.production
```

### 4. Rotate Secrets Regularly

```bash
# Generate new secret
openssl rand -base64 32

# Update .env file
# Restart server

# Note: This will invalidate existing sessions
```

### 5. Limit CORS Origins

```bash
# ❌ Too permissive (any origin)
CORS_ORIGIN=*

# ✅ Specific origin
CORS_ORIGIN=http://localhost:5173

# ✅ Multiple origins (comma-separated)
CORS_ORIGIN=https://app.sambungchat.com,https://sambungchat.com
```

---

## Environment-Specific Configs

### Development

**File:** `apps/server/.env.development`

```bash
DATABASE_URL=postgresql://sambungchat:sambungchat@localhost:5432/sambungchat_dev
BETTER_AUTH_SECRET=dev-secret-key-32-chars-minimum-for-development
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
```

### Production

**File:** `apps/server/.env.production`

```bash
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/sambungchat
BETTER_AUTH_SECRET=prod-secret-key-must-be-different-from-dev-32-chars
BETTER_AUTH_URL=https://api.sambungchat.com
CORS_ORIGIN=https://app.sambungchat.com
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

### Testing

**File:** `apps/server/.env.test`

```bash
DATABASE_URL=postgresql://sambungchat:sambungchat@localhost:5432/sambungchat_test
BETTER_AUTH_SECRET=test-secret-key-32-chars-minimum-for-testing
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
PORT=3001
NODE_ENV=test
LOG_LEVEL=error
```

---

## Docker Environment

### Docker Compose

**File:** `docker-compose.yml`

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-sambungchat}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-sambungchat}
      POSTGRES_DB: ${POSTGRES_DB:-sambungchat}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-sambungchat}:${POSTGRES_PASSWORD:-sambungchat}@postgres:5432/${POSTGRES_DB:-sambungchat}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL}
      CORS_ORIGIN: ${CORS_ORIGIN}
    ports:
      - '3000:3000'
    depends_on:
      - postgres

volumes:
  postgres_data:
```

**File:** `.env` (for Docker)

```bash
POSTGRES_USER=sambungchat
POSTGRES_PASSWORD=sambungchat
POSTGRES_DB=sambungchat
BETTER_AUTH_SECRET=your-secret-key-32-char-minimum
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
```

---

## Troubleshooting

### Error: `DATABASE_URL` is not defined

**Problem:** Environment variable not loaded

**Solution:**

```bash
# Check .env file exists
ls apps/server/.env

# Check variable is set
grep DATABASE_URL apps/server/.env

# Restart server
bun run dev:server
```

### Error: Invalid environment variables

**Problem:** Zod validation failed

**Solution:**

```bash
# Check schema validation
cat packages/env/src/server.ts

# Verify your .env matches schema
BETTER_AUTH_SECRET must be 32+ characters
DATABASE_URL must be valid URL
```

### Error: CORS blocked

**Problem:** Frontend can't connect to backend

**Solution:**

```bash
# Check CORS_ORIGIN in server .env
CORS_ORIGIN=http://localhost:5173  # Must match frontend URL

# Check PUBLIC_SERVER_URL in web .env
PUBLIC_SERVER_URL=http://localhost:3000  # Must match backend URL
```

### Error: Auth session invalid

**Problem:** `BETTER_AUTH_SECRET` changed

**Solution:**

```bash
# Clear all sessions (or use consistent secret)
# Users will need to sign in again
```

---

## Quick Reference

### Generate All Secrets

```bash
# Better Auth Secret
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"

# Encryption Key
echo "ENCRYPTION_KEY=$(openssl rand -hex 16)"
```

### Validate Environment

```bash
# Server
cd apps/server
bun run env:validate

# Client
cd apps/web
bun run env:validate
```

### Load Environment in Code

```typescript
// Server
import { serverEnv } from '@sambung-chat/env/server';

console.log(serverEnv.DATABASE_URL);
console.log(serverEnv.PORT);

// Client (SvelteKit)
import { env } from '$env/dynamic/public';

console.log(env.PUBLIC_SERVER_URL);
```

---

## Related Documents

- [DATABASE](./DATABASE.md) - Database setup
- [Deployment](./deployment.md) - Production deployment
- [Getting Started](./getting-started.md) - Initial setup

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
