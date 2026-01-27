<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Avatar } from '$lib/components/ui/avatar/index.js';
  import { AvatarImage } from '$lib/components/ui/avatar/index.js';
  import { AvatarFallback } from '$lib/components/ui/avatar/index.js';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import XIcon from '@lucide/svelte/icons/x';

  // Props for the avatar upload component
  interface Props {
    // Current avatar URL
    currentAvatar?: string;
    // User's name for fallback initials
    userName?: string;
    // Whether the component is disabled
    disabled?: boolean;
    // Callback when file is selected
    onfileselect: (file: File | null) => void | Promise<void>;
  }

  let { currentAvatar, userName = 'User', disabled = false, onfileselect }: Props = $props();

  // Local state for preview
  let previewUrl = $state<string | null>(null);
  let fileInput = $state<HTMLInputElement>();

  // Get user initials from name
  function getInitials(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      return '?';
    }
    const parts = trimmed.split(' ');
    if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts[0] && parts[0].length >= 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return '?';
  }

  // Handle file selection
  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, GIF, or WebP)');
      input.value = '';
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      alert('Image size must be less than 2MB');
      input.value = '';
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Notify parent component
    await onfileselect(file);
  }

  // Clear selected file
  async function handleClear() {
    if (fileInput) {
      fileInput.value = '';
    }
    previewUrl = null;
    await onfileselect(null);
  }

  // Get the URL to display (preview > current > fallback)
  let displayUrl = $derived(previewUrl || currentAvatar);
</script>

<div class="flex items-center gap-4">
  <!-- Avatar Preview -->
  <Avatar class="size-20">
    {#if displayUrl}
      <AvatarImage src={displayUrl} alt="{userName}'s profile picture" />
    {/if}
    <AvatarFallback class="bg-primary text-primary-foreground text-lg">
      {getInitials(userName)}
    </AvatarFallback>
  </Avatar>

  <!-- Upload Controls -->
  <div class="flex flex-col gap-2">
    <div class="flex gap-2">
      <!-- File Input (hidden) -->
      <input
        bind:this={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onchange={handleFileSelect}
        {disabled}
        class="hidden"
        id="avatar-upload"
      />

      <!-- Upload Button -->
      <Button
        type="button"
        variant="outline"
        onclick={() => fileInput?.click()}
        {disabled}
        class="disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UploadIcon class="mr-2 size-4" />
        {displayUrl ? 'Change Photo' : 'Upload Photo'}
      </Button>

      <!-- Clear Button (only show when there's a preview) -->
      {#if previewUrl}
        <Button
          type="button"
          variant="ghost"
          onclick={handleClear}
          {disabled}
          class="disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XIcon class="size-4" />
        </Button>
      {/if}
    </div>

    <p class="text-muted-foreground text-xs">JPEG, PNG, GIF, or WebP. Max 2MB.</p>
  </div>
</div>
