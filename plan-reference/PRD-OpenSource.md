# SAMBUNG CHAT: Open Source PRD

## Multi-Model LLM Client Platform (AGPL-3.0)

**Version:** 1.0 Draft
**Created:** January 11, 2026
**Last Updated:** January 11, 2026
**Status:** Ready for Development
**License:** AGPL-3.0

---

## 📑 Related Documents

- **[SaaS PRD](./PRD-SaaS.md)** - Commercial SaaS offering built on top of this open source core
- **[Brand Guidelines](#brand-identity-guidelines)** - Shared design system
- **[Technical Architecture](#technical-architecture)** - Core system design

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Requirements Document](#product-requirements-document)
3. [Front-End Design Concepts](#front-end-design-concepts)
4. [Repository Structure](#repository-structure)
5. [Technical Architecture](#technical-architecture)
6. [Development Roadmap](#development-roadmap)
7. [Community & Governance](#community--governance)

---

## Executive Summary

### What is Sambung Chat?

Sambung Chat is an open-source, modern-design LLM client platform that connects multiple AI models (OpenAI GPT, Claude, Gemini, DeepSeek, Groq, Ollama, etc.) into a single unified interface. The name "Sambung" means "connect" in Indonesian, reflecting the core mission of bridging disparate AI models.

### License: AGPL-3.0

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0), which means:

- **Free forever** - No cost to use, modify, or distribute
- **Copyleft** - All modifications must be shared under the same license
- **Network use** - If you run this as a network service, you must provide source code to users
- **Community protection** - Ensures improvements remain open-source for everyone

> **Note:** A commercial SaaS offering ([see SaaS PRD](./PRD-SaaS.md)) is available for users who prefer managed hosting and team collaboration features.

### Core Value Proposition

- **Multi-Model Orchestration**: Switch between any LLM provider without vendor lock-in
- **Open-Source Forever**: AGPL-3.0 license, community-driven development
- **Self-Hosted**: Complete control over your data and infrastructure
- **Developer-Focused**: Type-safe stack (TypeScript), excellent DX, extensible plugin system
- **Modern Tech**: Svelte + ShadCN + Hono + Drizzle + Bull
- **Privacy-First**: No data sent to proprietary servers by default

### Target Audience

| Segment       | Description                                                             |
| ------------- | ----------------------------------------------------------------------- |
| **Primary**   | Developers and technical users who want control over AI model selection |
| **Secondary** | Self-hosting enthusiasts, privacy-conscious users                       |
| **Tertiary**  | AI enthusiasts, researchers, students exploring different models        |

> **Looking for team features?** See our [SaaS offering](./PRD-SaaS.md) for collaboration features.

---

## Product Requirements Document

### 1. Product Overview

#### 1.1 Problem Statement

Users today face friction when switching between different LLM providers:

- Each has proprietary UI (ChatGPT, Claude.ai, Gemini, etc.)
- No unified chat history across models
- Switching requires separate browser tabs/logins
- Limited ability to compare model outputs
- Vendor lock-in concerns (privacy, pricing, availability)

#### 1.2 Solution

Sambung Chat provides a single, unified, self-hosted interface to interact with any LLM provider:

- **User privacy** (self-hostable, local data by default)
- **Cost optimization** (track your API usage across providers)
- **Model flexibility** (A/B test different models)
- **Open-source extensibility** (plugins, custom features)

#### 1.3 Vision Statement

> "Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."

### 2. Core Features (MVP - v0.1.0)

#### 2.1 Multi-Model Chat Interface

**Feature**: Single-user chat with multiple LLM providers

**Requirements**:

- [ ] Support 5+ providers (OpenAI, Anthropic, Google, Groq, Ollama)
- [ ] Model selector dropdown
- [ ] Secure API key storage (encrypted at rest)
- [ ] Fallback mechanism (if model fails, retry with different provider)
- [ ] Visual indicator showing current model + provider
- [ ] Real-time streaming responses

**Acceptance Criteria**:

- Successfully send message to each supported model
- Switch models mid-conversation
- API keys never logged/exposed
- Response time < 30s for most models

#### 2.2 Chat History Management

**Feature**: Persistent local storage of chat conversations

**Requirements**:

- [ ] Create/delete chat sessions
- [ ] Display chat list in sidebar
- [ ] Search chats by title/content
- [ ] Tag/folder organization
- [ ] Export chat as JSON/Markdown/PDF
- [ ] Pin favorite chats

**Technical**:

- PostgreSQL for local chat storage
- Indexed search for quick lookup
- Message metadata (model, tokens, latency, cost)

**Acceptance Criteria**:

- Retrieve 1000+ chats without lag
- Search results within 500ms
- Export formats valid and readable

#### 2.3 Prompt Templates

**Feature**: Library of reusable prompts

**Requirements**:

- [ ] Built-in prompt templates (Summarize, Translate, Code Generation)
- [ ] Save/edit/delete custom prompts
- [ ] Search/filter prompts
- [ ] Share prompts (copy to clipboard, public URL)
- [ ] Community prompts library

**Structure**:

```
Prompt Template:
├─ Name: "Summarize Academic Paper"
├─ Category: "Academic"
├─ Content: "[System prompt]"
├─ Variables: ["{{PAPER_TEXT}}", "{{MAX_WORDS}}"]
└─ IsPublic: true/false
```

#### 2.4 Settings & Preferences

**Feature**: User customization options

**Requirements**:

- [ ] Theme toggle (light/dark mode)
- [ ] Language selection (English, Indonesian)
- [ ] Auto-save settings
- [ ] Sidebar width adjustment
- [ ] Font size adjustment
- [ ] Privacy mode toggle (disable telemetry)

**Acceptance Criteria**:

- Settings persist across sessions
- Theme applies immediately
- No settings lost on refresh

### 3. Phase 2 Features (v0.2-0.3)

#### 3.1 Conversation Branching

- Create alternate conversation paths from any message
- Visual tree representation of branches
- Branch comparison view

#### 3.2 Plugins/Extensions

- Custom function calling support
- Webhook system for external integrations
- Community plugin marketplace

#### 3.3 RAG (Retrieval-Augmented Generation)

- Upload documents (PDF, TXT, Markdown)
- Local knowledge base management
- Semantic search before sending to model

#### 3.4 Analytics Dashboard

- Personal token usage tracking
- Cost breakdown per model/provider
- Model performance comparison
- Usage trends

### 4. Phase 3 Features (v0.4+)

#### 4.1 Enhanced Self-Hosting Features

- One-click deployment (Docker, Kubernetes)
- Performance monitoring & analytics
- Automated backups & restore
- Advanced configuration options
- Multi-instance management
- Upgrade/migration tools

#### 4.2 Mobile App (React Native)

- iOS and Android native clients
- Offline capability
- Push notifications for long-running tasks

#### 4.3 Desktop App (Electron/Tauri)

- macOS, Windows, Linux
- Offline support
- System tray integration

---

## Front-End Design Concepts

### Design System

#### Color Palette

| Color          | Hex       | Usage                         |
| -------------- | --------- | ----------------------------- |
| **Primary**    | `#208B8D` | Buttons, links, active states |
| **Accent**     | `#E67E50` | Highlights, success states    |
| **Text**       | `#1A1D23` | Primary text                  |
| **Background** | `#FAFAF9` | Main background               |
| **Border**     | `#D1D5DB` | Borders, dividers             |

**Dark Mode:**

- Primary: `#2FB3B6`
- Accent: `#F18D64`
- Background: `#111827`
- Text: `#F9FAFB`

#### Typography

- **Primary Font**: Inter or Geist
- **Monospace**: Fira Code
- **Scale**: 48px/36px/28px/16px/14px
- **Weights**: 400/500/600/700

#### Component Library

Built with [ShadCN Svelte](https://www.shadcn-svelte.com/):

- Button, Input, Card, Modal components
- Fully accessible (WCAG 2.1 AA)
- Responsive design (mobile-first)

---

## Repository Structure

### GitHub Organization: @sambung

**Website:** sambung.dev
**License:** AGPL-3.0

### Core Repositories

```
@sambung organization
├─ sambung-chat/              FLAGSHIP - Main LLM client (AGPL-3.0)
│  ├─ src/                    (Svelte frontend)
│  ├─ server/                 (Hono backend)
│  ├─ README.md
│  └─ LICENSE (AGPL-3.0)
│
├─ sambung-docs/              Documentation (Docusaurus)
│  ├─ docs/
│  └─ README.md
│
├─ sambung-ui/                Component library (AGPL-3.0)
│  ├─ src/components/
│  └─ LICENSE (AGPL-3.0)
│
├─ sambung-sdk/               Integration SDK (AGPL-3.0)
│  ├─ python/
│  ├─ node/
│  └─ LICENSE (AGPL-3.0)
│
├─ sambung-deploy/            Deployment tools (AGPL-3.0)
│  ├─ docker/
│  ├─ kubernetes/
│  └─ LICENSE (AGPL-3.0)
│
├─ sambung-plugins/           Plugin marketplace
│  ├─ plugins/
│  └─ LICENSE (AGPL-3.0)
│
└─ .github/                   Community standards
   ├─ workflows/
   ├─ CODE_OF_CONDUCT.md
   └─ CONTRIBUTING.md
```

> **Note:** The commercial SaaS offering ([sambung-web](./PRD-SaaS.md)) is maintained separately as a proprietary repository.

---

## Technical Architecture

### Tech Stack

| Layer               | Technology                    |
| ------------------- | ----------------------------- |
| **Frontend**        | Svelte + ShadCN + TailwindCSS |
| **Build**           | Vite                          |
| **Backend**         | Hono (TypeScript)             |
| **Database**        | PostgreSQL + Drizzle ORM      |
| **Auth**            | Better Auth (local)           |
| **Job Queue**       | Bull/BullMQ + Redis           |
| **Caching**         | Redis                         |
| **LLM Integration** | LiteLLM                       |

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│ Client Layer (Svelte + ShadCN)          │
│  ─ Single-user chat interface           │
└────────────┬────────────────────────────┘
             │ HTTP/HTTPS
┌────────────▼────────────────────────────┐
│ API Layer (Hono)                        │
│  ─ /api/chats, /api/messages            │
│  ─ /api/models, /api/providers          │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
┌───▼───────┐ ┌───────▼────────┐
│ Database  │ │ Job Queue      │
│ PostgreSQL│ │ (Bull + Redis) │
│ + Drizzle │ │                │
└───────────┘ └────────────────┘
│
└─ Redis (Cache)

┌─────────────────────────────────┐
│ External LLM Providers (LiteLLM)│
│ OpenAI, Anthropic, Google, etc. │
└─────────────────────────────────┘
```

### Database Schema (Core Tables)

```sql
-- Users (local)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Chats (single-user)
CREATE TABLE chats (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  pinned TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  model TEXT,
  provider TEXT,
  metadata JSONB,  -- { tokens, latency_ms, cost_usd }
  created_at TIMESTAMP DEFAULT now()
);

-- API Keys (encrypted)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Prompts
CREATE TABLE prompts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),  -- NULL for public
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

---

## Development Roadmap

### Timeline Overview

```
Q1 2026 (Jan-Mar): MVP Launch
├─ Week 1-4: Infrastructure setup
├─ Week 5-8: Core features
├─ Week 9-10: Polish & testing
└─ Week 11-12: v0.1.0 release

Q2 2026 (Apr-Jun): Ecosystem Expansion
├─ Extract UI library (@sambung/ui)
├─ Build SDK (@sambung/sdk)
├─ Plugin system v1
└─ v0.2.0 release

Q3 2026 (Jul-Sep): Advanced Features
├─ Conversation branching
├─ RAG (basic knowledge base)
├─ Analytics dashboard
└─ v0.3.0 release

Q4 2026 (Oct-Dec): Enterprise & Scalability
├─ Enhanced self-hosting & deployment tools
├─ Audit logging
├─ Security hardening
└─ v0.4.0 release

2027+: Scale & Community Growth
├─ Enhanced deployment tools
├─ Mobile app (React Native)
├─ Desktop app (Electron)
├─ Community support programs
└─ v1.0.0 stable release
```

### Phase 1: MVP (Weeks 1-12)

**Goals:**

- [ ] Fully functional multi-model LLM client
- [ ] GitHub community (1K+ stars)
- [ ] Documentation complete
- [ ] Production-ready self-hosting

**Features:**

- [ ] Multi-provider support (5+ providers)
- [ ] Chat history & search
- [ ] Prompt templates
- [ ] Settings & preferences
- [ ] Export chats
- [ ] Dark mode
- [ ] Responsive design
- [ ] API key management

**Quality:**

- [ ] 90%+ test coverage
- [ ] Performance targets met
- [ ] Security audit
- [ ] Accessibility audit (WCAG AA)

### Phase 2: Ecosystem (Weeks 13-24)

**Goals:**

- [ ] Extract reusable libraries
- [ ] SDK for integration
- [ ] Plugin system foundation
- [ ] Community contributions

**Features:**

- [ ] @sambung/ui library published
- [ ] @sambung/sdk (Python + Node)
- [ ] Plugin marketplace structure
- [ ] CLI tool
- [ ] Webhook support

### Phase 3: Advanced Features (Weeks 25-36)

**Goals:**

- [ ] Advanced chat features
- [ ] Knowledge base support
- [ ] Analytics
- [ ] Thought leadership

**Features:**

- [ ] Conversation branching
- [ ] File uploads (basic RAG)
- [ ] Cost tracking dashboard
- [ ] Model performance analytics
- [ ] Advanced prompting guides

### Phase 4: Enterprise & Scalability (Weeks 37-48)

**Goals:**

- [ ] Enterprise-grade security
- [ ] Enhanced deployment options
- [ ] Community support programs
- [ ] Performance & scalability improvements

**Features:**

- [ ] Audit logging
- [ ] Advanced security hardening
- [ ] Advanced self-hosting tools
- [ ] Scalability optimizations
- [ ] Enterprise deployment guides

> **Need team collaboration?** The SaaS offering ([sambung-web](./PRD-SaaS.md)) provides team workspaces, role-based access, and SSO authentication.

---

## Community & Governance

### Open Governance Model

- **Transparent Development**: All discussions in public GitHub issues/PRs
- **Community Leadership**: Core maintainers elected by contributors
- **Contributor Recognition**: Active contributors get commit access
- **Annual Summit**: Virtual community meetup

### Contributing

See [CONTRIBUTING.md](../.github/CONTRIBUTING.md) for:

- Code of conduct
- Development setup
- PR guidelines
- Release process

### Support Channels

| Channel                | Purpose                          |
| ---------------------- | -------------------------------- |
| **GitHub Issues**      | Bug reports, feature requests    |
| **GitHub Discussions** | General questions, ideas         |
| **Discord**            | Real-time chat, community        |
| **Documentation**      | Guides, tutorials, API reference |

---

## Commercial SaaS Offering

For users who prefer:

- Managed hosting (no self-hosting required)
- Team collaboration features
- Enterprise support (SLA)
- SSO/SAML authentication

**Check out [Sambung Cloud SaaS](./PRD-SaaS.md)** - a commercial service built on top of this open source core.

The SaaS offering:

- ✅ Uses this open source core as a dependency
- ✅ Provides proprietary features (team workspaces, RBAC)
- ✅ Offers managed hosting and support
- ✅ Complies with AGPL-3.0 (source code available)

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

### Key Points:

1. **Free to Use**: No cost for any purpose
2. **Free to Modify**: You can change the source code
3. **Share Alike**: Modifications must be released under AGPL-3.0
4. **Network Use**: If you run this as a network service, users must have access to the source code
5. **No Warranty**: Use at your own risk

### Using Sambung in Your SaaS?

If you want to build a SaaS service using Sambung Chat:

1. **No Modifications Required**: Use the core as-is, just link to the source
2. **With Modifications**: Share your modifications under AGPL-3.0
3. **Commercial SaaS**: See [Sambaung Cloud SaaS](./PRD-SaaS.md) for our offering

For the full license text, see [LICENSE](../LICENSE).

---

**End of Open Source PRD**

_"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."_
