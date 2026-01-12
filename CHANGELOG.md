# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **AI Provider Integration**
  - Add comprehensive multi-provider AI support (OpenAI, Anthropic, Google, Groq, Ollama)
  - Add AI Provider Integration Guide ([docs/ai-provider-integration-guide.md](docs/ai-provider-integration-guide.md))
  - Add provider validation with automatic fallback chains
  - Add support for custom base URLs and provider-specific configurations

- **Architecture Documentation**
  - Add comprehensive architecture documentation with 35+ Mermaid diagrams ([architecture.md](architecture.md))
  - Add diagrams directory for architecture visualization assets
  - Document authentication flow, AI provider abstraction, and component relationships

- **CI/CD Improvements**
  - Add helpful PR title validation with English error examples
  - Consolidate duplicate CI workflows (pr.yml merged into ci.yml)
  - Add sequential job dependencies (type-check → lint → build)

- **UI Package with shadcn-svelte Integration**
  - Integrate shadcn-svelte component library into monorepo
  - Add bits-ui, @lucide/svelte, tailwind-variants, tw-animate-css dependencies
  - Convert design tokens from HSL to OKLCH format (Teal #208B8D, Orange #E67E50)
  - Create core UI components: Button, Input, Textarea, Card components
  - Create Header component with navigation and authentication state
  - Set up Tailwind configuration for component library
  - Configure @sveltejs/package for building UI package

- **Authentication Components**
  - Move and enhance SignInForm and SignUpForm components to packages/ui
  - Add UserMenu component with dropdown navigation
  - Integrate authentication state management across all pages

- **Design System**
  - Create design tokens package (colors, borders, spacing, typography)
  - Establish base CSS styles and Tailwind integration
  - Document component usage patterns in README.md and AGENTS.md

- **Comprehensive Documentation Suite**
  - **Testing Guide** ([docs/TESTING.md](docs/TESTING.md))
    - Complete testing strategy with Vitest, integration tests, and Playwright E2E
    - Test structure and organization guidelines
    - Coverage requirements: 80% backend, 70% frontend
    - Factory pattern for test data
    - Mock database utilities for integration tests

  - **Database Documentation** ([docs/DATABASE.md](docs/DATABASE.md))
    - Complete schema documentation for all tables
    - Entity Relationship Diagram (ERD)
    - Migration guide with Drizzle ORM
    - Command reference for database operations
    - Drizzle Studio setup
    - Backup and restore procedures

  - **Environment Configuration** ([docs/ENVIRONMENT.md](docs/ENVIRONMENT.md))
    - Complete environment variable reference
    - Server and client environment setup
    - Security best practices
    - Environment-specific configs (dev, prod, test)
    - Docker environment configuration

  - **Contributing Guide** ([.github/CONTRIBUTING.md](.github/CONTRIBUTING.md))
    - Development workflow guidelines
    - Backend-first approach explanation
    - Coding standards (TypeScript, Svelte 5, ORPC)
    - Testing requirements
    - Commit guidelines (Conventional Commits)
    - Pull request process and template

- **Backend-First Development Plan**
  - Add comprehensive backend-first development workflow documentation
  - Define API-driven development approach
  - Outline database schema and ORPC integration patterns
  - Testing strategy with unit, integration, and E2E tests
  - Module breakdown for chat, message, prompt, and API key management

- **UI/UX Design Updates**
  - Update layout specifications with Navigation Rail (64px) + Secondary Sidebar (280px) pattern
  - Add responsive behavior for desktop, tablet, and mobile
  - Component hierarchy aligned with backend modules

- **Project Documentation**
  - Add comprehensive project documentation
  - Document API reference with implementation status
  - Add important notices and development guidelines
  - ORPC implementation reference guide

- **Documentation**
  - Add comprehensive troubleshooting guide (TROUBLESHOOTING.md)
  - Add UI package development guide (UI-PACKAGE-GUIDE.md)
  - Create hierarchical AGENTS.md files for AI agents
    - Root AGENTS.md with JIT index and quick commands
    - packages/ui/AGENTS.md with UI-specific patterns
    - apps/web/AGENTS.md with SvelteKit patterns
    - apps/server/AGENTS.md with Hono patterns
    - packages/api/AGENTS.md with ORPC patterns
    - packages/db/AGENTS.md with Drizzle patterns

- **Status Tracking**
  - Implement file-based progress tracking system
  - Add STATUS.md with auto-generated progress from .status/config.json
  - Create scripts for status management (update, pending, blocked)
  - Track 59 tasks across 12 weeks of development

- **Code Quality & Developer Experience**
  - Set up ESLint with TypeScript and Svelte support
  - Set up Prettier with Svelte plugin for consistent formatting
  - Set up Husky pre-commit hooks with lint-staged
  - Add lint and format scripts to package.json
  - Configure automated code formatting on commit

- **License**
  - Add AGPL-3.0 license for open-source compliance

### Changed

- **Environment Variables**
  - Replace $env/dynamic/public with $env/static/public for better build optimization
  - Add PUBLIC_SERVER_URL to CI build environment variables

- **Documentation Structure**
  - plan-reference/ established as source of truth for project planning
  - docs/ for public-facing documentation
  - Implement sync mechanism between plan-reference and docs

- **Developer Workflow**
  - Pre-commit hooks now mandatory - code must pass linting before commit
  - TypeScript check required before build (bun run check + npx svelte-check)
  - Auto-formatting applied to all committed files

- **Monorepo Configuration**
  - Update apps/web/vite.config.ts to consume pre-built UI package from dist
  - Configure ssr.noExternal for proper module resolution in workspace
  - Update svelte.config.js with path aliases for UI package

- **AI Provider Migration**
  - Switch from proprietary AI provider to OpenAI-compatible provider
  - Update ai package configuration for broader compatibility

- **Component Migration**
  - Move Header, SignInForm, SignUpForm, UserMenu components from apps/web to packages/ui
  - Update imports across all pages (+layout.svelte, login, todos, ai)
  - Centralize component management in UI package

### Fixed

- **Husky Pre-commit Hook**
  - Remove deprecated shebang and source lines for Husky v9+ compatibility
  - Fix lint-staged formatting warning for `*.{svelte}` pattern

- **Code Quality**
  - Add ESLint ignores for examples/, test scripts, and report files
  - Add .prettierignore for examples/ directory
  - Fix ESLint no-case-declarations errors in provider-factory.ts

- **Build Errors**
  - Fix lucide-svelte import to use @lucide/svelte package
  - Fix Svelte 5 runes issues (use let instead of const with $state)
  - Replace @apply directives with CSS variables for Tailwind v4 compatibility
  - Fix auth component export path resolution
  - Move auth components to src/lib/components/auth for proper build scope
  - Add tw-animate-css plugin to Tailwind config

- **Module Resolution in Monorepo**
  - Resolve $lib/utils import error during SSR by using svelte-package pre-build approach
  - Fix circular dependency in Header component by using relative imports
  - Configure proper exports in packages/ui/package.json to point to dist files

### Technical Notes

- shadcn-svelte components in src/lib/components/ui/ are managed by CLI - DO NOT EDIT manually
- Use `npx shadcn-svelte add <component>` to add new components
- Run `bun run build` in packages/ui after adding components
- Tailwind content path in apps/web includes packages/ui source for proper style scanning
- Backend-first development approach prioritizes API and database design before UI implementation

[0.0.1]: https://github.com/sambunghub/sambung-chat/compare/v0.0.0...v0.0.1
