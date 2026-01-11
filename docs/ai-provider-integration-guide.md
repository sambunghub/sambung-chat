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

## Next Sections

> **Next:** [4. Step-by-Step Integration Guide](#4-step-by-step-integration-guide)
>
> This section provides detailed, step-by-step instructions for integrating new AI providers into SambungChat.

---

**Document Status:** 🚧 In Progress - Phase 3, Task 2 (Section 3 Complete)

**Last Updated:** 2025-01-11
**Contributors:** SambungChat Development Team
