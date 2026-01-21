# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.14] - 2026-01-21

### Security

- **AI Provider Validation**: Add Zod schema validation for AI provider values from database ([apps/server/src/index.ts](apps/server/src/index.ts:26))
  - Replaces unsafe `as any` cast with proper Zod enum validation
  - Returns 400 error with clear message for invalid provider values

- **Security Headers on Redirects**: Apply security headers to redirect responses by using Response-based redirects ([apps/web/src/hooks.server.ts](apps/web/src/hooks.server.ts:42))
  - Replaces SvelteKit `redirect()` with Response(302) + Location header
  - Ensures security headers are applied to all redirect responses

- **Validated Environment Variables**: Use validated env exports in security headers instead of process.env ([apps/web/src/lib/security/headers.ts](apps/web/src/lib/security/headers.ts:12))
  - Import `env` from `@sambung-chat/env/server` for PUBLIC_API_URL and KEYCLOAK_URL
  - Add try/catch for malformed KEYCLOAK_URL with fallback to empty string

- **Context Security Hardening**: Remove sensitive headers from context type and harden IP extraction ([packages/api/src/context.ts](packages/api/src/context.ts))
  - getClientIp no longer trusts spoofable X-Forwarded-For/X-Real-IP headers
  - Context now returns only `csrfToken` instead of full headers object
  - CSRF middleware updated to use pre-extracted csrfToken

- **Type Safety Improvements**: Add type guard for SameSite values ([packages/env/src/server.ts](packages/env/src/server.ts:251))
  - Removes unsafe `as any` cast with `isSameSite()` type guard function
  - CORS origins now use `url.origin` instead of `url.href` to discard path/query/hash

### Fixed

- **CSRF Test Assertion**: Fix test that incorrectly expected token validation to pass with different secret ([packages/api/src/**tests**/csrf.test.ts](packages/api/src/__tests__/csrf.test.ts:234))
- **Auth Test Module Loading**: Add `vi.resetModules()` before dynamic imports and fix spy types ([packages/auth/**tests**/cookies.test.ts](packages/auth/__tests__/cookies.test.ts:231))
- **Reencrypt Script Enhancements**: Add `--key-id` argument support and use package alias ([scripts/reencrypt-api-keys.ts](scripts/reencrypt-api-keys.ts))
  - Import encryption functions from `@sambung-chat/api/lib/encryption` instead of relative path
  - Support targeting specific API key by ID with `--key-id` argument

### Documentation

- **Standardized Port**: Update documentation to reflect standardized web port 5174 ([docs/security-headers.md](docs/security-headers.md:363))
- **Markdown Formatting**: Fix markdownlint issues in security.md ([docs/security.md](docs/security.md))
  - Hyphenate compound modifiers (CSRF-validation, rate-limiting, CORS-origin)
  - Wrap bare localhost URLs in angle brackets for MD034 compliance
  - Convert bold DO/DON'T labels to proper markdown headings (#### Do/#### Don't)

---

## [0.0.13] - 2026-01-21

### Fixed

- **Unit Test Configuration**: Exclude `.auto-claude/**` directories from vitest to prevent test failures from old worktrees ([vitest.config.ts](vitest.config.ts:42))
- **Auth Test Dynamic Imports**: Fix module resolution in auth tests by using ES module `import()` instead of `require()` ([packages/auth/**tests**/cookies.test.ts](packages/auth/__tests__/cookies.test.ts:231))

---

## [0.0.12] - 2026-01-21

### Added

- **AI Endpoint from Database**: New `/api/ai` endpoint that retrieves model configuration from database ([apps/server/src/index.ts](apps/server/src/index.ts:133))
  - Gets active model for authenticated user from database
  - Retrieves and decrypts API key using existing encryption utility
  - Creates AI provider dynamically based on user's configured model
  - Supports all providers: OpenAI, Anthropic, Google, Groq, Ollama, custom
  - Returns clear error messages when no active model is configured

### Changed

- **AI Endpoint Path**: Move AI endpoint from `/ai` to `/api/ai` for consistency with other API routes
  - Frontend chat pages updated to use new path: `apps/web/src/routes/app/chat/+page.svelte:45`
  - Follows existing pattern: `/api/auth/*` for auth, `/api/ai/*` for AI services

### Removed

- **Debug Logs**: Remove debug console logs from AI router ([packages/api/src/routers/ai.ts](packages/api/src/routers/ai.ts))

---

## [0.0.11] - 2026-01-21

### Fixed

- **AI Provider Validation**: Remove obsolete global AI provider validation ([packages/env/src/server.ts](packages/env/src/server.ts:313))
  - AI providers are now configured per-user in database (models table with apiKeyId references)
  - Environment variables for API keys remain available for backward compatibility but are no longer required
  - Fixes server startup errors when no global AI provider keys are configured

- **CSRF Token Response Parsing**: Fix incorrect ORPC response structure parsing ([apps/web/src/lib/orpc.ts](apps/web/src/lib/orpc.ts:59))
  - Changed response parsing from `data.data` to `data.json` to match ORPC response format
  - ORPC wraps responses in `{ json: { ... } }` format, not `{ data: { ... } }`
  - Fixes "CSRF token is required for this operation" errors when sending messages

---

## [0.0.10] - 2026-01-20

### Fixed

- **Vite Proxy Circular Reference**: Fix ECONNRESET and ENOTFOUND errors by correcting proxy target ([apps/web/vite.config.ts](apps/web/vite.config.ts:56))
  - Changed proxy target from `PUBLIC_API_URL` (port 5174) to backend server (port 3000)
  - Vite proxy now correctly forwards `/rpc` and `/ai` requests to backend server
  - `PUBLIC_API_URL` remains `http://localhost:5174` for client-side same-origin requests
  - Proxy uses `SERVER_PORT` (default: 3000) to connect to backend server
  - Fixes "ECONNRESET" errors when CSRF token fetch times out
  - Fixes "ENOTFOUND localhost" errors on RPC endpoints
  - All RPC routes now work correctly: `/rpc/getCsrfToken`, `/rpc/chat/search`, `/rpc/model/getAll`, etc.

**Technical Details**:

- **Before**: Proxy forwarded to `http://localhost:5174` (itself), creating circular reference
- **After**: Proxy forwards to `http://localhost:3000` (backend server)
- Client-side requests go to `http://localhost:5174/rpc/*` (same-origin)
- Vite proxy forwards to `http://localhost:3000/rpc/*` (backend server)
- This maintains same-origin cookies while avoiding circular proxy

---

## [0.0.9] - 2026-01-20

### Fixed

- **CSRF Token Same-Origin Requests**: Fix CSRF token 500 errors by using dynamic API_URL variable ([apps/web/src/lib/orpc.ts](apps/web/src/lib/orpc.ts:42))
  - Changed `fetchToken()` to use `API_URL` variable instead of `PUBLIC_API_URL` constant
  - Changed `RPCLink` to use `API_URL` variable instead of `PUBLIC_API_URL` constant
  - `API_URL` is dynamically set to `window.location.origin` in browser for same-origin requests
  - This ensures both CSRF token fetch and all RPC requests use the same origin
  - Session cookies are now properly included in all requests to CSRF-protected endpoints
  - Fixes 500 Internal Server Error on `/rpc/model/getAll`, `/rpc/chat/search`, etc.
  - Fixes 403 FORBIDDEN errors caused by missing CSRF tokens in mutation requests

**Technical Details**:

- The `API_URL` variable is set using `getApiUrl()` which returns `window.location.origin` in browser
- This makes all requests same-origin, allowing automatic cookie forwarding
- Both CSRF token fetch and RPC calls now use consistent URL resolution

---

## [0.0.8] - 2026-01-20

### Fixed

- **CSP & Cookie Forwarding**: Fix CSP violations and CSRF errors by using relative paths ([apps/web/src/lib/orpc.ts](apps/web/src/lib/orpc.ts:8))
  - Use relative path `/rpc` for client-side requests instead of absolute URLs
  - This makes requests same-origin, which allows cookies to be sent automatically
  - Fixes CSP violation: "Connecting to 'http://localhost:3000/rpc/\*' violates CSP directive"
  - Fixes 403 CSRF errors caused by missing session cookies in requests
  - Fixes "Failed to construct 'URL': Invalid URL" errors in ORPC client
  - For SSR, still uses full URL from `PUBLIC_API_URL` environment variable
  - Session cookies are now properly sent with all RPC requests

**Technical Details**:

- In browser: Uses relative path (e.g., `/rpc/getCsrfToken`) - same-origin, cookies work
- In SSR: Uses `PUBLIC_API_URL` from env (e.g., `http://localhost:5174`)
- This approach works regardless of which port the web app runs on (5173, 5174, etc.)

---

## [0.0.7] - 2026-01-20

### Fixed

- **SSR Error**: Fix 500 error in sidebar-provider during server-side rendering ([apps/web/src/lib/components/ui/sidebar/sidebar-provider.svelte](apps/web/src/lib/components/ui/sidebar/sidebar-provider.svelte:39))
  - Remove `bind:this={ref}` from server-side rendering branch
  - Element refs don't work during SSR because there's no DOM
  - This fixes `Cannot read properties of null (reading 'function')` error in `push_element`
  - Chat pages now load correctly without hydration errors

---

## [0.0.6] - 2026-01-20

### Fixed

- **RPC Routing**: Fix 404 errors on all RPC endpoints by correcting client-side URL format ([apps/web/src/lib/orpc.ts](apps/web/src/lib/orpc.ts:25))
  - Change `/rpc/app.getCsrfToken` to `/rpc/getCsrfToken` (remove incorrect `app.` prefix)
  - ORPC routes are flat on `appRouter`, not nested under `app` namespace
  - All RPC endpoints now work correctly: `healthCheck`, `getCsrfToken`, `chat`, `message`, `folder`, `model`
  - Simplified server middleware by removing unnecessary manual routing workaround

- **Server RPC Middleware**: Clean up excessive debug logging from RPC middleware ([apps/server/src/index.ts](apps/server/src/index.ts:97))
  - Remove verbose procedure path logging
  - Remove manual routing fallback (RPCHandler works correctly with proper URLs)
  - Keep only error logging for debugging issues

---

## [0.0.5] - 2026-01-20

### Security

- **CSRF Protection**: Implement comprehensive CSRF token validation for all state-changing operations ([packages/api/src/utils/csrf.ts](packages/api/src/utils/csrf.ts:1))
  - Add cryptographically secure token generation with 256-bit entropy
  - Add HMAC-SHA256 signature verification to prevent token tampering
  - Add constant-time comparison to prevent timing attacks
  - Add token expiration with 1-hour default lifetime
  - Add rate limiting (10 req/min) on CSRF token endpoint
  - Apply `withCsrfProtection` middleware to all 10 mutation routes
  - Protected routes: chat (5 mutations), message (2 mutations), folder (3 mutations)

- **SameSite Cookie Hardening**: Update Better Auth configuration with secure defaults ([packages/auth/src/index.ts](packages/auth/src/index.ts:60))
  - Add `SAME_SITE_COOKIE` environment variable with validation
  - Default to `strict` in production for maximum CSRF protection
  - Default to `lax` in development for OAuth-friendly testing
  - Add validation to ensure `none` requires secure cookies
  - Add security warnings for insecure configurations

- **CORS Validation**: Add origin validation and sanitization ([packages/env/src/server.ts](packages/env/src/server.ts:377))
  - Validate CORS_ORIGIN values as properly formatted URLs
  - Reject origins with embedded credentials (username:password@)
  - Only allow http:// and https:// protocols
  - Sanitize origins by removing trailing slashes
  - Warn about wildcard (\*) origins - highly insecure
  - Warn about HTTP and localhost in production
  - Log all allowed CORS origins on startup for transparency

### Added

- **CSRF Token Endpoint**: Add public endpoint to fetch CSRF tokens for authenticated sessions ([packages/api/src/routers/index.ts](packages/api/src/routers/index.ts:1))
  - Endpoint: `GET /rpc/app.getCsrfToken`
  - Returns `{ token, authenticated: true, expiresIn: 3600 }` for authenticated users
  - Returns `{ token: null, authenticated: false }` for unauthenticated users
  - Rate limited to 10 requests per minute per user/IP

- **CSRF Token Manager**: Add automatic CSRF token management in frontend ([apps/web/src/lib/orpc.ts](apps/web/src/lib/orpc.ts:1))
  - In-memory token storage (never stored in localStorage for security)
  - Automatic token fetching on app load
  - Automatic token refresh on 403 Forbidden responses
  - All requests include `X-CSRF-Token` header
  - Prevention of concurrent token fetches with tokenPromise mechanism
  - Graceful handling of unauthenticated users

- **Rate Limiter Utility**: Add in-memory rate limiting to prevent token enumeration ([packages/api/src/utils/rate-limiter.ts](packages/api/src/utils/rate-limiter.ts:1))
  - Automatic cleanup of old entries every 5 minutes
  - Tracks by user ID (authenticated) or IP address (anonymous)
  - Configurable max requests and time window
  - Used by CSRF token endpoint (10 req/min)

- **Environment Validation**: Add validation helpers for security configuration ([packages/env/src/server.ts](packages/env/src/server.ts:1))
  - `getValidatedSameSiteSetting()`: Validate and return SameSite cookie setting
  - `getValidatedCorsOrigins()`: Validate and return array of CORS origins
  - Comprehensive logging and security warnings
  - Environment-aware defaults (production vs development)

### Changed

- **Better Auth Configuration**: Update cookie configuration to use dynamic SameSite setting ([packages/auth/src/index.ts](packages/auth/src/index.ts:60))
  - Replace hardcoded `sameSite: 'lax'` with dynamic `sameSiteSetting` variable
  - Add logging to display current SameSite cookie setting on startup
  - Maintain backward compatibility with existing setups

- **CORS Configuration**: Update server to use validated CORS origins ([apps/server/src/index.ts](apps/server/src/index.ts:1))
  - Replace direct `env.CORS_ORIGIN.split(',')` with `getValidatedCorsOrigins()`
  - Add `X-CSRF-Token` to CORS allowed headers
  - Origins are validated on server startup before CORS middleware is configured

- **API Context**: Add clientIp to request context for better rate limiting ([packages/api/src/context.ts](packages/api/src/context.ts:1))
  - Extract IP from X-Forwarded-For, X-Real-IP, or CF-Connecting-IP headers
  - Fallback to 'unknown' if headers not available
  - Used for rate limiting anonymous requests

### Documentation

- **Security Documentation**: Add comprehensive security guide ([docs/security.md](docs/security.md:1))
  - CSRF protection implementation details
  - SameSite cookie configuration guide
  - CORS security best practices
  - Deployment security checklist
  - Troubleshooting guide for common security issues

- **Environment Configuration**: Enhance .env.example with security documentation ([.env.example](.env.example:1))
  - Document SAME_SITE_COOKIE variable with security recommendations
  - Add CORS_ORIGIN security best practices
  - Provide examples for development, production, and staging
  - Add security risks section with attack scenarios
  - Add troubleshooting guide for common CORS errors

### Tests

- **CSRF Protection Tests**: Add 40 comprehensive tests for CSRF utilities and integration ([packages/api/src/utils/**tests**/csrf.test.ts](packages/api/src/utils/__tests__/csrf.test.ts:1), [packages/api/src/**tests**/csrf.test.ts](packages/api/src/__tests__/csrf.test.ts:1))
  - Token generation, validation, and expiration
  - Timing attack protection
  - Rate limiting behavior
  - Security properties (entropy, uniqueness)
  - Edge cases and error scenarios

- **CORS Validation Tests**: Add 44 comprehensive tests for CORS validation ([apps/server/**tests**/cors.test.ts](apps/server/__tests__/cors.test.ts:1))
  - Valid and invalid CORS origins
  - Origin sanitization
  - Security warnings (wildcard, HTTP, localhost in production)
  - Edge cases (duplicates, paths, query params, IPs)

- **SameSite Cookie Tests**: Add 34 comprehensive tests for SameSite configuration ([packages/auth/**tests**/cookies.test.ts](packages/auth/__tests__/cookies.test.ts:1))
  - Production and development defaults
  - Explicit SameSite settings (strict, lax, none)
  - Validation rules and security warnings
  - Cookie behavior across contexts

- **Rate Limiter Tests**: Add 9 tests for rate limiting functionality ([packages/api/src/utils/**tests**/rate-limiter.test.ts](packages/api/src/utils/__tests__/rate-limiter.test.ts:1))
  - Rate limiting functionality
  - Automatic cleanup of old entries
  - Remaining requests calculation
  - Reset functionality

### Performance

- **Token Storage**: Use in-memory storage for CSRF tokens (cleared on page refresh)
- **Automatic Cleanup**: Rate limiter automatically removes old entries every 5 minutes
- **Concurrent Request Prevention**: CSRF token manager prevents duplicate token fetches

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
