<script lang="ts">
  import { onMount } from 'svelte';
  import { orpc } from '$lib/orpc';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import CheckIcon from '@lucide/svelte/icons/check';

  type Model = {
    id: string;
    provider: string;
    modelId: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  let { onSelectModel, selectedModelId }: { onSelectModel: (model: Model) => void; selectedModelId?: string } = $props();

  let models = $state<Model[]>([]);
  let loading = $state(true);
  let errorMessage = $state('');

  onMount(async () => {
    await loadModels();
  });

  async function loadModels() {
    loading = true;
    errorMessage = '';
    try {
      const result = await orpc.model.getAll();
      models = result as Model[];
    } catch (error) {
      console.error('Failed to load models:', error);
      errorMessage = 'Failed to load models';
    } finally {
      loading = false;
    }
  }

  function getProviderIcon(provider: string) {
    switch (provider) {
      case 'openai':
        return '🤖';
      case 'anthropic':
        return '🧠';
      case 'google':
        return '🔍';
      case 'groq':
        return '⚡';
      case 'ollama':
        return '🦙';
      default:
        return '🔧';
    }
  }

  function getSelectedModel() {
    if (selectedModelId) {
      return models.find((m) => m.id === selectedModelId);
    }
    // Return active model if no specific model selected
    return models.find((m) => m.isActive);
  }

  let isOpen = $state(false);

  const selectedModel = $derived(getSelectedModel());
</script>

{#if errorMessage}
  <div class="bg-destructive/10 border-destructive text-destructive rounded border px-3 py-2 text-sm">
    {errorMessage}
  </div>
{:else if loading}
  <div class="border-border bg-muted text-muted-foreground rounded border px-4 py-2 text-sm">
    Loading models...
  </div>
{:else if models.length === 0}
  <div class="border-border bg-muted text-muted-foreground rounded border px-4 py-2 text-sm">
    No models configured
  </div>
{:else}
  <DropdownMenu.Root bind:open={isOpen}>
    <DropdownMenu.Trigger let:child>
      {@render child({
        class: 'bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        onclick: () => (isOpen = !isOpen)
      })}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-56" align="start">
      <DropdownMenu.Label class="px-2 py-1.5 text-sm font-semibold">
        Select Model
      </DropdownMenu.Label>
      <DropdownMenu.Separator />
      {#each models as model (model.id)}
        <DropdownMenu.Item
          onclick={() => {
            onSelectModel(model);
            isOpen = false;
          }}
          class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        >
          <span class="mr-2 text-lg">{getProviderIcon(model.provider)}</span>
          <div class="flex flex-1 flex-col">
            <span class="font-medium">{model.name}</span>
            <span class="text-muted-foreground text-xs">{model.modelId}</span>
          </div>
          {#if model.id === selectedModel?.id || model.isActive}
            <CheckIcon class="ml-auto size-4" />
          {/if}
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
