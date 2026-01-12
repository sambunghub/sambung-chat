# SambungChat Documentation

Welcome to the SambungChat documentation. This documentation is prepared to help developers contribute to and develop the SambungChat project.

---

## Quick Links

| Document                                     | Description                                      |
| -------------------------------------------- | ------------------------------------------------ |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)   | Troubleshooting guide for common issues          |
| [UI-PACKAGE-GUIDE.md](./UI-PACKAGE-GUIDE.md) | Development guide for `@sambung-chat/ui` package |

---

## Documentation Categories

### Troubleshooting

**[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - List of common problems found and their solutions:

- Build errors
- Svelte 5 runes issues
- Tailwind CSS v4 compatibility
- Package development guidelines
- Import/export issues
- TypeScript problems

### UI Development

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
├── plan-reference/       # Planning documents
└── scripts/              # Utility scripts
```

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- [Node.js](https://nodejs.org/) >= 20.0.0
- PostgreSQL >= 15

### Installation

```bash
# Install dependencies
bun install

# Setup database
bun run db:push

# Start development servers
bun run dev
```

### Build

```bash
# Build entire monorepo
bun run build

# Build specific package
cd packages/ui && bun run build
```

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
bun run check:types

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

## Conventions

### Code Style

- **TypeScript**: Strict mode enabled
- **Components**: PascalCase for components
- **Functions**: camelCase for functions
- **Constants**: UPPER_SNAKE_CASE for constants
- **Files**: kebab-case for file names

### Commit Messages

Using conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### Branch Strategy

- `main` - Production branch
- `develop` - Development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

---

## Getting Help

If you encounter issues:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common solutions
2. Check [UI-PACKAGE-GUIDE.md](./UI-PACKAGE-GUIDE.md) for UI package issues
3. Search existing issues on GitHub
4. Create a new issue with error details and steps to reproduce

---

## Contributing

Before contributing:

1. Read the documentation in this folder
2. Ensure build passes: `bun run build`
3. Ensure type check passes: `bun run check:types`
4. Follow the established conventions
5. Create a pull request with a clear description

---

## License

AGPL-3.0 - See [LICENSE](../LICENSE) file for details
