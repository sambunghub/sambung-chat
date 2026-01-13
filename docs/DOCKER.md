# Docker Development Guide

**Version:** 1.0.0
**Last Updated:** January 13, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Environment Configuration](#environment-configuration)
4. [Docker Compose Files](#docker-compose-files)
5. [Development Workflow](#development-workflow)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Overview

SambaChat uses Docker for containerized development and deployment. The setup includes:

- **PostgreSQL Database**: PostgreSQL 16 Alpine
- **Server (Hono API)**: Backend API on port 3000
- **Web (SvelteKit)**: Frontend application on port 5173

### Architecture

```
┌─────────────────────────────────────────────────┐
│                    Docker Network                │
│                                                 │
│  ┌──────────────┐      ┌──────────────┐        │
│  │   Web App    │─────▶│   Server     │        │
│  │  (SvelteKit) │      │   (Hono)     │        │
│  │  Port: 5173  │      │  Port: 3000  │        │
│  └──────────────┘      └──────┬───────┘        │
│                                │                 │
│                                ▼                 │
│                        ┌──────────────┐         │
│                        │ PostgreSQL   │         │
│                        │ Port: 5432   │         │
│                        └──────────────┘         │
└─────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

### Development

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your configuration
# At minimum, configure AI provider

# 3. Start all services
docker compose up

# Or run in detached mode (background)
docker compose up -d
```

Services will be available at:

- **Web (SvelteKit)**: http://localhost:5173
- **Server (Hono API)**: http://localhost:3000
- **Database (PostgreSQL)**: localhost:5432

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f web
docker compose logs -f server
docker compose logs -f postgres
```

### Stop Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (deletes data!)
docker compose down -v
```

---

## Environment Configuration

### Centralized `.env` File

Docker Compose automatically reads environment variables from the `.env` file in the project root.

```bash
# .env (same file used for local development)

# ===========================================
# DATABASE
# ===========================================
DATABASE_URL=postgresql://sambungchat:sambungchat_dev@postgres:5432/sambungchat_dev
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
# AI PROVIDER
# ===========================================
AI_PROVIDER=openai
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

### Environment Variables with Defaults

The `docker-compose.yml` file includes default values for most variables:

```yaml
environment:
  # Uses ${VAR:-default} syntax for defaults
  NODE_ENV: ${NODE_ENV:-development}
  DATABASE_URL: ${DATABASE_URL:-postgresql://sambungchat:sambungchat_dev@postgres:5432/sambungchat_dev}
  AI_PROVIDER: ${AI_PROVIDER:-openai}
  OPENAI_MODEL: ${OPENAI_MODEL:-gpt-4o-mini}
```

**Required variables** (no defaults, must be set in `.env`):

- `OPENAI_API_KEY` (or other AI provider API key)

**Optional variables** (have sensible defaults):

- `NODE_ENV`
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `CORS_ORIGIN`
- `AI_PROVIDER`
- `OPENAI_MODEL`

### AI Provider Configuration

Configure your AI provider in `.env`:

```bash
# Z.AI (OpenAI-compatible)
AI_PROVIDER=openai
OPENAI_API_KEY=08909090
OPENAI_BASE_URL=https://api.z.ai/api/coding/paas/v4
OPENAI_MODEL=glm-4.7

# OpenAI (Official)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini

# Anthropic
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Ollama (local, no API key)
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.2
```

---

## Docker Compose Files

| File                      | Purpose     | Environment                      |
| ------------------------- | ----------- | -------------------------------- |
| `docker-compose.yml`      | Development | Development mode with hot reload |
| `docker-compose.prod.yml` | Production  | Production-optimized builds      |

### Development Compose

**File:** `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-sambungchat}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-sambungchat_dev}
      POSTGRES_DB: ${POSTGRES_DB:-sambungchat_dev}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-sambungchat}']
      interval: 10s
      timeout: 5s
      retries: 5

  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
      target: development
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      DATABASE_URL: ${DATABASE_URL}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL}
      CORS_ORIGIN: ${CORS_ORIGIN}
      AI_PROVIDER: ${AI_PROVIDER:-openai}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      OPENAI_BASE_URL: ${OPENAI_BASE_URL}
      OPENAI_MODEL: ${OPENAI_MODEL:-gpt-4o-mini}
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    depends_on:
      postgres:
        condition: service_healthy

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      target: development
    ports:
      - '5173:5173'
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PUBLIC_API_URL: ${PUBLIC_API_URL}
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    depends_on:
      - server
```

---

## Development Workflow

### Hot Module Replacement (HMR)

Both server and web support hot reload during development:

- **Server**: Bun hot reload (`--hot` flag)
- **Web**: Vite HMR with polling

File changes are automatically detected and applied without restarting containers.

### Rebuild after Dependency Changes

```bash
# Rebuild specific service
docker compose build server
docker compose up -d --no-deps server

# Rebuild all services
docker compose build
docker compose up -d
```

### Access Container Shell

```bash
# Access web container
docker compose exec web sh

# Access server container
docker compose exec server sh

# Access database
docker compose exec postgres psql -U sambungchat -d sambungchat_dev
```

### Run Commands in Containers

```bash
# Run database migrations
docker compose exec server bun run db:push

# Open database studio
docker compose exec server bun run db:studio

# Run tests
docker compose exec server bun test
```

### Clean Up

```bash
# Remove stopped containers
docker compose rm

# Remove unused images
docker image prune

# Remove unused volumes (WARNING: deletes data!)
docker volume prune
```

---

## Production Deployment

### Production Compose

**File:** `docker-compose.prod.yml`

```bash
# Build and start production containers
docker compose -f docker-compose.prod.yml up -d --build

# Check health status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Resource Limits

Production containers have resource limits:

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

Adjust in `docker-compose.prod.yml` if needed.

### Health Checks

Health checks run every 30 seconds:

```yaml
healthcheck:
  interval: 30s
  timeout: 10s
  start_period: 5s
  retries: 3
  test: ['CMD', 'wget', '--spider', 'http://localhost:3000/health']
```

### Logs

Production logs are configured with:

- Max size: 10MB per file
- Max files: 3 per container

```yaml
logging:
  driver: 'json-file'
  options:
    max-size: '10m'
    max-file: '3'
```

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :5173  # Web
lsof -i :3000  # Server
lsof -i :5432  # Database

# Stop conflicting service
docker compose down

# Or change ports in docker-compose.yml
ports:
  - '5174:5173'  # Use different host port
```

### Database Connection Errors

```bash
# Check database is healthy
docker compose ps postgres

# Should show "(healthy)" status

# Restart database
docker compose restart postgres

# View database logs
docker compose logs postgres

# Access database directly
docker compose exec postgres psql -U sambungchat -d sambungchat_dev
```

### Build Fails with "Module Not Found"

```bash
# Clear Docker cache and rebuild
docker compose build --no-cache

# Or remove everything and start fresh
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### File Changes Not Detected

```bash
# Check volume mounts
docker compose config

# Ensure volumes are mounted correctly
# Should show: .:/app (cached)

# Restart with cache flush
docker compose restart web
docker compose restart server
```

### Environment Variables Not Loading

```bash
# Verify .env exists
ls -la .env

# Check syntax (no spaces around =)
# ✅ Correct
VARIABLE=value

# ❌ Incorrect
VARIABLE = value

# Test with docker compose config
docker compose config

# Should show your variables interpolated
```

### HMR Not Working

1. Check if ports are exposed correctly
2. Verify Vite is running with `--host 0.0.0.0`
3. Try increasing polling interval in `vite.config.ts`:

```typescript
export default {
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
};
```

### Server Crashes on Startup

```bash
# Check server logs
docker compose logs server

# Common issues:
# 1. Missing AI provider API key
#    → Set OPENAI_API_KEY or other provider in .env

# 2. Database not ready
#    → Check postgres health status
#    → Ensure depends_on condition is met

# 3. Invalid environment variables
#    → Check .env syntax
#    → Validate against schema in packages/env/src/server.ts
```

### View All Container Status

```bash
# List all containers with status
docker compose ps

# Expected output:
# NAME                     STATUS                    PORTS
# sambungchat-db-dev       Up (healthy)              5432->5432/tcp
# sambungchat-server-dev   Up                        3000->3000/tcp
# sambungchat-web-dev      Up                        5173->5173/tcp
```

---

## Docker Tips

### View Resource Usage

```bash
# Container resource usage
docker stats

# Specific container
docker stats sambungchat-server-dev
```

### Copy Files From Container

```bash
# Copy file from container
docker compose exec web cat /app/package.json > local-package.json

# Or use docker cp
docker cp sambungchat-server-dev:/app/apps/server/dist ./dist
```

### Enter Container with Shell

```bash
# Interactive shell
docker compose exec server sh

# Or use docker run
docker run -it --rm \
  --volumes-from sambungchat-server-dev \
  --network sambung-chat_sambungchat-network \
  sambung-chat-server \
  sh
```

---

## Related Documents

- [ENVIRONMENT](./ENVIRONMENT.md) - Environment configuration
- [DATABASE](./DATABASE.md) - Database setup
- [Deployment](./deployment.md) - Production deployment
- [Getting Started](./getting-started.md) - Initial setup

---

## References

- [Vite Docker Guide](https://vite.dev/guide/build.html)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Bun Docker](https://bun.sh/docs/docker/dockerfile)

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
