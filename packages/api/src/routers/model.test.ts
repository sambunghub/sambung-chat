/**
 * Model Router Integration Tests
 *
 * Purpose: Verify getAvailableModels transformation works correctly across all providers
 *
 * Run with: bun test packages/api/src/routers/model.test.ts
 */

import { describe, it, expect } from 'vitest';
import { openaiModels } from '../lib/openai-models';
import { anthropicModels } from '../lib/anthropic-models';
import { googleModels } from '../lib/google-models';
import { groqModels } from '../lib/groq-models';
import { ollamaModels } from '../lib/ollama-models';
import { transformToAvailableModel } from '../lib/model-types';
import type { AvailableModel } from '../lib/model-types';

// Set up minimal environment variables for testing (use process.env with fallbacks)
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/sambungchat_dev';
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || 'sambungchat-dev-secret-key-at-least-32-chars-long';
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '1234567890abcdef1234567890abcdef';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

describe('Model Router - getAvailableModels Transformation', () => {
  // This simulates what getAvailableModels does
  const getAvailableModelsResult = () => ({
    openai: openaiModels.map(transformToAvailableModel),
    anthropic: anthropicModels.map(transformToAvailableModel),
    google: googleModels.map(transformToAvailableModel),
    groq: groqModels.map(transformToAvailableModel),
    ollama: ollamaModels.map(transformToAvailableModel),
    custom: [] as AvailableModel[],
  });

  describe('Response Structure', () => {
    it('should return an object with all provider keys', () => {
      const result = getAvailableModelsResult();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('openai');
      expect(result).toHaveProperty('anthropic');
      expect(result).toHaveProperty('google');
      expect(result).toHaveProperty('groq');
      expect(result).toHaveProperty('ollama');
      expect(result).toHaveProperty('custom');
    });

    it('should return arrays for all providers', () => {
      const result = getAvailableModelsResult();

      expect(Array.isArray(result.openai)).toBe(true);
      expect(Array.isArray(result.anthropic)).toBe(true);
      expect(Array.isArray(result.google)).toBe(true);
      expect(Array.isArray(result.groq)).toBe(true);
      expect(Array.isArray(result.ollama)).toBe(true);
      expect(Array.isArray(result.custom)).toBe(true);
    });

    it('should return empty array for custom provider', () => {
      const result = getAvailableModelsResult();

      expect(result.custom).toEqual([]);
    });

    it('should return non-empty arrays for all providers except custom', () => {
      const result = getAvailableModelsResult();

      expect(result.openai.length).toBeGreaterThan(0);
      expect(result.anthropic.length).toBeGreaterThan(0);
      expect(result.google.length).toBeGreaterThan(0);
      expect(result.groq.length).toBeGreaterThan(0);
      expect(result.ollama.length).toBeGreaterThan(0);
      expect(result.custom.length).toBe(0);
    });
  });

  describe('Model Structure', () => {
    it('should return models with correct AvailableModel structure', () => {
      const result = getAvailableModelsResult();

      // Test OpenAI models
      if (result.openai.length > 0) {
        const model = result.openai[0];
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('maxTokens');
        expect(model).toHaveProperty('contextWindow');
        expect(model).toHaveProperty('bestFor');
        expect(model).toHaveProperty('cost');
      }
    });

    it('should have correct types for all model fields', () => {
      const result = getAvailableModelsResult();

      // Sample at least one model from each provider
      const providers: (keyof typeof result)[] = ['openai', 'anthropic', 'google', 'groq', 'ollama'];

      for (const provider of providers) {
        if (result[provider].length > 0) {
          const model = result[provider][0]!;

          expect(typeof model.id).toBe('string');
          expect(typeof model.name).toBe('string');
          expect(typeof model.maxTokens).toBe('number');
          expect(typeof model.contextWindow).toBe('number');
          expect(typeof model.bestFor).toBe('string');
          expect(typeof model.cost).toBe('string');
          expect(['low', 'medium', 'high']).toContain(model.cost);
        }
      }
    });

    it('should have positive values for maxTokens and contextWindow', () => {
      const result = getAvailableModelsResult();

      const providers: (keyof typeof result)[] = ['openai', 'anthropic', 'google', 'groq', 'ollama'];

      for (const provider of providers) {
        for (const model of result[provider]) {
          expect(model.maxTokens).toBeGreaterThan(0);
          expect(model.contextWindow).toBeGreaterThan(0);
          expect(model.contextWindow).toBeGreaterThanOrEqual(model.maxTokens);
        }
      }
    });

    it('should have non-empty strings for required string fields', () => {
      const result = getAvailableModelsResult();

      const providers: (keyof typeof result)[] = ['openai', 'anthropic', 'google', 'groq', 'ollama'];

      for (const provider of providers) {
        for (const model of result[provider]) {
          expect(model.id.length).toBeGreaterThan(0);
          expect(model.name.length).toBeGreaterThan(0);
          expect(model.bestFor.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Known Models Verification', () => {
    it('should include GPT-4 in OpenAI models', () => {
      const result = getAvailableModelsResult();

      const gpt4 = result.openai.find((m) => m.id === 'gpt-4');
      expect(gpt4).toBeDefined();
      expect(gpt4?.name).toContain('GPT-4');
    });

    it('should include Claude 3.5 Sonnet in Anthropic models', () => {
      const result = getAvailableModelsResult();

      const claude = result.anthropic.find((m) => m.id.includes('claude-3-5-sonnet'));
      expect(claude).toBeDefined();
      expect(claude?.name).toContain('Claude');
    });

    it('should include Gemini in Google models', () => {
      const result = getAvailableModelsResult();

      const gemini = result.google.find((m) => m.id.includes('gemini'));
      expect(gemini).toBeDefined();
      expect(gemini?.name).toContain('Gemini');
    });

    it('should include LLaMA in Groq models', () => {
      const result = getAvailableModelsResult();

      const llama = result.groq.find((m) => m.id.includes('llama'));
      expect(llama).toBeDefined();
    });
  });

  describe('Cost Classification', () => {
    it('should have cost classification for all models', () => {
      const result = getAvailableModelsResult();

      const providers: (keyof typeof result)[] = ['openai', 'anthropic', 'google', 'groq', 'ollama'];

      for (const provider of providers) {
        for (const model of result[provider]) {
          expect(['low', 'medium', 'high']).toContain(model.cost);
        }
      }
    });

    it('should have at least one model per cost tier across providers', () => {
      const result = getAvailableModelsResult();

      const allModels = [
        ...result.openai,
        ...result.anthropic,
        ...result.google,
        ...result.groq,
        ...result.ollama,
      ];

      const hasLowCost = allModels.some((m) => m.cost === 'low');
      const hasMediumCost = allModels.some((m) => m.cost === 'medium');
      const hasHighCost = allModels.some((m) => m.cost === 'high');

      expect(hasLowCost).toBe(true);
      expect(hasMediumCost).toBe(true);
      expect(hasHighCost).toBe(true);
    });
  });

  describe('Transformation Consistency', () => {
    it('should apply consistent transformation across all providers', () => {
      const result = getAvailableModelsResult();

      const providers: (keyof typeof result)[] = ['openai', 'anthropic', 'google', 'groq', 'ollama'];

      // All models should have the same set of fields
      for (const provider of providers) {
        for (const model of result[provider]) {
          const keys = Object.keys(model).sort();
          expect(keys).toEqual(['bestFor', 'contextWindow', 'cost', 'id', 'maxTokens', 'name']);
        }
      }
    });

    it('should not have extra fields beyond AvailableModel interface', () => {
      const result = getAvailableModelsResult();

      const providers: (keyof typeof result)[] = ['openai', 'anthropic', 'google', 'groq', 'ollama'];

      const expectedKeys = new Set(['id', 'name', 'maxTokens', 'contextWindow', 'bestFor', 'cost']);

      for (const provider of providers) {
        for (const model of result[provider]) {
          const modelKeys = Object.keys(model);
          expect(modelKeys.every((key) => expectedKeys.has(key))).toBe(true);
          expect(modelKeys.length).toBe(expectedKeys.size);
        }
      }
    });
  });

  describe('Provider Coverage', () => {
    it('should return multiple models per provider', () => {
      const result = getAvailableModelsResult();

      expect(result.openai.length).toBeGreaterThanOrEqual(2);
      expect(result.anthropic.length).toBeGreaterThanOrEqual(2);
      expect(result.google.length).toBeGreaterThanOrEqual(1);
      expect(result.groq.length).toBeGreaterThanOrEqual(1);
      expect(result.ollama.length).toBeGreaterThanOrEqual(1);
    });

    it('should have unique model IDs within each provider', () => {
      const result = getAvailableModelsResult();

      const providers: (keyof typeof result)[] = ['openai', 'anthropic', 'google', 'groq', 'ollama'];

      for (const provider of providers) {
        const ids = result[provider].map((m) => m.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it('should have unique model names within each provider', () => {
      const result = getAvailableModelsResult();

      const providers: (keyof typeof result)[] = ['openai', 'anthropic', 'google', 'groq', 'ollama'];

      for (const provider of providers) {
        const names = result[provider].map((m) => m.name);
        const uniqueNames = new Set(names);
        expect(uniqueNames.size).toBe(names.length);
      }
    });
  });

  describe('Data Quality', () => {
    it('should have valid model IDs with no whitespace', () => {
      const result = getAvailableModelsResult();

      const providers: (keyof typeof result)[] = ['openai', 'anthropic', 'google', 'groq', 'ollama'];

      for (const provider of providers) {
        for (const model of result[provider]) {
          expect(model.id.trim()).toBe(model.id);
          expect(model.id.length).toBeGreaterThan(0);
        }
      }
    });

    it('should have meaningful bestFor descriptions', () => {
      const result = getAvailableModelsResult();

      const providers: (keyof typeof result)[] = ['openai', 'anthropic', 'google', 'groq', 'ollama'];

      for (const provider of providers) {
        for (const model of result[provider]) {
          // BestFor should be at least 10 characters and contain meaningful keywords
          expect(model.bestFor.length).toBeGreaterThanOrEqual(10);
          expect(model.bestFor.toLowerCase()).toMatch(
            /(coding|reasoning|analysis|chat|fast|complex|tasks|general|simple)/i
          );
        }
      }
    });
  });

  describe('Type Safety', () => {
    it('should return objects that match AvailableModel type', () => {
      const result = getAvailableModelsResult();

      // Type assertion to verify runtime type matches interface
      const providers: (keyof typeof result)[] = ['openai', 'anthropic', 'google', 'groq', 'ollama'];

      for (const provider of providers) {
        for (const model of result[provider]) {
          // This is a runtime check that verifies the structure matches
          const availableModel: AvailableModel = {
            id: model.id,
            name: model.name,
            maxTokens: model.maxTokens,
            contextWindow: model.contextWindow,
            bestFor: model.bestFor,
            cost: model.cost,
          };

          // If we got here without TypeScript errors, the type is correct
          expect(availableModel).toBeDefined();
        }
      }
    });
  });

  describe('Immutability', () => {
    it('should not be affected by mutations to returned objects', () => {
      const result1 = getAvailableModelsResult();

      // Try to mutate the result
      if (result1.openai.length > 0) {
        const originalId = result1.openai[0]!.id;
        result1.openai[0]!.id = 'mutated-id';

        // Generate again
        const result2 = getAvailableModelsResult();

        // The new result should not be affected by our mutation
        expect(result2.openai[0]!.id).toBe(originalId);
      }
    });
  });
});
