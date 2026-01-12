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

### 🚧 Groq Integration (In Progress)

**Status:** Coming soon 🚧

**Provider:** Groq (Llama 3.3, Mixtral, Gemma)

**Planned Features:**
- Ultra-fast LPU inference
- Low-cost implementation
- Comprehensive testing

---

### 📋 Ollama Integration (Planned)

**Status:** Not started 📋

**Provider:** Ollama (Local LLaMA, Mistral, Gemma, 100+ models)

**Planned Features:**
- Local AI setup
- Model management
- Remote server configuration
- GPU acceleration

---

### 📋 Multi-Provider Template (Planned)

**Status:** Not started 📋

**Features:**
- Provider abstraction layer
- Fallback chain implementation
- Load balancing pattern
- Cost-based routing

## Example Structure

Each provider example follows a consistent structure:

```
provider-integration/
├── server.ts           # Complete Hono server implementation
├── types.ts            # TypeScript environment variable types
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── .env.example        # Environment variable template
├── .gitignore          # Standard ignore patterns
├── test.sh             # Automated test suite
├── README.md           # Comprehensive documentation
└── QUICKSTART.md       # 5-minute quick start guide
```

## Usage Instructions

1. Navigate to the provider directory: `cd examples/openai-integration` (or `anthropic-integration`)
2. Install dependencies: `npm install`
3. Configure environment: `cp .env.example .env.local` and edit
4. Start server: `npm run dev`
5. Run tests: `npm test`

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
| **Groq** | Ultra-fast responses | Very Low | Ultra-fast | 128K |
| **Ollama** | Local, privacy, free | Free | Varies | Varies |

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
