# AI Provider Integration Guide: Adding New Models to SambungChat

**Version:** 1.0
**Last Updated:** 2026-01-12
**Target Audience:** Contributors, Developers, DevOps Engineers
**Difficulty Level:** Intermediate to Advanced

---

## Table of Contents

1. [Introduction and Overview](#1-introduction-and-overview)
2. [Understanding the AI SDK Architecture](#2-understanding-the-ai-sdk-architecture)
3. [Current Implementation Analysis](#3-current-implementation-analysis)
4. [Step-by-Step Integration Guide](#4-step-by-step-integration-guide)
5. [Provider-Specific Configurations](#5-provider-specific-configurations)
6. [Environment Configuration](#6-environment-configuration)
7. [Testing and Validation](#7-testing-and-validation)
8. [Troubleshooting and Common Issues](#8-troubleshooting-and-common-issues)
9. [Advanced Topics](#9-advanced-topics)
10. [Best Practices and Guidelines](#10-best-practices-and-guidelines)
11. [Reference and Resources](#11-reference-and-resources)

---

## 1. Introduction and Overview

### 1.1 Purpose of This Guide

This guide provides comprehensive documentation for integrating new AI providers into SambungChat. As the project aims to support "any AI model," contributors need clear, standardized procedures for adding new providers without reverse-engineering existing code.

#### What This Guide Covers

- **Complete integration workflow** from provider selection to deployment
- **Code examples** for major AI providers (OpenAI, Anthropic, Google, Groq, Ollama, and more)
- **Environment configuration** patterns and best practices
- **Testing procedures** to validate new integrations
- **Troubleshooting common issues** with solutions
- **Advanced patterns** for multi-provider setups and optimization

#### Who Should Use This Guide

This guide is intended for:

- **Contributors** adding new AI provider integrations to SambungChat
- **Developers** extending or modifying existing AI functionality
- **DevOps Engineers** configuring AI provider environments for deployment
- **Technical Leads** evaluating provider options and integration strategies

#### Prerequisites

Before following this guide, you should have:

- **Working knowledge** of TypeScript and Node.js
- **Understanding** of REST APIs and streaming responses
- **Familiarity** with environment variables and configuration management
- **Basic awareness** of AI/LLM concepts (tokens, models, prompts)
- **Access** to the SambungChat codebase

#### Expected Outcomes

After completing this guide, you will be able to:

- ✅ Integrate any AI SDK-supported provider into SambungChat
- ✅ Configure environment variables for multiple providers
- ✅ Implement provider switching and fallback mechanisms
- ✅ Test and validate new integrations
- ✅ Troubleshoot common integration issues
- ✅ Follow best practices for production deployments

---

### 1.2 What Are AI Providers?

#### Definition

In the context of SambungChat, **AI providers** are services that expose large language models (LLMs) through APIs. Each provider offers access to different models with varying capabilities, performance characteristics, and pricing structures.

#### Why Multiple Provider Support Matters

Supporting multiple AI providers provides strategic advantages:

**1. Vendor Independence**

- Avoid lock-in to a single AI provider
- Switch providers as the market evolves
- Negotiate better pricing through competition

**2. Model Diversity**

- Access different model architectures (GPT, Claude, Gemini, Llama, etc.)
- Choose specialized models for specific tasks (code, reasoning, speed)
- Leverage cost-effective models for different use cases

**3. Resilience and Reliability**

- Implement fallback mechanisms during outages
- Route traffic based on availability and performance
- Reduce dependency on single points of failure

**4. Cost Optimization**

- Route requests to the most cost-effective provider
- Use cheaper models for simpler tasks
- Implement smart caching strategies

#### Provider Types

The AI SDK supports four categories of providers:

**1. Official Providers** (14+ providers)

- Maintained by Vercel and the AI SDK team
- Full support and regular updates
- Examples: OpenAI, Anthropic, Google, Groq, Azure OpenAI, Mistral AI, Cohere, Amazon Bedrock, Together AI, Fireworks, xAI, DeepSeek, Perplexity, Replicate

**2. Community Providers** (10+ providers)

- Community-maintained integrations
- Varying levels of support
- Examples: Ollama (⚠️ maintenance issues noted), OpenRouter, Letta, Portkey, Cloudflare Workers AI

**3. OpenAI-Compatible Providers**

- Standardized API compatibility with OpenAI
- Can use the built-in `openai` provider with custom base URLs
- Examples: LM Studio, LocalAI, vLLM, custom self-hosted models

**4. Self-Hosted Providers**

- Run models directly on your infrastructure
- No external API dependencies
- Examples: Built-in AI (WebLLM), Ollama (local)

---

### 1.3 Current Provider Support

#### Currently Implemented Providers

**Google Gemini (gemini-2.5-flash)**

- ✅ **Status:** Production-ready
- ✅ **Location:** `apps/server/src/index.ts`
- ✅ **Environment Variable:** `GOOGLE_GENERATIVE_AI_API_KEY` or `GOOGLE_API_KEY`
- ✅ **Model:** `gemini-2.5-flash`
- ✅ **Use Case:** Primary provider with excellent cost-performance ratio

The current Google Gemini integration demonstrates the standard pattern that should be followed for all new providers:

```typescript
// Provider import
import { google } from '@ai-sdk/google';

// Model creation with middleware
const model = wrapLanguageModel({
  model: google('gemini-2.5-flash'),
  middleware: devToolsMiddleware(),
});

// Streaming text generation
const result = streamText({
  model,
  messages: await convertToModelMessages(uiMessages),
});
```

#### Planned Provider Support

The following providers are planned for integration based on community demand and technical requirements:

**Primary Targets:**

1. **OpenAI** (GPT-4o, GPT-4o-mini)
   - Industry-leading model quality
   - Broad ecosystem support
   - Vision and multimodal capabilities

2. **Anthropic** (Claude 3.5 Sonnet, Opus, Haiku)
   - Superior reasoning capabilities
   - Large context windows
   - Strong safety alignment

3. **Groq** (Llama 3.3, Mixtral, Gemma)
   - Ultra-low latency inference
   - Cost-effective open-source models
   - High-performance serving

4. **Ollama** (Local models)
   - Offline development and testing
   - Privacy-focused local inference
   - No API costs (compute only)

#### Provider Comparison Overview

| Provider          | Models               | Cost (Input) | Speed     | Strength                   | Use Case          |
| ----------------- | -------------------- | ------------ | --------- | -------------------------- | ----------------- |
| **Google Gemini** | gemini-2.5-flash     | ~$0.075/M    | Fast      | Multimodal, cost-effective | General purpose   |
| **OpenAI**        | gpt-4o, gpt-4o-mini  | $0.15-$15/M  | Medium    | Quality, ecosystem         | Complex tasks     |
| **Anthropic**     | claude-3-5-sonnet    | $3-$15/M     | Medium    | Reasoning, safety          | Complex reasoning |
| **Groq**          | llama-3.3-70b        | ~$0.59/M     | Very Fast | Low latency, cost          | Real-time chat    |
| **Ollama**        | Various local models | Free (local) | Variable  | Privacy, offline           | Development       |

**Note:** Prices are approximate and subject to change. See [Provider-Specific Configurations](#5-provider-specific-configurations) for detailed information.

---

### 1.4 The AI SDK Advantage

SambungChat uses **Vercel AI SDK v6.x** as the foundation for AI provider integration. This strategic choice provides significant advantages over custom integrations or direct API calls.

#### Why SambungChat Uses Vercel AI SDK

**1. Provider-Agnostic Architecture**

- Single, consistent API for all providers
- No need to learn different provider APIs
- Easy provider switching with minimal code changes
- Future-proof as new providers are added

**2. Developer Experience**

- TypeScript-first design with full type safety
- Streaming responses built-in
- Automatic message format conversion
- Comprehensive error handling
- Rich middleware ecosystem

**3. Production-Ready Features**

- Built-in retry logic and error recovery
- Request/response logging and debugging tools
- Automatic rate limiting handling
- Streaming support for real-time chat
- Model context protocol (MCP) support

**4. Community and Ecosystem**

- Active maintenance and regular updates
- 25+ provider integrations out-of-the-box
- Extensive documentation and examples
- Strong community support

#### Benefits of Provider-Agnostic Architecture

The AI SDK's provider-agnostic design means:

**Unified Message Format**

```typescript
// Same message format works for ALL providers
const messages = [{ role: 'user', content: 'Hello, AI!' }];
```

**Consistent Streaming Interface**

```typescript
// Same streaming pattern for all providers
const result = await streamText({
  model: provider('model-id'),
  messages,
});
```

**Provider Interchangeability**

```typescript
// Switch providers by changing ONE line
// const model = openai("gpt-4o");
// const model = anthropic("claude-3-5-sonnet");
// const model = google("gemini-2.5-flash");
// const model = groq("llama-3.3-70b");
```

**Frontend Independence**

- Frontend code (`@ai-sdk/svelte` Chat component) remains unchanged
- Provider switching is purely a backend concern
- No UI changes required when adding new providers

#### Key Features of AI SDK v6.x

**1. Enhanced Streaming**

- Real-time token streaming
- UI message streams
- Progressive response rendering
- Built-in backpressure handling

**2. Advanced Capabilities**

- **Tool/Function Calling:** Execute actions based on model responses
- **Agents:** Complex multi-step workflows with autonomous decision-making
- **Model Context Protocol (MCP):** Standardized context and tool integration
- **Reranking:** Improve response quality with reranking layers

**3. Developer Tools**

- **DevTools Middleware:** Detailed request/response inspection
- **Error Tracing:** Comprehensive error information
- **Performance Monitoring:** Token usage, latency tracking
- **Testing Utilities:** Mock providers for unit testing

**4. Security and Reliability**

- Input validation and sanitization
- Rate limiting and quota management
- Automatic retry with exponential backoff
- Timeout handling

---

### 1.5 Quick Start Summary

This section provides a condensed 5-minute overview of the integration process. For detailed instructions, see [Section 4: Step-by-Step Integration Guide](#4-step-by-step-integration-guide).

#### 5-Minute Integration Overview

**Step 1: Install Provider Package** (1 minute)

```bash
cd apps/server
npm install @ai-sdk/[provider-name]
# Example: npm install @ai-sdk/openai
```

**Step 2: Add Environment Variable** (1 minute)

```bash
# Add to .env or .env.local
PROVIDER_API_KEY=your_api_key_here
# Example: OPENAI_API_KEY=sk-...
```

**Step 3: Update Server Code** (2 minutes)

```typescript
// File: apps/server/src/index.ts

// 1. Import provider
import { openai } from '@ai-sdk/openai'; // Replace with your provider

// 2. Update the model creation
const model = wrapLanguageModel({
  model: openai('gpt-4o'), // Replace with your model ID
  middleware: devToolsMiddleware(),
});

// The rest of the code remains unchanged!
```

**Step 4: Test the Integration** (1 minute)

```bash
# Start the server
cd apps/server && npm run dev

# Test with curl
curl -X POST http://localhost:PORT/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello!"}]}'
```

That's it! The frontend will automatically work with the new provider.

#### Minimal Complete Example

Here's the minimal code needed to integrate a new provider (using OpenAI as an example):

**`apps/server/src/index.ts`**

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { openai } from '@ai-sdk/openai'; // 1. Import provider
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';
import type { UiMessage } from 'ai';

const app = new Hono();

app.use('/*', cors());

app.post('/ai', async (c) => {
  const { messages } = await c.req.json();

  // 2. Create model with new provider
  const model = wrapLanguageModel({
    model: openai('gpt-4o'), // Provider-specific model ID
    middleware: devToolsMiddleware(),
  });

  // 3. Generate response (no changes needed)
  const result = streamText({
    model,
    messages: await convertToModelMessages(messages as UiMessage[]),
  });

  // 4. Return stream (no changes needed)
  return result.toUIMessageStreamResponse();
});

export default app;
```

**`.env`**

```bash
# 5. Add API key to environment
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**That's everything!** No frontend changes required.

#### Links to Detailed Sections

For comprehensive coverage, refer to:

- **[Understanding the AI SDK Architecture](#2-understanding-the-ai-sdk-architecture)** - Deep dive into how the SDK works
- **[Current Implementation Analysis](#3-current-implementation-analysis)** - Walkthrough of existing Google Gemini integration
- **[Step-by-Step Integration Guide](#4-step-by-step-integration-guide)** - Complete, detailed integration instructions
- **[Provider-Specific Configurations](#5-provider-specific-configurations)** - Detailed setup for each major provider
- **[Environment Configuration](#6-environment-configuration)** - Environment variable patterns and validation
- **[Testing and Validation](#7-testing-and-validation)** - Testing procedures and validation checklists
- **[Troubleshooting and Common Issues](#8-troubleshooting-and-common-issues)** - Common problems and solutions

## [⬆ Back to Top](#table-of-contents)

---

## 2. Understanding the AI SDK Architecture

> 📍 **Navigation:** [Table of Contents](#table-of-contents) → [Section 1](#1-introduction-and-overview) → **Section 2**

> **Note:** This section will be added in Phase 3, Task 3. Please proceed to [Section 3: Current Implementation Analysis](#3-current-implementation-analysis) for detailed analysis of the existing Google Gemini integration.

---

## 3. Current Implementation Analysis

> 📍 **Navigation:** [Table of Contents](#table-of-contents) → [Section 2](#2-understanding-the-ai-sdk-architecture) → **Section 3**

This section provides a comprehensive walkthrough of SambungChat's current Google Gemini integration. Understanding this implementation is crucial before adding new providers, as it establishes the pattern that should be followed for consistency.

### 3.1 Google Gemini Integration Overview

**Current Status:** ✅ Production-ready

**Implementation Details:**

- **Provider:** Google Gemini
- **Model:** `gemini-2.5-flash`
- **Location:** `apps/server/src/index.ts`
- **Frontend:** `apps/web/src/routes/ai/+page.svelte`
- **Environment Variable:** `GOOGLE_GENERATIVE_AI_API_KEY` or `GOOGLE_API_KEY`

**Why Google Gemini?**

- Excellent cost-performance ratio (~$0.075/M input tokens)
- Fast inference speeds
- Strong multimodal capabilities
- Reliable service with good uptime
- Generous free tier for development

The Google Gemini integration serves as the reference implementation for all new AI provider integrations. It demonstrates best practices for:

- Provider package usage
- Model initialization with middleware
- Streaming text generation
- Message conversion
- Frontend integration

---

### 3.2 Server-Side Implementation

**File:** `apps/server/src/index.ts`

The server-side implementation is minimal and follows a clear pattern that can be replicated for any AI provider.

#### 3.2.1 Imports and Dependencies

```typescript
// AI SDK Provider Package
import { google } from '@ai-sdk/google';

// Core AI SDK Functions
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';

// Development Tools
import { devToolsMiddleware } from '@ai-sdk/devtools';

// Web Framework
import { Hono } from 'hono';
import { cors } from 'hono/cors';
```

**Breakdown:**

| Import                   | Source             | Purpose                                                     |
| ------------------------ | ------------------ | ----------------------------------------------------------- |
| `google`                 | `@ai-sdk/google`   | Provider-specific function to create Google model instances |
| `streamText`             | `ai`               | Generate streaming text responses                           |
| `convertToModelMessages` | `ai`               | Convert UI message format to provider-specific format       |
| `wrapLanguageModel`      | `ai`               | Add middleware capabilities to language models              |
| `devToolsMiddleware`     | `@ai-sdk/devtools` | Enable debugging and inspection tools                       |
| `Hono`                   | `hono`             | Fast web framework for Node.js/Edge                         |
| `cors`                   | `hono/cors`        | Cross-Origin Resource Sharing middleware                    |

**Key Pattern:**
Each provider exports a function (e.g., `google()`, `openai()`, `anthropic()`) that creates a language model instance. This is the only provider-specific code you'll need to change when adding new providers.

#### 3.2.2 Endpoint Configuration

```typescript
const app = new Hono();

// CORS Configuration
app.use(
  '/*',
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// AI Endpoint
app.post('/ai', async (c) => {
  const body = await c.req.json();
  const uiMessages = body.messages || [];

  // Model creation and streaming (see 3.2.3 and 3.2.4)
  const model = wrapLanguageModel({
    model: google('gemini-2.5-flash'),
    middleware: devToolsMiddleware(),
  });

  const result = streamText({
    model,
    messages: await convertToModelMessages(uiMessages),
  });

  return result.toUIMessageStreamResponse();
});
```

**Endpoint Analysis:**

**Route:** `POST /ai`

**Request Body:**

```typescript
{
  "messages": [
    {
      "role": "user" | "assistant" | "system",
      "content": string | Array<ContentPart>
    }
  ]
}
```

**Response:** Server-Sent Events (SSE) stream with UI message format

**Flow:**

1. Parse JSON request body
2. Extract `messages` array (default to empty array if not provided)
3. Create model instance with middleware
4. Generate streaming response
5. Return UI message stream for frontend consumption

**Security Considerations:**

- CORS is configured to only allow requests from `env.CORS_ORIGIN`
- API key is never exposed to the client (server-side only)
- Input validation through TypeScript types and Zod schemas (in `packages/env`)

#### 3.2.3 Model Creation Pattern

```typescript
const model = wrapLanguageModel({
  model: google('gemini-2.5-flash'),
  middleware: devToolsMiddleware(),
});
```

**Pattern Breakdown:**

**1. Provider Function Call**

```typescript
google('gemini-2.5-flash');
```

- **Function:** `google()` from `@ai-sdk/google`
- **Parameter:** Model ID string (`"gemini-2.5-flash"`)
- **Returns:** Language model instance configured for Google Gemini

**Available Google Models:**

- `gemini-2.5-flash` - Fast, cost-effective (current choice)
- `gemini-2.5-flash-thinking` - With thinking mode
- `gemini-2.0-flash-exp` - Experimental version
- `gemini-pro` - More capable, slower
- `gemini-1.5-pro` - Previous generation

**2. Model Wrapping**

```typescript
wrapLanguageModel({ model, middleware });
```

- **Purpose:** Add middleware capabilities to the language model
- **Benefits:**
  - Enables debugging tools
  - Allows custom middleware injection
  - Maintains provider-agnostic interface
  - Supports future extensibility

**3. DevTools Middleware**

```typescript
devToolsMiddleware();
```

- **Purpose:** Enable AI SDK DevTools for debugging
- **Features:**
  - Request/response inspection
  - Token usage tracking
  - Performance metrics
  - Error tracing

**Why This Pattern?**

| Benefit           | Description                                   |
| ----------------- | --------------------------------------------- |
| **Consistency**   | Same pattern works for all providers          |
| **Debugging**     | DevTools middleware essential for development |
| **Extensibility** | Easy to add custom middleware later           |
| **Type Safety**   | Full TypeScript support throughout            |

#### 3.2.4 Streaming Implementation

```typescript
const result = streamText({
  model,
  messages: await convertToModelMessages(uiMessages),
});

return result.toUIMessageStreamResponse();
```

**Streaming Breakdown:**

**1. Message Conversion**

```typescript
await convertToModelMessages(uiMessages);
```

- **Input:** Array of UI messages from frontend
- **Output:** Array of provider-specific model messages
- **Purpose:** Transform frontend message format to backend format
- **Automatic:** Handles different message structures per provider

**UI Message Format (Frontend → Backend):**

```typescript
interface UiMessage {
  role: 'user' | 'assistant' | 'system';
  content:
    | string
    | Array<{
        type: 'text' | 'image' | 'tool-call' | 'tool-result';
        [key: string]: any;
      }>;
}
```

**Model Message Format (Backend → Provider):**

- Provider-specific format
- Automatically generated by `convertToModelMessages()`
- Optimized for each provider's API

**2. Streaming Text Generation**

```typescript
const result = streamText({
  model,
  messages, // Converted messages
});
```

- **Function:** `streamText()` from AI SDK
- **Returns:** StreamResult object with multiple methods
- **Async:** Generates tokens in real-time

**StreamResult Methods:**

- `textStream` - Async iterable of text chunks
- `fullStream` - Complete stream with metadata
- `toUIMessageStreamResponse()` - HTTP Response for frontend
- `toDataStreamResponse()` - Lower-level data stream

**3. UI Message Stream Response**

```typescript
return result.toUIMessageStreamResponse();
```

- **Returns:** HTTP Response with Server-Sent Events (SSE)
- **Format:** UI message format compatible with frontend
- **Real-time:** Streams tokens as they're generated
- **Automatic:** Handles all streaming complexity

**Response Format:**

```
data: {"type":"text-delta","delta":"Hello"}
data: {"type":"text-delta","delta":" there"}
data: {"type":"text-delta","delta":"!"}
data: [DONE]
```

**Why Streaming?**

| Advantage             | Description                                |
| --------------------- | ------------------------------------------ |
| **User Experience**   | Real-time response generation feels faster |
| **Perceived Latency** | Time to first token (TTFT) is much lower   |
| **Cost Feedback**     | Users can stop generation if unsatisfied   |
| **Large Outputs**     | No waiting for complete responses          |
| **Natural Chat**      | Mimics human conversation patterns         |

---

### 3.3 Frontend Implementation

**File:** `apps/web/src/routes/ai/+page.svelte`

The frontend implementation is **provider-agnostic**, meaning it works with any AI provider without changes. This is one of the key benefits of using the AI SDK.

#### 3.3.1 Chat Component Setup

```typescript
import { Chat } from '@ai-sdk/svelte';
import { DefaultChatTransport } from 'ai';

// Initialize Chat with transport
const chat = new Chat({
  transport: new DefaultChatTransport({
    api: `${PUBLIC_SERVER_URL}/ai`,
  }),
});
```

**Component Breakdown:**

**1. Chat Component**

- **Source:** `@ai-sdk/svelte`
- **Purpose:** Pre-built chat UI component
- **Features:**
  - Message management
  - Automatic streaming handling
  - Typing indicators
  - Error handling
  - Reactive state management

**2. Transport Layer**

- **Class:** `DefaultChatTransport`
- **Purpose:** Communicate with server `/ai` endpoint
- **Features:**
  - Automatic message formatting
  - Stream handling
  - Error recovery
  - Retry logic

**3. API Endpoint**

```typescript
api: `${PUBLIC_SERVER_URL}/ai`;
```

- **Environment Variable:** `PUBLIC_SERVER_URL`
- **Route:** `/ai` (server endpoint)
- **Protocol:** POST with Server-Sent Events (SSE)

**Provider Agnostic Design:**

The frontend doesn't know or care which AI provider is being used:

- ✅ No provider-specific imports
- ✅ No model configuration
- ✅ No API key handling
- ✅ Same interface for all providers

This means you can **change providers on the server without touching frontend code**.

#### 3.3.2 Message Handling and UI

```typescript
// Send message
function handleSubmit(e: Event) {
  e.preventDefault();
  const text = input.trim();
  if (!text) return;
  chat.sendMessage({ text });
  input = '';
}

// Access messages
chat.messages; // Reactive array of messages
```

**Message Structure:**

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: Array<{
    type: 'text' | 'image' | 'tool-call' | 'tool-result';
    text?: string;
    [key: string]: any;
  }>;
  createdAt?: Date;
}
```

**UI Rendering (Svelte):**

```svelte
{#each chat.messages as message (message.id)}
  <div class:message-user={message.role === 'user'}>
    {#each message.parts as part}
      {#if part.type === 'text'}
        {part.text}
      {/if}
    {/each}
  </div>
{/each}
```

**Key Features:**

1. **Automatic Streaming**
   - Messages appear in real-time as tokens are generated
   - No manual stream handling required
   - Automatic scrolling to latest message

2. **Reactive State**
   - `chat.messages` is a Svelte 5 `$state` rune
   - UI updates automatically when messages change
   - No manual state management needed

3. **Error Handling**
   - Automatic retry on failure
   - Error messages displayed in UI
   - Graceful degradation

4. **Type Safety**
   - Full TypeScript support
   - Message parts are typed
   - Compile-time error checking

**Why This Design?**

| Benefit                   | Description                           |
| ------------------------- | ------------------------------------- |
| **Zero Provider Lock-in** | Frontend works with any provider      |
| **Minimal Code**          | ~100 lines for full chat UI           |
| **Type Safe**             | Full TypeScript support               |
| **Reactive**              | Automatic updates with Svelte 5 runes |
| **Maintainable**          | Clean separation of concerns          |

---

### 3.4 Environment Configuration

**Current State:** ⚠️ No AI provider variables in environment schema yet

**File:** `packages/env/src/server.ts`

**Current Environment Schema:**

```typescript
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // ⚠️ No AI provider variables configured yet
  },
});
```

**Current Environment Variables:**

The Google API key is automatically loaded by the AI SDK from one of these environment variables:

1. **Primary:** `GOOGLE_GENERATIVE_AI_API_KEY`
2. **Alternative:** `GOOGLE_API_KEY`

The AI SDK automatically checks for these variables in the environment, so even though they're not in the Zod schema, they still work.

**⚠️ Gap Identified:**

For production use, the environment schema should be updated to:

- Validate AI provider API keys
- Support multiple providers
- Implement provider selection logic
- Add configuration validation

**Planned Update (Phase 5):**

```typescript
export const env = createEnv({
  server: {
    // Existing variables...
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // AI Provider Configuration
    AI_PROVIDER: z.enum(['openai', 'anthropic', 'google', 'groq']).optional(),

    // API Keys (at least one required)
    OPENAI_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
    GROQ_API_KEY: z.string().min(1).optional(),
  },
});
```

**For Now:**

When adding a new provider, you need to:

1. Add the environment variable to `.env` or `.env.local`
2. The AI SDK will automatically pick it up
3. No schema validation yet (will be added in Phase 5)

**Example `.env.local` for Google Gemini:**

```bash
# AI Provider Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
# Alternative: GOOGLE_API_KEY=your_google_api_key_here
```

---

### 3.5 Key Takeaways for New Providers

Based on the current Google Gemini implementation, here are the key patterns and principles to follow when adding new AI providers:

#### Pattern Consistency

**✅ Always Follow This Pattern:**

```typescript
// 1. Import provider
import { [provider] } from "@ai-sdk/[provider]";

// 2. Import AI SDK functions (same for all providers)
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";

// 3. Create model with middleware
const model = wrapLanguageModel({
  model: [provider]("[model-id]"),
  middleware: devToolsMiddleware(),
});

// 4. Generate streaming response
const result = streamText({
  model,
  messages: await convertToModelMessages(uiMessages),
});

// 5. Return UI message stream
return result.toUIMessageStreamResponse();
```

**What Changes:**

- Provider import (line 1)
- Provider function call (line 9)
- Model ID (line 9)
- Environment variable name

**What Stays the Same:**

- `wrapLanguageModel()` pattern
- `devToolsMiddleware()` usage
- `streamText()` implementation
- `convertToModelMessages()` call
- `toUIMessageStreamResponse()` return

#### Frontend Independence

**✅ Zero Frontend Changes Required**

When adding a new provider:

- ❌ Don't touch `apps/web/src/routes/ai/+page.svelte`
- ❌ Don't modify `Chat` component
- ❌ Don't change transport configuration
- ✅ Only update server code in `apps/server/src/index.ts`

The frontend is completely provider-agnostic due to the AI SDK's architecture.

#### Server Changes Are Isolated

**✅ Changes Limited to Endpoint Implementation**

When adding a new provider, you only need to modify:

- Import statements (add provider import)
- Model creation (use provider function instead of `google()`)
- Environment variable (add API key to `.env`)

Everything else in the server remains unchanged.

#### Middleware is Essential

**✅ Always Use `wrapLanguageModel()`**

Don't skip the middleware wrapper:

- Enables DevTools for debugging
- Allows future custom middleware
- Maintains consistency
- Best practice recommended by AI SDK

#### Environment Variables

**✅ Follow Provider-Specific Patterns**

Each provider has its own environment variable name:

- OpenAI: `OPENAI_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`
- Google: `GOOGLE_GENERATIVE_AI_API_KEY` or `GOOGLE_API_KEY`
- Groq: `GROQ_API_KEY`

Check the provider documentation for the exact variable name.

#### Testing Strategy

**✅ Test incrementally:**

1. **Unit Test:** Verify model creation

   ```typescript
   const model = wrapLanguageModel({
     model: openai('gpt-4o-mini'),
     middleware: devToolsMiddleware(),
   });
   console.log('Model created successfully');
   ```

2. **Integration Test:** Test `/ai` endpoint with curl

   ```bash
   curl -X POST http://localhost:PORT/ai \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Hello"}]}'
   ```

3. **Frontend Test:** Open chat UI and send a message
   - Verify streaming works
   - Check for errors in browser console
   - Confirm message appears in real-time

#### Error Handling

**✅ The AI SDK handles most errors automatically:**

- Invalid API keys → Authentication error (401)
- Rate limits → Rate limit error (429)
- Network issues → Timeout error
- Invalid model ID → Model not found error

For production, add custom error handling:

```typescript
app.post('/ai', async (c) => {
  try {
    const body = await c.req.json();
    const uiMessages = body.messages || [];

    const model = wrapLanguageModel({
      model: google('gemini-2.5-flash'),
      middleware: devToolsMiddleware(),
    });

    const result = streamText({
      model,
      messages: await convertToModelMessages(uiMessages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('AI provider error:', error);
    return c.json({ error: 'AI service temporarily unavailable' }, 503);
  }
});
```

#### Checklist for New Providers

When adding a new provider, ensure you:

- [ ] Install provider package (`bun add @ai-sdk/[provider]`)
- [ ] Import provider function
- [ ] Add environment variable for API key
- [ ] Update model creation to use provider function
- [ ] Use correct model ID for provider
- [ ] Keep `wrapLanguageModel()` pattern
- [ ] Keep `devToolsMiddleware()` usage
- [ ] Test with curl command
- [ ] Test with frontend chat UI
- [ ] Verify streaming works correctly
- [ ] Check for errors in browser console
- [ ] Verify no frontend changes needed
- [ ] Document the integration

---

### 3.6 Summary

The current Google Gemini implementation demonstrates a clean, maintainable pattern for AI provider integration:

**Strengths:**

- ✅ Minimal code (~10 lines for endpoint)
- ✅ Consistent pattern across providers
- ✅ Full streaming support
- ✅ Type-safe with TypeScript
- ✅ Provider-agnostic frontend
- ✅ Development tools integration

**Key Pattern:**

```typescript
// This 4-line pattern is all you need to change providers
const model = wrapLanguageModel({
  model: [provider]('[model-id]'),
  middleware: devToolsMiddleware(),
});
```

**Next Steps:**

- Proceed to [Section 4: Step-by-Step Integration Guide](#4-step-by-step-integration-guide) for detailed instructions on adding new providers
- See [Section 5: Provider-Specific Configurations](#5-provider-specific-configurations) for setup details for each major provider

[⬆ Back to Top](#table-of-contents)

---

## 4. Step-by-Step Integration Guide

> 📍 **Navigation:** [Table of Contents](#table-of-contents) → [Section 3](#3-current-implementation-analysis) → **Section 4**

This section provides detailed, step-by-step instructions for integrating a new AI provider into SambungChat. Each step includes code examples, explanations, and best practices to ensure a successful integration.

### 4.1 Overview of Integration Process

Adding a new AI provider to SambungChat follows a consistent, well-defined process. The entire integration typically takes **15-30 minutes** for a basic setup.

#### High-Level Workflow

```
1. Research & Preparation (5 min)
   ↓
2. Environment Configuration (3 min)
   ↓
3. Server Implementation (5 min)
   ↓
4. Testing (5 min)
   ↓
5. Deployment & Monitoring (ongoing)
```

#### Estimated Time Breakdown

| Step | Task                      | Time         | Complexity |
| ---- | ------------------------- | ------------ | ---------- |
| 4.2  | Research and preparation  | 5 minutes    | Low        |
| 4.3  | Environment configuration | 3 minutes    | Low        |
| 4.4  | Server implementation     | 5 minutes    | Low        |
| 4.5  | Testing                   | 5-10 minutes | Medium     |
| 4.6  | Deployment and monitoring | Ongoing      | Medium     |

**Total Initial Setup:** ~18-30 minutes

#### Dependencies Between Steps

- **Step 4.2** must be completed before **Step 4.3** (need API key before configuration)
- **Step 4.3** must be completed before **Step 4.4** (need environment variables before server code)
- **Step 4.4** must be completed before **Step 4.5** (need implementation before testing)
- **Step 4.5** must be completed before **Step 4.6** (need passing tests before deployment)

---

### 4.2 Step 1: Research and Preparation

Before writing any code, gather the necessary information about your chosen AI provider.

#### 4.2.1 Choose Your Provider

Select the AI provider that best fits your use case. Consider the following criteria:

**Provider Selection Criteria:**

| Criteria         | Questions to Ask                                                    | Importance |
| ---------------- | ------------------------------------------------------------------- | ---------- |
| **Cost**         | What's the price per 1M tokens? Are there free tiers?               | High       |
| **Performance**  | What's the latency (time to first token)? Throughput?               | High       |
| **Quality**      | How good are the model's responses? Benchmarks?                     | High       |
| **Use Case**     | Does the model specialize in your use case (code, reasoning, chat)? | High       |
| **Reliability**  | What's the uptime? SLA guarantees?                                  | Medium     |
| **Ecosystem**    | Is there good documentation? Community support?                     | Medium     |
| **Data Privacy** | Where are the servers? Data retention policies?                     | Medium     |

**Quick Provider Comparison:**

| Provider      | Best For                           | Cost (Input) | Speed     | Quality    |
| ------------- | ---------------------------------- | ------------ | --------- | ---------- |
| **OpenAI**    | General-purpose, complex tasks     | $0.15-$15/M  | Medium    | ⭐⭐⭐⭐⭐ |
| **Anthropic** | Complex reasoning, safety-critical | $3-$15/M     | Medium    | ⭐⭐⭐⭐⭐ |
| **Google**    | Cost-effective, multimodal         | ~$0.075/M    | Fast      | ⭐⭐⭐⭐   |
| **Groq**      | Real-time chat, low latency        | ~$0.59/M     | Very Fast | ⭐⭐⭐⭐   |
| **Ollama**    | Offline development, privacy       | Free (local) | Variable  | ⭐⭐⭐     |

**Decision Framework:**

```
If you need...                    Choose...
─────────────────────────────────────────────────────────────
Highest quality, any cost         → OpenAI (gpt-4o) or Anthropic (claude-3-5-sonnet)
Best cost-performance ratio       → Google (gemini-2.5-flash)
Fastest response time             → Groq (llama-3.3-70b)
Offline/local development         → Ollama
Complex reasoning                 → Anthropic (claude-3-5-sonnet)
Code generation                   → OpenAI (gpt-4o) or Anthropic (claude-3-5-sonnet)
Multimodal (vision, audio)        → OpenAI (gpt-4o) or Google (gemini-2.5-flash)
```

#### 4.2.2 Gather Required Information

Once you've chosen a provider, collect the following information:

**Essential Information:**

1. **Provider Package Name**
   - Official providers follow the pattern: `@ai-sdk/[provider]`
   - Example: `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/groq`
   - Find it in the [AI SDK providers documentation](https://ai-sdk.dev/providers/ai-sdk-providers)

2. **API Key**
   - How to obtain: Provider's developer console/dashboard
   - Required format: Usually starts with a prefix (e.g., `sk-` for OpenAI)
   - Permissions needed: At minimum, API access for chat models

3. **Model IDs**
   - Available models for the provider
   - Model IDs to use in code (e.g., `gpt-4o-mini`, `claude-3-5-sonnet`)
   - Model capabilities and limitations

4. **Environment Variable Name**
   - The exact environment variable name expected by the provider
   - Examples: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`
   - Some providers support alternative variable names

5. **Rate Limits and Quotas**
   - Requests per minute (RPM) or tokens per minute (TPM)
   - Daily or monthly quotas
   - Consequences of exceeding limits

6. **Pricing Information**
   - Cost per 1M input tokens
   - Cost per 1M output tokens
   - Any additional fees (e.g., for images, special features)

**Information Sources:**

- **Official Provider Documentation:** Most authoritative source
- **AI SDK Provider Documentation:** Integration-specific guidance
- **Provider Pricing Page:** Current pricing and tiers
- **Provider Status Page:** Uptime and known issues

**Example: Gathering Information for OpenAI**

| Information          | Value                                 | Source           |
| -------------------- | ------------------------------------- | ---------------- |
| Package Name         | `@ai-sdk/openai`                      | AI SDK docs      |
| API Key Prefix       | `sk-`                                 | OpenAI dashboard |
| Model IDs            | `gpt-4o`, `gpt-4o-mini`, `o1-preview` | OpenAI docs      |
| Environment Variable | `OPENAI_API_KEY`                      | AI SDK docs      |
| Rate Limits          | 10,000 TPM (Tier 1)                   | OpenAI docs      |
| Pricing              | $2.50/M input (gpt-4o-mini)           | OpenAI pricing   |
| Documentation        | https://platform.openai.com/docs      | OpenAI           |

#### 4.2.3 Install Provider Package

Once you've gathered the necessary information, install the provider package.

**Installation Command:**

```bash
# Navigate to the server directory
cd apps/server

# Install the provider package (replace with your chosen provider)
bun add @ai-sdk/[provider-name]

# Example for OpenAI:
bun add @ai-sdk/openai

# Example for Anthropic:
bun add @ai-sdk/anthropic

# Example for Groq:
bun add @ai-sdk/groq
```

**Verify Installation:**

Check that the package was added to `apps/server/package.json`:

```json
{
  "dependencies": {
    "@ai-sdk/google": "^3.0.1",
    "@ai-sdk/openai": "^1.0.0", // ← Your new provider
    "ai": "catalog:"
    // ... other dependencies
  }
}
```

**Verify Package Version:**

```bash
# Check installed version
bun pm ls | grep @ai-sdk/openai

# Expected output:
# @ai-sdk/openai@x.x.x
```

**Troubleshooting Installation Issues:**

| Issue             | Solution                                         |
| ----------------- | ------------------------------------------------ |
| Package not found | Verify package name: `@ai-sdk/[provider]`        |
| Version conflicts | Check AI SDK compatibility: `ai` package version |
| Network error     | Try again or check internet connection           |
| Permission denied | Run with appropriate permissions                 |

---

### 4.3 Step 2: Configure Environment Variables

Environment variables are used to securely store API keys and configuration. This step ensures your provider's credentials are available to the application.

#### 4.3.1 Identify Required Variables

Each provider requires specific environment variables. Most commonly, this is just an API key.

**Standard Pattern:**

```
[PROVIDER]_API_KEY
```

**Examples:**

- OpenAI: `OPENAI_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`
- Google: `GOOGLE_GENERATIVE_AI_API_KEY` or `GOOGLE_API_KEY`
- Groq: `GROQ_API_KEY`

**Optional Variables:**

Some providers support additional configuration:

- **Base URL:** `[PROVIDER]_BASE_URL` (for custom endpoints)
- **Organization:** `[PROVIDER]_ORGANIZATION` (for multi-tenant accounts)
- **Region:** `[PROVIDER]_REGION` (for regional deployments)
- **API Version:** `[PROVIDER]_API_VERSION` (for versioned APIs)

**Example: OpenAI Environment Variables**

```bash
# Required
OPENAI_API_KEY=sk-proj-abc123...

# Optional (for custom deployments)
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_ORGANIZATION=org-abc123...
```

**Tip:** Consult the provider's documentation for the complete list of supported environment variables.

#### 4.3.2 Add to Environment Schema

✅ **Note:** The environment schema has been updated in Phase 5 to include AI provider variables. See [Section 6: Environment Configuration](#6-environment-configuration) for complete details on the updated schema with support for OpenAI, Anthropic, Google, Groq, and Ollama providers.

For reference, the AI SDK automatically reads environment variables, so the schema primarily provides validation. The current schema includes comprehensive provider configuration with fallback chain support.

**Current Implementation (Phase 5 - Complete):**

```typescript
// packages/env/src/server.ts
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // AI Provider Configuration (Phase 5)
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    OLLAMA_BASE_URL: z.string().optional(),

    // Provider selection (optional)
    AI_PROVIDER: z.string().optional(),
    AI_FALLBACK_PROVIDERS: z.string().optional(),

    // Model defaults (optional)
    OPENAI_MODEL: z.string().optional(),
    ANTHROPIC_MODEL: z.string().optional(),
    GOOGLE_MODEL: z.string().optional(),
    GROQ_MODEL: z.string().optional(),
    OLLAMA_MODEL: z.string().optional(),
  },
});

// Validation ensures at least one provider is configured
```

See [Section 6: Environment Configuration](#6-environment-configuration) for the complete environment schema implementation, including validation patterns and fallback chain support.

Proceed to Step 4.3.3 to add variables directly to your `.env` files.

#### 4.3.3 Update .env Files

Add your provider's environment variables to the appropriate environment files.

**For Local Development:**

Create or update `.env.local` in the project root:

```bash
# .env.local (do not commit to version control)

# AI Provider: OpenAI (replace with your chosen provider)
OPENAI_API_KEY=sk-proj-your_actual_api_key_here

# If using Anthropic:
# ANTHROPIC_API_KEY=sk-ant-your_actual_api_key_here

# If using Groq:
# GROQ_API_KEY=gsk-your_actual_api_key_here
```

**For Documentation:**

Update `.env.example` to show the expected format (without actual keys):

```bash
# .env.example (safe to commit)

# AI Provider Configuration
# Choose one or more providers to enable

# OpenAI (https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-your_openai_api_key_here

# Anthropic (https://console.anthropic.com/settings/keys)
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here

# Google Gemini (https://makersuite.google.com/app/apikey)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
# Alternative: GOOGLE_API_KEY=your_google_api_key_here

# Groq (https://console.groq.com/keys)
GROQ_API_KEY=gsk-your_groq_api_key_here
```

**Environment File Best Practices:**

| Practice                               | Description              | Example                             |
| -------------------------------------- | ------------------------ | ----------------------------------- |
| **Never commit .env.local**            | Contains actual secrets  | Add to `.gitignore`                 |
| **Commit .env.example**                | Shows required variables | Use placeholder values              |
| **Use different keys per environment** | Dev, staging, production | `OPENAI_DEV_KEY`, `OPENAI_PROD_KEY` |
| **Document key source**                | Where to obtain the key  | Add comments with URLs              |
| **Group related variables**            | Easier to read           | Separate sections with comments     |

**Verify Environment Variable:**

Test that the environment variable is accessible:

```bash
# In your terminal, from the project root
echo $OPENAI_API_KEY

# Or test with Node.js
node -e "console.log(process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set')"
```

---

### 4.4 Step 3: Update Server Implementation

With the provider package installed and environment variables configured, update the server code to integrate the new provider.

#### 4.4.1 Import Provider

**File:** `apps/server/src/index.ts`

Add the provider import at the top of the file:

```typescript
// Existing imports...
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';

// Existing provider import
import { google } from '@ai-sdk/google';

// ⭐ ADD YOUR NEW PROVIDER IMPORT HERE
import { openai } from '@ai-sdk/openai'; // Replace with your provider
```

**Import Pattern:**

```typescript
// General pattern:
import { [provider-name] } from "@ai-sdk/[provider-package]";

// Examples:
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { groq } from "@ai-sdk/groq";
```

**Full Import Section Example:**

```typescript
// apps/server/src/index.ts

// Web Framework
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Environment Configuration
import { env } from '@sambungchat/env';

// AI SDK - Core Functions
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';
import type { UiMessage } from 'ai';

// AI SDK - Development Tools
import { devToolsMiddleware } from '@ai-sdk/devtools';

// AI SDK - Providers
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai'; // ← New provider import
// import { anthropic } from "@ai-sdk/anthropic";  // Future providers
// import { groq } from "@ai-sdk/groq";  // Future providers
```

#### 4.4.2 Create Model Instance

Update the model creation in the `/ai` endpoint to use your new provider.

**Current Code (Google Gemini):**

```typescript
app.post('/ai', async (c) => {
  const { messages } = await c.req.json();

  // Current provider: Google Gemini
  const model = wrapLanguageModel({
    model: google('gemini-2.5-flash'),
    middleware: devToolsMiddleware(),
  });

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

**Updated Code (OpenAI Example):**

```typescript
app.post('/ai', async (c) => {
  const { messages } = await c.req.json();

  // ⭐ NEW PROVIDER: OpenAI
  const model = wrapLanguageModel({
    model: openai('gpt-4o-mini'), // ← Change: Provider and model ID
    middleware: devToolsMiddleware(),
  });

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

> **Note:** `convertToModelMessages` and `convertToCoreMessages` are interchangeable aliases in the AI SDK. Both perform the same function of converting UI messages to provider-specific format. This guide uses `convertToModelMessages` for consistency, but you may see `convertToCoreMessages` in other examples - they are equivalent.

````

**Pattern for Any Provider:**

```typescript
// Only ONE line changes:
const model = wrapLanguageModel({
  model: [provider-function]("[model-id]"),
  middleware: devToolsMiddleware(),
});
````

**Best Practice: Use Environment Variables for Model IDs**

Instead of hardcoding model IDs, use environment variables for flexibility:

```typescript
const model = wrapLanguageModel({
  model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
  middleware: devToolsMiddleware(),
});
```

**Benefits:**

- ✅ Easy model switching without code changes
- ✅ Different models for development/production
- ✅ A/B testing different models
- ✅ Quick fallback to newer models

The environment schema (Phase 5) includes optional `*_MODEL` variables for all providers:

- `OPENAI_MODEL` (default: "gpt-4o-mini")
- `ANTHROPIC_MODEL` (default: "claude-3-5-sonnet-20241022")
- `GOOGLE_MODEL` (default: "gemini-2.5-flash")
- `GROQ_MODEL` (default: "llama-3.3-70b-versatile")
- `OLLAMA_MODEL` (default: "llama3.2")

**Examples for Different Providers:**

```typescript
// OpenAI
const model = wrapLanguageModel({
  model: openai('gpt-4o-mini'),
  middleware: devToolsMiddleware(),
});

// Anthropic
const model = wrapLanguageModel({
  model: anthropic('claude-3-5-sonnet-20241022'),
  middleware: devToolsMiddleware(),
});

// Groq
const model = wrapLanguageModel({
  model: groq('llama-3.3-70b-versatile'),
  middleware: devToolsMiddleware(),
});
```

#### 4.4.3 Integration Options

There are three approaches to integrating your new provider, depending on your requirements.

**Option A: Replace Current Provider** (Simplest)

Replace the existing Google Gemini with your new provider:

```typescript
// Before
import { google } from '@ai-sdk/google';

const model = wrapLanguageModel({
  model: google('gemini-2.5-flash'),
  middleware: devToolsMiddleware(),
});

// After
import { openai } from '@ai-sdk/openai';

const model = wrapLanguageModel({
  model: openai('gpt-4o-mini'),
  middleware: devToolsMiddleware(),
});
```

**Pros:**

- ✅ Simplest change (1 line of code)
- ✅ No endpoint changes
- ✅ Frontend remains unchanged

**Cons:**

- ❌ Loses Google Gemini support
- ❌ Single point of failure

**Best For:**

- Testing a new provider
- Switching providers completely
- Simple use cases

---

**Option B: Support Multiple Providers** (Recommended)

Implement dynamic provider selection based on environment configuration:

```typescript
// apps/server/src/index.ts

// Import all providers
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { groq } from '@ai-sdk/groq';

// Provider selection function
function getModel() {
  const provider = process.env.AI_PROVIDER || 'google';

  switch (provider) {
    case 'openai':
      return wrapLanguageModel({
        model: openai('gpt-4o-mini'),
        middleware: devToolsMiddleware(),
      });

    case 'anthropic':
      return wrapLanguageModel({
        model: anthropic('claude-3-5-sonnet-20241022'),
        middleware: devToolsMiddleware(),
      });

    case 'groq':
      return wrapLanguageModel({
        model: groq('llama-3.3-70b-versatile'),
        middleware: devToolsMiddleware(),
      });

    case 'google':
    default:
      return wrapLanguageModel({
        model: google('gemini-2.5-flash'),
        middleware: devToolsMiddleware(),
      });
  }
}

app.post('/ai', async (c) => {
  const { messages } = await c.req.json();

  // Dynamic model selection
  const model = getModel();

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

**Environment Configuration:**

```bash
# .env.local
AI_PROVIDER=openai  # Options: openai, anthropic, google, groq
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
GROQ_API_KEY=gsk-...
```

**Pros:**

- ✅ Support multiple providers simultaneously
- ✅ Easy switching via environment variable
- ✅ Can implement fallback logic
- ✅ No frontend changes needed

**Cons:**

- ❌ More complex code
- ❌ Need to manage multiple API keys

**Best For:**

- Production deployments
- Provider redundancy and fallback
- Cost optimization (switch based on usage)

---

**Option C: Separate Endpoints** (Advanced)

Create separate endpoints for each provider:

```typescript
// apps/server/src/index.ts

// Google Gemini endpoint (existing)
app.post('/ai', async (c) => {
  const { messages } = await c.req.json();

  const model = wrapLanguageModel({
    model: google('gemini-2.5-flash'),
    middleware: devToolsMiddleware(),
  });

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});

// OpenAI endpoint (new)
app.post('/ai/openai', async (c) => {
  const { messages } = await c.req.json();

  const model = wrapLanguageModel({
    model: openai('gpt-4o-mini'),
    middleware: devToolsMiddleware(),
  });

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});

// Anthropic endpoint (new)
app.post('/ai/anthropic', async (c) => {
  const { messages } = await c.req.json();

  const model = wrapLanguageModel({
    model: anthropic('claude-3-5-sonnet-20241022'),
    middleware: devToolsMiddleware(),
  });

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

**Frontend Configuration:**

```typescript
// apps/web/src/routes/ai/+page.svelte

// Choose endpoint based on user preference
const chat = new Chat({
  transport: new DefaultChatTransport({
    api: `${PUBLIC_SERVER_URL}/ai/openai`, // or /ai/anthropic, etc.
  }),
});
```

**Pros:**

- ✅ Maximum flexibility
- ✅ Can use multiple providers simultaneously
- ✅ Easy to compare providers
- ✅ Provider-specific customization

**Cons:**

- ❌ Requires frontend changes to select endpoint
- ❌ More code to maintain
- ❌ Potential confusion for users

**Best For:**

- A/B testing different providers
- Provider comparison tools
- Advanced use cases

**Recommendation:**

For most use cases, **Option B (Support Multiple Providers)** is recommended. It provides flexibility without frontend changes and allows easy provider switching.

---

### 4.5 Step 4: Test the Integration

Testing ensures your new provider integration works correctly before deploying to production.

#### 4.5.1 Manual Testing

**Test 1: Verify Server Starts**

```bash
# Navigate to server directory
cd apps/server

# Start development server
bun run dev

# Expected output:
# ✅ Server running on http://localhost:PORT
# No errors about missing API keys or imports
```

**If you see errors:**

- `Cannot find module '@ai-sdk/[provider]'` → Provider not installed (Step 4.2.3)
- `API key not found` → Environment variable not set (Step 4.3.3)
- `Invalid API key` → Incorrect or expired API key

---

**Test 2: Test Endpoint with curl**

```bash
# Test the /ai endpoint with a simple message
curl -X POST http://localhost:5173/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hello! Can you hear me?"
      }
    ]
  }'

# Expected response: Streaming text with provider's response
# data: {"type":"text-delta","delta":"Hello"}
# data: {"type":"text-delta","delta":"!"}
# data: [DONE]
```

**What to Check:**

- ✅ Response starts immediately (no long delays)
- ✅ Text streams token-by-token
- ✅ Response is coherent
- ✅ No error messages in stream

**Common Issues:**

| Error                       | Cause               | Solution                   |
| --------------------------- | ------------------- | -------------------------- |
| `401 Unauthorized`          | Invalid API key     | Check environment variable |
| `429 Too Many Requests`     | Rate limit exceeded | Wait or upgrade quota      |
| `500 Internal Server Error` | Code error          | Check server logs          |
| `Model not found`           | Wrong model ID      | Verify model name          |
| No response                 | Timeout/CORS        | Check network settings     |

---

**Test 3: Test with Frontend Chat UI**

```bash
# Start the web application
cd apps/web
bun run dev

# Navigate to chat UI in browser
open http://localhost:5174/ai
```

**Testing Checklist:**

- [ ] Chat interface loads
- [ ] Send a message: "Hello, can you introduce yourself?"
- [ ] Verify response appears in real-time (streaming)
- [ ] Check browser console for errors (F12 → Console)
- [ ] Verify response quality matches provider's capabilities
- [ ] Send a follow-up message to test conversation context
- [ ] Test with empty message (should handle gracefully)
- [ ] Test with very long message (test streaming)

**Expected Behavior:**

```
User: Hello, can you introduce yourself?
Assistant: [Streams in] "Hello! I'm an AI assistant powered by [Provider]. I'm here to help you with..."
```

**Browser Console Check:**

Press F12 and check the Console tab:

- ✅ No red error messages
- ✅ Network tab shows successful `/ai` request
- ✅ EventSource connection remains open
- ✅ Messages appear in chat.messages array

---

**Test 4: Test Error Handling**

Test how the integration handles errors:

```bash
# Test with invalid API key
export OPENAI_API_KEY=invalid
curl -X POST http://localhost:5173/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Test"}]}'

# Expected: Graceful error message, not crash
```

**Verify:**

- ✅ Server doesn't crash
- ✅ Error message is user-friendly
- ✅ Error is logged for debugging
- ✅ Frontend shows error notification

#### 4.5.2 Automated Testing

While manual testing is essential, automated tests provide confidence for future changes.

**Unit Test Example:**

```typescript
// tests/unit/providers.test.ts

import { describe, it, expect } from 'bun:test';
import { openai } from '@ai-sdk/openai';
import { wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';

describe('OpenAI Provider', () => {
  it('should create model instance', () => {
    const model = wrapLanguageModel({
      model: openai('gpt-4o-mini'),
      middleware: devToolsMiddleware(),
    });

    expect(model).toBeDefined();
    expect(model.provider).toBe('openai');
  });

  it('should have correct model ID', () => {
    const model = wrapLanguageModel({
      model: openai('gpt-4o-mini'),
      middleware: devToolsMiddleware(),
    });

    expect(model.modelId).toBe('gpt-4o-mini');
  });
});
```

**Run Unit Tests:**

```bash
bun test tests/unit/providers.test.ts
```

---

**Integration Test Example:**

```typescript
// tests/integration/ai-endpoint.test.ts

import { describe, it, expect } from 'bun:test';

describe('AI Endpoint', () => {
  const serverUrl = 'http://localhost:5173';

  it('should return streaming response', async () => {
    const response = await fetch(`${serverUrl}/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test' }],
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
  });

  it('should handle empty messages', async () => {
    const response = await fetch(`${serverUrl}/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });

    // Should handle gracefully (200 or appropriate error code)
    expect([200, 400, 422]).toContain(response.status);
  });
});
```

**Run Integration Tests:**

```bash
# Start server first
bun run dev &

# Run tests
bun test tests/integration/ai-endpoint.test.ts
```

---

**Test Summary Checklist:**

- [ ] ✅ Server starts without errors
- [ ] ✅ Environment variables loaded correctly
- [ ] ✅ Provider import succeeds
- [ ] ✅ Model creation works
- [ ] ✅ `/ai` endpoint responds
- [ ] ✅ Streaming works correctly
- [ ] ✅ Frontend chat interface works
- [ ] ✅ Browser console shows no errors
- [ ] ✅ Error handling works
- [ ] ✅ Unit tests pass
- [ ] ✅ Integration tests pass

If all tests pass, your integration is ready for deployment!

---

### 4.6 Step 5: Deploy and Monitor

Once your integration passes all tests, it's ready for deployment. This step ensures your provider works correctly in production.

#### 4.6.1 Production Deployment

**1. Update Production Environment Variables**

Add your provider's API key to the production environment:

```bash
# Production environment (e.g., Vercel, AWS, DigitalOcean)
# Configure these in your hosting platform's dashboard

AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your_production_api_key
```

**Security Best Practices:**

- ✅ Use different API keys for development and production
- ✅ Store keys in secret management services (not .env files)
- ✅ Rotate keys regularly (every 30-90 days)
- ✅ Monitor API key usage for anomalies
- ✅ Set up alerts for unusual activity

**2. Build and Deploy**

```bash
# Build the application
bun run build

# Deploy (platform-specific)
# For Vercel:
vercel --prod

# For custom deployment:
bun run start:prod
```

**3. Verify Deployment**

```bash
# Test production endpoint
curl -X POST https://your-domain.com/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Production test"}]}'
```

**4. Update Monitoring and Logging**

Ensure your production environment has proper monitoring:

```typescript
// apps/server/src/index.ts

app.post('/ai', async (c) => {
  const startTime = Date.now();

  try {
    const { messages } = await c.req.json();

    const model = wrapLanguageModel({
      model: openai('gpt-4o-mini'),
      middleware: devToolsMiddleware(),
    });

    const result = streamText({
      model,
      messages: await convertToModelMessages(messages),
    });

    // Log success
    const duration = Date.now() - startTime;
    console.log(`✅ AI request successful: ${duration}ms`);

    return result.toUIMessageStreamResponse();
  } catch (error) {
    // Log error with context
    const duration = Date.now() - startTime;
    console.error(`❌ AI request failed after ${duration}ms:`, error);

    // Return user-friendly error
    return c.json(
      {
        error: 'AI service temporarily unavailable',
        code: 'AI_SERVICE_ERROR',
      },
      503
    );
  }
});
```

#### 4.6.2 Post-Deployment Checklist

After deploying, complete these verification steps:

**Connectivity Verification:**

- [ ] ✅ API endpoint is accessible from production URL
- [ ] ✅ Environment variables are loaded correctly
- [ ] ✅ API key is valid and has sufficient quota
- [ ] ✅ Network/firewall allows outbound API calls

**Functional Testing:**

- [ ] ✅ Send test message through production chat UI
- [ ] ✅ Verify streaming works in production
- [ ] ✅ Test with real user scenarios
- [ ] ✅ Verify response quality

**Monitoring Setup:**

- [ ] ✅ Set up uptime monitoring for `/ai` endpoint
- [ ] ✅ Configure error tracking (e.g., Sentry)
- [ ] ✅ Monitor API usage and costs
- [ ] ✅ Set up alerts for:
  - High error rates (>5%)
  - Slow response times (>10s)
  - API quota exceeded
  - Unusual traffic patterns

**Documentation Updates:**

- [ ] ✅ Update README with new provider support
- [ ] ✅ Document any provider-specific configuration
- [ ] ✅ Update deployment documentation
- [ ] ✅ Notify team of new provider availability

**Cost Monitoring:**

- [ ] ✅ Check provider dashboard for usage
- [ ] ✅ Set up budget alerts
- [ ] ✅ Monitor token usage patterns
- [ ] ✅ Track costs per user/request

**Performance Monitoring:**

- [ ] ✅ Track time to first token (TTFT)
- [ ] ✅ Monitor total response times
- [ ] ✅ Measure streaming performance
- [ ] ✅ Identify bottlenecks

**Example Monitoring Dashboard Metrics:**

| Metric              | Target | Alert Threshold |
| ------------------- | ------ | --------------- |
| Success Rate        | >99%   | <95%            |
| Avg Response Time   | <3s    | >10s            |
| Time to First Token | <1s    | >5s             |
| Error Rate          | <1%    | >5%             |
| Daily Token Usage   | <1M    | >900K           |

---

### 4.7 Integration Checklist

Use this comprehensive checklist to ensure all steps are completed correctly:

**Pre-Integration (Step 4.2):**

- [ ] Provider researched and selected
- [ ] Provider package name identified
- [ ] API key obtained from provider dashboard
- [ ] Model IDs and capabilities documented
- [ ] Rate limits and pricing reviewed
- [ ] Provider package installed (`bun add @ai-sdk/[provider]`)
- [ ] Package installation verified in `package.json`

**Environment Configuration (Step 4.3):**

- [ ] Required environment variables identified
- [ ] API key added to `.env.local` (not committed)
- [ ] Environment variable format verified
- [ ] `.env.example` updated with placeholder (committed)
- [ ] Environment variable tested with `echo $VAR`

**Server Implementation (Step 4.4):**

- [ ] Provider import added to `apps/server/src/index.ts`
- [ ] Model creation updated with provider function
- [ ] Model ID verified for provider
- [ ] `wrapLanguageModel()` pattern maintained
- [ ] `devToolsMiddleware()` included
- [ ] Integration option chosen (replace, multi-provider, or endpoints)
- [ ] Code follows existing patterns
- [ ] No console.log or debugging statements left

**Testing (Step 4.5):**

- [ ] Server starts without errors
- [ ] No import errors or missing dependencies
- [ ] `/ai` endpoint responds to curl requests
- [ ] Streaming works correctly (token-by-token)
- [ ] Frontend chat interface works
- [ ] Browser console shows no errors
- [ ] Error handling tested with invalid inputs
- [ ] Unit tests created and passing
- [ ] Integration tests created and passing
- [ ] Manual testing completed with real conversations

**Deployment (Step 4.6):**

- [ ] Production environment variables configured
- [ ] Different API key used for production
- [ ] Application deployed successfully
- [ ] Production endpoint tested
- [ ] Monitoring and logging configured
- [ ] Error tracking set up
- [ ] Alerts configured for failures
- [ ] Cost monitoring set up
- [ ] Documentation updated

**Final Verification:**

- [ ] ✅ Integration works end-to-end
- [ ] ✅ No console errors in production
- [ ] ✅ Streaming performance acceptable
- [ ] ✅ Response quality meets expectations
- [ ] ✅ Frontend requires no changes (for Option A or B)
- [ ] ✅ Code follows project patterns
- [ ] ✅ Changes committed to git
- [ ] ✅ Commit message is descriptive
- [ ] ✅ Implementation plan updated (phase-3-task-3: completed)

**Example Commit Message:**

```
feat(ai): integrate OpenAI provider

Add OpenAI as a supported AI provider alongside Google Gemini.

Changes:
- Install @ai-sdk/openai package
- Add OPENAI_API_KEY environment variable
- Implement dynamic provider selection
- Update .env.example with OpenAI configuration
- Add integration tests for OpenAI endpoint

Testing:
- Manual testing with curl and frontend
- Unit tests for model creation
- Integration tests for /ai endpoint
- All tests passing

Refs: phase-3-task-3
```

---

### 4.8 Troubleshooting Common Integration Issues

Even with careful planning, issues can arise. Here are solutions to common problems:

**Issue: "Cannot find module '@ai-sdk/[provider]'"**

```bash
# Cause: Package not installed
# Solution:
cd apps/server
bun add @ai-sdk/[provider]

# Verify:
grep @ai-sdk/[provider] package.json
```

---

**Issue: "API key not found" or "API key invalid"**

```bash
# Cause 1: Environment variable not set
# Solution: Check variable exists
echo $OPENAI_API_KEY

# Cause 2: Wrong variable name
# Solution: Verify exact name in provider docs
# OPENAI_API_KEY (correct)
# OPENAI_KEY (wrong)

# Cause 3: Invalid or expired key
# Solution: Regenerate key in provider dashboard
```

---

**Issue: "Model not found" error**

```bash
# Cause: Incorrect model ID
# Solution: Verify model ID in provider documentation

# Example for OpenAI:
✅ gpt-4o-mini (correct)
❌ gpt-4-mini (incorrect)
❌ gpt4-mini (incorrect)

# Check provider docs for exact model IDs
```

---

**Issue: Streaming not working**

```bash
# Cause 1: Not using toUIMessageStreamResponse()
# Solution: Ensure correct return statement
return result.toUIMessageStreamResponse();

# Cause 2: CORS blocking
# Solution: Verify CORS configuration
app.use("/*", cors({ origin: env.CORS_ORIGIN }));

# Cause 3: Wrong content type
# Solution: Verify response is text/event-stream
```

---

**Issue: Very slow response times**

```bash
# Cause 1: Network latency
# Solution: Choose regionally close provider

# Cause 2: Rate limiting
# Solution: Check provider quota limits

# Cause 3: Model selection
# Solution: Use faster model (e.g., gpt-4o-mini instead of gpt-4o)
```

---

**Issue: Frontend not updating**

```bash
# Cause: Frontend cached old endpoint
# Solution: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

# If using Option C (separate endpoints):
# Cause: Frontend still pointing to old endpoint
# Solution: Update transport configuration
const chat = new Chat({
  transport: new DefaultChatTransport({
    api: `${PUBLIC_SERVER_URL}/ai/openai`,  // Update this
  }),
});
```

---

**Issue: "Request too large" error**

```bash
# Cause: Exceeding provider's context window
# Solution: Implement message truncation or summarization

# Example: Limit conversation history
const recentMessages = messages.slice(-10);  // Keep last 10 messages
```

---

**Need More Help?**

- Check provider documentation
- Review AI SDK troubleshooting guide

[⬆ Back to Top](#table-of-contents)

- Search existing GitHub issues
- Ask for help in community forums

---

## 5. Provider-Specific Configurations

> 📍 **Navigation:** [Table of Contents](#table-of-contents) → [Section 4](#4-step-by-step-integration-guide) → **Section 5**

This section provides detailed setup instructions and configuration guides for specific AI providers. Each provider includes installation steps, environment configuration, code examples, model selection guidance, and best practices.

### 5.1 OpenAI Integration

#### 5.1.1 Overview

OpenAI is one of the most widely used AI providers, offering access to GPT models (GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo) and the new o1 reasoning models. OpenAI models are known for excellent performance, strong multimodal capabilities, and extensive ecosystem support.

**Key Characteristics:**

- **Models:** GPT-4o, GPT-4o-mini, GPT-4 Turbo, o1-preview, o1-mini, GPT-3.5 Turbo
- **Context Window:** Up to 128K tokens for GPT-4o
- **Strengths:** Fast response times, excellent multimodal support, wide adoption
- **Best For:** General-purpose applications, production workloads, multimodal tasks
- **Cost:** $0.15-$15 per million input tokens (depending on model)
- **Speed:** Fast to very fast

#### 5.1.2 Installation

Install the OpenAI provider package:

```bash
npm install @ai-sdk/openai
```

Verify installation:

```bash
npm list @ai-sdk/openai
# @ai-sdk/openai@1.x.x
```

#### 5.1.3 Environment Configuration

**Required Environment Variable:**

```bash
OPENAI_API_KEY=sk-proj-...
```

**Optional Configuration Variables:**

```bash
# Custom base URL (for proxies or Azure OpenAI)
OPENAI_BASE_URL=https://api.openai.com/v1

# Organization ID (for org-specific API keys)
OPENAI_ORGANIZATION=org-...

# Project ID (for new API keys)
OPENAI_PROJECT=proj_...
```

**Update `.env.local`:**

```bash
# .env.local
OPENAI_API_KEY=sk-proj-your-api-key-here
```

**Update `.env.example`:**

```bash
# .env.example
# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-...
# Optional: Custom base URL for proxies or Azure
# OPENAI_BASE_URL=https://api.openai.com/v1
# Optional: Organization ID
# OPENAI_ORGANIZATION=org-...
```

#### 5.1.4 Server Implementation

**Step 1: Import OpenAI Provider**

```typescript
// apps/server/src/index.ts
import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';
```

**Step 2: Create OpenAI Model Instance**

```typescript
// Basic model creation
const model = openai('gpt-4o-mini');

// With middleware (recommended)
const model = wrapLanguageModel({
  model: openai('gpt-4o-mini'),
  middleware: devToolsMiddleware(),
});

// With custom configuration
const model = openai('gpt-4o-mini', {
  baseURL: process.env.OPENAI_BASE_URL,
  organization: process.env.OPENAI_ORGANIZATION,
});
```

**Step 3: Update Endpoint (Replace Current Provider)**

```typescript
// apps/server/src/index.ts

app.post('/ai', async (c) => {
  const { messages } = await c.req.json();

  const model = wrapLanguageModel({
    model: openai('gpt-4o-mini'),
    middleware: devToolsMiddleware(),
  });

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

**Alternative: Multi-Provider Configuration**

```typescript
// apps/server/src/index.ts

function getModel(provider: string) {
  const modelMap = {
    openai: () => openai('gpt-4o-mini'),
    anthropic: () => anthropic('claude-3-5-sonnet-20241022'),
    google: () => google('gemini-2.5-flash'),
    groq: () => groq('llama-3.3-70b-versatile'),
  };

  const modelFactory = modelMap[provider as keyof typeof modelMap] || modelMap.openai;
  return wrapLanguageModel({
    model: modelFactory(),
    middleware: devToolsMiddleware(),
  });
}

app.post('/ai', async (c) => {
  const { messages, provider = 'openai' } = await c.req.json();

  const result = streamText({
    model: getModel(provider),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

#### 5.1.5 Model Selection Guide

**Available OpenAI Models:**

| Model           | Context | Speed     | Cost (Input/Output) | Best For                    |
| --------------- | ------- | --------- | ------------------- | --------------------------- |
| `gpt-4o`        | 128K    | Fast      | $2.50/$10.00        | Multimodal, production      |
| `gpt-4o-mini`   | 128K    | Very Fast | $0.15/$0.60         | High-volume, cost-effective |
| `gpt-4-turbo`   | 128K    | Fast      | $10.00/$30.00       | Legacy GPT-4                |
| `gpt-4`         | 8K      | Medium    | $30.00/$60.00       | Original GPT-4              |
| `gpt-3.5-turbo` | 16K     | Very Fast | $0.50/$1.50         | Simple tasks, testing       |
| `o1-preview`    | 128K    | Slow      | $15.00/$60.00       | Complex reasoning           |
| `o1-mini`       | 128K    | Slow      | $3.00/$12.00        | Reasoning (faster)          |

**Recommendations:**

**For SambungChat:**

- **Primary Choice:** `gpt-4o-mini` - Best balance of cost, speed, and quality
- **Premium Option:** `gpt-4o` - For complex multimodal tasks
- **Budget Option:** `gpt-3.5-turbo` - For simple queries and testing
- **Reasoning Tasks:** `o1-preview` or `o1-mini` - For complex problem-solving

**Model Selection Criteria:**

```typescript
// Example: Model selection by task complexity
function selectOpenAIModel(complexity: 'low' | 'medium' | 'high') {
  const models = {
    low: 'gpt-3.5-turbo',
    medium: 'gpt-4o-mini',
    high: 'gpt-4o',
  };
  return openai(models[complexity]);
}

// Example: Model selection by use case
function selectModelByUseCase(useCase: string) {
  const modelMap: Record<string, string> = {
    chat: 'gpt-4o-mini',
    code: 'gpt-4o',
    reasoning: 'o1-preview',
    simple: 'gpt-3.5-turbo',
    multimodal: 'gpt-4o',
  };
  return openai(modelMap[useCase] || 'gpt-4o-mini');
}
```

#### 5.1.6 Complete Integration Example

**Complete Server Implementation:**

```typescript
// apps/server/src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';

const app = new Hono();

app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  })
);

app.post('/ai', async (c) => {
  try {
    const { messages } = await c.req.json();

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: 'Invalid messages format' }, 400);
    }

    // Create model with middleware
    const model = wrapLanguageModel({
      model: openai('gpt-4o-mini'),
      middleware: devToolsMiddleware(),
    });

    // Stream text generation
    const result = streamText({
      model,
      messages: await convertToModelMessages(messages),
    });

    // Return UI message stream
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return c.json({ error: 'Failed to generate response', details: error.message }, 500);
  }
});

export default app;
```

#### 5.1.7 Best Practices

**1. Error Handling**

```typescript
app.post('/ai', async (c) => {
  try {
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (error.status === 401) {
      return c.json({ error: 'Invalid API key' }, 401);
    }
    if (error.status === 429) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }
    if (error.status === 500) {
      return c.json({ error: 'OpenAI service error' }, 500);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});
```

**2. Rate Limiting**

```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 60, // Number of requests
  duration: 60, // Per 60 seconds
});

app.post('/ai', async (c) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  try {
    await rateLimiter.consume(ip);
  } catch (rejRes) {
    return c.json({ error: 'Too many requests' }, 429);
  }
  // ... proceed with request
});
```

**3. Cost Monitoring**

```typescript
let totalTokens = 0;
let totalCost = 0;

app.post('/ai', async (c) => {
  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: await convertToModelMessages(messages),
    onFinish: ({ usage }) => {
      totalTokens += usage.totalTokens;
      totalCost += (usage.promptTokens * 0.15 + usage.completionTokens * 0.6) / 1_000_000;
      console.log(`Total tokens: ${totalTokens}, Total cost: $${totalCost.toFixed(4)}`);
    },
  });

  return result.toUIMessageStreamResponse();
});
```

**4. Environment-Specific Models**

```typescript
const getModel = () => {
  if (process.env.NODE_ENV === 'production') {
    return openai('gpt-4o-mini'); // Cost-effective for production
  }
  if (process.env.NODE_ENV === 'test') {
    return openai('gpt-3.5-turbo'); // Fast for testing
  }
  return openai('gpt-4o-mini'); // Default
};
```

**5. Fallback Pattern**

```typescript
async function generateWithFallback(messages: any[]) {
  const models = [openai('gpt-4o-mini'), openai('gpt-3.5-turbo')];

  for (const model of models) {
    try {
      const result = await streamText({
        model,
        messages: await convertToModelMessages(messages),
      });
      return result.toUIMessageStreamResponse();
    } catch (error) {
      console.error(`Model ${model.modelId} failed:`, error);
      continue;
    }
  }

  throw new Error('All models failed');
}
```

#### 5.1.8 Common Issues and Solutions

| Issue                     | Cause             | Solution                                              |
| ------------------------- | ----------------- | ----------------------------------------------------- |
| `401 Unauthorized`        | Invalid API key   | Verify `OPENAI_API_KEY` is correct                    |
| `429 Rate Limit`          | Too many requests | Implement rate limiting, use exponential backoff      |
| `Model not found`         | Invalid model ID  | Check model name in API documentation                 |
| `Context length exceeded` | Message too long  | Reduce message history, use model with larger context |
| `Timeout`                 | Request too slow  | Increase timeout, use faster model                    |
| `CORS error`              | Frontend blocked  | Configure CORS properly in server                     |

**Testing the Integration:**

```bash
# Test 1: Verify API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test 2: Test endpoint
curl -X POST http://localhost:3000/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Test 3: Test with streaming
curl -X POST http://localhost:3000/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello"}]}'
```

---

### 5.2 Anthropic Integration

#### 5.2.1 Overview

Anthropic provides access to Claude models (Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku). Claude models are known for strong reasoning capabilities, large context windows (up to 200K tokens), and safety-focused design.

**Key Characteristics:**

- **Models:** Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Context Window:** Up to 200K tokens (largest among major providers)
- **Strengths:** Excellent reasoning, long-context handling, safety features
- **Best For:** Complex reasoning, long-document analysis, code generation
- **Cost:** $3-$15 per million input tokens (depending on model)
- **Speed:** Medium

#### 5.2.2 Installation

Install the Anthropic provider package:

```bash
npm install @ai-sdk/anthropic
```

Verify installation:

```bash
npm list @ai-sdk/anthropic
# @ai-sdk/anthropic@1.x.x
```

#### 5.2.3 Environment Configuration

**Required Environment Variable:**

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

**Optional Configuration Variables:**

```bash
# Custom base URL (for enterprise deployments)
ANTHROPIC_BASE_URL=https://api.anthropic.com

# API version (default: 2023-06-01)
ANTHROPIC_VERSION=2023-06-01

# Dangerous direct website access (beta feature)
# Only enable if you understand the risks
ANTHROPIC_DANGEROUS_DIRECT_WEBSITE_ACCESS=true
```

**Update `.env.local`:**

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

**Update `.env.example`:**

```bash
# .env.example
# Anthropic (Claude) API Configuration
ANTHROPIC_API_KEY=sk-ant-...
# Optional: Custom base URL
# ANTHROPIC_BASE_URL=https://api.anthropic.com
# Optional: API version
# ANTHROPIC_VERSION=2023-06-01
```

#### 5.2.4 Server Implementation

**Step 1: Import Anthropic Provider**

```typescript
// apps/server/src/index.ts
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';
```

**Step 2: Create Anthropic Model Instance**

```typescript
// Basic model creation (latest Claude 3.5 Sonnet)
const model = anthropic('claude-3-5-sonnet-20241022');

// With middleware (recommended)
const model = wrapLanguageModel({
  model: anthropic('claude-3-5-sonnet-20241022'),
  middleware: devToolsMiddleware(),
});

// With custom configuration
const model = anthropic('claude-3-5-sonnet-20241022', {
  baseURL: process.env.ANTHROPIC_BASE_URL,
});
```

**Step 3: Update Endpoint**

```typescript
// apps/server/src/index.ts

app.post('/ai', async (c) => {
  const { messages } = await c.req.json();

  const model = wrapLanguageModel({
    model: anthropic('claude-3-5-sonnet-20241022'),
    middleware: devToolsMiddleware(),
  });

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

#### 5.2.5 Model Selection Guide

**Available Anthropic Models:**

| Model                        | Context | Speed  | Cost (Input/Output) | Best For                    |
| ---------------------------- | ------- | ------ | ------------------- | --------------------------- |
| `claude-3-5-sonnet-20241022` | 200K    | Medium | $3.00/$15.00        | Latest Sonnet, balanced     |
| `claude-3-5-sonnet-20240620` | 200K    | Medium | $3.00/$15.00        | Previous Sonnet version     |
| `claude-3-opus-20240229`     | 200K    | Slow   | $15.00/$75.00       | Most capable, complex tasks |
| `claude-3-sonnet-20240229`   | 200K    | Medium | $3.00/$15.00        | Balanced performance        |
| `claude-3-haiku-20240307`    | 200K    | Fast   | $0.25/$1.25         | Fast, cost-effective        |

**Recommendations:**

**For SambungChat:**

- **Primary Choice:** `claude-3-5-sonnet-20241022` - Best balance of quality and cost
- **Budget Option:** `claude-3-haiku-20240307` - For simple queries and high-volume
- **Complex Tasks:** `claude-3-opus-20240229` - For reasoning-intensive tasks

**Model Selection by Use Case:**

```typescript
function selectAnthropicModel(useCase: string) {
  const modelMap: Record<string, string> = {
    chat: 'claude-3-5-sonnet-20241022',
    'long-context': 'claude-3-5-sonnet-20241022', // 200K tokens
    reasoning: 'claude-3-opus-20240229',
    simple: 'claude-3-haiku-20240307',
    code: 'claude-3-5-sonnet-20241022',
  };
  return anthropic(modelMap[useCase] || 'claude-3-5-sonnet-20241022');
}
```

#### 5.2.6 Special Features

**Extended Context (200K Tokens)**

```typescript
// Example: Handling long documents
async function processLongDocument(document: string) {
  const model = anthropic('claude-3-5-sonnet-20241022');

  // Can handle documents up to ~150,000 words (200K tokens)
  const result = await streamText({
    model,
    messages: [{ role: 'user', content: `Analyze this document:\n\n${document}` }],
  });

  return result.toUIMessageStreamResponse();
}
```

**Thinking Mode (Beta)**

```typescript
// Claude's extended thinking for complex reasoning
const model = anthropic('claude-3-5-sonnet-20241022', {
  experimental_thinking: {
    type: 'enabled',
    budgetTokens: 10000, // Reserve tokens for thinking
  },
});
```

#### 5.2.7 Complete Integration Example

```typescript
// apps/server/src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';

const app = new Hono();

app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  })
);

app.post('/ai', async (c) => {
  try {
    const { messages } = await c.req.json();

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: 'Invalid messages format' }, 400);
    }

    // Create model with middleware
    const model = wrapLanguageModel({
      model: anthropic('claude-3-5-sonnet-20241022'),
      middleware: devToolsMiddleware(),
    });

    // Stream text generation
    const result = streamText({
      model,
      messages: await convertToModelMessages(messages),
      temperature: 0.7, // Anthropic-specific: 0-1, default 0.7
      topP: 0.9, // Anthropic-specific: 0-1, default 0.9
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Anthropic API Error:', error);

    // Handle specific Anthropic errors
    if (error.status === 401) {
      return c.json({ error: 'Invalid API key' }, 401);
    }
    if (error.status === 429) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }
    if (error.status === 400) {
      return c.json({ error: 'Invalid request', details: error.message }, 400);
    }

    return c.json({ error: 'Failed to generate response', details: error.message }, 500);
  }
});

export default app;
```

#### 5.2.8 Best Practices

**1. Leverage Long Context**

```typescript
// Build comprehensive conversation history
async function chatWithLongHistory(userId: string, newMessage: string) {
  // Retrieve last 50 messages (can go up to 200K tokens)
  const history = await getMessageHistory(userId, 50);

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages: [...history, { role: 'user', content: newMessage }],
  });

  return result.toUIMessageStreamResponse();
}
```

**2. Use Haiku for Simple Tasks**

```typescript
// Route simple queries to Haiku for cost savings
function selectModelByComplexity(message: string) {
  const wordCount = message.split(/\s+/).length;

  if (wordCount < 50) {
    return anthropic('claude-3-haiku-20240307'); // Fast, cheap
  }

  return anthropic('claude-3-5-sonnet-20241022'); // Default
}
```

**3. Handle Rate Limits**

```typescript
import RateLimit from 'express-rate-limit';

const anthropicLimiter = RateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Anthropic default rate limit
  message: 'Too many requests to Anthropic API',
});

app.post('/ai', anthropicLimiter, async (c) => {
  // ... handler code
});
```

**4. Cost Optimization**

```typescript
// Estimate tokens before sending (rough estimate)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4); // Rough estimate: 1 token ≈ 4 characters
}

async function generateWithCostCheck(messages: any[]) {
  const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

  if (totalTokens > 150000) {
    throw new Error('Message too long (would exceed 200K context)');
  }

  const estimatedCost = (totalTokens * 3) / 1_000_000; // Input cost per million
  console.log(`Estimated cost: $${estimatedCost.toFixed(4)}`);

  return streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages: await convertToModelMessages(messages),
  });
}
```

#### 5.2.9 Common Issues and Solutions

| Issue                     | Cause                 | Solution                                     |
| ------------------------- | --------------------- | -------------------------------------------- |
| `401 Unauthorized`        | Invalid API key       | Verify `ANTHROPIC_API_KEY` is correct        |
| `429 Rate Limit`          | Too many requests     | Implement rate limiting (50 req/min default) |
| `400 Invalid Request`     | Malformed request     | Check message format, parameters             |
| `Context length exceeded` | Message > 200K tokens | Reduce message history                       |
| `Timeout`                 | Request too slow      | Increase timeout, use Haiku for speed        |
| `CORS error`              | Frontend blocked      | Configure CORS properly                      |

**Testing the Integration:**

```bash
# Test 1: Verify API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# Test 2: Test endpoint
curl -X POST http://localhost:3000/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello Claude"}]}'
```

---

### 5.3 Groq Integration

#### 5.3.1 Overview

Groq provides ultra-fast inference for open-source models (Llama, Mixtral, Gemma) using their custom LPU (Language Processing Unit) hardware. Groq is known for extremely low latency and very low costs, making it ideal for real-time applications.

**Key Characteristics:**

- **Models:** Llama 3.3 70B, Llama 3.1 70B/8B, Mixtral 8x7B, Gemma 2 9B
- **Context Window:** Up to 131K tokens (varies by model)
- **Strengths:** World's fastest inference, very low cost, open-source models
- **Best For:** Real-time chat, high-volume applications, cost-sensitive projects
- **Cost:** ~$0.59 per million input tokens (very low)
- **Speed:** Extremely fast (world's fastest LPU inference)

#### 5.3.2 Installation

Install the Groq provider package:

```bash
npm install @ai-sdk/groq
```

Verify installation:

```bash
npm list @ai-sdk/groq
# @ai-sdk/groq@1.x.x
```

#### 5.3.3 Environment Configuration

**Required Environment Variable:**

```bash
GROQ_API_KEY=gsk_...
```

**Optional Configuration Variables:**

```bash
# Custom base URL (rarely needed)
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

**Update `.env.local`:**

```bash
# .env.local
GROQ_API_KEY=gsk-your-api-key-here
```

**Update `.env.example`:**

```bash
# .env.example
# Groq API Configuration
GROQ_API_KEY=gsk-...
```

#### 5.3.4 Server Implementation

**Step 1: Import Groq Provider**

```typescript
// apps/server/src/index.ts
import { groq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';
```

**Step 2: Create Groq Model Instance**

```typescript
// Basic model creation (Llama 3.3 70B - most capable)
const model = groq('llama-3.3-70b-versatile');

// With middleware (recommended)
const model = wrapLanguageModel({
  model: groq('llama-3.3-70b-versatile'),
  middleware: devToolsMiddleware(),
});

// With custom configuration
const model = groq('llama-3.3-70b-versatile', {
  baseURL: process.env.GROQ_BASE_URL,
});
```

**Step 3: Update Endpoint**

```typescript
// apps/server/src/index.ts

app.post('/ai', async (c) => {
  const { messages } = await c.req.json();

  const model = wrapLanguageModel({
    model: groq('llama-3.3-70b-versatile'),
    middleware: devToolsMiddleware(),
  });

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

#### 5.3.5 Model Selection Guide

**Available Groq Models:**

| Model                     | Context | Speed      | Cost (Input/Output) | Best For                          |
| ------------------------- | ------- | ---------- | ------------------- | --------------------------------- |
| `llama-3.3-70b-versatile` | 131K    | Very Fast  | $0.59/$0.79         | Most capable, general-purpose     |
| `llama-3.1-70b-versatile` | 131K    | Very Fast  | $0.59/$0.79         | Large context, strong performance |
| `llama-3.1-8b-instant`    | 131K    | Ultra Fast | $0.05/$0.08         | Ultra-low latency, high volume    |
| `mixtral-8x7b-32768`      | 32K     | Very Fast  | $0.24/$0.24         | Mixture-of-Experts, fast          |
| `gemma-2-9b-it`           | 8K      | Ultra Fast | $0.08/$0.08         | Compact, very fast                |
| `gemma-7b-it`             | 8K      | Ultra Fast | $0.08/$0.08         | Older Gemma model                 |

**Recommendations:**

**For SambungChat:**

- **Primary Choice:** `llama-3.3-70b-versatile` - Best quality, still very fast
- **Ultra-Low Latency:** `llama-3.1-8b-instant` - For real-time chat
- **Budget Option:** `gemma-2-9b-it` - Fastest and cheapest

**Model Selection by Use Case:**

```typescript
function selectGroqModel(useCase: string) {
  const modelMap: Record<string, string> = {
    chat: 'llama-3.3-70b-versatile', // Best quality
    realtime: 'llama-3.1-8b-instant', // Ultra-fast
    'high-volume': 'llama-3.1-8b-instant', // Cost-effective
    simple: 'gemma-2-9b-it', // Fastest
    reasoning: 'llama-3.3-70b-versatile', // Most capable
  };
  return groq(modelMap[useCase] || 'llama-3.3-70b-versatile');
}
```

#### 5.3.6 Complete Integration Example

```typescript
// apps/server/src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { groq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';

const app = new Hono();

app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  })
);

app.post('/ai', async (c) => {
  try {
    const { messages } = await c.req.json();

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: 'Invalid messages format' }, 400);
    }

    // Create model with middleware
    const model = wrapLanguageModel({
      model: groq('llama-3.3-70b-versatile'),
      middleware: devToolsMiddleware(),
    });

    // Stream text generation
    const result = streamText({
      model,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Groq API Error:', error);

    // Handle specific Groq errors
    if (error.status === 401) {
      return c.json({ error: 'Invalid API key' }, 401);
    }
    if (error.status === 429) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    return c.json({ error: 'Failed to generate response', details: error.message }, 500);
  }
});

export default app;
```

#### 5.3.7 Best Practices

**1. Leverage Speed for Real-Time Applications**

```typescript
// Use 8B model for real-time chat
const realtimeModel = groq('llama-3.1-8b-instant');

app.post('/ai/realtime', async (c) => {
  const result = streamText({
    model: realtimeModel,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

**2. Cost Monitoring**

```typescript
let totalCost = 0;

app.post('/ai', async (c) => {
  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    messages: await convertToModelMessages(messages),
    onFinish: ({ usage }) => {
      const cost = (usage.promptTokens * 0.59 + usage.completionTokens * 0.79) / 1_000_000;
      totalCost += cost;
      console.log(`Request cost: $${cost.toFixed(6)}, Total: $${totalCost.toFixed(4)}`);
    },
  });

  return result.toUIMessageStreamResponse();
});
```

**3. Model Selection by Message Length**

```typescript
function selectModelByLength(messages: any[]) {
  const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);

  // Use smaller model for short messages
  if (totalLength < 500) {
    return groq('llama-3.1-8b-instant'); // Ultra-fast for short queries
  }

  return groq('llama-3.3-70b-versatile'); // Default
}
```

**4. A/B Testing Models**

```typescript
// Split traffic between models for comparison
const models = [groq('llama-3.3-70b-versatile'), groq('llama-3.1-8b-instant')];

app.post('/ai', async (c) => {
  const { messages, variant = 'A' } = await c.req.json();

  const modelIndex = variant === 'A' ? 0 : 1;
  const model = models[modelIndex];

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

#### 5.3.8 Common Issues and Solutions

| Issue              | Cause             | Solution                                              |
| ------------------ | ----------------- | ----------------------------------------------------- |
| `401 Unauthorized` | Invalid API key   | Verify `GROQ_API_KEY` is correct                      |
| `429 Rate Limit`   | Too many requests | Groq has generous limits, but implement rate limiting |
| `Model not found`  | Invalid model ID  | Check model name in Groq documentation                |
| `Timeout`          | Network issues    | Groq is very fast, timeouts are rare                  |
| `CORS error`       | Frontend blocked  | Configure CORS properly                               |

**Testing the Integration:**

```bash
# Test 1: Verify API key
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"

# Test 2: Test endpoint
curl -X POST http://localhost:3000/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello, how fast are you?"}]}'

# Test 3: Compare speed between models
time curl -X POST http://localhost:3000/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Count to 10"}]}'
```

---

### 5.4 Ollama Integration

#### 5.4.1 Overview

Ollama enables running large language models locally on your own hardware. It provides complete privacy, zero API costs, and offline capability. Ollama supports 100+ open-source models (Llama, Mistral, Gemma, Qwen, DeepSeek, and more).

**⚠️ Important Notice:**
The official Ollama provider (`ollama-ai-provider`) is a community package with reported maintenance issues (unresponsive to issues and PRs for 5+ months). Consider using the OpenAI-compatible provider or writing a custom provider for production use.

**Key Characteristics:**

- **Models:** 100+ open-source models (Llama, Mistral, Gemma, Qwen, etc.)
- **Context Window:** Varies by model (typically 8K-32K)
- **Strengths:** Complete privacy, zero API costs, offline capability
- **Best For:** Local development, offline applications, privacy-sensitive projects
- **Cost:** Free (uses local compute)
- **Speed:** Slower than cloud providers (depends on hardware)

#### 5.4.2 Installation

**Step 1: Install Ollama**

Download and install Ollama from https://ollama.com

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

**Step 2: Start Ollama Server**

```bash
ollama serve
# Server runs on http://localhost:11434
```

**Step 3: Pull a Model**

```bash
# Pull Llama 3.2
ollama pull llama3.2

# Pull Mistral
ollama pull mistral

# Pull Gemma 2
ollama pull gemma2

# List available models
ollama list
```

**Step 4: Install Provider Package**

```bash
# Community provider (maintenance issues)
npm install ollama-ai-provider

# Alternative: Use OpenAI-compatible provider
npm install @ai-sdk/openai
```

#### 5.4.3 Environment Configuration

**Required Environment Variables:**

```bash
# For community provider
# None required for local Ollama (defaults to http://localhost:11434)

# For remote Ollama server
OLLAMA_BASE_URL=http://your-server:11434

# For OpenAI-compatible approach
OPENAI_API_KEY=any-string  # Not used but required
OPENAI_BASE_URL=http://localhost:11434/v1
```

**Update `.env.local`:**

```bash
# .env.local

# Option 1: Using community provider
OLLAMA_BASE_URL=http://localhost:11434

# Option 2: Using OpenAI-compatible provider
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama  # Any value works
```

**Update `.env.example`:**

```bash
# .env.example

# Ollama Configuration (local AI)
# Option 1: Community provider
OLLAMA_BASE_URL=http://localhost:11434

# Option 2: OpenAI-compatible approach
# OPENAI_BASE_URL=http://localhost:11434/v1
# OPENAI_API_KEY=ollama
```

#### 5.4.4 Server Implementation

**Option A: Using Community Provider**

```typescript
// apps/server/src/index.ts
import { createOllama } from 'ollama-ai-provider';
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';

// Create Ollama instance
const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

// Create model
const model = wrapLanguageModel({
  model: ollama('llama3.2'),
  middleware: devToolsMiddleware(),
});

app.post('/ai', async (c) => {
  const { messages } = await c.req.json();

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

**Option B: Using OpenAI-Compatible Provider (Recommended)**

```typescript
// apps/server/src/index.ts
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';

// Create OpenAI-compatible client for Ollama
const ollama = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:11434/v1',
  apiKey: process.env.OPENAI_API_KEY || 'ollama', // Required but not used
});

// Create model (use "gpt-3.5-turbo" as placeholder, Ollama ignores it)
const model = wrapLanguageModel({
  model: ollama('llama3.2'), // Ollama uses the actual model name
  middleware: devToolsMiddleware(),
});

app.post('/ai', async (c) => {
  const { messages } = await c.req.json();

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

#### 5.4.5 Model Selection Guide

**Popular Ollama Models:**

| Model         | Parameters | Context | Speed       | Best For                           |
| ------------- | ---------- | ------- | ----------- | ---------------------------------- |
| `llama3.2`    | 3B-90B     | 128K    | Medium-High | General-purpose, latest Llama      |
| `llama3.1`    | 8B-70B     | 128K    | Medium-High | Proven Llama 3.1                   |
| `mistral`     | 7B         | 32K     | High        | Fast, efficient                    |
| `gemma2`      | 9B-27B     | 8K      | High        | Google's Gemma models              |
| `qwen2.5`     | 3B-72B     | 32K     | Medium      | Alibaba's Qwen (strong reasoning)  |
| `deepseek-r1` | 1.5B-70B   | 64K     | Low-Medium  | DeepSeek R1 (reasoning specialist) |

**Model Selection by Use Case:**

```typescript
function selectOllamaModel(useCase: string, hardware: 'low' | 'medium' | 'high') {
  const modelMap: Record<string, Record<string, string>> = {
    chat: {
      low: 'llama3.2:3b', // Smaller model for low-end hardware
      medium: 'llama3.2:9b', // Balanced for medium hardware
      high: 'llama3.2:70b', // Largest for high-end hardware
    },
    realtime: {
      low: 'phi3:mini', // Very small, fast
      medium: 'gemma2:9b', // Fast and capable
      high: 'llama3.2:9b', // Best quality/speed balance
    },
    reasoning: {
      low: 'deepseek-r1:1.5b',
      medium: 'deepseek-r1:7b',
      high: 'deepseek-r1:32b',
    },
  };

  return modelMap[useCase]?.[hardware] || 'llama3.2:9b';
}
```

#### 5.4.6 Hardware Requirements

**Recommended Hardware by Model Size:**

| Model Size     | RAM   | GPU                     | VRAM | Use Case                  |
| -------------- | ----- | ----------------------- | ---- | ------------------------- |
| 3B (Llama 3.2) | 8GB   | Not required            | -    | Testing, low-end hardware |
| 7B-9B          | 16GB  | Optional (6GB VRAM)     | 6GB  | Development, moderate use |
| 14B-16B        | 32GB  | Recommended (10GB VRAM) | 10GB | Production use            |
| 32B-70B        | 64GB+ | Required (24GB VRAM)    | 24GB | High-quality production   |

**GPU Acceleration:**

```bash
# Check if Ollama is using GPU
ollama ps

# Expected output (with GPU):
# NAME           ID      SIZE    PROCESSOR    UNTIL
# llama3.2:9b    abc123  9.0 GB  100% GPU     5m
#                        (or "GPU" column shows usage)

# If no GPU detected, CPU will be used (slower)
```

#### 5.4.7 Complete Integration Example

```typescript
// apps/server/src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';

const app = new Hono();

app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  })
);

// Create Ollama client using OpenAI-compatible interface
const ollama = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:11434/v1',
  apiKey: process.env.OPENAI_API_KEY || 'ollama',
});

app.post('/ai', async (c) => {
  try {
    const { messages, model = 'llama3.2:9b' } = await c.req.json();

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: 'Invalid messages format' }, 400);
    }

    // Create model with middleware
    const wrappedModel = wrapLanguageModel({
      model: ollama(model),
      middleware: devToolsMiddleware(),
    });

    // Stream text generation
    const result = streamText({
      model: wrappedModel,
      messages: await convertToModelMessages(messages),
      temperature: 0.7,
      maxTokens: 2048,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Ollama Error:', error);

    // Handle common Ollama errors
    if (error.code === 'ECONNREFUSED') {
      return c.json({ error: 'Ollama server not running. Start with: ollama serve' }, 503);
    }

    if (error.message?.includes('model')) {
      return c.json(
        { error: 'Model not found. Pull with: ollama pull ' + (await c.req.json()).model },
        400
      );
    }

    return c.json({ error: 'Failed to generate response', details: error.message }, 500);
  }
});

// Health check endpoint
app.get('/ai/health', async (c) => {
  try {
    const response = await fetch(
      `${process.env.OPENAI_BASE_URL || 'http://localhost:11434'}/api/tags`
    );
    if (response.ok) {
      const models = await response.json();
      return c.json({ status: 'healthy', models: models.models });
    }
    return c.json({ status: 'unhealthy' }, 503);
  } catch (error) {
    return c.json({ status: 'unhealthy', error: error.message }, 503);
  }
});

export default app;
```

#### 5.4.8 Model Management

**List Available Models:**

```bash
# Local models
ollama list

# Via API
curl http://localhost:11434/api/tags

# Via our health check endpoint
curl http://localhost:3000/ai/health
```

**Pull New Models:**

```bash
# Pull a model
ollama pull llama3.2:9b

# Pull specific version
ollama pull llama3.2:9b-instruct-q4_K_M

# Show model information
ollama show llama3.2:9b
```

**Run Models:**

```bash
# Interactive chat
ollama run llama3.2:9b

# Generate from prompt
echo "Hello" | ollama run llama3.2:9b
```

**Remove Models:**

```bash
# Remove a model
ollama rm llama3.2:3b
```

#### 5.4.9 Remote Ollama Server

**Setup Remote Server:**

```bash
# On remote server
export OLLAMA_HOST=0.0.0.0:11434
ollama serve
```

**Configure CORS (if needed):**

```bash
# Set OLLAMA_ORIGINS environment variable
export OLLAMA_ORIGINS="http://localhost:5173,http://your-frontend.com"
ollama serve
```

**Connect from Local Machine:**

```bash
# .env.local
OPENAI_BASE_URL=http://your-server:11434/v1
```

#### 5.4.10 Best Practices

**1. Model Selection Based on Hardware**

```typescript
// Detect hardware capabilities and select appropriate model
function getModelForHardware() {
  const gpuMemory = process.env.GPU_MEMORY ? parseInt(process.env.GPU_MEMORY) : 0;

  if (gpuMemory >= 24) {
    return 'llama3.2:70b'; // High-end GPU
  } else if (gpuMemory >= 10) {
    return 'llama3.2:9b'; // Mid-range GPU
  } else if (gpuMemory >= 6) {
    return 'llama3.2:3b'; // Low-end GPU
  } else {
    return 'phi3:mini'; // CPU-only
  }
}
```

**2. Warm-Up Model**

```typescript
// Pre-load model to avoid cold start latency
async function warmUpModel(modelName: string) {
  try {
    await streamText({
      model: ollama(modelName),
      messages: [{ role: 'user', content: 'Hi' }],
      maxTokens: 1,
    });
    console.log(`Model ${modelName} warmed up`);
  } catch (error) {
    console.error('Failed to warm up model:', error);
  }
}

// Call on server startup
warmUpModel('llama3.2:9b');
```

**3. Fallback to Cloud**

```typescript
// Fallback to cloud provider if Ollama fails
async function generateWithFallback(messages: any[]) {
  try {
    // Try Ollama first (free, private)
    return await streamText({
      model: ollama('llama3.2:9b'),
      messages: await convertToModelMessages(messages),
    });
  } catch (error) {
    console.error('Ollama failed, falling back to cloud:', error);

    // Fallback to Groq (very low cost)
    return await streamText({
      model: groq('llama-3.1-8b-instant'),
      messages: await convertToModelMessages(messages),
    });
  }
}
```

**4. Cost Monitoring (Zero with Ollama)**

```typescript
let ollamaRequests = 0;
let cloudRequests = 0;
let cloudCost = 0;

app.post('/ai', async (c) => {
  try {
    // Try Ollama
    const result = streamText({
      model: ollama('llama3.2:9b'),
      messages: await convertToModelMessages(messages),
    });

    ollamaRequests++;
    return result.toUIMessageStreamResponse();
  } catch (error) {
    // Fallback to cloud
    const result = streamText({
      model: groq('llama-3.1-8b-instant'),
      messages: await convertToModelMessages(messages),
      onFinish: ({ usage }) => {
        cloudRequests++;
        cloudCost += (usage.totalTokens * 0.59) / 1_000_000;
      },
    });

    return result.toUIMessageStreamResponse();
  }
});

// Monitor costs
setInterval(() => {
  console.log(`
    Ollama Requests: ${ollamaRequests} (FREE)
    Cloud Requests: ${cloudRequests}
    Cloud Cost: $${cloudCost.toFixed(4)}
    Total Savings: $${cloudCost.toFixed(4)}
  `);
}, 60000);
```

#### 5.4.11 Common Issues and Solutions

| Issue              | Cause                   | Solution                     |
| ------------------ | ----------------------- | ---------------------------- |
| `ECONNREFUSED`     | Ollama not running      | Start with `ollama serve`    |
| `Model not found`  | Model not pulled        | Run `ollama pull <model>`    |
| Very slow response | CPU-only inference      | Use GPU, smaller model       |
| Out of memory      | Model too large for RAM | Use smaller model (3B/7B)    |
| CORS error         | Remote server blocking  | Set `OLLAMA_ORIGINS` env var |
| High latency       | Cold start              | Warm up model on startup     |

**Testing the Integration:**

```bash
# Test 1: Check Ollama server
curl http://localhost:11434/api/tags

# Test 2: Test model directly
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:9b",
  "prompt": "Hello"
}'

# Test 3: Test endpoint
curl -X POST http://localhost:3000/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello from Ollama"}]}'

# Test 4: Health check
curl http://localhost:3000/ai/health
```

---

### 5.5 Other Notable Providers

Brief overview of other supported providers for reference. Detailed integration guides can be added as needed.

#### 5.5.1 Mistral AI

**Package:** `@ai-sdk/mistral`

**Models:**

- `mistral-large-latest` - Most capable
- `mistral-medium-latest` - Balanced
- `mistral-small-latest` - Fast, cost-effective
- `codestral-latest` - Code-specialized

**Environment:**

```bash
MISTRAL_API_KEY=...
```

**Best For:**

- European data residency requirements
- Cost-effective alternatives to OpenAI/Anthropic
- Code generation

**Quick Start:**

```typescript
import { mistral } from '@ai-sdk/mistral';

const model = mistral('mistral-small-latest');
```

#### 5.5.2 Azure OpenAI

**Package:** `@ai-sdk/azure`

**Models:**

- Same as OpenAI (GPT-4o, GPT-4 Turbo, etc.)
- Hosted on Azure infrastructure

**Environment:**

```bash
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_RESOURCE_NAME=...
AZURE_OPENAI_DEPLOYMENT_NAME=...
AZURE_OPENAI_API_VERSION=...
```

**Best For:**

- Enterprise applications
- Data residency requirements
- Azure integration

**Quick Start:**

```typescript
import { createAzure } from '@ai-sdk/azure';

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});

const model = azure('gpt-4o');
```

#### 5.5.3 Together AI

**Package:** `@ai-sdk/togetherai`

**Models:**

- 100+ open-source models
- Meta Llama, Mistral, Google Gemma, and more

**Environment:**

```bash
TOGETHER_AI_API_KEY=...
```

**Best For:**

- Wide model selection
- Open-source model hosting
- Competitive pricing

**Quick Start:**

```typescript
import { createTogetherAi } from '@ai-sdk/togetherai';

const togetherai = createTogetherAi({
  apiKey: process.env.TOGETHER_AI_API_KEY,
});

const model = togetherai('meta-llama/Llama-3-70b-chat-hf');
```

#### 5.5.4 OpenRouter

**Package:** `@openrouter/ai-sdk-provider`

**Models:**

- 100+ models from multiple providers
- Single API access to OpenAI, Anthropic, Google, Meta, and more

**Environment:**

```bash
OPENROUTER_API_KEY=sk-or-...
```

**Best For:**

- Access to multiple providers through single API
- Comparing models side-by-side
- Flexible model switching

**Quick Start:**

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter();

const model = openrouter('anthropic/claude-3.5-sonnet');
```

---

### 5.6 Provider Comparison Summary

| Provider      | Best For                          | Cost     | Speed       | Context | Ease of Setup |
| ------------- | --------------------------------- | -------- | ----------- | ------- | ------------- |
| **OpenAI**    | General-purpose                   | Medium   | Fast        | 128K    | ⭐⭐⭐⭐⭐    |
| **Anthropic** | Complex reasoning, long documents | High     | Medium      | 200K    | ⭐⭐⭐⭐⭐    |
| **Groq**      | Real-time, high-volume            | Very Low | Very Fast   | 131K    | ⭐⭐⭐⭐⭐    |
| **Ollama**    | Local, offline, privacy           | Free     | Slow-Medium | 8K-128K | ⭐⭐⭐        |
| **Google**    | Cost-performance balance          | Low      | Fast        | 2M      | ⭐⭐⭐⭐⭐    |

**Recommendation for SambungChat:**

Based on the current implementation and analysis:

1. **Primary Provider:** **Google Gemini** (gemini-2.5-flash)
   - Excellent cost-performance ratio
   - Already implemented
   - Fast inference with 2M token context

2. **Secondary Options:**
   - **OpenAI** (gpt-4o-mini) - For general-purpose use
   - **Groq** (llama-3.3-70b) - For ultra-low latency

[⬆ Back to Top](#table-of-contents)

- **Anthropic** (claude-3-5-sonnet) - For complex reasoning

3. **Local Development:**
   - **Ollama** (llama3.2) - For offline testing and development

---

## 6. Environment Configuration

> 📍 **Navigation:** [Table of Contents](#table-of-contents) → [Section 5](#5-provider-specific-configurations) → **Section 6**

This section covers everything you need to know about configuring environment variables for AI providers in SambungChat. You'll learn about naming patterns, validation strategies, complete provider references, ready-to-use templates, and security best practices.

### 6.1 Environment Variable Design Patterns

#### 6.1.1 Naming Conventions

AI providers follow consistent patterns for environment variable naming. Understanding these patterns helps you quickly identify and configure new providers.

**Primary Pattern: `{PROVIDER}_API_KEY`**

This is the most common pattern used by the majority of providers:

| Provider  | Variable Name       | Example             |
| --------- | ------------------- | ------------------- |
| OpenAI    | `OPENAI_API_KEY`    | `sk-proj-abc123...` |
| Anthropic | `ANTHROPIC_API_KEY` | `sk-ant-xyz789...`  |
| Groq      | `GROQ_API_KEY`      | `gsk-...`           |
| Mistral   | `MISTRAL_API_KEY`   | `your-key-here`     |
| Cohere    | `COHERE_API_KEY`    | `your-key-here`     |

**Service-Specific Pattern: `{SERVICE}_API_KEY`**

Used when the brand name differs from the service name:

| Provider    | Variable Name                  | Notes                         |
| ----------- | ------------------------------ | ----------------------------- |
| Google      | `GOOGLE_GENERATIVE_AI_API_KEY` | Also accepts `GOOGLE_API_KEY` |
| Together AI | `TOGETHER_AI_API_KEY`          | Includes underscore in brand  |

**Token-Based Pattern: `{PROVIDER}_API_TOKEN`**

Some providers use "TOKEN" instead of "KEY":

| Provider   | Variable Name          | Why?                 |
| ---------- | ---------------------- | -------------------- |
| Replicate  | `REPLICATE_API_TOKEN`  | Provider convention  |
| Cloudflare | `CLOUDFLARE_API_TOKEN` | Authentication token |

**Cloud Credential Pattern: `{PROVIDER}_{CREDENTIAL_TYPE}`**

Cloud providers often use multiple credential variables:

| Provider      | Variables                                                      | Purpose                  |
| ------------- | -------------------------------------------------------------- | ------------------------ |
| AWS (Bedrock) | `AWS_ACCESS_KEY_ID`<br>`AWS_SECRET_ACCESS_KEY`<br>`AWS_REGION` | Standard AWS credentials |
| Azure OpenAI  | `AZURE_OPENAI_API_KEY`<br>`AZURE_OPENAI_ENDPOINT`              | Azure-specific           |

**Base URL Pattern: `{PROVIDER}_BASE_URL`**

Optional custom endpoint configuration:

| Provider  | Variable             | Default Value               |
| --------- | -------------------- | --------------------------- |
| OpenAI    | `OPENAI_BASE_URL`    | `https://api.openai.com/v1` |
| Anthropic | `ANTHROPIC_BASE_URL` | `https://api.anthropic.com` |
| Groq      | `GROQ_BASE_URL`      | `https://api.groq.com`      |

**Best Practices Summary:**

> ✅ **DO:**
>
> - Use UPPERCASE with underscores
> - Prefix with provider name
> - Use `_API_KEY` suffix (or `_API_TOKEN` where applicable)
> - Include descriptive comments in `.env` files
>
> ❌ **DON'T:**
>
> - Use lowercase or hyphens
> - Use generic names like `API_KEY`
> - Include actual values in `.env.example`
> - Commit `.env` files to version control

---

#### 6.1.2 Validation Strategies

When implementing environment configuration, you need to decide how strictly to validate API keys. Here are three proven strategies, each with different trade-offs.

---

**Option 1: All Optional (Maximum Flexibility)**

**Best for:** Multi-provider applications, dynamic provider switching, development environments

**Implementation:**

```typescript
// File: packages/env/src/server.ts
import { z } from 'zod';

const envSchema = z.object({
  // All provider keys are optional - maximum flexibility
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),

  // Optional configuration variables
  OPENAI_BASE_URL: z.string().url().optional(),
  ANTHROPIC_BASE_URL: z.string().url().optional(),
  GOOGLE_API_BASE_URL: z.string().url().optional(),
  GROQ_BASE_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
```

**Usage in Server Code:**

```typescript
// File: apps/server/src/index.ts
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { env } from '@sambungchat/env';

// Check which provider is configured
const provider = env.GOOGLE_GENERATIVE_AI_API_KEY
  ? 'google'
  : env.OPENAI_API_KEY
    ? 'openai'
    : env.ANTHROPIC_API_KEY
      ? 'anthropic'
      : env.GROQ_API_KEY
        ? 'groq'
        : null;

if (!provider) {
  throw new Error('No AI provider configured. Please set at least one API key.');
}

// Use the configured provider
const providers = {
  google: () => google('gemini-2.5-flash'),
  openai: () => openai('gpt-4o-mini'),
  anthropic: () => anthropic('claude-3-5-sonnet-20241022'),
  groq: () => groq('llama-3.3-70b-versatile'),
};

const model = wrapLanguageModel({
  model: providers[provider](),
  middleware: devToolsMiddleware(),
});
```

**Pros:**

- ✅ Maximum flexibility for developers
- ✅ Easy to add new providers
- ✅ Supports dynamic provider switching
- ✅ No validation errors during development

**Cons:**

- ❌ No built-in validation (must check manually)
- ❌ Possible runtime errors if no provider is configured
- ❌ Requires defensive programming in server code

---

**Option 2: At Least One Required** (Recommended for Production)

**Best for:** Production applications, preventing misconfiguration, clear error messages

**Implementation:**

```typescript
// File: packages/env/src/server.ts
import { z } from 'zod';

const envSchema = z
  .object({
    // All provider keys are individually optional
    OPENAI_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
    GROQ_API_KEY: z.string().min(1).optional(),

    // Optional configuration
    OPENAI_BASE_URL: z.string().url().optional(),
    ANTHROPIC_BASE_URL: z.string().url().optional(),
    GOOGLE_API_BASE_URL: z.string().url().optional(),
    GROQ_BASE_URL: z.string().url().optional(),
  })
  .refine(
    (data) => {
      return !!(
        data.OPENAI_API_KEY ||
        data.ANTHROPIC_API_KEY ||
        data.GOOGLE_GENERATIVE_AI_API_KEY ||
        data.GROQ_API_KEY
      );
    },
    {
      message:
        'At least one AI provider API key is required. Please configure OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GROQ_API_KEY in your environment.',
    }
  );

export const env = envSchema.parse(process.env);
```

**Error Output (if no keys configured):**

```bash
> bun run dev

❌ Invalid environment configuration:
: At least one AI provider API key is required. Please configure OPENAI_API_KEY,
ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GROQ_API_KEY in your environment.

💡 Check your .env file and ensure at least one provider is configured.
```

**Pros:**

- ✅ Prevents application startup without configuration
- ✅ Clear, actionable error messages
- ✅ Production-ready validation
- ✅ Flexible provider choice

**Cons:**

- ❌ Requires at least one provider (no "providerless" mode)
- ❌ Doesn't validate provider-key matching

---

**Option 3: Provider Selection with Validation**

**Best for:** Applications with a primary provider concept, runtime configuration, enforcing provider-key matching

**Implementation:**

```typescript
// File: packages/env/src/server.ts
import { z } from 'zod';

const envSchema = z
  .object({
    // Primary provider selection
    AI_PROVIDER: z.enum(['openai', 'anthropic', 'google', 'groq']).default('google'),

    // Provider keys
    OPENAI_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
    GROQ_API_KEY: z.string().min(1).optional(),

    // Optional configuration
    OPENAI_BASE_URL: z.string().url().optional(),
    ANTHROPIC_BASE_URL: z.string().url().optional(),
    GOOGLE_API_BASE_URL: z.string().url().optional(),
    GROQ_BASE_URL: z.string().url().optional(),
  })
  .refine(
    (data) => {
      // Validate that the selected provider has its API key configured
      switch (data.AI_PROVIDER) {
        case 'openai':
          return !!data.OPENAI_API_KEY;
        case 'anthropic':
          return !!data.ANTHROPIC_API_KEY;
        case 'google':
          return !!data.GOOGLE_GENERATIVE_AI_API_KEY;
        case 'groq':
          return !!data.GROQ_API_KEY;
        default:
          return false;
      }
    },
    {
      message: (data) =>
        `API key required for selected provider '${data.AI_PROVIDER}'. Please set ${data.AI_PROVIDER === 'google' ? 'GOOGLE_GENERATIVE_AI_API_KEY' : data.AI_PROVIDER.toUpperCase() + '_API_KEY'} in your environment.`,
    }
  );

export const env = envSchema.parse(process.env);
```

**Usage in Server Code:**

```typescript
// File: apps/server/src/index.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { env } from '@sambungchat/env';

// Select provider based on environment
const provider = env.AI_PROVIDER || 'google';

const providers = {
  openai: () => openai('gpt-4o-mini'),
  anthropic: () => anthropic('claude-3-5-sonnet-20241022'),
  google: () => google('gemini-2.5-flash'),
  groq: () => groq('llama-3.3-70b-versatile'),
};

const model = wrapLanguageModel({
  model: providers[provider](),
  middleware: devToolsMiddleware(),
});
```

**Error Output (if selected provider key missing):**

```bash
> AI_PROVIDER=openai bun run dev

❌ Invalid environment configuration:
: API key required for selected provider 'openai'. Please set OPENAI_API_KEY in your environment.

💡 Either set OPENAI_API_KEY or change AI_PROVIDER to a configured provider.
```

**Pros:**

- ✅ Explicit provider selection
- ✅ Validates provider-key matching
- ✅ Runtime configurability
- ✅ Clear error messages

**Cons:**

- ❌ More complex configuration
- ❌ Requires `AI_PROVIDER` variable
- ❌ Less flexible than "all optional" approach

---

**Comparison Summary:**

| Strategy              | Flexibility | Validation | Best For                    | Complexity |
| --------------------- | ----------- | ---------- | --------------------------- | ---------- |
| All Optional          | ⭐⭐⭐⭐⭐  | ⭐⭐       | Development, multi-provider | Low        |
| At Least One Required | ⭐⭐⭐⭐    | ⭐⭐⭐⭐   | Production, general use     | Medium     |
| Provider Selection    | ⭐⭐⭐      | ⭐⭐⭐⭐⭐ | Enterprise, strict control  | High       |

**Recommendation for SambungChat:**

Start with **Option 2 (At Least One Required)** for the best balance of flexibility and production readiness. This prevents misconfiguration while allowing developers to choose their preferred provider.

---

#### 6.1.3 Multi-Provider Configuration Patterns

For advanced use cases, you may want to implement sophisticated multi-provider patterns beyond simple selection.

---

**Pattern 1: Fallback Chain**

**Purpose:** Automatically try alternative providers if the primary one fails

**Environment Configuration:**

```bash
# Provider priority order (comma-separated, highest priority first)
AI_PROVIDER_PRIORITY=google,openai,anthropic,groq

# All provider keys
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GROQ_API_KEY=your-groq-key
```

**Implementation:**

```typescript
// File: packages/env/src/server.ts
import { z } from 'zod';

const envSchema = z.object({
  AI_PROVIDER_PRIORITY: z.string().default('google,openai,anthropic,groq'),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);

// Parse provider priority
export const providerPriority = env.AI_PROVIDER_PRIORITY.split(',').map((p) => p.trim());

// Get first available provider
export function getAvailableProvider(): string | null {
  for (const provider of providerPriority) {
    if (provider === 'google' && env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return 'google';
    }
    const key = `${provider.toUpperCase()}_API_KEY`;
    if ((env as any)[key]) {
      return provider;
    }
  }
  return null;
}
```

**Usage with Retry:**

```typescript
// File: apps/server/src/index.ts
import { getAvailableProvider, providerPriority } from '@sambungchat/env';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';

const providers = {
  google: () => google('gemini-2.5-flash'),
  openai: () => openai('gpt-4o-mini'),
  anthropic: () => anthropic('claude-3-5-sonnet-20241022'),
  groq: () => groq('llama-3.3-70b-versatile'),
};

async function streamWithFallback(messages: any[]) {
  // Try each provider in priority order
  for (const providerName of providerPriority) {
    try {
      const key =
        providerName === 'google'
          ? 'GOOGLE_GENERATIVE_AI_API_KEY'
          : `${providerName.toUpperCase()}_API_KEY`;

      if (!(process.env as any)[key]) {
        continue; // Skip if not configured
      }

      const model = wrapLanguageModel({
        model: providers[providerName as keyof typeof providers](),
        middleware: devToolsMiddleware(),
      });

      const result = await streamText({
        model,
        messages: await convertToModelMessages(messages),
      });

      return result; // Success!
    } catch (error) {
      console.warn(`❌ Provider ${providerName} failed, trying next...`, error);
      continue; // Try next provider
    }
  }

  throw new Error('All AI providers failed. Please check your configuration.');
}
```

**Use Cases:**

- High availability requirements
- Handling provider outages
- Graceful degradation
- Testing new providers alongside production

---

**Pattern 2: Load Balancing**

**Purpose:** Distribute requests across multiple providers based on weights

**Implementation:**

```typescript
// File: apps/server/src/index.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { env } from '@sambungchat/env';

interface ProviderConfig {
  name: string;
  weight: number; // For weighted load balancing
  model: () => any;
}

const providers: ProviderConfig[] = [
  { name: 'google', weight: 50, model: () => google('gemini-2.5-flash') },
  { name: 'openai', weight: 30, model: () => openai('gpt-4o-mini') },
  { name: 'anthropic', weight: 20, model: () => anthropic('claude-3-5-sonnet-20241022') },
];

// Simple load balancing based on weights
function selectProvider(): ProviderConfig {
  const totalWeight = providers.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;

  for (const provider of providers) {
    random -= provider.weight;
    if (random <= 0) {
      return provider;
    }
  }

  return providers[0]; // Fallback
}

// Select provider for each request
const selectedProvider = selectProvider();
const model = wrapLanguageModel({
  model: selectedProvider.model(),
  middleware: devToolsMiddleware(),
});

console.log(`🎯 Using provider: ${selectedProvider.name}`);
```

**Use Cases:**

- Distributing load across providers
- Cost optimization (mix expensive and cheap providers)
- A/B testing different models
- Avoiding rate limits

---

**Pattern 3: Cost-Based Routing**

**Purpose:** Automatically select the cheapest available provider

**Provider Costs (per 1M input tokens):**

```typescript
// Provider cost per 1M input tokens (approximate January 2026)
const providerCosts = {
  google: 0.075, // $0.075 per 1M tokens
  groq: 0.59, // $0.59 per 1M tokens
  openai: 0.15, // $0.15 per 1M tokens
  anthropic: 3.0, // $3.0 per 1M tokens
};
```

**Implementation:**

```typescript
// File: apps/server/src/index.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { env } from '@sambungchat/env';

// Provider costs (input tokens per 1M)
const providerCosts: Record<string, number> = {
  google: 0.075,
  groq: 0.59,
  openai: 0.15,
  anthropic: 3.0,
};

const providerModels = {
  google: () => google('gemini-2.5-flash'),
  groq: () => groq('llama-3.3-70b-versatile'),
  openai: () => openai('gpt-4o-mini'),
  anthropic: () => anthropic('claude-3-5-sonnet-20241022'),
};

function selectCheapestProvider(): string {
  // Filter to only available providers
  const availableProviders = Object.keys(providerCosts).filter((provider) => {
    if (provider === 'google') {
      return !!env.GOOGLE_GENERATIVE_AI_API_KEY;
    }
    const key = `${provider.toUpperCase()}_API_KEY`;
    return !!(env as any)[key];
  });

  if (availableProviders.length === 0) {
    throw new Error('No AI provider configured');
  }

  // Sort by cost (ascending) and return cheapest
  availableProviders.sort((a, b) => providerCosts[a] - providerCosts[b]);

  return availableProviders[0];
}

// Use cheapest provider
const cheapestProvider = selectCheapestProvider();
console.log(
  `💰 Using cheapest provider: ${cheapestProvider} ($${providerCosts[cheapestProvider]}/1M tokens)`
);

const model = wrapLanguageModel({
  model: providerModels[cheapestProvider as keyof typeof providerModels](),
  middleware: devToolsMiddleware(),
});
```

**Use Cases:**

- Cost-sensitive applications
- Budget optimization
- Non-critical workloads
- Batch processing

**Note:** These advanced patterns are optional. Most applications will use a single provider or simple provider selection (Options 1-3 above).

---

### 6.2 Complete Environment Variable Reference

This section provides a comprehensive reference of all environment variables for AI SDK-supported providers.

#### 6.2.1 Official Providers

| Provider           | Package                  | API Key Variable                                   | Base URL Variable        | Additional Variables                                     | Notes                            |
| ------------------ | ------------------------ | -------------------------------------------------- | ------------------------ | -------------------------------------------------------- | -------------------------------- |
| **OpenAI**         | `@ai-sdk/openai`         | `OPENAI_API_KEY`                                   | `OPENAI_BASE_URL`        | `OPENAI_ORGANIZATION`                                    | Most popular, wide model variety |
| **Anthropic**      | `@ai-sdk/anthropic`      | `ANTHROPIC_API_KEY`                                | `ANTHROPIC_BASE_URL`     | `ANTHROPIC_DANGEROUS_DIRECT_BROWSER_ACCESS`              | Claude models, 200K context      |
| **Google**         | `@ai-sdk/google`         | `GOOGLE_GENERATIVE_AI_API_KEY` or `GOOGLE_API_KEY` | `GOOGLE_API_BASE_URL`    | None                                                     | SambungChat's current provider   |
| **Groq**           | `@ai-sdk/groq`           | `GROQ_API_KEY`                                     | `GROQ_BASE_URL`          | None                                                     | Ultra-low latency (LPUs)         |
| **Azure OpenAI**   | `@ai-sdk/azure`          | `AZURE_OPENAI_API_KEY`                             | `AZURE_OPENAI_ENDPOINT`  | `AZURE_OPENAI_API_VERSION`, `AZURE_OPENAI_RESOURCE_NAME` | Enterprise, data residency       |
| **Mistral AI**     | `@ai-sdk/mistral`        | `MISTRAL_API_KEY`                                  | `MISTRAL_BASE_URL`       | None                                                     | European provider, multilingual  |
| **Cohere**         | `@ai-sdk/cohere`         | `COHERE_API_KEY`                                   | `COHERE_BASE_URL`        | None                                                     | Command R models, RAG-focused    |
| **Together AI**    | `@ai-sdk/togetherai`     | `TOGETHER_AI_API_KEY`                              | `TOGETHER_AI_BASE_URL`   | None                                                     | 100+ open-source models          |
| **Fireworks**      | `@ai-sdk/fireworks`      | `FIREWORKS_API_KEY`                                | `FIREWORKS_BASE_URL`     | None                                                     | Fast inference                   |
| **DeepSeek**       | `@ai-sdk/deepseek`       | `DEEPSEEK_API_KEY`                                 | `DEEPSEEK_BASE_URL`      | None                                                     | DeepSeek Chat/Coder models       |
| **Perplexity**     | `@ai-sdk/perplexity`     | `PERPLEXITY_API_KEY`                               | `PERPLEXITY_BASE_URL`    | None                                                     | Web search integrated            |
| **xAI**            | `@ai-sdk/xai`            | `XAI_API_KEY`                                      | `XAI_BASE_URL`           | None                                                     | Grok models                      |
| **Replicate**      | `@ai-sdk/replicate`      | `REPLICATE_API_TOKEN` (uses TOKEN)                 | `REPLICATE_API_BASE_URL` | None                                                     | Thousands of models              |
| **Amazon Bedrock** | `@ai-sdk/amazon-bedrock` | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`       | None                     | `AWS_REGION` (required)                                  | AWS-based, multiple models       |

**Special Cases:**

**Google Gemini - Two Variable Names:**

```bash
# Both variables work - GOOGLE_GENERATIVE_AI_API_KEY takes priority
GOOGLE_GENERATIVE_AI_API_KEY=your-key-here  # Preferred (more specific)
GOOGLE_API_KEY=your-key-here                # Also accepted
```

**Azure OpenAI - Multi-Variable Configuration:**

```bash
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_RESOURCE_NAME=your-resource-name
```

**Amazon Bedrock - AWS Credentials:**

```bash
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1  # Required
```

#### 6.2.2 Community Providers

| Provider       | Package                            | API Key Variable     | Base URL Variable     | Additional Variables | Notes                         |
| -------------- | ---------------------------------- | -------------------- | --------------------- | -------------------- | ----------------------------- |
| **Ollama**     | `ollama-ai-provider`               | None (local)         | `OLLAMA_BASE_URL`     | None                 | Defaults to `localhost:11434` |
| **OpenRouter** | `@openrouter/ai-sdk-provider`      | `OPENROUTER_API_KEY` | `OPENROUTER_BASE_URL` | None                 | 100+ models, single API       |
| **Letta**      | `@letta-ai/vercel-ai-sdk-provider` | `LETTA_API_KEY`      | `LETTA_BASE_URL`      | None                 | Memory-enhanced agents        |
| **Portkey**    | `@portkey-ai/vercel-provider`      | `PORTKEY_API_KEY`    | `PORTKEY_BASE_URL`    | None                 | Multi-provider gateway        |

**Ollama Configuration:**

```bash
# Ollama doesn't require an API key for local usage
OLLAMA_BASE_URL=http://localhost:11434  # Optional, default if not specified
```

#### 6.2.3 OpenAI-Compatible Providers

For custom or self-hosted providers using OpenAI-compatible APIs:

| Provider            | API Key Variable               | Base URL Variable        | Notes                                                     |
| ------------------- | ------------------------------ | ------------------------ | --------------------------------------------------------- |
| **LM Studio**       | `LM_STUDIO_API_KEY` (optional) | `LM_STUDIO_BASE_URL`     | Local development, defaults to `http://localhost:1234/v1` |
| **LocalAI**         | `LOCALAI_API_KEY` (optional)   | `LOCALAI_BASE_URL`       | Self-hosted, OpenAI alternative                           |
| **vLLM**            | `VLLM_API_KEY` (optional)      | `VLLM_BASE_URL`          | High-performance serving                                  |
| **Custom Endpoint** | `CUSTOM_OPENAI_API_KEY`        | `CUSTOM_OPENAI_BASE_URL` | Your custom provider                                      |

**Usage with OpenAI-Compatible Provider:**

```typescript
import { createOpenAI } from '@ai-sdk/openai';

// For LM Studio
const lmstudio = createOpenAI({
  baseURL: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234/v1',
  apiKey: process.env.LM_STUDIO_API_KEY || 'not-used', // LM Studio doesn't require a key
});

const model = lmstudio('your-model-name');
```

**For Ollama (OpenAI-Compatible Mode):**

```typescript
import { createOpenAI } from '@ai-sdk/openai';

const ollamaOpenAI = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  apiKey: 'ollama', // Required by API but not used
});

const model = ollamaOpenAI('llama3.2');
```

> **💡 Tip:** The OpenAI-compatible approach is recommended over the community provider for Ollama, as it's more actively maintained.

---

### 6.3 Environment File Templates

This section provides ready-to-use environment file templates for different scenarios.

#### 6.3.1 Complete .env.example

**Purpose:** Comprehensive template showing all providers with documentation

```bash
# =============================================================================
# AI Provider Configuration for SambungChat
# =============================================================================
# Configure at least one provider below for the application to work.
# Uncomment and fill in the credentials for the providers you want to use.

# ------------------------------------------------------------------------------
# OpenAI (https://platform.openai.com)
# ------------------------------------------------------------------------------
# Models: gpt-4o, gpt-4o-mini, o1-preview, o1-mini
# Pricing: ~$0.15-$15 per 1M input tokens
# Best for: General-purpose, most popular, wide model variety

# OPENAI_API_KEY=sk-your-openai-api-key-here
# OPENAI_BASE_URL=https://api.openai.com/v1  # Optional: Custom endpoint
# OPENAI_ORGANIZATION=org-your-org-id  # Optional: Organization ID

# ------------------------------------------------------------------------------
# Anthropic (https://console.anthropic.com)
# ------------------------------------------------------------------------------
# Models: claude-3-5-sonnet, claude-3-opus, claude-3-haiku
# Pricing: ~$3-$15 per 1M input tokens
# Best for: Complex reasoning, long context (200K), careful responses

# ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
# ANTHROPIC_BASE_URL=https://api.anthropic.com  # Optional: Custom endpoint

# ------------------------------------------------------------------------------
# Google Gemini (https://makersuite.google.com)
# ------------------------------------------------------------------------------
# Models: gemini-2.5-flash, gemini-2.5-pro
# Pricing: ~$0.075 per 1M input tokens (very cost-effective)
# Best for: Cost-performance balance, fast inference, multimodal
# Note: SambungChat currently uses this provider

# GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key-here
# Alternative: GOOGLE_API_KEY=your-google-api-key-here
# GOOGLE_API_BASE_URL=https://generativelanguage.googleapis.com  # Optional

# ------------------------------------------------------------------------------
# Groq (https://console.groq.com)
# ------------------------------------------------------------------------------
# Models: llama-3.3-70b, mixtral-8x7b, gemma-7b
# Pricing: ~$0.59 per 1M input tokens
# Best for: Ultra-low latency (LPUs), real-time applications

# GROQ_API_KEY=gsk-your-groq-api-key-here
# GROQ_BASE_URL=https://api.groq.com  # Optional: Custom endpoint

# ------------------------------------------------------------------------------
# Azure OpenAI (https://portal.azure.com)
# ------------------------------------------------------------------------------
# Models: Same as OpenAI but hosted on Azure
# Best for: Enterprise, data residency, compliance

# AZURE_OPENAI_API_KEY=your-azure-openai-api-key
# AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
# AZURE_OPENAI_API_VERSION=2024-02-01  # API version
# AZURE_OPENAI_RESOURCE_NAME=your-resource-name  # Your Azure resource

# ------------------------------------------------------------------------------
# Mistral AI (https://console.mistral.ai)
# ------------------------------------------------------------------------------
# Models: mistral-large, mistral-small, mistral-mini, codestral
# Pricing: ~$2-$4 per 1M input tokens
# Best for: European data residency, multilingual, code

# MISTRAL_API_KEY=your-mistral-api-key-here
# MISTRAL_BASE_URL=https://api.mistral.ai  # Optional

# ------------------------------------------------------------------------------
# Cohere (https://dashboard.cohere.com)
# ------------------------------------------------------------------------------
# Models: command-r, command-r-plus
# Pricing: ~$0.50-$3 per 1M input tokens
# Best for: RAG, enterprise search, document analysis

# COHERE_API_KEY=your-cohere-api-key-here
# COHERE_BASE_URL=https://api.cohere.ai  # Optional

# ------------------------------------------------------------------------------
# Together AI (https://api.together.xyz)
# ------------------------------------------------------------------------------
# Models: 100+ open-source models (Llama, Mixtral, Qwen, etc.)
# Pricing: ~$0.50-$2 per 1M input tokens
# Best for: Wide model selection, open-source, cost-effective

# TOGETHER_AI_API_KEY=your-together-ai-api-key-here
# TOGETHER_AI_BASE_URL=https://api.together.xyz  # Optional

# ------------------------------------------------------------------------------
# Ollama (https://ollama.com) - Local/Community Provider
# ------------------------------------------------------------------------------
# Models: llama3.2, mistral, codellama, and many more
# Pricing: Free (uses your own hardware)
# Best for: Local development, offline usage, privacy
# Note: Requires Ollama to be installed and running locally

# OLLAMA_BASE_URL=http://localhost:11434  # Optional: Default if not specified
# No API key required for local Ollama

# ------------------------------------------------------------------------------
# OpenRouter (https://openrouter.ai)
# ------------------------------------------------------------------------------
# Models: 100+ models from multiple providers via single API
# Pricing: Varies by model
# Best for: Access to many models without multiple API keys

# OPENROUTER_API_KEY=sk-or-your-openrouter-api-key-here
# OPENROUTER_BASE_URL=https://openrouter.ai/api  # Optional

# ------------------------------------------------------------------------------
# Replicate (https://replicate.com)
# ------------------------------------------------------------------------------
# Models: Thousands of models hosted on Replicate
# Pricing: Pay-per-use, varies by model
# Best for: Specialized models, custom models, wide variety

# REPLICATE_API_TOKEN=your-replicate-api-token-here  # Note: Uses TOKEN, not KEY
# REPLICATE_API_BASE_URL=https://api.replicate.com  # Optional

# ------------------------------------------------------------------------------
# Amazon Bedrock (https://aws.amazon.com/bedrock)
# ------------------------------------------------------------------------------
# Models: Titan, Claude, Llama, and more via AWS
# Best for: AWS users, enterprise, compliance

# AWS_ACCESS_KEY_ID=your-aws-access-key-id
# AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
# AWS_REGION=us-east-1  # Required: Your AWS region

# ------------------------------------------------------------------------------
# Multi-Provider Configuration (Optional)
# ------------------------------------------------------------------------------
# Uncomment the variables below to enable multi-provider features

# Primary provider selection
# AI_PROVIDER=openai  # Options: openai, anthropic, google, groq

# Provider priority for fallback (comma-separated, highest priority first)
# AI_PROVIDER_PRIORITY=google,openai,anthropic,groq

# Enable cost-based routing (selects cheapest available provider)
# AI_ENABLE_COST_ROUTING=false  # Set to 'true' to enable
```

**Usage:**

1. Copy this file to `.env` in your project root
2. Uncomment the provider(s) you want to use
3. Replace placeholder values with actual API keys
4. Add `.env` to `.gitignore` (never commit API keys)

---

#### 6.3.2 Minimal .env.example

**Purpose:** Simplified template for quick setup with 4 major providers

```bash
# AI Provider Configuration for SambungChat
# Configure at least one provider below

# Option 1: OpenAI (Recommended for general use)
# Models: gpt-4o-mini, gpt-4o, o1-mini
# Pricing: ~$0.15-$15 per 1M tokens
# OPENAI_API_KEY=sk-your-openai-api-key-here

# Option 2: Anthropic (Recommended for complex reasoning)
# Models: claude-3-5-sonnet, claude-3-opus, claude-3-haiku
# Pricing: ~$3-$15 per 1M tokens
# ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Option 3: Google Gemini (Current SambungChat default)
# Models: gemini-2.5-flash, gemini-2.5-pro
# Pricing: ~$0.075 per 1M tokens (very cost-effective)
# GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key-here

# Option 4: Groq (Recommended for low latency)
# Models: llama-3.3-70b, mixtral-8x7b, gemma-7b
# Pricing: ~$0.59 per 1M tokens
# GROQ_API_KEY=gsk-your-groq-api-key-here

# Optional: Specify primary provider
# AI_PROVIDER=google  # Options: openai, anthropic, google, groq
```

**Usage:**

Perfect for quickstarts and minimal configurations. Uncomment just one provider to get started.

---

#### 6.3.3 Development .env.local Template

**Purpose:** Template for local development environment with cost-saving defaults

```bash
# =============================================================================
# Development Environment Configuration for SambungChat
# =============================================================================
# This file is for local development only
# DO NOT commit this file to version control
# Add .env.local to .gitignore

# ------------------------------------------------------------------------------
# Environment
# ------------------------------------------------------------------------------
NODE_ENV=development
LOG_LEVEL=debug

# ------------------------------------------------------------------------------
# AI Provider (for local development)
# ------------------------------------------------------------------------------
# Use free/low-cost providers for development to save costs

# Option 1: Ollama (Free, requires local installation)
# Install from https://ollama.com, then run: ollama pull llama3.2
# OLLAMA_BASE_URL=http://localhost:11434

# Option 2: Google Gemini (Low cost, ~$0.075/M tokens)
GOOGLE_GENERATIVE_AI_API_KEY=your-dev-google-api-key-here

# Option 3: Groq (Low cost, very fast)
# GROQ_API_KEY=your-dev-groq-api-key-here

# ------------------------------------------------------------------------------
# Development Settings
# ------------------------------------------------------------------------------
# Enable AI SDK dev tools (request/response logging in browser)
AI_ENABLE_DEV_TOOLS=true

# Enable verbose error messages
AI_VERBOSE_ERRORS=true

# Rate limiting for development (requests per minute)
AI_RATE_LIMIT=10
```

**Best Practices for Development:**

- ✅ Use Google Gemini or Groq for low-cost development
- ✅ Use Ollama for offline development (free)
- ✅ Enable dev tools for debugging
- ✅ Set lower rate limits
- ❌ Don't use expensive providers (Anthropic Claude Opus) in development

---

#### 6.3.4 Production .env.production Template

**Purpose:** Template for production deployment with security best practices

```bash
# =============================================================================
# Production Environment Configuration for SambungChat
# =============================================================================
# This file is for production deployment
# Use strong, unique API keys and secure configuration

# ------------------------------------------------------------------------------
# Environment
# ------------------------------------------------------------------------------
NODE_ENV=production
LOG_LEVEL=warn  # Only warnings and errors in production

# ------------------------------------------------------------------------------
# AI Provider (Production)
# ------------------------------------------------------------------------------
# Use enterprise-grade providers for production

# Option 1: Anthropic Claude (Best for production quality)
# Models: claude-3-5-sonnet (recommended)
# ANTHROPIC_API_KEY=your-production-anthropic-api-key-here

# Option 2: OpenAI (Most popular, enterprise-ready)
# Models: gpt-4o-mini (recommended)
# OPENAI_API_KEY=your-production-openai-api-key-here

# Option 3: Google Gemini (Cost-effective, production-ready)
# Models: gemini-2.5-flash (current default)
GOOGLE_GENERATIVE_AI_API_KEY=your-production-google-api-key-here

# ------------------------------------------------------------------------------
# Production Settings
# ------------------------------------------------------------------------------
# Disable AI SDK dev tools in production
AI_ENABLE_DEV_TOOLS=false

# Disable verbose errors in production (security)
AI_VERBOSE_ERRORS=false

# Production rate limiting (adjust based on your plan)
AI_RATE_LIMIT=60

# ------------------------------------------------------------------------------
# Monitoring and Observability (Optional but Recommended)
# ------------------------------------------------------------------------------
# Enable error tracking
# SENTRY_DSN=your-sentry-dsn-here

# Enable metrics collection
# AI_ENABLE_METRICS=true
# AI_METRICS_ENDPOINT=https://your-metrics-endpoint.com

# Enable distributed tracing
# ENABLE_TRACING=true
```

**Production Best Practices:**

- ✅ Use production-grade API keys (not dev keys)
- ✅ Disable dev tools and verbose errors
- ✅ Implement rate limiting
- ✅ Set up monitoring and alerting
- ✅ Use secrets management (AWS Secrets Manager, etc.)
- ✅ Rotate keys regularly (every 90 days)
- ✅ Implement budget alerts
- ❌ Never commit production `.env` files

---

### 6.4 Updating Environment Schema

This section shows how to update the SambungChat environment schema to support multiple AI providers.

#### 6.4.1 Current Schema Review

**Current State (January 2026):**

The `packages/env/src/server.ts` file currently has:

- Minimal AI provider configuration
- Google Gemini variables may or may not be present
- No validation for AI provider keys

**Action Required:**

Update the schema to support multiple providers with proper validation.

---

#### 6.4.2 Schema Update Steps

Follow these steps to update the environment schema:

**Step 1: Choose Your Validation Strategy**

Refer to Section 6.1.2 and choose one of the three options:

- **Option 1:** All Optional (Maximum Flexibility)
- **Option 2:** At Least One Required (Recommended for Production)
- **Option 3:** Provider Selection with Validation

**Step 2: Update packages/env/src/server.ts**

Open `packages/env/src/server.ts` and add AI provider variables to the schema:

```typescript
// File: packages/env/src/server.ts
import { z } from 'zod';

// Add AI provider variables to the existing schema
const envSchema = z.object({
  // ... existing variables (PORT, DATABASE_URL, etc.) ...

  // AI Provider Configuration
  AI_PROVIDER: z.enum(['openai', 'anthropic', 'google', 'groq']).default('google').optional(),

  // Provider API Keys
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),

  // Optional: Provider-specific configuration
  OPENAI_BASE_URL: z.string().url().optional(),
  OPENAI_ORGANIZATION: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().url().optional(),
  GOOGLE_API_BASE_URL: z.string().url().optional(),
  GROQ_BASE_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
```

**Step 3: Export Typed Environment**

```typescript
// Export for use in server code
export type Env = z.infer<typeof envSchema>;

// Re-export for convenience
export { env };
```

**Step 4: Update Import in Server Code**

```typescript
// File: apps/server/src/index.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { env } from '@sambungchat/env';

// Access provider configuration
const provider = env.AI_PROVIDER || 'google';

// Use environment variables
if (provider === 'openai' && env.OPENAI_API_KEY) {
  const model = openai('gpt-4o-mini');
  // ...
} else if (provider === 'google' && env.GOOGLE_GENERATIVE_AI_API_KEY) {
  const model = google('gemini-2.5-flash');
  // ...
}
```

---

#### 6.4.3 Validation Implementation

**Complete Example with Validation (Option 2: At Least One Required):**

```typescript
// File: packages/env/src/server.ts
import { z } from 'zod';

const envSchema = z
  .object({
    // ... existing variables ...

    // AI Provider Configuration
    AI_PROVIDER: z.enum(['openai', 'anthropic', 'google', 'groq']).default('google'),

    // Provider API Keys
    OPENAI_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
    GROQ_API_KEY: z.string().min(1).optional(),

    // Optional configuration
    OPENAI_BASE_URL: z.string().url().optional(),
    ANTHROPIC_BASE_URL: z.string().url().optional(),
    GOOGLE_API_BASE_URL: z.string().url().optional(),
    GROQ_BASE_URL: z.string().url().optional(),
  })
  .refine(
    (data) => {
      // At least one provider must be configured
      return !!(
        data.OPENAI_API_KEY ||
        data.ANTHROPIC_API_KEY ||
        data.GOOGLE_GENERATIVE_AI_API_KEY ||
        data.GROQ_API_KEY
      );
    },
    {
      message:
        'At least one AI provider API key is required. Please configure OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GROQ_API_KEY in your environment.',
    }
  )
  .refine(
    (data) => {
      // Validate that the selected provider has its API key configured
      const providerKeyMap = {
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        google: 'GOOGLE_GENERATIVE_AI_API_KEY',
        groq: 'GROQ_API_KEY',
      };

      const requiredKey = providerKeyMap[data.AI_PROVIDER];
      return !!(data as any)[requiredKey];
    },
    {
      message: (data) =>
        `API key required for selected provider '${data.AI_PROVIDER}'. Please set ${data.AI_PROVIDER === 'google' ? 'GOOGLE_GENERATIVE_AI_API_KEY' : data.AI_PROVIDER.toUpperCase() + '_API_KEY'} in your environment.`,
    }
  );

try {
  export const env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorMessages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
    console.error('❌ Invalid environment configuration:\n', errorMessages);
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
  throw error;
}

export type Env = z.infer<typeof envSchema>;
```

**Testing the Schema:**

```bash
# Test 1: Missing all API keys (should fail)
> bun run dev
❌ Invalid environment configuration:
: At least one AI provider API key is required. Please configure OPENAI_API_KEY,
ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GROQ_API_KEY in your environment.

💡 Please check your .env file and ensure all required variables are set.

# Test 2: Selected provider missing API key (should fail)
> AI_PROVIDER=openai GOOGLE_GENERATIVE_AI_API_KEY=abc bun run dev
❌ Invalid environment configuration:
: API key required for selected provider 'openai'. Please set OPENAI_API_KEY in your environment.

💡 Either set OPENAI_API_KEY or change AI_PROVIDER to a configured provider.

# Test 3: Valid configuration (should succeed)
> GOOGLE_GENERATIVE_AI_API_KEY=abc bun run dev
✅ Server started successfully on port 3000
```

---

### 6.5 Security Best Practices

This section covers essential security practices for managing AI provider API keys.

#### 6.5.1 API Key Management Principles

**1. Never Commit API Keys to Version Control**

Always use `.env` files (never commit these). Add `.env` to `.gitignore`. Commit `.env.example` with placeholder values.

**Example .gitignore:**

```gitignore
# Environment variables
.env
.env.local
.env.*.local
.env.production
.env.staging
.env.development

# But keep .env.example
# .env.example ✓ (commit this)
```

**Example .env.example (Good):**

```bash
# Good: Placeholder values (not real keys)
OPENAI_API_KEY=sk-your-openai-api-key-here
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key-here
```

**Example .env (Bad - Never Commit):**

```bash
# Bad: Never commit actual keys
# OPENAI_API_KEY=sk-abc123realkey...  ✗ Don't do this
```

**2. Use Environment-Specific Keys**

- **Development:** Use test/restricted keys with low limits
- **Staging:** Use staging keys if available
- **Production:** Use production keys with strict limits

**3. Implement Key Rotation**

- Rotate keys regularly (e.g., every 90 days)
- Document rotation procedures
- Use secrets management services for automatic rotation

**4. Monitor API Key Usage**

- Set up usage alerts
- Monitor for unusual activity
- Implement rate limiting per application

---

#### 6.5.2 Environment-Specific Configuration

**Development Environment:**

```bash
# .env.development
AI_PROVIDER=google  # Use cost-effective provider for dev
GOOGLE_GENERATIVE_AI_API_KEY=dev-key-with-limits
AI_ENABLE_DEV_TOOLS=true
AI_RATE_LIMIT=10  # Low limit for dev
```

**Staging Environment:**

```bash
# .env.staging
AI_PROVIDER=anthropic  # Use production-like provider
ANTHROPIC_API_KEY=staging-key
AI_ENABLE_DEV_TOOLS=false
AI_RATE_LIMIT=30
```

**Production Environment:**

```bash
# .env.production
AI_PROVIDER=anthropic  # Best quality for production
ANTHROPIC_API_KEY=prod-key-with-strict-limits
AI_ENABLE_DEV_TOOLS=false
AI_RATE_LIMIT=60
AI_ENABLE_METRICS=true
```

**Deployment Script Example:**

```typescript
// File: scripts/load-env.ts
import { dotenv } from 'dotenv';
import { resolve } from 'path';

const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;

// Load environment-specific file
dotenv({ path: resolve(process.cwd(), envFile) });

console.log(`✅ Loaded ${env} environment from ${envFile}`);
```

---

#### 6.5.3 Secret Rotation Strategies

**Strategy 1: Versioned Keys**

```bash
# Support multiple key versions for zero-downtime rotation
OPENAI_API_KEY_V1=sk-old-key
OPENAI_API_KEY_V2=sk-new-key
OPENAI_API_KEY_VERSION=2  # Use V2
```

```typescript
// Application code
const apiKeyVersion = env.OPENAI_API_KEY_VERSION || '1';
const apiKey = env[`OPENAI_API_KEY_V${apiKeyVersion}`];
```

**Strategy 2: Secrets Management Service**

```typescript
// Using AWS Secrets Manager
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({});

async function getApiKey() {
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: 'sambungchat/ai-providers' })
  );

  const secret = JSON.parse(response.SecretString || '{}');
  return secret.OPENAI_API_KEY;
}
```

**Strategy 3: Rotation Schedule**

- **Development:** Rotate every 30 days
- **Staging:** Rotate every 60 days
- **Production:** Rotate every 90 days

**Rotation Checklist:**

1. Generate new API key in provider dashboard
2. Add new key to environment (keep old key)
3. Deploy with new key
4. Test application functionality
5. Remove old key from provider dashboard (after 24-48 hours)
6. Remove old key from environment
7. Document rotation

---

#### 6.5.4 Access Control and Permissions

**1. Principle of Least Privilege**

Only grant necessary permissions. Use scoped API keys when available. Set usage limits and quotas.

**2. API Key Scoping (Provider-Specific)**

**OpenAI:**

```bash
# Create scoped keys with limited permissions
# https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...  # Project-scoped key
```

**Anthropic:**

```bash
# Create keys with budget limits
# https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-...  # Can set monthly budget limits
```

**Google:**

```bash
# Restrict key to specific APIs
# https://console.cloud.google.com/apis/credentials
GOOGLE_GENERATIVE_AI_API_KEY=AIza...  # Restrict to Generative Language API
```

**3. Rate Limiting by Application**

```typescript
// Implement rate limiting per user/session
import { Ratelimit } from '@unkey/ratelimit';

const ratelimit = new Ratelimit({
  namespace: 'sambungchat-ai',
  limit: 10, // 10 requests
  duration: '60s', // per minute
  async identifier(userId) {
    return userId; // Rate limit per user
  },
});

// Usage
const { success } = await ratelimit.limit(userId);
if (!success) {
  throw new Error('Rate limit exceeded. Please try again later.');
}
```

**4. IP Whitelisting (if supported)**

Some providers allow IP whitelisting. Configure in provider dashboard:

- Only allow requests from your server IPs
- Block requests from unknown IPs

**5. Audit Logging**

```typescript
// Log API key usage for security auditing
import { logger } from "./logger";

function auditLog(provider: string, model: string, userId: string) {
  logger.info({
    event: "ai_api_call",
    provider,
    model,
    userId,
    timestamp: new Date().toISOString(),
    // Don't log sensitive data

[⬆ Back to Top](#table-of-contents)
  });
}

// Usage
auditLog("openai", "gpt-4o-mini", userId);
```

---

## Summary

In this section, you learned:

✅ **Environment Variable Design Patterns**

- Standard naming conventions ({PROVIDER}\_API_KEY)
- Multiple patterns for different providers
- Base URL and configuration variables

✅ **Validation Strategies**

- Three options: all optional, at least one required, provider selection
- Trade-offs and use cases for each approach
- Complete code examples with error handling

✅ **Complete Provider Reference**

- 14 official providers with environment variables
- Community providers (Ollama, OpenRouter, Letta, Portkey)
- OpenAI-compatible providers for custom endpoints

✅ **Ready-to-Use Templates**

- Complete .env.example (all providers documented)
- Minimal .env.example (quick start)
- Development .env.local (cost-saving)
- Production .env.production (security-focused)

✅ **Schema Updates**

- Step-by-step guide to update packages/env/src/server.ts
- Complete validation implementation
- Testing procedures

✅ **Security Best Practices**

- API key management principles
- Environment-specific configuration
- Secret rotation strategies
- Access control and permissions
- Rate limiting and audit logging

---

# 7. Testing and Validation

> 📍 **Navigation:** [Table of Contents](#table-of-contents) → [Section 6](#6-environment-configuration) → **Section 7**

Comprehensive testing procedures for validating AI provider integrations and ensuring production readiness.

## Overview

Testing is a critical step in integrating any AI provider. This section provides:

- **Step-by-step testing procedures** - From basic connectivity to production validation
- **Manual testing guides** - How to manually test each integration component
- **Automated testing examples** - Unit tests, integration tests, and end-to-end tests
- **Performance testing** - Response time, throughput, and cost validation
- **Troubleshooting** - Common issues and their solutions

**Time Investment:** 30-60 minutes for comprehensive testing

**Prerequisites:**

- Provider integration implemented (Section 4)
- Environment variables configured (Section 6)
- Server running locally
- cURL or Postman for API testing

---

## 7.1 Testing Strategy Overview

### Testing Pyramid

```
        ┌──────────────┐
        │   Manual     │  ← User acceptance testing
        │   Testing    │
        ├──────────────┤
        │ Integration  │  ← API endpoint testing
        │   Testing    │
        ├──────────────┤
        │   Unit       │  ← Component testing
        │   Testing    │
        └──────────────┘
```

### Testing Levels

| Level                 | Purpose                     | Tools              | Time      |
| --------------------- | --------------------------- | ------------------ | --------- |
| **Unit Tests**        | Test individual functions   | Vitest, Jest       | 5-10 min  |
| **Integration Tests** | Test API endpoints          | Supertest, cURL    | 10-15 min |
| **Manual Tests**      | Verify user experience      | Browser, cURL      | 10-20 min |
| **Performance Tests** | Validate response times     | cURL, Apache Bench | 5-10 min  |
| **Production Tests**  | Verify production readiness | Monitoring tools   | Ongoing   |

### Testing Checklist

- [ ] Server starts without errors
- [ ] Health check endpoint responds
- [ ] Model info endpoint returns correct data
- [ ] Simple AI request succeeds
- [ ] Multi-turn conversation works
- [ ] Streaming responses work correctly
- [ ] Error handling works (empty messages, invalid format)
- [ ] Long messages handled properly
- [ ] Special characters and Unicode work
- [ ] Rate limiting handled gracefully
- [ ] Provider-specific features work
- [ ] Environment variables validated
- [ ] Frontend integration works
- [ ] Performance benchmarks acceptable

---

## 7.2 Manual Testing Procedures

### Test Environment Setup

**Before testing, ensure:**

```bash
# 1. Install dependencies
cd apps/server
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Start development server
npm run dev

# 4. Verify server is running
curl http://localhost:3001/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "provider": "your-provider-name"
}
```

---

### Test 1: Server Startup Validation

**Purpose:** Verify server starts without errors and loads provider configuration

**Steps:**

1. Start the server:

   ```bash
   npm run dev
   ```

2. Check console output for:
   - ✅ Server listening on port 3001
   - ✅ Provider loaded successfully
   - ✅ No error messages
   - ✅ Environment variables loaded

3. Common startup errors:

   | Error                                   | Cause                          | Solution                             |
   | --------------------------------------- | ------------------------------ | ------------------------------------ |
   | `Cannot find module '@ai-sdk/provider'` | Provider package not installed | Run `npm install @ai-sdk/provider`   |
   | `API_KEY is not defined`                | Environment variable missing   | Check `.env.local` configuration     |
   | `Invalid API key`                       | Incorrect API key format       | Verify API key in provider dashboard |
   | `Port 3001 already in use`              | Port conflict                  | Kill existing process or change port |

**Success Criteria:**

- Server starts without errors
- Provider is initialized correctly
- Health endpoint is accessible

---

### Test 2: Health Check Endpoint

**Purpose:** Verify server health and provider configuration

**cURL Command:**

```bash
curl http://localhost:3001/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "timestamp": "2025-01-12T10:30:00.000Z"
}
```

**Verification Checklist:**

- [ ] HTTP status code is 200
- [ ] Response JSON is valid
- [ ] `status` field is "ok"
- [ ] `provider` field matches your provider
- [ ] `model` field shows correct model ID
- [ ] Response time is under 100ms

**Alternative Testing Methods:**

```bash
# Using httpie
http GET http://localhost:3001/health

# Using wget
wget -qO- http://localhost:3001/health

# Using browser
# Navigate to http://localhost:3001/health
```

---

### Test 3: Model Info Endpoint

**Purpose:** Verify available models are correctly listed

**cURL Command:**

```bash
curl http://localhost:3001/ai/models
```

**Expected Response:**

```json
{
  "provider": "openai",
  "models": [
    {
      "id": "gpt-4o-mini",
      "name": "GPT-4o Mini",
      "context": 128000,
      "description": "Fast and efficient model for most tasks"
    },
    {
      "id": "gpt-4o",
      "name": "GPT-4o",
      "context": 128000,
      "description": "Latest multimodal model"
    }
  ],
  "count": 2
}
```

**Verification Checklist:**

- [ ] HTTP status code is 200
- [ ] Response includes provider name
- [ ] Models array is not empty
- [ ] Each model has required fields (id, name, context)
- [ ] Model IDs match provider documentation
- [ ] Context window sizes are correct

**Provider-Specific Model Verification:**

| Provider  | Expected Models                                       | Verification                                                                     |
| --------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| OpenAI    | gpt-4o, gpt-4o-mini, o1-mini                          | Check [OpenAI models](https://platform.openai.com/docs/models)                   |
| Anthropic | claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022 | Check [Anthropic models](https://docs.anthropic.com/en/docs/about-claude/models) |
| Google    | gemini-2.5-flash, gemini-2.5-pro                      | Check [Google models](https://ai.google.dev/gemini-api/docs/models)              |
| Groq      | llama-3.3-70b-versatile, mixtral-8x7b-32768           | Check [Groq models](https://console.groq.com/docs/models)                        |
| Ollama    | llama3.2, mistral, gemma2                             | Run `ollama list` locally                                                        |

---

### Test 4: Simple AI Request

**Purpose:** Verify basic AI functionality

**cURL Command:**

```bash
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Say hello and nothing else"
      }
    ]
  }'
```

**Expected Response (Streaming):**

```
data: {"type":"text","text":"Hello"}

data: {"type":"finish","finishReason":"stop","usage":{"promptTokens":10,"completionTokens":1}}

```

**Verification Checklist:**

- [ ] HTTP status code is 200
- [ ] Response is streaming (Server-Sent Events format)
- [ ] Response contains text content
- [ ] Response is brief (matches prompt constraint)
- [ ] Streaming works (multiple `data:` lines)
- [ ] Finish reason is "stop" (normal completion)
- [ ] Usage statistics included (promptTokens, completionTokens)

**Testing Different Prompt Types:**

```bash
# Test 1: Simple question
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is 2+2?"}]}'

# Test 2: Code generation
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Write a hello world function in JavaScript"}]}'

# Test 3: Long-form response
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Explain quantum computing in simple terms"}]}'
```

---

### Test 5: Multi-Turn Conversation

**Purpose:** Verify conversation context is maintained

**cURL Command:**

```bash
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "My name is Alice"
      },
      {
        "role": "assistant",
        "content": "Hello Alice! Nice to meet you."
      },
      {
        "role": "user",
        "content": "What is my name?"
      }
    ]
  }'
```

**Expected Response:**

```
data: {"type":"text","text":"Your name is Alice."}

...
```

**Verification Checklist:**

- [ ] Response correctly identifies the name as "Alice"
- [ ] Conversation context is maintained across turns
- [ ] Assistant responses from history are used for context
- [ ] No confusion about user identity

**Testing Context Retention:**

```bash
# Test with longer conversation history
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Remember the number 42"},
      {"role": "assistant", "content": "I will remember 42"},
      {"role": "user", "content": "Remember the color blue"},
      {"role": "assistant", "content": "I will remember blue"},
      {"role": "user", "content": "What number and color did I ask you to remember?"}
    ]
  }'
```

**Expected:** Response should include both "42" and "blue"

---

### Test 6: Error Handling - Empty Messages

**Purpose:** Verify error handling for invalid input

**cURL Command:**

```bash
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": []
  }'
```

**Expected Response:**

```json
{
  "error": "Invalid request: messages array required"
}
```

**Verification Checklist:**

- [ ] HTTP status code is 400 (Bad Request)
- [ ] Error message is clear and descriptive
- [ ] Response is JSON (not streaming)
- [ ] No server crash or timeout

**Additional Error Tests:**

```bash
# Test: Missing messages field
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{}'

# Test: Invalid message format
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user"}]}'

# Test: Invalid role
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"invalid","content":"test"}]}'
```

---

### Test 7: Error Handling - Invalid Format

**Purpose:** Verify JSON validation works

**cURL Command:**

```bash
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

**Expected Response:**

```json
{
  "error": "Invalid JSON"
}
```

**Verification Checklist:**

- [ ] HTTP status code is 400
- [ ] Error message indicates JSON parsing issue
- [ ] No server crash
- [ ] Response is immediate (no timeout)

---

### Test 8: Long Message Handling

**Purpose:** Verify provider handles long messages correctly

**cURL Command:**

```bash
# Generate a 1000-character message
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d "{
    \"messages\": [
      {
        \"role\": \"user\",
        \"content\": \"$(printf 'A%.0s' {1..1000})\"
      }
    ]
  }"
```

**Or use a pre-written long message:**

```bash
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. [repeat to 1000+ chars]"
      }
    ]
  }'
```

**Verification Checklist:**

- [ ] Request processes successfully
- [ ] Response is generated (may be truncated)
- [ ] No "request too large" error for reasonable sizes
- [ ] Streaming works for long responses
- [ ] Token usage is tracked correctly

**Testing Context Limits:**

```bash
# Test near context window limit (varies by provider)
# For GPT-4o-mini (128K tokens), send a very long message

# Generate a message with ~100K tokens (extremely long)
# This should work but may be slow
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  --max-time 120 \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Extremely long message..."
      }
    ]
  }'
```

---

### Test 9: Special Characters and Unicode

**Purpose:** Verify provider handles various character encodings

**cURL Command:**

```bash
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hello 世界! 🌍🚀 Testing émojis Ñoñoñño"
      }
    ]
  }'
```

**Verification Checklist:**

- [ ] Request processes successfully
- [ ] Special characters are preserved
- [ ] Unicode emojis are handled correctly
- [ ] Response encoding is correct
- [ ] No character corruption

**Additional Character Tests:**

```bash
# Test 1: Mathematical symbols
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"∫ x² dx = ?"}]}'

# Test 2: Right-to-left text (Arabic, Hebrew)
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"مرحبا بالعالم"}]}'

# Test 3: Code snippets with special chars
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"const regex = /<[^>]+>/g;"}]}'

# Test 4: Zero-width characters
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Test\u200Bzero\u200Bwidth"}]}'
```

---

### Test 10: Streaming Response Validation

**Purpose:** Verify streaming works correctly end-to-end

**cURL Command:**

```bash
curl -N -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Count from 1 to 10, one number per line"
      }
    ]
  }'
```

**Expected Output:**

```
data: {"type":"text","text":"1\n"}

data: {"type":"text","text":"2\n"}

data: {"type":"text","text":"3\n"}

...

data: {"type":"finish","finishReason":"stop","usage":{"promptTokens":20,"completionTokens":15}}
```

**Verification Checklist:**

- [ ] Response is streaming (chunks arrive incrementally)
- [ ] Each chunk is valid JSON
- [ ] Chunks are separated by newlines
- [ ] Streaming feels responsive (no long pauses)
- [ ] Final message includes `finish` event
- [ ] Usage statistics are accurate
- [ ] Total completion tokens ≈ sum of chunk tokens

**Testing Streaming Latency:**

```bash
# Measure time to first token
time curl -N -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello"}]}' \
  | head -n 1
```

**Expected:** First chunk should arrive within 500ms (varies by provider)

---

### Test 11: Frontend Integration

**Purpose:** Verify frontend Chat component works with new provider

**Setup:**

1. Start the server:

   ```bash
   cd apps/server
   npm run dev
   ```

2. Start the frontend (in separate terminal):

   ```bash
   cd apps/web
   npm run dev
   ```

3. Open browser to `http://localhost:5173/ai`

**Testing in Browser:**

1. **Send a simple message:**
   - Type "Hello!" in the chat input
   - Press Enter
   - ✅ Verify: Message appears in chat
   - ✅ Verify: AI response streams in
   - ✅ Verify: No console errors

2. **Send multiple messages:**
   - Send 3-4 messages in sequence
   - ✅ Verify: Conversation context maintained
   - ✅ Verify: Each response is unique

3. **Check browser console:**
   - Open DevTools (F12)
   - Go to Console tab
   - ✅ Verify: No error messages
   - ✅ Verify: Network requests to `/ai` endpoint succeed

4. **Check network tab:**
   - Open Network tab in DevTools
   - Filter by `/ai`
   - Click on the request
   - ✅ Verify: Request payload contains messages array
   - ✅ Verify: Response type is `text/event-stream`
   - ✅ Verify: Status code is 200

**Common Frontend Issues:**

| Issue                  | Cause                        | Solution                            |
| ---------------------- | ---------------------------- | ----------------------------------- |
| CORS error             | Server CORS misconfigured    | Check `cors()` middleware in server |
| Messages not appearing | Frontend not handling stream | Check `Chat` component setup        |
| Context not maintained | Messages not sent correctly  | Verify request payload format       |
| Very slow responses    | Network or provider issue    | Check Network tab for timing        |

---

### Test 12: Rate Limiting (if applicable)

**Purpose:** Verify rate limiting is handled gracefully

**Test:**

```bash
# Send 10 rapid requests
for i in {1..10}; do
  curl -X POST http://localhost:3001/ai \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"Say hi"}]}' &
done
wait
```

**Expected Behavior:**

- **With rate limiting:** Some requests may return 429 (Too Many Requests)
- **Without rate limiting:** All requests should succeed (but may be slow)

**Verification Checklist:**

- [ ] Server doesn't crash under load
- [ ] Rate limit errors (if any) are clear
- [ ] Retry-after header is set (if rate limited)
- [ ] Requests are queued or rejected gracefully

**Provider Rate Limits (as of 2025):**

| Provider  | Free Tier  | Paid Tier      | Error Code |
| --------- | ---------- | -------------- | ---------- |
| OpenAI    | 3 req/min  | 10,000 req/min | 429        |
| Anthropic | 5 req/min  | 50+ req/min    | 429        |
| Google    | 15 req/min | 60+ req/min    | 429        |
| Groq      | 30 req/min | 60+ req/min    | 429        |
| Ollama    | Unlimited  | Unlimited      | N/A        |

---

## 7.3 Automated Testing

### Unit Testing

**Purpose:** Test individual functions and components

**Setup:**

```bash
# Install testing dependencies
npm install --save-dev vitest @vitest/coverage-v8
```

**Example Unit Test:**

```typescript
// tests/provider.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

describe('Provider Initialization', () => {
  it('should create OpenAI model', () => {
    const model = openai('gpt-4o-mini', {
      apiKey: 'test-key',
    });

    expect(model).toBeDefined();
    expect(model.modelId).toBe('gpt-4o-mini');
  });

  it('should create Anthropic model', () => {
    const model = anthropic('claude-3-5-sonnet-20241022', {
      apiKey: 'test-key',
    });

    expect(model).toBeDefined();
    expect(model.modelId).toBe('claude-3-5-sonnet-20241022');
  });

  it('should fail with invalid API key', async () => {
    const model = openai('gpt-4o-mini', {
      apiKey: 'invalid-key',
    });

    // This should fail when making a request
    await expect(generateText({ model, prompt: 'test' })).rejects.toThrow();
  });
});
```

**Run Unit Tests:**

```bash
npm run test
```

---

### Integration Testing

**Purpose:** Test API endpoints with real HTTP requests

**Setup:**

```bash
npm install --save-dev supertest
```

**Example Integration Test:**

```typescript
// tests/integration/ai-endpoint.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../server';
import { request } from 'supertest';

describe('AI Endpoint Integration', () => {
  let app: any;

  beforeAll(() => {
    app = buildApp();
  });

  afterAll(() => {
    // Cleanup
  });

  it('should return health check', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.provider).toBeDefined();
  });

  it('should handle simple AI request', async () => {
    const response = await request(app)
      .post('/ai')
      .send({
        messages: [{ role: 'user', content: 'Say hello' }],
      })
      .expect(200);

    expect(response.text).toContain('hello');
  });

  it('should reject empty messages', async () => {
    const response = await request(app).post('/ai').send({ messages: [] }).expect(400);

    expect(response.body.error).toContain('Invalid request');
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
});
```

**Run Integration Tests:**

```bash
npm run test:integration
```

---

### End-to-End Testing

**Purpose:** Test complete user flows

**Example E2E Test:**

```typescript
// tests/e2e/chat-flow.test.ts
import { describe, it, expect } from 'vitest';
import { chromium } from 'playwright';

describe('Chat Flow E2E', () => {
  it('should complete a chat conversation', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Navigate to chat page
    await page.goto('http://localhost:5173/ai');

    // Wait for chat input to be ready
    await page.waitForSelector('input[type="text"]');

    // Type a message
    await page.fill('input[type="text"]', 'Hello!');

    // Send message
    await page.press('input[type="text"]', 'Enter');

    // Wait for AI response
    await page.waitForSelector('.ai-message');

    // Verify response
    const response = await page.textContent('.ai-message');
    expect(response).toBeTruthy();
    expect(response?.toLowerCase()).toContain('hello');

    await browser.close();
  });
});
```

**Run E2E Tests:**

```bash
npm run test:e2e
```

---

### Test Script Automation

**Purpose:** Run all manual tests automatically

**Example Test Script (based on examples):**

```bash
#!/bin/bash

# AI Provider Integration Test Script
# Tests all aspects of provider integration

set -e

BASE_URL="${BASE_URL:-http://localhost:3001}"
echo "🧪 Testing AI Provider Integration at $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $2"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ FAIL${NC}: $2"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# Test 1: Health check
echo "Test 1: Health check endpoint"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  print_result 0 "Health check returns 200"
else
  print_result 1 "Health check failed with HTTP $http_code"
fi
echo ""

# Test 2: Simple AI request
echo "Test 2: Simple AI request"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/ai" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello"}]}' \
  --max-time 30)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
  print_result 0 "Simple AI request successful"
else
  print_result 1 "Simple AI request failed with HTTP $http_code"
fi
echo ""

# ... more tests ...

# Summary
echo ""
echo "==================================="
echo "Test Summary:"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo "==================================="

if [ $TESTS_FAILED -gt 0 ]; then
  exit 1
fi
```

**Usage:**

```bash
# Make script executable
chmod +x test.sh

# Run tests
./test.sh

# Or run with custom URL
BASE_URL=http://localhost:3001 ./test.sh
```

---

## 7.4 Performance Testing

### Response Time Testing

**Purpose:** Measure response times and identify bottlenecks

**Test 1: Time to First Token (TTFT)**

```bash
# Measure time to first chunk
time curl -N -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello"}]}' \
  | head -n 1
```

**Benchmark Targets (as of 2025):**

| Provider  | Target TTFT | Notes                    |
| --------- | ----------- | ------------------------ |
| Groq      | < 100ms     | Ultra-fast LPU inference |
| Google    | < 500ms     | Fast Gemini models       |
| OpenAI    | < 1000ms    | GPT-4o-mini              |
| Anthropic | < 1000ms    | Claude 3.5 Sonnet        |
| Ollama    | Varies      | Hardware-dependent       |

---

**Test 2: Total Response Time**

```bash
# Measure complete request time
time curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Count to 10"}]}'
```

---

**Test 3: Throughput Testing**

```bash
# Send 100 requests and measure average time
for i in {1..100}; do
  curl -X POST http://localhost:3001/ai \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"Hi"}]}' \
    -w "%{time_total}\n" \
    -o /dev/null \
    -s
done | awk '{sum+=$1; count++} END {print "Average:", sum/count, "seconds"}'
```

---

### Load Testing

**Purpose:** Test server under concurrent load

**Using Apache Bench:**

```bash
# Install ab
sudo apt-get install apache2-utils  # Ubuntu/Debian
brew install apache2                 # macOS

# Run load test: 100 requests, 10 concurrent
ab -n 100 -c 10 -p request.json -T application/json \
  http://localhost:3001/ai
```

**request.json:**

```json
{
  "messages": [{ "role": "user", "content": "Say hello" }]
}
```

**Expected Output:**

```
Concurrency Level:      10
Time taken for tests:   5.234 seconds
Complete requests:      100
Failed requests:        0
Total transferred:      45000 bytes
Requests per second:    19.11 [#/sec] (mean)
Time per request:       523.406 [ms] (mean)
```

---

**Using wrk (modern alternative):**

```bash
# Install wrk
brew install wrk  # macOS
# or
sudo apt-get install wrk  # Ubuntu/Debian

# Run load test
wrk -t4 -c100 -d30s --latency \
  -s request.lua \
  http://localhost:3001/ai
```

**request.lua:**

```lua
wrk.method = "POST"
wrk.body   = '{"messages":[{"role":"user","content":"Hi"}]}'
wrk.headers["Content-Type"] = "application/json"
```

---

### Memory Testing

**Purpose:** Monitor memory usage during requests

**Test:**

```bash
# Monitor server memory while sending requests
# In one terminal, start monitoring:
watch -n 1 'ps aux | grep "node.*server" | awk "{print \$6}"'

# In another terminal, send requests:
for i in {1..100}; do
  curl -X POST http://localhost:3001/ai \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"Test"}]}'
done
```

**Verification:**

- Memory usage should not grow continuously
- Memory should stabilize after garbage collection
- No memory leaks (memory returns to baseline)

---

## 7.5 Validation Checklist

### Pre-Integration Checklist

**Environment Setup:**

- [ ] Node.js 18+ installed
- [ ] npm dependencies installed
- [ ] Provider package installed (`@ai-sdk/provider`)
- [ ] Environment variables configured
- [ ] API keys obtained from provider
- [ ] `.env.local` created (not committed)
- [ ] `.gitignore` includes `.env*`

**Code Implementation:**

- [ ] Provider imported correctly
- [ ] Model created with correct model ID
- [ ] Middleware configured (`devToolsMiddleware()`)
- [ ] Streaming implemented (`streamText()`)
- [ ] Error handling added
- [ ] CORS configured
- [ ] Health check endpoint added

---

### Post-Integration Checklist

**Functionality:**

- [ ] Server starts without errors
- [ ] Health check returns 200
- [ ] Model info endpoint works
- [ ] Simple AI request succeeds
- [ ] Multi-turn conversation works
- [ ] Streaming responses work
- [ ] Error handling works (400 errors)
- [ ] Long messages handled
- [ ] Special characters work
- [ ] Frontend integration works

**Performance:**

- [ ] Time to first token < 1s
- [ ] Total response time acceptable
- [ ] No memory leaks detected
- [ ] Handles concurrent requests

**Quality:**

- [ ] Code follows project patterns
- [ ] TypeScript compilation succeeds
- [ ] No console.log statements
- [ ] Error messages are clear
- [ ] Logging added (if needed)

**Documentation:**

- [ ] README updated with provider info
- [ ] Environment variables documented
- [ ] API key generation link added
- [ ] Testing procedures documented
- [ ] Troubleshooting section added

**Security:**

- [ ] API keys not in code
- [ ] API keys not in git
- [ ] Environment-specific keys used
- [ ] Input validation implemented
- [ ] Rate limiting considered

---

### Production Readiness Checklist

**Deployment:**

- [ ] Production environment variables set
- [ ] API keys have production permissions
- [ ] Monitoring configured (logging, metrics)
- [ ] Error tracking set up (Sentry, etc.)
- [ ] Health checks configured
- [ ] Rate limiting configured (if needed)
- [ ] Cost monitoring set up

**Testing:**

- [ ] All manual tests passed
- [ ] Automated tests passing
- [ ] Load testing completed
- [ ] Performance benchmarks met
- [ ] Frontend tested in production environment

**Monitoring:**

- [ ] Response time monitoring
- [ ] Error rate monitoring
- [ ] Token usage tracking
- [ ] Cost tracking
- [ ] Uptime monitoring

**Documentation:**

- [ ] Runbook created (deployment, rollback)
- [ ] On-call procedures documented
- [ ] Known issues documented
- [ ] Configuration documented

---

## 7.6 Common Testing Issues and Solutions

### Issue 1: "API Key Not Found"

**Cause:** Environment variable not loaded

**Solution:**

```bash
# Check environment variable is set
echo $YOUR_PROVIDER_API_KEY

# Restart server after changing .env.local
npm run dev

# Verify server loads the variable
# Add temporary console.log in server.ts:
console.log('API Key:', process.env.YOUR_PROVIDER_API_KEY ? 'SET' : 'NOT SET');
```

---

### Issue 2: "Cannot Find Module"

**Cause:** Provider package not installed

**Solution:**

```bash
# Install provider package
npm install @ai-sdk/provider

# Verify installation
npm list @ai-sdk/provider

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### Issue 3: Streaming Not Working

**Cause:** Streaming configuration issue

**Solution:**

```typescript
// Ensure using streamText, not generateText
import { streamText } from 'ai';

// Return proper stream response
return result.toDataStreamResponse();
// or
return result.toUIMessageStreamResponse();
```

---

### Issue 4: Very Slow Responses

**Cause:** Network issue, provider slowdown, or large context

**Solution:**

```bash
# Test provider API directly
curl https://api.provider.com/v1/models \
  -H "Authorization: Bearer $YOUR_API_KEY"

# Check response time
time curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hi"}]}'

# Try smaller message
# Reduce context window size
# Check provider status page
```

---

### Issue 5: "Request Too Large"

**Cause:** Message exceeds provider's context limit

**Solution:**

```typescript
// Check message size before sending
const messageSize = JSON.stringify(messages).length;
const maxSize = 128000; // Adjust based on provider

if (messageSize > maxSize) {
  return new Response('Message too large', { status: 400 });
}

// Or truncate message
const truncatedMessages = messages.slice(-10); // Keep last 10
```

---

### Issue 6: Frontend Not Updating

**Cause:** Streaming not configured correctly

**Solution:**

```typescript
// Server: Return correct stream format
return result.toUIMessageStreamResponse();

// Frontend: Use Chat component
import { Chat } from '@ai-sdk/svelte';

[⬆ Back to Top](#table-of-contents)
import { DefaultChatTransport } from '@ai-sdk/svelte';

<Chat
  transport={new DefaultChatTransport({
    url: '/ai'
  })}
/>
```

---

## Summary

In this section, you learned:

✅ **Testing Strategy**

- Testing pyramid (unit, integration, manual)
- Testing levels and time investment
- Comprehensive testing checklist

✅ **Manual Testing Procedures**

- 12 comprehensive manual tests
- Server startup and health checks
- Simple and complex AI requests
- Error handling validation
- Special characters and Unicode
- Streaming response validation
- Frontend integration testing

✅ **Automated Testing**

- Unit tests with Vitest
- Integration tests with Supertest
- End-to-end tests with Playwright
- Test script automation

✅ **Performance Testing**

- Response time measurement
- Time to first token benchmarking
- Load testing with Apache Bench and wrk
- Memory usage monitoring

✅ **Validation Checklists**

- Pre-integration checklist
- Post-integration checklist
- Production readiness checklist

✅ **Common Issues**

- API key configuration
- Module installation
- Streaming issues
- Performance problems
- Size limits
- Frontend integration

---

**Next Steps:**

> **Next:** [8. Troubleshooting and Common Issues](#8-troubleshooting-and-common-issues)
>
> Learn how to diagnose and resolve common integration issues, debug problems, and get help.

---

## 8. Troubleshooting and Common Issues

> 📍 **Navigation:** [Table of Contents](#table-of-contents) → [Section 7](#7-testing-and-validation) → **Section 8**

This comprehensive troubleshooting section helps you diagnose and resolve common problems when integrating AI providers into SambungChat. Issues are organized by category for quick reference.

---

## 8.1 Installation Issues

Installation issues occur when setting up the provider packages and dependencies.

### 8.1.1 Package Installation Failures

**Problem:** `bun add @ai-sdk/{provider}` fails with errors

**Common Symptoms:**

```bash
❌ error: package "@ai-sdk/anthropic" not found
❌ error: unable to resolve dependency tree
❌ error: network timeout
```

**Solutions:**

1. **Check Bun Version Compatibility**

   ```bash
   # Ensure you're using a recent version of Bun
   bun --version  # Should be 1.0.0 or higher

   # Update Bun if needed
   bun upgrade
   ```

2. **Clear Package Manager Cache**

   ```bash
   # Clear Bun cache
   bun pm cache rm

   # Try installation again
   cd apps/server
   bun add @ai-sdk/anthropic
   ```

3. **Verify Package Registry Access**

   ```bash
   # Test npm registry connectivity
   bunx npm ping

   # Check if you can reach the AI SDK packages
   curl https://registry.npmjs.org/@ai-sdk/anthropic
   ```

4. **Try with npm/yarn as Fallback**

   ```bash
   # If Bun fails, try with npm
   npm install @ai-sdk/anthropic

   # Or with yarn
   yarn add @ai-sdk/anthropic
   ```

5. **Check Network and Proxy Settings**

   ```bash
   # If behind corporate firewall, configure proxy
   bun config set proxy http://proxy.company.com:8080
   bun config set https-proxy http://proxy.company.com:8080

   # Or set environment variable
   export HTTP_PROXY=http://proxy.company.com:8080
   export HTTPS_PROXY=http://proxy.company.com:8080
   ```

---

### 8.1.2 Version Conflicts

**Problem:** Dependency version conflicts between packages

**Common Symptoms:**

```bash
❌ error: peer dependency mismatch
❌ error: incompatible engine version
❌ error: version resolution failed
```

**Solutions:**

1. **Check Peer Dependencies**

   ```bash
   # Inspect dependency tree
   cd apps/server
   bun pm ls | grep ai-sdk

   # Check for conflicts
   bunx npm ls @ai-sdk/anthropic
   ```

2. **Update AI SDK to Latest Version**

   ```bash
   # Update all AI SDK packages
   bun update @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google

   # Or update everything
   bun update
   ```

3. **Use Overrides for Resolution**

   ```json
   // apps/server/package.json
   {
     "overrides": {
       "@ai-sdk/openai": "^1.0.0",
       "@ai-sdk/anthropic": "^1.0.0"
     }
   }
   ```

   Then run:

   ```bash
   bun install
   ```

4. **Delete and Reinstall**
   ```bash
   # Nuclear option - start fresh
   rm -rf node_modules package-lock.json
   bun install
   ```

---

## 8.2 Configuration Issues

Configuration issues relate to environment variables, API keys, and provider setup.

### 8.2.1 API Key Not Recognized

**Problem:** Provider returns authentication error despite setting API key

**Common Symptoms:**

```bash
❌ Error: 401 Unauthorized
❌ Error: Invalid API key
❌ Error: Authentication failed
```

**Solutions:**

1. **Verify Environment Variable Name (Exact Spelling)**

   ```bash
   # Check provider documentation for exact variable name
   # Common mistakes:
   ❌ OPENAI_KEY               # Missing "API"
   ❌ Anthropic_API_KEY        # Incorrect case
   ❌ google_api_key          # Incorrect case
   ❌ GROQKEY                 # Missing "API" and underscore

   ✅ OPENAI_API_KEY          # Correct
   ✅ ANTHROPIC_API_KEY       # Correct
   ✅ GOOGLE_GENERATIVE_AI_API_KEY  # Correct
   ✅ GROQ_API_KEY            # Correct
   ```

2. **Check .env File Location**

   ```bash
   # .env file must be in apps/server/ directory
   # Not in project root or other locations

   # Verify location
   ls -la apps/server/.env

   # Check which .env file is being loaded
   cd apps/server
   pwd  # Should show /path/to/apps/server
   ```

3. **Restart Server After Updating .env**

   ```bash
   # Environment variables are loaded at startup
   # You MUST restart after changes

   # Stop the server (Ctrl+C)
   # Then start again
   cd apps/server
   bun run dev
   ```

4. **Verify API Key Validity in Provider Console**

   ```bash
   # Log into provider dashboard and verify:
   # - API key is active (not disabled/revoked)
   # - API key has correct permissions
   # - API key hasn't expired
   # - Account is in good standing

   # Test API key directly with curl
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{
       "model": "claude-3-5-sonnet-20241022",
       "max_tokens": 1024,
       "messages": [{"role": "user", "content": "Hello"}]
     }'
   ```

5. **Check for Extra Spaces in Key Value**

   ```bash
   # Common mistake: trailing spaces
   ❌ ANTHROPIC_API_KEY=sk-ant-1234567890abcdef

   # Should be:
   ✅ ANTHROPIC_API_KEY=sk-ant-1234567890abcdef

   # No quotes, no spaces, no trailing whitespace
   ```

6. **Use Server Environment Schema for Debugging**

   ```typescript
   // apps/server/src/index.ts
   import { env } from '@env';

   // Add temporary debugging
   app.get('/debug-env', (c) => {
     return c.json({
       openai: !!env.OPENAI_API_KEY,
       anthropic: !!env.ANTHROPIC_API_KEY,
       google: !!env.GOOGLE_GENERATIVE_AI_API_KEY,
       groq: !!env.GROQ_API_KEY,
       ollama: !!env.OLLAMA_BASE_URL,
     });
   });

   // Visit /debug-env to see which keys are loaded
   ```

---

### 8.2.2 Model Not Found

**Problem:** Model ID not recognized by provider

**Common Symptoms:**

```bash
❌ Error: Model not found
❌ Error: Invalid model
❌ Error: Model does not exist
```

**Solutions:**

1. **Verify Model ID is Correct**

   ```bash
   # Model IDs are case-sensitive and specific
   # Check provider documentation for exact model IDs

   # OpenAI examples:
   ✅ gpt-4o-mini              # Correct
   ❌ gpt-4-mini               # Incorrect
   ❌ gpt4-mini                # Incorrect

   # Anthropic examples:
   ✅ claude-3-5-sonnet-20241022    # Correct
   ❌ claude-3.5-sonnet             # Incorrect
   ❌ claude-sonnet-3.5             # Incorrect

   # Google examples:
   ✅ gemini-2.5-flash          # Correct
   ❌ gemini-2-flash            # Incorrect
   ❌ gemini-25-flash           # Incorrect
   ```

2. **Check if Model Requires Specific API Version**

   ```typescript
   // Some providers require specific API versions
   // Check provider documentation

   // Example: OpenAI with specific version
   import { createOpenAI } from '@ai-sdk/openai';

   const openai = createOpenAI({
     baseURL: 'https://api.openai.com/v1', // Ensure correct version
     apiKey: env.OPENAI_API_KEY,
   });
   ```

3. **Ensure Model is Available in Your Region**

   ```bash
   # Some models are region-specific
   # Check provider dashboard for availability

   # For example, some EU models might not be available in US
   # Contact provider support if needed
   ```

4. **Check Provider Documentation for Model Availability**

   ```bash
   # Models can be:
   # - Deprecated
   # - Retired
   # - In beta only
   # - Enterprise-only
   # - Region-locked

   # Verify current availability in provider docs:
   # OpenAI: https://platform.openai.com/docs/models
   # Anthropic: https://docs.anthropic.com/claude/docs/models-overview
   # Google: https://ai.google.dev/gemini-api/docs/models
   # Groq: https://console.groq.com/docs/models
   ```

5. **Use Model Info Endpoint to List Available Models**

   ```bash
   # For OpenAI:
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"

   # For Anthropic (no public model list endpoint, check docs)

   # For Google:
   curl https://generativelanguage.googleapis.com/v1beta/models \
    ?key=$GOOGLE_GENERATIVE_AI_API_KEY

   # For Groq:
   curl https://api.groq.com/openai/v1/models \
     -H "Authorization: Bearer $GROQ_API_KEY"
   ```

---

### 8.2.3 Environment Variables Not Loading

**Problem:** `process.env.{VARIABLE}` is undefined in server code

**Common Symptoms:**

```bash
❌ Cannot read property 'API_KEY' of undefined
❌ env.OPENAI_API_KEY is undefined
❌ Environment variables not accessible
```

**Solutions:**

1. **Verify .env File Location**

   ```bash
   # .env file MUST be in apps/server/ directory
   # NOT in project root

   # Correct structure:
   sambung-chat/
   ├── apps/
   │   └── server/
   │       ├── .env          # ← Place .env here
   │       ├── src/
   │       └── package.json

   # Incorrect:
   sambung-chat/
   ├── .env                  # ✗ Won't be loaded by apps/server
   └── apps/
       └── server/
           └── src/
   ```

2. **Check Environment Schema in packages/env/src/server.ts**

   ```typescript
   // Verify variable is defined in schema
   const envSchema = z.object({
     OPENAI_API_KEY: z.string().min(1).optional(),
     // ^^^^ Must be defined here
   });

   // If not defined, add it
   const envSchema = z.object({
     // ... other vars
     YOUR_NEW_API_KEY: z.string().min(1).optional(),
   });
   ```

3. **Ensure Variable is Properly Typed in Zod Schema**

   ```typescript
   // Correct type definitions
   const envSchema = z.object({
     // String type
     OPENAI_API_KEY: z.string().min(1).optional(),

     // Number type (e.g., for port)
     PORT: z.number().default(3001),

     // Boolean type
     DEBUG: z.boolean().default(false),
   });

   // Access typed variables
   import { env } from '@env';
   const apiKey = env.OPENAI_API_KEY; // Type: string | undefined
   ```

4. **Restart Development Server**

   ```bash
   # Environment variables are loaded at server startup
   # Changes to .env require restart

   # Stop server: Ctrl+C
   # Start server:
   cd apps/server
   bun run dev
   ```

5. **Check for Multiple .env Files**

   ```bash
   # Multiple .env files can cause confusion
   # Only one should be in apps/server/

   cd apps/server
   ls -la .env*  # List all .env files

   # Keep only one (usually .env.local for development)
   # Remove or rename others
   ```

6. **Verify Variable is Not Overridden**

   ```bash
   # Check if variable is set in shell environment
   echo $OPENAI_API_KEY

   # Shell environment takes precedence over .env
   # Unset if needed
   unset OPENAI_API_KEY

   # Then restart server
   ```

---

## 8.3 Runtime Issues

Runtime issues occur during the execution of AI requests.

### 8.3.1 Streaming Not Working

**Problem:** Response returns all at once instead of streaming token by token

**Common Symptoms:**

- Entire message appears at once after long delay
- No incremental updates in UI
- Chat interface freezes during response generation

**Solutions:**

1. **Verify `streamText()` is Used (not `generateText()`)**

   ```typescript
   // ✅ Correct - using streamText for streaming
   import { streamText } from 'ai';

   const result = await streamText({
     model: wrappedModel,
     messages,
   });

   // ❌ Wrong - using generateText (no streaming)
   import { generateText } from 'ai';

   const result = await generateText({
     model: wrappedModel,
     messages,
   }); // Returns full response, no stream
   ```

2. **Check `toUIMessageStreamResponse()` is Called**

   ```typescript
   // ✅ Correct - return UI message stream
   app.post('/ai', async (c) => {
     const result = await streamText({
       model: wrappedModel,
       messages,
     });

     return result.toUIMessageStreamResponse();
   });

   // ❌ Wrong - returning data stream (not compatible with Chat component)
   return result.toDataStreamResponse();

   // ❌ Wrong - returning JSON (no streaming)
   return c.json({ text: result.text });
   ```

3. **Ensure Frontend Uses Chat Component Properly**

   ```svelte
   <!-- apps/web/src/routes/ai/+page.svelte -->
   <script lang="ts">
     import { Chat } from '@ai-sdk/svelte';
     import { DefaultChatTransport } from '@ai-sdk/svelte';

     // ✅ Correct - using Chat component
     const chat = new Chat({
       transport: new DefaultChatTransport({
         api: `${PUBLIC_SERVER_URL}/ai`,
       }),
     });
   </script>

   <Chat chat={chat} />

   // ❌ Wrong - manual fetch won't work with Chat component
   const response = await fetch('/ai', { ... });
   ```

4. **Verify Transport Layer Configuration**

   ```svelte
   // Ensure transport URL matches server endpoint
   const chat = new Chat({
     transport: new DefaultChatTransport({
       // ✅ Correct - full URL to server endpoint
       api: 'http://localhost:3001/ai',

       // ❌ Wrong - missing endpoint path
       api: 'http://localhost:3001',

       // ❌ Wrong - wrong port
       api: 'http://localhost:3000/ai',
     }),
   });
   ```

5. **Check for CORS Blocking**

   ```typescript
   // apps/server/src/index.ts
   import { cors } from 'hono/cors';

   // ✅ Ensure CORS is configured
   app.use('/*', cors({
     origin: env.CORS_ORIGIN,  // e.g., 'http://localhost:5173'
     credentials: true,
   }));

   // Test CORS with curl
   curl -X OPTIONS http://localhost:3001/ai \
     -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -v  # Look for Access-Control-Allow-Origin header
   ```

6. **Verify Response Content Type**

   ```bash
   # Server must return text/event-stream
   curl -X POST http://localhost:3001/ai \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Hi"}]}' \
     -v  # Look for: Content-Type: text/event-stream

   # If you see application/json instead, streaming is not working
   ```

---

### 8.3.2 Timeout Errors

**Problem:** Request times out before completion

**Common Symptoms:**

```bash
❌ Error: Request timeout
❌ Error: ETIMEDOUT
❌ Error: 504 Gateway Timeout
```

**Solutions:**

1. **Increase Timeout in Server Configuration**

   ```typescript
   // apps/server/src/index.ts
   import { serve } from '@hono/node-server';

   // ✅ Increase timeout for long-running AI requests
   const server = serve({
     fetch: app.fetch,
     port: env.PORT,
     hostname: '0.0.0.0',
   });

   // Set server timeout (in milliseconds)
   server.requestTimeout = 120000; // 2 minutes

   // Or use environment variable
   server.requestTimeout = parseInt(process.env.REQUEST_TIMEOUT || '120000');
   ```

2. **Check Network Connectivity to Provider API**

   ```bash
   # Test direct connection to provider
   time curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"Hi"}]}'

   # If direct curl is slow, issue is network/provider, not your code
   # If direct curl is fast, issue is in your implementation
   ```

3. **Verify Provider Service Status**

   ```bash
   # Check provider status page for outages
   # OpenAI: https://status.openai.com/
   # Anthropic: https://status.anthropic.com/
   # Google: https://status.cloud.google.com/
   # Groq: https://status.groq.com/

   # Follow provider status on Twitter/X for real-time updates
   ```

4. **Consider Breaking Up Long Messages**

   ```typescript
   // If timeout is due to very long messages, split them
   async function processLongMessage(messages: Message[]) {
     const MAX_TOKENS = 4000; // Adjust based on provider

     for (const message of messages) {
       const tokenCount = estimateTokens(message.content);
       if (tokenCount > MAX_TOKENS) {
         // Split message into chunks
         const chunks = splitMessage(message.content, MAX_TOKENS);
         for (const chunk of chunks) {
           await streamText({
             model: wrappedModel,
             messages: [{ role: message.role, content: chunk }],
           });
         }
       }
     }
   }
   ```

5. **Implement Retry Logic with Exponential Backoff**

   ```typescript
   async function callWithRetry(fn: () => Promise<any>, maxRetries = 3) {
     for (let attempt = 0; attempt < maxRetries; attempt++) {
       try {
         return await fn();
       } catch (error) {
         if (attempt === maxRetries - 1) throw error;

         const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
         console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
         await new Promise((resolve) => setTimeout(resolve, delay));
       }
     }
   }
   ```

---

### 8.3.3 Rate Limiting

**Problem:** Provider returns 429 (Too Many Requests)

**Common Symptoms:**

```bash
❌ Error: 429 Too Many Requests
❌ Error: Rate limit exceeded
❌ Error: quota_exceeded
```

**Solutions:**

1. **Implement Exponential Backoff**

   ```typescript
   async function callWithBackoff(fn: () => Promise<any>, maxRetries = 5) {
     for (let attempt = 0; attempt < maxRetries; attempt++) {
       try {
         return await fn();
       } catch (error) {
         if (error.status === 429 && attempt < maxRetries - 1) {
           // Exponential backoff for rate limits
           const delay = Math.pow(2, attempt) * 1000;
           console.log(`Rate limited, retrying in ${delay}ms...`);
           await new Promise((resolve) => setTimeout(resolve, delay));
           continue;
         }
         throw error;
       }
     }
   }
   ```

2. **Add Rate Limiting on Application Level**

   ```typescript
   // apps/server/src/index.ts
   import { rateLimiter } from 'hono-rate-limiter';

   // Add rate limiter middleware
   app.use(
     '/ai',
     rateLimiter({
       windowMs: 60 * 1000, // 1 minute
       max: 60, // 60 requests per minute
       standardHeaders: true,
       legacyHeaders: false,
     })
   );

   // Per-user rate limiting
   app.use(
     '/ai',
     rateLimiter({
       windowMs: 60 * 1000,
       max: 20, // 20 requests per minute per user
       keyGenerator: (c) => {
         // Use IP or user ID for rate limiting
         return c.req.header('x-forwarded-for') || 'anonymous';
       },
     })
   );
   ```

3. **Upgrade Provider Plan for Higher Limits**

   ```bash
   # Check your current rate limits in provider dashboard
   # Free tiers typically have lower limits

   # OpenAI: https://platform.openai.com/account/limits
   # Anthropic: https://console.anthropic.com/settings/limits
   # Google: https://console.cloud.google.com/iam-admin/quotas
   # Groq: https://console.groq.com/settings/limits

   # Consider upgrading to paid tier for production use
   ```

4. **Use Multiple API Keys with Rotation**

   ```typescript
   // Implement API key rotation for higher throughput
   const API_KEYS = [
     process.env.OPENAI_API_KEY_1,
     process.env.OPENAI_API_KEY_2,
     process.env.OPENAI_API_KEY_3,
   ].filter(Boolean);

   let keyIndex = 0;

   function getNextApiKey() {
     const key = API_KEYS[keyIndex];
     keyIndex = (keyIndex + 1) % API_KEYS.length;
     return key;
   }

   const openai = createOpenAI({
     apiKey: getNextApiKey(),
     // ...
   });
   ```

5. **Cache Responses to Reduce API Calls**

   ```typescript
   // Implement simple in-memory cache
   const cache = new Map();

   async function getCachedResponse(messages: Message[]) {
     const cacheKey = JSON.stringify(messages);

     if (cache.has(cacheKey)) {
       console.log('Cache hit!');
       return cache.get(cacheKey);
     }

     const result = await streamText({
       model: wrappedModel,
       messages,
     });

     // Cache for 5 minutes
     cache.set(cacheKey, result);
     setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);

     return result;
   }
   ```

---

## 8.4 Frontend Issues

Frontend issues relate to the chat UI and integration with the server.

### 8.4.1 Chat Component Not Rendering

**Problem:** Chat UI doesn't display messages or appears broken

**Common Symptoms:**

- Chat component renders but messages don't appear
- Blank screen where chat should be
- Error in browser console

**Solutions:**

1. **Check Browser Console for Errors**

   ```javascript
   // Open browser DevTools (F12 or Cmd+Option+I)
   // Check Console tab for errors

   // Common errors:
   // - "Failed to fetch"
   // - "CORS policy error"
   // - "Unexpected token < in JSON"
   // - "Chat is not defined"
   ```

2. **Verify Transport URL is Correct**

   ```svelte
   <!-- apps/web/src/routes/ai/+page.svelte -->
   <script lang="ts">
     import { Chat } from '@ai-sdk/svelte';
     import { DefaultChatTransport } from '@ai-sdk/svelte';
   
     // ✅ Correct - full URL including protocol
     const chat = new Chat({
       transport: new DefaultChatTransport({
         api: 'http://localhost:3001/ai',  // Include http:// and port
       }),
     });
   
     // ❌ Wrong - missing protocol
     api: 'localhost:3001/ai',
   
     // ❌ Wrong - wrong port
     api: 'http://localhost:3000/ai',  // Server is on 3001, not 3000
   
     // ❌ Wrong - missing endpoint path
     api: 'http://localhost:3001',
   </script>
   ```

3. **Ensure Server is Running**

   ```bash
   # Check if server is running
   curl http://localhost:3001/health  # Or your health endpoint

   # Or check if port is listening
   lsof -i :3001  # macOS/Linux
   netstat -an | findstr :3001  # Windows

   # Start server if not running
   cd apps/server
   bun run dev
   ```

4. **Check CORS Configuration**

   ```typescript
   // apps/server/src/index.ts
   app.use('/*', cors({
     origin: env.CORS_ORIGIN,  // Must match frontend URL
     // e.g., 'http://localhost:5173' for Vite dev server
     credentials: true,
   }));

   // Test CORS
   curl -X OPTIONS http://localhost:3001/ai \
     -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -v

   # Look for: Access-Control-Allow-Origin: http://localhost:5173
   ```

5. **Verify PUBLIC_SERVER_URL Environment Variable**

   ```bash
   # apps/web/.env.local
   PUBLIC_SERVER_URL=http://localhost:3001

   # Ensure it's set and correct
   echo $PUBLIC_SERVER_URL

   # Restart frontend after changing
   cd apps/web
   bun run dev
   ```

---

### 8.4.2 Messages Not Updating

**Problem:** New messages don't appear in chat interface

**Common Symptoms:**

- User message appears but no AI response
- Messages appear with long delay
- Some messages appear, others don't

**Solutions:**

1. **Verify Reactive State is Properly Set Up**

   ```svelte
   <!-- apps/web/src/routes/ai/+page.svelte -->
   <script lang="ts">
     import { Chat } from '@ai-sdk/svelte';
     import { DefaultChatTransport } from '@ai-sdk/svelte';

     // ✅ Correct - use reactive declaration
     const chat = new Chat({
       transport: new DefaultChatTransport({
         api: `${PUBLIC_SERVER_URL}/ai`,
       }),
     });

     // The Chat component handles reactivity internally
     // Don't try to manually manage state
   </script>

   <!-- ✅ Correct - bind chat instance -->
   <Chat {chat} />

   <!-- ❌ Wrong - don't manually manage messages -->
   <!-- The Chat component handles this internally -->
   ```

2. **Check Message Array References**

   ```typescript
   // The Chat component manages its own state internally
   // You don't need to manually update messages

   // If you're trying to implement custom behavior:
   // Use the Chat component's built-in features
   // Don't try to bypass its state management
   ```

3. **Ensure Streaming is Working**

   ```bash
   # Test streaming directly with curl
   curl -X POST http://localhost:3001/ai \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Hello"}]}' \
     --no-buffer

   # You should see:
   # data: {"type":"text.delta","content":"H"}
   # data: {"type":"text.delta","content":"e"}
   # data: {"type":"text.delta","content":"l"}
   # ...

   # If you see the entire response at once, streaming is broken
   # See Section 8.3.1 for streaming troubleshooting
   ```

4. **Check for JavaScript Errors**

   ```javascript
   // Open browser DevTools (F12)
   // Go to Console tab

   // Look for any errors that might be preventing updates
   // Common errors:
   // - TypeError: Cannot read property 'x' of undefined
   // - ReferenceError: chat is not defined
   // - NetworkError: Failed to fetch
   ```

5. **Verify Browser Compatibility**

   ```bash
   # The Chat component uses modern JavaScript features
   # Ensure your browser supports:
   # - ES2020+ features
   # - Fetch API
   # - ReadableStream
   # - EventSource / Server-Sent Events

   # Test in modern browsers:
   # - Chrome 90+
   # - Firefox 88+
   # - Safari 14+
   # - Edge 90+
   ```

---

## 8.5 Provider-Specific Issues

Each AI provider has unique issues and solutions.

### 8.5.1 OpenAI Issues

**Organization ID Required**

```bash
# Problem: Some OpenAI accounts require organization ID
# Solution: Include organization ID in API client

import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
  organization: env.OPENAI_ORGANIZATION_ID,  # Add this
});
```

**Base URL Configuration for Azure Deployments**

```typescript
// For Azure OpenAI, use custom base URL
const openai = createOpenAI({
  baseURL: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment',
  apiKey: env.AZURE_OPENAI_API_KEY,
});
```

**API Version Compatibility**

```bash
# OpenAI API versions can vary
# Ensure you're using compatible versions

# Check installed version
bunx npm list @ai-sdk/openai

# Update if needed
bun add @ai-sdk/openai@latest
```

---

### 8.5.2 Anthropic Issues

**Strict Message Format Requirements**

```typescript
// Anthropic has strict message format requirements
// Ensure messages follow the correct structure

// ✅ Correct - alternating user/assistant
const messages = [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' },
  { role: 'user', content: 'How are you?' },
];

// ❌ Wrong - consecutive messages from same role
const messages = [
  { role: 'user', content: 'Hello' },
  { role: 'user', content: 'Hello again' }, // Wrong
];
```

**Token Counting Differences**

```bash
# Anthropic counts tokens differently than OpenAI
# 1 token ≈ 3.5 characters for Anthropic (vs 4 for OpenAI)

# Use Anthropic's token counter for accurate estimates
# https://docs.anthropic.com/claude/docs/token-counting
```

**Thinking Mode Configuration**

```typescript
// Anthropic Claude has extended thinking mode
// Can be configured for complex reasoning

import { anthropic } from '@ai-sdk/anthropic';

const model = anthropic('claude-3-5-sonnet-20241022', {
  // Enable extended thinking (beta)
  thinking: {
    type: 'enabled',
    budget_tokens: 10000, // Allocate tokens for thinking
  },
});
```

---

### 8.5.3 Google Gemini Issues

**Alternative API Key Variable Names**

```bash
# Google SDK accepts multiple API key variable names
# Prefer GOOGLE_GENERATIVE_AI_API_KEY for consistency

# Accepted alternatives:
# - GOOGLE_API_KEY (also works)
# - GEMINI_API_KEY (third-party libs)

# Use this for consistency:
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

**Regional Availability Differences**

```bash
# Some Gemini models are region-specific
# Check availability for your region

# Vertex AI (enterprise):
# - US: https://us-central1-aiplatform.googleapis.com
# - EU: https://europe-west1-aiplatform.googleapis.com

# Generative AI API (consumer):
# - Global: https://generativelanguage.googleapis.com
```

**Quota Limitations**

```bash
# Google has different quota tiers
# Check your quota in Google Cloud Console

# Free tier: 60 requests per minute
# Paid tier: Higher limits based on billing

# Request quota increase:
# https://console.cloud.google.com/iam-admin/quotas
```

---

### 8.5.4 Groq Issues

**Very Fast Requests Can Trigger Rate Limits**

```typescript
// Groq is extremely fast (10-20x faster than other providers)
// This can trigger rate limits if not careful

// Implement rate limiting on your end
import { rateLimiter } from 'hono-rate-limiter';

app.use('/ai', rateLimiter({
  windowMs: 60 * 1000,
  max: 100,  # Adjust based on your Groq quota
  standardHeaders: true,
}));
```

**Model Availability Changes**

```bash
# Groq frequently updates available models
# Check current models in Groq console

# List available models:
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"

# Popular models:
# - llama-3.3-70b-versatile
# - mixtral-8x7b-32768
# - gemma2-9b-it
```

**Token Limit Differences**

```bash
# Groq models have different context limits
# Check model documentation for exact limits

# Example:
# - Llama 3.3 70B: 128K tokens
# - Mixtral 8x7B: 32K tokens
# - Gemma 2 9B: 8K tokens
```

---

### 8.5.5 Ollama Issues

**Service Not Running Locally**

```bash
# Problem: Ollama service is not running
# Solution: Start Ollama service

# macOS/Linux:
ollama serve

# Or start as background service:
brew services start ollama  # macOS
sudo systemctl start ollama  # Linux

# Verify it's running:
curl http://localhost:11434/api/tags
```

**Model Not Pulled**

```bash
# Problem: Model hasn't been downloaded yet
# Solution: Pull the model

ollama pull llama3.2

# List available models:
ollama list

# Pull multiple models:
ollama pull llama3.2
ollama pull mistral
ollama pull codellama
```

**CORS Configuration for Remote Access**

```bash
# Problem: Ollama blocks remote requests by default
# Solution: Set OLLAMA_ORIGINS environment variable

# macOS/Linux:
export OLLAMA_ORIGINS="*"
ollama serve

# Or set specific origins:
export OLLAMA_ORIGINS="http://localhost:5173,https://yourdomain.com"
ollama serve

# Windows:
set OLLAMA_ORIGINS=*
ollama serve
```

**Remote Ollama Server Setup**

```typescript
// For Ollama running on remote server
import { ollama } from 'ollama-ai-provider';
import { createOpenAI } from '@ai-sdk/openai';

const ollamaClient = createOpenAI({
  baseURL: 'http://your-server-ip:11434/v1', // Remote server
  apiKey: 'ollama', // Required but ignored by Ollama
});

const model = ollama('llama3.2', {
  baseURL: 'http://your-server-ip:11434/v1',
});
```

---

## 8.6 Debugging Tips

### 8.6.1 Enable Debug Logging

Add detailed logging to track request flow:

```typescript
// apps/server/src/index.ts
app.post('/ai', async (c) => {
  const body = await c.req.json();

  // Debug logging
  console.log('=== AI Request ===');
  console.log('Messages:', body.messages);
  console.log('Message count:', body.messages.length);
  console.log('Using model:', modelId);
  console.log('Timestamp:', new Date().toISOString());

  const startTime = Date.now();

  try {
    const result = await streamText({
      model: wrappedModel,
      messages: body.messages,
    });

    console.log('Streaming started');

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('AI Request failed:', error);
    console.error('Duration:', duration, 'ms');

    return c.json({ error: error.message }, { status: 500 });
  }
});
```

---

### 8.6.2 Use AI SDK DevTools

Enable AI SDK DevTools for detailed debugging:

```typescript
// apps/server/src/index.ts
import { devToolsMiddleware } from '@ai-sdk/devtools';
import { wrapLanguageModel } from 'ai';

// Wrap model with dev tools
const model = wrapLanguageModel({
  model: provider('model-id'),
  middleware: devToolsMiddleware(), // Enables debugging
});

// This enables:
// - Request/response logging
// - Performance metrics
// - Error tracking
// - Model inspection
```

Access DevTools at: `http://localhost:3001/__ai-devtools`

---

### 8.6.3 Network Inspection

Use browser DevTools to inspect network traffic:

**Chrome/Firefox DevTools:**

1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Network tab
3. Filter by "event-stream" or "ai"
4. Look for the `/ai` request
5. Click on it to inspect:
   - Request headers (look for Authorization, Content-Type)
   - Response headers (look for Content-Type: text/event-stream)
   - Response preview (should show streaming chunks)
   - Timing (check for slow requests)

**What to Look For:**

```bash
# Request Headers:
✅ Content-Type: application/json
✅ Accept: text/event-stream

# Response Headers:
✅ Content-Type: text/event-stream
✅ Cache-Control: no-cache
✅ Connection: keep-alive

# Response Preview:
✅ Should see multiple chunks like:
   data: {"type":"text.delta","content":"H"}
   data: {"type":"text.delta","content":"e"}
   data: {"type":"text.delta","content":"l"}
   ...

# Common Issues:
❌ No /ai request (frontend not sending)
❌ 401/403 errors (auth problem)
❌ 404 error (wrong endpoint)
❌ CORS errors (server configuration)
❌ No streaming chunks (server not streaming)
```

---

### 8.6.4 Check Provider Status

Verify provider services are operational:

```bash
# OpenAI Status
curl https://status.openai.com/api/v2/status.json

# Anthropic Status
curl https://status.anthropic.com/api/v2/status.json

# Google Cloud Status
curl https://status.cloud.google.com/api/v2/status.json

# Groq Status
curl https://status.groq.com/api/v2/status.json

# All should show "operational"
# If not, wait for provider to fix the issue
```

---

### 8.6.5 Test with cURL

Isolate issues by testing directly with cURL:

```bash
# Test server endpoint directly (no frontend)
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hello, can you hear me?"
      }
    ]
  }' \
  --no-buffer

# Expected output:
# data: {"type":"text.delta","content":"H"}
# data: {"type":"text.delta","content":"i"}
# ...

# If this works, server is OK, issue is in frontend
# If this fails, issue is in server
```

---

### 8.6.6 Monitor Resource Usage

Check server resources for bottlenecks:

```bash
# Check CPU usage
top -o cpu  # macOS/Linux
taskmgr     # Windows

# Check memory usage
top -o mem  # macOS/Linux

# Check if server is responsive
curl http://localhost:3001/health

# Check for memory leaks
node --inspect apps/server/src/index.ts
# Then open Chrome DevTools -> Node.js icon
```

---

## 8.7 Getting Help

When you can't resolve issues on your own, here's how to get help:

### 8.7.1 Documentation Resources

**AI SDK Documentation:**

- Official Docs: https://sdk.vercel.ai/docs
- API Reference: https://sdk.vercel.ai/docs/reference
- Examples: https://sdk.vercel.ai/docs/examples

**Provider Documentation:**

- OpenAI: https://platform.openai.com/docs
- Anthropic: https://docs.anthropic.com
- Google AI: https://ai.google.dev/docs
- Groq: https://console.groq.com/docs
- Ollama: https://github.com/ollama/ollama/blob/main/docs/api.md

**SambungChat Resources:**

- This Guide: `docs/ai-provider-integration-guide.md`
- Examples: `examples/` directory
- Issues: GitHub issue tracker

---

### 8.7.2 Community Forums

**GitHub Discussions:**

- Vercel AI SDK: https://github.com/vercel/ai/discussions
- Search existing discussions before posting
- Include error messages, code snippets, and environment details

**Stack Overflow:**

- Tag questions with `ai-sdk` and provider name (e.g., `openai-api`)
- Include minimal reproducible example
- Describe what you've tried so far

**Provider Communities:**

- OpenAI Community Forum: https://community.openai.com/
- Anthropic Discord: https://discord.gg/anthropic
- Google AI Community: https://discuss.ai.google.dev/

---

### 8.7.3 Creating a Bug Report

When reporting issues, include:

**Required Information:**

````markdown
## Environment

- Node/Bun version: `node --version` or `bun --version`
- AI SDK version: `bun list @ai-sdk/*`
- Provider package: `bun list @ai-sdk/openai` (or relevant provider)
- OS: macOS/Linux/Windows version

## Problem Description

Clear description of what's not working

## Expected Behavior

What should happen

## Actual Behavior

What actually happens (error messages, incorrect output, etc.)

## Code Example

Minimal code to reproduce the issue

```typescript
// Include your implementation
```
````

## Error Messages

Full error stack traces

## Steps to Reproduce

1. Step 1
2. Step 2
3. ...

## Additional Context

Screenshots, logs, or other relevant information

````

---

### 8.7.4 SambungChat Issue Tracker

For SambungChat-specific issues:

```bash
# Check existing issues first
gh issue list --repo sambunghub/sambung-chat

# Create new issue
gh issue create --repo sambunghub/sambung-chat \
  --title "AI Provider Integration Issue: [Brief Description]" \
  --body "Include all details from bug report template above"
````

---

### 8.7.5 Quick Diagnostic Checklist

Before asking for help, verify:

[⬆ Back to Top](#table-of-contents)

- [ ] Environment variables are set correctly
- [ ] API keys are valid and active
- [ ] Packages are installed (`bun list @ai-sdk/*`)
- [ ] Server is running (`curl http://localhost:3001/health`)
- [ ] Direct cURL test works (isolates frontend issues)
- [ ] Browser console has no errors
- [ ] Network tab shows correct request/response
- [ ] Provider status page shows "operational"
- [ ] You've tried the solutions in this section
- [ ] You can provide minimal reproducible example

---

## Summary

In this section, you learned comprehensive troubleshooting for:

✅ **Installation Issues**

- Package installation failures
- Version conflicts and dependency resolution

✅ **Configuration Issues**

- API key recognition problems
- Model not found errors
- Environment variable loading issues

✅ **Runtime Issues**

- Streaming configuration
- Timeout handling
- Rate limiting strategies

✅ **Frontend Issues**

- Chat component rendering
- Message updating problems
- Browser compatibility

✅ **Provider-Specific Issues**

- OpenAI: Organization ID, Azure, API versions
- Anthropic: Message format, token counting, thinking mode
- Google: API key names, regional availability, quotas
- Groq: Speed vs rate limits, model availability
- Ollama: Service management, model pulling, CORS

✅ **Debugging Techniques**

- Debug logging
- AI SDK DevTools
- Network inspection
- cURL testing
- Resource monitoring

✅ **Getting Help**

- Documentation resources
- Community forums
- Bug report template
- Diagnostic checklist

---

**Next Steps:**

> **Next:** [9. Advanced Topics](#9-advanced-topics) _(Coming Soon)_
>
> _Note: Sections 9-11 are planned for future enhancement. For advanced multi-provider patterns, see the [Multi-Provider Integration Example](../examples/multi-provider-integration/)._

---

**Document Status:** ✅ Complete - Phase 8, Task 1 (Comprehensive Review)

**Last Updated:** 2026-01-12
**Contributors:** SambungChat Development Team

**Note:** Sections 9-11 (Advanced Topics, Best Practices, Reference) are planned for future enhancement. The current documentation (Sections 1-8) provides comprehensive coverage for AI provider integration.
