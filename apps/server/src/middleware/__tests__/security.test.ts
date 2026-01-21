/**
 * Security Middleware Tests for Hono API Server
 *
 * Tests for the security headers middleware
 * Run with: bun test apps/server/src/middleware/__tests__/security.test.ts
 */

// Vitest globals enabled - no imports needed
import { Hono } from 'hono';
import { securityMiddleware } from '../security';
import {
  getXFrameOptionsHeader,
  getXContentTypeOptionsHeader,
  getHSTSHeaderValue,
  getPermissionsPolicyHeaderValue,
  getCrossOriginResourcePolicyHeader,
} from '../security';

describe('Security Middleware - Individual Header Getters', () => {
  describe('getXFrameOptionsHeader', () => {
    it('should return DENY', () => {
      const header = getXFrameOptionsHeader();

      expect(header).toBe('DENY');
    });

    it('should return string type', () => {
      const header = getXFrameOptionsHeader();

      expect(header).toBeTypeOf('string');
    });
  });

  describe('getXContentTypeOptionsHeader', () => {
    it('should return nosniff', () => {
      const header = getXContentTypeOptionsHeader();

      expect(header).toBe('nosniff');
    });

    it('should return string type', () => {
      const header = getXContentTypeOptionsHeader();

      expect(header).toBeTypeOf('string');
    });
  });

  describe('getHSTSHeaderValue', () => {
    beforeEach(() => {
      // Reset NODE_ENV before each test
      delete process.env.NODE_ENV;
    });

    it('should return HSTS header in production', () => {
      process.env.NODE_ENV = 'production';
      const header = getHSTSHeaderValue();

      expect(header).toBe('max-age=31536000; includeSubDomains');
    });

    it('should return null in development', () => {
      process.env.NODE_ENV = 'development';
      const header = getHSTSHeaderValue();

      expect(header).toBeNull();
    });

    it('should return null in test environment', () => {
      process.env.NODE_ENV = 'test';
      const header = getHSTSHeaderValue();

      expect(header).toBeNull();
    });

    it('should return null when NODE_ENV is undefined', () => {
      const header = getHSTSHeaderValue();

      expect(header).toBeNull();
    });

    it('should include max-age of 1 year in production', () => {
      process.env.NODE_ENV = 'production';
      const header = getHSTSHeaderValue();

      expect(header).toContain('max-age=31536000');
    });

    it('should include includeSubDomains in production', () => {
      process.env.NODE_ENV = 'production';
      const header = getHSTSHeaderValue();

      expect(header).toContain('includeSubDomains');
    });

    it('should not include preload directive', () => {
      process.env.NODE_ENV = 'production';
      const header = getHSTSHeaderValue();

      expect(header).not.toContain('preload');
    });
  });

  describe('getPermissionsPolicyHeaderValue', () => {
    it('should return Permissions-Policy header', () => {
      const policy = getPermissionsPolicyHeaderValue();

      expect(policy).toBeTypeOf('string');
      expect(policy.length).toBeGreaterThan(0);
    });

    it('should disable geolocation', () => {
      const policy = getPermissionsPolicyHeaderValue();

      expect(policy).toContain('geolocation=()');
    });

    it('should disable microphone', () => {
      const policy = getPermissionsPolicyHeaderValue();

      expect(policy).toContain('microphone=()');
    });

    it('should disable camera', () => {
      const policy = getPermissionsPolicyHeaderValue();

      expect(policy).toContain('camera=()');
    });

    it('should disable payment', () => {
      const policy = getPermissionsPolicyHeaderValue();

      expect(policy).toContain('payment=()');
    });

    it('should disable USB', () => {
      const policy = getPermissionsPolicyHeaderValue();

      expect(policy).toContain('usb=()');
    });

    it('should disable magnetometer', () => {
      const policy = getPermissionsPolicyHeaderValue();

      expect(policy).toContain('magnetometer=()');
    });

    it('should disable gyroscope', () => {
      const policy = getPermissionsPolicyHeaderValue();

      expect(policy).toContain('gyroscope=()');
    });

    it('should disable speaker-selection', () => {
      const policy = getPermissionsPolicyHeaderValue();

      expect(policy).toContain('speaker-selection=()');
    });

    it('should disable VR', () => {
      const policy = getPermissionsPolicyHeaderValue();

      expect(policy).toContain('vr=()');
    });

    it('should disable XR', () => {
      const policy = getPermissionsPolicyHeaderValue();

      expect(policy).toContain('xr=()');
    });

    it('should join policies with comma and space', () => {
      const policy = getPermissionsPolicyHeaderValue();

      // Should start with first policy and have comma-separated list
      expect(policy).toMatch(/^[^,\s]+=\(\)(,\s[^,\s]+=\(\))*$/);
    });
  });

  describe('getCrossOriginResourcePolicyHeader', () => {
    it('should return same-site', () => {
      const header = getCrossOriginResourcePolicyHeader();

      expect(header).toBe('same-site');
    });

    it('should return string type', () => {
      const header = getCrossOriginResourcePolicyHeader();

      expect(header).toBeTypeOf('string');
    });
  });
});

describe('Security Middleware - Hono Integration', () => {
  beforeEach(() => {
    // Reset NODE_ENV before each test
    process.env.NODE_ENV = 'test';
  });

  describe('Middleware Application', () => {
    it('should be a function', () => {
      expect(securityMiddleware).toBeTypeOf('function');
    });

    it('should return a middleware handler', () => {
      const middleware = securityMiddleware();

      expect(middleware).toBeTypeOf('function');
    });

    it('should accept config object', () => {
      const middleware = securityMiddleware({ includeHSTS: false });

      expect(middleware).toBeTypeOf('function');
    });

    it('should accept empty config', () => {
      const middleware = securityMiddleware({});

      expect(middleware).toBeTypeOf('function');
    });

    it('should accept undefined config', () => {
      const middleware = securityMiddleware(undefined);

      expect(middleware).toBeTypeOf('function');
    });
  });

  describe('Header Application', () => {
    it('should apply X-Frame-Options header to response', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({ message: 'test' }));

      const res = await app.request('/test');

      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should apply X-Content-Type-Options header to response', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({ message: 'test' }));

      const res = await app.request('/test');

      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should apply Permissions-Policy header to response', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({ message: 'test' }));

      const res = await app.request('/test');

      const permissionsPolicy = res.headers.get('Permissions-Policy');
      expect(permissionsPolicy).toBeDefined();
      expect(permissionsPolicy).toContain('geolocation=()');
      expect(permissionsPolicy).toContain('microphone=()');
      expect(permissionsPolicy).toContain('camera=()');
    });

    it('should apply Cross-Origin-Resource-Policy header to response', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({ message: 'test' }));

      const res = await app.request('/test');

      expect(res.headers.get('Cross-Origin-Resource-Policy')).toBe('same-site');
    });

    it('should not apply HSTS header in test environment', async () => {
      process.env.NODE_ENV = 'test';

      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({ message: 'test' }));

      const res = await app.request('/test');

      expect(res.headers.get('Strict-Transport-Security')).toBeNull();
    });

    it('should not apply HSTS header in development', async () => {
      process.env.NODE_ENV = 'development';

      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({ message: 'test' }));

      const res = await app.request('/test');

      expect(res.headers.get('Strict-Transport-Security')).toBeNull();
    });

    it('should apply HSTS header in production', async () => {
      process.env.NODE_ENV = 'production';

      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({ message: 'test' }));

      const res = await app.request('/test');

      expect(res.headers.get('Strict-Transport-Security')).toBe(
        'max-age=31536000; includeSubDomains'
      );
    });
  });

  describe('Configuration Options', () => {
    it('should respect includeHSTS: false', async () => {
      process.env.NODE_ENV = 'production';

      const app = new Hono();
      app.use('/*', securityMiddleware({ includeHSTS: false }));
      app.get('/test', (c) => c.json({ message: 'test' }));

      const res = await app.request('/test');

      expect(res.headers.get('Strict-Transport-Security')).toBeNull();
    });

    it('should respect includeHSTS: true in production', async () => {
      process.env.NODE_ENV = 'production';

      const app = new Hono();
      app.use('/*', securityMiddleware({ includeHSTS: true }));
      app.get('/test', (c) => c.json({ message: 'test' }));

      const res = await app.request('/test');

      expect(res.headers.get('Strict-Transport-Security')).toBe(
        'max-age=31536000; includeSubDomains'
      );
    });

    it('should auto-detect production when includeHSTS is undefined', async () => {
      process.env.NODE_ENV = 'production';

      const app = new Hono();
      app.use('/*', securityMiddleware({ includeHSTS: undefined }));
      app.get('/test', (c) => c.json({ message: 'test' }));

      const res = await app.request('/test');

      expect(res.headers.get('Strict-Transport-Security')).toBe(
        'max-age=31536000; includeSubDomains'
      );
    });

    it('should auto-detect non-production when includeHSTS is undefined', async () => {
      process.env.NODE_ENV = 'development';

      const app = new Hono();
      app.use('/*', securityMiddleware({ includeHSTS: undefined }));
      app.get('/test', (c) => c.json({ message: 'test' }));

      const res = await app.request('/test');

      expect(res.headers.get('Strict-Transport-Security')).toBeNull();
    });
  });

  describe('Multiple Routes', () => {
    it('should apply headers to all routes', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());

      app.get('/api/test', (c) => c.json({ endpoint: 'test' }));
      app.get('/api/health', (c) => c.json({ status: 'ok' }));
      app.post('/api/data', (c) => c.json({ created: true }));

      const res1 = await app.request('/api/test');
      const res2 = await app.request('/api/health');
      const res3 = await app.request('/api/data', { method: 'POST' });

      // All responses should have security headers
      expect(res1.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res2.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res3.headers.get('X-Frame-Options')).toBe('DENY');

      expect(res1.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res2.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res3.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should apply headers to nested routes', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());

      app.get('/api/v1/test', (c) => c.json({ version: 1 }));
      app.get('/api/v2/test', (c) => c.json({ version: 2 }));

      const res1 = await app.request('/api/v1/test');
      const res2 = await app.request('/api/v2/test');

      expect(res1.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res2.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });

  describe('Error Responses', () => {
    it('should apply headers to error responses', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => {
        return c.json({ error: 'Not found' }, 404);
      });

      const res = await app.request('/test');

      expect(res.status).toBe(404);
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should apply headers to 500 errors', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => {
        return c.json({ error: 'Server error' }, 500);
      });

      const res = await app.request('/test');

      expect(res.status).toBe(500);
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  describe('Different HTTP Methods', () => {
    it('should apply headers to GET requests', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({ method: 'GET' }));

      const res = await app.request('/test');

      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should apply headers to POST requests', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.post('/test', (c) => c.json({ method: 'POST' }));

      const res = await app.request('/test', { method: 'POST' });

      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should apply headers to PUT requests', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.put('/test', (c) => c.json({ method: 'PUT' }));

      const res = await app.request('/test', { method: 'PUT' });

      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should apply headers to DELETE requests', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.delete('/test', (c) => c.json({ method: 'DELETE' }));

      const res = await app.request('/test', { method: 'DELETE' });

      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should apply headers to PATCH requests', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.patch('/test', (c) => c.json({ method: 'PATCH' }));

      const res = await app.request('/test', { method: 'PATCH' });

      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });

  describe('Middleware Chain', () => {
    it('should work with other middleware', async () => {
      const app = new Hono();

      // Add a custom middleware before security middleware
      app.use('/*', async (c, next) => {
        c.header('X-Custom-Header', 'custom-value');
        await next();
      });

      // Add security middleware
      app.use('/*', securityMiddleware());

      app.get('/test', (c) => c.json({ message: 'test' }));

      const res = await app.request('/test');

      // Both headers should be present
      expect(res.headers.get('X-Custom-Header')).toBe('custom-value');
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should work when security middleware is first', async () => {
      const app = new Hono();

      // Add security middleware first
      app.use('/*', securityMiddleware());

      // Add a custom middleware after
      app.use('/*', async (c, next) => {
        c.header('X-Custom-Header', 'custom-value');
        await next();
      });

      app.get('/test', (c) => c.json({ message: 'test' }));

      const res = await app.request('/test');

      // Both headers should be present
      expect(res.headers.get('X-Custom-Header')).toBe('custom-value');
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });
});

describe('Security Middleware Compliance', () => {
  describe('OWASP Compliance', () => {
    it('should include X-Frame-Options for clickjacking protection', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({}));

      const res = await app.request('/test');

      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should include X-Content-Type-Options for MIME-sniffing protection', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({}));

      const res = await app.request('/test');

      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should include HSTS in production for HTTPS enforcement', async () => {
      process.env.NODE_ENV = 'production';

      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({}));

      const res = await app.request('/test');

      expect(res.headers.get('Strict-Transport-Security')).toBeDefined();
    });
  });

  describe('API-Specific Headers', () => {
    it('should not include CSP header (API endpoints do not render HTML)', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({}));

      const res = await app.request('/test');

      expect(res.headers.get('Content-Security-Policy')).toBeNull();
    });

    it('should not include Referrer-Policy header (not applicable for APIs)', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({}));

      const res = await app.request('/test');

      expect(res.headers.get('Referrer-Policy')).toBeNull();
    });

    it('should not include Cross-Origin-Opener-Policy header (for HTML documents only)', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({}));

      const res = await app.request('/test');

      expect(res.headers.get('Cross-Origin-Opener-Policy')).toBeNull();
    });

    it('should include Cross-Origin-Resource-Policy for API responses', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({}));

      const res = await app.request('/test');

      expect(res.headers.get('Cross-Origin-Resource-Policy')).toBe('same-site');
    });

    it('should include Permissions-Policy to disable browser features', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({}));

      const res = await app.request('/test');

      const policy = res.headers.get('Permissions-Policy');
      expect(policy).toBeDefined();
      expect(policy).toContain('geolocation=()');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('camera=()');
    });
  });

  describe('Security Best Practices', () => {
    it('should prevent iframe embedding', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({}));

      const res = await app.request('/test');

      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should prevent MIME-sniffing attacks', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({}));

      const res = await app.request('/test');

      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should control cross-origin access to API responses', async () => {
      const app = new Hono();
      app.use('/*', securityMiddleware());
      app.get('/test', (c) => c.json({}));

      const res = await app.request('/test');

      expect(res.headers.get('Cross-Origin-Resource-Policy')).toBe('same-site');
    });
  });
});

describe('Edge Cases', () => {
  it('should handle empty response body', async () => {
    const app = new Hono();
    app.use('/*', securityMiddleware());
    app.get('/test', (c) => c.text(''));

    const res = await app.request('/test');

    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('should handle response with custom headers', async () => {
    const app = new Hono();
    app.use('/*', securityMiddleware());
    app.get('/test', (c) => {
      c.header('X-Custom-Header', 'custom-value');
      return c.json({ message: 'test' });
    });

    const res = await app.request('/test');

    // Both custom and security headers should be present
    expect(res.headers.get('X-Custom-Header')).toBe('custom-value');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('should handle concurrent requests', async () => {
    const app = new Hono();
    app.use('/*', securityMiddleware());
    app.get('/test', (c) => c.json({ message: 'test' }));

    // Make multiple concurrent requests
    const requests = Array.from({ length: 10 }, () => app.request('/test'));
    const responses = await Promise.all(requests);

    // All responses should have security headers
    responses.forEach((res) => {
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('Permissions-Policy')).toBeDefined();
      expect(res.headers.get('Cross-Origin-Resource-Policy')).toBe('same-site');
    });
  });

  it('should handle different response types', async () => {
    const app = new Hono();
    app.use('/*', securityMiddleware());

    app.get('/json', (c) => c.json({ type: 'json' }));
    app.get('/text', (c) => c.text('text'));
    app.get('/html', (c) => c.html('<html></html>'));

    const resJson = await app.request('/json');
    const resText = await app.request('/text');
    const resHtml = await app.request('/html');

    // All should have security headers
    expect(resJson.headers.get('X-Frame-Options')).toBe('DENY');
    expect(resText.headers.get('X-Frame-Options')).toBe('DENY');
    expect(resHtml.headers.get('X-Frame-Options')).toBe('DENY');
  });
});

describe('Middleware Behavior', () => {
  it('should not modify response body', async () => {
    const app = new Hono();
    app.use('/*', securityMiddleware());
    app.get('/test', (c) => c.json({ message: 'test', data: [1, 2, 3] }));

    const res = await app.request('/test');
    const body = await res.json();

    expect(body).toEqual({ message: 'test', data: [1, 2, 3] });
  });

  it('should not modify response status', async () => {
    const app = new Hono();
    app.use('/*', securityMiddleware());
    app.get('/test', (c) => c.json({ message: 'test' }, 201));

    const res = await app.request('/test');

    expect(res.status).toBe(201);
  });

  it('should preserve other middleware headers', async () => {
    const app = new Hono();

    app.use('/*', async (c, next) => {
      c.header('X-Before', 'before');
      await next();
      c.header('X-After', 'after');
    });

    app.use('/*', securityMiddleware());

    app.get('/test', (c) => c.json({ message: 'test' }));

    const res = await app.request('/test');

    expect(res.headers.get('X-Before')).toBe('before');
    expect(res.headers.get('X-After')).toBe('after');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });
});
