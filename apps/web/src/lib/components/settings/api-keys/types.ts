export const providers = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'groq', label: 'Groq' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'other', label: 'Other' },
] as const;

export type ApiKeyFormData = {
  provider: (typeof providers)[number]['value'];
  name: string;
  key: string;
  isActive: boolean;
};
