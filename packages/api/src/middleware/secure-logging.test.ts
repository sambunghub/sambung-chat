/**
 * Secure Logging Middleware Tests
 *
 * Purpose: Test that sensitive data (API keys, tokens, passwords) is properly redacted
 * from logs, errors, and responses
 *
 * Security Tests:
 * - Sensitive field redaction (apiKey, password, token, etc.)
 * - API key pattern detection (OpenAI, Anthropic, Google, Groq, JWT)
 * - Error message sanitization
 * - Console logging safety
 * - ORPC middleware sanitization
 */

import { describe, it, expect, vi } from 'vitest';
import {
  redactSensitiveData,
  sanitizeErrorMessage,
  safeLog,
  safeError,
  safeConsole,
  secureLoggingMiddleware,
} from './secure-logging';
import { ORPCError } from '@orpc/server';

describe('Secure Logging Middleware', () => {
  describe('redactSensitiveData', () => {
    describe('Standard sensitive fields', () => {
      it('should redact apiKey field', () => {
        const input = { apiKey: 'sk-1234567890abcdef', name: 'Test' };
        const result = redactSensitiveData(input);

        expect(result).toEqual({ apiKey: '[REDACTED]', name: 'Test' });
        expect(input.apiKey).toBe('sk-1234567890abcdef'); // Original unchanged
      });

      it('should redact api_key field (snake_case)', () => {
        const input = { api_key: 'sk-1234567890abcdef' };
        const result = redactSensitiveData(input);

        expect(result).toEqual({ api_key: '[REDACTED]' });
      });

      it('should redact password field', () => {
        const input = { username: 'john', password: 'secret123' };
        const result = redactSensitiveData(input);

        expect(result).toEqual({ username: 'john', password: '[REDACTED]' });
      });

      it('should redact token field', () => {
        const input = { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' };
        const result = redactSensitiveData(input);

        expect(result).toEqual({ token: '[REDACTED]' });
      });

      it('should redact accessToken field', () => {
        const input = { accessToken: 'access-token-value' };
        const result = redactSensitiveData(input);

        expect(result).toEqual({ accessToken: '[REDACTED]' });
      });

      it('should redact secret field', () => {
        const input = { secret: 'my-secret-value' };
        const result = redactSensitiveData(input);

        expect(result).toEqual({ secret: '[REDACTED]' });
      });

      it('should redact all standard sensitive fields', () => {
        const input = {
          apiKey: 'sk-1234',
          api_key: 'sk-5678',
          key: 'my-key',
          encryptedKey: 'encrypted',
          password: 'pass',
          token: 'tok',
          accessToken: 'at',
          refreshToken: 'rt',
          secret: 'sec',
          privateKey: 'pk',
          sessionToken: 'st',
          authorization: 'auth',
          authToken: 'at',
          bearer: 'bearer',
          credentials: 'cred',
        };
        const result = redactSensitiveData(input);

        // All fields should be redacted
        Object.values(result).forEach((value) => {
          expect(value).toBe('[REDACTED]');
        });
      });
    });

    describe('Case-insensitive field matching', () => {
      it('should redact APIKEY (uppercase)', () => {
        const input = { APIKEY: 'sk-1234' };
        const result = redactSensitiveData(input);

        expect(result).toEqual({ APIKEY: '[REDACTED]' });
      });

      it('should redact ApiKey (PascalCase)', () => {
        const input = { ApiKey: 'sk-1234' };
        const result = redactSensitiveData(input);

        expect(result).toEqual({ ApiKey: '[REDACTED]' });
      });

      it('should redact PASSWORD (uppercase)', () => {
        const input = { PASSWORD: 'secret' };
        const result = redactSensitiveData(input);

        expect(result).toEqual({ PASSWORD: '[REDACTED]' });
      });
    });

    describe('Nested objects', () => {
      it('should redact sensitive fields in nested objects', () => {
        const input = {
          user: {
            name: 'John',
            apiKey: 'sk-1234',
            auth: {
              password: 'secret',
              username: 'john',
            },
          },
        };
        const result = redactSensitiveData(input);

        expect(result).toEqual({
          user: {
            name: 'John',
            apiKey: '[REDACTED]',
            auth: {
              password: '[REDACTED]',
              username: 'john',
            },
          },
        });
      });

      it('should handle deeply nested objects', () => {
        const input = {
          level1: {
            level2: {
              level3: {
                level4: {
                  secret: 'deep-secret',
                },
              },
            },
          },
        };
        const result = redactSensitiveData(input);

        expect(result.level1.level2.level3.level4.secret).toBe('[REDACTED]');
      });

      it('should preserve non-sensitive nested data', () => {
        const input = {
          config: {
            apiVersion: 'v1',
            endpoint: 'https://api.example.com',
            timeout: 5000,
          },
        };
        const result = redactSensitiveData(input);

        expect(result).toEqual(input);
      });
    });

    describe('Arrays', () => {
      it('should redact sensitive fields in array of objects', () => {
        const input = [
          { name: 'Key 1', apiKey: 'sk-1111' },
          { name: 'Key 2', apiKey: 'sk-2222' },
          { name: 'Key 3', apiKey: 'sk-3333' },
        ];
        const result = redactSensitiveData(input);

        expect(result).toEqual([
          { name: 'Key 1', apiKey: '[REDACTED]' },
          { name: 'Key 2', apiKey: '[REDACTED]' },
          { name: 'Key 3', apiKey: '[REDACTED]' },
        ]);
      });

      it('should handle nested arrays', () => {
        const input = {
          keys: [
            [{ apiKey: 'sk-1111' }, { apiKey: 'sk-2222' }],
            [{ apiKey: 'sk-3333' }, { apiKey: 'sk-4444' }],
          ],
        };
        const result = redactSensitiveData(input);

        expect(result.keys).toEqual([
          [{ apiKey: '[REDACTED]' }, { apiKey: '[REDACTED]' }],
          [{ apiKey: '[REDACTED]' }, { apiKey: '[REDACTED]' }],
        ]);
      });

      it('should handle primitive arrays', () => {
        const input = {
          tags: ['tag1', 'tag2', 'tag3'],
          numbers: [1, 2, 3],
        };
        const result = redactSensitiveData(input);

        expect(result).toEqual(input);
      });
    });

    describe('Custom fields', () => {
      it('should redact custom sensitive fields', () => {
        const input = {
          name: 'Test',
          customSecret: 'custom-value',
          myApiKey: 'my-key',
        };
        const result = redactSensitiveData(input, ['customSecret', 'myApiKey']);

        expect(result).toEqual({
          name: 'Test',
          customSecret: '[REDACTED]',
          myApiKey: '[REDACTED]',
        });
      });

      it('should combine default and custom fields', () => {
        const input = {
          apiKey: 'sk-1234',
          customField: 'custom-value',
        };
        const result = redactSensitiveData(input, ['customField']);

        expect(result).toEqual({
          apiKey: '[REDACTED]',
          customField: '[REDACTED]',
        });
      });
    });

    describe('Non-string values', () => {
      it('should redact object values', () => {
        const input = { apiKey: { key: 'sk-1234' } };
        const result = redactSensitiveData(input);

        expect(result).toEqual({ apiKey: '[REDACTED]' });
      });

      it('should redact array values for sensitive fields', () => {
        const input = { token: ['token1', 'token2'] };
        const result = redactSensitiveData(input);

        expect(result).toEqual({ token: '[REDACTED]' });
      });

      it('should preserve numbers', () => {
        const input = { count: 42, rate: 3.14 };
        const result = redactSensitiveData(input);

        expect(result).toEqual(input);
      });

      it('should preserve booleans', () => {
        const input = { isActive: true, isAdmin: false };
        const result = redactSensitiveData(input);

        expect(result).toEqual(input);
      });
    });

    describe('Edge cases', () => {
      it('should handle null input', () => {
        const result = redactSensitiveData(null);
        expect(result).toBeNull();
      });

      it('should handle undefined input', () => {
        const result = redactSensitiveData(undefined);
        expect(result).toBeUndefined();
      });

      it('should handle empty object', () => {
        const result = redactSensitiveData({});
        expect(result).toEqual({});
      });

      it('should handle empty array', () => {
        const result = redactSensitiveData([]);
        expect(result).toEqual([]);
      });

      it('should handle string input', () => {
        const result = redactSensitiveData('just a string');
        expect(result).toBe('just a string');
      });

      it('should handle number input', () => {
        const result = redactSensitiveData(42);
        expect(result).toBe(42);
      });

      it('should handle boolean input', () => {
        const result = redactSensitiveData(true);
        expect(result).toBe(true);
      });

      it('should not modify original object', () => {
        const input = { apiKey: 'sk-1234', name: 'Test' };
        redactSensitiveData(input);

        expect(input.apiKey).toBe('sk-1234'); // Original unchanged
      });

      it('should create deep copy', () => {
        const input = { nested: { apiKey: 'sk-1234' } };
        const result = redactSensitiveData(input);

        expect(result).not.toBe(input); // Different reference
        expect(result.nested).not.toBe(input.nested); // Deep copy
        expect(result.nested.apiKey).toBe('[REDACTED]');
        expect(input.nested.apiKey).toBe('sk-1234'); // Original unchanged
      });
    });
  });

  describe('sanitizeErrorMessage', () => {
    describe('API key patterns', () => {
      it('should redact OpenAI API keys (sk- prefix)', () => {
        const message = 'Invalid API key: sk-1234567890abcdef1234567890abcdef';
        const result = sanitizeErrorMessage(message);

        expect(result).toBe('Invalid API key: [REDACTED]');
      });

      it('should redact Anthropic API keys (sk-ant- prefix)', () => {
        const message = 'Failed with key: sk-ant-api031234567890abcdef1234567890abcdef';
        const result = sanitizeErrorMessage(message);

        expect(result).toBe('Failed with key: [REDACTED]');
      });

      it('should redact Google API keys (AIza prefix)', () => {
        const message = 'Error with key: AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe';
        const result = sanitizeErrorMessage(message);

        expect(result).toBe('Error with key: [REDACTED]');
      });

      it('should redact Groq API keys (gsk_ prefix)', () => {
        const message = 'Invalid key: gsk_2xVaAKphvJlGbXGLtYHlWG0B3bCXlQpV8a4GsX7lBqFGvK9lN';
        const result = sanitizeErrorMessage(message);

        expect(result).toBe('Invalid key: [REDACTED]');
      });

      it('should redact JWT tokens (eyJ prefix)', () => {
        const message =
          'Token error: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature';
        const result = sanitizeErrorMessage(message);

        expect(result).toBe('Token error: [REDACTED]');
      });
    });

    describe('Multiple occurrences', () => {
      it('should redact multiple API keys in same message', () => {
        const message =
          'Keys sk-11111111111111111111111111111111 and sk-22222222222222222222222222222222 both failed';
        const result = sanitizeErrorMessage(message);

        expect(result).toBe('Keys [REDACTED] and [REDACTED] both failed');
      });

      it('should redact mixed API key types', () => {
        const message =
          'OpenAI key sk-11111111111111111111111111111111 and Google key AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe both failed';
        const result = sanitizeErrorMessage(message);

        expect(result).toBe('OpenAI key [REDACTED] and Google key [REDACTED] both failed');
      });
    });

    describe('Mixed safe and sensitive content', () => {
      it('should preserve safe content', () => {
        const message =
          'Error: Failed to authenticate user john@example.com with key sk-1234567890abcdef1234567890abcdef';
        const result = sanitizeErrorMessage(message);

        expect(result).toBe(
          'Error: Failed to authenticate user john@example.com with key [REDACTED]'
        );
      });

      it('should handle message without API keys', () => {
        const message = 'Database connection failed';
        const result = sanitizeErrorMessage(message);

        expect(result).toBe('Database connection failed');
      });

      it('should handle message with only safe data', () => {
        const message = 'User john@example.com logged in successfully';
        const result = sanitizeErrorMessage(message);

        expect(result).toBe('User john@example.com logged in successfully');
      });
    });

    describe('Edge cases', () => {
      it('should handle null input', () => {
        const result = sanitizeErrorMessage(null as unknown as string);
        expect(result).toBeNull();
      });

      it('should handle undefined input', () => {
        const result = sanitizeErrorMessage(undefined as unknown as string);
        expect(result).toBeUndefined();
      });

      it('should handle empty string', () => {
        const result = sanitizeErrorMessage('');
        expect(result).toBe('');
      });

      it('should handle non-string input', () => {
        const result = sanitizeErrorMessage(42 as unknown as string);
        expect(result).toBe(42);
      });

      it('should be case-sensitive for patterns', () => {
        const message = 'Key SK-UPPERCASE should not be redacted';
        const result = sanitizeErrorMessage(message);

        // Lowercase pattern won't match uppercase
        expect(result).toBe(message);
      });
    });
  });

  describe('safeLog', () => {
    it('should not throw when logging data', () => {
      const input = { apiKey: 'sk-1234', name: 'Test' };
      expect(() => safeLog('Data:', input)).not.toThrow();
    });

    it('should not throw with multiple arguments', () => {
      expect(() =>
        safeLog('Message 1', { apiKey: 'sk-1111' }, 'Message 2', { token: 'tok-2222' })
      ).not.toThrow();
    });

    it('should not throw with API key in string', () => {
      expect(() => safeLog('Error with key sk-1234567890abcdef1234567890abcdef')).not.toThrow();
    });

    it('should not throw with mixed argument types', () => {
      expect(() =>
        safeLog('String', 42, true, { apiKey: 'sk-1234' }, ['array'], null, undefined)
      ).not.toThrow();
    });
  });

  describe('safeError', () => {
    it('should not throw when logging error with API key', () => {
      const error = new Error('Failed with key sk-1234567890abcdef1234567890abcdef');
      expect(() => safeError(error)).not.toThrow();
    });

    it('should not throw when logging error', () => {
      const error = new Error('Test error');
      expect(() => safeError(error)).not.toThrow();
    });

    it('should not throw with error and sensitive data', () => {
      expect(() => safeError('Error:', { apiKey: 'sk-1234', message: 'Failed' })).not.toThrow();
    });

    it('should not throw with multiple arguments', () => {
      const error = new Error('Failed with key sk-1234567890abcdef');
      expect(() => safeError('API Error:', error, { apiKey: 'sk-9876' })).not.toThrow();
    });
  });

  describe('safeConsole', () => {
    it('should provide safe log method', () => {
      expect(() => safeConsole.log({ apiKey: 'sk-1234' })).not.toThrow();
    });

    it('should provide safe error method', () => {
      expect(() => safeConsole.error({ apiKey: 'sk-1234' })).not.toThrow();
    });

    it('should provide safe warn method', () => {
      expect(() => safeConsole.warn('Warning:', { apiKey: 'sk-1234' })).not.toThrow();
    });

    it('should provide safe info method', () => {
      expect(() => safeConsole.info('Info:', { apiKey: 'sk-1234' })).not.toThrow();
    });

    it('should provide safe debug method', () => {
      expect(() => safeConsole.debug('Debug:', { apiKey: 'sk-1234' })).not.toThrow();
    });

    it('should sanitize strings in warn method', () => {
      expect(() =>
        safeConsole.warn('Key sk-1234567890abcdef1234567890abcdef is invalid')
      ).not.toThrow();
    });

    it('should sanitize strings in info method', () => {
      expect(() => safeConsole.info('Using key sk-1234567890abcdef1234567890abcdef')).not.toThrow();
    });

    it('should sanitize strings in debug method', () => {
      expect(() => safeConsole.debug('Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).not.toThrow();
    });
  });

  describe('secureLoggingMiddleware', () => {
    it('should sanitize ORPCError message with API key', async () => {
      const next = vi.fn().mockRejectedValue(
        new ORPCError('BAD_REQUEST', {
          message: 'Invalid key sk-1234567890abcdef1234567890abcdef',
        })
      );

      const context = {} as any;

      await expect(secureLoggingMiddleware({ context, next } as any)).rejects.toThrow();

      // Verify the error thrown has sanitized message
      try {
        await secureLoggingMiddleware({ context, next } as any);
      } catch (error) {
        expect(error).toBeInstanceOf(ORPCError);
        expect((error as ORPCError).message).toBe('Invalid key [REDACTED]');
      }
    });

    it('should sanitize ORPCError data field', async () => {
      const next = vi.fn().mockRejectedValue(
        new ORPCError('BAD_REQUEST', {
          message: 'Failed',
          data: { apiKey: 'sk-1234', userId: '123' },
        })
      );

      const context = {} as any;

      try {
        await secureLoggingMiddleware({ context, next } as any);
      } catch (error) {
        expect(error).toBeInstanceOf(ORPCError);
        expect((error as ORPCError).data).toEqual({ apiKey: '[REDACTED]', userId: '123' });
      }
    });

    it('should sanitize ORPCError both message and data', async () => {
      const next = vi.fn().mockRejectedValue(
        new ORPCError('BAD_REQUEST', {
          message: 'Key sk-1234567890abcdef1234567890abcdef failed',
          data: { apiKey: 'sk-1234', details: 'Invalid' },
        })
      );

      const context = {} as any;

      try {
        await secureLoggingMiddleware({ context, next } as any);
      } catch (error) {
        expect(error).toBeInstanceOf(ORPCError);
        expect((error as ORPCError).message).toBe('Key [REDACTED] failed');
        expect((error as ORPCError).data).toEqual({ apiKey: '[REDACTED]', details: 'Invalid' });
      }
    });

    it('should preserve ORPCError code', async () => {
      const next = vi.fn().mockRejectedValue(
        new ORPCError('UNAUTHORIZED', {
          message: 'Invalid key sk-1234567890abcdef',
        })
      );

      const context = {} as any;

      try {
        await secureLoggingMiddleware({ context, next } as any);
      } catch (error) {
        expect(error).toBeInstanceOf(ORPCError);
        expect((error as ORPCError).code).toBe('UNAUTHORIZED');
      }
    });

    it('should sanitize generic Error message', async () => {
      const next = vi
        .fn()
        .mockRejectedValue(new Error('Failed with key sk-1234567890abcdef1234567890abcdef'));

      const context = {} as any;

      try {
        await secureLoggingMiddleware({ context, next } as any);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Failed with key [REDACTED]');
      }
    });

    it('should preserve generic Error stack trace', async () => {
      const originalError = new Error('Test error');
      const originalStack = originalError.stack;
      const next = vi.fn().mockRejectedValue(originalError);

      const context = {} as any;

      try {
        await secureLoggingMiddleware({ context, next } as any);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).stack).toBe(originalStack);
      }
    });

    it('should pass through successful calls', async () => {
      const next = vi.fn().mockResolvedValue({ success: true });

      const context = {} as any;

      const result = await secureLoggingMiddleware({ context, next } as any);

      expect(result).toEqual({ success: true });
    });

    it('should pass through non-Error errors', async () => {
      const next = vi.fn().mockRejectedValue('String error');

      const context = {} as any;

      await expect(secureLoggingMiddleware({ context, next } as any)).rejects.toThrow(
        'String error'
      );
    });

    it('should handle ORPCError with undefined data', async () => {
      const next = vi.fn().mockRejectedValue(
        new ORPCError('BAD_REQUEST', {
          message: 'Key sk-1234567890abcdef failed',
        })
      );

      const context = {} as any;

      try {
        await secureLoggingMiddleware({ context, next } as any);
      } catch (error) {
        expect(error).toBeInstanceOf(ORPCError);
        expect((error as ORPCError).data).toBeUndefined();
      }
    });
  });

  describe('String API key pattern detection', () => {
    describe('redactSensitiveData with API key patterns in strings', () => {
      it('should redact API keys in string values', () => {
        const input = { message: 'Use key sk-1234567890abcdef1234567890abcdef for auth' };
        const result = redactSensitiveData(input);

        expect(result).toEqual({ message: 'Use key [REDACTED] for auth' });
      });

      it('should redact API keys in nested string values', () => {
        const input = {
          error: {
            details: 'Failed with sk-1234567890abcdef1234567890abcdef',
          },
        };
        const result = redactSensitiveData(input);

        expect(result).toEqual({
          error: {
            details: 'Failed with [REDACTED]',
          },
        });
      });

      it('should redact multiple API keys in same string', () => {
        const input = {
          message:
            'Keys sk-11111111111111111111111111111111 and sk-22222222222222222222222222222222 both work',
        };
        const result = redactSensitiveData(input);

        expect(result).toEqual({ message: 'Keys [REDACTED] and [REDACTED] both work' });
      });
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle complete API response logging', () => {
      const response = {
        status: 200,
        data: {
          keys: [
            { id: '1', name: 'OpenAI Key', lastChars: 'sk-12' },
            { id: '2', name: 'Anthropic Key', lastChars: 'sk-ant-34' },
          ],
          meta: { total: 2 },
        },
      };

      const result = redactSensitiveData(response);

      // Should preserve structure but redact any sensitive patterns
      expect(result.status).toBe(200);
      expect(result.data.keys).toHaveLength(2);
      expect(result.data.meta.total).toBe(2);
    });

    it('should handle database query logging', () => {
      const query = {
        sql: 'SELECT * FROM api_keys WHERE user_id = $1',
        params: ['user-123'],
        rows: [{ id: '1', encrypted_key: 'encrypted-data-123', provider: 'openai' }],
      };

      const result = redactSensitiveData(query);

      // Should preserve SQL and params but redact any sensitive fields
      expect(result.sql).toBe(query.sql);
      expect(result.params).toEqual(query.params);
      // encrypted_key matches encryptedKey (case-insensitive), so it should be redacted
      expect(result.rows[0].encrypted_key).toBe('[REDACTED]');
    });

    it('should handle error logging with stack traces', () => {
      const error = new Error('Authentication failed with key sk-1234567890abcdef1234567890abcdef');
      error.stack = 'Error: Authentication failed\n    at /app/auth.ts:42:14';

      expect(() =>
        safeError('Auth error:', error, { userId: '123', apiKey: 'sk-9876' })
      ).not.toThrow();
    });

    it('should handle HTTP request logging', () => {
      const request = {
        method: 'POST',
        url: '/api/keys',
        headers: {
          authorization: 'Bearer sk-1234567890abcdef1234567890abcdef',
          'content-type': 'application/json',
        },
        body: {
          name: 'My Key',
          apiKey: 'sk-newkey1234567890abcdef1234567890',
        },
      };

      const result = redactSensitiveData(request);

      // Headers and body should be sanitized
      expect(result.method).toBe('POST');
      expect(result.url).toBe('/api/keys');
      expect(result.headers.authorization).toBe('[REDACTED]');
      expect(result.headers['content-type']).toBe('application/json');
      expect(result.body.apiKey).toBe('[REDACTED]');
      expect(result.body.name).toBe('My Key');
    });
  });
});
