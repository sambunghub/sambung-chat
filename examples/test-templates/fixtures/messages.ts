/**
 * Test Fixtures - Messages
 *
 * Purpose: Reusable test data for messages
 */

export const sampleMessages = {
  // Simple messages
  simple: {
    role: 'user',
    content: 'Say hello',
  },

  greeting: {
    role: 'user',
    content: 'Hello! How are you today?',
  },

  question: {
    role: 'user',
    content: 'What is the capital of France?',
  },

  // Multi-turn conversations
  conversation: [
    { role: 'user', content: 'My name is Alice' },
    { role: 'assistant', content: 'Hello Alice!' },
    { role: 'user', content: 'What is my name?' },
  ],

  longConversation: [
    { role: 'user', content: 'Let\'s discuss AI' },
    { role: 'assistant', content: 'Sure, I\'d love to discuss AI!' },
    { role: 'user', content: 'What is machine learning?' },
    { role: 'assistant', content: 'Machine learning is a subset of AI...' },
    { role: 'user', content: 'Can you give me an example?' },
  ],

  // System messages
  withSystemPrompt: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],

  // Long content
  long: {
    role: 'user',
    content: 'A'.repeat(1000),
  },

  veryLong: {
    role: 'user',
    content: 'A'.repeat(10000),
  },

  // Special characters
  specialCharacters: {
    role: 'user',
    content: 'Test these: 🎉 <script> & "quotes" \'apostrophes\'',
  },

  unicode: {
    role: 'user',
    content: 'Hello 世界 🌍 مرحبا 안녕하세요',
  },

  emoji: {
    role: 'user',
    content: '😀 🎉 🚀 ❤️ 🌟 ⭐ 💫',
  },

  html: {
    role: 'user',
    content: '<div class="test">HTML content</div><script>alert("test")</script>',
  },

  // Edge cases
  whitespace: {
    role: 'user',
    content: '   lots   of   spaces   ',
  },

  newlines: {
    role: 'user',
    content: 'Line 1\n\nLine 2\n\tLine 3 with tabs',
  },

  mixedLanguage: {
    role: 'user',
    content: 'Hello 世界 مرحبا 안녕하세요 こんにちは',
  },

  // Code snippets
  codeSnippet: {
    role: 'user',
    content: 'Here is some code:\n```javascript\nconst x = 42;\nconsole.log(x);\n```',
  },

  // Questions and prompts
  mathQuestion: {
    role: 'user',
    content: 'What is 15 + 27?',
  },

  reasoningQuestion: {
    role: 'user',
    content: 'If all Bloops are Razzles and all Razzles are Lazzles, are all Bloops definitely Lazzles?',
  },

  creativePrompt: {
    role: 'user',
    content: 'Write a short poem about a robot learning to love',
  },

  // For testing streaming
  streaming: {
    role: 'user',
    content: 'Tell me a long story about a dragon (at least 500 words)',
  },

  // For testing tool calling (if supported)
  toolCalling: [
    { role: 'user', content: 'What is the weather in San Francisco?' },
  ],

  // For testing context window
  contextWindowTest: {
    role: 'user',
    content: 'A'.repeat(50000), // ~12.5K tokens
  },

  // Empty and minimal
  emptyContent: {
    role: 'user',
    content: '',
  },

  singleCharacter: {
    role: 'user',
    content: 'A',
  },

  // Multiple messages
  multipleMessages: Array.from({ length: 10 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i + 1}`,
  })),
};

export const invalidMessages = {
  missingRole: {
    content: 'Test',
  },

  missingContent: {
    role: 'user',
  },

  invalidRole: {
    role: 'invalid-role',
    content: 'Test',
  },

  emptyArray: [],

  nonArray: 'not-an-array',

  nullContent: {
    role: 'user',
    content: null,
  },

  // Types that should fail validation
  numberContent: {
    role: 'user',
    content: 123,
  },

  objectContent: {
    role: 'user',
    content: { nested: 'object' },
  },
};

export const edgeCaseMessages = {
  // Maximum context
  maxContext: {
    role: 'user',
    content: 'A'.repeat(128000), // ~32K tokens (adjust for provider)
  },

  // Minimum viable
  minimal: {
    role: 'user',
    content: 'Hi',
  },

  // Repeated content
  repeated: {
    role: 'user',
    content: 'Repeat this ' + 'many times '.repeat(100),
  },

  // URL and links
  withURL: {
    role: 'user',
    content: 'Check out https://example.com/path?query=value',
  },

  // Email addresses
  withEmail: {
    role: 'user',
    content: 'Contact us at support@example.com',
  },

  // Phone numbers
  withPhone: {
    role: 'user',
    content: 'Call us at +1 (555) 123-4567',
  },

  // Dates and times
  withDate: {
    role: 'user',
    content: 'Today is 2026-01-12T10:30:00Z',
  },
};

export const conversationPatterns = {
  // Q&A pattern
  qa: [
    { role: 'user', content: 'What is 2+2?' },
    { role: 'assistant', content: '2+2 equals 4.' },
    { role: 'user', content: 'What about 3+3?' },
  ],

  // Storytelling pattern
  storytelling: [
    { role: 'user', content: 'Tell me a story' },
    { role: 'assistant', content: 'Once upon a time...' },
    { role: 'user', content: 'What happened next?' },
    { role: 'assistant', content: 'The hero ventured forth...' },
    { role: 'user', content: 'How did it end?' },
  ],

  // Coding pattern
  coding: [
    { role: 'user', content: 'Help me write a function' },
    { role: 'assistant', content: 'Sure, what should it do?' },
    { role: 'user', content: 'It should add two numbers' },
    { role: 'assistant', content: 'Here\'s the function...' },
    { role: 'user', content: 'Can you add error handling?' },
  ],

  // Roleplay pattern
  roleplay: [
    { role: 'system', content: 'You are a math tutor' },
    { role: 'user', content: 'I need help with algebra' },
    { role: 'assistant', content: 'Of course! What\'s the problem?' },
    { role: 'user', content: 'Solve for x: 2x + 5 = 15' },
    { role: 'assistant', content: 'Let\'s solve this step by step...' },
  ],
};

// Helper functions
export function createMessages(count: number, prefix = 'Message') {
  return Array.from({ length: count }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `${prefix} ${i + 1}`,
  }));
}

export function createLongConversation(turns: number) {
  const messages = [];
  for (let i = 0; i < turns; i++) {
    if (i % 2 === 0) {
      messages.push({ role: 'user', content: `User message ${Math.floor(i / 2) + 1}` });
    } else {
      messages.push({ role: 'assistant', content: `Assistant response ${Math.floor(i / 2) + 1}` });
    }
  }
  return messages;
}

export function createConversationWithContext(context: string, question: string) {
  return [
    { role: 'user', content: `Remember this: ${context}` },
    { role: 'assistant', content: 'Got it, I\'ll remember that.' },
    { role: 'user', content: question },
  ];
}
