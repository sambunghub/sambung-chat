# Multi-Provider Integration - 5 Minute Quick Start

This guide will get you up and running with the multi-provider integration in 5 minutes.

## 🎯 What You'll Learn

- How to switch between AI providers without changing code
- How to set up fallback chains for high availability
- How to use the provider factory helper functions

## ⏱️ Timeline

- ⏱️ **1 minute** - Install dependencies
- ⏱️ **2 minutes** - Configure environment
- ⏱️ **1 minute** - Start the server
- ⏱️ **1 minute** - Test the integration

**Total: 5 minutes**

## 📦 Prerequisites

- Node.js 18+ installed
- An API key from at least one provider:
  - [OpenAI](https://platform.openai.com/api-keys) (recommended for beginners)
  - [Anthropic](https://console.anthropic.com/)
  - [Google AI Studio](https://aistudio.google.com/app/apikey)
  - [Groq](https://console.groq.com/keys)
  - Or [Ollama](https://ollama.com/) installed for local AI

## 🚀 Quick Start

### Step 1: Install Dependencies (1 minute)

```bash
npm install
```

This installs the AI SDK and all provider packages:
- `@ai-sdk/openai`
- `@ai-sdk/anthropic`
- `@ai-sdk/google`
- `@ai-sdk/groq`
- `ai` (core SDK)

### Step 2: Configure Environment (2 minutes)

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and configure **ONE** provider:

#### Option A: OpenAI (Recommended)
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key-here
```

#### Option B: Anthropic
```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

#### Option C: Google
```bash
AI_PROVIDER=google
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key-here
```

#### Option D: Groq (Fastest)
```bash
AI_PROVIDER=groq
GROQ_API_KEY=gsk-your-key-here
```

#### Option E: Ollama (Free, Local)
```bash
# First, install and start Ollama
ollama serve
ollama pull llama3.2

# Then configure
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
```

### Step 3: Start the Server (1 minute)

```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════════════════════════════╗
║  🚀 Multi-Provider AI Server                                    ║
║  Easy Provider Switching via Environment Variables              ║
╚════════════════════════════════════════════════════════════════╝

📡 Server running on port 3001
🔄 Provider: openai (auto-selected)
🔑 Configured Providers: openai

Endpoints:
  🌐 Health Check:  http://localhost:3001/health
  💬 Chat:          POST http://localhost:3001/ai
  📊 Providers:     http://localhost:3001/ai/providers
  📝 Models:        http://localhost:3001/ai/models
```

### Step 4: Test the Integration (1 minute)

#### Test 1: Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "configured": true
}
```

#### Test 2: Send a Message

```bash
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello! What is 2+2?"}]}'
```

Expected response: Streaming text with the answer "4"

#### Test 3: Check Available Providers

```bash
curl http://localhost:3001/ai/providers
```

Expected response:
```json
{
  "active": "openai",
  "providers": [...],
  "count": {
    "total": 1,
    "configured": 1
  }
}
```

## 🎉 Congratulations!

You've successfully set up the multi-provider integration!

## 🔄 Now Try This: Switch Providers (No Code Changes!)

### From OpenAI to Anthropic

1. Stop the server (Ctrl+C)
2. Edit `.env`:
   ```bash
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```
3. Start the server again:
   ```bash
   npm run dev
   ```
4. Test again:
   ```bash
   curl http://localhost:3001/health
   ```

**Result:** You're now using Anthropic instead of OpenAI - **zero code changes!**

## 🔗 Set Up Fallback Chain

Configure multiple providers for automatic failover:

```bash
# .env
AI_PROVIDER=openai,anthropic,groq
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk-...
```

Now if OpenAI fails, it automatically falls back to Anthropic, then Groq!

## 📚 Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Explore [provider-factory.ts](./provider-factory.ts) to understand the abstraction
- Check [server.ts](./server.ts) for implementation details
- Run `npm test` for automated testing

## ❓ Troubleshooting

### "No AI provider configured"

Make sure you set at least one API key in `.env`:
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-key-here
```

### "API_KEY is required"

You set `AI_PROVIDER` but didn't set the corresponding API key:
```bash
# ❌ Wrong
AI_PROVIDER=openai
ANTHROPIC_API_KEY=sk-ant-...  # This is for Anthropic, not OpenAI!

# ✅ Correct
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...  # This is for OpenAI
```

### Port already in use

Change the port in `.env`:
```bash
PORT=3002
```

## 🎓 Key Takeaways

1. **Provider Factory Pattern** - `createModelAuto(env)` abstracts provider creation
2. **Environment-Driven** - Switch providers via `AI_PROVIDER` variable
3. **Fallback Chains** - Use commas for automatic failover: `AI_PROVIDER=openai,anthropic`
4. **Zero Code Changes** - Switch providers without touching code
5. **Type Safe** - Full TypeScript support

## 💡 Pro Tips

- **Development**: Use Ollama (free, local)
- **Production**: Use fallback chains (reliable)
- **Cost Optimization**: Order by cost: `AI_PROVIDER=groq,google,openai`
- **Performance**: Use Groq for speed (ultra-fast LPU inference)

## 📞 Need Help?

- Check the full [README.md](./README.md)
- See [Troubleshooting](./README.md#troubleshooting) section
- Review [API Endpoints](./README.md#api-endpoints)

---

**You're all set!** 🎉

You can now easily switch between any AI provider in seconds, just by changing environment variables. Happy coding!
