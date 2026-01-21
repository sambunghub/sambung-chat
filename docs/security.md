# Security Documentation

This document provides comprehensive security guidelines for SambungChat, including CSRF protection, SameSite cookie configuration, CORS validation, and deployment security best practices.

---

## Table of Contents

1. [Overview](#overview)
2. [CSRF Protection](#csrf-protection)
3. [SameSite Cookie Configuration](#samesite-cookie-configuration)
4. [CORS Security](#cors-security)
5. [Deployment Security Checklist](#deployment-security-checklist)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

SambungChat implements multiple layers of security to protect against common web vulnerabilities:

- **CSRF Protection**: Token-based validation for all state-changing operations
- **SameSite Cookies**: Configurable cookie settings with secure defaults
- **CORS Validation**: Origin validation and sanitization to prevent misconfiguration
- **Input Validation**: Comprehensive validation on all API endpoints
- **Rate Limiting**: Protection against token enumeration and brute force attacks

### Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
│                   (apps/web - SvelteKit)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ 1. CSRF Token (X-CSRF-Token header)
                        │ 2. Session Cookie (HttpOnly, Secure, SameSite)
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      Server Layer                            │
│                   (apps/server - Hono)                       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  CORS Middleware                                        │ │
│ │  - Origin validation                                    │ │
│ │  - Header sanitization                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  CSRF Protection Middleware                             │ │
│ │  - Token validation (mutations only)                   │ │
│ │  - Rate limiting (10 req/min)                          │ │
│ │  - Constant-time comparison                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  oRPC Routers                                           │ │
│ │  - Protected procedures (mutations)                    │ │
│ │  - Public procedures (queries)                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│              (PostgreSQL + Drizzle ORM)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## CSRF Protection

### What is CSRF?

Cross-Site Request Forgery (CSRF) is an attack that forces an end user to execute unwanted actions on a web application in which they're currently authenticated. CSRF attacks specifically target state-changing requests, not theft of data.

**OWASP Classification**: A01:2021 - Broken Access Control

### Implementation Details

#### Token Generation

CSRF tokens are generated using cryptographically secure random values:

```typescript
// packages/api/src/utils/csrf.ts
export function generateCsrfToken(userId: string): string {
  const random = crypto.randomBytes(32).toString('hex'); // 256-bit entropy
  const timestamp = Date.now();
  const data = `${random}:${timestamp}:${userId}`;

  // Sign with HMAC-SHA256 using BETTER_AUTH_SECRET
  const signature = crypto
    .createHmac('sha256', process.env.BETTER_AUTH_SECRET!)
    .update(data)
    .digest('hex');

  return `${data}:${signature}`;
}
```

**Security Properties**:

- ✅ 256 bits of entropy (32 random bytes)
- ✅ HMAC-SHA256 signature prevents tampering
- ✅ Timestamp for expiration (1 hour default)
- ✅ User-specific tokens bind to session

#### Token Validation

Tokens are validated using constant-time comparison to prevent timing attacks:

```typescript
export function validateCsrfToken(token: string, userId: string): boolean {
  try {
    const [random, timestamp, tokenUserId, signature] = token.split(':');

    // Verify user matches
    if (tokenUserId !== userId) return false;

    // Verify expiration
    if (isCsrfTokenExpired(Number(timestamp))) return false;

    // Verify signature with constant-time comparison
    const data = `${random}:${timestamp}:${userId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.BETTER_AUTH_SECRET!)
      .update(data)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}
```

**Security Properties**:

- ✅ Constant-time comparison prevents timing attacks
- ✅ Expiration limits attack window
- ✅ Signature verification prevents tampering
- ✅ User binding prevents token reuse across sessions

#### Token Endpoint

Public endpoint to fetch CSRF tokens:

```
GET /rpc/app.getCsrfToken
```

**Response** (authenticated):

```json
{
  "token": "64-hex-chars:timestamp:userId:64-hex-signature",
  "authenticated": true,
  "expiresIn": 3600
}
```

**Response** (unauthenticated):

```json
{
  "token": null,
  "authenticated": false
}
```

**Rate Limiting**: 10 requests per minute per user/IP

#### Frontend Integration

The frontend automatically manages CSRF tokens:

```typescript
// apps/web/src/lib/orpc.ts
class CsrfTokenManager {
  private token: string | null = null;

  async fetchToken(): Promise<void> {
    const response = await orpc.app.getCsrfToken();
    if (response.authenticated && response.token) {
      this.token = response.token;
    }
  }

  getToken(): string | null {
    return this.token;
  }
}

// Automatic token inclusion in all requests
const csrfManager = new CsrfTokenManager();
```

**Features**:

- ✅ In-memory token storage (never localStorage)
- ✅ Automatic token fetching on app load
- ✅ Automatic token refresh on 403 errors
- ✅ Graceful handling of unauthenticated users

#### Protected Routes

All mutation operations require valid CSRF tokens:

**Chat Router** (5 mutations):

- `POST /rpc/app.chat.create`
- `PUT /rpc/app.chat.update`
- `DELETE /rpc/app.chat.delete`
- `POST /rpc/app.chat.togglePin`
- `POST /rpc/app.chat.updateFolder`

**Message Router** (2 mutations):

- `POST /rpc/app.message.create`
- `DELETE /rpc/app.message.delete`

**Folder Router** (3 mutations):

- `POST /rpc/app.folder.create`
- `PUT /rpc/app.folder.update`
- `DELETE /rpc/app.folder.delete`

**Query operations** (read-only) do NOT require CSRF tokens:

- `GET /rpc/app.chat.getAll`
- `GET /rpc/app.chat.getById`
- `GET /rpc/app.message.getByChatId`
- `GET /rpc/app.folder.getAll`

### Testing CSRF Protection

**Test without token** (should fail):

```bash
curl -X POST http://localhost:3000/rpc/app.chat.create \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Chat"}'
  # Returns: 403 Forbidden - Missing CSRF token
```

**Test with valid token** (should succeed):

```bash
TOKEN=$(curl -s http://localhost:3000/rpc/app.getCsrfToken | jq -r '.token')

curl -X POST http://localhost:3000/rpc/app.chat.create \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{"title": "Test Chat"}'
  # Returns: 201 Created
```

---

## SameSite Cookie Configuration

### What is SameSite?

The `SameSite` cookie attribute controls whether cookies are sent with cross-site requests, providing protection against CSRF attacks.

### Configuration Options

#### `strict` (Recommended for Production)

Maximum CSRF protection. Cookies are sent only for first-party requests.

**Best for**: Production environments with high security requirements

**Behavior**:

- ✅ Cookies sent on same-site requests
- ❌ Cookies NOT sent on cross-site requests (even from links)
- ⚠️ May break OAuth flows from external providers

**Example**:

```bash
# .env.production
NODE_ENV=production
SAME_SITE_COOKIE=strict
```

#### `lax` (Default for Development)

Balanced security. Cookies are sent on same-site requests and safe cross-site requests (navigations).

**Best for**: Development environments and OAuth flows

**Behavior**:

- ✅ Cookies sent on same-site requests
- ✅ Cookies sent on cross-site top-level navigations (GET requests)
- ❌ Cookies NOT sent on cross-site sub-resource requests (images, frames, etc.)

**Example**:

```bash
# .env.development
NODE_ENV=development
SAME_SITE_COOKIE=lax
```

#### `none` (Special Use Cases)

No SameSite protection. Cookies sent on all requests.

**Requirements**:

- ✅ MUST be used with `Secure` attribute (HTTPS only)
- ⚠️ Not recommended unless absolutely necessary

**Best for**: Cross-site SSO scenarios (rare)

**Example**:

```bash
# .env (special cases only)
SAME_SITE_COOKIE=none
# Ensure cookies are Secure (HTTPS required)
```

### Implementation

#### Environment Variable

```bash
# .env.example
# SameSite cookie attribute for session cookies
# Options: 'strict', 'lax', 'none'
# - strict: Maximum CSRF protection (recommended for production)
# - lax: Balanced security (default for development, OAuth-friendly)
# - none: No SameSite protection (requires Secure cookies, not recommended)
# Default: 'strict' in production, 'lax' in development
SAME_SITE_COOKIE=strict
```

#### Default Behavior

```typescript
// packages/env/src/server.ts
export function getValidatedSameSiteSetting(): 'strict' | 'lax' | 'none' {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const sameSiteCookie = process.env.SAME_SITE_COOKIE;

  if (sameSiteCookie) {
    // Validate explicit setting
    const validValues = ['strict', 'lax', 'none'];
    if (!validValues.includes(sameSiteCookie)) {
      throw new Error(`Invalid SAME_SITE_COOKIE: ${sameSiteCookie}`);
    }

    // Warn about insecure configurations
    if (sameSiteCookie === 'none' && nodeEnv === 'production') {
      console.warn('[SECURITY] SAME_SITE_COOKIE=none requires Secure cookies in production');
    }

    if (sameSiteCookie === 'lax' && nodeEnv === 'production') {
      console.warn('[SECURITY] SAME_SITE_COOKIE=lax is not optimal for production');
    }

    return sameSiteCookie as 'strict' | 'lax' | 'none';
  }

  // Use secure defaults
  if (nodeEnv === 'production') {
    console.log('[SECURITY] SAME_SITE_COOKIE using default: strict (production)');
    return 'strict';
  } else {
    console.log('[SECURITY] SAME_SITE_COOKIE using default: lax (development)');
    return 'lax';
  }
}
```

#### Better Auth Integration

```typescript
// packages/auth/src/index.ts
import { getValidatedSameSiteSetting } from '@sambung-chat/env/server';

const sameSiteSetting = getValidatedSameSiteSetting();

export const auth = betterAuth({
  advanced: {
    cookiePrefix: 'sambungchat-auth',
    crossSubDomainCookies: {
      enabled: false,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: false,
    },
  },
  // Cookie configuration
  baseURL: process.env.BETTER_AUTH_URL || '<http://localhost:3000>',
  baseURLOAuth: process.env.BETTER_AUTH_URL || '<http://localhost:3000>',

  // Secure cookie settings
  secureCookie: nodeEnv === 'production' ? true : false, // HTTPS in production
  sameSite: sameSiteSetting, // Dynamic from env variable
  trustOrigin: true,
});
```

### Startup Logs

When the server starts, you'll see the current configuration:

```
[SECURITY] SAME_SITE_COOKIE using default: strict (production)
[AUTH CONFIG] SameSite cookie setting: strict
[AUTH CONFIG] Better Auth initialized successfully
```

---

## CORS Security

### What is CORS?

Cross-Origin Resource Sharing (CORS) is a security mechanism that allows or restricts cross-origin requests in web browsers.

### Implementation

#### Origin Validation

```typescript
// packages/env/src/server.ts
export function getValidatedCorsOrigins(): string[] {
  const corsOrigin = process.env.CORS_ORIGIN;

  if (!corsOrigin) {
    console.log('[CORS] Using default origin: http://localhost:5174');
    return ['http://localhost:5174'];
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const origins = corsOrigin.split(',').map((o) => o.trim());
  const validatedOrigins: string[] = [];

  for (const origin of origins) {
    // Validate URL format
    try {
      const url = new URL(origin);

      // Only allow http:// and https://
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error(`Invalid protocol: ${url.protocol}`);
      }

      // Reject embedded credentials
      if (url.username || url.password) {
        throw new Error('Embedded credentials not allowed');
      }

      // Remove trailing slash
      const sanitized = origin.replace(/\/$/, '');
      validatedOrigins.push(sanitized);

      // Security warnings
      if (origin === '*') {
        console.warn('[CORS] ⚠️  WARNING: Wildcard origin (*) allows requests from ANY domain!');
      }

      if (isProduction && url.protocol === 'http:') {
        console.warn(`[CORS] ⚠️  WARNING: HTTP origin in production: ${origin}`);
      }

      if (isProduction && url.hostname === 'localhost') {
        console.warn(`[CORS] ⚠️  WARNING: localhost in production: ${origin}`);
      }
    } catch (error) {
      throw new Error(`Invalid CORS origin: ${origin} - ${error}`);
    }
  }

  console.log(`[CORS] Allowed origins: ${validatedOrigins.join(', ')}`);
  return validatedOrigins;
}
```

#### Server Configuration

```typescript
// apps/server/src/index.ts
import { getValidatedCorsOrigins } from '@sambung-chat/env/server';
import { authRouter } from '@sambung-chat/auth/server';

const allowedOrigins = getValidatedCorsOrigins();

app.use(
  '/api/*',
  cors({
    origin: allowedOrigins,
    credentials: true, // Allow cookies
    allowMethods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token', // Required for CSRF protection
    ],
    maxAge: 86400, // 24 hours
  })
);

// Better Auth requires CORS at root
app.use(
  '/',
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowMethods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    maxAge: 86400,
  })
);
```

### Configuration Examples

#### Development

```bash
# .env.development
CORS_ORIGIN=http://localhost:5174
```

#### Production (Single Domain)

```bash
# .env.production
CORS_ORIGIN=https://chat.example.com
```

#### Production (Multiple Domains)

```bash
# .env.production
CORS_ORIGIN=https://chat.example.com,https://app.example.com
```

#### Staging

```bash
# .env.staging
CORS_ORIGIN=https://staging-chat.example.com,https://staging-app.example.com
```

### Security Warnings

The system will log warnings for insecure configurations:

⚠️ **Wildcard Origin**:

```
[CORS] ⚠️  WARNING: Wildcard origin (*) allows requests from ANY domain!
```

**Risk**: Any website can make requests to your API and potentially steal user data.

⚠️ **HTTP in Production**:

```
[CORS] ⚠️  WARNING: HTTP origin in production: http://example.com
```

**Risk**: Cookies can be intercepted over the network.

⚠️ **Localhost in Production**:

```
[CORS] ⚠️  WARNING: localhost in production: http://localhost:3000
```

**Risk**: Indicates misconfiguration; localhost should not be in production CORS list.

---

## Deployment Security Checklist

### Pre-Deployment

- [ ] **Environment Variables**
  - [ ] Set `NODE_ENV=production`
  - [ ] Set `SAME_SITE_COOKIE=strict`
  - [ ] Set `CORS_ORIGIN` to exact production domain(s) (HTTPS only)
  - [ ] Avoid wildcard (\*) origins
  - [ ] Ensure `BETTER_AUTH_SECRET` is set and strong (32+ characters)
  - [ ] Ensure `DATABASE_URL` uses SSL (`?sslmode=require`)

- [ ] **Database Security**
  - [ ] Enable SSL for database connections
  - [ ] Use strong database password
  - [ ] Restrict database access to specific IPs
  - [ ] Enable database backups

- [ ] **SSL/TLS Configuration**
  - [ ] Use HTTPS only (no HTTP in production)
  - [ ] Configure SSL certificates properly
  - [ ] Enable HSTS (HTTP Strict Transport Security)
  - [ ] Use strong cipher suites

### Post-Deployment

- [ ] **Verification**
  - [ ] Verify authentication works with SameSite=strict
  - [ ] Verify CSRF tokens are required for mutations
  - [ ] Verify CORS blocks unauthorized origins
  - [ ] Verify session cookies are HttpOnly and Secure
  - [ ] Verify no errors in browser console
  - [ ] Verify no errors in server logs

- [ ] **Monitoring**
  - [ ] Monitor server logs for security warnings
  - [ ] Track CSRF-validation failures
  - [ ] Track rate-limiting violations
  - [ ] Audit CORS-origin configurations
  - [ ] Set up alerts for suspicious activity

- [ ] **Testing**
  - [ ] Test authentication flow
  - [ ] Test CSRF protection (try mutations without token)
  - [ ] Test CORS from disallowed origin
  - [ ] Test OAuth flow (if configured)
  - [ ] Load test CSRF token endpoint

---

## Security Best Practices

### Token Management

#### Do

- Use in-memory token storage (not localStorage)
- Implement automatic token refresh
- Use short expiration times (1 hour recommended)
- Use cryptographically secure random values
- Sign tokens with HMAC

#### Don't

- Store tokens in localStorage
- Reuse tokens across sessions
- Use predictable token values
- Expose tokens in URLs
- Send tokens over unencrypted connections

### Cookie Configuration

#### Do

- Use `SameSite=strict` in production
- Enable `Secure` flag (HTTPS only)
- Enable `HttpOnly` flag (prevent XSS access)
- Set appropriate `maxAge` (7 days recommended)
- Use cookie prefixes (`__Host-`, `__Secure-`)

#### Don't

- Use `SameSite=none` unless absolutely necessary
- Allow cookies over HTTP in production
- Expose session data in cookies
- Use wildcard origins
- Set excessive expiration times

### CORS Configuration

#### Do

- Specify exact origins (not wildcards)
- Use HTTPS only in production
- Validate origin format on startup
- Sanitize origins (trim, remove trailing slashes)
- Log allowed origins for auditing

#### Don't

- Use `*` as origin
- Allow HTTP in production
- Forget to validate origin format
- Allow embedded credentials in URLs
- Ignore security warnings

### API Security

#### Do

- Validate all input data
- Use parameterized queries
- Implement rate limiting
- Log security events
- Use constant-time comparisons for secrets

#### Don't

- Trust client-side input
- Concatenate SQL queries
- Expose sensitive data in errors
- Use string comparison for tokens
- Forget to validate authentication

---

## Troubleshooting

### CSRF Token Issues

#### "Missing CSRF token" Error

**Cause**: Request doesn't include `X-CSRF-Token` header

**Solution**:

1. Ensure frontend is using latest orpc client
2. Check browser console for token fetch errors
3. Verify user is authenticated
4. Check network tab for `/rpc/app.getCsrfToken` request

**Debug**:

```javascript
// In browser console
localStorage.clear(); // Clear any stored data
// Reload app and check for token fetch
```

#### "Invalid CSRF token" Error

**Cause**: Token is malformed, expired, or tampered with

**Solution**:

1. Check token expiration (1 hour default)
2. Verify token format (4 parts separated by colons)
3. Check server logs for validation errors
4. Ensure `BETTER_AUTH_SECRET` is consistent

**Debug**:

```bash
# Check token endpoint directly
curl http://localhost:3000/rpc/app.getCsrfToken \
  -H "Cookie: your-session-cookie"
```

#### "Rate limit exceeded" Error

**Cause**: Too many token fetch requests (>10/min)

**Solution**:

1. Wait for rate limit to reset (1 minute)
2. Check for token fetch loops
3. Implement exponential backoff
4. Verify frontend isn't fetching on every request

### SameSite Cookie Issues

#### OAuth Flow Fails

**Cause**: SameSite=strict blocks OAuth redirects

**Solution**:

1. Use `SAME_SITE_COOKIE=lax` for OAuth environments
2. Ensure OAuth callback URL is same-site
3. Consider using `none` with Secure for cross-site OAuth (not recommended)

**Debug**:

```javascript
// Check cookie in browser
document.cookie; // Should show session cookie
// Check cookie attributes in DevTools > Application > Cookies
```

#### Session Lost on Navigation

**Cause**: Cookie not being sent with requests

**Solution**:

1. Verify SameSite setting allows navigation
2. Check cookie domain/path settings
3. Ensure HTTPS is used in production
4. Check browser console for cookie warnings

### CORS Issues

#### "CORS origin not allowed" Error

**Cause**: Request origin not in `CORS_ORIGIN` list

**Solution**:

1. Check `CORS_ORIGIN` environment variable
2. Verify origin format (protocol + domain + port)
3. Check for typos in origin URL
4. Restart server after changing `CORS_ORIGIN`

**Debug**:

```bash
# Check server startup logs
# Should show: [CORS] Allowed origins: https://example.com

# Test CORS directly
curl -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3000/api/test \
  -v
```

#### Credentials Not Included

**Cause**: CORS `credentials` not enabled

**Solution**:

1. Ensure `credentials: true` in CORS config
2. Frontend must use `credentials: 'include'` in fetch
3. Check browser console for credential errors
4. Verify cookies are being set

**Debug**:

```javascript
// Frontend should use:
fetch('/api/endpoint', {
  credentials: 'include', // Include cookies
  headers: {
    'X-CSRF-Token': token,
  },
});
```

### Validation Errors

#### "Invalid CORS origin" on Startup

**Cause**: Malformed URL in `CORS_ORIGIN`

**Solution**:

1. Check origin format: `protocol://domain:port`
2. Remove trailing slashes
3. Don't include paths or query params
4. Don't use embedded credentials (username:password@)

**Debug**:

```bash
# Test origin format
node -e "console.log(new URL('https://example.com'))"
# Should parse without error
```

#### "Invalid SAME_SITE_COOKIE" Error

**Cause**: Invalid enum value

**Solution**:

1. Use only: `strict`, `lax`, or `none`
2. Check for typos
3. Don't use quotes around value
4. Restart server after changing

---

## Additional Resources

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Better Auth Documentation](https://www.better-auth.com/docs)

---

**Last Updated**: 2026-01-20
**Version**: 0.0.5
