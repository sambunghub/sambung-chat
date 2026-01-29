/**
 * API Key Service Unit Tests
 *
 * Purpose: Test CRUD operations for API key management with mocked database
 *
 * Test Categories:
 * - Key validation
 * - Create encrypted key
 * - Retrieve and decrypt key
 * - Update existing key
 * - Delete key
 * - User isolation enforcement
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ORPCError } from '@orpc/server';

import { ApiKeyService } from './api-key-service';

// Create global mock variables
const mockFrom: any = vi.fn();
const mockWhere: any = vi.fn();
const mockValues: any = vi.fn();
const mockSet: any = vi.fn();

// Mock the database module
vi.mock('@sambung-chat/db', () => ({
  db: {
    insert: vi.fn(() => ({ values: mockValues })),
    select: vi.fn(() => ({ from: mockFrom })),
    update: vi.fn(() => ({ set: mockSet })),
    delete: vi.fn(() => ({ where: mockWhere })),
  },
}));

// Mock the encryption functions
vi.mock('../lib/encryption', () => ({
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  extractLastChars: vi.fn((key: string, count = 4) => key.slice(-count)),
}));

import { encrypt, decrypt, extractLastChars } from '../lib/encryption';

// Store original ENCRYPTION_KEY
let originalEncryptionKey: string | undefined;

describe('ApiKeyService', () => {
  beforeEach(() => {
    // Save original ENCRYPTION_KEY
    originalEncryptionKey = process.env.ENCRYPTION_KEY;
  });

  afterEach(() => {
    // Restore original ENCRYPTION_KEY
    if (originalEncryptionKey === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = originalEncryptionKey;
    }
  });

  describe('validateKey', () => {
    it('should pass validation for a valid API key', () => {
      const validKey = 'sk-1234567890abcdef1234567890abcdef';

      expect(() => ApiKeyService.validateKey(validKey)).not.toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => ApiKeyService.validateKey('')).toThrow('API key must be a non-empty string');
    });

    it('should throw for null input', () => {
      expect(() => ApiKeyService.validateKey(null as any)).toThrow(
        'API key must be a non-empty string'
      );
    });

    it('should throw for undefined input', () => {
      expect(() => ApiKeyService.validateKey(undefined as any)).toThrow(
        'API key must be a non-empty string'
      );
    });

    it('should throw for non-string input', () => {
      expect(() => ApiKeyService.validateKey(123 as any)).toThrow(
        'API key must be a non-empty string'
      );
    });

    it('should throw for keys shorter than 8 characters', () => {
      const shortKey = 'sk-12';

      expect(() => ApiKeyService.validateKey(shortKey)).toThrow(
        'API key appears to be invalid (too short)'
      );
    });

    it('should throw for keys longer than 500 characters', () => {
      const longKey = 'sk-' + 'a'.repeat(500);

      expect(() => ApiKeyService.validateKey(longKey)).toThrow(
        'API key appears to be invalid (too long)'
      );
    });

    it('should pass for exactly 8 characters', () => {
      const validKey = 'sk-12345';

      expect(() => ApiKeyService.validateKey(validKey)).not.toThrow();
    });

    it('should pass for exactly 500 characters', () => {
      const validKey = 'sk-' + 'a'.repeat(497);

      expect(() => ApiKeyService.validateKey(validKey)).not.toThrow();
    });
  });

  describe('encryptAndStore', () => {
    beforeEach(() => {
      // Set up a valid ENCRYPTION_KEY
      const validKey = Buffer.alloc(32, 'a').toString('base64');
      process.env.ENCRYPTION_KEY = validKey;
    });

    it('should successfully encrypt and store a new API key', async () => {
      const input = {
        userId: 'user_123',
        provider: 'openai' as const,
        name: 'My OpenAI Key',
        key: 'sk-1234567890abcdef1234567890abcdef',
      };

      // Mock encrypt to return valid encrypted data
      const mockEncryptedData = {
        encrypted: 'base64encrypteddata',
        iv: '123456789012',
        authTag: '12345678901234567890123456789012',
      };
      (encrypt as any).mockReturnValue(mockEncryptedData);

      // Mock extractLastChars
      (extractLastChars as any).mockReturnValue('cdef');

      // Mock database insert
      const mockInsertedKey = {
        id: 'key_123',
        userId: 'user_123',
        provider: 'openai',
        name: 'My OpenAI Key',
        encryptedKey: mockEncryptedData.encrypted,
        keyLast4: 'cdef',
        isActive: true,
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-20'),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockInsertedKey]);
      mockValues.mockReturnValue({ returning: mockReturning });

      const result = await ApiKeyService.encryptAndStore(input);

      // Verify the key was encrypted
      expect(encrypt).toHaveBeenCalledWith(input.key);

      // Verify the last 4 chars were extracted
      expect(extractLastChars).toHaveBeenCalledWith(input.key, 4);

      // Verify the result
      expect(result).toEqual({
        id: 'key_123',
        provider: 'openai',
        name: 'My OpenAI Key',
        keyLast4: 'cdef',
        isActive: true,
        createdAt: mockInsertedKey.createdAt,
        updatedAt: mockInsertedKey.updatedAt,
      });
    });

    it('should throw BAD_REQUEST for invalid key (too short)', async () => {
      const input = {
        userId: 'user_123',
        provider: 'openai' as const,
        name: 'Invalid Key',
        key: 'short',
      };

      await expect(ApiKeyService.encryptAndStore(input)).rejects.toThrow('too short');
    });

    it('should throw INTERNAL_ERROR when encryption fails', async () => {
      const input = {
        userId: 'user_123',
        provider: 'openai' as const,
        name: 'My Key',
        key: 'sk-1234567890abcdef',
      };

      // Mock encrypt to throw an error
      (encrypt as any).mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      await expect(ApiKeyService.encryptAndStore(input)).rejects.toThrow(
        'Failed to encrypt API key'
      );
      await expect(ApiKeyService.encryptAndStore(input)).rejects.toThrow(ORPCError);
    });

    it('should handle all supported providers', async () => {
      const providers: Array<
        'openai' | 'anthropic' | 'google' | 'groq' | 'ollama' | 'openrouter' | 'other'
      > = ['openai', 'anthropic', 'google', 'groq', 'ollama', 'openrouter', 'other'];

      for (const provider of providers) {
        const input = {
          userId: 'user_123',
          provider,
          name: `${provider} Key`,
          key: `sk-${provider}-1234567890abcdef`,
        };

        // Mock encrypt
        (encrypt as any).mockReturnValue({
          encrypted: 'base64encrypteddata',
          iv: '123456789012',
          authTag: '12345678901234567890123456789012',
        });

        // Mock database insert
        const mockInsertedKey = {
          id: 'key_123',
          userId: 'user_123',
          provider,
          name: `${provider} Key`,
          encryptedKey: 'base64encrypteddata',
          keyLast4: 'cdef',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const mockReturning = vi.fn().mockResolvedValue([mockInsertedKey]);
        mockValues.mockReturnValue({ returning: mockReturning });

        const result = await ApiKeyService.encryptAndStore(input);

        expect(result.provider).toBe(provider);
      }
    });
  });

  describe('retrieveAll', () => {
    it('should retrieve all API keys for a user', async () => {
      const userId = 'user_123';
      const mockKeys = [
        {
          id: 'key_1',
          provider: 'openai',
          name: 'OpenAI Key',
          keyLast4: 'sk12',
          isActive: true,
          createdAt: new Date('2025-01-20'),
          updatedAt: new Date('2025-01-20'),
        },
        {
          id: 'key_2',
          provider: 'anthropic',
          name: 'Anthropic Key',
          keyLast4: 'nt34',
          isActive: true,
          createdAt: new Date('2025-01-19'),
          updatedAt: new Date('2025-01-19'),
        },
      ];

      // Set up mock chain: db.select().from().where().orderBy()
      const mockOrderByFn = vi.fn().mockResolvedValue(mockKeys);
      const mockWhereFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      mockFrom.mockReturnValue({ where: mockWhereFn });

      const result = await ApiKeyService.retrieveAll(userId);

      // Verify the result
      expect(result).toHaveLength(2);
      expect(result[0].provider).toBe('openai');
      expect(result[1].provider).toBe('anthropic');
    });

    it('should return empty array when user has no keys', async () => {
      const userId = 'user_empty';

      // Set up mock chain
      const mockOrderByFn = vi.fn().mockResolvedValue([]);
      const mockWhereFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      mockFrom.mockReturnValue({ where: mockWhereFn });

      const result = await ApiKeyService.retrieveAll(userId);

      expect(result).toEqual([]);
    });

    it('should not include encrypted keys in results', async () => {
      const userId = 'user_123';

      // Mock select to only return specific fields
      const mockResult = [
        {
          id: 'key_1',
          provider: 'openai',
          name: 'OpenAI Key',
          keyLast4: 'sk12',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          // encryptedKey should NOT be in the result
        },
      ];

      const mockOrderByFn = vi.fn().mockResolvedValue(mockResult);
      const mockWhereFn = vi.fn().mockReturnValue({ orderBy: mockOrderByFn });
      mockFrom.mockReturnValue({ where: mockWhereFn });

      const result = await ApiKeyService.retrieveAll(userId);

      // Verify no 'key' or 'encryptedKey' in result
      expect(result[0]).not.toHaveProperty('key');
      expect(result[0]).not.toHaveProperty('encryptedKey');
      // But should have keyLast4
      expect(result[0]).toHaveProperty('keyLast4', 'sk12');
    });
  });

  describe('retrieveAndDecrypt', () => {
    beforeEach(() => {
      // Set up a valid ENCRYPTION_KEY
      const validKey = Buffer.alloc(32, 'a').toString('base64');
      process.env.ENCRYPTION_KEY = validKey;
    });

    it('should retrieve and decrypt an API key', async () => {
      const id = 'key_123';
      const userId = 'user_123';
      const decryptedKey = 'sk-1234567890abcdef';

      const mockKey = {
        id,
        userId,
        provider: 'openai',
        name: 'My OpenAI Key',
        encryptedKey: 'base64encrypteddata',
        keyLast4: 'cdef',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set up mock chain: db.select().from().where()
      const mockWhereFn = vi.fn().mockResolvedValue([mockKey]);
      mockFrom.mockReturnValue({ where: mockWhereFn });

      // Mock decrypt
      (decrypt as any).mockReturnValue(decryptedKey);

      const result = await ApiKeyService.retrieveAndDecrypt(id, userId);

      // Verify decrypt was called
      expect(decrypt).toHaveBeenCalledWith(mockKey.encryptedKey);

      // Verify the result includes the decrypted key
      expect(result).toEqual({
        id,
        provider: 'openai',
        name: 'My OpenAI Key',
        key: decryptedKey,
        keyLast4: 'cdef',
        isActive: true,
        createdAt: mockKey.createdAt,
        updatedAt: mockKey.updatedAt,
      });
    });

    it('should throw NOT_FOUND when key does not exist', async () => {
      const id = 'nonexistent_key';
      const userId = 'user_123';

      // Set up mock chain
      const mockWhereFn = vi.fn().mockResolvedValue([]);
      mockFrom.mockReturnValue({ where: mockWhereFn });

      await expect(ApiKeyService.retrieveAndDecrypt(id, userId)).rejects.toThrow(ORPCError);
      await expect(ApiKeyService.retrieveAndDecrypt(id, userId)).rejects.toThrow(
        'API key not found or you do not have permission to access it'
      );
    });

    it('should throw NOT_FOUND when key belongs to different user', async () => {
      const id = 'key_123';
      const userId = 'user_123';

      // Set up mock chain (empty because different user)
      const mockWhereFn = vi.fn().mockResolvedValue([]);
      mockFrom.mockReturnValue({ where: mockWhereFn });

      await expect(ApiKeyService.retrieveAndDecrypt(id, userId)).rejects.toThrow(ORPCError);
    });

    it('should throw INTERNAL_ERROR when decryption fails', async () => {
      const id = 'key_123';
      const userId = 'user_123';

      const mockKey = {
        id,
        userId,
        provider: 'openai',
        name: 'My Key',
        encryptedKey: 'corrupteddata',
        keyLast4: 'cdef',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set up mock chain
      const mockWhereFn = vi.fn().mockResolvedValue([mockKey]);
      mockFrom.mockReturnValue({ where: mockWhereFn });

      // Mock decrypt to throw an error
      (decrypt as any).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await expect(ApiKeyService.retrieveAndDecrypt(id, userId)).rejects.toThrow(
        'Failed to decrypt API key'
      );
      await expect(ApiKeyService.retrieveAndDecrypt(id, userId)).rejects.toThrow(ORPCError);
    });
  });

  describe('updateKey', () => {
    beforeEach(() => {
      // Set up a valid ENCRYPTION_KEY
      const validKey = Buffer.alloc(32, 'a').toString('base64');
      process.env.ENCRYPTION_KEY = validKey;
    });

    it('should update key name', async () => {
      const input = {
        userId: 'user_123',
        id: 'key_123',
        name: 'Updated Name',
      };

      const existingKey = {
        id: 'key_123',
        userId: 'user_123',
        provider: 'openai',
        name: 'Old Name',
        encryptedKey: 'base64encrypteddata',
        keyLast4: 'cdef',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock ownership check
      const mockWhereCheck = vi.fn().mockResolvedValue([existingKey]);
      mockFrom.mockReturnValue({ where: mockWhereCheck });

      // Mock update
      const updatedKey = { ...existingKey, name: 'Updated Name' };
      const mockWhereUpdate = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([updatedKey]),
      });
      mockSet.mockReturnValue({ where: mockWhereUpdate });

      const result = await ApiKeyService.updateKey(input);

      // Verify result
      expect(result.name).toBe('Updated Name');
    });

    it('should update key with encryption', async () => {
      const newKey = 'sk-newkey123456789';
      const input = {
        userId: 'user_123',
        id: 'key_123',
        key: newKey,
      };

      const existingKey = {
        id: 'key_123',
        userId: 'user_123',
        provider: 'openai',
        name: 'My Key',
        encryptedKey: 'olddata',
        keyLast4: 'cdef',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock ownership check
      const mockWhereCheck = vi.fn().mockResolvedValue([existingKey]);
      mockFrom.mockReturnValue({ where: mockWhereCheck });

      // Mock encrypt
      const mockEncryptedData = {
        encrypted: 'newencrypteddata',
        iv: '123456789012',
        authTag: '12345678901234567890123456789012',
      };
      (encrypt as any).mockReturnValue(mockEncryptedData);

      // Mock extractLastChars
      (extractLastChars as any).mockReturnValue('6789');

      // Mock update
      const updatedKey = {
        ...existingKey,
        encryptedKey: mockEncryptedData.encrypted,
        keyLast4: '6789',
      };
      const mockWhereUpdate = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([updatedKey]),
      });
      mockSet.mockReturnValue({ where: mockWhereUpdate });

      const result = await ApiKeyService.updateKey(input);

      // Verify key was encrypted
      expect(encrypt).toHaveBeenCalledWith(newKey);

      // Verify result
      expect(result.keyLast4).toBe('6789');
    });

    it('should update isActive status', async () => {
      const input = {
        userId: 'user_123',
        id: 'key_123',
        isActive: false,
      };

      const existingKey = {
        id: 'key_123',
        userId: 'user_123',
        provider: 'openai',
        name: 'My Key',
        encryptedKey: 'base64encrypteddata',
        keyLast4: 'cdef',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock ownership check
      const mockWhereCheck = vi.fn().mockResolvedValue([existingKey]);
      mockFrom.mockReturnValue({ where: mockWhereCheck });

      // Mock update
      const updatedKey = { ...existingKey, isActive: false };
      const mockWhereUpdate = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([updatedKey]),
      });
      mockSet.mockReturnValue({ where: mockWhereUpdate });

      const result = await ApiKeyService.updateKey(input);

      // Verify result
      expect(result.isActive).toBe(false);
    });

    it('should throw NOT_FOUND when key does not exist', async () => {
      const input = {
        userId: 'user_123',
        id: 'nonexistent_key',
        name: 'Updated Name',
      };

      // Mock ownership check to return empty
      const mockWhereCheck = vi.fn().mockResolvedValue([]);
      mockFrom.mockReturnValue({ where: mockWhereCheck });

      await expect(ApiKeyService.updateKey(input)).rejects.toThrow(ORPCError);
      await expect(ApiKeyService.updateKey(input)).rejects.toThrow(
        'API key not found or you do not have permission to update it'
      );
    });

    it('should throw NOT_FOUND when key belongs to different user', async () => {
      const input = {
        userId: 'user_123',
        id: 'key_123',
        name: 'Updated Name',
      };

      // Mock ownership check to return empty (different user)
      const mockWhereCheck = vi.fn().mockResolvedValue([]);
      mockFrom.mockReturnValue({ where: mockWhereCheck });

      await expect(ApiKeyService.updateKey(input)).rejects.toThrow(ORPCError);
    });

    it('should throw BAD_REQUEST for invalid new key', async () => {
      const input = {
        userId: 'user_123',
        id: 'key_123',
        key: 'short',
      };

      const existingKey = {
        id: 'key_123',
        userId: 'user_123',
        provider: 'openai',
        name: 'My Key',
        encryptedKey: 'olddata',
        keyLast4: 'cdef',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock ownership check
      const mockWhereCheck = vi.fn().mockResolvedValue([existingKey]);
      mockFrom.mockReturnValue({ where: mockWhereCheck });

      await expect(ApiKeyService.updateKey(input)).rejects.toThrow('too short');
    });

    it('should throw INTERNAL_ERROR when encryption fails during update', async () => {
      const input = {
        userId: 'user_123',
        id: 'key_123',
        key: 'sk-newkey123456789',
      };

      const existingKey = {
        id: 'key_123',
        userId: 'user_123',
        provider: 'openai',
        name: 'My Key',
        encryptedKey: 'olddata',
        keyLast4: 'cdef',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock ownership check
      const mockWhereCheck = vi.fn().mockResolvedValue([existingKey]);
      mockFrom.mockReturnValue({ where: mockWhereCheck });

      // Mock encrypt to throw an error
      (encrypt as any).mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      await expect(ApiKeyService.updateKey(input)).rejects.toThrow('Failed to encrypt API key');
      await expect(ApiKeyService.updateKey(input)).rejects.toThrow(ORPCError);
    });
  });

  describe('deleteKey', () => {
    it('should delete an existing key', async () => {
      const id = 'key_123';
      const userId = 'user_123';

      const existingKey = {
        id,
        userId,
        provider: 'openai',
        name: 'My Key',
        encryptedKey: 'base64encrypteddata',
        keyLast4: 'cdef',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock ownership check
      const mockWhereCheck = vi.fn().mockResolvedValue([existingKey]);
      mockFrom.mockReturnValue({ where: mockWhereCheck });

      // Mock delete
      const mockWhereDelete = vi.fn().mockResolvedValue(undefined);
      mockWhere.mockReturnValue(mockWhereDelete);

      const result = await ApiKeyService.deleteKey(id, userId);

      // Verify result
      expect(result).toEqual({ success: true });
    });

    it('should throw NOT_FOUND when key does not exist', async () => {
      const id = 'nonexistent_key';
      const userId = 'user_123';

      // Mock ownership check to return empty
      const mockWhereCheck = vi.fn().mockResolvedValue([]);
      mockFrom.mockReturnValue({ where: mockWhereCheck });

      await expect(ApiKeyService.deleteKey(id, userId)).rejects.toThrow(ORPCError);
      await expect(ApiKeyService.deleteKey(id, userId)).rejects.toThrow(
        'API key not found or you do not have permission to delete it'
      );
    });

    it('should throw NOT_FOUND when key belongs to different user', async () => {
      const id = 'key_123';
      const userId = 'user_123';

      // Mock ownership check to return empty (different user)
      const mockWhereCheck = vi.fn().mockResolvedValue([]);
      mockFrom.mockReturnValue({ where: mockWhereCheck });

      await expect(ApiKeyService.deleteKey(id, userId)).rejects.toThrow(ORPCError);
    });

    it('should enforce user-level isolation', async () => {
      const id = 'key_123';
      const differentUserId = 'user_456';

      // Mock ownership check to return empty (different user)
      const mockWhereCheck = vi.fn().mockResolvedValue([]);
      mockFrom.mockReturnValue({ where: mockWhereCheck });

      // User 456 should NOT be able to delete user 123's key
      await expect(ApiKeyService.deleteKey(id, differentUserId)).rejects.toThrow(ORPCError);
    });
  });

  describe('User Isolation', () => {
    beforeEach(() => {
      // Set up a valid ENCRYPTION_KEY
      const validKey = Buffer.alloc(32, 'a').toString('base64');
      process.env.ENCRYPTION_KEY = validKey;
    });

    it('should enforce user isolation in retrieveAndDecrypt', async () => {
      const id = 'key_123';
      const userId = 'user_123';
      const differentUserId = 'user_456';

      const mockKey = {
        id,
        userId,
        provider: 'openai',
        name: 'User 123 Key',
        encryptedKey: 'base64encrypteddata',
        keyLast4: 'cdef',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // When user 123 queries, they get the key
      const mockWhere1 = vi.fn().mockResolvedValue([mockKey]);
      mockFrom.mockReturnValue({ where: mockWhere1 });
      (decrypt as any).mockReturnValue('sk-1234567890abcdef');

      const result1 = await ApiKeyService.retrieveAndDecrypt(id, userId);
      expect(result1.id).toBe(id);

      // Clear mocks
      vi.clearAllMocks();

      // When user 456 queries, they get NOT_FOUND
      const mockWhere2 = vi.fn().mockResolvedValue([]);
      mockFrom.mockReturnValue({ where: mockWhere2 });

      await expect(ApiKeyService.retrieveAndDecrypt(id, differentUserId)).rejects.toThrow(
        ORPCError
      );
    });

    it('should enforce user isolation in updateKey', async () => {
      const id = 'key_123';
      const differentUserId = 'user_456';

      const input = {
        userId: differentUserId,
        id,
        name: 'Hacked Name',
      };

      // Ownership check returns empty (different user)
      const mockWhereCheck = vi.fn().mockResolvedValue([]);
      mockFrom.mockReturnValue({ where: mockWhereCheck });

      // User 456 should NOT be able to update user 123's key
      await expect(ApiKeyService.updateKey(input)).rejects.toThrow(ORPCError);
    });

    it('should enforce user isolation in deleteKey', async () => {
      const id = 'key_123';
      const differentUserId = 'user_456';

      // Ownership check returns empty (different user)
      const mockWhereCheck = vi.fn().mockResolvedValue([]);
      mockFrom.mockReturnValue({ where: mockWhereCheck });

      // User 456 should NOT be able to delete user 123's key
      await expect(ApiKeyService.deleteKey(id, differentUserId)).rejects.toThrow(ORPCError);
    });
  });
});
