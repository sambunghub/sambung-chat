<p align="center">
  <h1 align="center">SambungChat</h1>
  <p align="center">
    <i>Connect any AI model. Self-hosted. Privacy-first. Open-source forever.</i>
  </p>
  <p align="center">
    <a href="https://github.com/sambunghub/sambung-chat/stargazers">
      <img src="https://img.shields.io/github/stars/sambunghub/sambung-chat?style=social" alt="GitHub Stars" />
    </a>
    <a href="https://github.com/sambunghub/sambung-chat/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/sambunghub/sambung-chat" alt="License: AGPL-3.0" />
    </a>
    <a href="https://github.com/sambunghub/sambung-chat/releases">
      <img src="https://img.shields.io/github/v/release/sambunghub/sambung-chat" alt="Latest Release" />
    </a>
  </p>
</p>

---

## About SambungChat

**SambungChat** is an open-source multi-model LLM client platform that puts you in control of your AI interactions. Built with a privacy-first philosophy, SambungChat lets you connect to any AI model while keeping your data secure on your own infrastructure.

### Key Features

- **Multi-Model Support**: Connect to OpenAI, Anthropic, Google, Groq, Ollama, and more
- **Chat History**: Never lose a conversation - full history with search and organization
- **Prompt Templates**: Save and reuse your favorite prompts
- **Self-Hosted**: Deploy on your own infrastructure for complete privacy
- **API Key Management**: Securely store and manage your AI provider keys
- **Modern UI**: Beautiful, responsive interface built with Svelte 5 and shadcn-svelte
- **Type-Safe**: Full-stack TypeScript with end-to-end type safety via ORPC

### Tech Stack

| Layer              | Technology                               |
| ------------------ | ---------------------------------------- |
| **Frontend**       | SvelteKit 5, Svelte 5 Runes, TailwindCSS |
| **UI Components**  | shadcn-svelte, bits-ui, Lucide Icons     |
| **Backend**        | Hono (TypeScript)                        |
| **API Layer**      | ORPC (OpenAPI-compatible RPC)            |
| **Database**       | PostgreSQL + Drizzle ORM                 |
| **Authentication** | Better Auth                              |
| **Validation**     | Zod                                      |
| **Query**          | TanStack Query                           |
| **Runtime**        | Bun                                      |
| **Monorepo**       | Turborepo                                |

---

## Quick Start

### Prerequisites

- **Bun** >= 1.2.23
- **PostgreSQL** >= 15

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/sambunghub/sambung-chat.git
cd sambung-chat
```

2. **Install dependencies**

```bash
bun install
```

3. **Setup environment variables**

```bash
# Copy example env files
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
cp packages/db/.env.example packages/db/.env

# Edit apps/server/.env with your configuration
nano apps/server/.env
```

4. **Start the database**

```bash
bun run db:start
```

5. **Push database schema**

```bash
bun run db:push
```

6. **Run development servers**

```bash
bun run dev
```

**Access the application:**

- Frontend: http://localhost:5173
- API: http://localhost:3000

---

## Project Structure

```
sambung-chat/
├── apps/
│   ├── web/                 # SvelteKit frontend
│   │   └── src/
│   │       ├── routes/      # File-based routing
│   │       └── lib/         # Utilities, ORPC client
│   │
│   └── server/              # Hono backend
│       └── src/
│           └── index.ts     # Hono app + ORPC handler
│
├── packages/
│   ├── api/                 # ORPC routers & procedures
│   ├── auth/                # Better Auth configuration
│   ├── db/                  # Drizzle ORM schema & client
│   ├── ui/                  # shadcn-svelte components
│   ├── env/                 # Environment validation
│   └── config/              # Shared TypeScript configs
│
├── plan-reference/          # Project documentation
│   ├── PRD-OpenSource.md    # Product requirements
│   ├── ROADMAP.md           # Development timeline
│   ├── UI-UX-DESIGN.md      # Frontend design
│   └── AGENTS.md            # AI agent reference
│
├── docs/                    # Public documentation
├── .github/                 # GitHub workflows & templates
├── LICENSE                  # AGPL-3.0 license
└── README.md                # This file
```

---

## Available Scripts

### Development

| Command               | Description                            |
| --------------------- | -------------------------------------- |
| `bun run dev`         | Start all services (web + server + db) |
| `bun run dev:web`     | Start only web application             |
| `bun run dev:server`  | Start only server                      |
| `bun run check-types` | Check TypeScript types                 |

### Build

| Command              | Description              |
| -------------------- | ------------------------ |
| `bun run build`      | Build all applications   |
| `bun run dev:native` | Build and run native app |

### Database

| Command               | Description                 |
| --------------------- | --------------------------- |
| `bun run db:start`    | Start PostgreSQL via Docker |
| `bun run db:stop`     | Stop PostgreSQL             |
| `bun run db:push`     | Push schema to database     |
| `bun run db:studio`   | Open Drizzle Studio UI      |
| `bun run db:generate` | Generate migration files    |
| `bun run db:migrate`  | Run database migrations     |
| `bun run db:down`     | Remove database container   |

---

## Supported AI Providers

| Provider              | Status       | Models                         |
| --------------------- | ------------ | ------------------------------ |
| **OpenAI**            | ✅ Supported | GPT-4, GPT-3.5-turbo           |
| **OpenAI-Compatible** | ✅ Supported | Any OpenAI-compatible endpoint |
| **Anthropic**         | 🚧 Planned   | Claude 3 Opus, Sonnet, Haiku   |
| **Google**            | 🚧 Planned   | Gemini Pro, Ultra              |
| **Groq**              | 🚧 Planned   | Llama 3, Mixtral               |
| **Ollama**            | 🚧 Planned   | Local models                   |

---

## Roadmap

### v0.1.0 - MVP Foundation (Q1 2026)

- [x] Project infrastructure setup
- [x] Authentication & user management
- [ ] Multi-model chat interface
- [ ] Chat history management
- [ ] Prompt templates
- [ ] Settings & preferences

### v0.2.0 - Ecosystem Expansion (Q2 2026)

- [ ] Plugin system
- [ ] SDK development
- [ ] UI library extraction

### v0.3.0 - Advanced Features (Q3 2026)

- [ ] Conversation branching
- [ ] RAG implementation
- [ ] Analytics dashboard

### v1.0.0 - Stable Release (2027)

- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron/Tauri)
- [ ] Enterprise features

See [ROADMAP.md](plan-reference/ROADMAP.md) for full details.

---

## Documentation

| Document                                       | Description                                 |
| ---------------------------------------------- | ------------------------------------------- |
| [PRD](plan-reference/PRD-OpenSource.md)        | Product Requirements Document               |
| [Roadmap](plan-reference/ROADMAP.md)           | Development timeline and milestones         |
| [UI/UX Design](plan-reference/UI-UX-DESIGN.md) | Frontend design system and components       |
| [Agents Reference](plan-reference/AGENTS.md)   | Guide for AI agents working on this project |
| [Getting Started](docs/getting-started.md)     | Detailed setup guide                        |
| [Architecture](docs/architecture.md)           | System architecture overview                |
| [API Reference](docs/api-reference.md)         | API documentation                           |
| [Deployment](docs/deployment.md)               | Deployment guides                           |

---

## Contributing

We welcome contributions from the community! Please read our [Contributing Guide](.github/CONTRIBUTING.md) before submitting pull requests.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/sambung-chat.git

# Install dependencies
bun install

# Create a feature branch
git checkout -b feat/your-feature-name

# Make your changes and commit
git commit -m "feat: add your feature"

# Push to your fork and open a PR
git push origin feat/your-feature-name
```

### Code Style

- Use TypeScript strict mode
- Follow Svelte 5 best practices
- Run `bun run check-types` before committing
- Follow semantic commit messages (see [CONTRIBUTING.md](.github/CONTRIBUTING.md))

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See [LICENSE](LICENSE) for the full license text.

### What AGPL-3.0 Means

- ✅ You can use, modify, and distribute this software freely
- ✅ You must share your modifications under the same license
- ✅ If you run this software as a network service, you must provide source code to users
- ❌ You cannot close-source modifications while offering it as a service

---

## Community

- **GitHub**: [https://github.com/sambunghub/sambung-chat](https://github.com/sambunghub/sambung-chat)
- **Issues**: [https://github.com/sambunghub/sambung-chat/issues](https://github.com/sambunghub/sambung-chat/issues)
- **Discussions**: [https://github.com/sambunghub/sambung-chat/discussions](https://github.com/sambunghub/sambung-chat/discussions)

---

## Acknowledgments

- Built with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack)
- UI components from [shadcn-svelte](https://shadcn-svelte.com)
- Powered by [SvelteKit](https://svelte.dev), [Hono](https://hono.dev), and [ORPC](https://orpc.unnoq.com)

---

<div align="center">
  <b>Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever.</b>
</div>
