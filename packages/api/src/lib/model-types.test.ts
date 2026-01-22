/**
 * Model Types Unit Tests
 *
 * Purpose: Test the transformToAvailableModel utility function that transforms
 * provider-specific models (OpenAI, Anthropic, Google, Groq, Ollama) into a
 * common AvailableModel format.
 *
 * Test Coverage:
 * - Basic transformation (all fields correctly mapped)
 * - Type safety (works with different provider models)
 * - Data integrity (fields are not modified)
 * - Edge cases (missing fields, invalid values)
 * - Array transformation (map usage with multiple models)
 */

import { describe, it, expect } from 'vitest';
import { transformToAvailableModel } from './model-types';
import type { BaseProviderModel, AvailableModel } from './model-types';

// Test model implementations that match BaseProviderModel interface
interface TestModel extends BaseProviderModel {
  id: string;
  name: string;
  maxTokens: number;
  contextWindow: number;
  bestFor: string;
  cost: 'low' | 'medium' | 'high';
}

describe('transformToAvailableModel', () => {
  describe('Basic transformation', () => {
    it('should transform a valid model with all required fields', () => {
      const testModel: TestModel = {
        id: 'test-model-1',
        name: 'Test Model 1',
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: 'Testing, validation, examples',
        cost: 'medium',
      };

      const result = transformToAvailableModel(testModel);

      // Verify all fields are correctly mapped
      expect(result).toEqual({
        id: 'test-model-1',
        name: 'Test Model 1',
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: 'Testing, validation, examples',
        cost: 'medium',
      });

      // Verify the result matches AvailableModel type
      expect(result.id).toBe(testModel.id);
      expect(result.name).toBe(testModel.name);
      expect(result.maxTokens).toBe(testModel.maxTokens);
      expect(result.contextWindow).toBe(testModel.contextWindow);
      expect(result.bestFor).toBe(testModel.bestFor);
      expect(result.cost).toBe(testModel.cost);
    });

    it('should handle models with low cost tier', () => {
      const lowCostModel: TestModel = {
        id: 'low-cost-model',
        name: 'Low Cost Model',
        maxTokens: 8192,
        contextWindow: 32000,
        bestFor: 'Simple tasks, cost optimization',
        cost: 'low',
      };

      const result = transformToAvailableModel(lowCostModel);

      expect(result.cost).toBe('low');
      expect(result).toHaveProperty('id', lowCostModel.id);
      expect(result).toHaveProperty('name', lowCostModel.name);
    });

    it('should handle models with medium cost tier', () => {
      const mediumCostModel: TestModel = {
        id: 'medium-cost-model',
        name: 'Medium Cost Model',
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: 'Balanced performance and speed',
        cost: 'medium',
      };

      const result = transformToAvailableModel(mediumCostModel);

      expect(result.cost).toBe('medium');
    });

    it('should handle models with high cost tier', () => {
      const highCostModel: TestModel = {
        id: 'high-cost-model',
        name: 'High Cost Model',
        maxTokens: 4096,
        contextWindow: 200000,
        bestFor: 'Complex reasoning, highest quality',
        cost: 'high',
      };

      const result = transformToAvailableModel(highCostModel);

      expect(result.cost).toBe('high');
    });

    it('should handle models with large context windows', () => {
      const largeContextModel: TestModel = {
        id: 'large-context-model',
        name: 'Large Context Model',
        maxTokens: 8192,
        contextWindow: 2000000,
        bestFor: 'Long documents, extensive analysis',
        cost: 'high',
      };

      const result = transformToAvailableModel(largeContextModel);

      expect(result.contextWindow).toBe(2000000);
      expect(result.maxTokens).toBe(8192);
    });

    it('should handle models with small context windows', () => {
      const smallContextModel: TestModel = {
        id: 'small-context-model',
        name: 'Small Context Model',
        maxTokens: 2048,
        contextWindow: 4096,
        bestFor: 'Simple queries, quick responses',
        cost: 'low',
      };

      const result = transformToAvailableModel(smallContextModel);

      expect(result.contextWindow).toBe(4096);
      expect(result.maxTokens).toBe(2048);
    });
  });

  describe('Type safety and generic support', () => {
    it('should work with OpenAI-like models', () => {
      const openaiLikeModel = {
        id: 'gpt-4o',
        name: 'GPT-4o',
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: 'Multimodal tasks, complex reasoning',
        cost: 'high' as const,
        // OpenAI-specific fields (should be ignored)
        provider: 'openai' as const,
        version: '2024-05-13',
      };

      const result = transformToAvailableModel(openaiLikeModel);

      expect(result.id).toBe('gpt-4o');
      expect(result.name).toBe('GPT-4o');
      expect(result).not.toHaveProperty('provider');
      expect(result).not.toHaveProperty('version');
    });

    it('should work with Anthropic-like models', () => {
      const anthropicLikeModel = {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        maxTokens: 8192,
        contextWindow: 200000,
        bestFor: 'Complex reasoning, coding, analysis',
        cost: 'medium' as const,
        // Anthropic-specific fields (should be ignored)
        provider: 'anthropic' as const,
        type: 'claude-3.5',
      };

      const result = transformToAvailableModel(anthropicLikeModel);

      expect(result.id).toBe('claude-3-5-sonnet-20241022');
      expect(result.name).toBe('Claude 3.5 Sonnet');
      expect(result).not.toHaveProperty('provider');
      expect(result).not.toHaveProperty('type');
    });

    it('should work with Google-like models', () => {
      const googleLikeModel = {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        maxTokens: 8192,
        contextWindow: 1000000,
        bestFor: 'Multimodal understanding, long context',
        cost: 'high' as const,
        // Google-specific fields (should be ignored)
        provider: 'google' as const,
        family: 'gemini',
      };

      const result = transformToAvailableModel(googleLikeModel);

      expect(result.id).toBe('gemini-1.5-pro');
      expect(result.name).toBe('Gemini 1.5 Pro');
      expect(result).not.toHaveProperty('provider');
      expect(result).not.toHaveProperty('family');
    });

    it('should work with Groq-like models', () => {
      const groqLikeModel = {
        id: 'llama-3.1-70b-versatile',
        name: 'Llama 3.1 70B Versatile',
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: 'Fast inference, general-purpose tasks',
        cost: 'low' as const,
        // Groq-specific fields (should be ignored)
        provider: 'groq' as const,
        backend: 'llama',
      };

      const result = transformToAvailableModel(groqLikeModel);

      expect(result.id).toBe('llama-3.1-70b-versatile');
      expect(result.name).toBe('Llama 3.1 70B Versatile');
      expect(result).not.toHaveProperty('provider');
      expect(result).not.toHaveProperty('backend');
    });

    it('should work with Ollama-like models', () => {
      const ollamaLikeModel = {
        id: 'llama3.2',
        name: 'Llama 3.2',
        maxTokens: 2048,
        contextWindow: 128000,
        bestFor: 'Local deployment, privacy',
        cost: 'low' as const,
        // Ollama-specific fields (should be ignored)
        provider: 'ollama' as const,
        local: true,
      };

      const result = transformToAvailableModel(ollamaLikeModel);

      expect(result.id).toBe('llama3.2');
      expect(result.name).toBe('Llama 3.2');
      expect(result).not.toHaveProperty('provider');
      expect(result).not.toHaveProperty('local');
    });
  });

  describe('Data integrity', () => {
    it('should not modify the original model object', () => {
      const originalModel: TestModel = {
        id: 'original-model',
        name: 'Original Model',
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: 'Testing immutability',
        cost: 'medium',
      };

      const originalCopy = { ...originalModel };
      const result = transformToAvailableModel(originalModel);

      // Verify original model is unchanged
      expect(originalModel).toEqual(originalCopy);

      // Verify result is a new object
      expect(result).not.toBe(originalModel);

      // Modifying result should not affect original
      result.name = 'Modified Name';
      expect(originalModel.name).toBe('Original Model');
    });

    it('should create a new object for each call', () => {
      const testModel: TestModel = {
        id: 'test-model',
        name: 'Test Model',
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: 'Testing object creation',
        cost: 'low',
      };

      const result1 = transformToAvailableModel(testModel);
      const result2 = transformToAvailableModel(testModel);

      // Results should be equal but not the same reference
      expect(result1).toEqual(result2);
      expect(result1).not.toBe(result2);
    });

    it('should handle special characters in fields', () => {
      const specialModel: TestModel = {
        id: 'model-with-special-chars-123',
        name: 'Model (Special) & Characters!',
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: 'Testing <special> "characters" & symbols',
        cost: 'medium',
      };

      const result = transformToAvailableModel(specialModel);

      expect(result.name).toBe('Model (Special) & Characters!');
      expect(result.bestFor).toBe('Testing <special> "characters" & symbols');
    });

    it('should handle Unicode characters in fields', () => {
      const unicodeModel: TestModel = {
        id: 'model-unicode-测试',
        name: '模型 Unicode',
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: '多语言支持, 日本語, 한국어',
        cost: 'medium',
      };

      const result = transformToAvailableModel(unicodeModel);

      expect(result.name).toBe('模型 Unicode');
      expect(result.bestFor).toBe('多语言支持, 日本語, 한국어');
    });
  });

  describe('Array transformation (map usage)', () => {
    it('should transform an array of models', () => {
      const testModels: TestModel[] = [
        {
          id: 'model-1',
          name: 'Model 1',
          maxTokens: 4096,
          contextWindow: 128000,
          bestFor: 'Test 1',
          cost: 'low',
        },
        {
          id: 'model-2',
          name: 'Model 2',
          maxTokens: 8192,
          contextWindow: 200000,
          bestFor: 'Test 2',
          cost: 'medium',
        },
        {
          id: 'model-3',
          name: 'Model 3',
          maxTokens: 2048,
          contextWindow: 32000,
          bestFor: 'Test 3',
          cost: 'high',
        },
      ];

      const results = testModels.map(transformToAvailableModel);

      expect(results).toHaveLength(3);
      expect(results[0]!.id).toBe('model-1');
      expect(results[1]!.id).toBe('model-2');
      expect(results[2]!.id).toBe('model-3');

      // Verify all results are AvailableModel type
      results.forEach((result) => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('maxTokens');
        expect(result).toHaveProperty('contextWindow');
        expect(result).toHaveProperty('bestFor');
        expect(result).toHaveProperty('cost');
      });
    });

    it('should handle empty array', () => {
      const emptyModels: TestModel[] = [];
      const results = emptyModels.map(transformToAvailableModel);

      expect(results).toHaveLength(0);
      expect(results).toEqual([]);
    });

    it('should handle single-element array', () => {
      const singleModel: TestModel[] = [
        {
          id: 'single-model',
          name: 'Single Model',
          maxTokens: 4096,
          contextWindow: 128000,
          bestFor: 'Single test',
          cost: 'low',
        },
      ];

      const results = singleModel.map(transformToAvailableModel);

      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe('single-model');
    });

    it('should transform mixed provider models', () => {
      const mixedModels = [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          maxTokens: 4096,
          contextWindow: 128000,
          bestFor: 'OpenAI model',
          cost: 'high' as const,
          provider: 'openai' as const,
        },
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          maxTokens: 8192,
          contextWindow: 200000,
          bestFor: 'Anthropic model',
          cost: 'medium' as const,
          provider: 'anthropic' as const,
        },
        {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          maxTokens: 8192,
          contextWindow: 1000000,
          bestFor: 'Google model',
          cost: 'high' as const,
          provider: 'google' as const,
        },
      ];

      const results = mixedModels.map(transformToAvailableModel);

      expect(results).toHaveLength(3);

      // All should have BaseProviderModel fields
      results.forEach((result) => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('maxTokens');
        expect(result).toHaveProperty('contextWindow');
        expect(result).toHaveProperty('bestFor');
        expect(result).toHaveProperty('cost');

        // Should not have provider-specific fields
        expect(result).not.toHaveProperty('provider');
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle model with zero maxTokens', () => {
      const zeroTokensModel: TestModel = {
        id: 'zero-tokens',
        name: 'Zero Tokens Model',
        maxTokens: 0,
        contextWindow: 128000,
        bestFor: 'Edge case test',
        cost: 'low',
      };

      const result = transformToAvailableModel(zeroTokensModel);

      expect(result.maxTokens).toBe(0);
    });

    it('should handle model with zero contextWindow', () => {
      const zeroContextModel: TestModel = {
        id: 'zero-context',
        name: 'Zero Context Model',
        maxTokens: 4096,
        contextWindow: 0,
        bestFor: 'Edge case test',
        cost: 'low',
      };

      const result = transformToAvailableModel(zeroContextModel);

      expect(result.contextWindow).toBe(0);
    });

    it('should handle model with empty strings', () => {
      const emptyStringsModel: TestModel = {
        id: '',
        name: '',
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: '',
        cost: 'low',
      };

      const result = transformToAvailableModel(emptyStringsModel);

      expect(result.id).toBe('');
      expect(result.name).toBe('');
      expect(result.bestFor).toBe('');
    });

    it('should handle model with very long strings', () => {
      const longString = 'a'.repeat(10000);
      const longStringModel: TestModel = {
        id: 'long-string-model',
        name: longString,
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: longString,
        cost: 'low',
      };

      const result = transformToAvailableModel(longStringModel);

      expect(result.name).toBe(longString);
      expect(result.bestFor).toBe(longString);
      expect(result.name.length).toBe(10000);
    });

    it('should handle model with negative maxTokens (unusual but possible)', () => {
      const negativeTokensModel: TestModel = {
        id: 'negative-tokens',
        name: 'Negative Tokens Model',
        maxTokens: -1,
        contextWindow: 128000,
        bestFor: 'Edge case test',
        cost: 'low',
      };

      const result = transformToAvailableModel(negativeTokensModel);

      expect(result.maxTokens).toBe(-1);
    });

    it('should handle model with very large numbers', () => {
      const largeNumbersModel: TestModel = {
        id: 'large-numbers',
        name: 'Large Numbers Model',
        maxTokens: Number.MAX_SAFE_INTEGER,
        contextWindow: Number.MAX_SAFE_INTEGER,
        bestFor: 'Edge case test',
        cost: 'low',
      };

      const result = transformToAvailableModel(largeNumbersModel);

      expect(result.maxTokens).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.contextWindow).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('Type compatibility', () => {
    it('should return AvailableModel type', () => {
      const testModel: TestModel = {
        id: 'type-test',
        name: 'Type Test Model',
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: 'Type compatibility test',
        cost: 'medium',
      };

      const result: AvailableModel = transformToAvailableModel(testModel);

      // This test is mainly for compile-time type checking
      expect(result).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(typeof result.name).toBe('string');
      expect(typeof result.maxTokens).toBe('number');
      expect(typeof result.contextWindow).toBe('number');
      expect(typeof result.bestFor).toBe('string');
      expect(typeof result.cost).toBe('string');
    });

    it('should accept any object extending BaseProviderModel', () => {
      // Create a model that extends BaseProviderModel with extra fields
      const extendedModel = {
        id: 'extended-model',
        name: 'Extended Model',
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: 'Extended interface test',
        cost: 'high' as const,
        extraField1: 'extra1',
        extraField2: 42,
        extraField3: true,
      };

      const result = transformToAvailableModel(extendedModel);

      // Should only include BaseProviderModel fields
      expect(result.id).toBe('extended-model');
      expect(result).not.toHaveProperty('extraField1');
      expect(result).not.toHaveProperty('extraField2');
      expect(result).not.toHaveProperty('extraField3');
    });
  });

  describe('Real-world model examples', () => {
    it('should transform real OpenAI model', () => {
      const gpt4o = {
        id: 'gpt-4o',
        name: 'GPT-4o',
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: 'Multimodal tasks, complex reasoning, vision, coding',
        cost: 'high' as const,
      };

      const result = transformToAvailableModel(gpt4o);

      expect(result).toEqual({
        id: 'gpt-4o',
        name: 'GPT-4o',
        maxTokens: 4096,
        contextWindow: 128000,
        bestFor: 'Multimodal tasks, complex reasoning, vision, coding',
        cost: 'high',
      });
    });

    it('should transform real Anthropic model', () => {
      const claude35Sonnet = {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        maxTokens: 8192,
        contextWindow: 200000,
        bestFor: 'Complex reasoning, coding, analysis, content creation',
        cost: 'medium' as const,
      };

      const result = transformToAvailableModel(claude35Sonnet);

      expect(result).toEqual({
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        maxTokens: 8192,
        contextWindow: 200000,
        bestFor: 'Complex reasoning, coding, analysis, content creation',
        cost: 'medium',
      });
    });

    it('should transform multiple real models and maintain consistency', () => {
      const realModels = [
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          maxTokens: 16384,
          contextWindow: 128000,
          bestFor: 'Fast responses, simple tasks, cost optimization',
          cost: 'low' as const,
        },
        {
          id: 'claude-3-5-haiku-20241022',
          name: 'Claude 3.5 Haiku',
          maxTokens: 8192,
          contextWindow: 200000,
          bestFor: 'Fast responses, simple tasks, high-volume requests',
          cost: 'low' as const,
        },
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          maxTokens: 8192,
          contextWindow: 1000000,
          bestFor: 'Fast responses, cost-effective, multimodal',
          cost: 'low' as const,
        },
      ];

      const results = realModels.map(transformToAvailableModel);

      // Verify all have the same structure
      expect(results.every((r) => 'id' in r)).toBe(true);
      expect(results.every((r) => 'name' in r)).toBe(true);
      expect(results.every((r) => 'maxTokens' in r)).toBe(true);
      expect(results.every((r) => 'contextWindow' in r)).toBe(true);
      expect(results.every((r) => 'bestFor' in r)).toBe(true);
      expect(results.every((r) => 'cost' in r)).toBe(true);

      // Verify all have 'low' cost
      expect(results.every((r) => r.cost === 'low')).toBe(true);
    });
  });
});
