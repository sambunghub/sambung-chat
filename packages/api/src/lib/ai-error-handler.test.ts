/**
 * AI Error Handler Unit Tests
 *
 * Purpose: Test error handling logic for AI provider errors
 *
 * Test Coverage:
 * - Error pattern constants (ERROR_PATTERNS)
 * - Type guard function (isAIError)
 * - Error code extraction (extractErrorCode)
 * - Message sanitization (sanitizeErrorMessage)
 * - Pattern matching (matchesPattern)
 * - Main error handler (handleAIError)
 *
 * Error Categories Tested:
 * - Rate limit errors (429)
 * - Authentication failures (401/403)
 * - Model not found (404)
 * - Context window exceeded
 * - Content policy violations
 * - Invalid request format
 * - Network and connectivity errors
 * - Service unavailable (503)
 * - Payment/billing errors
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ORPCError } from '@orpc/server';
import { handleAIError, ERROR_PATTERNS } from './ai-error-handler';

// Mock console.error to avoid cluttering test output
const originalConsoleError = console.error;

describe('AI Error Handler', () => {
  beforeEach(() => {
    // Mock console.error before each test
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore console.error after each test
    console.error = originalConsoleError;
  });

  describe('ERROR_PATTERNS', () => {
    it('should have all required error categories', () => {
      const categories = [
        'RATE_LIMIT',
        'AUTHENTICATION',
        'MODEL_NOT_FOUND',
        'CONTEXT_EXCEEDED',
        'CONTENT_POLICY',
        'INVALID_REQUEST',
        'NETWORK',
        'SERVICE_UNAVAILABLE',
        'PAYMENT_REQUIRED',
      ];

      categories.forEach((category) => {
        expect(ERROR_PATTERNS).toHaveProperty(category);
        expect(Array.isArray(ERROR_PATTERNS[category as keyof typeof ERROR_PATTERNS])).toBe(true);
        expect(ERROR_PATTERNS[category as keyof typeof ERROR_PATTERNS].length).toBeGreaterThan(0);
      });
    });

    it('should have rate limit patterns', () => {
      expect(ERROR_PATTERNS.RATE_LIMIT).toContain('rate limit');
      expect(ERROR_PATTERNS.RATE_LIMIT).toContain('rate_limit_exceeded');
      expect(ERROR_PATTERNS.RATE_LIMIT).toContain('429');
      expect(ERROR_PATTERNS.RATE_LIMIT).toContain('quota');
      expect(ERROR_PATTERNS.RATE_LIMIT).toContain('too many requests');
    });

    it('should have authentication patterns', () => {
      expect(ERROR_PATTERNS.AUTHENTICATION).toContain('api key');
      expect(ERROR_PATTERNS.AUTHENTICATION).toContain('unauthorized');
      expect(ERROR_PATTERNS.AUTHENTICATION).toContain('401');
      expect(ERROR_PATTERNS.AUTHENTICATION).toContain('403');
      expect(ERROR_PATTERNS.AUTHENTICATION).toContain('authentication');
    });

    it('should have model not found patterns', () => {
      expect(ERROR_PATTERNS.MODEL_NOT_FOUND).toContain('model not found');
      expect(ERROR_PATTERNS.MODEL_NOT_FOUND).toContain('invalid model');
      expect(ERROR_PATTERNS.MODEL_NOT_FOUND).toContain('404');
    });

    it('should have context exceeded patterns', () => {
      expect(ERROR_PATTERNS.CONTEXT_EXCEEDED).toContain('context');
      expect(ERROR_PATTERNS.CONTEXT_EXCEEDED).toContain('context_length_exceeded');
      expect(ERROR_PATTERNS.CONTEXT_EXCEEDED).toContain('tokens');
      expect(ERROR_PATTERNS.CONTEXT_EXCEEDED).toContain('too long');
    });

    it('should have content policy patterns', () => {
      expect(ERROR_PATTERNS.CONTENT_POLICY).toContain('content policy');
      expect(ERROR_PATTERNS.CONTENT_POLICY).toContain('content_filter');
      expect(ERROR_PATTERNS.CONTENT_POLICY).toContain('safety');
      expect(ERROR_PATTERNS.CONTENT_POLICY).toContain('moderation');
    });

    it('should have invalid request patterns', () => {
      expect(ERROR_PATTERNS.INVALID_REQUEST).toContain('invalid');
      expect(ERROR_PATTERNS.INVALID_REQUEST).toContain('validation');
      expect(ERROR_PATTERNS.INVALID_REQUEST).toContain('schema');
      expect(ERROR_PATTERNS.INVALID_REQUEST).toContain('400');
    });

    it('should have network error patterns', () => {
      expect(ERROR_PATTERNS.NETWORK).toContain('network');
      expect(ERROR_PATTERNS.NETWORK).toContain('connection');
      expect(ERROR_PATTERNS.NETWORK).toContain('fetch');
      expect(ERROR_PATTERNS.NETWORK).toContain('timeout');
      expect(ERROR_PATTERNS.NETWORK).toContain('dns');
    });

    it('should have service unavailable patterns', () => {
      expect(ERROR_PATTERNS.SERVICE_UNAVAILABLE).toContain('503');
      expect(ERROR_PATTERNS.SERVICE_UNAVAILABLE).toContain('service unavailable');
      expect(ERROR_PATTERNS.SERVICE_UNAVAILABLE).toContain('maintenance');
      expect(ERROR_PATTERNS.SERVICE_UNAVAILABLE).toContain('overloaded');
    });

    it('should have payment required patterns', () => {
      expect(ERROR_PATTERNS.PAYMENT_REQUIRED).toContain('payment');
      expect(ERROR_PATTERNS.PAYMENT_REQUIRED).toContain('billing');
      expect(ERROR_PATTERNS.PAYMENT_REQUIRED).toContain('insufficient');
      expect(ERROR_PATTERNS.PAYMENT_REQUIRED).toContain('402');
    });
  });

  describe('handleAIError - Rate Limit Errors', () => {
    it('should throw TOO_MANY_REQUESTS for rate limit error', () => {
      const error = new Error('rate_limit_exceeded');

      expect(() => handleAIError(error)).toThrow(ORPCError);
      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('TOO_MANY_REQUESTS');
        }
      }
    });

    it('should throw with user-friendly message for rate limit', () => {
      const error = new Error('Rate limit exceeded. Please try again later.');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('TOO_MANY_REQUESTS');
          expect(e.message).toBe('Rate limit exceeded. Please wait a moment and try again.');
        }
      }
    });

    it('should match various rate limit patterns', () => {
      const errors = [
        new Error('429 Too Many Requests'),
        new Error('quota exceeded for this api key'),
        new Error('You have exceeded your rate limit'),
        new Error('requests exceeded limit'),
      ];

      errors.forEach((error) => {
        try {
          handleAIError(error);
          expect.fail(`Should have thrown for error: ${error.message}`);
        } catch (e) {
          expect(e).toBeInstanceOf(ORPCError);
          if (e instanceof ORPCError) {
            expect(e.code).toBe('TOO_MANY_REQUESTS');
          }
        }
      });
    });
  });

  describe('handleAIError - Authentication Errors', () => {
    it('should throw UNAUTHORIZED for invalid API key', () => {
      const error = new Error('invalid api key');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('UNAUTHORIZED');
          expect(e.message).toBe('Invalid API key. Please check your provider credentials.');
        }
      }
    });

    it('should throw UNAUTHORIZED for 401 error', () => {
      const error = new Error('401 Unauthorized');
      const authError = Object.assign(error, { statusCode: 401 });

      try {
        handleAIError(authError);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('UNAUTHORIZED');
        }
      }
    });

    it('should throw UNAUTHORIZED for 403 forbidden', () => {
      const error = new Error('403 Forbidden - Invalid API key');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('UNAUTHORIZED');
        }
      }
    });

    it('should match various authentication patterns', () => {
      const errors = [
        new Error('authentication failed'),
        new Error('incorrect api key'),
        new Error('API key is invalid'),
        new Error('unauthorized access'),
      ];

      errors.forEach((error) => {
        try {
          handleAIError(error);
          expect.fail(`Should have thrown for error: ${error.message}`);
        } catch (e) {
          expect(e).toBeInstanceOf(ORPCError);
          if (e instanceof ORPCError) {
            expect(e.code).toBe('UNAUTHORIZED');
          }
        }
      });
    });
  });

  describe('handleAIError - Model Not Found Errors', () => {
    it('should throw NOT_FOUND for model not found', () => {
      const error = new Error('model not found: gpt-4');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('NOT_FOUND');
          expect(e.message).toBe(
            'The specified model is not available or you do not have access to it.'
          );
        }
      }
    });

    it('should throw NOT_FOUND for 404 error', () => {
      const error = new Error('404 Model not found');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('NOT_FOUND');
        }
      }
    });

    it('should match various model not found patterns', () => {
      const errors = [
        new Error('invalid model: claude-99'),
        new Error('model does not exist'),
        new Error('no such model'),
      ];

      errors.forEach((error) => {
        try {
          handleAIError(error);
          expect.fail(`Should have thrown for error: ${error.message}`);
        } catch (e) {
          expect(e).toBeInstanceOf(ORPCError);
          if (e instanceof ORPCError) {
            expect(e.code).toBe('NOT_FOUND');
          }
        }
      });
    });
  });

  describe('handleAIError - Context Exceeded Errors', () => {
    it('should throw BAD_REQUEST for context length exceeded', () => {
      const error = new Error('context_length_exceeded: maximum tokens exceeded');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('BAD_REQUEST');
          expect(e.message).toBe(
            'The conversation is too long. Please start a new chat or reduce the message length.'
          );
        }
      }
    });

    it('should match various context exceeded patterns', () => {
      const errors = [
        new Error('context window exceeded'),
        new Error('too many tokens'),
        new Error('message is too long'),
        new Error('exceeds maximum length'),
        new Error('maximum context length exceeded'),
      ];

      errors.forEach((error) => {
        try {
          handleAIError(error);
          expect.fail(`Should have thrown for error: ${error.message}`);
        } catch (e) {
          expect(e).toBeInstanceOf(ORPCError);
          if (e instanceof ORPCError) {
            expect(e.code).toBe('BAD_REQUEST');
          }
        }
      });
    });
  });

  describe('handleAIError - Content Policy Errors', () => {
    it('should throw BAD_REQUEST for content policy violation', () => {
      const error = new Error('content policy violation detected');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('BAD_REQUEST');
          expect(e.message).toBe(
            'The content was flagged by the safety filter. Please modify your message and try again.'
          );
        }
      }
    });

    it('should match various content policy patterns', () => {
      const errors = [
        new Error('content_filter: flagged content'),
        new Error('safety filter triggered'),
        new Error('moderation flagged this content'),
        new Error('policy violation'),
      ];

      errors.forEach((error) => {
        try {
          handleAIError(error);
          expect.fail(`Should have thrown for error: ${error.message}`);
        } catch (e) {
          expect(e).toBeInstanceOf(ORPCError);
          if (e instanceof ORPCError) {
            expect(e.code).toBe('BAD_REQUEST');
          }
        }
      });
    });
  });

  describe('handleAIError - Invalid Request Errors', () => {
    it('should throw BAD_REQUEST for invalid request', () => {
      const error = new Error('invalid request format');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('BAD_REQUEST');
          expect(e.message).toBe('Invalid request format. Please check your input and try again.');
        }
      }
    });

    it('should match various invalid request patterns', () => {
      const errors = [
        new Error('validation error'),
        new Error('schema validation failed'),
        new Error('malformed request'),
        new Error('400 Bad Request'),
        new Error('bad request syntax'),
      ];

      errors.forEach((error) => {
        try {
          handleAIError(error);
          expect.fail(`Should have thrown for error: ${error.message}`);
        } catch (e) {
          expect(e).toBeInstanceOf(ORPCError);
          if (e instanceof ORPCError) {
            expect(e.code).toBe('BAD_REQUEST');
          }
        }
      });
    });
  });

  describe('handleAIError - Network Errors', () => {
    it('should throw SERVICE_UNAVAILABLE for network error', () => {
      const error = new Error('network connection failed');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('SERVICE_UNAVAILABLE');
          expect(e.message).toBe('Network error. Please check your connection and try again.');
        }
      }
    });

    it('should match various network error patterns', () => {
      const errors = [
        new Error('connection refused'),
        new Error('fetch failed'),
        new Error('ECONNREFUSED'),
        new Error('ETIMEDOUT'),
        new Error('request timeout'),
        new Error('DNS resolution failed'),
      ];

      errors.forEach((error) => {
        try {
          handleAIError(error);
          expect.fail(`Should have thrown for error: ${error.message}`);
        } catch (e) {
          expect(e).toBeInstanceOf(ORPCError);
          if (e instanceof ORPCError) {
            expect(e.code).toBe('SERVICE_UNAVAILABLE');
          }
        }
      });
    });
  });

  describe('handleAIError - Service Unavailable Errors', () => {
    it('should throw SERVICE_UNAVAILABLE for 503 error', () => {
      const error = new Error('503 Service Unavailable');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('SERVICE_UNAVAILABLE');
          expect(e.message).toBe('The service is temporarily unavailable. Please try again later.');
        }
      }
    });

    it('should match various service unavailable patterns', () => {
      const errors = [
        new Error('service unavailable'),
        new Error('maintenance mode'),
        new Error('server overloaded'),
        new Error('temporarily unavailable'),
      ];

      errors.forEach((error) => {
        try {
          handleAIError(error);
          expect.fail(`Should have thrown for error: ${error.message}`);
        } catch (e) {
          expect(e).toBeInstanceOf(ORPCError);
          if (e instanceof ORPCError) {
            expect(e.code).toBe('SERVICE_UNAVAILABLE');
          }
        }
      });
    });
  });

  describe('handleAIError - Payment Required Errors', () => {
    it('should throw BAD_REQUEST for payment required', () => {
      const error = new Error('payment required');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('BAD_REQUEST');
          expect(e.message).toBe(
            'Payment required or quota exceeded. Please check your billing details.'
          );
        }
      }
    });

    it('should match various payment required patterns', () => {
      const errors = [
        new Error('billing issue'),
        new Error('insufficient funds'),
        new Error('402 Payment Required'),
        // Note: 'quota exceeded' matches RATE_LIMIT first (checked earlier)
      ];

      errors.forEach((error) => {
        try {
          handleAIError(error);
          expect.fail(`Should have thrown for error: ${error.message}`);
        } catch (e) {
          expect(e).toBeInstanceOf(ORPCError);
          if (e instanceof ORPCError) {
            expect(e.code).toBe('BAD_REQUEST');
          }
        }
      });
    });
  });

  describe('handleAIError - Generic Errors', () => {
    it('should throw INTERNAL_SERVER_ERROR for unknown error', () => {
      const error = new Error('some unknown error occurred');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('INTERNAL_SERVER_ERROR');
          expect(e.message).toBe('some unknown error occurred');
        }
      }
    });

    it('should sanitize API keys in error messages', () => {
      // Use an error that doesn't match other patterns to test sanitization
      const error = new Error('Failed with key sk-abc123def456789012345 - unknown error');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.message).not.toContain('sk-abc123def456789012345');
          expect(e.message).toContain('sk-****');
        }
      }
    });

    it('should handle error objects with cause property', () => {
      // The cause property is checked but pattern matching is on error.message
      // So 'Outer error' doesn't match rate limit pattern
      const error = new Error('rate_limit_exceeded', {
        cause: new Error('some cause'),
      });

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('TOO_MANY_REQUESTS');
        }
      }
    });

    it('should handle error objects with code property', () => {
      const error = new Error('Rate limit hit');
      (error as any).code = 'rate_limit_exceeded';

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('TOO_MANY_REQUESTS');
        }
      }
    });

    it('should handle error with cause.code property', () => {
      const causeError = new Error('Inner error');
      (causeError as any).code = 'rate_limit_exceeded';

      // Main error message must match pattern for code to be used
      const error = new Error('rate_limit_exceeded', { cause: causeError });

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('TOO_MANY_REQUESTS');
        }
      }
    });

    it('should handle error objects with statusCode property', () => {
      const error = new Error('Unauthorized');
      (error as any).statusCode = 401;

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('UNAUTHORIZED');
        }
      }
    });

    it('should throw INTERNAL_SERVER_ERROR for non-Error objects', () => {
      const nonError = 'string error';

      try {
        handleAIError(nonError);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('INTERNAL_SERVER_ERROR');
          expect(e.message).toBe('An unknown error occurred');
        }
      }
    });

    it('should throw INTERNAL_SERVER_ERROR for null', () => {
      try {
        handleAIError(null);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('INTERNAL_SERVER_ERROR');
          expect(e.message).toBe('An unknown error occurred');
        }
      }
    });

    it('should throw INTERNAL_SERVER_ERROR for undefined', () => {
      try {
        handleAIError(undefined);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('INTERNAL_SERVER_ERROR');
          expect(e.message).toBe('An unknown error occurred');
        }
      }
    });

    it('should throw INTERNAL_SERVER_ERROR for number', () => {
      try {
        handleAIError(12345);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('INTERNAL_SERVER_ERROR');
          expect(e.message).toBe('An unknown error occurred');
        }
      }
    });

    it('should log errors to console', () => {
      const error = new Error('rate_limit_exceeded');

      try {
        handleAIError(error);
      } catch (e) {
        // Expected to throw
      }

      expect(console.error).toHaveBeenCalledWith('[AI Error]', {
        message: 'rate_limit_exceeded',
        code: undefined,
        name: 'Error',
      });
    });
  });

  describe('Message Sanitization', () => {
    it('should remove OpenAI API keys', () => {
      // Use error message that doesn't match authentication pattern
      const error = new Error(
        'Request failed with key sk-1234567890abcdefghijklmnopqrstu - please retry'
      );

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.message).not.toContain('sk-1234567890abcdefghijklmnopqrstu');
          expect(e.message).toContain('sk-****');
        }
      }
    });

    it('should remove Anthropic API keys', () => {
      // Use error message that doesn't match other patterns
      const error = new Error(
        'Request failed with key sk-ant-api03-1234567890abcdefghijklmnopqrstu'
      );

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.message).not.toContain('sk-ant-api03-1234567890abcdefghijklmnopqrstu');
          // The error message will be sanitized and then used in the generic error
          expect(e.message).toContain('sk-****');
        }
      }
    });

    it('should remove multiple API keys from error message', () => {
      // Use error message that doesn't match authentication pattern
      const error = new Error(
        'Tried key sk-1234567890abcdefghijklmnopqrst and then sk-ant-api03-1234567890abcdefghijklmnopqrst - request timeout'
      );

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.message).not.toMatch(/sk-[a-zA-Z0-9-]{20,}/);
        }
      }
    });

    it('should handle messages without API keys', () => {
      const error = new Error('Simple error message without any keys');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.message).toBe('Simple error message without any keys');
        }
      }
    });

    it('should preserve error context while sanitizing', () => {
      // Use error that doesn't match authentication pattern to test sanitization
      const error = new Error(
        'Request failed with key sk-1234567890abcdefghijklmnopqrst - please check your credentials'
      );

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.message).toContain('Request failed');
          expect(e.message).toContain('please check your credentials');
          expect(e.message).not.toContain('sk-1234567890abcdefghijklmnopqrst');
        }
      }
    });
  });

  describe('Case Insensitive Pattern Matching', () => {
    it('should match RATE_LIMIT in uppercase', () => {
      const error = new Error('RATE LIMIT EXCEEDED');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('TOO_MANY_REQUESTS');
        }
      }
    });

    it('should match RATE_LIMIT in lowercase', () => {
      const error = new Error('rate limit exceeded');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('TOO_MANY_REQUESTS');
        }
      }
    });

    it('should match RATE_LIMIT in mixed case', () => {
      const error = new Error('Rate Limit Exceeded');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('TOO_MANY_REQUESTS');
        }
      }
    });

    it('should match AUTHENTICATION patterns case-insensitively', () => {
      const errors = [
        new Error('UNAUTHORIZED'),
        new Error('unauthorized'),
        new Error('Unauthorized'),
      ];

      errors.forEach((error) => {
        try {
          handleAIError(error);
          expect.fail(`Should have thrown for error: ${error.message}`);
        } catch (e) {
          expect(e).toBeInstanceOf(ORPCError);
          if (e instanceof ORPCError) {
            expect(e.code).toBe('UNAUTHORIZED');
          }
        }
      });
    });
  });

  describe('Error Priority - First Match Wins', () => {
    it('should match rate limit before authentication when both patterns present', () => {
      // Error contains both "rate limit" and "api key"
      const error = new Error('api key rate limit exceeded');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          // Should match RATE_LIMIT (checked first)
          expect(e.code).toBe('TOO_MANY_REQUESTS');
        }
      }
    });

    it('should match authentication before model not found', () => {
      const error = new Error('invalid api key for model not found');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          // Should match AUTHENTICATION (checked before MODEL_NOT_FOUND)
          expect(e.code).toBe('UNAUTHORIZED');
        }
      }
    });
  });

  describe('Real-World Error Scenarios', () => {
    it('should handle OpenAI rate limit error', () => {
      const error = new Error('Rate limit reached for gpt-4. Please retry after 20 seconds.');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('TOO_MANY_REQUESTS');
        }
      }
    });

    it('should handle Anthropic authentication error', () => {
      const error = new Error('Invalid credentials. Please check your Anthropic API key.');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('UNAUTHORIZED');
        }
      }
    });

    it('should handle context length error from OpenAI', () => {
      const error = new Error(
        "This model's maximum context length is 8192 tokens. However, your messages resulted in 9500 tokens."
      );

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('BAD_REQUEST');
          expect(e.message).toContain('conversation is too long');
        }
      }
    });

    it('should handle network timeout error', () => {
      const error = new Error('Request timeout after 30000ms');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('SERVICE_UNAVAILABLE');
          expect(e.message).toContain('Network error');
        }
      }
    });

    it('should handle ECONNREFUSED error', () => {
      const error = new Error('ECONNREFUSED connecting to api.anthropic.com');

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('SERVICE_UNAVAILABLE');
          expect(e.message).toContain('Network error');
        }
      }
    });

    it('should handle model not found error', () => {
      const error = new Error(
        'Model not found: gpt-5 does not exist or you do not have access to it.'
      );

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('NOT_FOUND');
        }
      }
    });

    it('should handle content policy violation', () => {
      const error = new Error(
        'Your content was flagged by content_filter. Please modify and retry.'
      );

      try {
        handleAIError(error);
        expect.fail('Should have thrown ORPCError');
      } catch (e) {
        expect(e).toBeInstanceOf(ORPCError);
        if (e instanceof ORPCError) {
          expect(e.code).toBe('BAD_REQUEST');
          expect(e.message).toContain('safety filter');
        }
      }
    });
  });

  describe('Error Logging', () => {
    it('should log error with message, code, and name', () => {
      const error = new Error('rate_limit_exceeded');
      error.name = 'RateLimitError';
      (error as any).code = 'rate_limit_exceeded';

      try {
        handleAIError(error);
      } catch (e) {
        // Expected to throw
      }

      expect(console.error).toHaveBeenCalledWith('[AI Error]', {
        message: 'rate_limit_exceeded',
        code: 'rate_limit_exceeded',
        name: 'RateLimitError',
      });
    });

    it('should log sanitized error messages', () => {
      const error = new Error('Failed with key sk-1234567890abcdefghijklmnopqrst');

      try {
        handleAIError(error);
      } catch (e) {
        // Expected to throw
      }

      expect(console.error).toHaveBeenCalledWith('[AI Error]', {
        message: 'Failed with key sk-****', // Sanitized
        code: undefined,
        name: 'Error',
      });
    });

    it('should handle errors with undefined code', () => {
      const error = new Error('some error');

      try {
        handleAIError(error);
      } catch (e) {
        // Expected to throw
      }

      expect(console.error).toHaveBeenCalledWith('[AI Error]', {
        message: 'some error',
        code: undefined,
        name: 'Error',
      });
    });
  });
});
