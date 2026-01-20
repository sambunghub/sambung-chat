import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

/**
 * Supported AI providers
 */
export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'groq'
  | 'ollama'
  | 'openrouter'
  | 'custom';

/**
 * Sanitizes base URL by removing common endpoint paths that AI SDK adds automatically
 *
 * AI SDK automatically appends `/chat/completions` to base URLs, so we need to
 * remove these paths if users accidentally include them in their input.
 *
 * @param baseURL - The base URL to sanitize
 * @returns Sanitized base URL without endpoint paths
 *
 * @example
 * ```ts
 * sanitizeBaseURL('https://api.example.com/v1/chat/completions')
 * // Returns: 'https://api.example.com/v1'
 *
 * sanitizeBaseURL('https://api.example.com/v1')
 * // Returns: 'https://api.example.com/v1'
 * ```
 */
export function sanitizeBaseURL(baseURL: string | undefined): string | undefined {
  if (!baseURL) return undefined;

  try {
    const url = new URL(baseURL);
    let pathname = url.pathname;

    // Remove common endpoint paths that AI SDK adds automatically
    // Sort by length descending to match longer paths first (e.g., '/v1/chat/completions' before '/chat/completions')
    const pathsToRemove = [
      '/v1/chat/completions',
      '/v1/completions',
      '/chat/completions',
      '/completions',
    ];

    for (const pathToRemove of pathsToRemove) {
      if (pathname.endsWith(pathToRemove)) {
        pathname = pathname.slice(0, -pathToRemove.length);
        break;
      }
    }

    // Remove trailing slash unless it's the root
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    url.pathname = pathname;
    return url.toString();
  } catch (error) {
    // If URL parsing fails, return original
    return baseURL;
  }
}

/**
 * Provider configuration options
 */
export interface ProviderConfig {
  provider: AIProvider;
  modelId: string;
  apiKey: string;
  baseURL?: string;
}

/**
 * Creates an OpenAI-compatible provider instance
 *
 * @param config - Provider configuration
 * @returns Language model instance
 */
function createOpenAIProvider(config: ProviderConfig) {
  const openai = createOpenAICompatible({
    name: config.provider === 'custom' ? 'custom' : config.provider,
    baseURL: sanitizeBaseURL(config.baseURL) || 'https://api.openai.com/v1',
    apiKey: config.apiKey,
  });

  return openai(config.modelId);
}

/**
 * Creates an Anthropic provider instance
 *
 * @param config - Provider configuration
 * @returns Language model instance
 */
function createAnthropicProvider(config: ProviderConfig) {
  const anthropicProvider = createAnthropic({
    apiKey: config.apiKey,
    baseURL: sanitizeBaseURL(config.baseURL) || 'https://api.anthropic.com',
  });

  return anthropicProvider(config.modelId);
}

/**
 * Creates a Google AI provider instance
 *
 * @param config - Provider configuration
 * @returns Language model instance
 *
 * @throws {Error} When @ai-sdk/google is not installed or API key is missing
 */
function createGoogleProvider(config: ProviderConfig) {
  try {
    // Import dynamically to avoid issues if @ai-sdk/google is not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { google } = require('@ai-sdk/google');

    return google(config.modelId, {
      apiKey: config.apiKey,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      throw new Error(
        'Google AI provider is not available. Install @ai-sdk/google package to use Google provider.'
      );
    }
    throw error;
  }
}

/**
 * Creates a Groq provider instance
 *
 * @param config - Provider configuration
 * @returns Language model instance
 */
function createGroqProvider(config: ProviderConfig) {
  const groq = createOpenAICompatible({
    name: 'groq',
    baseURL: sanitizeBaseURL(config.baseURL) || 'https://api.groq.com/openai/v1',
    apiKey: config.apiKey,
  });

  return groq(config.modelId);
}

/**
 * Creates an Ollama provider instance
 *
 * @param config - Provider configuration
 * @returns Language model instance
 */
function createOllamaProvider(config: ProviderConfig) {
  const ollama = createOpenAICompatible({
    name: 'ollama',
    baseURL: sanitizeBaseURL(config.baseURL) || 'http://localhost:11434/v1',
    apiKey: config.apiKey || 'ollama', // Ollama doesn't require API key, but library expects one
  });

  return ollama(config.modelId);
}

/**
 * Provider factory - creates AI provider instances based on configuration
 *
 * This factory abstracts the creation of different AI provider instances,
 * supporting:
 * - OpenAI and OpenAI-compatible APIs
 * - Anthropic Claude models
 * - Google Generative AI
 * - Groq
 * - Ollama (local models)
 * - Custom OpenAI-compatible endpoints
 *
 * @param config - Provider configuration including provider type, model ID, and optional credentials
 * @returns Wrapped language model ready for use with AI SDK
 *
 * @example
 * ```ts
 * // Create Anthropic provider
 * const anthropicModel = createAIProvider({
 *   provider: 'anthropic',
 *   modelId: 'claude-3-5-sonnet-20241022',
 * });
 *
 * // Create OpenAI provider with custom base URL
 * const openaiModel = createAIProvider({
 *   provider: 'openai',
 *   modelId: 'gpt-4o',
 *   baseURL: 'https://api.openai.com/v1',
 *   apiKey: 'sk-...',
 * });
 *
 * // Use with streamText
 * const result = await streamText({
 *   model: anthropicModel,
 *   messages: [...],
 * });
 * ```
 *
 * @throws {Error} When required API key is missing for the provider
 */
export function createAIProvider(config: ProviderConfig) {
  switch (config.provider) {
    case 'openai':
      return createOpenAIProvider(config);

    case 'anthropic':
      return createAnthropicProvider(config);

    case 'google':
      return createGoogleProvider(config);

    case 'groq':
      return createGroqProvider(config);

    case 'ollama':
      return createOllamaProvider(config);

    case 'openrouter':
      return createOpenAIProvider({
        ...config,
        baseURL: sanitizeBaseURL(config.baseURL) || 'https://openrouter.ai/api/v1',
      });

    case 'custom':
      return createOpenAIProvider(config);

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = config.provider;
      throw new Error(`Unsupported provider: ${_exhaustive}`);
    }
  }
}
