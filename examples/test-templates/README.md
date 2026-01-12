# AI Provider Test Templates

This directory contains comprehensive test templates and examples for testing AI provider integrations. Use these templates as a starting point when adding new providers or expanding test coverage.

## 📁 Directory Structure

```
test-templates/
├── README.md                           # This file
├── unit/                               # Unit tests (Vitest)
│   ├── provider-initialization.test.ts
│   ├── model-creation.test.ts
│   ├── validation.test.ts
│   └── error-handling.test.ts
├── integration/                        # Integration tests (Supertest)
│   ├── endpoint.test.ts
│   ├── streaming.test.ts
│   ├── errors.test.ts
│   └── multi-turn.test.ts
├── e2e/                               # E2E tests (Playwright)
│   ├── chat-flow.test.ts
│   ├── streaming.test.ts
│   └── error-handling.test.ts
├── fixtures/                           # Test data and mocks
│   ├── messages.ts
│   ├── responses.ts
│   └── providers.ts
├── utils/                             # Test utilities
│   ├── providers.ts
│   ├── mock-server.ts
│   └── assertions.ts
└── setup/                             # Test configuration
    ├── vitest.config.ts
    ├── setup.ts
    └── teardown.ts
```

## 🚀 Quick Start

### 1. Copy Templates to Your Project

```bash
# Copy all templates
cp -r examples/test-templates/* tests/

# Or copy specific test types
cp -r examples/test-templates/unit/* tests/unit/
cp -r examples/test-templates/integration/* tests/integration/
```

### 2. Install Dependencies

```bash
# Unit & Integration tests
npm install --save-dev vitest @vitest/coverage-v8 supertest

# E2E tests
npm install --save-dev playwright @playwright/test
```

### 3. Configure Test Runner

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### 4. Customize for Your Provider

Replace placeholder values in test files:

```typescript
// Before: Generic template
const PROVIDER_NAME = 'openai';
const MODEL_ID = 'gpt-4o-mini';

// After: Your provider
const PROVIDER_NAME = 'your-provider';
const MODEL_ID = 'your-model-id';
```

### 5. Run Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests with coverage
npm run test:all
```

## 📋 Test Templates Overview

### Unit Tests (`unit/`)

Test individual components and functions in isolation.

| Test File | Purpose | Key Assertions |
|-----------|---------|----------------|
| `provider-initialization.test.ts` | Test provider setup | Model creation, configuration |
| `model-creation.test.ts` | Test model instances | Model IDs, parameters, defaults |
| `validation.test.ts` | Test input validation | Message format, required fields |
| `error-handling.test.ts` | Test error scenarios | Invalid API keys, rate limits |

**When to use:** During development to verify individual functions work correctly.

### Integration Tests (`integration/`)

Test API endpoints and server integration.

| Test File | Purpose | Key Scenarios |
|-----------|---------|---------------|
| `endpoint.test.ts` | Test `/ai` endpoint | Health checks, model info |
| `streaming.test.ts` | Test streaming responses | SSE format, chunk handling |
| `errors.test.ts` | Test error responses | 4xx and 5xx status codes |
| `multi-turn.test.ts` | Test conversations | Context retention, history |

**When to use:** After implementing server endpoints to verify integration.

### E2E Tests (`e2e/`)

Test complete user flows from frontend to backend.

| Test File | Purpose | Key Workflows |
|-----------|---------|---------------|
| `chat-flow.test.ts` | Test chat UI | Send message, receive response |
| `streaming.test.ts` | Test streaming UI | Real-time token display |
| `error-handling.test.ts` | Test error UI | Error messages, retry logic |

**When to use:** Before deployment to verify complete user workflows.

### Fixtures (`fixtures/`)

Reusable test data and mock responses.

```typescript
// Use fixtures in your tests
import { sampleMessages, mockProviderResponse } from '../fixtures';

describe('My Tests', () => {
  it('should process sample messages', () => {
    const result = processMessages(sampleMessages.simple);
    expect(result).toBeDefined();
  });
});
```

### Utils (`utils/`)

Helper functions and utilities for tests.

```typescript
// Provider factory for testing
import { createTestProvider, mockStreamResponse } from '../utils';

describe('My Tests', () => {
  it('should test with mock provider', () => {
    const provider = createTestProvider('openai');
    // Test with provider
  });
});
```

## 🔧 Customization Guide

### 1. Update Provider Names

Find and replace placeholders:

```bash
# In all test files
find . -name '*.test.ts' -exec sed -i '' 's/your-provider/new-provider/g' {} +
```

### 2. Add Provider-Specific Tests

Add tests for unique provider features:

```typescript
// Example: Anthropic 200K context
describe('Anthropic Long Context', () => {
  it('should handle 200K context window', async () => {
    const longMessages = generateMessages(199000); // 199K tokens
    const result = await streamText({ model, messages: longMessages });
    expect(result).toBeDefined();
  });
});
```

### 3. Configure Provider Endpoints

Update base URLs and endpoints:

```typescript
const PROVIDER_CONFIG = {
  baseURL: 'https://api.your-provider.com/v1',
  models: ['model-1', 'model-2', 'model-3'],
  defaultModel: 'model-1',
};
```

### 4. Set Environment Variables

Create `.env.test`:

```bash
# Provider API keys (use test keys, not production)
YOUR_PROVIDER_API_KEY=test_key_123
OPENAI_API_KEY=test_key_456
ANTHROPIC_API_KEY=test_key_789
```

## 📊 Test Coverage Goals

Aim for these coverage targets:

| Type | Target | Notes |
|------|--------|-------|
| Statements | 80%+ | Minimum production standard |
| Branches | 75%+ | Include error paths |
| Functions | 80%+ | Public and private functions |
| Lines | 80%+ | All code paths |

View coverage report:

```bash
npm run test:coverage
open coverage/index.html
```

## 🐛 Troubleshooting

### Tests Fail with "API Key Invalid"

**Solution:** Use test API keys, not production keys.

```bash
# .env.test
OPENAI_API_KEY=sk-test-...  # Test key
```

### Integration Tests Fail with "ECONNREFUSED"

**Solution:** Start test server before running tests.

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run tests
npm run test:integration
```

### E2E Tests Fail with "Timeout"

**Solution:** Increase timeout for slow providers.

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds
  },
});
```

### Tests Pass Locally but Fail in CI

**Solution:** Mock external API calls in CI.

```typescript
// Use Vitest mocks
vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(),
}));
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [AI SDK Testing Guide](https://sdk.vercel.ai/docs/ai-sdk-core/testing)

## 🤝 Contributing

When adding tests for a new provider:

1. Copy templates from this directory
2. Customize for your provider
3. Add provider-specific tests
4. Update this README with provider-specific notes
5. Run all tests and ensure coverage targets are met
6. Submit PR with test suite

## 📝 Checklist

Before marking tests complete:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Coverage targets met (80%+)
- [ ] Provider-specific features tested
- [ ] Error scenarios tested
- [ ] Documentation updated
- [ ] Tests run in CI/CD pipeline

## 🎯 Best Practices

1. **Test Isolation:** Each test should be independent
2. **Clear Names:** Use descriptive test names
3. **One Assertion:** Prefer one assertion per test
4. **Arrange-Act-Assert:** Structure tests clearly
5. **Mock External Calls:** Don't call real APIs in unit tests
6. **Test Error Paths:** Test both success and failure cases
7. **Use Fixtures:** Reuse test data via fixtures
8. **Fast Feedback:** Keep tests fast (<5 seconds for unit tests)
9. **Meaningful Messages:** Add clear error messages
10. **Version Control:** Commit test files with code changes

---

**Need help?** See the main [AI Provider Integration Guide](../../docs/ai-provider-integration-guide.md#7-testing-and-validation) for detailed testing procedures.
