<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import CheckIcon from '@lucide/svelte/icons/check';
  import { browser } from '$app/environment';
  import type { ProfileFormData } from './types.js';

  // Props for the profile form component
  interface Props {
    // Form data
    data: ProfileFormData;
    // Whether the form is currently submitting
    submitting?: boolean;
    // Callback when form is submitted
    onsubmit: (data: ProfileFormData) => void | Promise<void>;
    // Callback when form is cancelled
    oncancel?: () => void;
  }

  let { data, submitting = false, onsubmit, oncancel }: Props = $props();

  // Local form state - initialize with safe defaults for SSR
  let formData = $state<ProfileFormData>({
    name: data.name || '',
    bio: data.bio || '',
  });

  // Update local state when data prop changes (client-only)
  $effect(() => {
    if (browser) {
      formData.name = data.name || '';
      formData.bio = data.bio || '';
    }
  });

  // Validate form data
  function validateForm(): boolean {
    return Boolean(formData.name.trim());
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
</script>

<div class="space-y-4">
  <div class="space-y-2">
    <Label for="display-name">Display Name</Label>
    <Input
      id="display-name"
      bind:value={formData.name}
      placeholder="e.g., John Doe"
      required
      disabled={submitting}
      class="disabled:cursor-not-allowed disabled:opacity-50"
    />
    <p class="text-muted-foreground text-xs">
      Your display name will be shown across the application
    </p>
  </div>

  <div class="space-y-2">
    <Label for="bio">Bio</Label>
    <textarea
      id="bio"
      bind:value={formData.bio}
      placeholder="Tell us a little about yourself..."
      rows={4}
      disabled={submitting}
      class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-[80px] w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
    ></textarea>
    <p class="text-muted-foreground text-xs">A brief description about you (optional)</p>
  </div>
</div>

<div class="bg-muted/30 flex justify-end gap-2 border-t p-4">
  {#if oncancel}
    <Button variant="outline" onclick={oncancel} disabled={submitting}>Cancel</Button>
  {/if}
  <Button onclick={handleSubmit} disabled={!validateForm() || submitting}>
    <CheckIcon class="mr-2 size-4" />
    {submitting ? 'Saving...' : 'Save Changes'}
  </Button>
</div>
