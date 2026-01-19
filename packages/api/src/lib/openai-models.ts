/**
 * OpenAI Model Catalog
 *
 * Defines available OpenAI models with their capabilities, limits,
 * and best use cases. This catalog is used for model validation, UI display,
 * and provider configuration.
 */

/**
 * OpenAI model metadata
 */
export interface OpenAIModel {
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
 * Available OpenAI models
 *
 * This catalog includes popular OpenAI GPT models.
 */
export const openaiModels: OpenAIModel[] = [
	{
		id: 'gpt-4o',
		name: 'GPT-4o',
		maxTokens: 4096,
		contextWindow: 128000,
		bestFor: 'Multimodal tasks, complex reasoning, vision, coding',
		cost: 'high',
	},
	{
		id: 'gpt-4o-mini',
		name: 'GPT-4o Mini',
		maxTokens: 16384,
		contextWindow: 128000,
		bestFor: 'Fast responses, simple tasks, cost optimization',
		cost: 'low',
	},
	{
		id: 'gpt-4-turbo',
		name: 'GPT-4 Turbo',
		maxTokens: 4096,
		contextWindow: 128000,
		bestFor: 'Advanced reasoning, coding, analysis',
		cost: 'high',
	},
	{
		id: 'gpt-4',
		name: 'GPT-4',
		maxTokens: 8192,
		contextWindow: 8192,
		bestFor: 'Complex tasks, high-quality responses',
		cost: 'high',
	},
	{
		id: 'gpt-3.5-turbo',
		name: 'GPT-3.5 Turbo',
		maxTokens: 4096,
		contextWindow: 16385,
		bestFor: 'Quick responses, simple queries, cost-effective',
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
 * const model = getOpenAIModel('gpt-4o');
 * console.log(model?.name); // "GPT-4o"
 * ```
 */
export function getOpenAIModel(modelId: string): OpenAIModel | undefined {
	return openaiModels.find((model) => model.id === modelId);
}

/**
 * Validate if a model ID is a valid OpenAI model
 *
 * @param modelId - Model identifier to validate
 * @returns True if the model ID exists in the catalog
 *
 * @example
 * ```ts
 * if (isValidOpenAIModel('gpt-4o')) {
 *   // Use the model
 * }
 * ```
 */
export function isValidOpenAIModel(modelId: string): boolean {
	return openaiModels.some((model) => model.id === modelId);
}

/**
 * Get all OpenAI model IDs
 *
 * @returns Array of all valid OpenAI model IDs
 *
 * @example
 * ```ts
 * const modelIds = getOpenAIModelIds();
 * // ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', ...]
 * ```
 */
export function getOpenAIModelIds(): string[] {
	return openaiModels.map((model) => model.id);
}

/**
 * Get default OpenAI model
 *
 * Returns the recommended default model for OpenAI provider.
 * Currently GPT-4o is the recommended default.
 *
 * @returns Default model metadata
 * @throws Error if model catalog is empty
 */
export function getDefaultOpenAIModel(): OpenAIModel {
	const model = openaiModels[0];
	if (!model) {
		throw new Error('OpenAI model catalog is empty');
	}
	return model; // GPT-4o
}
