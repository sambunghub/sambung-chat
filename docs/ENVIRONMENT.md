# SambungChat Environment Configuration

**Version:** 1.0.0
**Last Updated:** January 13, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Centralized Environment Setup](#centralized-environment-setup)
3. [Environment Variables Reference](#environment-variables-reference)
4. [AI Provider Configuration](#ai-provider-configuration)
5. [Setup Guide](#setup-guide)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

SambungChat uses a **centralized environment configuration** system:

```
sambung-chat/
├── .env                  # Centralized environment variables (NOT in git)
├── .env.example          # Template with all available variables
└── packages/
    └── env/
        └── src/
            └── server.ts # Environment validation schema
```

### Key Principles

1. **Single Source of Truth**: One `.env` file in the project root
2. **Shared Configuration**: Both local development and Docker use the same file
3. **Validated Schema**: Type-safe environment variables via Zod
4. **AI Provider Flexibility**: Support for multiple AI providers with fallback chains

---

## Centralized Environment Setup

### Directory Structure

```
sambung-chat/
├── .env                   # ⚠️ DO NOT COMMIT - Your actual secrets
├── .env.example           # ✅ In git - Template for all variables
├── .gitignore             # Excludes .env from version control
├── docker-compose.yml     # Reads from .env automatically
├── apps/
│   ├── server/            # Uses root .env via @sambung-chat/env package
│   └── web/               # Uses root .env via SvelteKit load function
└── packages/
    └── env/
        └── src/
            └── server.ts  # Validates and exports environment variables
```

### How It Works

1. **Local Development** (`bun run dev`):
   - Loads variables from root `.env` via `dotenv/config`
   - Validated by `@sambung-chat/env` package

2. **Docker** (`docker compose up`):
   - Docker Compose automatically reads root `.env`
   - Variables passed to containers via `environment:` section

3. **Environment Validation**:
   - Schema defined in `packages/env/src/server.ts`
   - Throws error if required variables are missing or invalid

---

## Environment Variables Reference

### Core Application Settings

| Variable         | Description                    | Example                             | Default                 |
| ---------------- | ------------------------------ | ----------------------------------- | ----------------------- |
| `NODE_ENV`       | Environment mode               | `development`, `production`, `test` | `development`           |
| `SERVER_PORT`    | Server port (local dev)        | `3000`                              | `3000`                  |
| `WEB_PORT`       | Web port (local dev)           | `5173`                              | `5173`                  |
| `PUBLIC_API_URL` | Backend API URL (for frontend) | `http://localhost:3000`             | `http://localhost:3000` |

### Database Configuration

| Variable            | Description                  | Example                               | Default           |
| ------------------- | ---------------------------- | ------------------------------------- | ----------------- |
| `DATABASE_URL`      | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | -                 |
| `POSTGRES_USER`     | Docker PostgreSQL username   | `sambungchat`                         | `sambungchat`     |
| `POSTGRES_PASSWORD` | Docker PostgreSQL password   | `sambungchat_dev`                     | `sambungchat_dev` |
| `POSTGRES_DB`       | Docker PostgreSQL database   | `sambungchat_dev`                     | `sambungchat_dev` |

**Database URLs by Environment:**

```bash
# Local Development (with local PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/sambung-chat

# Docker Development (with containerized PostgreSQL)
DATABASE_URL=postgresql://sambungchat:sambungchat_dev@postgres:5432/sambungchat_dev

# Production
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/sambungchat
```

### Authentication Configuration

| Variable             | Description               | Example                 | Requirement       |
| -------------------- | ------------------------- | ----------------------- | ----------------- |
| `BETTER_AUTH_SECRET` | Session encryption secret | `random-32-chars`       | Min 32 characters |
| `BETTER_AUTH_URL`    | Base URL for auth         | `http://localhost:3000` | Required          |
| `CORS_ORIGIN`        | Allowed CORS origins      | `http://localhost:5173` | Required          |

**BETTER_AUTH_URL by Environment:**

```bash
# Local Development (direct server access)
BETTER_AUTH_URL=http://localhost:3000

# Docker Development
BETTER_AUTH_URL=http://localhost:3000

# Production
BETTER_AUTH_URL=https://api.sambungchat.com
```

**CORS_ORIGIN Examples:**

```bash
# Single origin (development)
CORS_ORIGIN=http://localhost:5173

# Single origin (production)
CORS_ORIGIN=https://app.sambungchat.com

# Multiple origins
CORS_ORIGIN=https://app.sambungchat.com,https://sambungchat.com
```

### API Key Encryption Configuration

| Variable         | Description                 | Example                      | Requirement     |
| ---------------- | --------------------------- | ---------------------------- | --------------- |
| `ENCRYPTION_KEY` | Encryption key for API keys | `base64-encoded-32-byte-key` | 32 bytes base64 |

**ENCRYPTION_KEY Setup:**

The `ENCRYPTION_KEY` is used to encrypt API keys at rest using AES-256-GCM encryption.

```bash
# Generate a secure encryption key (32 bytes, base64-encoded)
openssl rand -base64 32

# Alternative: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Alternative: Bun
bun -e "console.log(crypto.randomBytes(32).toString('base64'))"
```

**IMPORTANT:**

- **Never commit** this key to git
- **Never share** this key across environments
- **Back up securely** - if lost, all encrypted API keys become permanently unreadable
- See [API Key Encryption Setup](./setup/api-keys.md) for detailed instructions

---

## AI Provider Configuration

### Supported Providers

| Provider  | Key Variable                   | Base URL Variable    | Model Variable    |
| --------- | ------------------------------ | -------------------- | ----------------- |
| OpenAI    | `OPENAI_API_KEY`               | `OPENAI_BASE_URL`    | `OPENAI_MODEL`    |
| Anthropic | `ANTHROPIC_API_KEY`            | `ANTHROPIC_BASE_URL` | `ANTHROPIC_MODEL` |
| Google    | `GOOGLE_GENERATIVE_AI_API_KEY` | -                    | `GOOGLE_MODEL`    |
| Groq      | `GROQ_API_KEY`                 | `GROQ_BASE_URL`      | `GROQ_MODEL`      |
| Ollama    | - (local)                      | `OLLAMA_BASE_URL`    | `OLLAMA_MODEL`    |

### Provider Selection

Set `AI_PROVIDER` to choose your primary AI provider:

```bash
# Single provider
AI_PROVIDER=openai

# Fallback chain (tries in order, uses first that works)
AI_PROVIDER=openai,anthropic,groq

# Local AI (no API key needed)
AI_PROVIDER=ollama
```

### OpenAI-Compatible APIs

For OpenAI-compatible APIs like Z.AI:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.z.ai/api/coding/paas/v4
OPENAI_MODEL=glm-4.7
```

### Default Models

| Provider  | Default Model                | Alternative Models                                    |
| --------- | ---------------------------- | ----------------------------------------------------- |
| OpenAI    | `gpt-4o-mini`                | `gpt-4o`, `o1-mini`, `o1-preview`                     |
| Anthropic | `claude-3-5-sonnet-20241022` | `claude-3-5-haiku-20241022`, `claude-3-opus-20240229` |
| Google    | `gemini-2.5-flash`           | `gemini-2.5-pro`                                      |
| Groq      | `llama-3.3-70b-versatile`    | `llama-3.1-70b-versatile`, `mixtral-8x7b-32768`       |
| Ollama    | `llama3.2`                   | `llama3.1`, `mistral`, `codellama`, `gemma2`          |

---

## Setup Guide

### Step 1: Create Environment File

```bash
# Copy the example template
cp .env.example .env
```

### Step 2: Generate Secrets

```bash
# Generate Better Auth secret (min 32 characters)
openssl rand -base64 32

# Generate ENCRYPTION_KEY for API key encryption (32 bytes, base64)
openssl rand -base64 32
```

### Step 3: Configure Required Variables

Edit `.env` with your values:

```bash
# ===========================================
# CORE SETTINGS
# ===========================================
NODE_ENV=development
SERVER_PORT=3000
WEB_PORT=5173
PUBLIC_API_URL=http://localhost:3000

# ===========================================
# DATABASE
# ===========================================
# For local development
DATABASE_URL=postgresql://postgres:password@localhost:5432/sambung-chat

# For Docker development
# DATABASE_URL=postgresql://sambungchat:sambungchat_dev@postgres:5432/sambungchat_dev

# Docker PostgreSQL config
POSTGRES_USER=sambungchat
POSTGRES_PASSWORD=sambungchat_dev
POSTGRES_DB=sambungchat_dev

# ===========================================
# AUTHENTICATION
# ===========================================
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173

# ===========================================
# API KEY ENCRYPTION
# ===========================================
# Required for secure API key storage
# Generate with: openssl rand -base64 32
# See docs/setup/api-keys.md for detailed setup instructions
ENCRYPTION_KEY=your-base64-encoded-32-byte-encryption-key

# ===========================================
# AI PROVIDER (Choose one)
# ===========================================

# Option 1: Z.AI (OpenAI-compatible)
AI_PROVIDER=openai
OPENAI_API_KEY=your-z-ai-api-key
OPENAI_BASE_URL=https://api.z.ai/api/coding/paas/v4
OPENAI_MODEL=glm-4.7

# Option 2: OpenAI
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-your-openai-api-key
# OPENAI_MODEL=gpt-4o-mini

# Option 3: Anthropic
# AI_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-your-key
# ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Option 4: Ollama (local, no API key)
# AI_PROVIDER=ollama
# OLLAMA_BASE_URL=http://localhost:11434/v1
# OLLAMA_MODEL=llama3.2
```

### Step 4: Start the Application

**Local Development:**

```bash
# Install dependencies
bun install

# Start all services (database, server, web)
bun run dev

# Or start specific service
bun run dev:server  # Server only
bun run dev:web     # Web only
```

**Docker Development:**

```bash
# Start all containers
docker compose up

# Or detached mode
docker compose up -d

# View logs
docker compose logs -f
```

---

## Security Best Practices

### 1. Never Commit `.env` File

**File:** `.gitignore`

```gitignore
# Environment files
.env
.env*.local
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
# Development (.env)
BETTER_AUTH_SECRET=dev-secret-32-chars-minimum-length

# Production (.env.production)
BETTER_AUTH_SECRET=prod-secret-different-from-dev-32-chars
```

### 4. Rotate Secrets Regularly

```bash
# Generate new secret
openssl rand -base64 32

# Update .env file
# Restart application
# Note: This will invalidate existing sessions
```

### 5. Limit CORS Origins

```bash
# ❌ Too permissive
CORS_ORIGIN=*

# ✅ Specific origin
CORS_ORIGIN=http://localhost:5173

# ✅ Multiple origins
CORS_ORIGIN=https://app.sambungchat.com,https://sambungchat.com
```

### 6. Protect API Keys

- Use environment-specific API keys
- Rotate API keys regularly
- Monitor usage for unusual activity
- Use API key restrictions when available

---

## Troubleshooting

### Error: `DATABASE_URL` is not defined

**Problem:** Environment variable not loaded

**Solution:**

```bash
# Check .env file exists
ls .env

# Check variable is set
grep DATABASE_URL .env

# Restart application
bun run dev  # or docker compose restart
```

### Error: At least one AI provider API key is required

**Problem:** No AI provider configured

**Solution:**

```bash
# Configure at least one AI provider in .env
AI_PROVIDER=openai
OPENAI_API_KEY=your-api-key

# Or use local Ollama (no key needed)
AI_PROVIDER=ollama
```

### Error: `BETTER_AUTH_SECRET` must be at least 32 characters

**Problem:** Secret too short

**Solution:**

```bash
# Generate proper secret
openssl rand -base64 32

# Update .env
BETTER_AUTH_SECRET=<generated-secret>
```

### Error: `ENCRYPTION_KEY` must be a 32-byte base64-encoded key

**Problem:** Encryption key invalid format or wrong length

**Solution:**

```bash
# Generate proper key (32 bytes, base64-encoded)
openssl rand -base64 32

# Verify length
openssl rand -base64 32 | base64 -d | wc -c
# Should output: 32

# Update .env
ENCRYPTION_KEY=<generated-key>
```

**For detailed troubleshooting, see [API Key Encryption Setup](./setup/api-keys.md#troubleshooting)**

### Docker: Environment variables not loading

**Problem:** Docker Compose not reading .env

**Solution:**

```bash
# Verify .env is in project root (same as docker-compose.yml)
ls -la .env docker-compose.yml

# Check variable format (no spaces around =)
# ✅ Correct
VARIABLE=value

# ❌ Incorrect
VARIABLE = value

# Test with docker compose config
docker compose config
```

### Error: CORS blocked

**Problem:** Frontend can't connect to backend

**Solution:**

```bash
# Check CORS_ORIGIN matches frontend URL
CORS_ORIGIN=http://localhost:5173

# Check PUBLIC_API_URL matches backend URL
PUBLIC_API_URL=http://localhost:3000
```

---

## Quick Reference

### Environment-Specific Configs

**Development:**

```bash
NODE_ENV=development
DATABASE_URL=postgresql://sambungchat:sambungchat_dev@postgres:5432/sambungchat_dev
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
```

**Production:**

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/sambungchat
BETTER_AUTH_SECRET=<strong-production-secret>
BETTER_AUTH_URL=https://api.sambungchat.com
CORS_ORIGIN=https://app.sambungchat.com
```

### Generate All Secrets

```bash
# Better Auth Secret
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"

# ENCRYPTION_KEY for API key encryption
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"
```

### Validate Environment

```bash
# Check .env syntax
cat .env

# Validate schema (if validation script exists)
bun run env:validate
```

### Load Environment in Code

```typescript
// Server
import { env } from '@sambung-chat/env/server';

console.log(env.DATABASE_URL);
console.log(env.BETTER_AUTH_SECRET);
console.log(env.AI_PROVIDER);
console.log(env.OPENAI_API_KEY);
```

---

## Related Documents

- [DOCKER](./DOCKER.md) - Docker development setup
- [DATABASE](./DATABASE.md) - Database setup
- [Deployment](./deployment.md) - Production deployment
- [Getting Started](./getting-started.md) - Initial setup

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
