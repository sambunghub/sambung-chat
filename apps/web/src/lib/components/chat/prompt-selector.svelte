<script lang="ts">
  // PromptSelector component - allows users to insertPrompt templates into chat
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

  let { onInsertPrompt }: { onInsertPrompt: (prompt: Prompt) => void } = $props();

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
        return 'bg-blue-500/10 text-blue-500';
      case 'writing':
        return 'bg-purple-500/10 text-purple-500';
      case 'analysis':
        return 'bg-green-500/10 text-green-500';
      case 'creative':
        return 'bg-pink-500/10 text-pink-500';
      case 'business':
        return 'bg-amber-500/10 text-amber-500';
      case 'custom':
        return 'bg-orange-500/10 text-orange-500';
      case 'general':
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  }

  function truncateContent(content: string, maxLength = 60) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  let isOpen = $state(false);
</script>

{#if errorMessage}
  <div
    class="bg-destructive/10 border-destructive text-destructive rounded border px-3 py-2 text-sm"
  >
    {errorMessage}
  </div>
{:else if loading}
  <div class="border-border bg-muted text-muted-foreground rounded border px-4 py-2 text-sm">
    Loading prompts...
  </div>
{:else if prompts.length === 0}
  <div class="border-border bg-muted text-muted-foreground rounded border px-4 py-2 text-sm">
    No prompts available
  </div>
{:else}
  <DropdownMenu.Root bind:open={isOpen}>
    <DropdownMenu.Trigger
      class="bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
      type="button"
    >
      <span class="mr-2 text-lg">📝</span>
      <span class="font-medium">Insert Prompt</span>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-80" align="start">
      <DropdownMenu.Label class="px-2 py-1.5 text-sm font-semibold">
        Select a Prompt Template
      </DropdownMenu.Label>
      <DropdownMenu.Separator />
      {#each prompts as prompt (prompt.id)}
        <DropdownMenu.Item
          onclick={() => {
            onInsertPrompt(prompt);
            isOpen = false;
          }}
          class="focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer items-center rounded-sm px-2 py-2 text-sm transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        >
          <div class="flex flex-1 flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="text-lg">{getCategoryIcon(prompt.category)}</span>
              <span class="font-medium">{prompt.name}</span>
              {#if prompt.isPublic}
                <span
                  class="border-border bg-muted text-muted-foreground rounded border px-1.5 py-0.5 text-xs"
                >
                  Public
                </span>
              {/if}
            </div>
            <div class="flex items-center gap-2">
              <span
                class="{getCategoryColor(
                  prompt.category
                )} rounded px-1.5 py-0.5 text-xs font-medium capitalize"
              >
                {getCanonicalCategory(prompt.category)}
              </span>
              <span class="text-muted-foreground truncate text-xs" title={prompt.content}>
                {truncateContent(prompt.content)}
              </span>
            </div>
          </div>
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
