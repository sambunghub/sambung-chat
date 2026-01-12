# Multi-Provider Integration - Easy Provider Switching

This example demonstrates a **provider abstraction pattern** that makes it incredibly easy to switch between different AI providers without modifying any code.

## 🎯 Key Features

✅ **Zero Code Changes** - Switch providers by changing environment variables only
✅ **Fallback Chains** - Configure multiple providers for automatic failover
✅ **Unified Interface** - Single API endpoint for all providers
✅ **Type Safety** - Full TypeScript support with provider types
✅ **Production Ready** - Comprehensive error handling and logging
✅ **Provider Factory** - Reusable helper functions for provider creation

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [The Provider Abstraction Pattern](#the-provider-abstraction-pattern)
- [Provider Switching Examples](#provider-switching-examples)
- [Provider Factory API](#provider-factory-api)
- [Configuration Guide](#configuration-guide)
- [Fallback Chains](#fallback-chains)
- [Advanced Patterns](#advanced-patterns)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure your provider:

```bash
# Option 1: Use OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here

# Option 2: Use Anthropic
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Option 3: Use Google
AI_PROVIDER=google
GOOGLE_GENERATIVE_AI_API_KEY=your-key-here

# Option 4: Use Groq (ultra-fast)
AI_PROVIDER=groq
GROQ_API_KEY=gsk-your-key-here

# Option 5: Use Ollama (local, free)
AI_PROVIDER=ollama
```

### 3. Start the Server

```bash
npm run dev
```

### 4. Test the Integration

```bash
# Health check
curl http://localhost:3001/health

# Send a message
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello!"}]}'
```

## 🏗️ The Provider Abstraction Pattern

### The Problem

Without abstraction, switching providers requires code changes:

```typescript
// ❌ Without abstraction - code changes required
import { openai } from "@ai-sdk/openai";
const model = openai("gpt-4o-mini"); // To switch providers, change this line

// Later, to use Anthropic:
import { anthropic } from "@ai-sdk/anthropic";
const model = anthropic("claude-3-5-sonnet"); // Code change!
```

### The Solution

With the provider factory pattern, **zero code changes** are needed:

```typescript
// ✅ With abstraction - environment-driven
import { createModelAuto } from "./provider-factory";
const model = createModelAuto(env); // Provider selected via AI_PROVIDER env var
```

### How It Works

1. **Provider Factory** - `createModelAuto()` reads `AI_PROVIDER` environment variable
2. **Model Creation** - Automatically creates the correct provider model instance
3. **Configuration** - Uses provider-specific environment variables (API keys, base URLs)
4. **Type Safety** - Returns `LanguageModelV1` type compatible with all AI SDK functions

## 🔄 Provider Switching Examples

### Example 1: Single Provider (Simplest)

```bash
# .env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Result: Uses OpenAI's GPT-4o-mini

```bash
# To switch to Anthropic, just change .env:
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

Result: Uses Anthropic's Claude 3.5 Sonnet - **no code changes!**

### Example 2: Fallback Chain (High Availability)

```bash
# .env
AI_PROVIDER=openai,anthropic,groq
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk-...
```

Result:
- Tries OpenAI first
- Falls back to Anthropic if OpenAI fails
- Falls back to Groq if both fail
- Automatic failover with no code changes

### Example 3: Cost Optimization

```bash
# .env - Order by cost (cheapest first)
AI_PROVIDER=groq,google,openai,anthropic
GROQ_API_KEY=gsk-...
GOOGLE_GENERATIVE_AI_API_KEY=...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

Result: Always uses the cheapest available provider

### Example 4: Development vs. Production

```bash
# .env.local (development - use free local AI)
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
```

```bash
# .env.production (production - use reliable cloud provider)
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

Result: Different providers for different environments - same code!

## 🔧 Provider Factory API

The `provider-factory.ts` module exports these helper functions:

### `createModelAuto(env)`

Automatically creates a model based on environment configuration.

```typescript
import { createModelAuto } from "./provider-factory";

const model = createModelAuto({
  AI_PROVIDER: "openai",
  OPENAI_API_KEY: "sk-...",
  OPENAI_MODEL: "gpt-4o-mini",
});
```

**Returns:** `LanguageModelV1` - Ready to use with `streamText()`

**Throws:** Error if no provider is configured

### `createProviderModel(provider, modelId, env)`

Creates a model for a specific provider.

```typescript
import { createProviderModel } from "./provider-factory";

const model = createProviderModel(
  "anthropic",
  "claude-3-5-sonnet-20241022",
  { ANTHROPIC_API_KEY: "sk-ant-..." }
);
```

**Parameters:**
- `provider`: Provider name ("openai" | "anthropic" | "google" | "groq" | "ollama")
- `modelId`: Model identifier
- `env`: Environment variables object

### `getDefaultModel(provider)`

Gets the default model ID for a provider.

```typescript
import { getDefaultModel } from "./provider-factory";

getDefaultModel("openai"); // "gpt-4o-mini"
getDefaultModel("anthropic"); // "claude-3-5-sonnet-20241022"
```

### `isProviderConfigured(provider, env)`

Checks if a provider has valid credentials configured.

```typescript
import { isProviderConfigured } from "./provider-factory";

isProviderConfigured("openai", { OPENAI_API_KEY: "sk-..." }); // true
isProviderConfigured("openai", {}); // false
```

### `getFirstConfiguredProvider(providers, env)`

Gets the first configured provider from a list.

```typescript
import { getFirstConfiguredProvider } from "./provider-factory";

const providers = ["openai", "anthropic", "groq"];
const env = {
  ANTHROPIC_API_KEY: "sk-ant-...",
  GROQ_API_KEY: "gsk-...",
};

getFirstConfiguredProvider(providers, env); // "anthropic" (first configured)
```

## 📝 Configuration Guide

### Environment Variables

| Variable | Type | Description | Required |
|----------|------|-------------|----------|
| `AI_PROVIDER` | string | Provider name or comma-separated fallback chain | No (default: "openai") |
| `OPENAI_API_KEY` | string | OpenAI API key | Required for OpenAI |
| `OPENAI_MODEL` | string | OpenAI model ID | No (default: "gpt-4o-mini") |
| `ANTHROPIC_API_KEY` | string | Anthropic API key | Required for Anthropic |
| `ANTHROPIC_MODEL` | string | Anthropic model ID | No (default: "claude-3-5-sonnet-20241022") |
| `GOOGLE_GENERATIVE_AI_API_KEY` | string | Google API key | Required for Google |
| `GOOGLE_MODEL` | string | Google model ID | No (default: "gemini-2.5-flash") |
| `GROQ_API_KEY` | string | Groq API key | Required for Groq |
| `GROQ_MODEL` | string | Groq model ID | No (default: "llama-3.3-70b-versatile") |
| `OLLAMA_BASE_URL` | string | Ollama server URL | No (default: "http://localhost:11434/v1") |
| `OLLAMA_MODEL` | string | Ollama model ID | No (default: "llama3.2") |

### Provider-Specific Configuration

#### OpenAI

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini  # or gpt-4o, o1-mini, o1-preview
OPENAI_BASE_URL=https://api.openai.com/v1  # optional
OPENAI_ORGANIZATION=org-your-id  # optional
```

#### Anthropic

```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # or claude-3-5-haiku-20241022, claude-3-opus-20240229
ANTHROPIC_BASE_URL=https://api.anthropic.com  # optional
```

#### Google

```bash
AI_PROVIDER=google
GOOGLE_GENERATIVE_AI_API_KEY=your-key-here  # or GOOGLE_API_KEY
GOOGLE_MODEL=gemini-2.5-flash  # or gemini-2.5-pro
```

#### Groq

```bash
AI_PROVIDER=groq
GROQ_API_KEY=gsk-your-key-here
GROQ_MODEL=llama-3.3-70b-versatile  # or llama-3.1-70b-versatile, mixtral-8x7b-32768
GROQ_BASE_URL=https://api.groq.com/openai/v1  # optional
```

#### Ollama

```bash
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2  # or llama3.1, mistral, codellama, etc.
OLLAMA_BASE_URL=http://localhost:11434/v1  # optional
```

**Note:** Ollama doesn't require an API key. Make sure Ollama is running:
```bash
ollama serve
ollama pull llama3.2
```

## 🔗 Fallback Chains

### How Fallback Chains Work

When you specify multiple providers in `AI_PROVIDER`, the system will:

1. Try the first provider
2. If it fails (missing API key, API error, etc.), try the next provider
3. Continue until a working provider is found
4. Return an error only if all providers fail

### Example: High Availability Configuration

```bash
# .env
AI_PROVIDER=openai,anthropic,groq

# Configure all three providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk-...
```

**Scenario:**
- ✅ OpenAI is working → Uses OpenAI
- ❌ OpenAI API key is invalid → Falls back to Anthropic
- ❌ Anthropic rate limit reached → Falls back to Groq
- ✅ Groq is working → Uses Groq

### Example: Cost-Optimized Configuration

```bash
# Order by cost per 1M tokens (input)
AI_PROVIDER=groq,google,openai,anthropic

# Groq: ~$0.59 (cheapest)
# Google: ~$0.075
# OpenAI: ~$0.15
# Anthropic: ~$3 (most expensive)
```

Result: Always uses the cheapest available provider

## 🚀 Advanced Patterns

### Pattern 1: Runtime Provider Selection

Allow users to select their preferred provider:

```typescript
app.post("/ai/:provider", async (c) => {
  const provider = c.req.param("provider"); // e.g., "openai"
  const { messages } = await c.req.json();

  const model = createProviderModel(
    provider,
    getDefaultModel(provider),
    c.env
  );

  const result = streamText({ model, messages });
  return result.toDataStreamResponse();
});
```

### Pattern 2: A/B Testing Different Providers

Test multiple providers and compare results:

```typescript
const providers = ["openai", "anthropic"];
const results = await Promise.all(
  providers.map(async (provider) => {
    const model = createProviderModel(provider, modelId, env);
    const result = await generateText({ model, messages });
    return { provider, result };
  })
);
```

### Pattern 3: Provider-Specific Features

Use provider-specific features while maintaining the abstraction:

```typescript
const model = createProviderModel(provider, modelId, env);

// Provider-specific options
const options: any = {
  temperature: 0.7,
};

if (provider === "anthropic") {
  options.topP = 1; // Anthropic-specific
} else if (provider === "openai") {
  options.topP = 1; // OpenAI-specific
}

const result = streamText({ model, messages, ...options });
```

## 🔌 API Endpoints

### `GET /health`

Health check endpoint showing active provider configuration.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-12T10:00:00.000Z",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "configured": true,
  "baseURL": "https://api.openai.com/v1",
  "availableProviders": ["openai", "anthropic"]
}
```

### `GET /ai/providers`

Returns information about all configured providers.

**Response:**
```json
{
  "active": "openai",
  "providers": [
    {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "configured": true
    },
    {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "configured": true
    }
  ],
  "count": {
    "total": 2,
    "configured": 2
  }
}
```

### `POST /ai`

Main chat endpoint. Provider is automatically selected based on configuration.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ]
}
```

**Response:** Server-Sent Events (SSE) stream

### `GET /ai/models`

Returns available models for the active provider.

**Response:**
```json
{
  "provider": "openai",
  "current": {
    "id": "gpt-4o-mini",
    "name": "GPT-4o Mini",
    "context": 128000,
    "bestFor": "General chat, fast responses",
    "cost": "Low"
  },
  "available": [...]
}
```

## 🧪 Testing

### Manual Testing

```bash
# 1. Health check
curl http://localhost:3001/health

# 2. Check providers
curl http://localhost:3001/ai/providers

# 3. List models
curl http://localhost:3001/ai/models

# 4. Send a message
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is AI?"}]}'
```

### Automated Testing

Run the automated test suite:

```bash
npm test
```

This will run 8 tests:
1. Health check
2. Providers endpoint
3. Simple AI request
4. Multi-turn conversation
5. Empty message error handling
6. Invalid format error handling
7. Long message handling
8. Special characters and Unicode

### Provider Switching Test

Test switching between providers:

```bash
# Test with OpenAI
AI_PROVIDER=openai OPENAI_API_KEY=sk-... npm test

# Test with Anthropic (no code changes!)
AI_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-ant-... npm test

# Test with Groq (still no code changes!)
AI_PROVIDER=groq GROQ_API_KEY=gsk-... npm test
```

## ✅ Best Practices

### 1. Use Environment-Specific Configuration

```bash
# .env.local (development)
AI_PROVIDER=ollama  # Free, local

# .env.production (production)
AI_PROVIDER=anthropic  # Reliable, high quality
```

### 2. Implement Fallback Chains for Production

```bash
# Production configuration
AI_PROVIDER=openai,anthropic,groq
```

### 3. Set Default Models Explicitly

```bash
# Explicit is better than implicit
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### 4. Monitor Provider Performance

```typescript
onFinish: (result) => {
  console.log(`[${provider}] Tokens: ${result.usage.totalTokens}`);
}
```

### 5. Test All Providers Before Deployment

```bash
# Test each provider individually
AI_PROVIDER=openai npm test
AI_PROVIDER=anthropic npm test
AI_PROVIDER=groq npm test
```

### 6. Use Provider Factory in Your Code

```typescript
// ✅ Good - Uses provider factory
import { createModelAuto } from "./provider-factory";
const model = createModelAuto(env);

// ❌ Bad - Hardcoded provider
import { openai } from "@ai-sdk/openai";
const model = openai("gpt-4o-mini");
```

## 🔧 Troubleshooting

### Issue: "No AI provider configured"

**Cause:** No API keys are configured for any provider in the fallback chain.

**Solution:**
```bash
# Make sure at least one provider has an API key
AI_PROVIDER=openai,anthropic
OPENAI_API_KEY=sk-...  # Configure at least one
ANTHROPIC_API_KEY=sk-ant-...
```

### Issue: "API_KEY is required for X provider"

**Cause:** The selected provider requires an API key but none is configured.

**Solution:**
```bash
# Set the required API key
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

### Issue: "Unsupported provider"

**Cause:** Invalid provider name in `AI_PROVIDER`.

**Solution:**
```bash
# Use valid provider names
AI_PROVIDER=openai  # ✅ Valid
AI_PROVIDER=invalid  # ❌ Invalid

# Valid options: openai, anthropic, google, groq, ollama
```

### Issue: Ollama connection refused

**Cause:** Ollama server is not running.

**Solution:**
```bash
# Start Ollama
ollama serve

# Pull the model
ollama pull llama3.2
```

### Issue: Provider not using custom model

**Cause:** Model environment variable not set or typo in variable name.

**Solution:**
```bash
# Make sure the variable name matches the provider
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini  # ✅ Correct
OPENAI_MODEL=gpt-4o-mini  # ✅ Correct (case-sensitive)
```

## 📚 Additional Resources

- [AI SDK Documentation](https://ai-sdk.dev)
- [Provider Factory Source Code](./provider-factory.ts)
- [Server Implementation](./server.ts)
- [Environment Configuration](./.env.example)

## 🤝 Contributing

To add support for a new provider:

1. Import the provider package in `provider-factory.ts`
2. Add a case in `createProviderModel()` switch statement
3. Add default model in `getDefaultModel()`
4. Update `isProviderConfigured()` validation
5. Add provider info in `getProviderInfo()`
6. Update this README with provider-specific configuration

Example:

```typescript
// 1. Import provider
import { newprovider } from "@ai-sdk/newprovider";

// 2. Add case in switch statement
case "newprovider":
  model = newprovider(modelId, { apiKey: env.NEWPROVIDER_API_KEY });
  break;

// 3. Add default model
newprovider: "newprovider-model-1",

// 4. Add validation
case "newprovider":
  return !!env.NEWPROVIDER_API_KEY;

// 5. Add base URL to provider info
if (provider === "newprovider" && env.NEWPROVIDER_BASE_URL) {
  info.baseURL = env.NEWPROVIDER_BASE_URL;
}
```

## 📄 License

MIT

## 🎉 Summary

This multi-provider integration example demonstrates:

✅ **Easy Provider Switching** - Change providers via environment variables
✅ **Fallback Chains** - Automatic failover to backup providers
✅ **Provider Factory** - Reusable abstraction layer
✅ **Zero Code Changes** - Switch providers without touching code
✅ **Production Ready** - Error handling, logging, type safety
✅ **Comprehensive Testing** - Manual and automated tests

**Key Takeaway:** The provider factory pattern enables you to switch between any AI provider in seconds, just by changing environment variables. No code modifications required!
