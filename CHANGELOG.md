# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.11] - 2026-01-20

### Changed

- **Environment-based Configuration Removed**: AI provider configuration is now exclusively managed through the web UI ([.env.example](.env.example:140-165), [packages/env/src/server.ts](packages/env/src/server.ts:71-80))
  - Removed all AI provider API key environment variables (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
  - Removed model ID environment variables (OPENAI_MODEL, ANTHROPIC_MODEL, etc.)
  - Removed AI_PROVIDER and AI_MODEL environment variables
  - Users must now configure models via Settings → Models in the web UI
  - API keys are stored securely in the database with AES-256-GCM encryption

- **API Keys Now Required**: Models must have an associated API key from the database ([packages/api/src/lib/ai-provider-factory.ts](packages/api/src/lib/ai-provider-factory.ts:77-82))
  - Exception: Ollama provider doesn't require an API key (uses local inference)
  - Clearer error messages when API key is missing from model configuration

- **Improved Error Messages**: Better user guidance when configuration is incomplete ([apps/server/src/index.ts](apps/server/src/index.ts:210-221), [packages/api/src/routers/ai.ts](packages/api/src/routers/ai.ts:148-158))
  - "No active model configured" - directs users to Settings → Models
  - "Model is missing an API key" - instructs users to add API Key in Settings

### Removed

- **isProviderConfigured() function**: No longer needed since providers are configured via UI ([packages/api/src/lib/ai-provider-factory.ts](packages/api/src/lib/ai-provider-factory.ts))
- **getConfiguredProviders() function**: No longer needed since providers are configured via UI ([packages/api/src/lib/ai-provider-factory.ts](packages/api/src/lib/ai-provider-factory.ts))
- **validateAIProviders() function**: Environment validation removed since all config is in database ([packages/env/src/server.ts](packages/env/src/server.ts:122-123))

### Security

- **Enhanced Security**: Removing environment-based API keys reduces risk of credential exposure
  - API keys are now encrypted at rest in the database
  - No API keys in environment variables or configuration files
  - Each user can manage their own API keys through the UI

---

## [0.0.10] - 2026-01-20

### Fixed

- **AI Endpoint API Key Decryption**: Fix "Invalid API key" error in `/ai` endpoint by implementing proper AES-256-GCM decryption ([apps/server/src/index.ts](apps/server/src/index.ts:130-142))
  - Added `getDecryptedApiKey` helper function to decrypt API keys from database
  - Previously API keys were not decrypted in `/ai` endpoint (only RPC endpoints were fixed)
  - Now both endpoints (`/rpc/ai.stream` and `/ai`) properly decrypt stored API keys

- **METHOD_NOT_SUPPORTED Error**: Fix ORPC error for OPTIONS requests by adding explicit handler ([apps/server/src/index.ts](apps/server/src/index.ts:97-99))
  - Added `app.options('/rpc/*', ...)` handler to properly handle CORS preflight requests
  - Prevents 405 errors when browser sends OPTIONS requests before actual RPC calls

- **Model Management UI**: Add missing API Key selector field to model creation/edit forms ([apps/web/src/routes/app/settings/models-manager.svelte](apps/web/src/routes/app/settings/models-manager.svelte))
  - Added API key dropdown that filters keys based on selected provider
  - Users can now select stored API keys instead of relying solely on environment variables
  - Shows key name and last 4 digits for easy identification
  - Added link to API Keys management page for quick access

### Changed

- **Better Model Logging**: Enhanced logging in `/ai` endpoint to show both modelId and display name ([apps/server/src/index.ts](apps/server/src/index.ts:223))
  - Logs now show: `[AI] Using active model: {provider} {modelId} {name}`
  - Helps debug issues where display name differs from actual model ID

### Technical Notes

- **Model Fields**: Database has two separate fields:
  - `name`: Display name (e.g., "Trial GLM", "GPT-4o")
  - `modelId`: Actual model ID passed to API (e.g., "glm-4", "gpt-4o")
- Ensure `modelId` contains the correct API model identifier, not the display name

---

## [0.0.9] - 2026-01-20

### Fixed

- **API Key Decryption**: Fix "Invalid API key" error for custom models by implementing proper AES-256-GCM decryption in AI router ([packages/api/src/routers/ai.ts](packages/api/src/routers/ai.ts:58-87))
  - `getDecryptedApiKey` function now properly decrypts API keys using the `decrypt` function from encryption module
  - Previously returned encrypted key directly, causing authentication failures with AI providers

- **Base URL Sanitization**: Prevent duplicate `/chat/completions` path in OpenAI-compatible provider URLs ([packages/api/src/lib/ai-provider-factory.ts](packages/api/src/lib/ai-provider-factory.ts:33-66))
  - Added `sanitizeBaseURL` function that automatically removes endpoint paths like `/chat/completions`, `/completions` from user input
  - Applied sanitization to all OpenAI-compatible providers (OpenAI, Custom, Groq, Ollama) and Anthropic
  - Fixes issue where input like `https://api.example.com/v1/chat/completions` resulted in double path `https://api.example.com/v1/chat/completions/chat/completions`
  - Now both `https://api.example.com/v1` and `https://api.example.com/v1/chat/completions` work correctly

- **Provider Config Types**: Fix TypeScript errors by correcting property name from `model` to `modelId` in ProviderConfig ([packages/api/src/routers/ai.ts](packages/api/src/routers/ai.ts:151))
  - Updated `getModelConfig` to use correct property name `modelId` instead of `model`
  - Fixed all references to use `modelConfig.modelId` instead of `modelConfig.model`

---

## [0.0.8] - 2026-01-20

### Added

- **Secure API Key Management System**: Comprehensive encrypted API key storage with AES-256-GCM encryption, user-level key isolation, and secure key rotation ([docs/setup/api-keys.md](docs/setup/api-keys.md))
  - Database schema for encrypted API key storage with ULID primary keys ([packages/db/src/schema/api-keys.ts](packages/db/src/schema/api-keys.ts))
  - AES-256-GCM encryption utilities with scrypt key derivation and random IV per encryption ([packages/api/src/lib/encryption.ts](packages/api/src/lib/encryption.ts))
  - oRPC router with full CRUD operations for API key management ([packages/api/src/routers/api-keys.ts](packages/api/src/routers/api-keys.ts))
  - API key service layer with business logic separation ([packages/api/src/services/api-key-service.ts](packages/api/src/services/api-key-service.ts))
  - Secure logging middleware to prevent API key exposure in logs and errors ([packages/api/src/middleware/secure-logging.ts](packages/api/src/middleware/secure-logging.ts))
  - Frontend settings UI at `/app/settings/api-keys` with full CRUD functionality ([apps/web/src/routes/app/settings/api-keys/+page.svelte](apps/web/src/routes/app/settings/api-keys/+page.svelte))
  - Reusable form components: ApiKeyForm, ApiKeyCard, and ApiKeyList ([apps/web/src/lib/components/settings/api-keys/](apps/web/src/lib/components/settings/api-keys/))
  - Environment validation for ENCRYPTION_KEY with 32-byte base64 requirement ([packages/env/src/server.ts](packages/env/src/server.ts))
  - Comprehensive documentation for encryption setup and key rotation ([docs/setup/api-keys.md](docs/setup/api-keys.md))
  - Navigation sidebar integration in settings page with AI Models and API Keys links ([apps/web/src/routes/app/settings/+page.svelte](apps/web/src/routes/app/settings/+page.svelte))

### Changed

- **Environment Configuration**: Add ENCRYPTION_KEY requirement for API key encryption ([apps/server/.env.example](apps/server/.env.example), [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md))
- **Security**: Implement secure logging middleware to sanitize API keys from all error messages and console output ([packages/api/src/middleware/secure-logging.ts](packages/api/src/middleware/secure-logging.ts))

### Testing

- **Encryption Utilities**: 51 unit tests covering encryption/decryption cycles, security properties, and edge cases ([packages/api/src/lib/encryption.test.ts](packages/api/src/lib/encryption.test.ts))
- **API Key Service**: 34 unit tests for CRUD operations with mocked database ([packages/api/src/services/api-key-service.test.ts](packages/api/src/services/api-key-service.test.ts))
- **Secure Logging**: 78 security audit tests verifying no API key exposure in any scenario ([packages/api/src/middleware/secure-logging.test.ts](packages/api/src/middleware/secure-logging.test.ts))
- **E2E Tests**: 31 test scenarios covering complete user flows with cross-browser testing (155 total variants) ([tests/e2e/api-keys.spec.ts](tests/e2e/api-keys.spec.ts))
- **Total Test Coverage**: 163 tests (51 encryption + 34 service + 78 security + 31 E2E scenarios)

### Security

- **AES-256-GCM Encryption**: All API keys encrypted at rest with unique IV per encryption and auth tag verification
- **User-Level Isolation**: Users can only access their own API keys through ownership verification
- **Secure Logging**: API keys automatically redacted from console logs, error messages, and ORPC responses
- **No Key Exposure**: Last 4 characters only display in UI; full keys never exposed in logs or client responses
- **Key Rotation Support**: Users can update API keys without losing chat history or settings

---

## [0.0.7] - 2026-01-19

### Added

- **Multi-Provider AI Integration**: Complete integration of OpenAI and Anthropic providers with unified architecture ([packages/api/src/lib/ai-provider-factory.ts](packages/api/src/lib/ai-provider-factory.ts), [apps/server/src/index.ts](apps/server/src/index.ts:132-332))
  - Provider factory pattern supporting OpenAI, Anthropic, Google, Groq, Ollama, and custom providers
  - Automatic provider selection based on user's active model configuration
  - API key injection with fallback to environment variables
  - Custom base URL support for enterprise deployments

- **OpenAI Provider Integration**: Full chat completion route with comprehensive error handling ([packages/api/src/routers/ai.ts](packages/api/src/routers/ai.ts:57-320))
  - Server-Sent Events (SSE) streaming for real-time token delivery
  - Error handling for 9 categories: rate limits, authentication, model not found, context exceeded, content policy, invalid requests, network errors, service unavailable, payment errors
  - API key sanitization to prevent sensitive data leakage in logs
  - Chat history persistence with proper database integration

- **Anthropic Provider Integration**: Complete Claude AI provider support ([packages/api/src/lib/anthropic-models.ts](packages/api/src/lib/anthropic-models.ts))
  - Claude 3.5 Sonnet (claude-3-5-sonnet-20241022) - 200K context, optimized for complex tasks
  - Claude 3.5 Haiku (claude-3-5-haiku-20241022) - 200K context, fastest response times
  - Claude 3 Opus (claude-3-opus-20240229) - 200K context, highest quality reasoning
  - Claude 3 Sonnet (claude-3-sonnet-20240229) - 200K context, balanced performance
  - Claude 3 Haiku (claude-3-haiku-20240307) - 200K context, fastest Claude 3 model

- **OpenAI Models**: Database schema and configuration for OpenAI model family ([packages/db/src/schema/model.ts](packages/db/src/schema/model.ts))
  - GPT-4 Turbo (gpt-4-turbo, gpt-4-turbo-2024-04-09)
  - GPT-4 (gpt-4, gpt-4-0613)
  - GPT-3.5 Turbo (gpt-3.5-turbo, gpt-3.5-turbo-0125, gpt-3.5-turbo-1106)
  - GPT-4O (gpt-4o, gpt-4o-2024-08-06)

- **Model Metadata Endpoint**: Provider-agnostic model catalog ([packages/api/src/routers/model.ts](packages/api/src/routers/model.ts))
  - `GET /rpc/model.getAvailableModels` returns all models grouped by provider
  - Model catalogs for OpenAI (5 models), Anthropic (5 models), Google (4 models), Groq (4 models), Ollama (5 models)
  - Each model includes id, name, maxTokens, contextWindow, bestFor, and cost information

- **Frontend Chat Integration**: Streaming UI components with real-time token display ([apps/web/src/routes/app/chat/+page.svelte](apps/web/src/routes/app/chat/+page.svelte))
  - AI SDK Chat component integration with DefaultChatTransport
  - Streaming state management with visual indicators (animated dots)
  - Stop/abort functionality with AbortController
  - Auto-scroll during streaming responses
  - Error state handling with user-friendly messages

- **API Key Management**: Database schema for encrypted API key storage ([packages/db/src/schema/api-key.ts](packages/db/src/schema/api-key.ts))
  - apiKeys table with encryptedKey field for AES-256 encryption
  - keyLast4 field for secure display (last 4 characters only)
  - Provider-specific key management (openai, anthropic, google, groq, ollama)
  - User ownership with cascade delete on user removal

- **Secure API Key Infrastructure**: Encryption utilities for secure key storage ([packages/api/src/lib/encryption.ts](packages/api/src/lib/encryption.ts))
  - AES-256-GCM encryption for API keys at rest
  - 32-byte base64-encoded encryption key requirement
  - IV (Initialization Vector) per key for enhanced security
  - Auth tag verification for data integrity

### Changed

- **AI Endpoint Architecture**: Refactored to support multi-provider model selection ([apps/server/src/index.ts](apps/server/src/index.ts:132-332))
  - Query user's active model from database before processing request
  - Extract provider and modelId from model configuration
  - Route request to appropriate provider via provider factory
  - Fallback to default OpenAI model when no active model set

- **Environment Configuration**: Added provider-specific environment variables ([packages/env/src/server.ts](packages/env/src/server.ts))
  - OPENAI_API_KEY, OPENAI_BASE_URL
  - ANTHROPIC_API_KEY, ANTHROPIC_MODEL, ANTHROPIC_BASE_URL, ANTHROPIC_VERSION

### Security

- **API Key Encryption**: AES-256-GCM encryption for all stored API keys ([packages/api/src/lib/encryption.ts](packages/api/src/lib/encryption.ts))
- **API Key Sanitization**: Automatic sanitization of API keys in error logs to prevent leakage ([packages/api/src/routers/ai.ts](packages/api/src/routers/ai.ts:140-298))
- **Secure Logging Middleware**: Prevents API key exposure in logs ([apps/server/src/index.ts](apps/server/src/index.ts:50-65))

### Tested

- **Type Checking**: All packages pass TypeScript type checking with zero errors
- **Hydration Validation**: SSR hydration validation passes with clean console
- **Streaming Functionality**: Manual testing of streaming with real OpenAI and Anthropic APIs
- **Error Handling**: Code review and automated testing of all error categories
- **Build Verification**: Production build passes with clean console and no hydration issues

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
