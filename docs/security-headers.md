# Security Headers

**Version:** 1.0.0
**Last Updated:** January 20, 2026
**License:** AGPL-3.0

---

## Table of Contents

1. [Overview](#overview)
2. [Implemented Security Headers](#implemented-security-headers)
3. [Content Security Policy (CSP)](#content-security-policy-csp)
4. [Environment Configuration](#environment-configuration)
5. [Frontend Implementation](#frontend-implementation)
6. [Backend Implementation](#backend-implementation)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)
9. [Compliance](#compliance)
10. [Best Practices](#best-practices)

---

## Related Documents

| Document                                  | Description                               |
| ----------------------------------------- | ----------------------------------------- |
| [Architecture](./architecture.md)         | System architecture and security overview |
| [Getting Started](./getting-started.md)   | Installation and setup guide              |
| [Deployment](./deployment.md)             | Production deployment configuration       |
| [Environment Variables](./ENVIRONMENT.md) | Complete environment variable reference   |

---

## Overview

SambungChat implements comprehensive security headers to prevent common web vulnerabilities including:

- **XSS (Cross-Site Scripting)** - Prevented by Content-Security-Policy
- **Clickjacking** - Prevented by X-Frame-Options and CSP frame-ancestors
- **MIME-Sniffing** - Prevented by X-Content-Type-Options
- **Man-in-the-Middle** - Prevented by Strict-Transport-Security (HSTS)
- **Unauthorized Browser Features** - Controlled by Permissions-Policy
- **Referrer Leakage** - Controlled by Referrer-Policy
- **Cross-Origin Attacks** - Prevented by Cross-Origin-Opener-Policy

These headers follow **OWASP guidelines** and support **SOC2** and **PCI-DSS** compliance requirements.

### Security Headers Locations

| Service      | Location                                 | Description                        |
| ------------ | ---------------------------------------- | ---------------------------------- |
| **Frontend** | `apps/web/src/lib/security/headers.ts`   | SvelteKit security headers utility |
| **Frontend** | `apps/web/src/hooks.server.ts`           | SvelteKit server hooks integration |
| **Backend**  | `apps/server/src/middleware/security.ts` | Hono middleware for API endpoints  |
| **Backend**  | `apps/server/src/index.ts`               | Hono app middleware registration   |

---

## Implemented Security Headers

### Frontend (SvelteKit)

The following security headers are applied to **all frontend responses**:

| Header                         | Value                                             | Purpose                          |
| ------------------------------ | ------------------------------------------------- | -------------------------------- |
| **Content-Security-Policy**    | `default-src 'self'; script-src 'self'...`        | Prevents XSS attacks             |
| **X-Frame-Options**            | `DENY`                                            | Prevents clickjacking            |
| **X-Content-Type-Options**     | `nosniff`                                         | Prevents MIME-sniffing           |
| **Strict-Transport-Security**  | `max-age=31536000; includeSubDomains; preload`    | Enforces HTTPS (production only) |
| **Permissions-Policy**         | `geolocation=(self), microphone=(), camera=()...` | Controls browser features        |
| **Referrer-Policy**            | `strict-origin-when-cross-origin`                 | Controls referrer information    |
| **Cross-Origin-Opener-Policy** | `same-origin`                                     | Isolates browsing contexts       |

### Backend (Hono API)

The following security headers are applied to **all API responses**:

| Header                           | Value                                         | Purpose                          |
| -------------------------------- | --------------------------------------------- | -------------------------------- |
| **X-Frame-Options**              | `DENY`                                        | Prevents clickjacking            |
| **X-Content-Type-Options**       | `nosniff`                                     | Prevents MIME-sniffing           |
| **Strict-Transport-Security**    | `max-age=31536000; includeSubDomains`         | Enforces HTTPS (production only) |
| **Permissions-Policy**           | `geolocation=(), microphone=(), camera=()...` | Disables all browser features    |
| **Cross-Origin-Resource-Policy** | `same-site`                                   | Controls cross-origin access     |

**Note:** API endpoints do not include CSP, Referrer-Policy, or Cross-Origin-Opener-Policy as these are only relevant for HTML documents.

---

## Content Security Policy (CSP)

Content Security Policy (CSP) is the most critical security header for preventing XSS attacks. It controls which resources the user agent is allowed to load.

### CSP Directives

| Directive                   | Value                                    | Purpose                              |
| --------------------------- | ---------------------------------------- | ------------------------------------ |
| `default-src`               | `'self'`                                 | Default policy for all content types |
| `script-src`                | `'self'` (+ `'unsafe-eval'` in dev)      | Controls script sources              |
| `style-src`                 | `'self' 'unsafe-inline'`                 | Allows inline styles for components  |
| `img-src`                   | `'self' data: https:`                    | Allows images and data URLs          |
| `connect-src`               | `'self' {PUBLIC_API_URL} {KEYCLOAK_URL}` | API endpoints and OAuth              |
| `font-src`                  | `'self'`                                 | Font sources                         |
| `object-src`                | `'none'`                                 | Disallows plugins (Flash, etc.)      |
| `base-uri`                  | `'self'`                                 | Restricts `<base>` tag               |
| `form-action`               | `'self'`                                 | Restricts form submissions           |
| `frame-ancestors`           | `'none'`                                 | Prevents iframe embedding            |
| `upgrade-insecure-requests` | (no value)                               | Upgrades HTTP to HTTPS               |
| `block-all-mixed-content`   | (no value)                               | Blocks HTTP on HTTPS pages           |

### Why `unsafe-inline` for Styles?

The `style-src` directive includes `'unsafe-inline'` because **shadcn-svelte** components use CSS custom properties (CSS variables) defined in inline styles. These are not user-generated content but rather application-defined styling.

**Security Note:** Using `'unsafe-inline'` is acceptable for styles because:

1. Only CSS custom properties are used (not arbitrary styles)
2. No user input is rendered as inline styles
3. All dynamic content is sanitized with DOMPurify

### Development vs Production CSP

**Development CSP:**

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; ...
```

- Includes `'unsafe-eval'` for Vite HMR (Hot Module Replacement)
- Allows dynamic script evaluation during development

**Production CSP:**

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; ...
```

- Does NOT include `'unsafe-eval'`
- More restrictive for better security

### CSP Violation Monitoring

You can enable CSP report-only mode to test policies without blocking resources:

```typescript
// In hooks.server.ts
const headers = getSecurityHeaders({
  cspReportOnly: true, // Monitor violations without blocking
  cspReportUri: '/api/csp-violations', // Optional endpoint
});
```

---

## Environment Configuration

Security headers can be configured through environment variables. All variables are **optional** and have sensible defaults.

### Environment Variables

| Variable                       | Default                           | Description                               |
| ------------------------------ | --------------------------------- | ----------------------------------------- |
| `SECURITY_HEADERS_ENABLED`     | `true` in production              | Global toggle for security headers        |
| `CSP_HEADER`                   | Auto-configured                   | Custom CSP header value                   |
| `CSP_REPORT_ONLY`              | `false`                           | Enable CSP report-only mode for testing   |
| `HSTS_MAX_AGE`                 | `31536000` (1 year)               | HSTS max-age in seconds                   |
| `HSTS_INCLUDE_SUBDOMAINS`      | `true` (production only)          | Apply HSTS to all subdomains              |
| `HSTS_PRELOAD`                 | `false`                           | Allow HSTS preload list inclusion         |
| `X_FRAME_OPTIONS`              | `DENY`                            | X-Frame-Options header value              |
| `X_CONTENT_TYPE_OPTIONS`       | `nosniff`                         | X-Content-Type-Options header value       |
| `REFERRER_POLICY`              | `strict-origin-when-cross-origin` | Referrer-Policy header value              |
| `PERMISSIONS_POLICY`           | Restrictive policy                | Permissions-Policy header value           |
| `CROSS_ORIGIN_OPENER_POLICY`   | `same-origin` (production)        | Cross-Origin-Opener-Policy header value   |
| `CROSS_ORIGIN_RESOURCE_POLICY` | `same-site`                       | Cross-Origin-Resource-Policy header value |

### Example Configuration

**apps/server/.env:**

```bash
# Security Headers Configuration
NODE_ENV=production

# HSTS Configuration
HSTS_MAX_AGE=31536000
HSTS_INCLUDE_SUBDOMAINS=true
HSTS_PRELOAD=true

# CSP Configuration
CSP_REPORT_ONLY=false

# Browser Features
PERMISSIONS_POLICY=geolocation=(self), microphone=(), camera=()
```

---

## Frontend Implementation

### Security Headers Utility

Location: `apps/web/src/lib/security/headers.ts`

```typescript
import { getSecurityHeaders } from '$lib/security/headers';

// Get all security headers
const headers = getSecurityHeaders({
  cspReportOnly: false,
  includeHSTS: true,
});

// Returns:
// {
//   'Content-Security-Policy': 'default-src \'self\'; ...',
//   'X-Frame-Options': 'DENY',
//   'X-Content-Type-Options': 'nosniff',
//   'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
//   'Permissions-Policy': 'geolocation=(self), ...',
//   'Referrer-Policy': 'strict-origin-when-cross-origin',
//   'Cross-Origin-Opener-Policy': 'same-origin'
// }
```

### Server Hooks Integration

Location: `apps/web/src/hooks.server.ts`

```typescript
import { getSecurityHeaders } from '$lib/security/headers';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  // Apply security headers to all responses
  const headers = getSecurityHeaders();
  for (const [name, value] of Object.entries(headers)) {
    response.headers.set(name, value);
  }

  return response;
};
```

### Key Implementation Details

1. **Automatic HSTS Detection** - HSTS is only enabled in `NODE_ENV=production`
2. **Environment-Aware CSP** - Development CSP includes `'unsafe-eval'` for Vite HMR
3. **Consistent Application** - Headers are applied to **all responses** including redirects and errors
4. **No CSP on API** - API endpoints do not set CSP (not applicable to JSON responses)

---

## Backend Implementation

### Security Middleware

Location: `apps/server/src/middleware/security.ts`

```typescript
import { securityMiddleware } from './middleware/security';

// Apply to all routes
app.use('/*', securityMiddleware());

// Or with custom configuration
app.use(
  '/*',
  securityMiddleware({
    includeHSTS: true, // Override auto-detection
  })
);
```

### Middleware Registration

Location: `apps/server/src/index.ts`

```typescript
import { securityMiddleware } from './middleware/security';
import { cors } from 'hono/cors';

// Correct middleware order:
// 1. CORS (must be first)
app.use(
  '/*',
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// 2. Security headers (after CORS)
app.use('/*', securityMiddleware());

// 3. Auth middleware
app.use('/*', authMiddleware);

// 4. Route handlers
app.route('/rpc', rpcRouter);
```

### Key Implementation Details

1. **Middleware Order** - Security headers are applied **after CORS** but **before auth**
2. **All HTTP Methods** - Headers are applied to GET, POST, PUT, DELETE, etc.
3. **Error Responses** - Headers are applied even when routes return errors
4. **Production HSTS** - HSTS is only enabled in `NODE_ENV=production`
5. **No CSP** - API endpoints do not include CSP (not applicable to JSON)

---

## Testing & Verification

### Manual Browser Verification

**1. Start Development Server:**

```bash
bun run dev:web    # Frontend
bun run dev:server # Backend
```

**2. Open Browser DevTools:**

- Chrome/Edge: `F12` → Network tab → Refresh page
- Firefox: `F12` → Network tab → Refresh page

**3. Check Response Headers:**

- Click on the main document request
- Look for the "Headers" tab
- Verify all security headers are present

**Expected Frontend Headers:**

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Permissions-Policy: geolocation=(self), microphone=(), camera=(), ...
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Opener-Policy: same-origin
```

**Expected Backend Headers:**

```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Permissions-Policy: geolocation=(), microphone=(), camera=(), ...
Cross-Origin-Resource-Policy: same-site
```

### Command Line Verification

**Check Frontend Headers:**

```bash
curl -I http://localhost:5174
```

**Check Backend Headers:**

```bash
curl -I http://localhost:3000/debug
```

**Expected Output:**

```http
HTTP/1.1 200 OK
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Permissions-Policy: geolocation=(), microphone=(), ...
```

### Browser Console CSP Check

Open browser console and check for CSP violations:

```javascript
// Should see NO CSP violations in production
// If you see errors, they indicate blocked resources
```

### Online Security Scanners

**Mozilla Observatory:**

- URL: <https://observatory.mozilla.org/>
- Expected Score: **A+ (100+)** for frontend, **A or B (80+)** for backend
- Tests: CSP, HSTS, X-Frame-Options, X-Content-Type-Options

**Security Headers.com:**

- URL: <https://securityheaders.com/>
- Expected Score: **A**
- Tests: All security headers implementation

**SSL Labs (for HSTS):**

- URL: <https://www.ssllabs.com/ssltest/>
- Expected: HSTS properly configured with max-age ≥ 31536000

### Unit Tests

Security headers are covered by comprehensive unit tests:

```bash
# Run all tests
bun run test

# Run security headers tests only
bun run test -- security
```

**Test Coverage:**

- ✅ Frontend: 74 tests (all header constants, CSP generation, HSTS, Permissions-Policy)
- ✅ Backend: 70 tests (middleware application, header getters, OWASP compliance)
- ✅ Total: **144 tests passing**

---

## Troubleshooting

### Common Issues

#### Issue: "CSP blocked inline script"

**Problem:** Browser console shows CSP violation for inline scripts.

**Solution:**

1. Check if you're using inline `<script>` tags in Svelte components
2. Move scripts to separate `.js` files
3. Or use nonce-based CSP (advanced)

```svelte
<!-- ❌ WRONG: Inline script -->
<script>
  dangerousCode();
</script>

<!-- ✅ RIGHT: External script -->
<script src="/utils.js"></script>
```

#### Issue: "CSP blocked inline style"

**Problem:** Styles not loading due to CSP.

**Solution:**

1. Check if `'unsafe-inline'` is in `style-src`
2. Verify CSS custom properties are used correctly
3. Check if user input is being rendered as styles (security risk!)

```typescript
// ❌ WRONG: User input as inline style
<div style={`color: ${userInput}`}>...</div>

// ✅ RIGHT: CSS classes or CSS variables
<div class={userColorClass}>...</div>
```

#### Issue: "HSTS breaking local development"

**Problem:** Can't access `http://localhost` due to HSTS.

**Solution:**

1. HSTS should NOT be enabled in development
2. Check `NODE_ENV` is not set to `production`
3. Clear browser HSTS cache:

```bash
# Chrome/Edge
chrome://net-internals/#hsts

# Firefox
Clear browser history → Site settings
```

#### Issue: "API requests blocked by CORS"

**Problem:** Frontend cannot connect to backend API.

**Solution:**

1. Check `connect-src` in CSP includes backend URL
2. Verify `PUBLIC_API_URL` environment variable
3. Ensure CORS is configured correctly in backend

```bash
# Check CSP connect-src
curl -I http://localhost:5173 | grep -i 'content-security-policy'

# Should include: http://localhost:3000 (or your API URL)
```

#### Issue: "OAuth login not working"

**Problem:** Keycloak OAuth flow fails.

**Solution:**

1. Check `connect-src` includes Keycloak URL
2. Verify `KEYCLOAK_URL` environment variable
3. Ensure `frame-src` allows OAuth redirects (if needed)

```bash
# Check environment variables
echo $KEYCLOAK_URL
echo $PUBLIC_API_URL
```

#### Issue: "Missing security headers in production"

**Problem:** Headers present in dev but not in production.

**Solution:**

1. Check `NODE_ENV=production` is set
2. Verify reverse proxy is not stripping headers
3. Check if CDN/proxy is overriding headers

```nginx
# If using Nginx, ensure headers are passed
proxy_pass_header X-Frame-Options;
proxy_pass_header X-Content-Type-Options;
proxy_pass_header Strict-Transport-Security;
```

### Debug Mode

Enable CSP report-only mode to test without blocking:

```typescript
// apps/web/src/hooks.server.ts
const headers = getSecurityHeaders({
  cspReportOnly: true, // Report violations but don't block
  cspReportUri: '/api/csp-violations',
});
```

Then check browser console for CSP violations without breaking functionality.

---

## Compliance

### OWASP Compliance

| Header                    | OWASP Recommendation  | Implementation |
| ------------------------- | --------------------- | -------------- |
| Content-Security-Policy   | Required              | ✅ Implemented |
| X-Frame-Options           | Required              | ✅ Implemented |
| X-Content-Type-Options    | Required              | ✅ Implemented |
| Strict-Transport-Security | Required (HTTPS only) | ✅ Implemented |
| Permissions-Policy        | Recommended           | ✅ Implemented |
| Referrer-Policy           | Recommended           | ✅ Implemented |

### SOC2 Compliance

| Control                          | Mapping                 |
| -------------------------------- | ----------------------- |
| **CC6.1** - Network Security     | HSTS, X-Frame-Options   |
| **CC6.6** - Data Integrity       | X-Content-Type-Options  |
| **CC7.2** - Application Security | CSP, Permissions-Policy |

### PCI-DSS Compliance

| Requirement                       | Mapping                               |
| --------------------------------- | ------------------------------------- |
| **4.1.1** - Strong Cryptography   | HSTS enforces HTTPS                   |
| **6.5.7** - XSS Prevention        | CSP prevents XSS attacks              |
| **6.5.9** - Security Controls     | X-Frame-Options prevents clickjacking |
| **8.2.3** - Secure Authentication | Permissions-Policy restricts features |

---

## Best Practices

### Development

1. **Use CSP Report-Only Mode** - Test CSP policies without blocking
2. **Monitor Console** - Check for CSP violations during development
3. **Local HTTP Only** - HSTS should be disabled in development
4. **Test OAuth Flow** - Verify Keycloak authentication works with CSP

### Production

1. **Enforce HTTPS** - Enable HSTS with max-age ≥ 31536000
2. **Monitor CSP Reports** - Set up CSP violation logging
3. **Regular Audits** - Use online scanners to verify configuration
4. **Keep Updated** - Review OWASP guidelines quarterly

### Security Hardening

1. **Nonce-Based CSP** - Replace `'unsafe-inline'` with nonces (advanced)
2. **CSP Report Endpoint** - Collect and monitor CSP violations
3. **HSTS Preload** - Submit to HSTS preload list for better security
4. **Subdomain Isolation** - Apply strict policies to subdomains

### Monitoring

1. **Set Up CSP Violation Logging:**

```typescript
// Add CSP report endpoint
app.post('/api/csp-violations', async (c) => {
  const violation = await c.req.json();
  // Log to monitoring service (Sentry, DataDog, etc.)
  console.error('CSP Violation:', violation);
  return c.json({ received: true });
});
```

2. **Monitor Security Headers:**

```bash
# Add to CI/CD pipeline
curl -I https://your-domain.com | grep -E '(X-Frame-Options|Content-Security-Policy|Strict-Transport-Security)'
```

---

## Additional Resources

### Documentation

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN: HTTP Strict Transport Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

### Tools

- [Mozilla Observatory](https://observatory.mozilla.org/) - Security header scanner
- [Security Headers.com](https://securityheaders.com/) - Quick security check
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - CSP policy analysis
- [SSL Labs](https://www.ssllabs.com/ssltest/) - SSL/TLS and HSTS testing

### Standards

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [SOC2 Compliance](https://www.aicpa.org/soc4so)
- [PCI-DSS Requirements](https://www.pcisecuritystandards.org/)

---

"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."
