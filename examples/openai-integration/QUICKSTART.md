# OpenAI Integration - Quick Start

Get OpenAI working in SambungChat in 5 minutes.

## 1. Install Dependencies

```bash
cd apps/server
npm install @ai-sdk/openai
```

## 2. Set API Key

Create `.env.local`:

```bash
OPENAI_API_KEY=sk-your-key-here
```

Get your key from: https://platform.openai.com/api-keys

## 3. Update Server Code

In `apps/server/src/index.ts`:

```typescript
// Replace this import:
// import { google } from "@ai-sdk/google";

// With this:
import { openai } from "@ai-sdk/openai";

// Replace this model creation:
// const model = google("gemini-2.5-flash");

// With this:
const model = openai("gpt-4o-mini");
```

## 4. Test It

```bash
# Start server
npm run dev

# Test with curl
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello from OpenAI!"}
    ]
  }'
```

## 5. Done! 🎉

OpenAI is now integrated. The frontend works automatically with no changes.

---

## Available Models

- `gpt-4o-mini` - Fast and affordable (recommended)
- `gpt-4o` - Best for complex tasks
- `o1-mini` - Great for coding
- `o1-preview` - Advanced reasoning

Change the model in `.env.local`:

```bash
OPENAI_MODEL=gpt-4o
```

---

## Need Help?

- Full guide: [README.md](./README.md)
- Troubleshooting: See "Troubleshooting" section in README
- OpenAI docs: https://platform.openai.com/docs
