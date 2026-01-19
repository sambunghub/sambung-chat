/**
 * API Endpoint Integration Tests
 *
 * Purpose: Test server endpoints and API integration
 *
 * Usage:
 * 1. Replace PROVIDER_NAME with your provider name
 * 2. Update BASE_URL to match your server configuration
 * 3. Customize endpoints for your implementation
 * 4. Add provider-specific endpoint tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../server';
import request from 'supertest';

const PROVIDER_NAME = 'openai';
const BASE_URL = 'http://localhost:3001';

describe(`${PROVIDER_NAME} API Endpoint Integration`, () => {
  let app: any;

  beforeAll(async () => {
    // Build/start test server
    app = buildApp();
  });

  afterAll(async () => {
    // Cleanup test server
    if (app && app.close) {
      await app.close();
    }
  });

  describe('Health Check Endpoint', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should include provider information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.provider).toBeDefined();
      expect(response.body.provider).toBe(PROVIDER_NAME);
    });

    it('should include uptime information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.uptime).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Models Info Endpoint', () => {
    it('should return available models', async () => {
      const response = await request(app)
        .get('/ai/models')
        .expect(200);

      expect(response.body.models).toBeDefined();
      expect(Array.isArray(response.body.models)).toBe(true);
    });

    it('should include model IDs', async () => {
      const response = await request(app)
        .get('/ai/models')
        .expect(200);

      response.body.models.forEach((model: any) => {
        expect(model.id).toBeDefined();
        expect(model.id).toBeTruthy();
      });
    });

    it('should include model metadata', async () => {
      const response = await request(app)
        .get('/ai/models')
        .expect(200);

      const firstModel = response.body.models[0];

      expect(firstModel).toHaveProperty('id');
      // Add more metadata fields as needed
    });

    it('should return provider information', async () => {
      const response = await request(app)
        .get('/ai/models')
        .expect(200);

      expect(response.body.provider).toBeDefined();
      expect(response.body.provider).toBe(PROVIDER_NAME);
    });
  });

  describe('AI Chat Endpoint', () => {
    it('should handle simple chat request', async () => {
      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: 'Say hello' },
          ],
        })
        .expect(200);

      expect(response.text).toBeTruthy();
    });

    it('should return streaming response', async () => {
      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: 'Say hello' },
          ],
        })
        .expect(200);

      // Verify streaming format (Server-Sent Events)
      expect(response.text).toContain('data:');
    });

    it('should handle multi-turn conversation', async () => {
      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: 'My name is Bob' },
            { role: 'assistant', content: 'Hello Bob!' },
            { role: 'user', content: 'What is my name?' },
          ],
        })
        .expect(200);

      expect(response.text).toContain('Bob');
    });

    it('should handle empty messages array', async () => {
      const response = await request(app)
        .post('/ai')
        .send({
          messages: [],
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid message format', async () => {
      const response = await request(app)
        .post('/ai')
        .send({
          messages: 'not-an-array',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle missing messages field', async () => {
      const response = await request(app)
        .post('/ai')
        .send({
          // Missing messages
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle system messages', async () => {
      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello' },
          ],
        })
        .expect(200);

      expect(response.text).toBeTruthy();
    });

    it('should handle long messages', async () => {
      const longMessage = 'A'.repeat(1000);

      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: longMessage },
          ],
        })
        .expect(200);

      expect(response.text).toBeTruthy();
    });

    it('should handle special characters', async () => {
      const specialMessage = 'Test: 🎉 <script> & "quotes"';

      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: specialMessage },
          ],
        })
        .expect(200);

      expect(response.text).toBeTruthy();
    });

    it('should handle Unicode content', async () => {
      const unicodeMessage = 'Hello 世界 🌍 مرحبا';

      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: unicodeMessage },
          ],
        })
        .expect(200);

      expect(response.text).toBeTruthy();
    });
  });

  describe('Request Parameters', () => {
    it('should accept temperature parameter', async () => {
      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: 'Say hello' },
          ],
          temperature: 0.7,
        })
        .expect(200);

      expect(response.text).toBeTruthy();
    });

    it('should accept max tokens parameter', async () => {
      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: 'Say hello' },
          ],
          maxTokens: 100,
        })
        .expect(200);

      expect(response.text).toBeTruthy();
    });

    it('should accept top P parameter', async () => {
      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: 'Say hello' },
          ],
          topP: 0.9,
        })
        .expect(200);

      expect(response.text).toBeTruthy();
    });

    it('should reject invalid temperature', async () => {
      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: 'Say hello' },
          ],
          temperature: 3, // Invalid: > 2
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject negative max tokens', async () => {
      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: 'Say hello' },
          ],
          maxTokens: -100, // Invalid: negative
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for invalid API key', async () => {
      // This test requires mocking or test API key
      // Skip if no test environment configured
      if (!process.env.TEST_INVALID_API_KEY) {
        return;
      }

      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: 'Test' },
          ],
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 429 for rate limit exceeded', async () => {
      // This test requires triggering rate limit
      // Skip in normal testing
      if (!process.env.TEST_RATE_LIMIT) {
        return;
      }

      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: 'Test' },
          ],
        })
        .expect(429);

      expect(response.body.error).toContain('rate limit');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/ai')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle large payloads', async () => {
      const largeMessage = 'A'.repeat(100000);

      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: largeMessage },
          ],
        });

      // Should either succeed or return proper error
      expect([200, 400, 413]).toContain(response.status);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle preflight OPTIONS request', async () => {
      const response = await request(app)
        .options('/ai')
        .expect(204);

      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('Response Headers', () => {
    it('should include content-type header', async () => {
      const response = await request(app)
        .post('/ai')
        .send({
          messages: [
            { role: 'user', content: 'Hello' },
          ],
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
    });

    it('should include cache-control header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['cache-control']).toBeDefined();
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/ai')
          .send({
            messages: [
              { role: 'user', content: `Test ${i}` },
            ],
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect([200, 500]).toContain(response.status);
      });
    });
  });
});

/**
 * Customization Checklist:
 *
 * ✅ Replace PROVIDER_NAME
 * ✅ Update BASE_URL
 * ✅ Customize endpoints for your implementation
 * ✅ Add provider-specific endpoint tests
 * ✅ Update error codes and messages
 * ✅ Add authentication tests
 * ✅ Test all supported parameters
 * ✅ Add provider-specific error scenarios
 */
