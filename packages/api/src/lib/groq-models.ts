/**
 * Groq Model Catalog
 *
 * Defines available Groq models with their capabilities, limits,
 * and best use cases. This catalog is used for model validation, UI display,
 * and provider configuration.
 */

/**
 * Groq model metadata
 */
export interface GroqModel {
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
 * Available Groq models
 *
 * This catalog includes popular Groq-hosted open-source models.
 * Note: Groq offers very fast inference with competitive pricing.
 */
export const groqModels: GroqModel[] = [
	{
		id: 'llama-3.3-70b-versatile',
		name: 'Llama 3.3 70B Versatile',
		maxTokens: 8192,
		contextWindow: 128000,
		bestFor: 'General-purpose tasks, reasoning, coding',
		cost: 'low',
	},
	{
		id: 'llama-3.1-70b-versatile',
		name: 'Llama 3.1 70B Versatile',
		maxTokens: 8192,
		contextWindow: 128000,
		bestFor: 'Complex reasoning, coding, analysis',
		cost: 'low',
	},
	{
		id: 'mixtral-8x7b-32768',
		name: 'Mixtral 8x7b',
		maxTokens: 32768,
		contextWindow: 32768,
		bestFor: 'Fast inference, general tasks, cost optimization',
		cost: 'low',
	},
	{
		id: 'gemma2-9b-it',
		name: 'Gemma 2 9B',
		maxTokens: 8192,
		contextWindow: 8192,
		bestFor: 'Lightweight tasks, quick responses',
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
 * const model = getGroqModel('llama-3.3-70b-versatile');
 * console.log(model?.name); // "Llama 3.3 70B Versatile"
 * ```
 */
export function getGroqModel(modelId: string): GroqModel | undefined {
	return groqModels.find((model) => model.id === modelId);
}

/**
 * Validate if a model ID is a valid Groq model
 *
 * @param modelId - Model identifier to validate
 * @returns True if the model ID exists in the catalog
 *
 * @example
 * ```ts
 * if (isValidGroqModel('llama-3.3-70b-versatile')) {
 *   // Use the model
 * }
 * ```
 */
export function isValidGroqModel(modelId: string): boolean {
	return groqModels.some((model) => model.id === modelId);
}

/**
 * Get all Groq model IDs
 *
 * @returns Array of all valid Groq model IDs
 *
 * @example
 * ```ts
 * const modelIds = getGroqModelIds();
 * // ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', ...]
 * ```
 */
export function getGroqModelIds(): string[] {
	return groqModels.map((model) => model.id);
}

/**
 * Get default Groq model
 *
 * Returns the recommended default model for Groq provider.
 * Currently Llama 3.3 70B Versatile is the recommended default.
 *
 * @returns Default model metadata
 * @throws Error if model catalog is empty
 */
export function getDefaultGroqModel(): GroqModel {
	const model = groqModels[0];
	if (!model) {
		throw new Error('Groq model catalog is empty');
	}
	return model; // Llama 3.3 70B Versatile
}
