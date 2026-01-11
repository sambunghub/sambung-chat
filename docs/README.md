# SambungChat Documentation

Selamat datang di dokumentasi SambungChat. Dokumentasi ini disusun untuk membantu developer berkontribusi dan mengembangkan project SambungChat.

---

## Quick Links

| Dokumen                                      | Deskripsi                                       |
| -------------------------------------------- | ----------------------------------------------- |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)   | Panduan troubleshooting masalah umum            |
| [UI-PACKAGE-GUIDE.md](./UI-PACKAGE-GUIDE.md) | Panduan pengembangan `@sambung-chat/ui` package |

---

## Kategori Dokumentasi

### 🚨 Troubleshooting

**[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Daftar masalah umum yang ditemukan dan cara penyelesaiannya:

- Build errors
- Svelte 5 runes issues
- Tailwind CSS v4 compatibility
- Package development guidelines
- Import/export issues
- TypeScript problems

### 🎨 UI Development

**[UI-PACKAGE-GUIDE.md](./UI-PACKAGE-GUIDE.md)** - Panduan lengkap pengembangan UI package:

- Package structure dan golden rules
- Creating new components
- Working with styles dan CSS variables
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

- **Framework**: SvelteKit 5 dengan Svelte 5 Runes
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
- **Components**: PascalCase untuk components
- **Functions**: camelCase untuk functions
- **Constants**: UPPER_SNAKE_CASE untuk constants
- **Files**: kebab-case untuk file names

### Commit Messages

Menggunakan conventional commits:

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

Jika mengalami masalah:

1. Cek [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) untuk solusi umum
2. Cek [UI-PACKAGE-GUIDE.md](./UI-PACKAGE-GUIDE.md) untuk masalah UI package
3. Search existing issues di GitHub
4. Buat issue baru dengan detail error dan steps to reproduce

---

## Contributing

Sebelum berkontribusi:

1. Bacalah dokumentasi di folder ini
2. Pastikan build passes: `bun run build`
3. Pastikan type check passes: `bun run check:types`
4. Ikuti conventions yang sudah ditetapkan
5. Buat pull request dengan description yang jelas

---

## License

AGPL-3.0 - See [LICENSE](../LICENSE) file for details
