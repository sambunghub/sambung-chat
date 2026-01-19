/**
 * Google Generative AI Model Catalog
 *
 * Defines available Google AI models with their capabilities, limits,
 * and best use cases. This catalog is used for model validation, UI display,
 * and provider configuration.
 */

/**
 * Google AI model metadata
 */
export interface GoogleModel {
	/**
	 * Model identifier used in API calls
	 */
	id: string;

	/**
	 * Human-readable model name
	 */
	name: string;

	/**
	 * Maximum number of tokens in the response (maxTokens parameter)
	 */
	maxTokens: number;

	/**
	 * Maximum context window size (input + output tokens)
	 */
	contextWindow: number;

	/**
	 * Description of best use cases for this model
	 */
	bestFor: string;

	/**
	 * Cost tier for this model
	 */
	cost: 'low' | 'medium' | 'high';
}

/**
 * Available Google AI models
 *
 * This catalog includes popular Google Gemini models.
 */
export const googleModels: GoogleModel[] = [
	{
		id: 'gemini-2.0-flash-exp',
		name: 'Gemini 2.0 Flash Experimental',
		maxTokens: 8192,
		contextWindow: 1000000,
		bestFor: 'Experimental features, cutting-edge capabilities, multimodal tasks',
		cost: 'medium',
	},
	{
		id: 'gemini-1.5-pro',
		name: 'Gemini 1.5 Pro',
		maxTokens: 8192,
		contextWindow: 2000000,
		bestFor: 'Complex reasoning, coding, analysis, large context understanding',
		cost: 'high',
	},
	{
		id: 'gemini-1.5-flash',
		name: 'Gemini 1.5 Flash',
		maxTokens: 8192,
		contextWindow: 1000000,
		bestFor: 'Fast responses, simple tasks, cost optimization',
		cost: 'low',
	},
	{
		id: 'gemini-1.0-pro',
		name: 'Gemini 1.0 Pro',
		maxTokens: 2048,
		contextWindow: 32000,
		bestFor: 'General-purpose tasks, legacy support',
		cost: 'low',
	},
];

/**
 * Get model metadata by ID
 *
 * @param modelId - Model identifier to look up
 * @returns Model metadata or undefined if not found
 *
 * @example
 * ```ts
 * const model = getGoogleModel('gemini-1.5-pro');
 * console.log(model?.name); // "Gemini 1.5 Pro"
 * ```
 */
export function getGoogleModel(modelId: string): GoogleModel | undefined {
	return googleModels.find((model) => model.id === modelId);
}

/**
 * Validate if a model ID is a valid Google AI model
 *
 * @param modelId - Model identifier to validate
 * @returns True if the model ID exists in the catalog
 *
 * @example
 * ```ts
 * if (isValidGoogleModel('gemini-1.5-pro')) {
 *   // Use the model
 * }
 * ```
 */
export function isValidGoogleModel(modelId: string): boolean {
	return googleModels.some((model) => model.id === modelId);
}

/**
 * Get all Google AI model IDs
 *
 * @returns Array of all valid Google AI model IDs
 *
 * @example
 * ```ts
 * const modelIds = getGoogleModelIds();
 * // ['gemini-2.0-flash-exp', 'gemini-1.5-pro', ...]
 * ```
 */
export function getGoogleModelIds(): string[] {
	return googleModels.map((model) => model.id);
}

/**
 * Get default Google AI model
 *
 * Returns the recommended default model for Google AI provider.
 * Currently Gemini 1.5 Pro is the recommended default.
 *
 * @returns Default model metadata
 * @throws Error if model catalog is empty
 */
export function getDefaultGoogleModel(): GoogleModel {
	const model = googleModels[1]; // Gemini 1.5 Pro
	if (!model) {
		throw new Error('Google AI model catalog is empty');
	}
	return model;
}
