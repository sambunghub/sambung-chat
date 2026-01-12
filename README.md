# sambung-chat

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines SvelteKit, Hono, ORPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **SvelteKit** - Web framework for building Svelte apps
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Hono** - Lightweight, performant server framework
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system
- **Multi-Provider AI Support** - Integration with multiple AI providers (OpenAI, Anthropic, Google, Groq, Ollama) using AI SDK

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## AI Provider Integration

This project supports multiple AI providers out of the box, making it easy to switch between different AI models or use multiple providers simultaneously. Currently supported providers include:

- **OpenAI** - GPT-4, GPT-4o, GPT-4o-mini, and more
- **Anthropic** - Claude 3.5 Sonnet, Claude 3 Opus, and Haiku
- **Google** - Gemini 2.5 Flash, Gemini Pro, and more
- **Groq** - Ultra-fast inference with Llama, Mixtral, and Groq models
- **Ollama** - Local AI with 100+ open-source models (Llama, Mistral, Gemma, etc.)

### Adding a New AI Provider

We provide a comprehensive integration guide that walks you through adding new AI providers to the project:

📘 **[AI Provider Integration Guide](./docs/ai-provider-integration-guide.md)**

The guide covers:
- Step-by-step integration instructions for any AI provider
- Environment configuration patterns
- Code examples for all major providers
- Testing and troubleshooting procedures
- Best practices for production deployments

### Quick Setup

To configure an AI provider, update your `.env` file with the appropriate API key:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google
GOOGLE_GENERATIVE_AI_API_KEY=...

# Groq
GROQ_API_KEY=gsk_...

# Ollama (local - no API key needed)
OLLAMA_BASE_URL=http://localhost:11434
```

For detailed setup instructions and provider-specific configurations, see the [AI Provider Integration Guide](./docs/ai-provider-integration-guide.md).

## Project Structure

```
sambung-chat/
├── apps/
│   ├── web/         # Frontend application (SvelteKit)
│   └── server/      # Backend API (Hono, ORPC)
├── packages/
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the server
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:studio`: Open database studio UI
