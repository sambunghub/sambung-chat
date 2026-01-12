# SambungChat Documentation

Welcome to the SambungChat documentation! This hub provides comprehensive guides for integrating AI providers, extending functionality, troubleshooting issues, and contributing to the project.

## Quick Links

| Document                                                            | Description                            |
| ------------------------------------------------------------------- | -------------------------------------- |
| [AI Provider Integration Guide](./ai-provider-integration-guide.md) | Complete guide for adding AI providers |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)                          | Common issues and solutions            |
| [UI-PACKAGE-GUIDE.md](./UI-PACKAGE-GUIDE.md)                        | UI package development guide           |
| [Architecture](./architecture.md)                                   | System architecture with diagrams      |

---

## AI Provider Integration

### AI Provider Integration Guide

**[AI Provider Integration Guide](./ai-provider-integration-guide.md)** - _Complete Guide_

The comprehensive guide for adding new AI providers to SambungChat. Covers everything from basic setup to advanced multi-provider patterns.

- **What's Inside:**
  - Step-by-step integration workflow
  - Provider-specific configurations (OpenAI, Anthropic, Google, Groq, Ollama)
  - Environment variable patterns and best practices
  - Testing procedures and validation
  - Troubleshooting common issues
  - Multi-provider setup and optimization

- **Who Should Read This:**
  - Contributors adding new AI providers
  - Developers extending AI functionality
  - DevOps engineers configuring AI environments

**📖 [Read the Guide →](./ai-provider-integration-guide.md)**

### Quick Start Guides

#### OpenAI Integration

Get started with OpenAI's GPT models (GPT-4o, GPT-4o-mini, o1-series).

- **Example:** [examples/openai-integration/](../examples/openai-integration/)
- **Best For:** General-purpose AI, vision tasks, coding assistance
- **Cost:** Low-Medium
- **Speed:** Fast (~500ms to first token)

#### Anthropic Integration

Integrate Anthropic's Claude models with extended context windows.

- **Example:** [examples/anthropic-integration/](../examples/anthropic-integration/)
- **Best For:** Complex reasoning, long conversations, analysis
- **Cost:** Medium-High
- **Special Feature:** 200K token context window

#### Groq Integration

Ultra-fast inference with Groq's LPU acceleration.

- **Example:** [examples/groq-integration/](../examples/groq-integration/)
- **Best For:** Real-time responses, high-volume applications
- **Cost:** Very Low
- **Special Feature:** 10-20x faster than other providers (~50ms to first token)

#### Ollama Integration

100% local AI with zero API costs.

- **Example:** [examples/ollama-integration/](../examples/ollama-integration/)
- **Best For:** Privacy, offline use, cost optimization
- **Cost:** Free (local inference)
- **Special Feature:** 100+ models, complete data privacy

#### Multi-Provider Integration

Provider abstraction with fallback chains and zero-code switching.

- **Example:** [examples/multi-provider-integration/](../examples/multi-provider-integration/)
- **Best For:** Production reliability, cost optimization, flexibility
- **Features:** Automatic failover, load balancing, cost-based routing

### Testing

**[Test Templates](../examples/test-templates/)**

Comprehensive test templates for validating AI provider integrations.

- **Unit Tests:** Provider initialization, model creation, validation
- **Integration Tests:** API endpoints, streaming responses
- **E2E Tests:** Complete user flows, UI interactions
- **Test Fixtures:** Reusable test data and mocks

**📖 [View Test Templates →](../examples/test-templates/README.md)**

---

## Troubleshooting

**[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - List of common problems found and their solutions:

- Build errors
- Svelte 5 runes issues
- Tailwind CSS v4 compatibility
- Package development guidelines
- Import/export issues
- TypeScript problems

---

## UI Development

**[UI-PACKAGE-GUIDE.md](./UI-PACKAGE-GUIDE.md)** - Complete guide for UI package development:

- Package structure and golden rules
- Creating new components
- Working with styles and CSS variables
- Common patterns
- Export best practices
- Testing locally
- Pre-commit checklist

---

## Project Structure

```
sambung-chat/
├── apps/
│   ├── web/              # Frontend SvelteKit application
│   └── server/           # Backend Hono API server
├── packages/
│   ├── ui/               # UI component library → [UI Guide](./UI-PACKAGE-GUIDE.md)
│   ├── api/              # API routers
│   ├── auth/             # Authentication module
│   ├── db/               # Database schemas
│   ├── env/              # Environment variables
│   └── config/           # Shared configuration
├── docs/                 # Documentation
├── examples/             # AI provider integration examples
├── plan-reference/       # Planning documents
└── scripts/              # Utility scripts
```

---

## Getting Started

### New to AI Provider Integration?

1. **Start Here:** Read the [AI Provider Integration Guide](./ai-provider-integration-guide.md)
2. **Pick a Provider:** Choose from OpenAI, Anthropic, Google, Groq, or Ollama
3. **Try an Example:** Run the corresponding example in the `examples/` directory
4. **Test Thoroughly:** Use the test templates to validate your integration

### Adding a New Provider?

Follow this workflow:

```
1. Research → Read Section 2 of the Integration Guide
2. Plan → Review the provider-specific examples
3. Implement → Follow the Step-by-Step Integration Guide
4. Test → Use test templates and follow testing procedures
5. Deploy → Follow production deployment checklist
```

**📖 [Complete Integration Guide →](./ai-provider-integration-guide.md)**

---

## Provider Comparison

| Provider      | Best For                   | Cost   | Speed      | Context | Local? |
| ------------- | -------------------------- | ------ | ---------- | ------- | ------ |
| **OpenAI**    | General purpose, vision    | 💰💰   | ⚡⚡⚡     | 128K    | ❌     |
| **Anthropic** | Complex reasoning          | 💰💰💰 | ⚡⚡⚡     | 200K    | ❌     |
| **Google**    | Multimodal, cost-effective | 💰     | ⚡⚡⚡     | 1M      | ❌     |
| **Groq**      | Ultra-fast responses       | 💰     | ⚡⚡⚡⚡⚡ | 131K    | ❌     |
| **Ollama**    | Privacy, free              | 💰     | ⚡⚡       | Varies  | ✅     |

**Key:**

- 💰 = Cost (💰 = Very Low, 💰💰💰 = High)
- ⚡ = Speed (⚡ = Medium, ⚡⚡⚡⚡⚡ = Ultra-fast)
- Context = Maximum context window size

---

## Common Commands

### Development

```bash
# Start all development servers
bun run dev

# Start specific app
bun run dev:web      # Frontend only
bun run dev:server   # Backend only
```

### Type Checking

```bash
# Type check entire monorepo
bun run check-types

# Type check specific package
cd packages/ui && bun run check
```

### Database

```bash
# Generate migration
bun run db:generate

# Push schema changes
bun run db:push

# Open database studio
bun run db:studio
```

---

## Environment Variables Quick Reference

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL_ID=gpt-4o-mini

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL_ID=claude-3-5-sonnet-20241022

# Google
GOOGLE_GENERATIVE_AI_API_KEY=...
GOOGLE_MODEL_ID=gemini-2.5-flash

# Groq
GROQ_API_KEY=gsk-...
GROQ_MODEL_ID=llama-3.3-70b-versatile

# Ollama (no API key needed)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_ID=llama3.2
```

---

## Tech Stack

### Frontend

- **Framework**: SvelteKit 5 with Svelte 5 Runes
- **Styling**: TailwindCSS v4
- **UI Components**: shadcn-svelte, Bits UI
- **Icons**: Lucide Svelte
- **State Management**: Svelte 5 runes, TanStack Query
- **API Client**: ORPC

### Backend

- **Framework**: Hono
- **ORM**: Drizzle
- **Database**: PostgreSQL
- **Auth**: Better Auth
- **Validation**: Zod

### Build System

- **Monorepo**: Turborepo
- **Bundler**: Vite
- **Runtime**: Bun
- **Language**: TypeScript 5

---

## Getting Help

If you encounter issues:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common solutions
2. Check [UI-PACKAGE-GUIDE.md](./UI-PACKAGE-GUIDE.md) for UI package issues
3. Read [AI Provider Integration Guide](./ai-provider-integration-guide.md) for AI issues
4. Search existing issues on GitHub
5. Create a new issue with error details and steps to reproduce

---

## Documentation Standards

Our documentation follows these principles:

- ✅ **Comprehensive:** Covers all aspects from setup to deployment
- ✅ **Practical:** Includes real code examples from actual implementations
- ✅ **Tested:** All examples have been validated and tested
- ✅ **Current:** Kept up-to-date with the latest AI SDK versions
- ✅ **Clear:** Written for developers with clear, actionable steps

---

**Last Updated:** 2026-01-12
**Documentation Version:** 2.0
**Maintained By:** SambungChat Team
