# MVP Roadmap & Design Strategy

**Version:** 1.0
**Created:** January 18, 2026
**Status:** Draft
**Target:** v0.1.0 MVP Release

---

## Executive Summary

### Current Status

**Progress:** 42% (28/67 tasks completed)

**Completed:**

- ✅ Monorepo infrastructure (Turborepo + Bun)
- ✅ Authentication system (Better Auth + Keycloak OAuth)
- ✅ Chat backend (75% - streaming, multi-provider, folders)
- ✅ Chat UI (50% - interface, export, search backend)

**In Progress:**

- 🔄 API key management UI
- 🔄 Search UI connection
- 🔄 Folder drag-and-drop

**Target Audience:**

- Primary: Small teams (3-10 users)
- Secondary: Growing teams (11-100 users)
- Future: Enterprise (100+ users)

---

## Competitive Analysis

### Main Competitors

| Platform        | Strengths                                          | Weaknesses                                            | Market Position                  |
| --------------- | -------------------------------------------------- | ----------------------------------------------------- | -------------------------------- |
| **OpenWebUI**   | Pipeline flexibility, Docker-friendly, simple RBAC | Barebones UI, local GPU issues, limited chat features | DevOps-focused users             |
| **LibreChat**   | ChatGPT-like UI, enterprise auth, Artifacts        | No RBAC UI, heavier deployment, outdated plugins      | Teams wanting ChatGPT experience |
| **AnythingLLM** | Document Q&A, RAG-first, agent builder             | Overkill for simple chats, SQLite limits              | Knowledge base focus             |
| **LobeChat**    | Modern UX, voice chat, mobile-first                | Smaller community, complex setup                      | UX-conscious users               |
| **BionicGPT**   | Enterprise RBAC, multi-tenant                      | Most complex deployment, overkill for small teams     | Enterprise-only                  |

---

## Tiered Feature Roadmap

### Tier 1: Complete Basic Foundation (Weeks 1-2)

#### 1.1 Search UI Connection

- ✅ Backend API ready (`orpc.chat.search`)
- ⏳ Connect search input to API
- ⏳ Add debouncing (300ms)
- ⏳ Filter UI: folder dropdown, pinned-only checkbox
- ⏳ Search result highlighting

#### 1.2 Folder UX Polish

- ⏳ Drag-and-drop chats to folders
- ⏳ Folder badge counts (live update)
- ⏳ Auto-collapse empty folders
- ⏳ Folder icons (color-coded)
- ⏳ Bulk move to folder

#### 1.3 Message Edit

- ⏳ Edit user messages after sending
- ⏳ Undo capability (5-second window)
- ⏳ Edit history (show "edited" indicator)
- ⏳ Regenerate AI response after edit

---

### Tier 2: Prompts System (Weeks 3-4)

#### 2.1 Prompt Templates

- ⏳ Save prompts with name and description
- ⏳ Quick insert from sidebar
- ⏳ Prompt categories and tags
- ⏳ Search and filter prompts

#### 2.2 Prompt Variables

- ⏳ `{{variable}}` syntax in templates
- ⏳ Auto-prompt for variables when inserting
- ⏳ Variable validation
- ⏳ Default values support

#### 2.3 Hybrid Marketplace

- ⏳ Built-in marketplace UI
- ⏳ "Featured" section (curated)
- ⏳ "Community" section (GitHub integration)
- ⏳ One-click install from GitHub URL

---

### Tier 3: Simple Agents (Weeks 5-6)

#### 3.1 Agent Builder

- ⏳ System prompt editor
- ⏳ Tool selection
- ⏳ Model configuration per agent
- ⏳ Temperature and settings override

#### 3.2 Agent Sharing

- ⏳ Export agents as JSON
- ⏳ Import agents from URL/file
- ⏳ Fork agents (create copy)
- ⏳ Version tracking

#### 3.3 Community Agents

- ⏳ Featured agents in marketplace
- ⏳ Category filtering
- ⏳ Agent ratings
- ⏳ Usage statistics

---

### Tier 4: Artifacts (Weeks 7-8)

#### 4.1 Code Blocks → Artifacts

- ⏳ Auto-detect code blocks in messages
- ⏳ One-click render to artifact panel
- ⏳ HTML → Shadow DOM render (SANITIZED with DOMPurify)
- ⏳ Mermaid → Diagram render
- ⏳ SVG → Display inline

#### 4.2 Mermaid Diagrams

- ⏳ Detect ```mermaid blocks
- ⏳ Render using mermaid.js
- ⏳ Support: flowcharts, sequence diagrams, gantt charts
- ⏳ Export as SVG/PNG

---

## Positioning Strategy

### Recommended Positioning

> **"SambungChat: The only self-hosted LLM platform built for team collaboration from day one"**

---

## Technical Architecture

### Marketplace Ecosystem (Hybrid Approach)

```
Community Developer → GitHub Repo (JSON) → Submit to Marketplace
                                                  ↓
                                          SambungChat Marketplace
                                                  ↓
                                          User → One-click Install
```

---

## Schema Design

### New Prompts Table

```typescript
export const prompts = pgTable('prompts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateULID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  tags: text('tags').array().notNull().default([]),
  content: text('content').notNull(),
  variables: jsonb('variables').$type<PromptVariable[]>(),
  isPublic: boolean('is_public').default(false),
  sourceUrl: text('source_url'),
  license: text('license'),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### New Agents Table

```typescript
export const agents = pgTable('agents', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateULID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  tags: text('tags').array().notNull().default([]),
  systemPrompt: text('system_prompt').notNull(),
  tools: text('tools').array().notNull().default([]),
  modelId: text('model_id').references(() => models.id),
  settings: jsonb('settings').$type<AgentSettings>(),
  isPublic: boolean('is_public').default(false),
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

---

## Security Considerations

### Artifact Rendering (CRITICAL)

**ALL HTML from AI must be sanitized with DOMPurify!**

```typescript
import DOMPurify from 'dompurify';

function renderArtifact(html: string) {
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload'],
  });
  return clean;
}
```

---

## Category Taxonomy

### Prompt Categories

- WRITING, CODING, PRODUCTIVITY, ANALYSIS, CREATIVE, EDUCATION, BUSINESS, TRANSLATION, OTHER

### Agent Categories

- CODING, DATA, RESEARCH, WRITING, AUTOMATION, ANALYSIS, CREATIVE, PRODUCTIVITY, OTHER

---

## Future Vision (Post-MVP)

### Cost & Usage Analytics

- Cost per model tracking
- Token usage analytics
- Budget alerts
- Team-wide cost breakdown

_See `.notes` file for SaaS/Enterprise features_

---

## Success Metrics

### MVP (v0.1.0) - March 2026

- [ ] 1,000+ GitHub stars
- [ ] 50+ contributors
- [ ] 10,000+ Docker pulls
- [ ] 90%+ test coverage
- [ ] Lighthouse score >90
- [ ] All Tier 1-4 features complete

---

## References

- [docs/index.md](../index.md) - Documentation hub
- [docs/chat-features.md](../chat-features.md) - Current feature status
- [plan-reference/.notes](../plan-reference/.notes) - SaaS/Enterprise features

---

_"SambungChat: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."_
