# AI Provider Integration Examples

Complete, production-ready examples for integrating various AI providers into SambungChat.

## Available Examples

### [OpenAI Integration](./openai-integration/)

**Status:** ✅ Complete

A comprehensive example showing how to integrate OpenAI as an AI provider.

**What's Included:**
- Complete server implementation with error handling
- Environment configuration examples
- Testing scripts and procedures
- Best practices and troubleshooting
- Multiple model options

**Quick Start:**
```bash
cd examples/openai-integration
cat README.md
```

**Features:**
- ✅ Streaming responses
- ✅ Error handling (auth, rate limits, context limits)
- ✅ Health check endpoints
- ✅ Model info endpoint
- ✅ Comprehensive test suite
- ✅ Production-ready code
- ✅ TypeScript types
- ✅ Security best practices

### [Anthropic Integration](./anthropic-integration/)

**Status:** 🚧 Coming Soon

Example for integrating Anthropic's Claude models.

### [Groq Integration](./groq-integration/)

**Status:** 🚧 Coming Soon

Example for integrating Groq's ultra-fast inference.

### [Ollama Integration](./ollama-integration/)

**Status:** 🚧 Coming Soon

Example for integrating local Ollama models.

### [Multi-Provider Setup](./multi-provider/)

**Status:** 🚧 Coming Soon

Example showing how to use multiple providers with fallback and load balancing.

## How to Use These Examples

### For Learning

Each example directory contains:
1. **README.md** - Detailed guide with explanations
2. **QUICKSTART.md** - Fast 5-minute setup guide
3. **server.ts** - Complete server implementation
4. **test.sh** - Automated test script
5. **.env.example** - Environment template
6. **package.json** - Dependencies and scripts

### For Integration

Copy the relevant code from the example into your SambungChat project:

```bash
# 1. Navigate to the example
cd examples/openai-integration

# 2. Read the README
cat README.md

# 3. Follow the integration steps
# Usually involves:
#    - Installing packages
#    - Setting environment variables
#    - Updating server code
#    - Running tests
```

### For Testing

Each example includes a test script:

```bash
cd examples/openai-integration
./test.sh
```

## Example Structure

All examples follow this structure:

```
examples/
├── provider-name-integration/
│   ├── README.md          # Full documentation
│   ├── QUICKSTART.md      # Quick start guide
│   ├── server.ts          # Server implementation
│   ├── types.ts           # TypeScript types
│   ├── .env.example       # Environment template
│   ├── test.sh            # Test script
│   ├── package.json       # Dependencies
│   ├── tsconfig.json      # TypeScript config
│   └── .gitignore         # Git ignore rules
```

## Best Practices

All examples demonstrate:

✅ **Error Handling**
- Authentication errors
- Rate limiting
- Network failures
- Invalid input

✅ **Security**
- API key management
- Input validation
- CORS configuration
- Environment variables

✅ **Production Ready**
- TypeScript types
- Logging
- Monitoring hooks
- Health checks

✅ **Testing**
- Automated test scripts
- Manual test procedures
- Error scenario coverage

✅ **Documentation**
- Inline code comments
- Setup instructions
- Troubleshooting guides
- Best practices

## Contributing

Adding a new provider example?

1. Follow the standard structure
2. Include all standard files (README, server.ts, test.sh, etc.)
3. Ensure all tests pass
4. Document any provider-specific quirks
5. Include troubleshooting section

## Support

- **Main Guide:** See [AI Provider Integration Guide](../docs/ai-provider-integration-guide.md)
- **Issues:** Open an issue on GitHub
- **Questions:** Check the main README or contact the team

## License

All examples are part of SambungChat and follow the same license.
