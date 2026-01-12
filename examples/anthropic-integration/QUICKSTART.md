# Anthropic Integration - Quick Start

Get up and running with Anthropic's Claude AI in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Anthropic API key ([Get one here](https://console.anthropic.com/))

## Setup (2 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Key

```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local and add your API key
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## Run (1 minute)

```bash
# Start the server
npm run dev

# You should see:
# 🤖 Anthropic AI Server starting on port 3001
# 📝 Model: claude-3-5-sonnet-20241022
# 🔑 API Key: ✅ Configured
```

## Test (2 minutes)

### Option 1: Automated Tests

```bash
npm test
```

### Option 2: Manual Test with cURL

```bash
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

## Available Models

| Model | Best For | Cost |
|-------|----------|------|
| `claude-3-5-sonnet-20241022` | Balanced (default) | Medium |
| `claude-3-5-haiku-20241022` | Fast, cheap | Low |
| `claude-3-opus-20240229` | Highest quality | High |
| `claude-3-sonnet-20240229` | Balanced | Medium |
| `claude-3-haiku-20240307` | Fastest, cheapest | Lowest |

Change models in `.env.local`:
```bash
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
```

## What's Next?

- Read the full [README.md](./README.md) for detailed documentation
- Check the [main integration guide](../../docs/ai-provider-integration-guide.md)
- Explore error handling, testing, and deployment options

## Troubleshooting

**Server won't start?**
- Ensure Node.js 18+ is installed: `node --version`

**API key error?**
- Verify your key starts with `sk-ant-`
- Check `.env.local` file exists and has no extra spaces

**Tests failing?**
- Ensure server is running: `npm run dev` (in one terminal)
- Run tests in another terminal: `npm test`

## Support

- [Anthropic Documentation](https://docs.anthropic.com/)
- [AI SDK Anthropic Provider](https://sdk.vercel.ai/docs/ai-sdk/providers/anthropic)
- [Open an issue](https://github.com/your-repo/issues)
