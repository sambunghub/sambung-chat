/**
 * Shared Model Types
 *
 * Defines common types for all AI model providers. This ensures consistency
 * across OpenAI, Anthropic, Google, Groq, and Ollama providers, and provides
 * a unified interface for model metadata transformations.
 */

/**
 * Base provider model interface
 *
 * All provider-specific model types (OpenAIModel, AnthropicModel, etc.)
 * must conform to this interface. This ensures that model metadata is
 * consistent across all providers and enables generic transformations.
 *
 * @example
 * ```ts
 * // All these types are compatible with BaseProviderModel:
 * const openaiModel: OpenAIModel = { id: 'gpt-4', name: 'GPT-4', ... };
 * const anthropicModel: AnthropicModel = { id: 'claude-3-5-sonnet-20241022', ... };
 *
 * function transformModel<T extends BaseProviderModel>(model: T) {
 *   return { id: model.id, name: model.name, ... };
 * }
 * ```
 */
export interface BaseProviderModel {
  /**
   * Model identifier used in API calls
   *
   * This is the unique ID that gets passed to the provider's API.
   * For example: 'gpt-4', 'claude-3-5-sonnet-20241022', etc.
   */
  id: string;

  /**
   * Human-readable model name
   *
   * A friendly name for display in the UI.
   * For example: 'GPT-4', 'Claude 3.5 Sonnet', etc.
   */
  name: string;

  /**
   * Maximum number of tokens in the response (maxTokens parameter)
   *
   * This represents the maximum tokens that can be generated in a single
   * completion. This is typically smaller than the context window.
   */
  maxTokens: number;

  /**
   * Maximum context window size (input + output tokens)
   *
   * The total number of tokens (input prompt + generated output) that
   * the model can process in a single request.
   */
  contextWindow: number;

  /**
   * Description of best use cases for this model
   *
   * Helps users understand when to use this particular model.
   * For example: 'Complex reasoning, coding, analysis'
   */
  bestFor: string;

  /**
   * Cost tier for this model
   *
   * Rough categorization of the model's cost level to help users
   * make informed decisions about which model to use.
   */
  cost: 'low' | 'medium' | 'high';
}

/**
 * Available model response type
 *
 * This is the structure returned by the getAvailableModels procedure.
 * It matches the BaseProviderModel interface since we transform all
 * provider models to this common structure.
 *
 * @example
 * ```ts
 * const availableModel: AvailableModel = {
 *   id: 'gpt-4',
 *   name: 'GPT-4',
 *   maxTokens: 4096,
 *   contextWindow: 8192,
 *   bestFor: 'Complex reasoning, coding',
 *   cost: 'high'
 * };
 * ```
 */
export type AvailableModel = BaseProviderModel;

/**
 * Transform a provider-specific model to the common AvailableModel format
 *
 * This utility function extracts the common fields from any provider model
 * (OpenAI, Anthropic, Google, Groq, Ollama) and returns a standardized
 * AvailableModel object. This eliminates code duplication in the
 * getAvailableModels procedure.
 *
 * @template T - Type extending BaseProviderModel (e.g., OpenAIModel, AnthropicModel)
 * @param model - Provider-specific model object
 * @returns Standardized AvailableModel object
 *
 * @example
 * ```ts
 * import { openaiModels } from './openai-models';
 * import { anthropicModels } from './anthropic-models';
 * import { transformToAvailableModel } from './model-types';
 *
 * // Works with any provider model
 * const openaiAvailable = openaiModels.map(transformToAvailableModel);
 * const anthropicAvailable = anthropicModels.map(transformToAvailableModel);
 *
 * // Returns: AvailableModel[] for each provider
 * ```
 */
export function transformToAvailableModel<T extends BaseProviderModel>(
  model: T
): AvailableModel {
  return {
    id: model.id,
    name: model.name,
    maxTokens: model.maxTokens,
    contextWindow: model.contextWindow,
    bestFor: model.bestFor,
    cost: model.cost,
  };
}
