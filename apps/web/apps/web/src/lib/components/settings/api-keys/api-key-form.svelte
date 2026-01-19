<script module lang="ts">
  // Provider options for API keys
  export const providers = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'google', label: 'Google' },
    { value: 'groq', label: 'Groq' },
    { value: 'ollama', label: 'Ollama' },
    { value: 'openrouter', label: 'OpenRouter' },
    { value: 'other', label: 'Other' },
  ] as const;

  // Form data structure for API key
  export interface ApiKeyFormData {
    provider: (typeof providers)[number]['value'];
    name: string;
    key: string;
    isActive: boolean;
  }
</script>

<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import CheckIcon from '@lucide/svelte/icons/check';
  import type { ApiKeyFormData } from './api-key-form.svelte';

  // Props for the API key form component
  interface Props {
    // Form data
    data: ApiKeyFormData;
    // Whether the form is in edit mode
    isEdit?: boolean;
    // Whether the form is currently submitting
    submitting?: boolean;
    // Callback when form is submitted
    onsubmit: (data: ApiKeyFormData) => void | Promise<void>;
    // Callback when form is cancelled
    oncancel?: () => void;
  }

  let {
    data,
    isEdit = false,
    submitting = false,
    onsubmit,
    oncancel,
  }: Props = $props();

  // Local mutable state for form inputs
  let localForm = $state<ApiKeyFormData>({
    provider: data.provider,
    name: data.name,
    key: data.key,
    isActive: data.isActive
  });

  // Update local state when data prop changes
  $effect(() => {
    localForm.provider = data.provider;
    localForm.name = data.name;
    localForm.key = data.key;
    localForm.isActive = data.isActive;
  });

  // Validate form data
  function validateForm(): boolean {
    return Boolean(localForm.name.trim() && (isEdit || localForm.key.trim()));
  }

  // Handle form submission
  async function handleSubmit() {
    if (!validateForm() || submitting) return;

    try {
      await onsubmit(localForm);
    } catch (error) {
      // Error is handled by parent component
    }
  }
</script>

<div class="space-y-4">
  <div class="space-y-2">
    <Label for={isEdit ? 'edit-provider' : 'provider'}>Provider</Label>
    <select
      id={isEdit ? 'edit-provider' : 'provider'}
      bind:value={localForm.provider}
      disabled={submitting}
      class="border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {#each providers as provider}
        <option value={provider.value}>{provider.label}</option>
      {/each}
    </select>
  </div>

  <div class="space-y-2">
    <Label for={isEdit ? 'edit-name' : 'name'}>Name</Label>
    <Input
      id={isEdit ? 'edit-name' : 'name'}
      bind:value={localForm.name}
      placeholder="e.g., My OpenAI Key"
      required
      disabled={submitting}
      class="disabled:cursor-not-allowed disabled:opacity-50"
    />
    <p class="text-muted-foreground text-xs">A friendly name to identify this key</p>
  </div>

  <div class="space-y-2">
    <Label for={isEdit ? 'edit-key' : 'key'}>API Key</Label>
    <Input
      id={isEdit ? 'edit-key' : 'key'}
      bind:value={localForm.key}
      placeholder={isEdit ? 'Leave empty to keep current key' : 'sk-...'}
      type="password"
      autocomplete="off"
      required={!isEdit}
      disabled={submitting}
      class="disabled:cursor-not-allowed disabled:opacity-50"
    />
    <p class="text-muted-foreground text-xs">
      {isEdit
        ? 'Leave empty to keep the existing key, or enter a new key to replace it'
        : 'Your API key will be encrypted before storage'}
    </p>
  </div>

  {#if isEdit}
    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        id="edit-active"
        bind:checked={localForm.isActive}
        disabled={submitting}
        class="border-input bg-background focus:ring-ring rounded border px-2 py-1 text-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
      <Label for="edit-active" class="text-sm">Active</Label>
    </div>
  {/if}
</div>

<div class="bg-muted/30 flex justify-end gap-2 border-t p-4">
  {#if oncancel}
    <Button variant="outline" onclick={oncancel} disabled={submitting}>
      Cancel
    </Button>
  {/if}
  <Button onclick={handleSubmit} disabled={!validateForm() || submitting}>
    <CheckIcon class="mr-2 size-4" />
    {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Key'}
  </Button>
</div>
