export const categories = [
  { value: 'general', label: 'General' },
  { value: 'coding', label: 'Coding' },
  { value: 'writing', label: 'Writing' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'creative', label: 'Creative' },
  { value: 'business', label: 'Business' },
  { value: 'custom', label: 'Custom' },
] as const;

export type PromptFormData = {
  name: string;
  content: string;
  variables: string[];
  category: (typeof categories)[number]['value'];
  isPublic: boolean;
};
