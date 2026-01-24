import { ORPCError } from '@orpc/server';

/**
 * Error type constants for better error categorization
 *
 * These patterns are used to match and categorize different types of AI provider errors.
 * Each pattern contains a list of keywords or error codes that indicate a specific error type.
 */
export const ERROR_PATTERNS = {
  /** Rate limit errors - too many requests */
  RATE_LIMIT: [
    'rate limit',
    'rate_limit_exceeded',
    '429',
    'quota',
    'too many requests',
    'requests exceeded',
  ],
  /** Authentication failures - invalid or missing API keys */
  AUTHENTICATION: [
    'api key',
    'unauthorized',
    '401',
    '403',
    'authentication',
    'invalid api key',
    'incorrect api key',
  ],
  /** Model not found or access denied */
  MODEL_NOT_FOUND: [
    'model not found',
    'invalid model',
    '404',
    'model does not exist',
    'no such model',
  ],
  /** Context window exceeded */
  CONTEXT_EXCEEDED: [
    'context',
    'context_length_exceeded',
    'tokens',
    'too long',
    'maximum',
    'exceeds maximum length',
  ],
  /** Content policy violations */
  CONTENT_POLICY: ['content policy', 'content_filter', 'safety', 'moderation', 'policy violation'],
  /** Invalid request format */
  INVALID_REQUEST: ['invalid', 'validation', 'schema', 'malformed', 'bad request', '400'],
  /** Network and connectivity errors */
  NETWORK: ['network', 'connection', 'fetch', 'econnrefused', 'etimedout', 'timeout', 'dns'],
  /** Service unavailable or maintenance */
  SERVICE_UNAVAILABLE: [
    '503',
    'service unavailable',
    'maintenance',
    'overloaded',
    'temporarily unavailable',
  ],
  /** Payment/billing related errors */
  PAYMENT_REQUIRED: ['payment', 'billing', 'insufficient', '402', 'quota exceeded'],
} as const;

/**
 * Type guard to check if error is an AI SDK error with additional properties
 *
 * @param error - The error to check
 * @returns True if the error is an Error instance with potential additional properties
 *
 * @example
 * ```ts
 * try {
 *   await generateText({ model, messages });
 * } catch (error) {
 *   if (isAIError(error)) {
 *     console.log(error.message); // Safe to access Error properties
 *   }
 * }
 * ```
 */
function isAIError(
  error: unknown
): error is Error & { cause?: unknown; statusCode?: number; code?: string } {
  return error instanceof Error;
}

/**
 * Extract error code from error object if available
 *
 * Checks both the direct `code` property and nested `cause.code` property.
 *
 * @param error - The error to extract code from
 * @returns The error code if found, undefined otherwise
 *
 * @example
 * ```ts
 * const code = extractErrorCode(error);
 * if (code === 'rate_limit_exceeded') {
 *   // Handle rate limit
 * }
 * ```
 */
function extractErrorCode(error: unknown): string | undefined {
  if (isAIError(error)) {
    // Check for code property directly
    if ('code' in error && typeof error.code === 'string') {
      return error.code;
    }

    // Check for cause property
    if ('cause' in error && typeof error.cause === 'object' && error.cause !== null) {
      if ('code' in error.cause && typeof error.cause.code === 'string') {
        return error.cause.code;
      }
    }
  }
  return undefined;
}

/**
 * Sanitize error message by removing sensitive information
 *
 * Removes API keys that may accidentally be included in error messages.
 * This prevents sensitive data from being logged or returned to clients.
 *
 * @param message - The error message to sanitize
 * @returns Sanitized message with API keys replaced with placeholders
 *
 * @example
 * ```ts
 * const original = 'Failed with API key sk-abc123def456...';
 * const sanitized = sanitizeErrorMessage(original);
 * // sanitized = 'Failed with API key sk-****'
 * ```
 */
function sanitizeErrorMessage(message: string): string {
  // Remove API keys if accidentally included
  return message.replace(/sk-[a-zA-Z0-9-]{20,}/g, 'sk-****');
}

/**
 * Check if error message matches any of the provided patterns
 *
 * Performs case-insensitive substring matching against an array of patterns.
 *
 * @param errorMessage - The error message to check
 * @param patterns - Array of pattern strings to match against
 * @returns True if any pattern matches the error message
 *
 * @example
 * ```ts
 * const isRateLimit = matchesPattern(
 *   'rate_limit_exceeded',
 *   ERROR_PATTERNS.RATE_LIMIT
 * ); // true
 * ```
 */
function matchesPattern(errorMessage: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => errorMessage.toLowerCase().includes(pattern.toLowerCase()));
}

/**
 * Handle AI SDK errors and convert them to ORPC errors
 *
 * This function provides comprehensive error handling for AI provider errors,
 * including rate limits, authentication failures, network issues, and more.
 *
 * Error categories:
 * - **Rate limits** (429): Thrown when API rate limits are exceeded
 * - **Authentication** (401/403): Invalid or missing API keys
 * - **Model not found** (404): Model doesn't exist or access is denied
 * - **Context exceeded**: Conversation too long for model's context window
 * - **Content policy**: Message flagged by safety filters
 * - **Invalid request**: Malformed request or validation errors
 * - **Network**: Connection issues, timeouts, DNS failures
 * - **Service unavailable** (503): Provider is down or maintenance
 * - **Payment required** (402): Billing issues or quota exceeded
 *
 * @param error - The error caught from AI SDK
 * @throws {ORPCError} with appropriate error code and user-friendly message
 *
 * @example
 * ```ts
 * try {
 *   const result = await streamText({ model, messages });
 * } catch (error) {
 *   handleAIError(error); // Always throws ORPCError
 * }
 * ```
 */
export function handleAIError(error: unknown): never {
  // Handle non-Error objects
  if (!isAIError(error)) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'An unknown error occurred',
    });
  }

  const errorMessage = sanitizeErrorMessage(error.message).toLowerCase();
  const errorCode = extractErrorCode(error);

  // Log error for debugging (without sensitive data)
  console.error('[AI Error]', {
    message: sanitizeErrorMessage(error.message),
    code: errorCode,
    name: error.name,
  });

  // Rate limit errors - most common
  if (matchesPattern(errorMessage, ERROR_PATTERNS.RATE_LIMIT)) {
    throw new ORPCError('TOO_MANY_REQUESTS', {
      message: 'Rate limit exceeded. Please wait a moment and try again.',
    });
  }

  // Authentication errors - invalid or missing API keys
  if (matchesPattern(errorMessage, ERROR_PATTERNS.AUTHENTICATION)) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'Invalid API key. Please check your provider credentials.',
    });
  }

  // Model not found or access denied
  if (matchesPattern(errorMessage, ERROR_PATTERNS.MODEL_NOT_FOUND)) {
    throw new ORPCError('NOT_FOUND', {
      message: 'The specified model is not available or you do not have access to it.',
    });
  }

  // Context window exceeded
  if (matchesPattern(errorMessage, ERROR_PATTERNS.CONTEXT_EXCEEDED)) {
    throw new ORPCError('BAD_REQUEST', {
      message:
        'The conversation is too long. Please start a new chat or reduce the message length.',
    });
  }

  // Content policy violations
  if (matchesPattern(errorMessage, ERROR_PATTERNS.CONTENT_POLICY)) {
    throw new ORPCError('BAD_REQUEST', {
      message:
        'The content was flagged by the safety filter. Please modify your message and try again.',
    });
  }

  // Invalid request format
  if (matchesPattern(errorMessage, ERROR_PATTERNS.INVALID_REQUEST)) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Invalid request format. Please check your input and try again.',
    });
  }

  // Network and connectivity errors
  if (matchesPattern(errorMessage, ERROR_PATTERNS.NETWORK)) {
    throw new ORPCError('SERVICE_UNAVAILABLE', {
      message: 'Network error. Please check your connection and try again.',
    });
  }

  // Service unavailable or maintenance
  if (matchesPattern(errorMessage, ERROR_PATTERNS.SERVICE_UNAVAILABLE)) {
    throw new ORPCError('SERVICE_UNAVAILABLE', {
      message: 'The service is temporarily unavailable. Please try again later.',
    });
  }

  // Payment/billing related errors
  if (matchesPattern(errorMessage, ERROR_PATTERNS.PAYMENT_REQUIRED)) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Payment required or quota exceeded. Please check your billing details.',
    });
  }

  // Generic server error with sanitized message
  throw new ORPCError('INTERNAL_SERVER_ERROR', {
    message:
      sanitizeErrorMessage(error.message) || 'An error occurred while processing your request',
  });
}
