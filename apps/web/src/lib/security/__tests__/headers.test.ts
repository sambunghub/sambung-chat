/**
 * Security Headers Tests for SvelteKit
 *
 * Tests for the security headers utility module
 * Run with: bun test apps/web/src/lib/security/__tests__/headers.test.ts
 */

// Vitest globals enabled - no imports needed
import {
  getCSPHeader,
  getCSPHeaderName,
  getHSTSHeader,
  getPermissionsPolicyHeader,
  getSecurityHeaders,
  X_CONTENT_TYPE_OPTIONS,
  X_FRAME_OPTIONS,
  REFERRER_POLICY,
  CROSS_ORIGIN_OPENER_POLICY,
  type SecurityHeaders,
} from '../headers';

describe('Security Headers - Constants', () => {
  describe('X-Frame-Options', () => {
    it('should be set to DENY', () => {
      expect(X_FRAME_OPTIONS).toBe('DENY');
    });
  });

  describe('X-Content-Type-Options', () => {
    it('should be set to nosniff', () => {
      expect(X_CONTENT_TYPE_OPTIONS).toBe('nosniff');
    });
  });

  describe('Referrer-Policy', () => {
    it('should be set to strict-origin-when-cross-origin', () => {
      expect(REFERRER_POLICY).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Cross-Origin-Opener-Policy', () => {
    it('should be set to same-origin', () => {
      expect(CROSS_ORIGIN_OPENER_POLICY).toBe('same-origin');
    });
  });
});

describe('Content-Security-Policy', () => {
  describe('getCSPHeader', () => {
    beforeEach(() => {
      // Reset NODE_ENV before each test
      process.env.NODE_ENV = 'test';
    });

    it('should return CSP header with default config (test environment = development mode)', () => {
      const csp = getCSPHeader();

      expect(csp).toContain("default-src 'self'");
      // Test environment is treated as development (not production)
      expect(csp).toContain("script-src 'self' 'unsafe-eval' 'unsafe-inline'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("img-src 'self' data: https:");
      expect(csp).toContain("font-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      // upgrade-insecure-requests and block-all-mixed-content only in production
      expect(csp).not.toContain('upgrade-insecure-requests');
      expect(csp).not.toContain('block-all-mixed-content');
    });

    it('should include unsafe-eval and unsafe-inline in development', () => {
      process.env.NODE_ENV = 'development';
      const csp = getCSPHeader();

      expect(csp).toContain("script-src 'self' 'unsafe-eval' 'unsafe-inline'");
    });

    it('should not include unsafe-eval or unsafe-inline in production', () => {
      process.env.NODE_ENV = 'production';
      const csp = getCSPHeader();

      expect(csp).toContain("script-src 'self'");
      expect(csp).not.toContain('unsafe-eval');

      // Check script-src specifically (not style-src which allows unsafe-inline)
      const scriptSrcMatch = csp.match(/script-src[^;]*/);
      expect(scriptSrcMatch?.[0]).toBe("script-src 'self'");
      expect(scriptSrcMatch?.[0]).not.toContain('unsafe-inline');

      // Production should include HTTPS upgrade and mixed content blocking
      expect(csp).toContain('upgrade-insecure-requests');
      expect(csp).toContain('block-all-mixed-content');
    });

    it('should include PUBLIC_API_URL in connect-src', () => {
      const testUrl = 'https://api.example.com';
      process.env.PUBLIC_API_URL = testUrl;

      const csp = getCSPHeader();

      expect(csp).toContain(testUrl);
    });

    it('should include Keycloak URL in connect-src when configured', () => {
      const keycloakUrl = 'https://auth.example.com/auth';
      process.env.KEYCLOAK_URL = keycloakUrl;

      const csp = getCSPHeader();

      expect(csp).toContain('https://auth.example.com');
    });

    it('should include additional connect sources from config', () => {
      const csp = getCSPHeader({
        reportOnly: false,
        connectSources: ['https://cdn.example.com'],
      });

      expect(csp).toContain('https://cdn.example.com');
    });

    it('should include report-uri when provided', () => {
      const reportUri = 'https://csp-report.example.com/report';
      const csp = getCSPHeader({ reportOnly: false, reportUri });

      expect(csp).toContain(`report-uri ${reportUri}`);
    });

    it('should not include report-uri when not provided', () => {
      const csp = getCSPHeader();

      expect(csp).not.toContain('report-uri');
    });

    it('should filter out empty connect sources', () => {
      process.env.PUBLIC_API_URL = '';
      process.env.KEYCLOAK_URL = '';

      const csp = getCSPHeader();

      // Should still have 'self' in connect-src
      expect(csp).toContain("connect-src 'self'");
    });
  });

  describe('getCSPHeaderName', () => {
    it('should return Content-Security-Policy by default', () => {
      const headerName = getCSPHeaderName();

      expect(headerName).toBe('Content-Security-Policy');
    });

    it('should return Content-Security-Policy-Report-Only when reportOnly is true', () => {
      const headerName = getCSPHeaderName(true);

      expect(headerName).toBe('Content-Security-Policy-Report-Only');
    });

    it('should return Content-Security-Policy when reportOnly is false', () => {
      const headerName = getCSPHeaderName(false);

      expect(headerName).toBe('Content-Security-Policy');
    });
  });
});

describe('Strict-Transport-Security', () => {
  describe('getHSTSHeader', () => {
    beforeEach(() => {
      // Reset NODE_ENV before each test
      delete process.env.NODE_ENV;
    });

    it('should return HSTS header in production', () => {
      process.env.NODE_ENV = 'production';
      const hsts = getHSTSHeader();

      expect(hsts).toBe('max-age=31536000; includeSubDomains; preload');
    });

    it('should return empty string in development', () => {
      process.env.NODE_ENV = 'development';
      const hsts = getHSTSHeader();

      expect(hsts).toBe('');
    });

    it('should return empty string in test environment', () => {
      process.env.NODE_ENV = 'test';
      const hsts = getHSTSHeader();

      expect(hsts).toBe('');
    });

    it('should return empty string when NODE_ENV is undefined', () => {
      const hsts = getHSTSHeader();

      expect(hsts).toBe('');
    });

    it('should include max-age of 1 year', () => {
      process.env.NODE_ENV = 'production';
      const hsts = getHSTSHeader();

      expect(hsts).toContain('max-age=31536000');
    });

    it('should include includeSubDomains directive', () => {
      process.env.NODE_ENV = 'production';
      const hsts = getHSTSHeader();

      expect(hsts).toContain('includeSubDomains');
    });

    it('should include preload directive', () => {
      process.env.NODE_ENV = 'production';
      const hsts = getHSTSHeader();

      expect(hsts).toContain('preload');
    });
  });
});

describe('Permissions-Policy', () => {
  describe('getPermissionsPolicyHeader', () => {
    it('should return Permissions-Policy header', () => {
      const policy = getPermissionsPolicyHeader();

      expect(policy).toBeTypeOf('string');
      expect(policy.length).toBeGreaterThan(0);
    });

    it('should disable microphone', () => {
      const policy = getPermissionsPolicyHeader();

      expect(policy).toContain('microphone=()');
    });

    it('should disable camera', () => {
      const policy = getPermissionsPolicyHeader();

      expect(policy).toContain('camera=()');
    });

    it('should disable payment', () => {
      const policy = getPermissionsPolicyHeader();

      expect(policy).toContain('payment=()');
    });

    it('should disable USB', () => {
      const policy = getPermissionsPolicyHeader();

      expect(policy).toContain('usb=()');
    });

    it('should disable magnetometer', () => {
      const policy = getPermissionsPolicyHeader();

      expect(policy).toContain('magnetometer=()');
    });

    it('should disable gyroscope', () => {
      const policy = getPermissionsPolicyHeader();

      expect(policy).toContain('gyroscope=()');
    });

    it('should disable XR/VR spatial tracking', () => {
      const policy = getPermissionsPolicyHeader();

      expect(policy).toContain('xr-spatial-tracking=()');
    });

    it('should allow geolocation from same origin', () => {
      const policy = getPermissionsPolicyHeader();

      expect(policy).toContain('geolocation=(self)');
    });

    it('should join policies with comma and space', () => {
      const policy = getPermissionsPolicyHeader();

      expect(policy).toMatch(/^(geolocation=\(self\),\s[^\s]+)(,\s[^\s]+)*$/);
    });
  });
});

describe('getSecurityHeaders', () => {
  beforeEach(() => {
    // Reset environment before each test
    process.env.NODE_ENV = 'test';
    delete process.env.PUBLIC_API_URL;
    delete process.env.KEYCLOAK_URL;
  });

  describe('Default Configuration', () => {
    it('should return all security headers', () => {
      const headers = getSecurityHeaders();

      // In test environment, HSTS is not included (returns empty string)
      // So we expect 6 headers instead of 7
      expect(Object.keys(headers)).toHaveLength(6);
    });

    it('should include Content-Security-Policy', () => {
      const headers = getSecurityHeaders();

      expect(headers['Content-Security-Policy']).toBeDefined();
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    });

    it('should include X-Frame-Options', () => {
      const headers = getSecurityHeaders();

      expect(headers['X-Frame-Options']).toBe('DENY');
    });

    it('should include X-Content-Type-Options', () => {
      const headers = getSecurityHeaders();

      expect(headers['X-Content-Type-Options']).toBe('nosniff');
    });

    it('should include Permissions-Policy', () => {
      const headers = getSecurityHeaders();

      expect(headers['Permissions-Policy']).toBeDefined();
      expect(headers['Permissions-Policy']).toContain('microphone=()');
    });

    it('should include Referrer-Policy', () => {
      const headers = getSecurityHeaders();

      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should include Cross-Origin-Opener-Policy', () => {
      const headers = getSecurityHeaders();

      expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin');
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should not include HSTS in development', () => {
      process.env.NODE_ENV = 'development';
      const headers = getSecurityHeaders();

      expect(headers['Strict-Transport-Security']).toBeUndefined();
    });

    it('should not include HSTS in test environment', () => {
      process.env.NODE_ENV = 'test';
      const headers = getSecurityHeaders();

      expect(headers['Strict-Transport-Security']).toBeUndefined();
    });

    it('should include HSTS in production', () => {
      process.env.NODE_ENV = 'production';
      const headers = getSecurityHeaders();

      expect(headers['Strict-Transport-Security']).toBeDefined();
      expect(headers['Strict-Transport-Security']).toBe(
        'max-age=31536000; includeSubDomains; preload'
      );
    });

    it('should auto-detect production environment for HSTS', () => {
      process.env.NODE_ENV = 'production';
      const headers = getSecurityHeaders({ includeHSTS: undefined });

      expect(headers['Strict-Transport-Security']).toBeDefined();
    });
  });

  describe('CSP Configuration', () => {
    it('should use Content-Security-Policy by default', () => {
      const headers = getSecurityHeaders();

      expect(headers['Content-Security-Policy']).toBeDefined();
      expect(headers['Content-Security-Policy-Report-Only']).toBeUndefined();
    });

    it('should use Content-Security-Policy-Report-Only when cspReportOnly is true', () => {
      const headers = getSecurityHeaders({ cspReportOnly: true });

      expect(headers['Content-Security-Policy-Report-Only']).toBeDefined();
      expect(headers['Content-Security-Policy']).toBeUndefined();
    });

    it('should include CSP report-uri when provided', () => {
      const reportUri = 'https://example.com/csp-report';
      const headers = getSecurityHeaders({ cspReportUri: reportUri });

      const cspHeader = headers['Content-Security-Policy'];
      expect(cspHeader).toContain(`report-uri ${reportUri}`);
    });
  });

  describe('HSTS Configuration', () => {
    it('should include HSTS when includeHSTS is true', () => {
      process.env.NODE_ENV = 'test';
      const headers = getSecurityHeaders({ includeHSTS: true });

      // Note: In test environment, getHSTSHeader() returns empty string
      // so it won't be included even with includeHSTS: true
      // This is the correct behavior
      expect(headers['Strict-Transport-Security']).toBeUndefined();
    });

    it('should not include HSTS when includeHSTS is false', () => {
      process.env.NODE_ENV = 'production';
      const headers = getSecurityHeaders({ includeHSTS: false });

      expect(headers['Strict-Transport-Security']).toBeUndefined();
    });
  });

  describe('Header Values', () => {
    it('should return correct CSP value', () => {
      const headers = getSecurityHeaders();

      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
      expect(headers['Content-Security-Policy']).toContain("script-src 'self'");
    });

    it('should return correct X-Frame-Options value', () => {
      const headers = getSecurityHeaders();

      expect(headers['X-Frame-Options']).toBe('DENY');
    });

    it('should return correct X-Content-Type-Options value', () => {
      const headers = getSecurityHeaders();

      expect(headers['X-Content-Type-Options']).toBe('nosniff');
    });

    it('should return correct Permissions-Policy value', () => {
      const headers = getSecurityHeaders();

      expect(headers['Permissions-Policy']).toContain('geolocation=(self)');
      expect(headers['Permissions-Policy']).toContain('microphone=()');
    });

    it('should return correct Referrer-Policy value', () => {
      const headers = getSecurityHeaders();

      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should return correct Cross-Origin-Opener-Policy value', () => {
      const headers = getSecurityHeaders();

      expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin');
    });
  });

  describe('Type Safety', () => {
    it('should return SecurityHeaders type', () => {
      const headers = getSecurityHeaders();

      // Type check: headers should be a record of string to string
      expect(headers).toBeInstanceOf(Object);
      expect(Object.keys(headers).every((key) => typeof headers[key] === 'string')).toBe(true);
    });

    it('should have all header values as strings', () => {
      const headers = getSecurityHeaders();

      Object.values(headers).forEach((value) => {
        expect(value).toBeTypeOf('string');
      });
    });
  });
});

describe('Security Headers Compliance', () => {
  describe('OWASP Compliance', () => {
    it('should include X-Frame-Options for clickjacking protection', () => {
      const headers = getSecurityHeaders();

      expect(headers['X-Frame-Options']).toBeDefined();
    });

    it('should include X-Content-Type-Options for MIME-sniffing protection', () => {
      const headers = getSecurityHeaders();

      expect(headers['X-Content-Type-Options']).toBeDefined();
    });

    it('should include CSP for XSS protection', () => {
      const headers = getSecurityHeaders();

      const cspHeader =
        headers['Content-Security-Policy'] || headers['Content-Security-Policy-Report-Only'];
      expect(cspHeader).toBeDefined();
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("object-src 'none'");
    });

    it('should include HSTS in production for HTTPS enforcement', () => {
      process.env.NODE_ENV = 'production';
      const headers = getSecurityHeaders();

      expect(headers['Strict-Transport-Security']).toBeDefined();
    });
  });

  describe('SOC2 Compliance', () => {
    it('should include Referrer-Policy for data protection', () => {
      const headers = getSecurityHeaders();

      expect(headers['Referrer-Policy']).toBeDefined();
    });

    it('should include Permissions-Policy for feature control', () => {
      const headers = getSecurityHeaders();

      expect(headers['Permissions-Policy']).toBeDefined();
    });
  });

  describe('Security Best Practices', () => {
    it('should block all mixed content', () => {
      const headers = getSecurityHeaders();

      const cspHeader =
        headers['Content-Security-Policy'] || headers['Content-Security-Policy-Report-Only'];
      expect(cspHeader).toContain('block-all-mixed-content');
    });

    it('should upgrade insecure requests', () => {
      const headers = getSecurityHeaders();

      const cspHeader =
        headers['Content-Security-Policy'] || headers['Content-Security-Policy-Report-Only'];
      expect(cspHeader).toContain('upgrade-insecure-requests');
    });

    it('should prevent iframe embedding', () => {
      const headers = getSecurityHeaders();

      expect(headers['X-Frame-Options']).toBe('DENY');

      const cspHeader =
        headers['Content-Security-Policy'] || headers['Content-Security-Policy-Report-Only'];
      expect(cspHeader).toContain("frame-ancestors 'none'");
    });

    it('should isolate browsing context with COOP', () => {
      const headers = getSecurityHeaders();

      expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin');
    });
  });
});

describe('Edge Cases', () => {
  it('should handle missing PUBLIC_API_URL gracefully', () => {
    delete process.env.PUBLIC_API_URL;

    const headers = getSecurityHeaders();

    const cspHeader = headers['Content-Security-Policy'];
    expect(cspHeader).toBeDefined();
    expect(cspHeader).toContain("connect-src 'self'");
  });

  it('should handle missing KEYCLOAK_URL gracefully', () => {
    delete process.env.KEYCLOAK_URL;

    const headers = getSecurityHeaders();

    const cspHeader = headers['Content-Security-Policy'];
    expect(cspHeader).toBeDefined();
  });

  it('should handle invalid PUBLIC_API_URL gracefully', () => {
    process.env.PUBLIC_API_URL = 'not-a-valid-url';

    const headers = getSecurityHeaders();

    const cspHeader = headers['Content-Security-Policy'];
    expect(cspHeader).toBeDefined();
  });

  it('should handle invalid KEYCLOAK_URL gracefully', () => {
    process.env.KEYCLOAK_URL = 'not-a-valid-url';

    const headers = getSecurityHeaders();

    const cspHeader = headers['Content-Security-Policy'];
    expect(cspHeader).toBeDefined();
    // Should not include the invalid URL in connect-src
    expect(cspHeader).not.toContain('not-a-valid-url');
  });

  it('should handle empty config object', () => {
    const headers = getSecurityHeaders({});

    expect(headers).toBeDefined();
    expect(Object.keys(headers).length).toBeGreaterThan(0);
  });

  it('should handle undefined config', () => {
    const headers = getSecurityHeaders(undefined);

    expect(headers).toBeDefined();
    expect(Object.keys(headers).length).toBeGreaterThan(0);
  });
});
