# Groq Integration - Quick Start

Get up and running with Groq in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- A Groq API key ([Get one free](https://console.groq.com/keys))

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local and add your API key
# GROQ_API_KEY=gsk_your-actual-api-key-here
```

### 3. Start the Server

```bash
npm run dev
```

You should see:
```
⚡ Groq AI Server starting on port 3001
📝 Model: llama-3.3-70b-versatile
🔑 API Key: ✅ Configured
🌐 Health Check: http://localhost:3001/health
💬 Chat Endpoint: http://localhost:3001/ai
```

### 4. Test the Integration

```bash
# Quick test with curl
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Say hello!"}]}'
```

### 5. Run Automated Tests

```bash
./test.sh
```

## Available Models

| Model | Context | Speed | Best For |
|-------|---------|-------|----------|
| `llama-3.3-70b-versatile` | 131K | ⚡⚡⚡ | General purpose |
| `llama-3.1-70b-versatile` | 131K | ⚡⚡⚡ | General purpose |
| `mixtral-8x7b-32768` | 32K | ⚡⚡ | Complex reasoning |
| `gemma2-9b-it` | 8K | ⚡⚡⚡ | Fastest responses |

Change the model in `.env.local`:
```bash
GROQ_MODEL=gemma2-9b-it
```

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check out the [main integration guide](../../docs/ai-provider-integration-guide.md)
- Explore other provider examples

## Troubleshooting

**Server won't start?**
- Check that `GROQ_API_KEY` is set in `.env.local`
- Verify Node.js version is 18+

**API errors?**
- Verify your API key is correct at [console.groq.com](https://console.groq.com/keys)
- Check the server logs for detailed error messages

**Need help?**
- See [README.md](./README.md) troubleshooting section
- Check [Groq Status](https://status.groq.com/)

## What Makes Groq Special?

⚡ **Ultra-Fast:** 10-20x faster than other providers
💰 **Low Cost:** Significantly cheaper than GPT-4 or Claude
🔓 **Open Models:** Uses open-source Llama, Mixtral, and Gemma
🚀 **LPU Inference:** Custom hardware for maximum speed

Enjoy the speed! 🚀
