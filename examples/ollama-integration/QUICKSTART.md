# Ollama Integration - Quick Start

Get up and running with Ollama in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Ollama installed ([Download from ollama.com](https://ollama.com/download))
- At least 8GB RAM (16GB+ recommended for larger models)

## Quick Setup

### 1. Install Ollama (if not already installed)

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download installer from [ollama.com/download](https://ollama.com/download)

### 2. Start Ollama Server

Open a new terminal and run:
```bash
ollama serve
```

Keep this terminal running. You should see:
```
INFO[0000] ollama is running
```

### 3. Pull a Model

In another terminal, pull your first model:
```bash
ollama pull llama3.2
```

This downloads the model (typically 2-4GB). You only need to do this once.

### 4. Install Dependencies

```bash
npm install
```

### 5. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env.local

# The defaults work, but you can customize .env.local
# OLLAMA_MODEL=llama3.2
# OLLAMA_BASE_URL=http://localhost:11434
```

### 6. Start the Server

```bash
npm run dev
```

You should see:
```
🦙 Ollama AI Server starting on port 3001
📝 Model: llama3.2
🔗 Server URL: http://localhost:11434
🌐 Health Check: http://localhost:3001/health
💬 Chat Endpoint: http://localhost:3001/ai

⚠️  Make sure Ollama is running: ollama serve
⚠️  Make sure the model is pulled: ollama pull llama3.2
```

### 7. Test the Integration

```bash
# Quick test with curl
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Say hello!"}]}'
```

### 8. Run Automated Tests

```bash
./test.sh
```

## Available Models

| Model | Size | Context | Speed | Best For | Hardware |
|-------|------|---------|-------|----------|----------|
| `llama3.2` | 3B-70B | 128K | ⚡⚡⚡ | General purpose | CPU/GPU |
| `llama3.1` | 8B-405B | 128K | ⚡⚡ | Reasoning | CPU/GPU |
| `mistral` | 7B | 8K | ⚡⚡⚡ | Fast, efficient | CPU/GPU |
| `codellama` | 7B-34B | 16K | ⚡⚡ | Code generation | CPU/GPU |
| `phi3` | 3.8B-14B | 128K | ⚡⚡⚡ | Lightweight | CPU |
| `gemma2` | 2B-27B | 8K | ⚡⚡⚡ | Fast tasks | CPU/GPU |
| `qwen2.5` | 0.5B-72B | 32K | ⚡⚡ | Multilingual | CPU/GPU |

Pull a different model:
```bash
ollama pull mistral
```

Then update `.env.local`:
```bash
OLLAMA_MODEL=mistral
```

## Hardware Requirements

**Minimum (CPU-only):**
- 8GB RAM
- Works with: phi3, gemma2, llama3.2:3b

**Recommended (GPU):**
- 16GB+ RAM
- NVIDIA GPU with 8GB+ VRAM
- Works with: All models, faster inference

**For Development:**
- Use llama3.2:3b or phi3 for fast responses
- Use llama3.2:70b for better quality (requires more RAM)

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check out the [main integration guide](../../docs/ai-provider-integration-guide.md)
- Explore other provider examples

## Troubleshooting

**Ollama not running?**
```bash
# Start Ollama server
ollama serve
```

**Model not found?**
```bash
# List available models
ollama list

# Pull the model
ollama pull llama3.2
```

**Out of memory?**
- Try a smaller model: phi3, gemma2:2b
- Close other applications
- Check RAM usage: `ollama ps`

**Connection errors?**
- Verify Ollama is running: `ps aux | grep ollama`
- Check port 11434 is available
- Try `curl http://localhost:11434/api/tags` to test Ollama directly

**Need help?**
- See [README.md](./README.md) troubleshooting section
- Check [Ollama documentation](https://github.com/ollama/ollama)
- Search [Ollama issues](https://github.com/ollama/ollama/issues)

## What Makes Ollama Special?

🦙 **100% Free & Local:** No API costs, complete privacy
🔒 **Privacy First:** Data never leaves your machine
🚀 **Fast Inference:** Runs directly on your hardware
🔄 **Offline:** Works without internet connection
💰 **Zero API Costs:** No usage limits or billing
🎯 **100+ Models:** Llama, Mistral, Gemma, Phi, and more

Enjoy local AI! 🦙
