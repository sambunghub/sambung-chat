<script lang="ts">
  import { onMount } from 'svelte';
  import { orpc } from '$lib/orpc';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Settings2Icon from '@lucide/svelte/icons/settings-2';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import CheckIcon from '@lucide/svelte/icons/check';
  import EditIcon from '@lucide/svelte/icons/edit';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import KeyIcon from '@lucide/svelte/icons/key';

  type Model = {
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
  };

  type ApiKey = {
    id: string;
    provider: string;
    name: string;
    keyLast4: string;
    createdAt: Date;
  };

  let models = $state<Model[]>([]);
  let apiKeys = $state<ApiKey[]>([]);
  let loading = $state(false);
  let errorMessage = $state('');
  let showAddDialog = $state(false);
  let showEditDialog = $state(false);
  let editingModel = $state<Model | null>(null);

  // Form state
  let formData = $state({
    provider: 'openai' as const,
    modelId: '',
    name: '',
    baseUrl: '',
    apiKeyId: '',
    isActive: false,
    avatarUrl: '',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    topK: 0,
    frequencyPenalty: 0,
    presencePenalty: 0,
  });

  const providers = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'google', label: 'Google' },
    { value: 'groq', label: 'Groq' },
    { value: 'ollama', label: 'Ollama' },
    { value: 'openrouter', label: 'OpenRouter' },
    { value: 'custom', label: 'Custom' },
  ] as const;

  // Computed: Filter API keys based on selected provider
  function getFilteredApiKeys(provider: string) {
    return apiKeys.filter((key) => key.provider === provider || provider === 'custom');
  }

  onMount(async () => {
    await Promise.all([loadModels(), loadApiKeys()]);
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

  // TODO: Re-implement after API key router migration
  // async function loadApiKeys() {
  //   try {
  //     const result = await orpc.apiKey.getAll();
  //     apiKeys = result as ApiKey[];
  //   } catch (error) {
  //     console.error('Failed to load API keys:', error);
  //   }
  // }
  async function loadApiKeys() {
    // Placeholder - API key router removed during security improvements
    // Use api-keys page instead
    apiKeys = [];
  }

  function openAddDialog() {
    formData = {
      provider: 'openai',
      modelId: '',
      name: '',
      baseUrl: '',
      apiKeyId: '',
      isActive: false,
      avatarUrl: '',
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
      topK: 0,
      frequencyPenalty: 0,
      presencePenalty: 0,
    };
    showAddDialog = true;
  }

  function openEditDialog(model: Model) {
    editingModel = model;
    formData = {
      provider: model.provider as any,
      modelId: model.modelId,
      name: model.name,
      baseUrl: model.baseUrl || '',
      apiKeyId: model.apiKeyId || '',
      isActive: model.isActive,
      avatarUrl: model.avatarUrl || '',
      temperature: model.settings?.temperature ?? 0.7,
      maxTokens: model.settings?.maxTokens ?? 4096,
      topP: model.settings?.topP ?? 1,
      topK: model.settings?.topK ?? 0,
      frequencyPenalty: model.settings?.frequencyPenalty ?? 0,
      presencePenalty: model.settings?.presencePenalty ?? 0,
    };
    showEditDialog = true;
  }

  async function handleCreate() {
    errorMessage = '';
    try {
      await orpc.model.create({
        provider: formData.provider,
        modelId: formData.modelId,
        name: formData.name,
        baseUrl: formData.baseUrl || undefined,
        apiKeyId: formData.apiKeyId || undefined,
        isActive: formData.isActive,
        avatarUrl: formData.avatarUrl || undefined,
        settings: {
          temperature: formData.temperature,
          maxTokens: formData.maxTokens,
          topP: formData.topP,
          topK: formData.topK,
          frequencyPenalty: formData.frequencyPenalty,
          presencePenalty: formData.presencePenalty,
        },
      });
      showAddDialog = false;
      await loadModels();
    } catch (error) {
      console.error('Failed to create model:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to create model';
    }
  }

  async function handleUpdate() {
    if (!editingModel) return;

    errorMessage = '';
    try {
      await orpc.model.update({
        id: editingModel.id,
        modelId: formData.modelId,
        name: formData.name,
        baseUrl: formData.baseUrl || undefined,
        apiKeyId: formData.apiKeyId || undefined,
        isActive: formData.isActive,
        avatarUrl: formData.avatarUrl || undefined,
        settings: {
          temperature: formData.temperature,
          maxTokens: formData.maxTokens,
          topP: formData.topP,
          topK: formData.topK,
          frequencyPenalty: formData.frequencyPenalty,
          presencePenalty: formData.presencePenalty,
        },
      });
      showEditDialog = false;
      editingModel = null;
      await loadModels();
    } catch (error) {
      console.error('Failed to update model:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to update model';
    }
  }

  async function handleSetActive(id: string) {
    errorMessage = '';
    try {
      await orpc.model.setActive({ id });
      await loadModels();
    } catch (error) {
      console.error('Failed to set active model:', error);
      errorMessage = 'Failed to set active model';
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this model?')) return;

    errorMessage = '';
    try {
      await orpc.model.delete({ id });
      await loadModels();
    } catch (error) {
      console.error('Failed to delete model:', error);
      errorMessage = 'Failed to delete model';
    }
  }

  function getProviderLabel(provider: string) {
    return providers.find((p) => p.value === provider)?.label || provider;
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-foreground text-lg font-semibold">Configure AI Models</h3>
      <p class="text-muted-foreground text-sm">Add and manage your AI model configurations</p>
    </div>
    <Button onclick={openAddDialog}>
      <PlusIcon class="mr-2 size-4" />
      Add Model
    </Button>
  </div>

  {#if errorMessage}
    <div class="bg-destructive/10 border-destructive text-destructive rounded border p-3 text-sm">
      {errorMessage}
    </div>
  {/if}

  {#if loading}
    <div class="text-muted-foreground py-8 text-center">Loading models...</div>
  {:else if models.length === 0}
    <Card>
      <CardContent class="py-12">
        <div class="text-center">
          <Settings2Icon class="text-muted-foreground mx-auto mb-4 size-12 opacity-50" />
          <h4 class="text-foreground mb-2 text-lg font-semibold">No models configured</h4>
          <p class="text-muted-foreground mb-4 text-sm">Add your first AI model to get started</p>
          <Button onclick={openAddDialog} variant="outline">
            <PlusIcon class="mr-2 size-4" />
            Add Your First Model
          </Button>
        </div>
      </CardContent>
    </Card>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each models as model (model.id)}
        <Card class={model.isActive ? 'border-primary' : ''}>
          <CardHeader>
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <CardTitle class="text-base">
                  {model.name}
                </CardTitle>
                {#if model.isActive}
                  <div
                    class="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                  >
                    <ZapIcon class="size-3" />
                    Active
                  </div>
                {/if}
              </div>
              <DropdownMenu.DropdownMenu>
                <DropdownMenu.DropdownMenuTrigger
                  class="hover:bg-accent rounded p-1"
                  onclick={(e) => e.stopPropagation()}
                >
                  <EditIcon class="size-4" />
                </DropdownMenu.DropdownMenuTrigger>
                <DropdownMenu.DropdownMenuContent>
                  <DropdownMenu.DropdownMenuItem onclick={() => openEditDialog(model)}>
                    <EditIcon class="mr-2 size-4" />
                    Edit
                  </DropdownMenu.DropdownMenuItem>
                  {#if !model.isActive}
                    <DropdownMenu.DropdownMenuItem onclick={() => handleSetActive(model.id)}>
                      <ZapIcon class="mr-2 size-4" />
                      Set as Active
                    </DropdownMenu.DropdownMenuItem>
                  {/if}
                  <DropdownMenu.DropdownMenuItem
                    onclick={() => handleDelete(model.id)}
                    class="text-destructive focus:text-destructive"
                  >
                    <Trash2Icon class="mr-2 size-4" />
                    Delete
                  </DropdownMenu.DropdownMenuItem>
                </DropdownMenu.DropdownMenuContent>
              </DropdownMenu.DropdownMenu>
            </div>
            <CardDescription class="text-xs">
              {getProviderLabel(model.provider)} · {model.modelId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-1 text-xs">
              {#if model.baseUrl}
                <div class="text-muted-foreground">
                  Base: {model.baseUrl}
                </div>
              {/if}
              {#if model.settings?.temperature !== undefined}
                <div class="text-muted-foreground">
                  Temp: {model.settings.temperature}
                </div>
              {/if}
              {#if model.settings?.maxTokens !== undefined}
                <div class="text-muted-foreground">
                  Max Tokens: {model.settings.maxTokens}
                </div>
              {/if}
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Add Model Dialog -->
{#if showAddDialog}
  <div
    class="bg-background/80 fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
  >
    <div
      class="bg-background max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg"
    >
      <div class="border-b p-6">
        <h2 class="text-foreground text-xl font-semibold">Add New Model</h2>
      </div>
      <div class="max-h-[calc(90vh-140px)] space-y-4 overflow-y-auto p-6">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="provider">
              Provider <span class="text-destructive">*</span>
            </Label>
            <select
              id="provider"
              bind:value={formData.provider}
              class="border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-1 focus:outline-none"
            >
              {#each providers as provider}
                <option value={provider.value}>{provider.label}</option>
              {/each}
            </select>
          </div>

          <div class="space-y-2">
            <Label for="modelId">
              Model ID <span class="text-destructive">*</span>
            </Label>
            <Input
              id="modelId"
              bind:value={formData.modelId}
              placeholder="e.g., gpt-4o, claude-3-5-sonnet-20241022, glm-4"
              required
            />
            <p class="text-muted-foreground text-xs">
              The actual model identifier used by the API. Examples:
              {#if formData.provider === 'openai'}
                gpt-4o, gpt-4o-mini, gpt-4-turbo
              {:else if formData.provider === 'anthropic'}
                claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022
              {:else if formData.provider === 'google'}
                gemini-2.0-flash-exp, gemini-1.5-pro
              {:else if formData.provider === 'groq'}
                llama-3.3-70b-versatile, mixtral-8x7b-32768
              {:else if formData.provider === 'ollama'}
                llama3.2, codellama:latest
              {:else if formData.provider === 'openrouter'}
                openai/gpt-4o, anthropic/claude-3.5-sonnet, google/gemini-2.0-flash-exp
              {:else if formData.provider === 'custom'}
                glm-4, glm-4-flash, glm-4-plus (for GLM APIs)
              {/if}
            </p>
          </div>

          <div class="space-y-2 md:col-span-2">
            <Label for="name">
              Display Name <span class="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              bind:value={formData.name}
              placeholder="e.g., GPT-4o, Claude 3.5 Sonnet, My GLM Model"
              required
            />
            <p class="text-muted-foreground text-xs">
              A friendly name for display in the UI. Can be different from Model ID.
            </p>
          </div>

          <div class="space-y-2 md:col-span-2">
            <Label for="baseUrl">Base URL (Optional)</Label>
            <Input
              id="baseUrl"
              bind:value={formData.baseUrl}
              placeholder="https://api.example.com/v1"
              type="url"
            />
            <p class="text-muted-foreground text-xs">
              For OpenAI-compatible APIs. Automatically removes /chat/completions if present.
            </p>
          </div>

          <div class="space-y-2 md:col-span-2">
            <Label for="apiKeyId">
              API Key
              <KeyIcon class="ml-1 inline size-3" />
            </Label>
            <select
              id="apiKeyId"
              bind:value={formData.apiKeyId}
              class="border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-1 focus:outline-none"
            >
              <option value="">Use environment variables (default)</option>
              {#each getFilteredApiKeys(formData.provider) as key}
                <option value={key.id}>{key.name} (•••{key.keyLast4})</option>
              {/each}
            </select>
            <p class="text-muted-foreground text-xs">
              Select an API key from your stored keys, or leave empty to use environment variables.
              <a href="/app/settings/api-keys" class="text-primary ml-1 hover:underline"
                >Manage API Keys</a
              >
            </p>
          </div>

          <div class="space-y-2">
            <Label for="temperature">Temperature (0-2)</Label>
            <Input
              id="temperature"
              type="number"
              min="0"
              max="2"
              step="0.1"
              bind:value={formData.temperature}
            />
          </div>

          <div class="space-y-2">
            <Label for="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              min="1"
              max="1000000"
              bind:value={formData.maxTokens}
            />
          </div>

          <div class="space-y-2">
            <Label for="topP">Top P (0-1)</Label>
            <Input id="topP" type="number" min="0" max="1" step="0.1" bind:value={formData.topP} />
          </div>

          <div class="space-y-2">
            <Label for="topK">Top K (0-100)</Label>
            <Input id="topK" type="number" min="0" max="100" bind:value={formData.topK} />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            id="setActive"
            bind:checked={formData.isActive}
            class="border-input bg-background focus:ring-ring rounded border px-2 py-1 text-sm focus:ring-1 focus:outline-none"
          />
          <Label for="setActive" class="text-sm">Set as active model</Label>
        </div>
      </div>
      <div class="bg-muted/30 flex justify-end gap-2 border-b p-4">
        <Button variant="outline" onclick={() => (showAddDialog = false)}>Cancel</Button>
        <Button onclick={handleCreate} disabled={!formData.name || !formData.modelId}>
          <CheckIcon class="mr-2 size-4" />
          Add Model
        </Button>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Model Dialog -->
{#if showEditDialog && editingModel}
  <div
    class="bg-background/80 fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
  >
    <div
      class="bg-background max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg"
    >
      <div class="border-b p-6">
        <h2 class="text-foreground text-xl font-semibold">Edit Model</h2>
      </div>
      <div class="max-h-[calc(90vh-140px)] space-y-4 overflow-y-auto p-6">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2 md:col-span-2">
            <Label for="edit-name">
              Display Name <span class="text-destructive">*</span>
            </Label>
            <Input
              id="edit-name"
              bind:value={formData.name}
              placeholder="e.g., GPT-4o, Claude 3.5 Sonnet, My GLM Model"
              required
            />
            <p class="text-muted-foreground text-xs">
              A friendly name for display in the UI. Can be different from Model ID.
            </p>
          </div>

          <div class="space-y-2 md:col-span-2">
            <Label for="edit-modelId">
              Model ID <span class="text-destructive">*</span>
            </Label>
            <Input
              id="edit-modelId"
              bind:value={formData.modelId}
              placeholder="e.g., gpt-4o, claude-3-5-sonnet-20241022, glm-4"
              required
            />
            <p class="text-muted-foreground text-xs">
              The actual model identifier used by the API. This must match exactly what the provider
              expects.
            </p>
            <div class="bg-muted/50 mt-2 rounded border p-3 text-xs">
              <div class="mb-2 font-semibold">
                <a
                  href="https://openrouter.ai/models"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary hover:underline"
                >
                  View all models on OpenRouter ↗
                </a>
              </div>
              <div class="text-muted-foreground space-y-1">
                <div><strong>Format examples:</strong></div>
                <div>
                  • OpenAI: <code class="bg-background rounded px-1">gpt-4o</code>,
                  <code class="bg-background rounded px-1">gpt-4o-mini</code>
                </div>
                <div>
                  • Anthropic: <code class="bg-background rounded px-1"
                    >claude-3-5-sonnet-20241022</code
                  >
                </div>
                <div>
                  • Google: <code class="bg-background rounded px-1">gemini-2.0-flash-exp</code>
                </div>
                <div>
                  • Custom/GLM: <code class="bg-background rounded px-1">glm-4</code>,
                  <code class="bg-background rounded px-1">glm-4-flash</code>
                </div>
                <div class="text-muted-foreground mt-2">
                  <strong>OpenRouter format:</strong>
                  <code class="bg-background rounded px-1">provider/model-name</code>
                  (e.g.,
                  <code class="bg-background rounded px-1">anthropic/claude-3.5-sonnet</code>)
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-2 md:col-span-2">
            <Label for="edit-baseUrl">Base URL (Optional)</Label>
            <Input
              id="edit-baseUrl"
              bind:value={formData.baseUrl}
              placeholder="https://api.example.com/v1"
              type="url"
            />
            <p class="text-muted-foreground text-xs">
              For OpenAI-compatible APIs. Automatically removes /chat/completions if present.
            </p>
          </div>

          <div class="space-y-2 md:col-span-2">
            <Label for="edit-apiKeyId">
              API Key
              <KeyIcon class="ml-1 inline size-3" />
            </Label>
            <select
              id="edit-apiKeyId"
              bind:value={formData.apiKeyId}
              class="border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-1 focus:outline-none"
            >
              <option value="">Use environment variables (default)</option>
              {#each editingModel && getFilteredApiKeys(editingModel.provider) as key}
                <option value={key.id}>{key.name} (•••{key.keyLast4})</option>
              {/each}
            </select>
            <p class="text-muted-foreground text-xs">
              Select an API key from your stored keys, or leave empty to use environment variables.
            </p>
          </div>

          <div class="space-y-2">
            <Label for="edit-temperature">Temperature (0-2)</Label>
            <Input
              id="edit-temperature"
              type="number"
              min="0"
              max="2"
              step="0.1"
              bind:value={formData.temperature}
            />
          </div>

          <div class="space-y-2">
            <Label for="edit-maxTokens">Max Tokens</Label>
            <Input
              id="edit-maxTokens"
              type="number"
              min="1"
              max="1000000"
              bind:value={formData.maxTokens}
            />
          </div>

          <div class="space-y-2">
            <Label for="edit-topP">Top P (0-1)</Label>
            <Input
              id="edit-topP"
              type="number"
              min="0"
              max="1"
              step="0.1"
              bind:value={formData.topP}
            />
          </div>

          <div class="space-y-2">
            <Label for="edit-topK">Top K (0-100)</Label>
            <Input id="edit-topK" type="number" min="0" max="100" bind:value={formData.topK} />
          </div>
        </div>
      </div>
      <div class="bg-muted/30 flex justify-end gap-2 border-b p-4">
        <Button variant="outline" onclick={() => (showEditDialog = false)}>Cancel</Button>
        <Button onclick={handleUpdate} disabled={!formData.name}>
          <CheckIcon class="mr-2 size-4" />
          Save Changes
        </Button>
      </div>
    </div>
  </div>
{/if}
