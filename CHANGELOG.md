# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-01-11

### Added
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

- **Backend-First Development Plan**
  - Add comprehensive backend-first development workflow documentation
  - Define API-driven development approach
  - Outline database schema and ORPC integration patterns

- **Project Documentation**
  - Add comprehensive project documentation
  - Document API reference with implementation status
  - Add important notices and development guidelines

### Changed
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
