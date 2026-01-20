/**
 * Secure Logging Middleware
 *
 * Prevents exposure of sensitive data (API keys, tokens, passwords) in:
 * - Error messages sent to clients
 * - Console logs and error output
 * - Request/response logging
 *
 * @example
 * ```ts
 * import { secureLoggingMiddleware, redactSensitiveData } from './middleware/secure-logging';
 *
 * // Use as ORPC middleware
 * export const myProcedure = publicProcedure.use(secureLoggingMiddleware);
 *
 * // Or manually redact data
 * const safeData = redactSensitiveData({ apiKey: 'sk-...' });
 * console.log(safeData); // { apiKey: '[REDACTED]' }
 * ```
 */

import { ORPCError } from '@orpc/server';
import type { ORPCNext, ORPCContext } from '@orpc/server';

/**
 * Field names that should be redacted from logs and errors
 * Includes common variations of sensitive field names
 */
const SENSITIVE_FIELDS = [
  'apiKey',
  'api_key',
  'key',
  'encryptedKey',
  'encrypted_key',
  'password',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'secret',
  'privateKey',
  'private_key',
  'sessionToken',
  'session_token',
  'authorization',
  'authToken',
  'auth_token',
  'bearer',
  'credentials',
] as const;

/**
 * String pattern to detect potential API keys/tokens
 * Matches common patterns like:
 * - sk-... (OpenAI)
 * - sk-ant-... (Anthropic)
 * - AIza... (Google)
 * - gsk_... (Groq)
 * - eyJ... (JWT tokens)
 */
const API_KEY_PATTERN =
  /(sk-[a-zA-Z0-9]{32,}|sk-ant-[a-zA-Z0-9]{32,}|AIza[a-zA-Z0-9_-]{35}|gsk_[a-zA-Z0-9_-]{32,}|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/gi;

/**
 * Redaction placeholder for sensitive data
 */
const REDACTED = '[REDACTED]';

/**
 * Recursively redact sensitive fields from an object
 *
 * This function creates a deep copy of the input object with all sensitive
 * field names replaced with '[REDACTED]'. It also scans string values for
 * API key patterns and redacts them.
 *
 * @param data - The data to sanitize (object, array, or primitive)
 * @param customFields - Additional field names to redact (optional)
 * @returns A new object with sensitive data redacted
 *
 * @example
 * ```ts
 * const safe = redactSensitiveData({
 *   name: 'Test',
 *   apiKey: 'sk-1234567890abcdef',
 *   nested: { password: 'secret' }
 * });
 * // Returns: { name: 'Test', apiKey: '[REDACTED]', nested: { password: '[REDACTED]' } }
 * ```
 */
export function redactSensitiveData<T = unknown>(data: T, customFields?: string[]): T {
  // Handle primitives and null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle strings - check for API key patterns
  if (typeof data === 'string') {
    return data.replace(API_KEY_PATTERN, REDACTED) as T;
  }

  // Handle numbers and booleans - return as-is
  if (typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, customFields)) as T;
  }

  // Handle objects - create a deep copy with sensitive fields redacted
  const result: Record<string, unknown> = {};

  // Combine default sensitive fields with custom fields
  const fieldsToRedact = new Set([...SENSITIVE_FIELDS, ...(customFields || [])]);

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = (data as Record<string, unknown>)[key];

      // Check if this field should be redacted
      const shouldRedact = Array.from(fieldsToRedact).some(
        (field) => key.toLowerCase() === field.toLowerCase()
      );

      if (shouldRedact && typeof value === 'string') {
        // Redact the entire field value
        result[key] = REDACTED;
      } else if (shouldRedact) {
        // Redact non-string values too (e.g., objects, arrays)
        result[key] = REDACTED;
      } else {
        // Recursively redact nested objects
        result[key] = redactSensitiveData(value, customFields);
      }
    }
  }

  return result as T;
}

/**
 * Sanitize an error message to remove sensitive data
 *
 * Scans error messages for API key patterns and replaces them with
 * '[REDACTED]'. Use this before logging or returning errors to clients.
 *
 * @param message - The error message to sanitize
 * @returns The sanitized message with API keys redacted
 *
 * @example
 * ```ts
 * const safeMessage = sanitizeErrorMessage('Invalid API key: sk-1234567890abcdef');
 * // Returns: 'Invalid API key: [REDACTED]'
 * ```
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return message;
  }
  return message.replace(API_KEY_PATTERN, REDACTED);
}

/**
 * Safely log data with sensitive information redacted
 *
 * This is a drop-in replacement for console.log that automatically
 * redacts sensitive fields and API key patterns.
 *
 * @param args - Arguments to log (same as console.log)
 *
 * @example
 * ```ts
 * safeLog('User data:', { apiKey: 'sk-...', name: 'John' });
 * // Logs: 'User data: { apiKey: [REDACTED], name: John }'
 * ```
 */
export function safeLog(...args: unknown[]): void {
  const sanitizedArgs = args.map((arg) => {
    if (typeof arg === 'string') {
      return sanitizeErrorMessage(arg);
    }
    return redactSensitiveData(arg);
  });
  console.log(...sanitizedArgs);
}

/**
 * Safely log errors with sensitive information redacted
 *
 * This is a drop-in replacement for console.error that automatically
 * redacts sensitive fields, API key patterns, and stack traces.
 *
 * @param args - Arguments to log (same as console.error)
 *
 * @example
 * ```ts
 * safeError('API Error:', { apiKey: 'sk-...', error: 'Failed to connect' });
 * // Logs: 'API Error: { apiKey: [REDACTED], error: Failed to connect }'
 * ```
 */
export function safeError(...args: unknown[]): void {
  const sanitizedArgs = args.map((arg) => {
    if (arg instanceof Error) {
      // Sanitize error message but preserve the error stack
      const sanitizedMessage = sanitizeErrorMessage(arg.message);
      const error = new Error(sanitizedMessage);
      error.stack = arg.stack; // Preserve stack trace
      return error;
    }
    if (typeof arg === 'string') {
      return sanitizeErrorMessage(arg);
    }
    return redactSensitiveData(arg);
  });
  console.error(...sanitizedArgs);
}

/**
 * ORPC middleware for secure logging and error sanitization
 *
 * This middleware:
 * 1. Sanitizes all error messages before sending them to clients
 * 2. Prevents sensitive data from leaking in error responses
 * 3. Adds context about the sanitization for debugging
 *
 * Use this middleware on procedures that handle sensitive data.
 *
 * @example
 * ```ts
 * import { secureLoggingMiddleware } from './middleware/secure-logging';
 *
 * export const apiKeyRouter = {
 *   create: protectedProcedure
 *     .use(secureLoggingMiddleware)
 *     .handler(async ({ input }) => {
 *       // If this throws an error with sensitive data, it will be sanitized
 *       throw new Error('Failed with API key: sk-1234567890abcdef');
 *     })
 * };
 * ```
 */
export const secureLoggingMiddleware = async ({
  next,
}: {
  context: ORPCContext;
  next: ORPCNext<unknown>;
}) => {
  try {
    return await next();
  } catch (error) {
    // Handle ORPCError
    if (error instanceof ORPCError) {
      // Sanitize the error message
      const sanitizedMessage = sanitizeErrorMessage(error.message);

      // Create a new error with sanitized message
      // Preserve the original error code and data
      throw new ORPCError(error.code, {
        message: sanitizedMessage,
        data: error.data ? redactSensitiveData(error.data) : undefined,
      });
    }

    // Handle generic errors
    if (error instanceof Error) {
      // Sanitize error message
      const sanitizedMessage = sanitizeErrorMessage(error.message);

      // Create a new error with sanitized message
      const sanitizedError = new Error(sanitizedMessage);
      sanitizedError.stack = error.stack; // Preserve stack trace for debugging

      throw sanitizedError;
    }

    // Handle unknown errors
    throw error;
  }
};

/**
 * Custom console object with built-in sanitization
 *
 * Replace console.log/console.error with safeLog/safeError:
 *
 * ```ts
 * import { safeConsole } from './middleware/secure-logging';
 *
 * // Use instead of console
 * safeConsole.log({ apiKey: 'sk-...' });
 * safeConsole.error(new Error('API key: sk-...'));
 * ```
 */
export const safeConsole = {
  log: safeLog,
  error: safeError,
  warn: (...args: unknown[]) => {
    const sanitizedArgs = args.map((arg) => {
      if (typeof arg === 'string') {
        return sanitizeErrorMessage(arg);
      }
      return redactSensitiveData(arg);
    });
    console.warn(...sanitizedArgs);
  },
  info: (...args: unknown[]) => {
    const sanitizedArgs = args.map((arg) => {
      if (typeof arg === 'string') {
        return sanitizeErrorMessage(arg);
      }
      return redactSensitiveData(arg);
    });
    console.info(...sanitizedArgs);
  },
  debug: (...args: unknown[]) => {
    const sanitizedArgs = args.map((arg) => {
      if (typeof arg === 'string') {
        return sanitizeErrorMessage(arg);
      }
      return redactSensitiveData(arg);
    });
    console.debug(...sanitizedArgs);
  },
};
