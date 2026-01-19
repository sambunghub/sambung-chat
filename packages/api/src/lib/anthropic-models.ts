/**
 * Anthropic Claude Model Catalog
 *
 * Defines available Anthropic/Claude models with their capabilities, limits,
 * and best use cases. This catalog is used for model validation, UI display,
 * and provider configuration.
 */

/**
 * Anthropic model metadata
 */
export interface AnthropicModel {
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
 * Available Anthropic Claude models
 *
 * This catalog includes all officially supported Claude 3 and Claude 3.5 models.
 * All Claude 3.x models support a 200K token context window.
 */
export const anthropicModels: AnthropicModel[] = [
	{
		id: 'claude-3-5-sonnet-20241022',
		name: 'Claude 3.5 Sonnet',
		maxTokens: 8192,
		contextWindow: 200000,
		bestFor: 'Complex reasoning, coding, analysis, content creation',
		cost: 'medium',
	},
	{
		id: 'claude-3-5-haiku-20241022',
		name: 'Claude 3.5 Haiku',
		maxTokens: 8192,
		contextWindow: 200000,
		bestFor: 'Fast responses, simple tasks, high-volume requests',
		cost: 'low',
	},
	{
		id: 'claude-3-opus-20240229',
		name: 'Claude 3 Opus',
		maxTokens: 4096,
		contextWindow: 200000,
		bestFor: 'Most complex tasks, highest quality responses, creative writing',
		cost: 'high',
	},
	{
		id: 'claude-3-sonnet-20240229',
		name: 'Claude 3 Sonnet',
		maxTokens: 4096,
		contextWindow: 200000,
		bestFor: 'Balanced performance and speed, general-purpose tasks',
		cost: 'medium',
	},
	{
		id: 'claude-3-haiku-20240307',
		name: 'Claude 3 Haiku',
		maxTokens: 4096,
		contextWindow: 200000,
		bestFor: 'Quick responses, cost optimization, simple queries',
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
 * const model = getAnthropicModel('claude-3-5-sonnet-20241022');
 * console.log(model?.name); // "Claude 3.5 Sonnet"
 * ```
 */
export function getAnthropicModel(modelId: string): AnthropicModel | undefined {
	return anthropicModels.find((model) => model.id === modelId);
}

/**
 * Validate if a model ID is a valid Anthropic model
 *
 * @param modelId - Model identifier to validate
 * @returns True if the model ID exists in the catalog
 *
 * @example
 * ```ts
 * if (isValidAnthropicModel('claude-3-5-sonnet-20241022')) {
 *   // Use the model
 * }
 * ```
 */
export function isValidAnthropicModel(modelId: string): boolean {
	return anthropicModels.some((model) => model.id === modelId);
}

/**
 * Get all Anthropic model IDs
 *
 * @returns Array of all valid Anthropic model IDs
 *
 * @example
 * ```ts
 * const modelIds = getAnthropicModelIds();
 * // ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', ...]
 * ```
 */
export function getAnthropicModelIds(): string[] {
	return anthropicModels.map((model) => model.id);
}

/**
 * Get default Anthropic model
 *
 * Returns the recommended default model for Anthropic provider.
 * Currently Claude 3.5 Sonnet is the recommended default.
 *
 * @returns Default model metadata
 * @throws Error if model catalog is empty
 */
export function getDefaultAnthropicModel(): AnthropicModel {
	const model = anthropicModels[0];
	if (!model) {
		throw new Error('Anthropic model catalog is empty');
	}
	return model; // Claude 3.5 Sonnet
}
