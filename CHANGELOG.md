# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.23] - 2026-01-22

### Added

- **Avatar Upload Component**: Create reusable avatar upload component with image preview and validation ([apps/web/src/lib/components/settings/profile/avatar-upload.svelte](apps/web/src/lib/components/settings/profile/avatar-upload.svelte))
  - File input with image type validation (JPEG, PNG, GIF, WebP)
  - File size validation (max 5MB)
  - Image preview using FileReader API
  - Avatar display with fallback initials from user name
  - Upload and clear buttons with disabled state support
  - User-friendly error messages
  - Svelte 5 runes ($state, $props, $derived)
  - Exported from profile component index

- **Profile Form Component**: Create profile edit form with display name and bio fields ([apps/web/src/lib/components/settings/profile/profile-form.svelte](apps/web/src/lib/components/settings/profile/profile-form.svelte))
  - Two-way data binding with parent component
  - Form validation (name required)
  - Native textarea styled to match Input component
  - Submit and cancel buttons with disabled states
  - Svelte 5 runes ($state, $props, $effect, $bindable)
  - ProfileFormData type exported for parent components

- **User Management Backend**: Add user router with profile and account management endpoints ([packages/api/src/routers/user.ts](packages/api/src/routers/user.ts), [packages/api/src/services/user-service.ts](packages/api/src/services/user-service.ts))
  - Profile update endpoint (updateProfile)
  - Password change endpoint with validation (changePassword)
  - Account deletion with cascade deletion (deleteAccount)
  - Sessions list endpoint (getSessions)
  - Revoke session endpoint (revokeSession)
  - Avatar upload endpoint with base64 encoding (uploadAvatar)
  - Protected procedures requiring authentication
  - Comprehensive error handling with ORPCError

- **Database Schema**: Add bio field to user table ([packages/db/src/schema/auth.ts](packages/db/src/schema/auth.ts))
  - Migration generated and metadata fixed
  - Bio field type: text (optional)

## [0.0.22] - 2026-01-22

### Added

- **Session Revocation**: Add revoke session endpoint for user session management ([packages/api/src/routers/user.ts](packages/api/src/routers/user.ts:107-119), [packages/api/src/services/user-service.ts](packages/api/src/services/user-service.ts:486-527))
  - Protected procedure requiring authentication
  - Token-based session revocation with ownership verification
  - Database deletion of revoked sessions using Drizzle ORM
  - Returns success confirmation on session deletion

### Fixed

- **Prompt Form Data Binding**: Fix critical bug where prompt form submission was sending empty data despite user input ([apps/web/src/lib/components/prompt-library.svelte](apps/web/src/lib/components/prompt-library.svelte:172-188), [apps/web/src/lib/components/prompt-library-form.svelte](apps/web/src/lib/components/prompt-library-form.svelte:46-60))
  - Parent component was passing its own empty formData state instead of receiving actual data from form component
  - Changed handleCreate and handleUpdate to accept submitData parameter from form
  - Fixed $effect reactivity loop that was overriding user input
  - Removed unnecessary key prop and formVersion state
  - Added debug logging for form submission troubleshooting

- **Prompt Category Type Safety**: Add strict enum validation and type casting for category field ([packages/api/src/routers/prompt.ts](packages/api/src/routers/prompt.ts:41-48), [apps/web/src/routes/app/prompts/+page.svelte](apps/web/src/routes/app/prompts/+page.svelte:49-60))
  - Backend: Changed category from z.string() to z.enum() with canonical values
  - Frontend: Added type casting for category to match backend enum type
  - Ensures type safety between frontend and backend for prompt categories

## [0.0.21] - 2026-01-22

### Fixed

- **ORPC Response Handling**: Fix critical bug where ORPC client receives `undefined` from all API calls ([apps/server/src/index.ts](apps/server/src/index.ts:160-164))
  - Simplified RPC middleware to pass-through ORPC responses without modification
  - Previously, middleware was parsing and re-serializing ORPC responses, breaking the binary encoding format
  - ORPC uses SuperJSON encoding which was corrupted by `JSON.stringify()` re-serialization
  - Added critical architecture rule to CLAUDE.md to prevent future occurrences

- **Undefined Array Errors**: Add fallback values for ORPC responses to prevent rendering errors ([apps/web/src/lib/components/secondary-sidebar/ChatList.svelte](apps/web/src/lib/components/secondary-sidebar/ChatList.svelte), [apps/web/src/lib/components/model-selector.svelte](apps/web/src/lib/components/model-selector.svelte), [apps/web/src/lib/components/settings/api-keys/api-key-list.svelte](apps/web/src/lib/components/settings/api-keys/api-key-list.svelte))
  - ChatList, model-selector, api-key-list now handle `undefined` responses gracefully
  - Added `|| []` fallbacks for array data from ORPC calls
  - Filters out `null`/`undefined` items from arrays before rendering

## [0.0.20] - 2026-01-22

### Fixed

- **CodeRabbit Feedback Part 2**: Address remaining CodeRabbit feedback items ([apps/web/src/lib/components/chat/prompt-selector.svelte](apps/web/src/lib/components/chat/prompt-selector.svelte), [apps/web/src/lib/utils/lazy-load.ts](apps/web/src/lib/utils/lazy-load.ts))
  - Align prompt-selector categories with canonical categories from prompt-library-form-types
  - Implement polling for mermaid readiness instead of fixed setTimeout
  - Remove empty handler overrides in prompts page
  - Use static import instead of dynamic import for loadKatexCss
  - Add afterEach cleanup hook for orphaned prompts
  - Isolate environment variables with beforeAll/afterAll in model tests
  - Improve ineffective placeholder security tests in orpc-caching

- **Server Response Type**: Fix Hono newResponse type casting for status and headers ([apps/server/src/index.ts](apps/server/src/index.ts:213-222))
  - Cast status code to proper StatusCode union type
  - Cast headers via unknown to satisfy HeaderRecord constraint

## [0.0.19] - 2026-01-22

### Added

- **Skeleton Loading States**: Add skeleton loading components for improved perceived performance during data fetch ([apps/web/src/lib/components/chat/chat-skeleton.svelte](apps/web/src/lib/components/chat/chat-skeleton.svelte))
- **Prompt Library System**: Complete prompt template management with create, edit, delete, and organize functionality ([apps/web/src/lib/components/prompt-library.svelte](apps/web/src/lib/components/prompt-library.svelte))
  - CRUD operations for prompt templates
  - Category-based organization (Coding, Writing, Analysis, Custom)
  - Search and filter functionality
  - Prompt selector component for chat integration

- **Lazy Loading**: Lazy load KaTeX and Mermaid.js to reduce initial bundle size ([apps/web/src/lib/utils/lazy-load.ts](apps/web/src/lib/utils/lazy-load.ts))
  - KaTeX loads only when math content is detected
  - Mermaid.js loads only when diagram content is detected
  - Reduces initial JavaScript payload significantly

- **ORPC Response Caching**: Add cache-control middleware for ORPC endpoints ([packages/api/src/middleware/cache-headers.ts](packages/api/src/middleware/cache-headers.ts))
  - MEDIUM (5min), LONG (15min), SHORT (1min) cache durations
  - Applied to model and chat read operations
  - Reduces server load and improves response times

- **Code Refactoring**: Extract repetitive model transformation logic into reusable utility ([packages/api/src/lib/model-types.ts](packages/api/src/lib/model-types.ts))
  - `transformToAvailableModel()` function eliminates code duplication
  - Used in getAvailableModels endpoint
  - Improves maintainability and reduces bundle size

### Changed

- **Folder Delete Performance**: Parallelize folder delete operations using Promise.all() ([apps/web/src/lib/components/secondary-sidebar/ChatList.svelte](apps/web/src/lib/components/secondary-sidebar/ChatList.svelte))
  - Previously deleted chats sequentially, causing noticeable delays
  - Now deletes all chats in folder concurrently
  - Improves UX with faster folder deletion

### Fixed

- **Duplicate Key Error**: Fix Svelte `each_key_duplicate` error in chat skeleton component ([apps/web/src/lib/components/chat/chat-skeleton.svelte](apps/web/src/lib/components/chat/chat-skeleton.svelte:20-27))
  - Use unique `id` instead of `role` as each block key
  - Prevents duplicate key warnings for alternating user/assistant messages

- **KaTeX CSS Loading**: Fix MIME type error when lazy-loading KaTeX CSS in development ([apps/web/src/lib/utils/lazy-load.ts](apps/web/src/lib/utils/lazy-load.ts:66-68))
  - Change from local node_modules path to CDN URL (<https://cdn.jsdelivr.net>)
  - Works in both development and production environments
  - Add crossOrigin attribute for proper CORS handling

- **CSP Headers for KaTeX**: Update Content Security Policy to allow KaTeX CDN resources ([apps/web/src/lib/security/headers.ts](apps/web/src/lib/security/headers.ts:126,135))
  - Add <https://cdn.jsdelivr.net> to style-src directive for CSS
  - Add <https://cdn.jsdelivr.net> to font-src directive for fonts
  - Enables proper loading of KaTeX stylesheets and web fonts

## [0.0.18] - 2026-01-21

### Fixed

- **CSS Import Order**: Move KaTeX import to top of app.css for proper cascade priority ([apps/web/src/app.css](apps/web/src/app.css:5))
- **Variable Shadowing**: Fix shadowed exportFormat variable in ChatList.svelte ([apps/web/src/lib/components/secondary-sidebar/ChatList.svelte](apps/web/src/lib/components/secondary-sidebar/ChatList.svelte:107))
- **Type Safety**: Remove unnecessary type assertions in ChatList ORPC calls ([apps/web/src/lib/components/secondary-sidebar/ChatList.svelte](apps/web/src/lib/components/secondary-sidebar/ChatList.svelte:265))
- **XSS Prevention**: Fix XSS vulnerability in ChatListItem highlightText function ([apps/web/src/lib/components/secondary-sidebar/ChatListItem.svelte](apps/web/src/lib/components/secondary-sidebar/ChatListItem.svelte:106))
  - Add HTML escaping before applying search highlight markup
  - Prevent malicious script injection through search queries
- **Dialog Components**: Fix dialog and dialog-trigger to properly render children ([apps/web/src/lib/components/ui/dialog/dialog.svelte](apps/web/src/lib/components/ui/dialog/dialog.svelte:8), [apps/web/src/lib/components/ui/dialog/dialog-trigger.svelte](apps/web/src/lib/components/ui/dialog/dialog-trigger.svelte:8))
  - Add snippet children pattern for Svelte 5 compatibility
- **Client-Side API URL**: Fix getApiUrl logic in orpc.ts to preserve development backend path ([apps/web/src/lib/orpc.ts](apps/web/src/lib/orpc.ts:27))
- **HTML Sanitization**: Sanitize stoppedMessageContent before rendering with {@html} ([apps/web/src/routes/app/chat/[id]/+page.svelte](apps/web/src/routes/app/chat/[id]/+page.svelte:799))
  - Pass content through renderMarkdownSync which includes DOMPurify sanitization
- **Environment Variables**: Replace server-only SERVER_PORT with PUBLIC_API_URL in chat pages ([apps/web/src/routes/app/chat/[id]/+page.svelte](apps/web/src/routes/app/chat/[id]/+page.svelte:28), [apps/web/src/routes/app/chat/+page.svelte](apps/web/src/routes/app/chat/+page.svelte:17))
- **Test Cleanup**: Improve test cleanup with batch operations and env var fallbacks ([packages/api/src/routers/chat.test.ts](packages/api/src/routers/chat.test.ts:65))
  - Use inArray for batch deletes instead of one-by-one operations
  - Add error handling for cleanup failures
- **N+1 Query Performance**: Fix N+1 query problem in chat.ts with batch-fetching ([packages/api/src/routers/chat.ts](packages/api/src/routers/chat.ts:32))
  - Batch-fetch all messages for all chats in single query
  - Batch-fetch all folders for all chats in single query
  - Reduces database queries from O(2N) to O(1) for N chats
- **Promise Error Handling**: Change Promise.all to Promise.allSettled in chat page ([apps/web/src/routes/app/chat/[id]/+page.svelte](apps/web/src/routes/app/chat/[id]/+page.svelte:279))
  - Keep chat display unaffected by model-fetch failures
  - Set activeModel to null when model promise rejects
- **Type Assertions**: Remove unsafe 'as any' casts in tests ([packages/api/src/routers/chat.test.ts](packages/api/src/routers/chat.test.ts:50))
  - Remove 'role as any' cast when inserting messages
  - Add const assertion to providers array for strong typing
  - Remove 'provider as any' cast when inserting models
- **SQL Builder Guards**: Add Array.isArray checks before inArray clauses ([packages/api/src/routers/chat.ts](packages/api/src/routers/chat.ts:365))
  - Prevent empty IN () clauses when providers/modelIds are empty arrays
  - Validate array type and length before adding conditions
- **Date Validation**: Use Zod coercion for date fields in search schema ([packages/api/src/routers/chat.ts](packages/api/src/routers/chat.ts:314))
  - Replace z.string() with z.coerce.date() for dateFrom/dateTo
  - Zod now validates and coerces input to Date objects automatically
  - Remove redundant new Date() wrapping in date filter logic
- **Empty Array Guards**: Add guards for empty chatIds in export functions ([packages/api/src/routers/chat.ts](packages/api/src/routers/chat.ts:34))
  - Guard getAllChatsWithMessages against empty chatIds to prevent invalid SQL
  - Guard getChatsByFolder against empty chatIds to prevent invalid SQL
  - Return early with empty structures when no chats exist
- **Query Normalization**: Normalize search query by trimming whitespace ([packages/api/src/routers/chat.ts](packages/api/src/routers/chat.ts:342))
  - Trim leading/trailing whitespace to prevent searching for empty/whitespace-only strings
  - Use normalized query throughout search logic for consistency
  - Use Boolean() for explicit needsMessagesJoin conversion

## [0.0.17] - 2026-01-21

### Added

- **Consistent Sidebar Toggle**: Add global secondary sidebar toggle functionality across all pages ([apps/web/src/lib/stores/secondary-sidebar.ts](apps/web/src/lib/stores/secondary-sidebar.ts:1))
  - Create `secondarySidebarStore` for global state management using Svelte stores
  - Create reusable `SecondarySidebarTrigger` component for consistent toggle button
  - Update agents, prompts, chat, and chat/[id] pages to use the trigger
  - Remove duplicate collapse button from ChatList to avoid UX confusion

- **Settings Navigation Sidebar**: Add dedicated settings navigation in secondary sidebar ([apps/web/src/lib/components/secondary-sidebar/SettingsNav.svelte](apps/web/src/lib/components/secondary-sidebar/SettingsNav.svelte:1))
  - Settings pages now use consistent secondary sidebar pattern
  - Navigation items: Account, API Keys, Models (in that order)
  - Active state highlighting for current settings page

- **Account Settings Page**: Create new account settings page with profile and security sections ([apps/web/src/routes/app/settings/account/+page.svelte](apps/web/src/routes/app/settings/account/+page.svelte:1))
  - Display user profile information (name, email, avatar with initials)
  - Account details section (display name, email, account ID)
  - Security section with password change functionality
  - Danger zone with account deletion option

- **Models Settings Route**: Move models management to dedicated route ([apps/web/src/routes/app/settings/models/+page.svelte](apps/web/src/routes/app/settings/models/+page.svelte:1))
  - Models page now at `/app/settings/models` instead of `/app/settings`
  - Cleaner routing structure with dedicated settings routes

### Changed

- **Settings Routes Restructure**: Reorganize settings routing for better UX ([apps/web/src/routes/app/settings/+page.server.ts](apps/web/src/routes/app/settings/+page.server.ts:1))
  - `/app/settings` now redirects to `/app/settings/account` (default settings page)
  - `/app/settings/account` - Account settings page
  - `/app/settings/api-keys` - API Keys management (existing)
  - `/app/settings/models` - Models management (moved from root settings)

- **NavUser Menu Updates**: Simplify and reorganize user dropdown menu ([apps/web/src/lib/components/nav-user.svelte](apps/web/src/lib/components/nav-user.svelte:1))
  - Remove "Settings", "Billing", and "Upgrade to Pro" menu items
  - Reorder menu: Account → API Keys → Models
  - Add user initials extraction from name for avatar fallback
  - Update menu items to link to new settings routes

- **Settings Header Pattern**: Apply consistent header pattern across all settings pages ([apps/web/src/routes/app/settings/+page.svelte](apps/web/src/routes/app/settings/+page.svelte:1), [apps/web/src/routes/app/settings/api-keys/+page.svelte](apps/web/src/routes/app/settings/api-keys/+page.svelte:1))
  - All settings pages now use `SecondarySidebarTrigger` component
  - Consistent breadcrumb navigation with proper hierarchy
  - Removed custom sidebars from individual settings pages

### Fixed

- **User Avatar Initials**: Display actual user initials instead of hardcoded "CN" ([apps/web/src/lib/components/nav-user.svelte](apps/web/src/lib/components/nav-user.svelte:19-28))
  - Extract initials from user name (first letter of each word, max 2 characters)
  - Applied to both trigger button and dropdown menu avatars
  - Works with single or multi-word names

---

## [0.0.16] - 2026-01-21

### Fixed

- **Missing API Key Router Export**: Add apiKeyRouter to main ORPC appRouter export ([packages/api/src/routers/index.ts](packages/api/src/routers/index.ts:9,63))
  - apiKeyRouter was not imported or exported, causing 404 errors on `/rpc/apiKey/*` endpoints
  - All other RPC routes (chat, model, folder, message) were working correctly
  - Added import: `import { apiKeyRouter } from './api-keys'`
  - Added export: `apiKey: apiKeyRouter` to appRouter object
  - Fixes `/rpc/apiKey/getAll`, `/rpc/apiKey/create`, `/rpc/apiKey/update`, `/rpc/apiKey/delete`

- **API Key Dropdown Not Showing**: Re-enable loadApiKeys function in model settings ([apps/web/src/routes/app/settings/models-manager.svelte](apps/web/src/routes/app/settings/models-manager.svelte:110-119))
  - Function was commented out with TODO note, causing API key dropdown to be empty
  - Now that apiKeyRouter is fixed, re-enabled the function to load API keys
  - API keys are now properly fetched and displayed in dropdown when creating/editing models

- **LaTeX/KaTeX Rendering Fix**: Fix LaTeX placeholder format to avoid markdown interpretation ([apps/web/src/lib/markdown-renderer.ts](apps/web/src/lib/markdown-renderer.ts:69,81))
  - Changed placeholder from `__LATEX_BLOCK_N__` to `%%%LATEX_BLOCK_N%%%`
  - Double underscores were being interpreted as markdown bold syntax
  - LaTeX math formulas now render correctly with KaTeX

- **Direct Backend Connection**: Frontend now connects directly to backend server in development ([apps/web/src/lib/orpc.ts](apps/web/src/lib/orpc.ts:6-25), [apps/web/src/routes/app/chat/+page.svelte](apps/web/src/routes/app/chat/+page.svelte:13-20), [apps/web/src/routes/app/chat/[id]/+page.svelte](apps/web/src/routes/app/chat/[id]/+page.svelte:24-31))
  - Eliminates need for Vite proxy configuration restarts
  - ORPC client uses `http://localhost:SERVER_PORT` in development (default: 3000)
  - Chat AI endpoint uses direct backend connection in development
  - Production still uses same-origin via PUBLIC_API_URL (behind proxy)
  - Fixes 404 errors on `/rpc/*` routes caused by proxy issues
  - Resolves "violates CSP directive" errors by allowing backend URL in CSP

- **CSP Backend Server URL**: Fix CSP violation by adding backend server URL to connect-src directive ([apps/web/src/lib/security/headers.ts](apps/web/src/lib/security/headers.ts:59-111))
  - CSP now correctly includes backend server URL (from SERVER_PORT env var) in development
  - Previously used PUBLIC_API_URL (frontend URL) which caused CSP to block connections to backend
  - In development: uses `http://localhost:SERVER_PORT` (default: 3000)
  - In production: uses PUBLIC_API_URL (backend is behind proxy)
  - Fixes error: "Connecting to 'http://localhost:3000/api/ai' violates CSP directive"

- **Vite Proxy Configuration**: Add `/api` route to Vite proxy to forward API requests to backend server ([apps/web/vite.config.ts](apps/web/vite.config.ts:55-74))
  - Previously only proxied `/rpc` and `/ai`, but AI endpoint moved to `/api/ai` in v0.0.12
  - Now all `/api/*` requests are properly proxied to backend server
  - Removed obsolete `/ai` proxy route (replaced by `/api`)

- **Worker CSP Directive**: Add worker-src CSP directive to allow blob: URLs for Vite HMR ([apps/web/src/lib/security/headers.ts](apps/web/src/lib/security/headers.ts:122-123))
  - Fixes error: "Creating a worker from 'blob:' violates CSP directive"
  - Allows blob: URLs for workers in development for Vite's module workers
  - Uses 'self' only in production for stricter security

### Documentation

- **API & RPC Endpoint Reference**: Add comprehensive endpoint documentation to CLAUDE.md ([CLAUDE.md](CLAUDE.md:143-261))
  - Complete list of all REST API endpoints (`/api/auth/*`, `/api/ai`, `/rpc/*`, etc.)
  - Complete list of all ORPC procedures (chat, message, folder, model, apiKey)
  - Connection architecture explanation (dev direct connection vs production proxy)
  - Endpoint routing flow diagram
  - Common issues & solutions (404, CSP violations, CSRF errors, AI endpoint errors)
  - Critical for understanding endpoint routing and avoiding similar issues

---

## [0.0.15] - 2026-01-21

### Added

- **KaTeX & Mermaid.js Support**: Add LaTeX math and diagram rendering for markdown content ([apps/web/src/lib/markdown-renderer.ts](apps/web/src/lib/markdown-renderer.ts:1))
  - Support inline math with `$...$` syntax
  - Support display math with `$$...$$` syntax
  - Support Mermaid diagrams: flowchart, sequence, class, state, etc.
  - Auto-detect and apply theme (light/dark mode) for diagrams
  - Add KaTeX CSS import to app styles ([apps/web/src/app.css](apps/web/src/app.css:121-123))
  - Initialize Mermaid on page mount with theme detection ([apps/web/src/routes/+layout.svelte](apps/web/src/routes/+layout.svelte:1))
  - Add Mermaid.js CDN to CSP script-src whitelist ([apps/web/src/lib/security/headers.ts](apps/web/src/lib/security/headers.ts:104))

### Changed

- **Active Model for All Chats**: Backend now always uses the active model instead of requested modelId from chat ([apps/server/src/index.ts](apps/server/src/index.ts:210-220))
  - Removes modelId logic from `/api/ai` endpoint
  - Always queries active model from database for authenticated user
  - Ignores modelId from request body to prevent using outdated models
  - Fixes issue where old chats with deleted modelIds would fail with "Model not found" error

- **Model Display in Chat Header**: Show active model name in chat interface header ([apps/web/src/routes/app/chat/[id]/+page.svelte](apps/web/src/routes/app/chat/[id]/+page.svelte:681-686))
  - Fetches active model in parallel with chat data using Promise.all
  - Displays model name with code icon next to chat statistics (messages, words, last activity)
  - Removed modelId from authenticatedFetch to let backend use active model

---

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

- **Advanced Chat Search**: Enhanced search functionality with full-text search across both chat titles and message content ([packages/api/src/routers/chat.ts](packages/api/src/routers/chat.ts))
- **Provider Filter**: Multi-select dropdown to filter search results by AI provider (OpenAI, Anthropic, Google, Groq, Ollama, Custom) ([apps/web/src/lib/components/secondary-sidebar/ChatList.svelte](apps/web/src/lib/components/secondary-sidebar/ChatList.svelte))
- **Model Filter**: Multi-select dropdown to filter search results by specific AI models (e.g., GPT-4, Claude 3.5 Sonnet) with alphabetical sorting ([apps/web/src/lib/components/secondary-sidebar/ChatList.svelte](apps/web/src/lib/components/secondary-sidebar/ChatList.svelte))
- **Date Range Filter**: Date range picker (from/to) to filter conversations by creation date using native HTML5 date inputs ([apps/web/src/lib/components/secondary-sidebar/ChatList.svelte](apps/web/src/lib/components/secondary-sidebar/ChatList.svelte))
- **Message Snippets**: Display up to 3 matching message snippets below chat title with role labels (You/AI) and highlighted search terms ([apps/web/src/lib/components/secondary-sidebar/ChatListItem.svelte](apps/web/src/lib/components/secondary-sidebar/ChatListItem.svelte))
- **Clear All Filters**: Quick reset button to clear all active filters and return to default view ([apps/web/src/lib/components/secondary-sidebar/ChatList.svelte](apps/web/src/lib/components/secondary-sidebar/ChatList.svelte))
- **Database Indexes**: Added 3 new PostgreSQL indexes for search performance optimization ([packages/db/src/migrations](packages/db/src/migrations))
  - `message_content_trgm_idx` - GIN index for full-text search on message content
  - `chat_user_model_updated_idx` - Composite index for model filtering
  - `chat_created_at_idx` - B-tree index for date range queries
- **Search Performance Tests**: Comprehensive test suite verifying search performance with large datasets (120 chats, 1,200 messages) - all queries complete in <3ms ([packages/api/src/routers/chat.test.ts](packages/api/src/routers/chat.test.ts))
- **Filter Combination Tests**: 15 tests covering all possible filter combinations (provider, model, date, query) to ensure correct filtering logic ([packages/api/src/routers/chat.test.ts](packages/api/src/routers/chat.test.ts))
- **Search Highlighting Tests**: 31 automated tests verifying proper highlighting of search terms including special characters, Unicode, and edge cases ([apps/web/src/lib/components/secondary-sidebar/ChatListItem.test.ts](apps/web/src/lib/components/secondary-sidebar/ChatListItem.test.ts))
- **E2E Search Tests**: 60+ Playwright tests covering complete search workflow including all filters, result display, accessibility, and performance ([tests/e2e/search.spec.ts](tests/e2e/search.spec.ts))
- **Testing Documentation**: Created comprehensive testing guides for manual verification of search functionality ([packages/api/src/routers/TESTING_GUIDE.md](packages/api/src/routers/TESTING_GUIDE.md), [apps/web/src/lib/components/secondary-sidebar/HIGHLIGHT_TESTING_GUIDE.md](apps/web/src/lib/components/secondary-sidebar/HIGHLIGHT_TESTING_GUIDE.md), [tests/e2e/SEARCH_E2E_TESTS.md](tests/e2e/SEARCH_E2E_TESTS.md))

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

- **Search API**: Extended chat search API to support multiple filter parameters (providers array, modelIds array, dateFrom, dateTo, searchInMessages) ([packages/api/src/routers/chat.ts](packages/api/src/routers/chat.ts))
- **Search Query Logic**: Implemented conditional SQL joins with models and messages tables for efficient filtering based on active search parameters ([packages/api/src/routers/chat.ts](packages/api/src/routers/chat.ts))
- **Search Results**: Enhanced search results to include matching message snippets with role, content, and timestamp fields when searching in message content ([packages/api/src/routers/chat.ts](packages/api/src/routers/chat.ts))
- **Markdown Export Format**: Enhanced Markdown export with improved readability and structure ([apps/web/src/lib/utils/chat-export.ts](apps/web/src/lib/utils/chat-export.ts:103-180))
  - Added blockquote-style metadata header with emojis and clear formatting
  - Message-level timestamps with consistent date formatting
  - Clear horizontal rule separators between messages
  - Enhanced metadata section with bullet points and code formatting
  - Support for system messages with dedicated icon
  - Added message count and folder information to header

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
- Search with no filters: 0.69ms average (well under 500ms threshold)
- Search with text query: 0.66ms average (well under 1000ms threshold)
- Search with provider filter: 0.55ms average (well under 1500ms threshold)
- Full-text search across messages: 2.69ms average (well under 2000ms threshold)
- All performance tests pass with excellent margins, ensuring fast search even with hundreds of chats

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
