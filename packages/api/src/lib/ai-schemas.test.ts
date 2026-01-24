/**
 * AI Validation Schemas Unit Tests
 *
 * Purpose: Test Zod validation schemas for AI chat completion system
 *
 * Test Coverage:
 * - chatMessageSchema: Chat message validation (role, content)
 * - completionSettingsSchema: AI completion settings validation
 *
 * Validation Rules Tested:
 * - Role constraints (user, assistant, system)
 * - Content validation (non-empty strings)
 * - Temperature range (0-2)
 * - Max tokens range (1-1000000)
 * - Top P range (0-1)
 * - Top K range (0-100)
 * - Frequency penalty range (-2 to 2)
 * - Presence penalty range (-2 to 2)
 * - Optional field handling
 * - Type inference
 */

import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  chatMessageSchema,
  completionSettingsSchema,
  type ChatMessage,
  type CompletionSettings,
} from './ai-schemas';

describe('AI Validation Schemas', () => {
  describe('chatMessageSchema', () => {
    describe('Valid Messages', () => {
      it('should accept valid user message', () => {
        const message = {
          role: 'user',
          content: 'Hello, how are you?',
        };

        const result = chatMessageSchema.parse(message);

        expect(result).toEqual(message);
        expect(result.role).toBe('user');
        expect(result.content).toBe('Hello, how are you?');
      });

      it('should accept valid assistant message', () => {
        const message = {
          role: 'assistant',
          content: 'I am doing well, thank you!',
        };

        const result = chatMessageSchema.parse(message);

        expect(result).toEqual(message);
        expect(result.role).toBe('assistant');
      });

      it('should accept valid system message', () => {
        const message = {
          role: 'system',
          content: 'You are a helpful assistant.',
        };

        const result = chatMessageSchema.parse(message);

        expect(result).toEqual(message);
        expect(result.role).toBe('system');
      });

      it('should accept message with special characters', () => {
        const message = {
          role: 'user',
          content: 'Hello! @#$%^&*()_+-=[]{}|;:\'",.<>?/~`',
        };

        const result = chatMessageSchema.parse(message);

        expect(result).toEqual(message);
      });

      it('should accept message with unicode characters', () => {
        const message = {
          role: 'user',
          content: 'Hello 你好 🎉 Ñoño café',
        };

        const result = chatMessageSchema.parse(message);

        expect(result).toEqual(message);
      });

      it('should accept message with newlines and tabs', () => {
        const message = {
          role: 'user',
          content: 'Line 1\nLine 2\tIndented',
        };

        const result = chatMessageSchema.parse(message);

        expect(result).toEqual(message);
      });

      it('should accept very long message content', () => {
        const longContent = 'a'.repeat(10000);
        const message = {
          role: 'user',
          content: longContent,
        };

        const result = chatMessageSchema.parse(message);

        expect(result.content).toBe(longContent);
        expect(result.content.length).toBe(10000);
      });

      it('should accept message with single character', () => {
        const message = {
          role: 'user',
          content: 'a',
        };

        const result = chatMessageSchema.parse(message);

        expect(result.content).toBe('a');
      });
    });

    describe('Invalid Roles', () => {
      it('should reject invalid role string', () => {
        const message = {
          role: 'moderator',
          content: 'Hello',
        };

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });

      it('should reject numeric role', () => {
        const message = {
          role: 123,
          content: 'Hello',
        };

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });

      it('should reject null role', () => {
        const message = {
          role: null,
          content: 'Hello',
        };

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });

      it('should reject undefined role', () => {
        const message = {
          role: undefined,
          content: 'Hello',
        };

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });

      it('should reject role with wrong case', () => {
        const message = {
          role: 'User',
          content: 'Hello',
        };

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });

      it('should reject role with extra whitespace', () => {
        const message = {
          role: ' user ',
          content: 'Hello',
        };

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });
    });

    describe('Invalid Content', () => {
      it('should reject empty string content', () => {
        const message = {
          role: 'user',
          content: '',
        };

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });

      it('should accept whitespace-only content (schema uses min(1) which checks length)', () => {
        // Note: The schema uses .min(1) which only checks length >= 1
        // Whitespace-only strings are technically valid per this schema
        const message = {
          role: 'user',
          content: '   ',
        };

        const result = chatMessageSchema.parse(message);
        expect(result.content).toBe('   ');
      });

      it('should accept tab-only content', () => {
        const message = {
          role: 'user',
          content: '\t\t',
        };

        const result = chatMessageSchema.parse(message);
        expect(result.content).toBe('\t\t');
      });

      it('should accept newline-only content', () => {
        const message = {
          role: 'user',
          content: '\n\n',
        };

        const result = chatMessageSchema.parse(message);
        expect(result.content).toBe('\n\n');
      });

      it('should reject null content', () => {
        const message = {
          role: 'user',
          content: null,
        };

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });

      it('should reject undefined content', () => {
        const message = {
          role: 'user',
          content: undefined,
        };

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });

      it('should reject numeric content', () => {
        const message = {
          role: 'user',
          content: 12345,
        };

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });

      it('should reject object content', () => {
        const message = {
          role: 'user',
          content: { text: 'Hello' },
        };

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });

      it('should reject array content', () => {
        const message = {
          role: 'user',
          content: ['Hello'],
        };

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });
    });

    describe('Missing Fields', () => {
      it('should reject message missing role', () => {
        const message = {
          content: 'Hello',
        };

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });

      it('should reject message missing content', () => {
        const message = {
          role: 'user',
        };

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });

      it('should reject empty object', () => {
        const message = {};

        expect(() => chatMessageSchema.parse(message)).toThrow(ZodError);
      });

      it('should reject null', () => {
        expect(() => chatMessageSchema.parse(null)).toThrow(ZodError);
      });

      it('should reject undefined', () => {
        expect(() => chatMessageSchema.parse(undefined)).toThrow(ZodError);
      });
    });

    describe('Extra Fields', () => {
      it('should strip unknown fields by default', () => {
        const message = {
          role: 'user',
          content: 'Hello',
          extraField: 'should be stripped',
        };

        const result = chatMessageSchema.parse(message);

        expect(result).not.toHaveProperty('extraField');
        expect(result.role).toBe('user');
        expect(result.content).toBe('Hello');
      });
    });
  });

  describe('completionSettingsSchema', () => {
    describe('Valid Settings', () => {
      it('should accept empty object (all optional)', () => {
        const settings = {};

        const result = completionSettingsSchema.parse(settings);

        expect(result).toEqual({});
      });

      it('should accept settings with all fields', () => {
        const settings = {
          temperature: 0.7,
          maxTokens: 1000,
          topP: 0.9,
          topK: 50,
          frequencyPenalty: 0.5,
          presencePenalty: -0.5,
        };

        const result = completionSettingsSchema.parse(settings);

        expect(result).toEqual(settings);
      });

      it('should accept temperature at minimum boundary (0)', () => {
        const settings = { temperature: 0 };

        const result = completionSettingsSchema.parse(settings);

        expect(result.temperature).toBe(0);
      });

      it('should accept temperature at maximum boundary (2)', () => {
        const settings = { temperature: 2 };

        const result = completionSettingsSchema.parse(settings);

        expect(result.temperature).toBe(2);
      });

      it('should accept maxTokens at minimum boundary (1)', () => {
        const settings = { maxTokens: 1 };

        const result = completionSettingsSchema.parse(settings);

        expect(result.maxTokens).toBe(1);
      });

      it('should accept maxTokens at maximum boundary (1000000)', () => {
        const settings = { maxTokens: 1000000 };

        const result = completionSettingsSchema.parse(settings);

        expect(result.maxTokens).toBe(1000000);
      });

      it('should accept topP at minimum boundary (0)', () => {
        const settings = { topP: 0 };

        const result = completionSettingsSchema.parse(settings);

        expect(result.topP).toBe(0);
      });

      it('should accept topP at maximum boundary (1)', () => {
        const settings = { topP: 1 };

        const result = completionSettingsSchema.parse(settings);

        expect(result.topP).toBe(1);
      });

      it('should accept topK at minimum boundary (0)', () => {
        const settings = { topK: 0 };

        const result = completionSettingsSchema.parse(settings);

        expect(result.topK).toBe(0);
      });

      it('should accept topK at maximum boundary (100)', () => {
        const settings = { topK: 100 };

        const result = completionSettingsSchema.parse(settings);

        expect(result.topK).toBe(100);
      });

      it('should accept frequencyPenalty at minimum boundary (-2)', () => {
        const settings = { frequencyPenalty: -2 };

        const result = completionSettingsSchema.parse(settings);

        expect(result.frequencyPenalty).toBe(-2);
      });

      it('should accept frequencyPenalty at maximum boundary (2)', () => {
        const settings = { frequencyPenalty: 2 };

        const result = completionSettingsSchema.parse(settings);

        expect(result.frequencyPenalty).toBe(2);
      });

      it('should accept presencePenalty at minimum boundary (-2)', () => {
        const settings = { presencePenalty: -2 };

        const result = completionSettingsSchema.parse(settings);

        expect(result.presencePenalty).toBe(-2);
      });

      it('should accept presencePenalty at maximum boundary (2)', () => {
        const settings = { presencePenalty: 2 };

        const result = completionSettingsSchema.parse(settings);

        expect(result.presencePenalty).toBe(2);
      });

      it('should accept partial settings with some fields', () => {
        const settings = {
          temperature: 0.5,
          maxTokens: 500,
        };

        const result = completionSettingsSchema.parse(settings);

        expect(result.temperature).toBe(0.5);
        expect(result.maxTokens).toBe(500);
        expect(result.topP).toBeUndefined();
        expect(result.topK).toBeUndefined();
      });

      it('should accept decimal values for all numeric fields', () => {
        const settings = {
          temperature: 0.723456789,
          topP: 0.87654321,
        };

        const result = completionSettingsSchema.parse(settings);

        expect(result.temperature).toBe(0.723456789);
        expect(result.topP).toBe(0.87654321);
      });

      it('should accept integer values for temperature and topP', () => {
        const settings = {
          temperature: 1,
          topP: 0,
        };

        const result = completionSettingsSchema.parse(settings);

        expect(result.temperature).toBe(1);
        expect(result.topP).toBe(0);
      });
    });

    describe('Invalid Temperature', () => {
      it('should reject temperature below minimum (-0.1)', () => {
        const settings = { temperature: -0.1 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject temperature above maximum (2.1)', () => {
        const settings = { temperature: 2.1 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject very negative temperature', () => {
        const settings = { temperature: -100 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject very high temperature', () => {
        const settings = { temperature: 100 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject string temperature', () => {
        const settings = { temperature: '0.7' };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject null temperature', () => {
        const settings = { temperature: null };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject boolean temperature', () => {
        const settings = { temperature: true };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });
    });

    describe('Invalid Max Tokens', () => {
      it('should reject maxTokens below minimum (0)', () => {
        const settings = { maxTokens: 0 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject negative maxTokens', () => {
        const settings = { maxTokens: -100 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject maxTokens above maximum (1000001)', () => {
        const settings = { maxTokens: 1000001 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject very high maxTokens', () => {
        const settings = { maxTokens: 9999999 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should accept decimal maxTokens (schema uses number, not integer)', () => {
        // Note: The schema uses .number() without .int(), so decimals are allowed
        const settings = { maxTokens: 100.5 };

        const result = completionSettingsSchema.parse(settings);
        expect(result.maxTokens).toBe(100.5);
      });

      it('should reject string maxTokens', () => {
        const settings = { maxTokens: '1000' };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject boolean maxTokens', () => {
        const settings = { maxTokens: true };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });
    });

    describe('Invalid Top P', () => {
      it('should reject topP below minimum (-0.1)', () => {
        const settings = { topP: -0.1 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject topP above maximum (1.1)', () => {
        const settings = { topP: 1.1 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject very negative topP', () => {
        const settings = { topP: -5 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject very high topP', () => {
        const settings = { topP: 10 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject integer outside range (2)', () => {
        const settings = { topP: 2 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject string topP', () => {
        const settings = { topP: '0.9' };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });
    });

    describe('Invalid Top K', () => {
      it('should reject topK below minimum (-1)', () => {
        const settings = { topK: -1 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject topK above maximum (101)', () => {
        const settings = { topK: 101 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject very negative topK', () => {
        const settings = { topK: -100 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject very high topK', () => {
        const settings = { topK: 999 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should accept decimal topK (schema uses number, not integer)', () => {
        // Note: The schema uses .number() without .int(), so decimals are allowed
        const settings = { topK: 50.5 };

        const result = completionSettingsSchema.parse(settings);
        expect(result.topK).toBe(50.5);
      });

      it('should reject string topK', () => {
        const settings = { topK: '50' };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject boolean topK', () => {
        const settings = { topK: true };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });
    });

    describe('Invalid Frequency Penalty', () => {
      it('should reject frequencyPenalty below minimum (-2.1)', () => {
        const settings = { frequencyPenalty: -2.1 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject frequencyPenalty above maximum (2.1)', () => {
        const settings = { frequencyPenalty: 2.1 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject very negative frequencyPenalty', () => {
        const settings = { frequencyPenalty: -100 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject very high frequencyPenalty', () => {
        const settings = { frequencyPenalty: 100 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject string frequencyPenalty', () => {
        const settings = { frequencyPenalty: '0.5' };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });
    });

    describe('Invalid Presence Penalty', () => {
      it('should reject presencePenalty below minimum (-2.1)', () => {
        const settings = { presencePenalty: -2.1 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject presencePenalty above maximum (2.1)', () => {
        const settings = { presencePenalty: 2.1 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject very negative presencePenalty', () => {
        const settings = { presencePenalty: -100 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject very high presencePenalty', () => {
        const settings = { presencePenalty: 100 };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });

      it('should reject string presencePenalty', () => {
        const settings = { presencePenalty: '-0.5' };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);
      });
    });

    describe('Edge Cases and Combinations', () => {
      it('should accept all minimum boundary values together', () => {
        const settings = {
          temperature: 0,
          maxTokens: 1,
          topP: 0,
          topK: 0,
          frequencyPenalty: -2,
          presencePenalty: -2,
        };

        const result = completionSettingsSchema.parse(settings);

        expect(result).toEqual(settings);
      });

      it('should accept all maximum boundary values together', () => {
        const settings = {
          temperature: 2,
          maxTokens: 1000000,
          topP: 1,
          topK: 100,
          frequencyPenalty: 2,
          presencePenalty: 2,
        };

        const result = completionSettingsSchema.parse(settings);

        expect(result).toEqual(settings);
      });

      it('should accept mixed positive and negative penalties', () => {
        const settings = {
          frequencyPenalty: 1.5,
          presencePenalty: -1.5,
        };

        const result = completionSettingsSchema.parse(settings);

        expect(result.frequencyPenalty).toBe(1.5);
        expect(result.presencePenalty).toBe(-1.5);
      });

      it('should reject settings with multiple invalid fields', () => {
        const settings = {
          temperature: 5, // Invalid: > 2
          maxTokens: 0, // Invalid: < 1
          topP: 2, // Invalid: > 1
        };

        expect(() => completionSettingsSchema.parse(settings)).toThrow(ZodError);

        try {
          completionSettingsSchema.parse(settings);
          expect.fail('Should have thrown ZodError');
        } catch (error) {
          expect(error).toBeInstanceOf(ZodError);
          if (error instanceof ZodError) {
            // Should have errors for all three fields
            expect(error.issues.length).toBeGreaterThanOrEqual(3);
          }
        }
      });

      it('should strip unknown fields', () => {
        const settings = {
          temperature: 0.7,
          unknownField: 'should be stripped',
          anotherUnknown: 123,
        };

        const result = completionSettingsSchema.parse(settings);

        expect(result.temperature).toBe(0.7);
        expect(result).not.toHaveProperty('unknownField');
        expect(result).not.toHaveProperty('anotherUnknown');
      });
    });

    describe('Type Safety', () => {
      it('should reject null', () => {
        expect(() => completionSettingsSchema.parse(null)).toThrow(ZodError);
      });

      it('should reject undefined', () => {
        expect(() => completionSettingsSchema.parse(undefined)).toThrow(ZodError);
      });

      it('should reject array', () => {
        expect(() => completionSettingsSchema.parse([])).toThrow(ZodError);
      });

      it('should reject string', () => {
        expect(() => completionSettingsSchema.parse('invalid')).toThrow(ZodError);
      });

      it('should reject number', () => {
        expect(() => completionSettingsSchema.parse(123)).toThrow(ZodError);
      });

      it('should reject boolean', () => {
        expect(() => completionSettingsSchema.parse(true)).toThrow(ZodError);
      });
    });
  });

  describe('Type Inference', () => {
    it('should correctly infer ChatMessage type', () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'Hello',
      };

      // TypeScript should enforce these types at compile time
      const validRoles: Array<'user' | 'assistant' | 'system'> = ['user', 'assistant', 'system'];

      expect(validRoles).toContain(message.role);
      expect(typeof message.content).toBe('string');
    });

    it('should correctly infer CompletionSettings type', () => {
      const settings: CompletionSettings = {
        temperature: 0.7,
        maxTokens: 1000,
      };

      // All fields should be optional
      expect(settings.temperature).toBeDefined();
      expect(settings.maxTokens).toBeDefined();
      expect(settings.topP).toBeUndefined();

      // Types should be number | undefined
      if (settings.temperature !== undefined) {
        expect(typeof settings.temperature).toBe('number');
      }
    });

    it('should allow all optional fields in CompletionSettings', () => {
      const settings: CompletionSettings = {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        topK: 50,
        frequencyPenalty: 0.5,
        presencePenalty: -0.5,
      };

      expect(settings.temperature).toBe(0.7);
      expect(settings.maxTokens).toBe(1000);
      expect(settings.topP).toBe(0.9);
      expect(settings.topK).toBe(50);
      expect(settings.frequencyPenalty).toBe(0.5);
      expect(settings.presencePenalty).toBe(-0.5);
    });
  });

  describe('Real-World Usage Scenarios', () => {
    it('should handle typical user message', () => {
      const userMessage = {
        role: 'user' as const,
        content: 'Explain quantum computing in simple terms',
      };

      const result = chatMessageSchema.parse(userMessage);

      expect(result.role).toBe('user');
      expect(result.content).toBe('Explain quantum computing in simple terms');
    });

    it('should handle typical assistant response', () => {
      const assistantMessage = {
        role: 'assistant' as const,
        content:
          'Quantum computing is a type of computation that harnesses quantum mechanical phenomena...',
      };

      const result = chatMessageSchema.parse(assistantMessage);

      expect(result.role).toBe('assistant');
      expect(result.content).toContain('Quantum computing');
    });

    it('should handle system prompt', () => {
      const systemMessage = {
        role: 'system' as const,
        content:
          'You are a helpful AI assistant. Provide accurate, concise answers. Be friendly but professional.',
      };

      const result = chatMessageSchema.parse(systemMessage);

      expect(result.role).toBe('system');
      expect(result.content).toContain('helpful AI assistant');
    });

    it('should handle balanced completion settings', () => {
      const balancedSettings: CompletionSettings = {
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
        frequencyPenalty: 0.3,
        presencePenalty: 0.1,
      };

      const result = completionSettingsSchema.parse(balancedSettings);

      expect(result.temperature).toBe(0.7);
      expect(result.maxTokens).toBe(2000);
    });

    it('should handle creative completion settings', () => {
      const creativeSettings: CompletionSettings = {
        temperature: 1.5,
        maxTokens: 4000,
        topP: 0.95,
        topK: 80,
        frequencyPenalty: -0.5,
        presencePenalty: 0.8,
      };

      const result = completionSettingsSchema.parse(creativeSettings);

      expect(result.temperature).toBeGreaterThan(1);
      expect(result.presencePenalty).toBeGreaterThan(0);
    });

    it('should handle focused completion settings', () => {
      const focusedSettings: CompletionSettings = {
        temperature: 0.2,
        maxTokens: 1000,
        topP: 0.5,
        frequencyPenalty: 1.0,
        presencePenalty: 0.0,
      };

      const result = completionSettingsSchema.parse(focusedSettings);

      expect(result.temperature).toBeLessThan(0.5);
      expect(result.frequencyPenalty).toBe(1.0);
    });

    it('should handle minimal completion settings', () => {
      const minimalSettings: CompletionSettings = {
        temperature: 0.5,
      };

      const result = completionSettingsSchema.parse(minimalSettings);

      expect(result.temperature).toBe(0.5);
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should handle empty completion settings', () => {
      const emptySettings: CompletionSettings = {};

      const result = completionSettingsSchema.parse(emptySettings);

      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error for invalid role', () => {
      const message = {
        role: 'invalid',
        content: 'Hello',
      };

      try {
        chatMessageSchema.parse(message);
        expect.fail('Should have thrown ZodError');
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        if (error instanceof ZodError) {
          expect(error.issues[0].path).toContain('role');
        }
      }
    });

    it('should provide clear error for empty content', () => {
      const message = {
        role: 'user',
        content: '',
      };

      try {
        chatMessageSchema.parse(message);
        expect.fail('Should have thrown ZodError');
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        if (error instanceof ZodError) {
          expect(error.issues[0].path).toContain('content');
        }
      }
    });

    it('should provide clear error for out-of-range temperature', () => {
      const settings = { temperature: 5 };

      try {
        completionSettingsSchema.parse(settings);
        expect.fail('Should have thrown ZodError');
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        if (error instanceof ZodError) {
          expect(error.issues[0].path).toContain('temperature');
        }
      }
    });

    it('should provide clear error for out-of-range maxTokens', () => {
      const settings = { maxTokens: 0 };

      try {
        completionSettingsSchema.parse(settings);
        expect.fail('Should have thrown ZodError');
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        if (error instanceof ZodError) {
          expect(error.issues[0].path).toContain('maxTokens');
        }
      }
    });
  });
});
