# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.7] - 2026-01-19

### Added

- **OpenAI Provider Integration**: Complete integration of OpenAI provider with support for GPT-4, GPT-4 Turbo, and GPT-3.5 Turbo models ([packages/api/src/routers/ai.ts](packages/api/src/routers/ai.ts:57-320), [apps/server/src/index.ts](apps/server/src/index.ts:127-215))
  - Full chat completion route with proper error handling
  - Server-Sent Events (SSE) streaming for real-time token delivery
  - Comprehensive error handling for 9 error categories (rate limits, authentication, model not found, context exceeded, content policy, invalid requests, network errors, service unavailable, payment errors)
  - API key sanitization to prevent sensitive data leakage in logs
  - Chat history persistence with proper database integration
  - Authentication middleware integration with Better Auth
  - Support for OpenAI-compatible providers with custom base URLs

- **OpenAI Models**: Add database schema and model configuration for OpenAI model family ([packages/db/src/schema/model.ts](packages/db/src/schema/model.ts), [packages/api/src/routers/model.ts](packages/api/src/routers/model.ts))
  - GPT-4 Turbo (gpt-4-turbo, gpt-4-turbo-2024-04-09)
  - GPT-4 (gpt-4, gpt-4-0613)
  - GPT-3.5 Turbo (gpt-3.5-turbo, gpt-3.5-turbo-0125, gpt-3.5-turbo-1106)
  - GPT-4O (gpt-4o, gpt-4o-2024-08-06)
  - Model capabilities tracking (streaming, function calling, vision)
  - Provider configuration with OpenAI-specific settings

- **Frontend Chat Integration**: Add streaming UI components with real-time token display ([apps/web/src/routes/app/chat/+page.svelte](apps/web/src/routes/app/chat/+page.svelte))
  - AI SDK Chat component integration with DefaultChatTransport
  - Streaming state management with visual indicators (animated dots)
  - Stop/abort functionality with AbortController
  - Auto-scroll during streaming responses
  - Error state handling with user-friendly messages
  - Message persistence after streaming completes

- **Model Selector**: Add OpenAI models to model selector dropdown with proper categorization ([apps/web/src/routes/app/chat/+page.svelte](apps/web/src/routes/app/chat/+page.svelte))
  - OpenAI model group with all supported models
  - Model capability indicators (streaming, tools, vision)
  - Dynamic model loading from API

### Changed

- **AI Endpoint Architecture**: Refactor AI endpoint to use AI SDK v6 streaming architecture ([apps/server/src/index.ts](apps/server/src/index.ts:127-215))
  - Migrate from custom streaming to AI SDK's streamText() function
  - Implement toUIMessageStreamResponse() for frontend integration
  - Add devToolsMiddleware for development debugging
  - Unified message format conversion (UI messages to model messages)

### Security

- **API Key Management**: Add database schema for encrypted API key storage ([packages/db/src/schema/api-key.ts](packages/db/src/schema/api-key.ts))
  - apiKeys table with encryptedKey field for AES-256 encryption
  - keyLast4 field for secure display (last 4 characters only)
  - Provider-specific key management (openai, anthropic, google, groq, ollama)
  - User ownership with cascade delete on user removal
  - Note: Encryption implementation pending (infrastructure ready)

### Tested

- **Type Checking**: All packages pass TypeScript type checking with zero errors ([build-progress.txt](.auto-claude/specs/001-complete-openai-provider-integration/build-progress.txt:376-429))
- **Hydration Validation**: SSR hydration validation passes with clean console ([build-progress.txt](.auto-claude/specs/001-complete-openai-provider-integration/build-progress.txt:1-11))
- **Streaming Functionality**: Comprehensive manual testing of streaming with real OpenAI API ([streaming-test-results.md](.auto-claude/specs/001-complete-openai-provider-integration/streaming-test-results.md))
- **Error Handling**: Code review and automated testing of all 9 error categories ([error-handling-verification.md](.auto-claude/specs/001-complete-openai-provider-integration/error-handling-verification.md))
- **Build Verification**: Production build passes with clean console and no hydration issues ([build-progress.txt](.auto-claude/specs/001-complete-openai-provider-integration/build-progress.txt:614-821))

### Technical Notes

- OpenAI provider uses AI SDK v6 with streaming support via Server-Sent Events
- Environment variable configuration: OPENAI_API_KEY, OPENAI_BASE_URL (optional)
- API keys can be stored per-user in database with encryption (infrastructure ready, implementation pending)
- Model configuration supports custom capabilities (streaming, function calling, vision)
- Error handling includes automatic retry logic for transient failures
- Chat history is automatically persisted to database with message-thread relationships

---

### Added

- **OpenAI Provider Streaming**: Verify streaming functionality with real OpenAI API ([.auto-claude/specs/001-complete-openai-provider-integration/streaming-test-results.md](.auto-claude/specs/001-complete-openai-provider-integration/streaming-test-results.md))
  - Confirmed Server-Sent Events (SSE) format working correctly
  - Verified chunked Transfer-Encoding for real-time token delivery
  - Validated AI SDK UI message stream format (x-vercel-ai-ui-message-stream: v1)
  - Tested streaming endpoint with proper headers (Content-Type, Cache-Control, x-accel-buffering)
  - Confirmed frontend Chat component integration with DefaultChatTransport
  - Verified streaming state management and visual indicators (animated dots)
  - Validated stop/abort functionality with AbortController
  - Confirmed message persistence after streaming completes

### Tested

- **Streaming Responses**: Comprehensive testing of OpenAI streaming functionality ([test-streaming-openai.sh](test-streaming-openai.sh))
  - Backend server verified on port 3000
  - Frontend server verified on port 5174
  - Streaming endpoint tested with curl
  - Response headers validated (text/event-stream, chunked, no-cache)
  - SSE format verified (data: prefix, JSON chunks)
  - Real-time token delivery confirmed

---

## [0.0.5] - 2026-01-19

### Added

- **Comprehensive Error Handling**: Add robust error handling for AI provider errors in chat completion routes ([packages/api/src/routers/ai.ts](packages/api/src/routers/ai.ts:140-298))
  - Error pattern constants for rate limits, authentication, model not found, context exceeded, content policy, invalid requests, network errors, service unavailable, and payment errors
  - Type guards for AI SDK error objects with code extraction
  - Error message sanitization to prevent API key leakage in logs
  - Pattern matching helper for case-insensitive error detection
  - Structured error logging with sanitized messages and error codes
  - Actionable user-facing error messages for all common scenarios

---

## [0.0.4] - 2026-01-19

### Fixed

- **TypeScript Errors**: Fix CI build type check failures by adding vitest/globals to server tsconfig ([apps/server/tsconfig.json](apps/server/tsconfig.json:12))
- **Test References**: Remove todo router reference from test (moved to \_example folder) ([apps/server/index.test.ts](apps/server/index.test.ts:52))
- **Unused Variables**: Remove unused 'many' parameter from agentRelations ([packages/db/src/schema/chat.ts](packages/db/src/schema/chat.ts:127))
- **Unit Test Port Mismatches**: Fix test assertions to use correct port 5174 instead of 5173 ([apps/server/index.test.ts](apps/server/index.test.ts:26), [apps/web/src/lib/**tests**/orpc.test.ts](apps/web/src/lib/__tests__/orpc.test.ts:18-25))

---

## [0.0.3] - 2025-01-18

### Added

- **Folder Rename**: Double-click folder name or click pencil icon (hover) to rename folders inline with keyboard support (Enter to save, Escape to cancel)
- **Folder Delete**: Click trash icon (hover) to delete folders with confirmation dialog; chats in deleted folder automatically move to "No Folder"
- **Error Handling**: Add error state with retry button for failed chat loads; prevents infinite retry loops
- **Search Trigger**: Search now only triggers on Enter key press, not per character change
- **Folder Actions UI**: Add pencil and trash icons that appear on folder hover for quick access to rename/delete

### Changed

- **Search Behavior**: Changed from real-time search (per character) to manual trigger (Enter key press) to reduce API calls
- **Filter Auto-trigger**: Folder dropdown and pinned checkbox still trigger auto-search (only search input requires Enter)

### Fixed

- **Infinite Loop**: Fix sidebar blink issue caused by $effect triggering on every state change; now only triggers on actual filter value changes
- **Nested Button Error**: Fix HTML validation error by replacing nested `<button>` with `<div role="button">` for folder action icons
- **Search Debounce**: Removed 300ms auto-debounce; search now requires explicit Enter key press
- **Accessibility Warnings**: Add full keyboard support and ARIA attributes to folder UI
  - All interactive elements have `role="button"` and `tabindex="0"` for keyboard navigation
  - Folder toggle supports Enter/Space key activation
  - Folder rename can be triggered with Enter key on double-click area
  - Folder action icons (pencil/trash) have keyboard handlers and proper `aria-label`
  - Screen reader friendly with descriptive `aria-label` attributes

---

## [0.0.2] - 2025-01-18

### Fixed

- **DropdownMenu Click Issue**: Fixed menu icon not clickable by simplifying Trigger component and removing snippet child pattern
- **SubTrigger**: Simplified SubTrigger to use default icon rendering (no snippet child)

### Documentation

- Added changelog tracking requirement to CLAUDE.md
- Added versioning guidelines (x.y manual, z auto-increment per commit)

---

## [0.0.1] - 2025-01-17

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
  - Document component usage patterns in README.md and agents.md

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
  - Create hierarchical agents.md files for AI agents
    - Root agents.md with JIT index and quick commands
    - packages/ui/agents.md with UI-specific patterns
    - apps/web/agents.md with SvelteKit patterns
    - apps/server/agents.md with Hono patterns
    - packages/api/agents.md with ORPC patterns
    - packages/db/agents.md with Drizzle patterns

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

### Security

- **Critical Security Vulnerabilities Fixed**
  - **Folder Delete Unauthorized Access** - Fixed vulnerability where users could unassign chats from folders they don't own. Added ownership verification before operations and transaction for atomicity ([packages/api/src/routers/folder.ts](packages/api/src/routers/folder.ts:52-71))
  - **AI Endpoint Authentication** - Added authentication requirement to `/ai` endpoint. Previously accessible without auth, now requires valid Better Auth session ([apps/server/src/index.ts](apps/server/src/index.ts:132-141))
  - **AI Endpoint Input Validation** - Added comprehensive input validation including message count limits, role validation, and content size limits ([apps/server/src/index.ts](apps/server/src/index.ts:146-177))
  - **Debug Endpoints Exposure** - Guarded debug endpoints (`/debug/db`, `/debug/auth`, `/debug`) to only respond in development environment ([apps/server/src/index.ts](apps/server/src/index.ts:219-260))

- **Code Review Documentation**
  - Created comprehensive code review document documenting 50+ issues found during security audit ([plan-reference/code-review.md](plan-reference/code-review.md))

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

[0.0.2]: https://github.com/sambunghub/sambung-chat/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/sambunghub/sambung-chat/compare/v0.0.0...v0.0.1
