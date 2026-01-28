# Docker Development Setup

**Version:** 1.0.0
**Last Updated:** January 27, 2026

## Overview

Docker Development setup allows you to run the entire SambungChat stack in Docker containers with **hot reload** enabled.

### Quick Start

1. Configure environment:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Start services:
   \`\`\`bash
   bun run docker:dev:build
   \`\`\`

3. Access:
   - Frontend: http://localhost:5174
   - Backend: http://localhost:3000

4. Stop:
   \`\`\`bash
   bun run docker:dev:down
   \`\`\`

## Hot Reload

- **Backend**: Auto-restart on file changes (Bun --hot mode)
- **Frontend**: Vite HMR for instant updates
- **Volumes mounted**: Entire project for live code editing

## Services

| Service    | Port | Description |
| ---------- | ---- | ----------- |
| PostgreSQL | 5432 | Database    |
| Server     | 3000 | API Backend |
| Web        | 5174 | Frontend    |

## Troubleshooting

**Port already in use:**
\`\`\`bash
lsof -i :3000 # Find process
kill -9 <PID>
\`\`\`

**Rebuild after dependency changes:**
\`\`\`bash
bun run docker:dev:build
\`\`\`

**View logs:**
\`\`\`bash
bun run docker:dev:logs
\`\`\`

---
