/**
 * Ollama Model Catalog
 *
 * Defines popular Ollama models with their capabilities, limits,
 * and best use cases. This catalog is used for model validation, UI display,
 * and provider configuration.
 *
 * Note: Ollama is a self-hosted solution, so models must be manually
 * pulled by the user. This catalog represents commonly available models.
 */

/**
 * Ollama model metadata
 */
export interface OllamaModel {
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
	 * Cost tier for this model (always "low" for self-hosted)
	 */
	cost: 'low';
}

/**
 * Available Ollama models
 *
 * This catalog includes popular open-source models available through Ollama.
 * Users must pull these models manually using `ollama pull <model>`.
 */
export const ollamaModels: OllamaModel[] = [
	{
		id: 'llama3.3',
		name: 'Llama 3.3 70B',
		maxTokens: 4096,
		contextWindow: 128000,
		bestFor: 'General-purpose tasks, reasoning, coding, privacy-sensitive data',
		cost: 'low',
	},
	{
		id: 'llama3.2',
		name: 'Llama 3.2 3B',
		maxTokens: 4096,
		contextWindow: 128000,
		bestFor: 'Lightweight tasks, quick responses, resource-constrained environments',
		cost: 'low',
	},
	{
		id: 'mistral',
		name: 'Mistral 7B',
		maxTokens: 4096,
		contextWindow: 8192,
		bestFor: 'Fast inference, general tasks, local deployment',
		cost: 'low',
	},
	{
		id: 'codellama',
		name: 'Code Llama',
		maxTokens: 4096,
		contextWindow: 16384,
		bestFor: 'Coding tasks, code generation, debugging',
		cost: 'low',
	},
	{
		id: 'qwen2.5',
		name: 'Qwen 2.5 72B',
		maxTokens: 8192,
		contextWindow: 128000,
		bestFor: 'Multilingual tasks, reasoning, coding',
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
 * const model = getOllamaModel('llama3.3');
 * console.log(model?.name); // "Llama 3.3 70B"
 * ```
 */
export function getOllamaModel(modelId: string): OllamaModel | undefined {
	return ollamaModels.find((model) => model.id === modelId);
}

/**
 * Validate if a model ID is a valid Ollama model
 *
 * @param modelId - Model identifier to validate
 * @returns True if the model ID exists in the catalog
 *
 * @example
 * ```ts
 * if (isValidOllamaModel('llama3.3')) {
 *   // Use the model
 * }
 * ```
 */
export function isValidOllamaModel(modelId: string): boolean {
	return ollamaModels.some((model) => model.id === modelId);
}

/**
 * Get all Ollama model IDs
 *
 * @returns Array of all valid Ollama model IDs
 *
 * @example
 * ```ts
 * const modelIds = getOllamaModelIds();
 * // ['llama3.3', 'llama3.2', 'mistral', ...]
 * ```
 */
export function getOllamaModelIds(): string[] {
	return ollamaModels.map((model) => model.id);
}

/**
 * Get default Ollama model
 *
 * Returns the recommended default model for Ollama provider.
 * Currently Llama 3.3 70B is the recommended default.
 *
 * @returns Default model metadata
 * @throws Error if model catalog is empty
 */
export function getDefaultOllamaModel(): OllamaModel {
	const model = ollamaModels[0];
	if (!model) {
		throw new Error('Ollama model catalog is empty');
	}
	return model; // Llama 3.3 70B
}
