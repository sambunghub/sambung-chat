<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import CheckIcon from '@lucide/svelte/icons/check';
  import type { ApiKeyFormData } from './types.js';
  import { providers } from './types.js';

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
    data = $bindable(),
    isEdit = false,
    submitting = false,
    onsubmit,
    oncancel,
  }: Props = $props();

  // Local form state - use $derived to react to data changes
  let formData = $state<ApiKeyFormData>({
    provider: data.provider,
    name: data.name,
    key: data.key,
    isActive: data.isActive,
  });

  // Update local state when data prop changes
  $effect(() => {
    formData.provider = data.provider;
    formData.name = data.name;
    formData.key = data.key;
    formData.isActive = data.isActive;
  });

  // Validate form data
  function validateForm(): boolean {
    return Boolean(formData.name.trim() && (isEdit || formData.key.trim()));
  }

  // Handle form submission
  async function handleSubmit() {
    if (!validateForm() || submitting) return;

    try {
      await onsubmit(formData);
    } catch (error) {
      // Error is handled by parent component
    }
  }

  // Get provider label from value
  function getProviderLabel(provider: string): string {
    return providers.find((p) => p.value === provider)?.label || provider;
  }
</script>

<div class="space-y-4">
  <div class="space-y-2">
    <Label for={isEdit ? 'edit-provider' : 'provider'}>Provider</Label>
    <select
      id={isEdit ? 'edit-provider' : 'provider'}
      bind:value={formData.provider}
      disabled={submitting}
      aria-describedby={isEdit ? 'edit-provider-description' : 'provider-description'}
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
      bind:value={formData.name}
      placeholder="e.g., My OpenAI Key"
      required
      disabled={submitting}
      aria-describedby={isEdit ? 'edit-name-description' : 'name-description'}
      class="disabled:cursor-not-allowed disabled:opacity-50"
    />
    <p
      id={isEdit ? 'edit-name-description' : 'name-description'}
      class="text-muted-foreground text-xs"
    >
      A friendly name to identify this key
    </p>
  </div>

  <div class="space-y-2">
    <Label for={isEdit ? 'edit-key' : 'key'}>API Key</Label>
    <Input
      id={isEdit ? 'edit-key' : 'key'}
      bind:value={formData.key}
      placeholder={isEdit ? 'Leave empty to keep current key' : 'sk-...'}
      type="password"
      autocomplete="off"
      required={!isEdit}
      disabled={submitting}
      aria-describedby={isEdit ? 'edit-key-description' : 'key-description'}
      class="disabled:cursor-not-allowed disabled:opacity-50"
    />
    <p
      id={isEdit ? 'edit-key-description' : 'key-description'}
      class="text-muted-foreground text-xs"
    >
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
        bind:checked={formData.isActive}
        disabled={submitting}
        class="border-input bg-background focus:ring-ring rounded border px-2 py-1 text-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
      <Label for="edit-active" class="text-sm">Active</Label>
    </div>
  {/if}
</div>

<div class="bg-muted/30 flex justify-end gap-2 border-t p-4">
  {#if oncancel}
    <Button variant="outline" onclick={oncancel} disabled={submitting}>Cancel</Button>
  {/if}
  <Button onclick={handleSubmit} disabled={!validateForm() || submitting}>
    <CheckIcon class="mr-2 size-4" />
    {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Key'}
  </Button>
</div>
