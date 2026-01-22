<script lang="ts">
  import { onMount } from 'svelte';
  import { orpc } from '$lib/orpc';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { categories } from '$lib/components/prompt-library-form-types';

  type Prompt = {
    id: string;
    userId: string;
    name: string;
    content: string;
    variables: string[];
    category: string | null;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  // Map legacy category values to canonical categories from prompt-library-form-types
  // Legacy values may exist in database from previous versions
  function mapLegacyCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      // Map old 'development' to canonical 'coding'
      development: 'coding',
      // Map old 'education' to canonical 'general'
      education: 'general',
      // Map old 'analysis' (kept for consistency)
      analysis: 'analysis',
    };
    return categoryMap[category] || category;
  }

  // Get canonical category value for display
  function getCanonicalCategory(category: string | null): string {
    if (!category) return 'general';
    const mapped = mapLegacyCategory(category);
    // Validate against canonical categories
    const isValid = categories.some((c) => c.value === mapped);
    return isValid ? mapped : 'general';
  }

  let {
    onInsertPrompt,
  }: {
    onInsertPrompt: (prompt: { content: string; variables: Array<{ name: string }> }) => void;
  } = $props();

  let prompts = $state<Prompt[]>([]);
  let loading = $state(true);
  let errorMessage = $state('');

  onMount(async () => {
    await loadPrompts();
  });

  async function loadPrompts() {
    loading = true;
    errorMessage = '';
    try {
      prompts = await orpc.prompt.getAll();
    } catch (error) {
      console.error('Failed to load prompts:', error);
      errorMessage = 'Failed to load prompts';
    } finally {
      loading = false;
    }
  }

  function getCategoryIcon(category: string | null) {
    const canonical = getCanonicalCategory(category);
    switch (canonical) {
      case 'coding':
        return '💻';
      case 'writing':
        return '✍️';
      case 'analysis':
        return '📊';
      case 'creative':
        return '🎨';
      case 'business':
        return '💼';
      case 'custom':
        return '🔧';
      case 'general':
      default:
        return '📝';
    }
  }

  function getCategoryColor(category: string | null) {
    const canonical = getCanonicalCategory(category);
    switch (canonical) {
      case 'coding':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'writing':
        return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
      case 'analysis':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'creative':
        return 'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20';
      case 'business':
        return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
      case 'custom':
        return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20';
      case 'general':
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  }

  function truncateContent(content: string, maxLength = 60) {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  }

  let isOpen = $state(false);
</script>

{#if errorMessage}
  <div class="inline-flex" title={errorMessage}>
    <button
      class="bg-destructive/10 border-destructive text-destructive inline-flex h-9 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
      type="button"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="size-4"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
      <span>Error</span>
    </button>
  </div>
{:else if loading}
  <div
    class="border-border bg-muted text-muted-foreground inline-flex h-9 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium whitespace-nowrap"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="size-4 animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
    <span>Loading...</span>
  </div>
{:else if prompts.length === 0}
  <div
    class="border-border bg-muted text-muted-foreground inline-flex h-9 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium whitespace-nowrap"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="size-4"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
    <span>No prompts</span>
  </div>
{:else}
  <DropdownMenu.Root bind:open={isOpen}>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <button
          class="bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
          type="button"
          {...props}
        >
          <span class="mr-2 text-lg">📓</span>
          <span class="font-medium">Insert Prompt</span>
        </button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-80" align="start">
      <DropdownMenu.Label class="px-2 py-1.5 text-sm font-semibold">
        Select a Prompt Template
      </DropdownMenu.Label>
      <DropdownMenu.Separator />
      {#each prompts as prompt (prompt.id)}
        <DropdownMenu.Item
          onclick={() => {
            onInsertPrompt({
              content: prompt.content,
              variables: prompt.variables.map((v) => ({ name: v })),
            });
            isOpen = false;
          }}
          class="focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer flex-col gap-1 rounded-sm px-2 py-2 text-sm transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-lg">{getCategoryIcon(prompt.category)}</span>
              <span class="font-medium">{prompt.name}</span>
            </div>
            {#if prompt.isPublic}
              <span class="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs">Public</span>
            {/if}
          </div>
          <div class="ml-7">
            <span
              class={getCategoryColor(prompt.category) + ' rounded px-2 py-0.5 text-xs font-normal'}
            >
              {getCanonicalCategory(prompt.category)}
            </span>
          </div>
          <p class="text-muted-foreground ml-7 line-clamp-2 text-xs" title={prompt.content}>
            {truncateContent(prompt.content, 80)}
          </p>
          {#if prompt.variables && prompt.variables.length > 0}
            <div class="text-muted-foreground mt-1 ml-7 text-xs">
              <span class="font-medium">Variables:</span>
              {prompt.variables.join(', ')}
            </div>
          {/if}
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
