import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';
import { env } from '@sambung-chat/env/server';

// Type for the language model (inferred from AI SDK)
type LanguageModel = ReturnType<typeof wrapLanguageModel>;

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama' | 'custom';

/**
 * Provider configuration options
 */
export interface ProviderConfig {
	provider: AIProvider;
	modelId: string;
	apiKey?: string;
	baseURL?: string;
}

/**
 * Creates an OpenAI-compatible provider instance
 *
 * @param config - Provider configuration
 * @returns Wrapped language model with dev tools middleware
 */
function createOpenAIProvider(config: ProviderConfig): LanguageModel {
	const openai = createOpenAICompatible({
		name: config.provider === 'custom' ? 'custom' : config.provider,
		baseURL: config.baseURL || env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
		apiKey: config.apiKey || env.OPENAI_API_KEY || '',
	});

	const model = openai(config.modelId);

	return wrapLanguageModel({
		model,
		middleware: devToolsMiddleware(),
	});
}

/**
 * Creates an Anthropic provider instance
 *
 * @param config - Provider configuration
 * @returns Wrapped language model with dev tools middleware
 */
function createAnthropicProvider(config: ProviderConfig): LanguageModel {
	const apiKey = config.apiKey || env.ANTHROPIC_API_KEY;

	if (!apiKey) {
		throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable or provide apiKey in config.');
	}

	// Create Anthropic provider instance with custom settings
	const anthropicProvider = createAnthropic({
		apiKey,
		baseURL: config.baseURL || env.ANTHROPIC_BASE_URL,
	});

	// Create the model from the provider
	const model = anthropicProvider(config.modelId);

	return wrapLanguageModel({
		model,
		middleware: devToolsMiddleware(),
	});
}

/**
 * Creates a Google AI provider instance
 *
 * @param config - Provider configuration
 * @returns Wrapped language model with dev tools middleware
 *
 * @throws {Error} When @ai-sdk/google is not installed or API key is missing
 */
function createGoogleProvider(config: ProviderConfig): LanguageModel {
	try {
		// Import dynamically to avoid issues if @ai-sdk/google is not installed
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { google } = require('@ai-sdk/google');

		const apiKey = config.apiKey || env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_API_KEY;

		if (!apiKey) {
			throw new Error(
				'Google API key is required. Set GOOGLE_GENERATIVE_AI_API_KEY environment variable or provide apiKey in config.'
			);
		}

		const model = google(config.modelId, {
			apiKey,
		});

		return wrapLanguageModel({
			model,
			middleware: devToolsMiddleware(),
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
 * @returns Wrapped language model with dev tools middleware
 */
function createGroqProvider(config: ProviderConfig): LanguageModel {
	const groq = createOpenAICompatible({
		name: 'groq',
		baseURL: config.baseURL || env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
		apiKey: config.apiKey || env.GROQ_API_KEY || '',
	});

	const model = groq(config.modelId);

	return wrapLanguageModel({
		model,
		middleware: devToolsMiddleware(),
	});
}

/**
 * Creates an Ollama provider instance
 *
 * @param config - Provider configuration
 * @returns Wrapped language model with dev tools middleware
 */
function createOllamaProvider(config: ProviderConfig): LanguageModel {
	const ollama = createOpenAICompatible({
		name: 'ollama',
		baseURL: config.baseURL || env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
		apiKey: config.apiKey || 'ollama', // Ollama doesn't require API key, but library expects one
	});

	const model = ollama(config.modelId);

	return wrapLanguageModel({
		model,
		middleware: devToolsMiddleware(),
	});
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
export function createAIProvider(config: ProviderConfig): LanguageModel {
	switch (config.provider) {
		case 'openai':
		case 'custom':
			return createOpenAIProvider(config);

		case 'anthropic':
			return createAnthropicProvider(config);

		case 'google':
			return createGoogleProvider(config);

		case 'groq':
			return createGroqProvider(config);

		case 'ollama':
			return createOllamaProvider(config);

		default:
			// TypeScript exhaustiveness check
			const _exhaustive: never = config.provider;
			throw new Error(`Unsupported provider: ${_exhaustive}`);
	}
}

/**
 * Validates if a provider has the required configuration
 *
 * @param provider - Provider type to validate
 * @returns True if provider has required API key or configuration
 */
export function isProviderConfigured(provider: AIProvider): boolean {
	switch (provider) {
		case 'openai':
		case 'custom':
			return !!env.OPENAI_API_KEY;

		case 'anthropic':
			return !!env.ANTHROPIC_API_KEY;

		case 'google':
			return !!(env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_API_KEY);

		case 'groq':
			return !!env.GROQ_API_KEY;

		case 'ollama':
			return true; // Ollama doesn't require API key

		default:
			// TypeScript exhaustiveness check
			const _exhaustive: never = provider;
			throw new Error(`Unsupported provider: ${_exhaustive}`);
	}
}

/**
 * Gets all configured providers
 *
 * @returns Array of provider types that have valid configuration
 */
export function getConfiguredProviders(): AIProvider[] {
	const providers: AIProvider[] = ['openai', 'anthropic', 'google', 'groq', 'ollama', 'custom'];

	return providers.filter((provider) => isProviderConfigured(provider));
}
