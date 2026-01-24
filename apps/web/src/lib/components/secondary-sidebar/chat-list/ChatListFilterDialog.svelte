<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

  type Provider = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama' | 'custom';

  interface Model {
    id: string;
    provider: string;
    modelId: string;
    name: string;
    baseUrl?: string;
    apiKeyId?: string;
    isActive: boolean;
    avatarUrl?: string;
    settings?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      topK?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
    };
    createdAt: Date;
    updatedAt: Date;
  }

  interface Props {
    show: boolean;
    providers: Provider[];
    models: Model[];
    selectedProviders: Provider[];
    selectedModelIds: string[];
    dateFrom: string;
    dateTo: string;
    onProvidersChange: () => void;
    onModelsChange: () => void;
    onDateChange: () => void;
    onClearAll: () => void;
    hasAnyFilters: boolean;
  }

  let {
    show,
    providers,
    models,
    selectedProviders,
    selectedModelIds,
    dateFrom,
    dateTo,
    onProvidersChange,
    onModelsChange,
    onDateChange,
    onClearAll,
    hasAnyFilters,
  }: Props = $props();

  const providerLabels: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    groq: 'Groq',
    ollama: 'Ollama',
    custom: 'Custom',
  };
</script>

<Dialog.Root bind:open={show}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Advanced Filters</Dialog.Title>
      <Dialog.Description>Filter by AI provider, model, and date range</Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <!-- Provider Filter -->
      {#if providers.length > 0}
        <div class="space-y-2">
          <label class="text-sm font-medium">Providers</label>
          <DropdownMenu.DropdownMenu>
            <DropdownMenu.Trigger
              class="border-input bg-background hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground focus:ring-ring flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm focus:ring-1 focus:outline-none"
              type="button"
            >
              <div class="flex items-center gap-2">
                <FilterIcon class="size-4" />
                <span class="text-muted-foreground">
                  {selectedProviders.length === 0
                    ? 'All Providers'
                    : `${selectedProviders.length} provider${selectedProviders.length > 1 ? 's' : ''} selected`}
                </span>
              </div>
              <ChevronDownIcon class="size-4" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content class="w-56">
              {#each providers as provider (provider)}
                {@const isSelected = selectedProviders.includes(provider)}
                <DropdownMenu.CheckboxItem
                  checked={isSelected}
                  onselect={() => {
                    if (isSelected) {
                      selectedProviders = selectedProviders.filter((p) => p !== provider);
                    } else {
                      selectedProviders = [...selectedProviders, provider];
                    }
                    onProvidersChange();
                  }}
                >
                  <span class="flex-1">{providerLabels[provider] || provider}</span>
                </DropdownMenu.CheckboxItem>
              {/each}
              {#if selectedProviders.length > 0}
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  onclick={() => {
                    selectedProviders = [];
                    onProvidersChange();
                  }}
                >
                  Clear providers
                </DropdownMenu.Item>
              {/if}
            </DropdownMenu.Content>
          </DropdownMenu.DropdownMenu>
        </div>
      {/if}

      <!-- Model Filter -->
      {#if models.length > 0}
        <div class="space-y-2">
          <label class="text-sm font-medium">Models</label>
          <DropdownMenu.DropdownMenu>
            <DropdownMenu.Trigger
              class="border-input bg-background hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground focus:ring-ring flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm focus:ring-1 focus:outline-none"
              type="button"
            >
              <div class="flex items-center gap-2">
                <FilterIcon class="size-4" />
                <span class="text-muted-foreground">
                  {selectedModelIds.length === 0
                    ? 'All Models'
                    : `${selectedModelIds.length} model${selectedModelIds.length > 1 ? 's' : ''} selected`}
                </span>
              </div>
              <ChevronDownIcon class="size-4" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content class="max-h-80 w-56 overflow-y-auto">
              {#each models as model (model.id)}
                {@const isSelected = selectedModelIds.includes(model.id)}
                <DropdownMenu.CheckboxItem
                  checked={isSelected}
                  onselect={() => {
                    if (isSelected) {
                      selectedModelIds = selectedModelIds.filter((id) => id !== model.id);
                    } else {
                      selectedModelIds = [...selectedModelIds, model.id];
                    }
                    onModelsChange();
                  }}
                >
                  <span class="flex-1 truncate" title={model.name}>{model.name}</span>
                </DropdownMenu.CheckboxItem>
              {/each}
              {#if selectedModelIds.length > 0}
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  onclick={() => {
                    selectedModelIds = [];
                    onModelsChange();
                  }}
                >
                  Clear models
                </DropdownMenu.Item>
              {/if}
            </DropdownMenu.Content>
          </DropdownMenu.DropdownMenu>
        </div>
      {/if}

      <!-- Date Range Filter -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Date Range</label>
        <div class="flex items-center gap-2">
          <div class="flex-1">
            <Input
              type="date"
              value={dateFrom}
              onchange={(e) => {
                dateFrom = e.currentTarget.value;
                onDateChange();
              }}
              class="h-9 text-sm"
              placeholder="From date"
            />
          </div>
          <span class="text-muted-foreground text-sm">to</span>
          <div class="flex-1">
            <Input
              type="date"
              value={dateTo}
              onchange={(e) => {
                dateTo = e.currentTarget.value;
                onDateChange();
              }}
              class="h-9 text-sm"
              placeholder="To date"
            />
          </div>
        </div>
      </div>
    </div>

    <Dialog.Footer>
      <div class="flex w-full items-center justify-between">
        <Button
          variant="ghost"
          onclick={onClearAll}
          disabled={!hasAnyFilters}
          class="text-muted-foreground"
        >
          <RotateCcwIcon class="mr-2 size-4" />
          Clear All
        </Button>
        <div class="flex gap-2">
          <Dialog.Close>
            <Button variant="outline">Close</Button>
          </Dialog.Close>
        </div>
      </div>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
