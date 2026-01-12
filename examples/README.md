# AI Provider Integration Examples

Complete, production-ready examples for integrating various AI providers into SambungChat.

## Available Examples

### ✅ OpenAI Integration (Complete)

**Location:** `./openai-integration/`

**Status:** Production-ready ✅

**Provider:** OpenAI (GPT-4o, GPT-4o-mini, o1-mini, o1-preview)

**Features:**
- Complete server implementation with streaming
- Comprehensive error handling
- Health check and model info endpoints
- Automated test suite (8 tests)
- Production-ready configuration

**Quick Start:**
```bash
cd openai-integration
npm install
cp .env.example .env.local
# Edit .env.local with your API key
npm run dev
```

**Documentation:** [OpenAI README](./openai-integration/README.md)

---

### ✅ Anthropic Integration (Complete)

**Location:** `./anthropic-integration/`

**Status:** Production-ready ✅

**Provider:** Anthropic (Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus)

**Features:**
- Complete server implementation with streaming
- Comprehensive error handling
- Health check and model info endpoints
- Automated test suite (8 tests)
- Production-ready configuration
- 200K token context window support

**Quick Start:**
```bash
cd anthropic-integration
npm install
cp .env.example .env.local
# Edit .env.local with your API key
npm run dev
```

**Documentation:** [Anthropic README](./anthropic-integration/README.md)

---

### ✅ Groq Integration (Complete)

**Location:** `./groq-integration/`

**Status:** Production-ready ✅

**Provider:** Groq (Llama 3.3, Llama 3.1, Mixtral 8x7b, Gemma 2)

**Features:**
- Ultra-fast LPU inference (10-20x faster than other providers)
- Complete server implementation with streaming
- Comprehensive error handling
- Health check and model info endpoints
- Automated test suite (8 tests)
- Production-ready configuration
- Very low cost implementation

**Quick Start:**
```bash
cd groq-integration
npm install
cp .env.example .env.local
# Edit .env.local with your API key (get it free at console.groq.com)
npm run dev
```

**Documentation:** [Groq README](./groq-integration/README.md)

**Why Groq?** ⚡
- Ultra-fast inference (sub-100ms time to first token)
- Significantly cheaper than GPT-4 or Claude
- Open-source models (Llama, Mixtral, Gemma)
- Production-ready with high reliability

---

### ✅ Ollama Integration (Complete)

**Location:** `./ollama-integration/`

**Status:** Production-ready ✅

**Provider:** Ollama (Local LLaMA, Mistral, Gemma, 100+ models)

**Features:**
- 100% local AI inference (zero API costs)
- Complete server implementation with OpenAI-compatible approach
- Comprehensive error handling (connection issues, model management)
- Health check and model info endpoints
- Automated test suite (8 tests)
- Production-ready configuration
- Privacy-first architecture
- Offline capability
- GPU acceleration support

**Quick Start:**
```bash
# First, install and start Ollama
ollama serve

# Pull a model
ollama pull llama3.2

# Then run the example
cd ollama-integration
npm install
npm run dev
```

**Documentation:** [Ollama README](./ollama-integration/README.md)

**Why Ollama?** 🦙
- **100% Free:** No API costs, no usage limits
- **Privacy First:** Data never leaves your machine
- **Fast Inference:** Runs directly on your CPU/GPU
- **Offline:** Works without internet connection
- **Zero API Costs:** No billing or subscriptions
- **100+ Models:** Llama, Mistral, Gemma, Phi, Qwen, Code Llama, and more

---

### ✅ Multi-Provider Integration (Complete)

**Location:** `./multi-provider-integration/`

**Status:** Production-ready ✅

**Providers:** OpenAI, Anthropic, Google, Groq, Ollama (all in one!)

**Features:**
- **Provider Abstraction Layer** - Switch providers via environment variables
- **Fallback Chains** - Automatic failover to backup providers
- **Zero Code Changes** - Switch between providers without touching code
- **Provider Factory Helper** - Reusable functions for provider creation
- Complete server implementation with all providers
- Comprehensive error handling
- Health check, providers, and models endpoints
- Automated test suite (10 tests)
- Production-ready configuration

**Quick Start:**
```bash
cd multi-provider-integration
npm install
cp .env.example .env
# Edit .env - set AI_PROVIDER and corresponding API key
npm run dev
```

**Switch Providers (No Code Changes!):**
```bash
# Use OpenAI
AI_PROVIDER=openai OPENAI_API_KEY=sk-... npm run dev

# Switch to Anthropic (just change .env, no code changes!)
AI_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-ant-... npm run dev

# Fallback chain for high availability
AI_PROVIDER=openai,anthropic,groq npm run dev
```

**Documentation:** [Multi-Provider README](./multi-provider-integration/README.md)

**Why Multi-Provider?** 🔄
- **Easy Switching:** Change providers in seconds via environment variables
- **High Availability:** Fallback chains ensure your app never goes down
- **Cost Optimization:** Route to cheapest provider automatically
- **Flexibility:** Test different providers without code changes
- **Production Ready:** Comprehensive patterns for real-world applications

---

### 🧪 Test Templates (Complete)

**Location:** `./test-templates/`

**Status:** Production-ready ✅

**Purpose:** Comprehensive test templates for testing AI provider integrations

**Features:**
- **Unit Test Templates** - Test individual functions and components (Vitest)
- **Integration Test Templates** - Test API endpoints and server integration (Supertest)
- **E2E Test Templates** - Test complete user flows (Playwright)
- **Test Fixtures** - Reusable test data and mocks
- **Test Utilities** - Helper functions and utilities
- **Complete Configuration** - Vitest config, setup files, and package.json

**Test Templates Included:**
- Provider initialization tests
- Model creation tests
- Validation tests (messages, requests, environment)
- Error handling tests (auth, rate limits, network, provider-specific)
- API endpoint tests (health, models, chat, errors)
- Streaming response tests
- Multi-turn conversation tests
- E2E chat flow tests
- UI interaction tests
- Accessibility tests

**Quick Start:**
```bash
cd test-templates

# Install dependencies
npm install

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests with coverage
npm run test:coverage
```

**Use Test Templates When Adding New Provider:**
1. Copy templates: `cp -r test-templates/* tests/`
2. Replace placeholder values (PROVIDER_NAME, MODEL_ID, etc.)
3. Customize for your provider's specific features
4. Run tests and verify coverage
5. Adjust tests as needed

**Documentation:** [Test Templates README](./test-templates/README.md)

**Why Test Templates?** 🧪
- **Fast Setup:** Copy-paste templates, no need to write from scratch
- **Best Practices:** Industry-standard testing patterns included
- **Comprehensive Coverage:** Unit, integration, and E2E tests all covered
- **Reusable Fixtures:** Common test data and utilities included
- **Production-Ready:** CI/CD ready configuration with coverage reporting
- **Customizable:** Easy to adapt for any provider

---

## Example Structure

Each provider example follows a consistent structure:

```
provider-integration/
├── server.ts              # Complete Hono server implementation
├── provider-factory.ts    # Provider abstraction helper (multi-provider only)
├── types.ts               # TypeScript environment variable types
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── .env.example           # Environment variable template
├── .gitignore             # Standard ignore patterns
├── test.sh                # Automated test suite
├── README.md              # Comprehensive documentation
└── QUICKSTART.md          # 5-minute quick start guide
```

## Usage Instructions

1. Navigate to the provider directory: `cd examples/openai-integration` (or `anthropic-integration`, `groq-integration`, `ollama-integration`, `multi-provider-integration`)
2. Install dependencies: `npm install`
3. Configure environment: `cp .env.example .env.local` and edit
4. Start server: `npm run dev`
5. Run tests: `npm test`

**For Multi-Provider:**
The multi-provider integration demonstrates the provider abstraction pattern that allows you to switch between any provider without code changes. See the [Multi-Provider README](./multi-provider-integration/README.md) for detailed information on:
- Provider factory functions
- Fallback chains
- Environment-based provider selection
- Advanced patterns (load balancing, cost-based routing)

## Best Practices Demonstrated

Each example showcases production-ready patterns:

✅ **Error Handling**
- Authentication errors (401)
- Rate limiting (429)
- Model not found (404)
- Context window exceeded (400)
- Invalid request format (400)
- Provider-specific error handling

✅ **Testing**
- Manual testing procedures
- Automated test scripts (8 tests each)
- Error scenario coverage
- Edge case handling
- CI/CD ready

✅ **Security**
- API key management
- Environment-specific configuration
- Input validation
- CORS configuration
- Content filtering (where applicable)

✅ **Monitoring**
- Health check endpoints
- Model info endpoints
- Token usage tracking
- Cost monitoring examples
- Logging and metrics

✅ **Documentation**
- Comprehensive README (400+ lines)
- Quick start guide
- Inline code comments
- Troubleshooting section
- Production deployment guide

## Integration Patterns

All examples follow the standard AI SDK pattern:

```typescript
// 1. Import provider
import { provider } from "@ai-sdk/provider";

// 2. Create model with middleware
const model = wrapLanguageModel({
  model: provider("model-id", { apiKey }),
  middleware: devToolsMiddleware(),
});

// 3. Stream responses
const result = streamText({
  model,
  messages: convertToCoreMessages(messages),
});

// 4. Return stream
return result.toDataStreamResponse();
```

This pattern remains consistent across all providers - only the import and initialization changes!

## Provider Comparison

| Provider | Best For | Cost | Speed | Context |
|----------|----------|------|-------|---------|
| **OpenAI** | General purpose, vision | Low-Medium | Fast | 128K |
| **Anthropic** | Complex reasoning, long context | Medium-High | Fast | 200K |
| **Google** | Multimodal, cost-effective | Very Low | Fast | 1M |
| **Groq** | Ultra-fast responses, real-time | Very Low | **Ultra-fast** | 131K |
| **Ollama** | Local, privacy, free | Free | Varies | Varies |

**Speed Comparison:**
- Groq: ~50ms time to first token (fastest) ⚡
- Google Gemini: ~400ms
- OpenAI: ~500ms
- Anthropic: ~600ms
- Ollama: Varies (hardware-dependent)

**Cost Comparison (per 1M input tokens):**
- Ollama: Free (100% local) 🦙
- Google Gemini: ~$0.075
- Groq: ~$0.59
- OpenAI GPT-4o-mini: ~$0.15
- Anthropic Claude 3.5 Sonnet: ~$3

**Recommendation:** Start with the [Multi-Provider Integration](./multi-provider-integration/) to easily switch between providers and find the best fit for your use case.

## Contributing

Adding a new provider example?

1. Follow the standard structure shown in existing examples
2. Include all standard files (README, server.ts, test.sh, etc.)
3. Ensure all tests pass
4. Document any provider-specific quirks
5. Include troubleshooting section
6. Update this main README with your example

**Template:** Use the existing OpenAI or Anthropic examples as templates.

## Support

- **Main Guide:** See [AI Provider Integration Guide](../docs/ai-provider-integration-guide.md)
- **Provider Docs:** Check provider-specific documentation in each example
- **Issues:** Open an issue on GitHub
- **Questions:** Check the main README or contact the team

## License

All examples are part of SambungChat and follow the same license.
