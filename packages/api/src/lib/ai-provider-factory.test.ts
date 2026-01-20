/**
 * AI Provider Factory Tests
 *
 * This file verifies that the provider factory can be imported and used correctly.
 */

import { describe, it, expect } from 'vitest';
import { createAIProvider, type AIProvider } from './ai-provider-factory';

describe('AI Provider Factory', () => {
  describe('createAIProvider', () => {
    it('should create an OpenAI provider instance', () => {
      // This test verifies the factory can create a provider without actually calling the API
      expect(() => {
        createAIProvider({
          provider: 'openai',
          modelId: 'gpt-4o-mini',
          apiKey: 'test-key',
        });
      }).not.toThrow();
    });

    it('should create an Anthropic provider instance', () => {
      expect(() => {
        createAIProvider({
          provider: 'anthropic',
          modelId: 'claude-3-5-sonnet-20241022',
          apiKey: 'test-key',
        });
      }).not.toThrow();
    });

    it('should create a Groq provider instance', () => {
      expect(() => {
        createAIProvider({
          provider: 'groq',
          modelId: 'llama-3.3-70b-versatile',
          apiKey: 'test-key',
        });
      }).not.toThrow();
    });

    it('should create an Ollama provider instance (no API key required)', () => {
      expect(() => {
        createAIProvider({
          provider: 'ollama',
          modelId: 'llama3.2',
          apiKey: 'ollama', // placeholder for Ollama
        });
      }).not.toThrow();
    });

    it('should create a custom provider instance', () => {
      expect(() => {
        createAIProvider({
          provider: 'custom',
          modelId: 'custom-model',
          baseURL: 'https://api.example.com/v1',
          apiKey: 'test-key',
        });
      }).not.toThrow();
    });

    it('should create an OpenRouter provider instance', () => {
      expect(() => {
        createAIProvider({
          provider: 'openrouter',
          modelId: 'anthropic/claude-3.5-sonnet',
          apiKey: 'test-key',
        });
      }).not.toThrow();
    });
  });
});
