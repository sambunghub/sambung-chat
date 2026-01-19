# Ollama Integration Example

A complete, production-ready example of integrating Ollama as a local AI provider in SambungChat.

## Overview

This example demonstrates how to:

1. Install and configure Ollama for local AI inference
2. Set up environment variables for Ollama models
3. Implement server-side streaming with Ollama
4. Test the integration comprehensively
5. Handle errors and edge cases (connection issues, model management)
6. Deploy to production
7. Optimize performance for local hardware

## Why Ollama?

**Ollama enables 100% local AI inference:**

- 🦙 **100% Free:** No API costs, no usage limits
- 🔒 **Privacy First:** Data never leaves your machine
- 🚀 **Fast Inference:** Runs directly on your CPU/GPU
- 🔄 **Offline:** Works without internet connection
- 💰 **Zero API Costs:** No billing or subscriptions
- 🎯 **100+ Models:** Llama, Mistral, Gemma, Phi, Qwen, Code Llama, and more
- 🔧 **Easy Setup:** One command to install, one command to run

### When to Use Ollama?

✅ **Perfect for:**
- Development and testing (no API costs)
- Privacy-sensitive applications
- Offline environments
- Cost-sensitive deployments
- Custom model fine-tuning
- Regulatory compliance (data locality)

❌ **Not ideal for:**
- Production environments needing high availability
- Low-latency requirements (GPU helps but cloud is faster)
- Complex multi-user scenarios (scaling challenges)
- Mobile applications (requires local server)

## Prerequisites

- Node.js 18+ and npm
- Ollama installed ([Download from ollama.com](https://ollama.com/download))
- At least 8GB RAM (16GB+ recommended for larger models)
- 10GB+ disk space for models

## Installation

### Step 1: Install Ollama

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

Verify installation:
```bash
ollama --version
```

### Step 2: Install Dependencies

```bash
cd examples/ollama-integration
npm install
```

### Step 3: Start Ollama Server

Open a terminal and run:
```bash
ollama serve
```

Keep this terminal running. The server will start on `http://localhost:11434`.

### Step 4: Pull a Model

In another terminal, pull your first model:
```bash
ollama pull llama3.2
```

This downloads the model files (2-4GB depending on the model). You only need to do this once per model.

Verify the model is available:
```bash
ollama list
```

### Step 5: Configure Environment Variables

Create `.env.local` in the example directory:

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` (optional, defaults work):
```bash
# Select your model (default: llama3.2)
OLLAMA_MODEL=llama3.2

# Ollama server URL (default: http://localhost:11434)
# OLLAMA_BASE_URL=http://localhost:11434
```

**Important:** Never commit `.env.local` to version control. Use `.env.example` for documentation.

### Step 6: Start the Server

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

## Server Implementation

### File: `server.ts`

The server uses the **OpenAI-compatible approach** for Ollama integration:

```typescript
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages } from "ai";
import { wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";

// Create OpenAI-compatible client for Ollama
const ollamaClient = createOpenAI({
  baseURL: `${baseURL}/v1`,  // Ollama's OpenAI-compatible endpoint
  apiKey: "ollama",           // Ollama doesn't require a real API key
});

// Create model instance
const model = wrapLanguageModel({
  model: ollamaClient(modelId),
  middleware: devToolsMiddleware(),
});

// Stream responses
const result = streamText({
  model,
  messages: convertToCoreMessages(messages),
  temperature: 0.7,
  maxTokens: 2048,
});

// Return stream
return result.toDataStreamResponse();
```

### Key Implementation Details

**1. OpenAI-Compatible Client:**
```typescript
const ollamaClient = createOpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama", // Dummy key, Ollama ignores it
});
```

**2. No API Key Required:**
- Ollama runs locally and doesn't need authentication
- Uses a dummy API key for OpenAI client compatibility

**3. Connection Handling:**
- Validates Ollama server is running
- Provides helpful error messages for connection failures
- Includes troubleshooting steps in error responses

**4. Model Management:**
- Checks if model is available
- Provides pull commands in error messages
- Lists available models via `/ai/models` endpoint

## Available Models

Ollama supports 100+ models. Here are the most popular:

| Model | Parameters | Context | Speed | Best For | Hardware | Pull Command |
|-------|------------|---------|-------|----------|----------|--------------|
| **llama3.2** | 3B-70B | 128K | ⚡⚡⚡ | General purpose | CPU/GPU | `ollama pull llama3.2` |
| **llama3.1** | 8B-405B | 128K | ⚡⚡ | Reasoning | CPU/GPU | `ollama pull llama3.1` |
| **mistral** | 7B | 8K | ⚡⚡⚡ | Fast, efficient | CPU/GPU | `ollama pull mistral` |
| **codellama** | 7B-34B | 16K | ⚡⚡ | Code generation | CPU/GPU | `ollama pull codellama` |
| **phi3** | 3.8B-14B | 128K | ⚡⚡⚡ | Lightweight | CPU | `ollama pull phi3` |
| **gemma2** | 2B-27B | 8K | ⚡⚡⚡ | Fast tasks | CPU/GPU | `ollama pull gemma2` |
| **qwen2.5** | 0.5B-72B | 32K | ⚡⚡ | Multilingual, coding | CPU/GPU | `ollama pull qwen2.5` |
| **deepseek-coder** | 6.7B-33B | 16K | ⚡⚡ | Coding | CPU/GPU | `ollama pull deepseek-coder` |

### Model Selection Guide

**For Development (Fast):**
- `phi3:3.8b` - Lightweight, fast responses
- `gemma2:2b` - Ultra-fast, good for testing

**For General Use (Balanced):**
- `llama3.2:3b` - Good quality, fast
- `mistral:7b` - Popular, well-rounded

**For Best Quality (Slower):**
- `llama3.2:70b` - Best reasoning (requires 16GB+ RAM)
- `qwen2.5:72b` - Excellent for coding

**For Code Generation:**
- `codellama:13b` - Specialized for code
- `deepseek-coder:33b` - Excellent coding assistant

### Hardware Requirements

| Model Size | Minimum RAM | Recommended RAM | GPU |
|------------|-------------|-----------------|-----|
| 2B-3B (phi3, gemma2:2b) | 4GB | 8GB | Optional |
| 7B-8B (mistral, llama3.2:3b) | 8GB | 16GB | Optional |
| 13B-14B (codellama:13b, phi3:14b) | 16GB | 24GB | Recommended |
| 30B+ (llama3.2:70b) | 32GB | 64GB | Required |

**GPU Support:**
- NVIDIA GPUs with 8GB+ VRAM
- Automatic GPU detection by Ollama
- 2-5x faster inference with GPU

## Testing

### Manual Testing

**Test 1: Health Check**
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "provider": "ollama",
  "model": "llama3.2",
  "serverUrl": "http://localhost:11434",
  "timestamp": "2025-01-12T..."
}
```

**Test 2: Simple AI Request**
```bash
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Say hello and nothing else"}
    ]
  }'
```

Expected: A streaming response with "Hello" or similar.

**Test 3: Multi-turn Conversation**
```bash
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "My name is Alice"},
      {"role": "assistant", "content": "Hello Alice!"},
      {"role": "user", "content": "What is my name?"}
    ]
  }'
```

Expected: Response mentioning "Alice".

**Test 4: Model Info**
```bash
curl http://localhost:3001/ai/models
```

Expected: JSON with available models and current model.

### Automated Testing

Run the complete test suite:
```bash
./test.sh
```

The test suite includes:
1. Health check endpoint
2. Models endpoint
3. Simple AI request
4. Multi-turn conversation
5. Empty messages error handling
6. Invalid format error handling
7. Long message handling (1000 chars)
8. Special characters and Unicode

Expected output:
```
🦙 Testing Ollama Integration at http://localhost:3001

Test 1: Health check endpoint
✅ PASS: Health check returns Ollama provider

Test 2: Available models endpoint
✅ PASS: Models endpoint returns 8 models

...

═══════════════════════════════════════════════════
📊 Test Summary
═══════════════════════════════════════════════════
✅ Passed: 8
❌ Failed: 0
═══════════════════════════════════════════════════
🎉 All tests passed!
🦙 Ollama is ready to use!
```

## Best Practices

### 1. Model Selection by Hardware

**CPU-only (8GB RAM):**
```bash
ollama pull phi3:3.8b
OLLAMA_MODEL=phi3:3.8b
```

**CPU/GPU (16GB RAM):**
```bash
ollama pull llama3.2:3b
OLLAMA_MODEL=llama3.2:3b
```

**GPU (32GB+ RAM):**
```bash
ollama pull llama3.2:70b
OLLAMA_MODEL=llama3.2:70b
```

### 2. Warm Up the Model

Before production use, send a few requests to warm up the model:
```bash
curl -X POST http://localhost:3001/ai \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Test"}]}'
```

This loads the model into memory for faster subsequent responses.

### 3. Monitor Resource Usage

Check Ollama's resource usage:
```bash
ollama ps
```

This shows running models and their memory/CPU usage.

### 4. Use Fallback to Cloud

Implement fallback to cloud providers for production:
```typescript
const useOllama = process.env.NODE_ENV === 'development';

if (useOllama) {
  // Use Ollama for development
  const model = ollamaClient(modelId);
} else {
  // Use cloud provider for production
  const model = openai("gpt-4o-mini");
}
```

### 5. Optimize for Performance

**Reduce Context Window:**
```typescript
const result = streamText({
  model,
  messages: convertToCoreMessages(messages.slice(-10)), // Keep last 10 messages
  maxTokens: 1024, // Reduce max tokens
});
```

**Use Quantized Models:**
```bash
ollama pull llama3.2:3b-q4_K_M  # Quantized version
```

Quantized models use less memory with minimal quality loss.

## Troubleshooting

### "Cannot connect to Ollama server"

**Cause:** Ollama server is not running.

**Solution:**
```bash
# Start Ollama server
ollama serve
```

Verify it's running:
```bash
curl http://localhost:11434/api/tags
```

### "Model not found"

**Cause:** Model hasn't been pulled yet.

**Solution:**
```bash
# Pull the model
ollama pull llama3.2

# Verify it's available
ollama list
```

### "Out of memory" errors

**Cause:** Model is too large for available RAM.

**Solution:**
- Use a smaller model: `ollama pull phi3:3.8b`
- Close other applications
- Add more RAM to your system
- Use a quantized model: `ollama pull llama3.2:3b-q4_K_M`

### Very slow responses

**Cause 1:** CPU-only inference with large model.

**Solution:**
- Use a smaller model
- Install a supported GPU (NVIDIA)
- Reduce context window and max tokens

**Cause 2:** Model not loaded in memory.

**Solution:**
- Send a warm-up request
- The first request will be slow, subsequent ones faster

### "Ollama command not found"

**Cause:** Ollama is not installed or not in PATH.

**Solution:**
```bash
# macOS/Linux
which ollama

# If not found, reinstall Ollama
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.com/install.sh | sh
```

### GPU not being used

**Cause:** Ollama doesn't detect GPU or GPU drivers missing.

**Solution:**
```bash
# Check NVIDIA drivers
nvidia-smi

# Verify Ollama GPU support
ollama --version

# Force GPU usage (if available)
CUDA_VISIBLE_DEVICES=0 ollama serve
```

## Production Deployment

### Environment Configuration

For production, use `.env.production`:
```bash
# Production Ollama configuration
OLLAMA_MODEL=llama3.2:3b
OLLAMA_BASE_URL=http://localhost:11434
NODE_ENV=production
PORT=3001
```

### Running as a Service

** systemd (Linux):**

Create `/etc/systemd/system/ollama.service`:
```ini
[Unit]
Description=Ollama AI Server
After=network.target

[Service]
Type=simple
User=ollama
ExecStart=/usr/local/bin/ollama serve
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

**Docker:**

```dockerfile
FROM ollama/ollama:latest

# Pull model during build
RUN ollama pull llama3.2

# Expose Ollama port
EXPOSE 11434

# Start Ollama server
CMD ["ollama", "serve"]
```

### Monitoring

**Check Ollama Status:**
```bash
ollama ps          # Running models
ollama list        # Available models
curl http://localhost:11434/api/tags  # API status
```

**Log Monitoring:**
```bash
# Ollama logs
journalctl -u ollama -f

# Application logs
tail -f /var/log/ollama-app.log
```

**Metrics to Track:**
- Request latency (first token time, total time)
- Memory usage (RAM, VRAM)
- CPU/GPU utilization
- Error rates (connection failures, OOM)
- Model loading time

### Security Considerations

**Local Deployment:**
- Ollama binds to localhost by default (safe)
- No API keys needed
- No network exposure

**Remote Deployment:**
- **Never expose Ollama port 11434 publicly**
- Use reverse proxy (nginx) with authentication
- Firewall rules to restrict access
- VPN for remote access

**Example nginx reverse proxy:**
```nginx
location /ollama/ {
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://localhost:11434/;
}
```

## Cost Comparison

### Ollama vs Cloud Providers

| Provider | Cost per 1M tokens | Monthly cost (10M tokens) |
|----------|-------------------|---------------------------|
| **Ollama** | $0 (local compute) | $0 |
| Groq | ~$0.59 | $5.90 |
| OpenAI GPT-4o-mini | ~$0.15 | $1.50 |
| Google Gemini | ~$0.075 | $0.75 |
| Anthropic Claude 3.5 Sonnet | ~$3.00 | $30.00 |

**Savings with Ollama:**
- Development: $100-500/month saved
- Production: $1,000-10,000/month saved (depending on usage)

**Trade-offs:**
- Pros: Zero cost, privacy, offline
- Cons: Slower inference, requires hardware, scaling challenges

## Model Management

### List Models
```bash
ollama list
```

### Pull a Model
```bash
ollama pull llama3.2
```

### Show Model Info
```bash
ollama show llama3.2
```

### Remove a Model
```bash
ollama rm llama3.2
```

### Check Running Models
```bash
ollama ps
```

### Update a Model
```bash
ollama pull llama3.2 --verbose
```

## Advanced Configuration

### Custom Base URL

For remote Ollama servers:
```bash
OLLAMA_BASE_URL=http://ollama-server:11434
```

### Multiple Models

Run multiple Ollama instances:
```bash
# Instance 1
OLLAMA_MODEL=llama3.2:3b
PORT=3001

# Instance 2
OLLAMA_MODEL=mistral:7b
PORT=3002
```

### Model-Specific Settings

Some models support special parameters:
```typescript
const result = streamText({
  model,
  messages: convertToCoreMessages(messages),
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  frequencyPenalty: 0.5, // For repetition control
  presencePenalty: 0.5,  // For topic diversity
});
```

## Next Steps

- Explore [Ollama documentation](https://github.com/ollama/ollama)
- Check [Ollama model library](https://ollama.com/library)
- Read the [main integration guide](../../docs/ai-provider-integration-guide.md)
- Explore other provider examples (OpenAI, Anthropic, Groq)

## Summary

This example demonstrates a complete Ollama integration with:
- ✅ Local AI inference (zero API costs)
- ✅ 100+ model support
- ✅ OpenAI-compatible integration
- ✅ Comprehensive error handling
- ✅ Production-ready deployment
- ✅ Complete testing suite
- ✅ Privacy-first architecture
- ✅ Offline capability

**Key Takeaways:**
1. Perfect for development and privacy-sensitive applications
2. No API keys or billing required
3. Requires local hardware resources
4. Use cloud providers for production scalability
5. Easy to set up and use

Enjoy local AI with Ollama! 🦙
