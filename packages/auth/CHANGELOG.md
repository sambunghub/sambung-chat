# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-01-30

### Fixed

- **OAuth/Keycloak Integration**: Fixed OAuth2 404 error by adding Keycloak configuration to `apps/server/.env` ([apps/server/.env](apps/server/.env))
- **Better Auth OAuth Plugin**: Fixed Keycloak OAuth plugin initialization by conditionally loading plugin only when properly configured ([packages/auth/src/index.ts](packages/auth/src/index.ts:30-42))
- **CORS Configuration**: Updated CORS_ORIGIN to include correct frontend port (5174 instead of 5173) ([apps/server/.env](apps/server/.env:3))

### Added

- **Event Bus System**: Added cross-component communication system for chat auto-refresh ([apps/web/src/lib/utils/event-bus.ts](apps/web/src/lib/utils/event-bus.ts))
- **Copy Button**: Added copy button to message bubbles (both assistant and user) positioned at bottom-right ([apps/web/src/lib/components/chat/message-bubble.svelte](apps/web/src/lib/components/chat/message-bubble.svelte))
- **CSRF Debug Logging**: Added comprehensive debug logging for CSRF token validation across multiple files

### Changed

- **ORPC Client**: Fixed request body consumption on CSRF retry by storing original body upfront ([apps/web/src/lib/orpc.ts](apps/web/src/lib/orpc.ts))
