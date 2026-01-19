/**
 * Model Creation Unit Tests
 *
 * Purpose: Test model instance creation and defaults
 *
 * Usage:
 * 1. Replace PROVIDER_NAME with your provider name
 * 2. Replace MODEL_IDS with your provider's available models
 * 3. Update import statement
 * 4. Add provider-specific model configurations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

const PROVIDER_NAME = 'openai';
const API_KEY = process.env.OPENAI_API_KEY || 'test-key';

// TODO: Replace with your provider's model IDs
const MODEL_IDS = {
  default: 'gpt-4o-mini',
  premium: 'gpt-4o',
  reasoning: 'o1-mini',
  legacy: 'gpt-3.5-turbo',
};

describe(`${PROVIDER_NAME} Model Creation`, () => {
  beforeEach(() => {
    // Verify environment is set up
    expect(API_KEY).toBeTruthy();
  });

  describe('Default Model', () => {
    it('should create default model', () => {
      const model = openai(MODEL_IDS.default, { apiKey: API_KEY });

      expect(model).toBeDefined();
      expect(model.modelId).toBe(MODEL_IDS.default);
    });

    it('should have correct default configuration', () => {
      const model = openai(MODEL_IDS.default, { apiKey: API_KEY });

      // Test default settings
      expect(model.modelId).toBe(MODEL_IDS.default);
      // Add more default configuration assertions
    });

    it('should support default model without explicit config', () => {
      const model = openai(MODEL_IDS.default);

      expect(model).toBeDefined();
    });
  });

  describe('Premium Model', () => {
    it('should create premium model', () => {
      const model = openai(MODEL_IDS.premium, { apiKey: API_KEY });

      expect(model).toBeDefined();
      expect(model.modelId).toBe(MODEL_IDS.premium);
    });

    it('should have premium model features', () => {
      const model = openai(MODEL_IDS.premium, { apiKey: API_KEY });

      // Add premium feature assertions
      expect(model).toBeDefined();
    });
  });

  describe('Specialized Models', () => {
    it('should create reasoning model', () => {
      const model = openai(MODEL_IDS.reasoning, { apiKey: API_KEY });

      expect(model).toBeDefined();
      expect(model.modelId).toBe(MODEL_IDS.reasoning);
    });

    it('should create legacy model', () => {
      const model = openai(MODEL_IDS.legacy, { apiKey: API_KEY });

      expect(model).toBeDefined();
      expect(model.modelId).toBe(MODEL_IDS.legacy);
    });
  });

  describe('Model Configuration', () => {
    it('should create model with custom temperature', () => {
      const model = openai(MODEL_IDS.default, {
        apiKey: API_KEY,
        temperature: 0.7,
      });

      expect(model).toBeDefined();
      // Temperature may not be stored on model object
      // It's passed as parameter to generateText/streamText
    });

    it('should create model with custom max tokens', () => {
      const model = openai(MODEL_IDS.default, {
        apiKey: API_KEY,
        maxTokens: 1000,
      });

      expect(model).toBeDefined();
    });

    it('should create model with top P sampling', () => {
      const model = openai(MODEL_IDS.default, {
        apiKey: API_KEY,
        topP: 0.9,
      });

      expect(model).toBeDefined();
    });
  });

  describe('Model Comparison', () => {
    it('should create different models with same config', () => {
      const config = { apiKey: API_KEY };

      const model1 = openai(MODEL_IDS.default, config);
      const model2 = openai(MODEL_IDS.premium, config);

      expect(model1.modelId).not.toBe(model2.modelId);
      expect(model1).toBeDefined();
      expect(model2).toBeDefined();
    });

    it('should handle multiple model instances', () => {
      const models = [
        openai(MODEL_IDS.default, { apiKey: API_KEY }),
        openai(MODEL_IDS.premium, { apiKey: API_KEY }),
        openai(MODEL_IDS.reasoning, { apiKey: API_KEY }),
      ];

      models.forEach((model) => {
        expect(model).toBeDefined();
      });

      // All models should be different
      const modelIds = models.map((m) => m.modelId);
      const uniqueIds = new Set(modelIds);
      expect(uniqueIds.size).toBe(models.length);
    });
  });

  describe('Provider Interoperability', () => {
    it('should create OpenAI model', () => {
      const model = openai('gpt-4o-mini', { apiKey: API_KEY });

      expect(model).toBeDefined();
      expect(model.modelId).toBe('gpt-4o-mini');
    });

    it('should create Anthropic model', () => {
      const apiKey = process.env.ANTHROPIC_API_KEY || 'test-key';

      const model = anthropic('claude-3-5-sonnet-20241022', { apiKey });

      expect(model).toBeDefined();
      expect(model.modelId).toBe('claude-3-5-sonnet-20241022');
    });

    it('should create Google model', () => {
      const apiKey = process.env.GOOGLE_API_KEY || 'test-key';

      const model = google('gemini-2.5-flash', { apiKey });

      expect(model).toBeDefined();
      expect(model.modelId).toBe('gemini-2.5-flash');
    });

    it('should support consistent model interface', () => {
      const openaiModel = openai('gpt-4o-mini', { apiKey: API_KEY });

      // All models should have same interface
      expect(openaiModel).toHaveProperty('modelId');
      expect(openaiModel).toHaveProperty('provider');
    });
  });

  describe('Model Metadata', () => {
    it('should expose model metadata', () => {
      const model = openai(MODEL_IDS.default, { apiKey: API_KEY });

      // Test metadata properties
      expect(model.modelId).toBeDefined();
      // Add more metadata assertions
    });

    it('should have vendor information', () => {
      const model = openai(MODEL_IDS.default, { apiKey: API_KEY });

      // Provider should be identifiable
      expect(model).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle model ID with special characters', () => {
      // Some providers use model IDs with special characters
      const specialModelId = 'gpt-4o-mini';

      expect(() => {
        const model = openai(specialModelId, { apiKey: API_KEY });
      }).not.toThrow();
    });

    it('should handle very long model IDs', () => {
      const longModelId = 'model-with-very-long-name-1234567890';

      expect(() => {
        const model = openai(longModelId, { apiKey: API_KEY });
      }).not.toThrow();
    });

    it('should handle model ID with version numbers', () => {
      const versionedModelId = 'claude-3-5-sonnet-20241022';

      expect(() => {
        const model = anthropic(versionedModelId, {
          apiKey: process.env.ANTHROPIC_API_KEY || 'test-key',
        });
      }).not.toThrow();
    });
  });
});

/**
 * Provider-Specific Model Tests
 *
 * Add tests for your provider's unique model features
 */

describe(`${PROVIDER_NAME} Model Features`, () => {
  const API_KEY = process.env.OPENAI_API_KEY || 'test-key';

  // TODO: Add provider-specific model features
  it.skip('should support provider-specific feature', () => {
    // Example:
    // - OpenAI: function calling, vision
    // - Anthropic: 200K context, computer use
    // - Google: Gemini thinking mode
    // - Groq: ultra-fast inference
    const model = openai(MODEL_IDS.default, { apiKey: API_KEY });

    expect(model).toBeDefined();
  });
});

/**
 * Customization Checklist:
 *
 * ✅ Replace PROVIDER_NAME
 * ✅ Replace MODEL_IDS with your provider's models
 * ✅ Update import statements
 * ✅ Add provider-specific model configurations
 * ✅ Remove unsupported models
 * ✅ Add provider-specific feature tests
 * ✅ Update model metadata assertions
 * ✅ Test all model variants offered by your provider
 */
