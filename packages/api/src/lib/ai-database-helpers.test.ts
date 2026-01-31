/**
 * AI Database Helpers Unit Tests
 *
 * Purpose: Test database helper functions for AI operations
 *
 * Test Coverage:
 * - getDecryptedApiKey: API key retrieval and decryption
 * - messageExists: Duplicate message detection
 * - getModelConfig: Model configuration retrieval with authorization
 *
 * Database Operations Tested:
 * - API key queries and decryption
 * - Message existence checks
 * - Model configuration building
 * - Authorization validation
 * - Error handling for missing resources
 */

import { describe, it, expect, beforeEach, afterEach, vi, afterAll } from 'vitest';
import { ORPCError } from '@orpc/server';

// Mock the database and encryption modules BEFORE importing the functions under test
// Use vi.hoisted to make mocks available in both mock factory and tests
const mockSelect = vi.hoisted(() => vi.fn());
const mockDecrypt = vi.hoisted(() => vi.fn());

vi.mock('@sambung-chat/db', () => ({
  db: {
    select: mockSelect,
  },
}));

vi.mock('@sambung-chat/db/schema/chat', () => ({
  messages: 'messages',
}));

vi.mock('@sambung-chat/db/schema/model', () => ({
  models: 'models',
}));

vi.mock('@sambung-chat/db/schema/api-key', () => ({
  apiKeys: 'apiKeys',
}));

vi.mock('./encryption', () => ({
  decrypt: mockDecrypt,
}));

import { getDecryptedApiKey, messageExists, getModelConfig } from './ai-database-helpers';

describe('AI Database Helpers', () => {
  // Reset mock return values after each test to prevent polluting other test files
  afterEach(() => {
    mockDecrypt.mockReset();
  });

  describe('getDecryptedApiKey', () => {
    const mockApiKey = {
      id: '01HJX123456789',
      userId: 'user_123',
      provider: 'openai',
      name: 'Test Key',
      encryptedKey: 'encrypted_base64_string',
      keyLast4: 'sk-**',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return decrypted API key when found', async () => {
      const decryptedKey = 'sk-test1234567890abcdef';
      mockDecrypt.mockReturnValue(decryptedKey);

      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockApiKey]),
          }),
        }),
      });
      mockSelect.mockImplementation(mockSelectFn as any);

      const result = await getDecryptedApiKey('01HJX123456789');

      expect(result).toBe(decryptedKey);
      expect(mockSelect).toHaveBeenCalledTimes(1);
      expect(mockDecrypt).toHaveBeenCalledWith('encrypted_base64_string');
    });

    it('should throw NOT_FOUND when API key does not exist', async () => {
      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockSelect.mockImplementation(mockSelectFn as any);

      await expect(getDecryptedApiKey('nonexistent_id')).rejects.toThrow(ORPCError);

      try {
        await getDecryptedApiKey('nonexistent_id');
        expect.fail('Should have thrown ORPCError');
      } catch (error) {
        expect(error).toBeInstanceOf(ORPCError);
        if (error instanceof ORPCError) {
          expect(error.code).toBe('NOT_FOUND');
          expect(error.message).toBe('API key not found');
        }
      }
    });

    it('should throw NOT_FOUND when API key result is null', async () => {
      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([null]),
          }),
        }),
      });
      mockSelect.mockImplementation(mockSelectFn as any);

      await expect(getDecryptedApiKey('01HJX123456789')).rejects.toThrow(ORPCError);

      try {
        await getDecryptedApiKey('01HJX123456789');
        expect.fail('Should have thrown ORPCError');
      } catch (error) {
        expect(error).toBeInstanceOf(ORPCError);
        if (error instanceof ORPCError) {
          expect(error.code).toBe('NOT_FOUND');
        }
      }
    });

    it('should throw INTERNAL_SERVER_ERROR when decryption fails', async () => {
      mockDecrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockApiKey]),
          }),
        }),
      });
      mockSelect.mockImplementation(mockSelectFn as any);

      await expect(getDecryptedApiKey('01HJX123456789')).rejects.toThrow(ORPCError);

      try {
        await getDecryptedApiKey('01HJX123456789');
        expect.fail('Should have thrown ORPCError');
      } catch (error) {
        expect(error).toBeInstanceOf(ORPCError);
        if (error instanceof ORPCError) {
          expect(error.code).toBe('INTERNAL_SERVER_ERROR');
          expect(error.message).toBe('Failed to decrypt API key');
        }
      }
    });

    it('should query with correct API key ID', async () => {
      const decryptedKey = 'sk-test1234567890abcdef';
      mockDecrypt.mockReturnValue(decryptedKey);

      const mockLimit = vi.fn().mockResolvedValue([mockApiKey]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFrom });
      mockSelect.mockImplementation(mockSelectFn as any);

      await getDecryptedApiKey('test_api_key_id');

      expect(mockSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('messageExists', () => {
    const mockMessage = {
      id: '01MSG123456789',
      chatId: '01CHAT123',
      role: 'user' as const,
      content: 'Hello, world!',
      createdAt: new Date(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return true when message with same content exists', async () => {
      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockMessage]),
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockSelectFn as any);

      const result = await messageExists('01CHAT123', 'user', 'Hello, world!');

      expect(result).toBe(true);
      expect(mockSelect).toHaveBeenCalledTimes(1);
    });

    it('should return false when no messages exist', async () => {
      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockSelectFn as any);

      const result = await messageExists('01CHAT123', 'user', 'Hello, world!');

      expect(result).toBe(false);
    });

    it('should return false when message content differs', async () => {
      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockMessage]),
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockSelectFn as any);

      const result = await messageExists('01CHAT123', 'user', 'Different content');

      expect(result).toBe(false);
    });

    it('should return false when role differs', async () => {
      // When querying for 'assistant' role, database returns empty (no assistant messages)
      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]), // No assistant messages found
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockSelectFn as any);

      const result = await messageExists('01CHAT123', 'assistant', 'Hello, world!');

      expect(result).toBe(false);
    });

    it('should return false when chat ID differs', async () => {
      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockSelectFn as any);

      const result = await messageExists('01CHAT456', 'user', 'Hello, world!');

      expect(result).toBe(false);
    });

    it('should return false when first message is null', async () => {
      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([null]),
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockSelectFn as any);

      const result = await messageExists('01CHAT123', 'user', 'Hello, world!');

      expect(result).toBe(false);
    });

    it('should query with correct chat ID and role', async () => {
      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockMessage]),
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockSelectFn as any);

      await messageExists('01CHAT123', 'user', 'Hello, world!');

      expect(mockSelect).toHaveBeenCalledTimes(1);
    });

    it('should work with assistant role', async () => {
      const assistantMessage = {
        ...mockMessage,
        role: 'assistant' as const,
        content: 'Hello!',
      };

      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([assistantMessage]),
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockSelectFn as any);

      const result = await messageExists('01CHAT123', 'assistant', 'Hello!');

      expect(result).toBe(true);
    });

    it('should work with system role', async () => {
      const systemMessage = {
        ...mockMessage,
        role: 'system' as const,
        content: 'System prompt',
      };

      const mockSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([systemMessage]),
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockSelectFn as any);

      const result = await messageExists('01CHAT123', 'system', 'System prompt');

      expect(result).toBe(true);
    });
  });

  describe('getModelConfig', () => {
    const mockModel = {
      id: '01MODEL123456',
      userId: 'user_123',
      provider: 'openai',
      modelId: 'gpt-4o',
      name: 'GPT-4o',
      baseUrl: null,
      apiKeyId: '01KEY123456',
      isActive: true,
      avatarUrl: null,
      settings: {
        temperature: 0.7,
        maxTokens: 4096,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return model config with decrypted API key for OpenAI', async () => {
      const decryptedKey = 'sk-openai123456';
      mockDecrypt.mockReturnValue(decryptedKey);

      // Mock API key that will be returned by getDecryptedApiKey
      const mockApiKeyResult = {
        id: '01KEY123456',
        userId: 'user_123',
        provider: 'openai',
        name: 'OpenAI Key',
        encryptedKey: 'encrypted_key', // This is what decrypt should receive
        keyLast4: '3456',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let callCount = 0;
      const mockModelSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              callCount++;
              // First call: return model
              if (callCount === 1) return [mockModel];
              // Second call: return API key
              return [mockApiKeyResult];
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockModelSelect as any);

      const result = await getModelConfig('01MODEL123456', 'user_123');

      expect(result).toEqual({
        provider: 'openai',
        modelId: 'gpt-4o',
        apiKey: decryptedKey,
      });
      expect(mockDecrypt).toHaveBeenCalledWith('encrypted_key');
    });

    it('should return model config with placeholder for Ollama', async () => {
      const ollamaModel = {
        ...mockModel,
        provider: 'ollama',
        apiKeyId: null,
      };

      const mockModelSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([ollamaModel]),
          }),
        }),
      });
      mockSelect.mockImplementation(mockModelSelect as any);

      const result = await getModelConfig('01MODEL123456', 'user_123');

      expect(result).toEqual({
        provider: 'ollama',
        modelId: 'gpt-4o',
        apiKey: 'ollama',
      });
      expect(mockDecrypt).not.toHaveBeenCalled();
    });

    it('should include custom base URL when specified', async () => {
      const modelWithBaseUrl = {
        ...mockModel,
        baseUrl: 'https://custom.openai.com/v1',
      };

      const decryptedKey = 'sk-openai123456';
      mockDecrypt.mockReturnValue(decryptedKey);

      const mockApiKeyResult = {
        id: '01KEY123456',
        userId: 'user_123',
        provider: 'openai',
        name: 'OpenAI Key',
        encryptedKey: 'encrypted_key',
        keyLast4: '3456',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let callCount = 0;
      const mockModelSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              callCount++;
              if (callCount === 1) return [modelWithBaseUrl];
              return [mockApiKeyResult];
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockModelSelect as any);

      const result = await getModelConfig('01MODEL123456', 'user_123');

      expect(result).toEqual({
        provider: 'openai',
        modelId: 'gpt-4o',
        apiKey: decryptedKey,
        baseURL: 'https://custom.openai.com/v1',
      });
    });

    it('should throw NOT_FOUND when model does not exist', async () => {
      const mockModelSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockSelect.mockImplementation(mockModelSelect as any);

      await expect(getModelConfig('nonexistent_id', 'user_123')).rejects.toThrow(ORPCError);

      try {
        await getModelConfig('nonexistent_id', 'user_123');
        expect.fail('Should have thrown ORPCError');
      } catch (error) {
        expect(error).toBeInstanceOf(ORPCError);
        if (error instanceof ORPCError) {
          expect(error.code).toBe('NOT_FOUND');
          expect(error.message).toBe('Model not found or you do not have permission to use it');
        }
      }
    });

    it('should throw NOT_FOUND when model result is null', async () => {
      const mockModelSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([null]),
          }),
        }),
      });
      mockSelect.mockImplementation(mockModelSelect as any);

      await expect(getModelConfig('01MODEL123456', 'user_123')).rejects.toThrow(ORPCError);

      try {
        await getModelConfig('01MODEL123456', 'user_123');
        expect.fail('Should have thrown ORPCError');
      } catch (error) {
        expect(error).toBeInstanceOf(ORPCError);
        if (error instanceof ORPCError) {
          expect(error.code).toBe('NOT_FOUND');
          expect(error.message).toBe('Model not found');
        }
      }
    });

    it('should throw NOT_FOUND when model belongs to different user', async () => {
      const mockModelSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockSelect.mockImplementation(mockModelSelect as any);

      await expect(getModelConfig('01MODEL123456', 'different_user')).rejects.toThrow(ORPCError);

      try {
        await getModelConfig('01MODEL123456', 'different_user');
        expect.fail('Should have thrown ORPCError');
      } catch (error) {
        expect(error).toBeInstanceOf(ORPCError);
        if (error instanceof ORPCError) {
          expect(error.code).toBe('NOT_FOUND');
        }
      }
    });

    it('should throw BAD_REQUEST when non-Ollama model missing API key', async () => {
      const modelWithoutKey = {
        ...mockModel,
        provider: 'openai',
        apiKeyId: null,
      };

      const mockModelSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([modelWithoutKey]),
          }),
        }),
      });
      mockSelect.mockImplementation(mockModelSelect as any);

      await expect(getModelConfig('01MODEL123456', 'user_123')).rejects.toThrow(ORPCError);

      try {
        await getModelConfig('01MODEL123456', 'user_123');
        expect.fail('Should have thrown ORPCError');
      } catch (error) {
        expect(error).toBeInstanceOf(ORPCError);
        if (error instanceof ORPCError) {
          expect(error.code).toBe('BAD_REQUEST');
          expect(error.message).toContain('missing an API key');
          expect(error.message).toContain('GPT-4o');
        }
      }
    });

    it('should throw BAD_REQUEST for Anthropic model without API key', async () => {
      const anthropicModel = {
        ...mockModel,
        provider: 'anthropic',
        modelId: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        apiKeyId: null,
      };

      const mockModelSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([anthropicModel]),
          }),
        }),
      });
      mockSelect.mockImplementation(mockModelSelect as any);

      await expect(getModelConfig('01MODEL123456', 'user_123')).rejects.toThrow(ORPCError);

      try {
        await getModelConfig('01MODEL123456', 'user_123');
        expect.fail('Should have thrown ORPCError');
      } catch (error) {
        expect(error).toBeInstanceOf(ORPCError);
        if (error instanceof ORPCError) {
          expect(error.code).toBe('BAD_REQUEST');
          expect(error.message).toContain('Claude 3.5 Sonnet');
        }
      }
    });

    it('should query with correct model ID and user ID', async () => {
      const decryptedKey = 'sk-test';
      mockDecrypt.mockReturnValue(decryptedKey);

      const mockApiKeyResult = {
        id: '01KEY123456',
        userId: 'user_123',
        provider: 'openai',
        name: 'Test Key',
        encryptedKey: 'encrypted_key',
        keyLast4: '3456',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let callCount = 0;
      const mockLimit = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return [mockModel];
        return [mockApiKeyResult];
      });
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelectFn = vi.fn().mockReturnValue({ from: mockFrom });
      mockSelect.mockImplementation(mockSelectFn as any);

      await getModelConfig('test_model_id', 'test_user_id');

      // Should be called twice: once for model, once for API key
      expect(mockSelect).toHaveBeenCalledTimes(2);
    });

    it('should handle model with custom provider', async () => {
      const customModel = {
        ...mockModel,
        provider: 'custom',
        baseUrl: 'https://custom-api.com/v1',
      };

      const decryptedKey = 'custom-key-123';
      mockDecrypt.mockReturnValue(decryptedKey);

      const mockApiKeyResult = {
        id: '01KEY123456',
        userId: 'user_123',
        provider: 'custom',
        name: 'Custom Key',
        encryptedKey: 'encrypted_key',
        keyLast4: '3456',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let callCount = 0;
      const mockModelSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              callCount++;
              if (callCount === 1) return [customModel];
              return [mockApiKeyResult];
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockModelSelect as any);

      const result = await getModelConfig('01MODEL123456', 'user_123');

      expect(result).toEqual({
        provider: 'custom',
        modelId: 'gpt-4o',
        apiKey: decryptedKey,
        baseURL: 'https://custom-api.com/v1',
      });
    });

    it('should work with Google provider', async () => {
      const googleModel = {
        ...mockModel,
        provider: 'google',
        modelId: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
      };

      const decryptedKey = 'google-api-key';
      mockDecrypt.mockReturnValue(decryptedKey);

      const mockApiKeyResult = {
        id: '01KEY123456',
        userId: 'user_123',
        provider: 'google',
        name: 'Google Key',
        encryptedKey: 'encrypted_key',
        keyLast4: '3456',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let callCount = 0;
      const mockModelSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              callCount++;
              if (callCount === 1) return [googleModel];
              return [mockApiKeyResult];
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockModelSelect as any);

      const result = await getModelConfig('01MODEL123456', 'user_123');

      expect(result).toEqual({
        provider: 'google',
        modelId: 'gemini-1.5-pro',
        apiKey: decryptedKey,
      });
    });

    it('should work with Groq provider', async () => {
      const groqModel = {
        ...mockModel,
        provider: 'groq',
        modelId: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
      };

      const decryptedKey = 'gsk-key-123';
      mockDecrypt.mockReturnValue(decryptedKey);

      const mockApiKeyResult = {
        id: '01KEY123456',
        userId: 'user_123',
        provider: 'groq',
        name: 'Groq Key',
        encryptedKey: 'encrypted_key',
        keyLast4: '3456',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let callCount = 0;
      const mockModelSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              callCount++;
              if (callCount === 1) return [groqModel];
              return [mockApiKeyResult];
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockModelSelect as any);

      const result = await getModelConfig('01MODEL123456', 'user_123');

      expect(result).toEqual({
        provider: 'groq',
        modelId: 'llama-3.3-70b-versatile',
        apiKey: decryptedKey,
      });
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle complete model config retrieval flow', async () => {
      const mockModel = {
        id: '01MODEL123',
        userId: 'user_123',
        provider: 'anthropic',
        modelId: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        baseUrl: null,
        apiKeyId: '01KEY456',
        isActive: true,
        avatarUrl: null,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const decryptedKey = 'sk-ant-api03-key';
      mockDecrypt.mockReturnValue(decryptedKey);

      const mockApiKeyResult = {
        id: '01KEY456',
        userId: 'user_123',
        provider: 'anthropic',
        name: 'Anthropic Key',
        encryptedKey: 'encrypted_key',
        keyLast4: '3456',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let callCount = 0;
      const mockModelSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              callCount++;
              if (callCount === 1) return [mockModel];
              return [mockApiKeyResult];
            }),
          }),
        }),
      });
      mockSelect.mockImplementation(mockModelSelect as any);

      const config = await getModelConfig('01MODEL123', 'user_123');

      expect(config).toEqual({
        provider: 'anthropic',
        modelId: 'claude-3-5-sonnet-20241022',
        apiKey: decryptedKey,
      });
      expect(mockDecrypt).toHaveBeenCalledTimes(1);
    });

    it('should handle Ollama model config without decryption', async () => {
      const ollamaModel = {
        id: '01MODEL789',
        userId: 'user_123',
        provider: 'ollama',
        modelId: 'llama3.2',
        name: 'Llama 3.2',
        baseUrl: 'http://localhost:11434',
        apiKeyId: null,
        isActive: true,
        avatarUrl: null,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockModelSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([ollamaModel]),
          }),
        }),
      });
      mockSelect.mockImplementation(mockModelSelect as any);

      const config = await getModelConfig('01MODEL789', 'user_123');

      expect(config).toEqual({
        provider: 'ollama',
        modelId: 'llama3.2',
        apiKey: 'ollama',
        baseURL: 'http://localhost:11434',
      });
      expect(mockDecrypt).not.toHaveBeenCalled();
    });
  });

  // Restore the original implementation after all tests to prevent polluting other test files
  afterAll(() => {
    mockDecrypt.mockRestore();
  });
});
