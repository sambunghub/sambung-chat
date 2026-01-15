# Docker Development Guide

This guide explains how to run SambungChat entirely in Docker for development.

## Prerequisites

- Docker Desktop or Docker Engine installed
- Bun installed locally (for initial dependency setup)
- `.env` file configured (copy from `.env.example`)

## Quick Start

### 1. Install Dependencies Locally

First, install dependencies on your host machine (required for proper Docker volume mounting):

```bash
bun install
```

### 2. Configure Environment

Copy the environment example and configure it:

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start All Services

```bash
# Start all services (postgres + server + web)
bun run docker:dev

# Or rebuild and start
bun run docker:dev:build
```

### 4. Access Services

- **Web App**: http://localhost:5173
- **API Server**: http://localhost:3000
- **PostgreSQL**: localhost:5432

## Available Commands

| Command                    | Description                    |
| -------------------------- | ------------------------------ |
| `bun run docker:dev`       | Start all services             |
| `bun run docker:dev:build` | Rebuild and start all services |
| `bun run docker:dev:logs`  | View logs from all services    |
| `bun run docker:dev:down`  | Stop and remove all containers |

## Hot Reload

Both server and web support hot reload:

- **Server**: Uses Bun's `--hot` flag - changes auto-restart the server
- **Web**: Uses Vite HMR - changes reflect instantly in the browser

## Docker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   PostgreSQL │  │    Server    │  │     Web      │      │
│  │   :5432      │──│    :3000     │──│    :5173     │      │
│  │              │  │  (Bun --hot) │  │  (Vite HMR)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                      Host Machine                             │
└─────────────────────────────────────────────────────────────┘
```

## Volume Mounts

- **Server**: Entire project mounted (`./ → /app`)
- **Web**: Selective mounts for hot reload efficiency
  - `./apps/web → /app/apps/web`
  - `./packages → /app/packages`

## Troubleshooting

### Port Already in Use

If ports are already in use, modify them in `.env`:

```env
POSTGRES_PORT=5433
SERVER_PORT=3001
WEB_PORT=5174
```

### Containers Not Starting

Check logs:

```bash
bun run docker:dev:logs
```

### Rebuild After Major Changes

```bash
# Stop containers
bun run docker:dev:down

# Remove built images
docker rmi sambungchat-server sambungchat-web

# Rebuild and start
bun run docker:dev:build
```

## Production Deployment

For production, use the production compose file:

```bash
bun run docker:prod
```

This uses optimized multi-stage builds with minimal image sizes.
