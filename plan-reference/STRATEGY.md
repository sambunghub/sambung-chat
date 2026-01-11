# SambungChat Documentation & Development Strategy

**Version:** 1.0
**Created:** January 11, 2026
**Status:** Active

---

## Table of Contents

1. [Documentation Strategy](#documentation-strategy)
2. [Sync Mechanism](#sync-mechanism)
3. [Roadmap Tracking](#roadmap-tracking)
4. [Development Workflow](#development-workflow)

---

## Documentation Strategy

### Documentation Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCUMENTATION STRUCTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  plan-reference/          docs/                   Code          │
│  ────────────────         ──────                 ──────         │
│  │ PRD                   │ getting-started     │ Implementation│
│  │ ROADMAP               │ architecture         │ follows docs  │
│  │ UI-UX-DESIGN          │ api-reference        │               │
│  │ BACKEND-FIRST         │ deployment          │               │
│  │ STRATEGY              │ ...                 │               │
│  │ STATUS                │                     │               │
│  └───────────────────────┴─────────────────────┴───────────────│
│           ↑                        ↑                              │
│           └──────── Source of Truth ───────────────────────────┘
│                   (All docs derive from here)
└─────────────────────────────────────────────────────────────────┘
```

### Publication Decision

**Status:** `plan-reference/` akan di-publish

**Rationale:**

- Transparency untuk community open-source
- AI agents membutuhkan akses ke planning documents
- Contributors bisa memahami vision dan direction
- AGPL-3.0 license mengharuskan openness

**Categorization:**

| Folder                  | Access      | Purpose                               | Audience                            |
| ----------------------- | ----------- | ------------------------------------- | ----------------------------------- |
| `plan-reference/`       | **Public**  | Internal planning, patterns, strategy | Developers, AI Agents, Contributors |
| `plan-reference/.notes` | **Private** | SaaS PRD (secret)                     | Internal only                       |
| `docs/`                 | **Public**  | User-facing documentation             | End users, Deployers                |

---

## Sync Mechanism

### Overview

Documentation harus tetap sinkron dengan implementation. Berikut adalah mechanism yang direkomendasikan:

### 1. Schema Synchronization (Automated)

**Problem:** Database schema berubah tapi documentation tidak update

**Solution:** Generate schema docs dari Drizzle

```typescript
// scripts/generate-schema-docs.ts
import { schema } from '@sambung-chat/db';
import { writeFile } from 'fs/promises';

async function generateSchemaDocs() {
  const tables = Object.keys(schema).map((key) => {
    const table = schema[key];
    return {
      name: key,
      columns: table[Symbol.for('drizzle:columns')],
    };
  });

  const markdown = generateMarkdown(tables);
  await writeFile('docs/DATABASE.md', markdown);
}

generateSchemaDocs();
```

**Add to package.json:**

```json
{
  "scripts": {
    "docs:generate": "bun run scripts/generate-schema-docs.ts"
  }
}
```

### 2. API Reference Synchronization (Semi-Automated)

**Problem:** API endpoints berubah tapi docs tidak update

**Solution:** Generate OpenAPI spec dari ORPC + status tracking

```typescript
// scripts/generate-api-docs.ts
import { appRouter } from '@sambung-chat/api/routers';
import { generateOpenAPI } from '@orpc/openapi';

// Track implementation status
const implementationStatus = {
  healthCheck: '✅',
  'auth.signIn': '✅',
  'chat.getAll': '⏳',
  // ...
};

async function generateAPIDocs() {
  const spec = await generateOpenAPI(appRouter, {
    title: 'SambungChat API',
    version: '0.1.0',
  });

  // Generate markdown with status badges
  const markdown = generateMarkdownWithStatus(spec, implementationStatus);
  await writeFile('docs/api-reference.md', markdown);
}
```

### 3. Progress Status Synchronization (Manual with Automation)

**Problem:** ROADMAP tidak reflect actual progress

**Solution:** STATUS.md dengan frontmatter yang bisa di-parse

**Format STATUS.md:**

```markdown
# SambungChat Development Status

**Last Updated:** 2026-01-11
**Current Phase:** Week 3-4 (Authentication)
**Overall Progress:** 15%

## Phase 1: MVP Foundation (Weeks 1-12)

### Week 1-2: Repository Setup ✅

- [x] Monorepo structure
- [x] SvelteKit 5 + Hono setup
- [x] Better Auth integration
- [x] Database setup
- [ ] LICENSE file (AGPL-3.0) ⚠️ BLOCKING
- [ ] .github/ templates
- [ ] CI/CD setup ⚠️ BLOCKING

### Week 3-4: Authentication 🔄

- [ ] Complete auth router
- [ ] Login UI
- [ ] Register UI
- [ ] Session management
```

**Automation Script:**

```typescript
// scripts/update-status.ts
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  assignee?: string;
  files?: string[];
}

function checkTaskStatus(task: Task): Task['status'] {
  if (task.files) {
    const allExist = task.files.every((f) => existsSync(f));
    return allExist ? 'completed' : task.status;
  }
  return task.status;
}

// Auto-update STATUS.md based on file existence
function updateStatus() {
  // Read task definitions
  const tasks = readTasks();

  // Check status
  tasks.forEach((task) => {
    task.status = checkTaskStatus(task);
  });

  // Write STATUS.md
  writeStatusMarkdown(tasks);
}
```

### 4. Code Example Synchronization (Manual)

**Pattern:** Code examples di docs harus di-copy dari tested code

**Convention:**

```svelte
<!-- docs/examples/ChatInterface.svelte -->
<!--
  SOURCE: apps/web/src/routes/chat/[id]/+page.svelte
  LAST_SYNCED: 2026-01-11
  STATUS: ✅ Tested
-->
<script>
  // Actual working code from implementation
</script>
```

---

## Roadmap Tracking

### Local-First Progress Tracking

Tanpa GitHub, gunakan file-based system:

#### File Structure

```
plan-reference/
├── ROADMAP.md              # Public roadmap (milestones)
├── STATUS.md               # Progress summary (auto-generated)
├── .status/
│   ├── config.json         # Task definitions
│   ├── week-01.json        # Per-week detailed tasks
│   ├── week-02.json
│   └── ...
└── scripts/
    └── update-status.ts    # Status update script
```

#### Task Definition Format

**File:** `.status/config.json`

```json
{
  "project": "SambungChat",
  "version": "0.1.0",
  "phases": [
    {
      "id": "phase-1",
      "name": "MVP Foundation",
      "weeks": 12,
      "tasks": [
        {
          "id": "license",
          "title": "Add LICENSE file (AGPL-3.0)",
          "week": 1,
          "priority": "P0",
          "status": "pending",
          "files": ["LICENSE"],
          "blocked": false,
          "description": "Add AGPL-3.0 LICENSE to root directory"
        },
        {
          "id": "ci-cd",
          "title": "Setup CI/CD GitHub Actions",
          "week": 1,
          "priority": "P0",
          "status": "pending",
          "files": [".github/workflows/ci.yml"],
          "blocked": false,
          "description": "Setup type checking and linting workflows"
        }
      ]
    }
  ]
}
```

#### Weekly Status Format

**File:** `.status/week-01.json`

```json
{
  "week": 1,
  "startDate": "2026-01-06",
  "endDate": "2026-01-12",
  "status": "in-progress",
  "tasks": [
    {
      "id": "monorepo-setup",
      "title": "Initialize monorepo structure",
      "status": "completed",
      "completedAt": "2026-01-06"
    },
    {
      "id": "tech-stack",
      "title": "Setup SvelteKit 5 + Hono + Drizzle",
      "status": "completed",
      "completedAt": "2026-01-07"
    },
    {
      "id": "license",
      "title": "Add LICENSE file (AGPL-3.0)",
      "status": "pending",
      "blocked": true,
      "blockReason": "Waiting for legal review"
    }
  ],
  "notes": ["Infrastructure setup ahead of schedule", "Blocked on LICENSE file - need legal review"]
}
```

#### Status Update Commands

```bash
# Update status based on file system
bun run scripts/update-status.ts

# Generate STATUS.md from config
bun run scripts/generate-status-md.ts

# Check what's pending
bun run scripts/status:pending.ts

# Check what's blocked
bun run scripts/status:blocked.ts
```

---

## Development Workflow

### Standard Workflow

```
1. Planning → 2. Implementation → 3. Documentation Update → 4. Status Update
```

#### Step 1: Planning

1. Check `STATUS.md` untuk current priorities
2. Check `.status/week-XX.json` untuk detailed tasks
3. Identify blockers

#### Step 2: Implementation

1. Create/modify files sesuai task
2. Run `bun run check-types`
3. Test changes locally
4. Commit dengan conventional commits

#### Step 3: Documentation Update

```bash
# After implementing feature, run:
bun run docs:generate      # Generate schema/API docs
bun run status:update      # Update STATUS.md
```

#### Step 4: Verification

```bash
# Verify everything is in sync
bun run check:sync        # Check docs vs implementation
```

### Sync Check Script

**File:** `scripts/check-sync.ts`

```typescript
import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';

interface DocEntry {
  file: string;
  mentioned: string[];
}

interface ImplementationStatus {
  file: string;
  exists: boolean;
}

async function checkSync() {
  // 1. Check schema sync
  const dbSchema = readSchemaFromDrizzle();
  const docSchema = readSchemaFromDocs();
  const schemaDiff = compareSchemas(dbSchema, docSchema);

  if (schemaDiff.length > 0) {
    console.warn('⚠️  Schema out of sync:');
    schemaDiff.forEach((d) => console.warn(`  - ${d}`));
  }

  // 2. Check API endpoints
  const apiEndpoints = getEndpointsFromORPC();
  const docEndpoints = getEndpointsFromDocs();
  const apiDiff = compareAPI(apiEndpoints, docEndpoints);

  if (apiDiff.missing.length > 0) {
    console.warn('⚠️  Missing API documentation:');
    apiDiff.missing.forEach((e) => console.warn(`  - ${e}`));
  }

  // 3. Check component mentions
  const components = await glob('packages/ui/src/components/**/*.svelte');
  components.forEach((comp) => {
    if (!isDocumented(comp)) {
      console.info(`ℹ️  Component not documented: ${comp}`);
    }
  });

  // Exit with error if critical sync issues
  if (schemaDiff.length > 0 || apiDiff.critical) {
    process.exit(1);
  }
}

checkSync();
```

---

## Implementation Priority Matrix

### P0 - Critical Blockers

| Task                       | Impact           | Effort | Dependencies |
| -------------------------- | ---------------- | ------ | ------------ |
| Add LICENSE file           | Legal compliance | Low    | None         |
| Setup CI/CD                | Quality gates    | Medium | None         |
| Fix HEADER export conflict | Build breaks     | Low    | None ✅      |

### P1 - High Priority

| Task                    | Impact       | Effort | Dependencies |
| ----------------------- | ------------ | ------ | ------------ |
| Complete auth router    | Core feature | Medium | None         |
| Build auth UI           | User facing  | Medium | Auth router  |
| Update ROADMAP progress | Visibility   | Low    | None         |

### P2 - Medium Priority

| Task               | Impact       | Effort | Dependencies |
| ------------------ | ------------ | ------ | ------------ |
| Chat router        | Core feature | High   | Auth         |
| Message streaming  | Core feature | High   | Chat router  |
| API key management | Security     | Medium | Auth         |

---

## Quick Reference Commands

```bash
# Documentation
bun run docs:generate       # Generate all docs from code
bun run docs:schema         # Generate schema docs
bun run docs:api            # Generate API reference

# Status Tracking
bun run status:update       # Update STATUS.md from config
bun run status:pending      # Show pending tasks
bun run status:blocked      # Show blocked tasks
bun run status:week 1       # Show specific week status

# Sync Verification
bun run check:sync          # Verify docs vs code sync
bun run check:types         # TypeScript type check
bun run check:lint          # Lint check

# Development
bun run dev                 # Start all services
bun run dev:web             # Start frontend only
bun run dev:server          # Start backend only
bun run db:studio           # Open database GUI
```

---

## Related Documents

- [ROADMAP](./ROADMAP.md) - Development timeline
- [STATUS](./STATUS.md) - Current progress
- [PRD-OpenSource](./PRD-OpenSource.md) - Product requirements
- [UI-UX-DESIGN](./UI-UX-DESIGN.md) - Design specifications
- [BACKEND-FIRST-DEVELOPMENT](./BACKEND-FIRST-DEVELOPMENT.md) - Implementation guide

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
