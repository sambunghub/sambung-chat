# SAMBUNG CHAT: Development Roadmap

**Version:** 1.1
**Last Updated:** January 12, 2026
**License:** AGPL-3.0

---

## Overview

This roadmap outlines the development milestones for Sambung Chat, an open-source multi-model LLM client platform.

---

## Phase 1: MVP Foundation (Weeks 1-12)

**Target Release:** v0.1.0 - March 2026

### Week 1-2: Repository Setup & Infrastructure

- [x] Initialize monorepo structure (Turborepo + Bun)
- [x] Setup SvelteKit 5 + Hono + Drizzle ORM
- [x] Configure Better Auth
- [x] Database setup (PostgreSQL + Docker Compose)
- [x] Add LICENSE file (AGPL-3.0)
- [x] Create .github/ templates (CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md)
- [x] Setup CI/CD (GitHub Actions with typecheck, lint, build, test)
- [x] Configure ESLint, Prettier, Husky pre-commit hooks
- [x] Docker configuration (dev & production Dockerfiles for server & web)

### Week 3-4: Authentication & User Management

- [x] Complete Better Auth integration (backend configured with email/password)
- [x] User registration/login UI components (SignInForm, SignUpForm exist)
- [ ] Session management implementation
- [ ] Protected routes implementation
- [ ] User profile page

### Week 5-6: Multi-Model Chat Interface

- [ ] Integrate LLM providers (direct API calls):
  - [ ] OpenAI Compatible
  - [ ] OpenAI (GPT-4, GPT-3.5)
  - [ ] Anthropic (Claude)
  - [ ] Google (Gemini)
  - [ ] Groq
  - [ ] Ollama (local models)
- [x] Database schema for chats, messages, and apiKeys
- [x] Basic API routes (chat, message CRUD via ORPC)
- [ ] Model selector dropdown
- [ ] Real-time streaming responses (StreamingText component exists)
- [ ] Error handling & fallback mechanism
- [x] API key database schema (apiKeys table ready)
- [ ] API key management UI (encrypted storage)

### Week 7-8: Chat History Management

- [ ] Create/delete chat sessions
- [ ] Chat list sidebar
- [ ] Search chats by title/content
- [ ] Tag/folder organization
- [ ] Pin favorite chats
- [ ] Export chat (JSON, Markdown)
- [ ] Pagination & infinite scroll

### Week 9: Prompt Templates

- [ ] Built-in templates (Summarize, Translate, Code Gen)
- [x] Database schema for prompts (prompts table ready)
- [ ] Save/edit/delete custom prompts UI
- [ ] Search/filter prompts
- [ ] Variable substitution
- [ ] Community prompts library UI

### Week 10: Settings & Preferences

- [x] Theme provider (ThemeProvider.svelte exists)
- [ ] Settings page UI
- [ ] Language selection (English, Indonesian)
- [ ] Sidebar width adjustment
- [ ] Font size adjustment
- [ ] Privacy mode toggle

### Week 11: Testing & Polish

- [x] Unit test framework configured (Vitest)
- [x] E2E test framework configured (Playwright)
- [ ] Unit tests written
- [ ] E2E tests written
- [ ] Performance optimization
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Security audit
- [ ] Bug fixes

### Week 12: v0.1.0 Release

- [ ] Documentation complete
- [ ] Deployment guides
- [ ] GitHub release
- [ ] Announcement blog post

---

## Phase 2: Ecosystem Expansion (Weeks 13-24)

**Target Release:** v0.2.0 - June 2026

### Week 13-16: UI Library Extraction

- [ ] Extract `@sambung/ui` as standalone package
- [ ] Publish to npm
- [ ] Document component API
- [ ] Storybook setup

### Week 17-20: Plugin System v1

- [ ] Plugin architecture design
- [ ] Webhook system
- [ ] Custom function calling support
- [ ] Plugin marketplace UI
- [ ] Plugin documentation

### Week 21-24: SDK Development

- [ ] `@sambung/sdk` for Node.js
- [ ] `@sambung/sdk` for Python
- [ ] API documentation
- [ ] SDK examples
- [ ] CLI tool

---

## Phase 3: Advanced Features (Weeks 25-36)

**Target Release:** v0.3.0 - September 2026

### Week 25-28: Conversation Branching

- [ ] Create alternate conversation paths
- [ ] Visual tree representation
- [ ] Branch comparison view
- [ ] Merge branches

### Week 29-32: RAG Implementation

- [ ] File upload (PDF, TXT, Markdown)
- [ ] Document parsing
- [ ] Vector embedding storage
- [ ] Semantic search
- [ ] Knowledge base management UI
- [ ] RAG-powered chat responses

### Week 33-36: Analytics Dashboard

- [ ] Personal token usage tracking
- [ ] Cost breakdown per model/provider
- [ ] Model performance comparison
- [ ] Usage trends
- [ ] Export analytics data

---

## Phase 4: Enterprise & Scalability (Weeks 37-48)

**Target Release:** v0.4.0 - December 2026

### Week 37-40: Enhanced Self-Hosting

- [ ] One-click Docker deployment
- [ ] Kubernetes Helm charts
- [ ] Automated backups
- [ ] Restore functionality
- [ ] Multi-instance management
- [ ] Upgrade/migration tools

### Week 41-44: Security Hardening

- [ ] Audit logging
- [ ] Rate limiting
- [ ] Input validation enhancement
- [ ] Dependency scanning (Dependabot)
- [ ] Security headers

### Week 45-48: Performance & Scalability

- [ ] Database optimization
- [ ] Caching strategy (Redis)
- [ ] CDN setup for static assets
- [ ] Load testing
- [ ] Performance monitoring

---

## Phase 5: Platform Expansion (2027+)

**Target Release:** v1.0.0 - 2027

### Mobile App (React Native)

- [ ] iOS app
- [ ] Android app
- [ ] Offline capability
- [ ] Push notifications
- [ ] Sync with self-hosted instance

### Desktop App (Electron/Tauri)

- [ ] macOS app
- [ ] Windows app
- [ ] Linux app
- [ ] Offline support
- [ ] System tray integration
- [ ] Auto-updates

### v1.0.0 Stable Release

- [ ] Feature complete
- [ ] 100% test coverage
- [ ] Production-ready
- [ ] Comprehensive documentation
- [ ] Stable API
- [ ] Long-term support commitment

---

## Success Metrics

### v0.1.0 (MVP)

- [ ] 5+ LLM providers supported
- [ ] 1000+ GitHub stars
- [ ] 50+ contributors
- [ ] 10K+ Docker pulls

### v0.2.0 (Ecosystem)

- [ ] Published `@sambung/ui` package
- [ ] Published `@sambung/sdk` packages
- [ ] 10+ community plugins
- [ ] 5000+ GitHub stars

### v0.3.0 (Advanced)

- [ ] 100K+ Docker pulls
- [ ] 100+ contributors
- [ ] Enterprise-ready

### v1.0.0 (Stable)

- [ ] 1M+ downloads
- [ ] Active community
- [ ] Sustainable governance model
- [ ] Long-term support

---

## Technology Stack

| Layer     | Technology                             |
| --------- | -------------------------------------- |
| Frontend  | Svelte 5 + ShadCN Svelte + TailwindCSS |
| Backend   | Hono (TypeScript) + ORPC               |
| Database  | PostgreSQL + Drizzle ORM               |
| Auth      | Better Auth                            |
| Build     | Vite + Turborepo                       |
| Runtime   | Bun                                    |
| Testing   | Vitest + Playwright                    |
| Container | Docker + Docker Compose                |

---

## Community Goals

- **Transparent Development**: All work in public GitHub issues/PRs
- **Community Leadership**: Core maintainers elected by contributors
- **Contributor Recognition**: Active contributors get commit access
- **Annual Summit**: Virtual community meetup

---

## Related Documents

- [Open Source PRD](./PRD-OpenSource.md) - Full product requirements
- [Contributing Guide](../.github/CONTRIBUTING.md) - How to contribute
- [License](../LICENSE) - AGPL-3.0 license

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
