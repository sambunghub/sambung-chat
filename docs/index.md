# SambungChat Documentation Index

**Version:** 1.0
**Last Updated:** January 14, 2026
**License:** AGPL-3.0

---

## Overview

This document provides a comprehensive index and navigation map for all SambungChat documentation. Use this to quickly find relevant documentation and understand the relationships between different documents.

---

## Documentation Map

```
docs/
├── INDEX.md (this file)                    # Documentation navigation & index
├── README.md                               # Main documentation hub
│
├── Team & Organization (NEW)
│   ├── teams-concept.md                    # Team model, access control, workspaces
│   ├── routes.md                           # Complete URL structure and routing
│   └── database.md                         # Database tables and relationships
│
├── Architecture & Development
│   ├── architecture.md                     # System architecture with diagrams
│   ├── api-reference.md                    # API endpoint documentation
│   └── getting-started.md                  # Installation & setup guide
│
├── Guides
│   ├── ai-provider-integration-guide.md    # Complete AI provider integration
│   ├── ui-package-guide.md                 # UI package development guide
│   └── deployment.md                       # Deployment guides
│
└── Reference
    ├── ENVIRONMENT.md                      # Environment variables reference
    ├── DOCKER.md                           # Docker configuration
    ├── TESTING.md                          # Testing guidelines
    ├── CI-CD.md                            # CI/CD pipeline and GitHub Actions
    └── troubleshooting.md                  # Common issues and solutions
```

---

## Documents by Category

### 🏢 Team & Organization

**NEW:** Team collaboration and workspace management documentation.

| Document                            | Description                                                                                                                                 | Target Audience                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [Teams Concept](./teams-concept.md) | Team model, access control, personal vs team workspaces, roles and permissions                                                              | Developers implementing team features, Users understanding workspace model |
| [Routes Structure](./routes.md)     | Complete URL structure for personal workspace (`/app/*`), team workspace (`/team/[slug]/*`), public shares (`/p/*`), and admin (`/admin/*`) | Frontend developers, Routing implementation                                |
| [Database Schema](./database.md)    | Database tables including team tables (teams, team_members, team_invites), core tables, relationships, and access patterns                  | Backend developers, Database administrators                                |

---

### 🏗️ Architecture & Development

Core system architecture and API documentation.

| Document                                | Description                                                                                                                             | Target Audience                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [Architecture](./architecture.md)       | System architecture diagrams, technology stack, data flow, authentication flow, deployment architecture                                 | All developers, Technical architects            |
| [API Reference](./api-reference.md)     | Complete API endpoint documentation for ORPC-based routes, including authentication, user, chat, message, prompt, and API key endpoints | Backend developers, API consumers               |
| [Getting Started](./getting-started.md) | Installation guide, development setup, quick start                                                                                      | New contributors, Developers setting up locally |

---

### 📚 Guides

In-depth guides for specific development tasks.

| Document                                                      | Description                                                                              | Target Audience                         |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------- |
| [AI Provider Integration](./ai-provider-integration-guide.md) | Step-by-step guide for adding new AI providers (OpenAI, Anthropic, Google, Groq, Ollama) | Contributors adding AI providers        |
| [UI Package Guide](./ui-package-guide.md)                     | Complete guide for UI package development using shadcn-svelte                            | Frontend developers, UI developers      |
| [Deployment](./deployment.md)                                 | Docker, Kubernetes, and bare metal deployment guides                                     | DevOps engineers, System administrators |

---

### 📖 Reference

Quick reference materials for configuration and troubleshooting.

| Document                                  | Description                                                                    | Target Audience                     |
| ----------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| [Internationalization](./i18n.md)         | Complete i18n guide with svelte-i18n, locale files, and language switching     | All developers, Translators         |
| [Environment Variables](./ENVIRONMENT.md) | Complete list of environment variables with descriptions                       | Developers configuring environments |
| [Docker](./DOCKER.md)                     | Docker configuration and container setup                                       | DevOps engineers, Developers        |
| [Testing](./TESTING.md)                   | Testing guidelines, unit tests, E2E tests                                      | All developers, QA engineers        |
| [CI/CD](./CI-CD.md)                       | GitHub Actions CI pipeline, environment variables, pre-commit hooks            | All developers, AI assistants       |
| [Troubleshooting](./troubleshooting.md)   | Common build errors, Svelte 5 issues, Tailwind CSS problems, TypeScript issues | All developers                      |

---

## Document Relationships

### Core Trilogy (Start Here)

If you're new to SambungChat, start with these three documents:

```
[Getting Started]
       ↓
[Architecture] ←→ [API Reference]
       ↓
[Your Implementation]
```

1. **[Getting Started](./getting-started.md)** - Set up your development environment
2. **[Architecture](./architecture.md)** - Understand the system architecture
3. **[API Reference](./api-reference.md)** - Learn the API endpoints

---

### Team Feature Implementation

For implementing team collaboration features:

```
[Teams Concept] → [Routes] → [Database]
       ↓              ↓          ↓
   [Architecture] ← [API Reference]
       ↓
[Your Team Implementation]
```

1. **[Teams Concept](./teams-concept.md)** - Understand the team model
2. **[Routes](./routes.md)** - Learn the URL structure
3. **[Database](./database.md)** - Review database schema
4. **[Architecture](./architecture.md)** - Understand overall architecture
5. **[API Reference](./api-reference.md)** - See API patterns

---

### AI Provider Integration

For adding new AI providers:

```
[AI Provider Integration Guide]
       ↓
[Architecture] ←→ [API Reference]
       ↓
[Environment Variables]
       ↓
[Your Provider Integration]
```

1. **[AI Provider Integration Guide](./ai-provider-integration-guide.md)** - Follow the step-by-step guide
2. **[Architecture](./architecture.md)** - Understand the AI provider abstraction
3. **[API Reference](./api-reference.md)** - See message streaming implementation
4. **[Environment Variables](./ENVIRONMENT.md)** - Configure provider credentials

---

### UI Development

For developing UI components:

```
[UI Package Guide]
       ↓
[Architecture]
       ↓
[Troubleshooting]
       ↓
[Your UI Implementation]
```

1. **[UI Package Guide](./ui-package-guide.md)** - Learn UI package patterns
2. **[Architecture](./architecture.md)** - Understand frontend architecture
3. **[Troubleshooting](./troubleshooting.md)** - Resolve common UI issues

---

### Deployment

For deploying SambungChat:

```
[Getting Started] → [Deployment]
       ↓               ↓
[Docker] ←→ [Environment Variables]
       ↓
[Architecture]
       ↓
[Your Deployment]
```

1. **[Getting Started](./getting-started.md)** - Set up locally first
2. **[Deployment](./deployment.md)** - Follow deployment guide
3. **[Docker](./DOCKER.md)** - Configure containers
4. **[Environment Variables](./ENVIRONMENT.md)** - Set up production environment
5. **[Architecture](./architecture.md)** - Understand production architecture

---

## Quick Navigation

### I want to...

| Goal                                   | Start Here                                                          | Related Docs                                                                          |
| -------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Set up development environment**     | [Getting Started](./getting-started.md)                             | [Environment Variables](./ENVIRONMENT.md), [Docker](./DOCKER.md)                      |
| **Understand the system architecture** | [Architecture](./architecture.md)                                   | [API Reference](./api-reference.md), [Teams Concept](./teams-concept.md)              |
| **Implement team features**            | [Teams Concept](./teams-concept.md)                                 | [Routes](./routes.md), [Database](./database.md), [API Reference](./api-reference.md) |
| **Add a new AI provider**              | [AI Provider Integration Guide](./ai-provider-integration-guide.md) | [Architecture](./architecture.md), [Environment Variables](./ENVIRONMENT.md)          |
| **Build UI components**                | [UI Package Guide](./ui-package-guide.md)                           | [Architecture](./architecture.md), [Troubleshooting](./troubleshooting.md)            |
| **Deploy to production**               | [Deployment](./deployment.md)                                       | [Docker](./DOCKER.md), [Environment Variables](./ENVIRONMENT.md)                      |
| **Add multi-language support**         | [I18N Guide](./i18n.md)                                             | [Getting Started](./getting-started.md)                                               |
| **Debug build errors**                 | [Troubleshooting](./troubleshooting.md)                             | [UI Package Guide](./ui-package-guide.md), [Architecture](./architecture.md)          |
| **Write tests**                        | [Testing](./TESTING.md)                                             | [Architecture](./architecture.md), [API Reference](./api-reference.md)                |
| **Configure CI/CD**                    | [CI/CD](./CI-CD.md)                                                 | [Testing](./TESTING.md), [Environment Variables](./ENVIRONMENT.md)                    |

---

## Version History

| Version | Date       | Changes                                                     |
| ------- | ---------- | ----------------------------------------------------------- |
| 1.0     | 2026-01-14 | Initial documentation index with team feature documentation |

---

## Planning Documents

For roadmap, status, and implementation planning, see the `plan-reference/` directory:

| Document                                                                    | Description                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------- |
| [Planning Index](../plan-reference/INDEX.md)                                | Navigation for all planning documents                   |
| [Navigation System Design](../plan-reference/navigation-system-design.md)   | NavigationRail + SecondarySidebar design specifications |
| [Navigation System Roadmap](../plan-reference/navigation-system-roadmap.md) | Navigation system implementation plan                   |
| [ROADMAP](../plan-reference/ROADMAP.md)                                     | Overall development timeline and milestones             |
| [STATUS](../plan-reference/STATUS.md)                                       | Current development status and task progress            |
| [PRD-OpenSource](../plan-reference/PRD-OpenSource.md)                       | Open source product requirements                        |
| `.notes` (hidden)                                                           | SaaS/Enterprise features reference (gitignored)         |

---

## Contributing to Documentation

When updating documentation:

1. **Update this index** - If you add or modify documents, update INDEX.md
2. **Cross-reference** - Add "Related Documents" sections to new docs
3. **Keep current** - Update version numbers and last updated dates
4. **Be clear** - Write for developers who may be new to the codebase

---

## Document Standards

All SambungChat documentation should:

- ✅ Use AGPL-3.0 license header
- ✅ Include version number and last updated date
- ✅ Have clear table of contents for long documents
- ✅ Include code examples with syntax highlighting
- ✅ Cross-reference related documents
- ✅ Use markdown link syntax: `[Document Name](./path/to/file.md)`
- ✅ Be written in clear, concise English
- ✅ Include examples where helpful

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
