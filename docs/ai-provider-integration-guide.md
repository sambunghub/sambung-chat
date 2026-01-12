# AI Provider Integration Guide: Adding New Models to SambungChat

**Version:** 1.0
**Last Updated:** 2025-01-11
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
import { google } from "@ai-sdk/google";

// Model creation with middleware
const model = wrapLanguageModel({
  model: google("gemini-2.5-flash"),
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

| Provider | Models | Cost (Input) | Speed | Strength | Use Case |
|----------|---------|--------------|-------|----------|----------|
| **Google Gemini** | gemini-2.5-flash | ~$0.075/M | Fast | Multimodal, cost-effective | General purpose |
| **OpenAI** | gpt-4o, gpt-4o-mini | $0.15-$15/M | Medium | Quality, ecosystem | Complex tasks |
| **Anthropic** | claude-3-5-sonnet | $3-$15/M | Medium | Reasoning, safety | Complex reasoning |
| **Groq** | llama-3.3-70b | ~$0.59/M | Very Fast | Low latency, cost | Real-time chat |
| **Ollama** | Various local models | Free (local) | Variable | Privacy, offline | Development |

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
const messages = [
  { role: "user", content: "Hello, AI!" }
];
```

**Consistent Streaming Interface**
```typescript
// Same streaming pattern for all providers
const result = await streamText({
  model: provider("model-id"),
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
import { openai } from "@ai-sdk/openai"; // Replace with your provider

// 2. Update the model creation
const model = wrapLanguageModel({
  model: openai("gpt-4o"), // Replace with your model ID
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
import { Hono } from "hono";
import { cors } from "hono/cors";
import { openai } from "@ai-sdk/openai"; // 1. Import provider
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import type { UiMessage } from "ai";

const app = new Hono();

app.use("/*", cors());

app.post("/ai", async (c) => {
  const { messages } = await c.req.json();

  // 2. Create model with new provider
  const model = wrapLanguageModel({
    model: openai("gpt-4o"), // Provider-specific model ID
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

---

---

## 2. Understanding the AI SDK Architecture

> **Note:** This section will be added in Phase 3, Task 3. Please proceed to [Section 3: Current Implementation Analysis](#3-current-implementation-analysis) for detailed analysis of the existing Google Gemini integration.

---

## 3. Current Implementation Analysis

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
import { google } from "@ai-sdk/google";

// Core AI SDK Functions
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";

// Development Tools
import { devToolsMiddleware } from "@ai-sdk/devtools";

// Web Framework
import { Hono } from "hono";
import { cors } from "hono/cors";
```

**Breakdown:**

| Import | Source | Purpose |
|--------|--------|---------|
| `google` | `@ai-sdk/google` | Provider-specific function to create Google model instances |
| `streamText` | `ai` | Generate streaming text responses |
| `convertToModelMessages` | `ai` | Convert UI message format to provider-specific format |
| `wrapLanguageModel` | `ai` | Add middleware capabilities to language models |
| `devToolsMiddleware` | `@ai-sdk/devtools` | Enable debugging and inspection tools |
| `Hono` | `hono` | Fast web framework for Node.js/Edge |
| `cors` | `hono/cors` | Cross-Origin Resource Sharing middleware |

**Key Pattern:**
Each provider exports a function (e.g., `google()`, `openai()`, `anthropic()`) that creates a language model instance. This is the only provider-specific code you'll need to change when adding new providers.

#### 3.2.2 Endpoint Configuration

```typescript
const app = new Hono();

// CORS Configuration
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// AI Endpoint
app.post("/ai", async (c) => {
  const body = await c.req.json();
  const uiMessages = body.messages || [];

  // Model creation and streaming (see 3.2.3 and 3.2.4)
  const model = wrapLanguageModel({
    model: google("gemini-2.5-flash"),
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
  model: google("gemini-2.5-flash"),
  middleware: devToolsMiddleware(),
});
```

**Pattern Breakdown:**

**1. Provider Function Call**
```typescript
google("gemini-2.5-flash")
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
wrapLanguageModel({ model, middleware })
```
- **Purpose:** Add middleware capabilities to the language model
- **Benefits:**
  - Enables debugging tools
  - Allows custom middleware injection
  - Maintains provider-agnostic interface
  - Supports future extensibility

**3. DevTools Middleware**
```typescript
devToolsMiddleware()
```
- **Purpose:** Enable AI SDK DevTools for debugging
- **Features:**
  - Request/response inspection
  - Token usage tracking
  - Performance metrics
  - Error tracing

**Why This Pattern?**

| Benefit | Description |
|---------|-------------|
| **Consistency** | Same pattern works for all providers |
| **Debugging** | DevTools middleware essential for development |
| **Extensibility** | Easy to add custom middleware later |
| **Type Safety** | Full TypeScript support throughout |

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
await convertToModelMessages(uiMessages)
```
- **Input:** Array of UI messages from frontend
- **Output:** Array of provider-specific model messages
- **Purpose:** Transform frontend message format to backend format
- **Automatic:** Handles different message structures per provider

**UI Message Format (Frontend → Backend):**
```typescript
interface UiMessage {
  role: "user" | "assistant" | "system";
  content: string | Array<{
    type: "text" | "image" | "tool-call" | "tool-result";
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
  messages,  // Converted messages
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

| Advantage | Description |
|-----------|-------------|
| **User Experience** | Real-time response generation feels faster |
| **Perceived Latency** | Time to first token (TTFT) is much lower |
| **Cost Feedback** | Users can stop generation if unsatisfied |
| **Large Outputs** | No waiting for complete responses |
| **Natural Chat** | Mimics human conversation patterns |

---

### 3.3 Frontend Implementation

**File:** `apps/web/src/routes/ai/+page.svelte`

The frontend implementation is **provider-agnostic**, meaning it works with any AI provider without changes. This is one of the key benefits of using the AI SDK.

#### 3.3.1 Chat Component Setup

```typescript
import { Chat } from "@ai-sdk/svelte";
import { DefaultChatTransport } from "ai";

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
api: `${PUBLIC_SERVER_URL}/ai`
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
  input = "";
}

// Access messages
chat.messages  // Reactive array of messages
```

**Message Structure:**
```typescript
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  parts: Array<{
    type: "text" | "image" | "tool-call" | "tool-result";
    text?: string;
    [key: string]: any;
  }>;
  createdAt?: Date;
}
```

**UI Rendering (Svelte):**
```svelte
{#each chat.messages as message (message.id)}
  <div class:message-user={message.role === "user"}>
    {#each message.parts as part}
      {#if part.type === "text"}
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

| Benefit | Description |
|---------|-------------|
| **Zero Provider Lock-in** | Frontend works with any provider |
| **Minimal Code** | ~100 lines for full chat UI |
| **Type Safe** | Full TypeScript support |
| **Reactive** | Automatic updates with Svelte 5 runes |
| **Maintainable** | Clean separation of concerns |

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
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
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
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    // AI Provider Configuration
    AI_PROVIDER: z.enum(["openai", "anthropic", "google", "groq"]).optional(),

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
     model: openai("gpt-4o-mini"),
     middleware: devToolsMiddleware(),
   });
   console.log("Model created successfully");
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
app.post("/ai", async (c) => {
  try {
    const body = await c.req.json();
    const uiMessages = body.messages || [];

    const model = wrapLanguageModel({
      model: google("gemini-2.5-flash"),
      middleware: devToolsMiddleware(),
    });

    const result = streamText({
      model,
      messages: await convertToModelMessages(uiMessages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("AI provider error:", error);
    return c.json({ error: "AI service temporarily unavailable" }, 503);
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
  model: [provider]("[model-id]"),
  middleware: devToolsMiddleware(),
});
```

**Next Steps:**
- Proceed to [Section 4: Step-by-Step Integration Guide](#4-step-by-step-integration-guide) for detailed instructions on adding new providers
- See [Section 5: Provider-Specific Configurations](#5-provider-specific-configurations) for setup details for each major provider

---

## 4. Step-by-Step Integration Guide

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

| Step | Task | Time | Complexity |
|------|------|------|------------|
| 4.2 | Research and preparation | 5 minutes | Low |
| 4.3 | Environment configuration | 3 minutes | Low |
| 4.4 | Server implementation | 5 minutes | Low |
| 4.5 | Testing | 5-10 minutes | Medium |
| 4.6 | Deployment and monitoring | Ongoing | Medium |

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

| Criteria | Questions to Ask | Importance |
|----------|------------------|------------|
| **Cost** | What's the price per 1M tokens? Are there free tiers? | High |
| **Performance** | What's the latency (time to first token)? Throughput? | High |
| **Quality** | How good are the model's responses? Benchmarks? | High |
| **Use Case** | Does the model specialize in your use case (code, reasoning, chat)? | High |
| **Reliability** | What's the uptime? SLA guarantees? | Medium |
| **Ecosystem** | Is there good documentation? Community support? | Medium |
| **Data Privacy** | Where are the servers? Data retention policies? | Medium |

**Quick Provider Comparison:**

| Provider | Best For | Cost (Input) | Speed | Quality |
|----------|----------|--------------|-------|----------|
| **OpenAI** | General-purpose, complex tasks | $0.15-$15/M | Medium | ⭐⭐⭐⭐⭐ |
| **Anthropic** | Complex reasoning, safety-critical | $3-$15/M | Medium | ⭐⭐⭐⭐⭐ |
| **Google** | Cost-effective, multimodal | ~$0.075/M | Fast | ⭐⭐⭐⭐ |
| **Groq** | Real-time chat, low latency | ~$0.59/M | Very Fast | ⭐⭐⭐⭐ |
| **Ollama** | Offline development, privacy | Free (local) | Variable | ⭐⭐⭐ |

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

| Information | Value | Source |
|-------------|-------|--------|
| Package Name | `@ai-sdk/openai` | AI SDK docs |
| API Key Prefix | `sk-` | OpenAI dashboard |
| Model IDs | `gpt-4o`, `gpt-4o-mini`, `o1-preview` | OpenAI docs |
| Environment Variable | `OPENAI_API_KEY` | AI SDK docs |
| Rate Limits | 10,000 TPM (Tier 1) | OpenAI docs |
| Pricing | $2.50/M input (gpt-4o-mini) | OpenAI pricing |
| Documentation | https://platform.openai.com/docs | OpenAI |

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
    "@ai-sdk/openai": "^1.0.0",  // ← Your new provider
    "ai": "catalog:",
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

| Issue | Solution |
|-------|----------|
| Package not found | Verify package name: `@ai-sdk/[provider]` |
| Version conflicts | Check AI SDK compatibility: `ai` package version |
| Network error | Try again or check internet connection |
| Permission denied | Run with appropriate permissions |

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

⚠️ **Note:** As of the current implementation, the environment schema (`packages/env/src/server.ts`) does not include AI provider variables. This is planned for Phase 5.

For now, the AI SDK will automatically read environment variables, so you can skip this step. However, for production use, you should add validation.

**Current State (No Schema Validation):**

```typescript
// packages/env/src/server.ts
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    // ⚠️ No AI provider variables yet
  },
});
```

**Recommended (Phase 5 - Future):**

```typescript
// packages/env/src/server.ts
export const env = createEnv({
  server: {
    // Existing variables...
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    // AI Provider Configuration (recommended)
    OPENAI_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
    GROQ_API_KEY: z.string().min(1).optional(),
  },
});
```

**For Now:** Proceed to Step 4.3.3 and add variables directly to your `.env` files.

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

| Practice | Description | Example |
|----------|-------------|---------|
| **Never commit .env.local** | Contains actual secrets | Add to `.gitignore` |
| **Commit .env.example** | Shows required variables | Use placeholder values |
| **Use different keys per environment** | Dev, staging, production | `OPENAI_DEV_KEY`, `OPENAI_PROD_KEY` |
| **Document key source** | Where to obtain the key | Add comments with URLs |
| **Group related variables** | Easier to read | Separate sections with comments |

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
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";

// Existing provider import
import { google } from "@ai-sdk/google";

// ⭐ ADD YOUR NEW PROVIDER IMPORT HERE
import { openai } from "@ai-sdk/openai";  // Replace with your provider
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
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Environment Configuration
import { env } from "@sambungchat/env";

// AI SDK - Core Functions
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import type { UiMessage } from "ai";

// AI SDK - Development Tools
import { devToolsMiddleware } from "@ai-sdk/devtools";

// AI SDK - Providers
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";  // ← New provider import
// import { anthropic } from "@ai-sdk/anthropic";  // Future providers
// import { groq } from "@ai-sdk/groq";  // Future providers
```

#### 4.4.2 Create Model Instance

Update the model creation in the `/ai` endpoint to use your new provider.

**Current Code (Google Gemini):**

```typescript
app.post("/ai", async (c) => {
  const { messages } = await c.req.json();

  // Current provider: Google Gemini
  const model = wrapLanguageModel({
    model: google("gemini-2.5-flash"),
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
app.post("/ai", async (c) => {
  const { messages } = await c.req.json();

  // ⭐ NEW PROVIDER: OpenAI
  const model = wrapLanguageModel({
    model: openai("gpt-4o-mini"),  // ← Change: Provider and model ID
    middleware: devToolsMiddleware(),
  });

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

**Pattern for Any Provider:**

```typescript
// Only ONE line changes:
const model = wrapLanguageModel({
  model: [provider-function]("[model-id]"),
  middleware: devToolsMiddleware(),
});
```

**Examples for Different Providers:**

```typescript
// OpenAI
const model = wrapLanguageModel({
  model: openai("gpt-4o-mini"),
  middleware: devToolsMiddleware(),
});

// Anthropic
const model = wrapLanguageModel({
  model: anthropic("claude-3-5-sonnet-20241022"),
  middleware: devToolsMiddleware(),
});

// Groq
const model = wrapLanguageModel({
  model: groq("llama-3.3-70b-versatile"),
  middleware: devToolsMiddleware(),
});
```

#### 4.4.3 Integration Options

There are three approaches to integrating your new provider, depending on your requirements.

**Option A: Replace Current Provider** (Simplest)

Replace the existing Google Gemini with your new provider:

```typescript
// Before
import { google } from "@ai-sdk/google";

const model = wrapLanguageModel({
  model: google("gemini-2.5-flash"),
  middleware: devToolsMiddleware(),
});

// After
import { openai } from "@ai-sdk/openai";

const model = wrapLanguageModel({
  model: openai("gpt-4o-mini"),
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
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { groq } from "@ai-sdk/groq";

// Provider selection function
function getModel() {
  const provider = process.env.AI_PROVIDER || "google";

  switch (provider) {
    case "openai":
      return wrapLanguageModel({
        model: openai("gpt-4o-mini"),
        middleware: devToolsMiddleware(),
      });

    case "anthropic":
      return wrapLanguageModel({
        model: anthropic("claude-3-5-sonnet-20241022"),
        middleware: devToolsMiddleware(),
      });

    case "groq":
      return wrapLanguageModel({
        model: groq("llama-3.3-70b-versatile"),
        middleware: devToolsMiddleware(),
      });

    case "google":
    default:
      return wrapLanguageModel({
        model: google("gemini-2.5-flash"),
        middleware: devToolsMiddleware(),
      });
  }
}

app.post("/ai", async (c) => {
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
app.post("/ai", async (c) => {
  const { messages } = await c.req.json();

  const model = wrapLanguageModel({
    model: google("gemini-2.5-flash"),
    middleware: devToolsMiddleware(),
  });

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});

// OpenAI endpoint (new)
app.post("/ai/openai", async (c) => {
  const { messages } = await c.req.json();

  const model = wrapLanguageModel({
    model: openai("gpt-4o-mini"),
    middleware: devToolsMiddleware(),
  });

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});

// Anthropic endpoint (new)
app.post("/ai/anthropic", async (c) => {
  const { messages } = await c.req.json();

  const model = wrapLanguageModel({
    model: anthropic("claude-3-5-sonnet-20241022"),
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
    api: `${PUBLIC_SERVER_URL}/ai/openai`,  // or /ai/anthropic, etc.
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

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Invalid API key | Check environment variable |
| `429 Too Many Requests` | Rate limit exceeded | Wait or upgrade quota |
| `500 Internal Server Error` | Code error | Check server logs |
| `Model not found` | Wrong model ID | Verify model name |
| No response | Timeout/CORS | Check network settings |

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

import { describe, it, expect } from "bun:test";
import { openai } from "@ai-sdk/openai";
import { wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";

describe("OpenAI Provider", () => {
  it("should create model instance", () => {
    const model = wrapLanguageModel({
      model: openai("gpt-4o-mini"),
      middleware: devToolsMiddleware(),
    });

    expect(model).toBeDefined();
    expect(model.provider).toBe("openai");
  });

  it("should have correct model ID", () => {
    const model = wrapLanguageModel({
      model: openai("gpt-4o-mini"),
      middleware: devToolsMiddleware(),
    });

    expect(model.modelId).toBe("gpt-4o-mini");
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

import { describe, it, expect } from "bun:test";

describe("AI Endpoint", () => {
  const serverUrl = "http://localhost:5173";

  it("should return streaming response", async () => {
    const response = await fetch(`${serverUrl}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Test" }],
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
  });

  it("should handle empty messages", async () => {
    const response = await fetch(`${serverUrl}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

app.post("/ai", async (c) => {
  const startTime = Date.now();

  try {
    const { messages } = await c.req.json();

    const model = wrapLanguageModel({
      model: openai("gpt-4o-mini"),
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
        error: "AI service temporarily unavailable",
        code: "AI_SERVICE_ERROR",
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

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Success Rate | >99% | <95% |
| Avg Response Time | <3s | >10s |
| Time to First Token | <1s | >5s |
| Error Rate | <1% | >5% |
| Daily Token Usage | <1M | >900K |

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
- Search existing GitHub issues
- Ask for help in community forums

---

## 5. Provider-Specific Configurations

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
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";
```

**Step 2: Create OpenAI Model Instance**

```typescript
// Basic model creation
const model = openai("gpt-4o-mini");

// With middleware (recommended)
const model = wrapLanguageModel({
  model: openai("gpt-4o-mini"),
  middleware: devToolsMiddleware(),
});

// With custom configuration
const model = openai("gpt-4o-mini", {
  baseURL: process.env.OPENAI_BASE_URL,
  organization: process.env.OPENAI_ORGANIZATION,
});
```

**Step 3: Update Endpoint (Replace Current Provider)**

```typescript
// apps/server/src/index.ts

app.post("/ai", async (c) => {
  const { messages } = await c.req.json();

  const model = wrapLanguageModel({
    model: openai("gpt-4o-mini"),
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
    openai: () => openai("gpt-4o-mini"),
    anthropic: () => anthropic("claude-3-5-sonnet-20241022"),
    google: () => google("gemini-2.5-flash"),
    groq: () => groq("llama-3.3-70b-versatile"),
  };

  const modelFactory = modelMap[provider as keyof typeof modelMap] || modelMap.openai;
  return wrapLanguageModel({
    model: modelFactory(),
    middleware: devToolsMiddleware(),
  });
}

app.post("/ai", async (c) => {
  const { messages, provider = "openai" } = await c.req.json();

  const result = streamText({
    model: getModel(provider),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

#### 5.1.5 Model Selection Guide

**Available OpenAI Models:**

| Model | Context | Speed | Cost (Input/Output) | Best For |
|-------|---------|-------|---------------------|----------|
| `gpt-4o` | 128K | Fast | $2.50/$10.00 | Multimodal, production |
| `gpt-4o-mini` | 128K | Very Fast | $0.15/$0.60 | High-volume, cost-effective |
| `gpt-4-turbo` | 128K | Fast | $10.00/$30.00 | Legacy GPT-4 |
| `gpt-4` | 8K | Medium | $30.00/$60.00 | Original GPT-4 |
| `gpt-3.5-turbo` | 16K | Very Fast | $0.50/$1.50 | Simple tasks, testing |
| `o1-preview` | 128K | Slow | $15.00/$60.00 | Complex reasoning |
| `o1-mini` | 128K | Slow | $3.00/$12.00 | Reasoning (faster) |

**Recommendations:**

**For SambungChat:**
- **Primary Choice:** `gpt-4o-mini` - Best balance of cost, speed, and quality
- **Premium Option:** `gpt-4o` - For complex multimodal tasks
- **Budget Option:** `gpt-3.5-turbo` - For simple queries and testing
- **Reasoning Tasks:** `o1-preview` or `o1-mini` - For complex problem-solving

**Model Selection Criteria:**

```typescript
// Example: Model selection by task complexity
function selectOpenAIModel(complexity: "low" | "medium" | "high") {
  const models = {
    low: "gpt-3.5-turbo",
    medium: "gpt-4o-mini",
    high: "gpt-4o",
  };
  return openai(models[complexity]);
}

// Example: Model selection by use case
function selectModelByUseCase(useCase: string) {
  const modelMap: Record<string, string> = {
    chat: "gpt-4o-mini",
    code: "gpt-4o",
    reasoning: "o1-preview",
    simple: "gpt-3.5-turbo",
    multimodal: "gpt-4o",
  };
  return openai(modelMap[useCase] || "gpt-4o-mini");
}
```

#### 5.1.6 Complete Integration Example

**Complete Server Implementation:**

```typescript
// apps/server/src/index.ts

import { Hono } from "hono";
import { cors } from "hono/cors";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";

const app = new Hono();

app.use("/*", cors({
  origin: ["http://localhost:5173", "http://localhost:4173"],
  credentials: true,
}));

app.post("/ai", async (c) => {
  try {
    const { messages } = await c.req.json();

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: "Invalid messages format" }, 400);
    }

    // Create model with middleware
    const model = wrapLanguageModel({
      model: openai("gpt-4o-mini"),
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
    console.error("OpenAI API Error:", error);
    return c.json(
      { error: "Failed to generate response", details: error.message },
      500
    );
  }
});

export default app;
```

#### 5.1.7 Best Practices

**1. Error Handling**

```typescript
app.post("/ai", async (c) => {
  try {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (error.status === 401) {
      return c.json({ error: "Invalid API key" }, 401);
    }
    if (error.status === 429) {
      return c.json({ error: "Rate limit exceeded" }, 429);
    }
    if (error.status === 500) {
      return c.json({ error: "OpenAI service error" }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});
```

**2. Rate Limiting**

```typescript
import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterMemory({
  points: 60, // Number of requests
  duration: 60, // Per 60 seconds
});

app.post("/ai", async (c) => {
  const ip = c.req.header("x-forwarded-for") || "unknown";
  try {
    await rateLimiter.consume(ip);
  } catch (rejRes) {
    return c.json({ error: "Too many requests" }, 429);
  }
  // ... proceed with request
});
```

**3. Cost Monitoring**

```typescript
let totalTokens = 0;
let totalCost = 0;

app.post("/ai", async (c) => {
  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: await convertToModelMessages(messages),
    onFinish: ({ usage }) => {
      totalTokens += usage.totalTokens;
      totalCost += (usage.promptTokens * 0.15 + usage.completionTokens * 0.60) / 1_000_000;
      console.log(`Total tokens: ${totalTokens}, Total cost: $${totalCost.toFixed(4)}`);
    },
  });

  return result.toUIMessageStreamResponse();
});
```

**4. Environment-Specific Models**

```typescript
const getModel = () => {
  if (process.env.NODE_ENV === "production") {
    return openai("gpt-4o-mini"); // Cost-effective for production
  }
  if (process.env.NODE_ENV === "test") {
    return openai("gpt-3.5-turbo"); // Fast for testing
  }
  return openai("gpt-4o-mini"); // Default
};
```

**5. Fallback Pattern**

```typescript
async function generateWithFallback(messages: any[]) {
  const models = [
    openai("gpt-4o-mini"),
    openai("gpt-3.5-turbo"),
  ];

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

  throw new Error("All models failed");
}
```

#### 5.1.8 Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Invalid API key | Verify `OPENAI_API_KEY` is correct |
| `429 Rate Limit` | Too many requests | Implement rate limiting, use exponential backoff |
| `Model not found` | Invalid model ID | Check model name in API documentation |
| `Context length exceeded` | Message too long | Reduce message history, use model with larger context |
| `Timeout` | Request too slow | Increase timeout, use faster model |
| `CORS error` | Frontend blocked | Configure CORS properly in server |

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
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";
```

**Step 2: Create Anthropic Model Instance**

```typescript
// Basic model creation (latest Claude 3.5 Sonnet)
const model = anthropic("claude-3-5-sonnet-20241022");

// With middleware (recommended)
const model = wrapLanguageModel({
  model: anthropic("claude-3-5-sonnet-20241022"),
  middleware: devToolsMiddleware(),
});

// With custom configuration
const model = anthropic("claude-3-5-sonnet-20241022", {
  baseURL: process.env.ANTHROPIC_BASE_URL,
});
```

**Step 3: Update Endpoint**

```typescript
// apps/server/src/index.ts

app.post("/ai", async (c) => {
  const { messages } = await c.req.json();

  const model = wrapLanguageModel({
    model: anthropic("claude-3-5-sonnet-20241022"),
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

| Model | Context | Speed | Cost (Input/Output) | Best For |
|-------|---------|-------|---------------------|----------|
| `claude-3-5-sonnet-20241022` | 200K | Medium | $3.00/$15.00 | Latest Sonnet, balanced |
| `claude-3-5-sonnet-20240620` | 200K | Medium | $3.00/$15.00 | Previous Sonnet version |
| `claude-3-opus-20240229` | 200K | Slow | $15.00/$75.00 | Most capable, complex tasks |
| `claude-3-sonnet-20240229` | 200K | Medium | $3.00/$15.00 | Balanced performance |
| `claude-3-haiku-20240307` | 200K | Fast | $0.25/$1.25 | Fast, cost-effective |

**Recommendations:**

**For SambungChat:**
- **Primary Choice:** `claude-3-5-sonnet-20241022` - Best balance of quality and cost
- **Budget Option:** `claude-3-haiku-20240307` - For simple queries and high-volume
- **Complex Tasks:** `claude-3-opus-20240229` - For reasoning-intensive tasks

**Model Selection by Use Case:**

```typescript
function selectAnthropicModel(useCase: string) {
  const modelMap: Record<string, string> = {
    chat: "claude-3-5-sonnet-20241022",
    "long-context": "claude-3-5-sonnet-20241022", // 200K tokens
    reasoning: "claude-3-opus-20240229",
    simple: "claude-3-haiku-20240307",
    code: "claude-3-5-sonnet-20241022",
  };
  return anthropic(modelMap[useCase] || "claude-3-5-sonnet-20241022");
}
```

#### 5.2.6 Special Features

**Extended Context (200K Tokens)**

```typescript
// Example: Handling long documents
async function processLongDocument(document: string) {
  const model = anthropic("claude-3-5-sonnet-20241022");

  // Can handle documents up to ~150,000 words (200K tokens)
  const result = await streamText({
    model,
    messages: [
      { role: "user", content: `Analyze this document:\n\n${document}` }
    ],
  });

  return result.toUIMessageStreamResponse();
}
```

**Thinking Mode (Beta)**

```typescript
// Claude's extended thinking for complex reasoning
const model = anthropic("claude-3-5-sonnet-20241022", {
  experimental_thinking: {
    type: "enabled",
    budgetTokens: 10000, // Reserve tokens for thinking
  },
});
```

#### 5.2.7 Complete Integration Example

```typescript
// apps/server/src/index.ts

import { Hono } from "hono";
import { cors } from "hono/cors";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";

const app = new Hono();

app.use("/*", cors({
  origin: ["http://localhost:5173", "http://localhost:4173"],
  credentials: true,
}));

app.post("/ai", async (c) => {
  try {
    const { messages } = await c.req.json();

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: "Invalid messages format" }, 400);
    }

    // Create model with middleware
    const model = wrapLanguageModel({
      model: anthropic("claude-3-5-sonnet-20241022"),
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
    console.error("Anthropic API Error:", error);

    // Handle specific Anthropic errors
    if (error.status === 401) {
      return c.json({ error: "Invalid API key" }, 401);
    }
    if (error.status === 429) {
      return c.json({ error: "Rate limit exceeded" }, 429);
    }
    if (error.status === 400) {
      return c.json({ error: "Invalid request", details: error.message }, 400);
    }

    return c.json(
      { error: "Failed to generate response", details: error.message },
      500
    );
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
    model: anthropic("claude-3-5-sonnet-20241022"),
    messages: [
      ...history,
      { role: "user", content: newMessage },
    ],
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
    return anthropic("claude-3-haiku-20240307"); // Fast, cheap
  }

  return anthropic("claude-3-5-sonnet-20241022"); // Default
}
```

**3. Handle Rate Limits**

```typescript
import RateLimit from "express-rate-limit";

const anthropicLimiter = RateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Anthropic default rate limit
  message: "Too many requests to Anthropic API",
});

app.post("/ai", anthropicLimiter, async (c) => {
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
  const totalTokens = messages.reduce((sum, msg) =>
    sum + estimateTokens(msg.content), 0
  );

  if (totalTokens > 150000) {
    throw new Error("Message too long (would exceed 200K context)");
  }

  const estimatedCost = (totalTokens * 3) / 1_000_000; // Input cost per million
  console.log(`Estimated cost: $${estimatedCost.toFixed(4)}`);

  return streamText({
    model: anthropic("claude-3-5-sonnet-20241022"),
    messages: await convertToModelMessages(messages),
  });
}
```

#### 5.2.9 Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Invalid API key | Verify `ANTHROPIC_API_KEY` is correct |
| `429 Rate Limit` | Too many requests | Implement rate limiting (50 req/min default) |
| `400 Invalid Request` | Malformed request | Check message format, parameters |
| `Context length exceeded` | Message > 200K tokens | Reduce message history |
| `Timeout` | Request too slow | Increase timeout, use Haiku for speed |
| `CORS error` | Frontend blocked | Configure CORS properly |

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
import { groq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";
```

**Step 2: Create Groq Model Instance**

```typescript
// Basic model creation (Llama 3.3 70B - most capable)
const model = groq("llama-3.3-70b-versatile");

// With middleware (recommended)
const model = wrapLanguageModel({
  model: groq("llama-3.3-70b-versatile"),
  middleware: devToolsMiddleware(),
});

// With custom configuration
const model = groq("llama-3.3-70b-versatile", {
  baseURL: process.env.GROQ_BASE_URL,
});
```

**Step 3: Update Endpoint**

```typescript
// apps/server/src/index.ts

app.post("/ai", async (c) => {
  const { messages } = await c.req.json();

  const model = wrapLanguageModel({
    model: groq("llama-3.3-70b-versatile"),
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

| Model | Context | Speed | Cost (Input/Output) | Best For |
|-------|---------|-------|---------------------|----------|
| `llama-3.3-70b-versatile` | 131K | Very Fast | $0.59/$0.79 | Most capable, general-purpose |
| `llama-3.1-70b-versatile` | 131K | Very Fast | $0.59/$0.79 | Large context, strong performance |
| `llama-3.1-8b-instant` | 131K | Ultra Fast | $0.05/$0.08 | Ultra-low latency, high volume |
| `mixtral-8x7b-32768` | 32K | Very Fast | $0.24/$0.24 | Mixture-of-Experts, fast |
| `gemma-2-9b-it` | 8K | Ultra Fast | $0.08/$0.08 | Compact, very fast |
| `gemma-7b-it` | 8K | Ultra Fast | $0.08/$0.08 | Older Gemma model |

**Recommendations:**

**For SambungChat:**
- **Primary Choice:** `llama-3.3-70b-versatile` - Best quality, still very fast
- **Ultra-Low Latency:** `llama-3.1-8b-instant` - For real-time chat
- **Budget Option:** `gemma-2-9b-it` - Fastest and cheapest

**Model Selection by Use Case:**

```typescript
function selectGroqModel(useCase: string) {
  const modelMap: Record<string, string> = {
    chat: "llama-3.3-70b-versatile", // Best quality
    realtime: "llama-3.1-8b-instant", // Ultra-fast
    "high-volume": "llama-3.1-8b-instant", // Cost-effective
    simple: "gemma-2-9b-it", // Fastest
    reasoning: "llama-3.3-70b-versatile", // Most capable
  };
  return groq(modelMap[useCase] || "llama-3.3-70b-versatile");
}
```

#### 5.3.6 Complete Integration Example

```typescript
// apps/server/src/index.ts

import { Hono } from "hono";
import { cors } from "hono/cors";
import { groq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";

const app = new Hono();

app.use("/*", cors({
  origin: ["http://localhost:5173", "http://localhost:4173"],
  credentials: true,
}));

app.post("/ai", async (c) => {
  try {
    const { messages } = await c.req.json();

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: "Invalid messages format" }, 400);
    }

    // Create model with middleware
    const model = wrapLanguageModel({
      model: groq("llama-3.3-70b-versatile"),
      middleware: devToolsMiddleware(),
    });

    // Stream text generation
    const result = streamText({
      model,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error("Groq API Error:", error);

    // Handle specific Groq errors
    if (error.status === 401) {
      return c.json({ error: "Invalid API key" }, 401);
    }
    if (error.status === 429) {
      return c.json({ error: "Rate limit exceeded" }, 429);
    }

    return c.json(
      { error: "Failed to generate response", details: error.message },
      500
    );
  }
});

export default app;
```

#### 5.3.7 Best Practices

**1. Leverage Speed for Real-Time Applications**

```typescript
// Use 8B model for real-time chat
const realtimeModel = groq("llama-3.1-8b-instant");

app.post("/ai/realtime", async (c) => {
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

app.post("/ai", async (c) => {
  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
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
  const totalLength = messages.reduce((sum, msg) =>
    sum + msg.content.length, 0
  );

  // Use smaller model for short messages
  if (totalLength < 500) {
    return groq("llama-3.1-8b-instant"); // Ultra-fast for short queries
  }

  return groq("llama-3.3-70b-versatile"); // Default
}
```

**4. A/B Testing Models**

```typescript
// Split traffic between models for comparison
const models = [
  groq("llama-3.3-70b-versatile"),
  groq("llama-3.1-8b-instant"),
];

app.post("/ai", async (c) => {
  const { messages, variant = "A" } = await c.req.json();

  const modelIndex = variant === "A" ? 0 : 1;
  const model = models[modelIndex];

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
});
```

#### 5.3.8 Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Invalid API key | Verify `GROQ_API_KEY` is correct |
| `429 Rate Limit` | Too many requests | Groq has generous limits, but implement rate limiting |
| `Model not found` | Invalid model ID | Check model name in Groq documentation |
| `Timeout` | Network issues | Groq is very fast, timeouts are rare |
| `CORS error` | Frontend blocked | Configure CORS properly |

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
import { createOllama } from "ollama-ai-provider";
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";

// Create Ollama instance
const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
});

// Create model
const model = wrapLanguageModel({
  model: ollama("llama3.2"),
  middleware: devToolsMiddleware(),
});

app.post("/ai", async (c) => {
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
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";

// Create OpenAI-compatible client for Ollama
const ollama = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || "http://localhost:11434/v1",
  apiKey: process.env.OPENAI_API_KEY || "ollama", // Required but not used
});

// Create model (use "gpt-3.5-turbo" as placeholder, Ollama ignores it)
const model = wrapLanguageModel({
  model: ollama("llama3.2"), // Ollama uses the actual model name
  middleware: devToolsMiddleware(),
});

app.post("/ai", async (c) => {
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

| Model | Parameters | Context | Speed | Best For |
|-------|-----------|---------|-------|----------|
| `llama3.2` | 3B-90B | 128K | Medium-High | General-purpose, latest Llama |
| `llama3.1` | 8B-70B | 128K | Medium-High | Proven Llama 3.1 |
| `mistral` | 7B | 32K | High | Fast, efficient |
| `gemma2` | 9B-27B | 8K | High | Google's Gemma models |
| `qwen2.5` | 3B-72B | 32K | Medium | Alibaba's Qwen (strong reasoning) |
| `deepseek-r1` | 1.5B-70B | 64K | Low-Medium | DeepSeek R1 (reasoning specialist) |

**Model Selection by Use Case:**

```typescript
function selectOllamaModel(useCase: string, hardware: "low" | "medium" | "high") {
  const modelMap: Record<string, Record<string, string>> = {
    chat: {
      low: "llama3.2:3b",   // Smaller model for low-end hardware
      medium: "llama3.2:9b", // Balanced for medium hardware
      high: "llama3.2:70b",  // Largest for high-end hardware
    },
    realtime: {
      low: "phi3:mini",      // Very small, fast
      medium: "gemma2:9b",   // Fast and capable
      high: "llama3.2:9b",   // Best quality/speed balance
    },
    reasoning: {
      low: "deepseek-r1:1.5b",
      medium: "deepseek-r1:7b",
      high: "deepseek-r1:32b",
    },
  };

  return modelMap[useCase]?.[hardware] || "llama3.2:9b";
}
```

#### 5.4.6 Hardware Requirements

**Recommended Hardware by Model Size:**

| Model Size | RAM | GPU | VRAM | Use Case |
|-----------|-----|-----|------|----------|
| 3B (Llama 3.2) | 8GB | Not required | - | Testing, low-end hardware |
| 7B-9B | 16GB | Optional (6GB VRAM) | 6GB | Development, moderate use |
| 14B-16B | 32GB | Recommended (10GB VRAM) | 10GB | Production use |
| 32B-70B | 64GB+ | Required (24GB VRAM) | 24GB | High-quality production |

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

import { Hono } from "hono";
import { cors } from "hono/cors";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";

const app = new Hono();

app.use("/*", cors({
  origin: ["http://localhost:5173", "http://localhost:4173"],
  credentials: true,
}));

// Create Ollama client using OpenAI-compatible interface
const ollama = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || "http://localhost:11434/v1",
  apiKey: process.env.OPENAI_API_KEY || "ollama",
});

app.post("/ai", async (c) => {
  try {
    const { messages, model = "llama3.2:9b" } = await c.req.json();

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: "Invalid messages format" }, 400);
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
    console.error("Ollama Error:", error);

    // Handle common Ollama errors
    if (error.code === "ECONNREFUSED") {
      return c.json(
        { error: "Ollama server not running. Start with: ollama serve" },
        503
      );
    }

    if (error.message?.includes("model")) {
      return c.json(
        { error: "Model not found. Pull with: ollama pull " + (await c.req.json()).model },
        400
      );
    }

    return c.json(
      { error: "Failed to generate response", details: error.message },
      500
    );
  }
});

// Health check endpoint
app.get("/ai/health", async (c) => {
  try {
    const response = await fetch(`${process.env.OPENAI_BASE_URL || "http://localhost:11434"}/api/tags`);
    if (response.ok) {
      const models = await response.json();
      return c.json({ status: "healthy", models: models.models });
    }
    return c.json({ status: "unhealthy" }, 503);
  } catch (error) {
    return c.json({ status: "unhealthy", error: error.message }, 503);
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
    return "llama3.2:70b"; // High-end GPU
  } else if (gpuMemory >= 10) {
    return "llama3.2:9b";  // Mid-range GPU
  } else if (gpuMemory >= 6) {
    return "llama3.2:3b";  // Low-end GPU
  } else {
    return "phi3:mini";     // CPU-only
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
      messages: [{ role: "user", content: "Hi" }],
      maxTokens: 1,
    });
    console.log(`Model ${modelName} warmed up`);
  } catch (error) {
    console.error("Failed to warm up model:", error);
  }
}

// Call on server startup
warmUpModel("llama3.2:9b");
```

**3. Fallback to Cloud**

```typescript
// Fallback to cloud provider if Ollama fails
async function generateWithFallback(messages: any[]) {
  try {
    // Try Ollama first (free, private)
    return await streamText({
      model: ollama("llama3.2:9b"),
      messages: await convertToModelMessages(messages),
    });
  } catch (error) {
    console.error("Ollama failed, falling back to cloud:", error);

    // Fallback to Groq (very low cost)
    return await streamText({
      model: groq("llama-3.1-8b-instant"),
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

app.post("/ai", async (c) => {
  try {
    // Try Ollama
    const result = streamText({
      model: ollama("llama3.2:9b"),
      messages: await convertToModelMessages(messages),
    });

    ollamaRequests++;
    return result.toUIMessageStreamResponse();

  } catch (error) {
    // Fallback to cloud
    const result = streamText({
      model: groq("llama-3.1-8b-instant"),
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

| Issue | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Ollama not running | Start with `ollama serve` |
| `Model not found` | Model not pulled | Run `ollama pull <model>` |
| Very slow response | CPU-only inference | Use GPU, smaller model |
| Out of memory | Model too large for RAM | Use smaller model (3B/7B) |
| CORS error | Remote server blocking | Set `OLLAMA_ORIGINS` env var |
| High latency | Cold start | Warm up model on startup |

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
import { mistral } from "@ai-sdk/mistral";

const model = mistral("mistral-small-latest");
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
import { createAzure } from "@ai-sdk/azure";

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});

const model = azure("gpt-4o");
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
import { createTogetherAi } from "@ai-sdk/togetherai";

const togetherai = createTogetherAi({
  apiKey: process.env.TOGETHER_AI_API_KEY,
});

const model = togetherai("meta-llama/Llama-3-70b-chat-hf");
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
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter();

const model = openrouter("anthropic/claude-3.5-sonnet");
```

---

### 5.6 Provider Comparison Summary

| Provider | Best For | Cost | Speed | Context | Ease of Setup |
|----------|----------|------|-------|---------|---------------|
| **OpenAI** | General-purpose | Medium | Fast | 128K | ⭐⭐⭐⭐⭐ |
| **Anthropic** | Complex reasoning, long documents | High | Medium | 200K | ⭐⭐⭐⭐⭐ |
| **Groq** | Real-time, high-volume | Very Low | Very Fast | 131K | ⭐⭐⭐⭐⭐ |
| **Ollama** | Local, offline, privacy | Free | Slow-Medium | 8K-128K | ⭐⭐⭐ |
| **Google** | Cost-performance balance | Low | Fast | 2M | ⭐⭐⭐⭐⭐ |

**Recommendation for SambungChat:**

Based on the current implementation and analysis:

1. **Primary Provider:** **Google Gemini** (gemini-2.5-flash)
   - Excellent cost-performance ratio
   - Already implemented
   - Fast inference with 2M token context

2. **Secondary Options:**
   - **OpenAI** (gpt-4o-mini) - For general-purpose use
   - **Groq** (llama-3.3-70b) - For ultra-low latency
   - **Anthropic** (claude-3-5-sonnet) - For complex reasoning

3. **Local Development:**
   - **Ollama** (llama3.2) - For offline testing and development

---

## Next Sections

> **Next:** [6. Environment Configuration](#6-environment-configuration)
>
> This section covers environment variable patterns, validation strategies, and configuration templates for multiple providers.

---

**Document Status:** 🚧 In Progress - Phase 3, Task 4 (Section 5 Complete)

**Last Updated:** 2025-01-12
**Contributors:** SambungChat Development Team
