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
  import KeyIcon from '@lucide/svelte/icons/key';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import CheckIcon from '@lucide/svelte/icons/check';
  import EditIcon from '@lucide/svelte/icons/edit';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import EyeOffIcon from '@lucide/svelte/icons/eye-off';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import ShieldIcon from '@lucide/svelte/icons/shield';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';

  // Type assertion for apiKey router (temporary workaround until types are regenerated)
  const apiKeyClient = orpc as any & {
    apiKey: {
      getAll: () => Promise<any[]>;
      getById: (input: { id: string }) => Promise<any>;
      create: (input: any) => Promise<any>;
      update: (input: any) => Promise<any>;
      delete: (input: { id: string }) => Promise<void>;
    };
  };

  type ApiKey = {
    id: string;
    provider: string;
    name: string;
    keyLast4: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  let apiKeys = $state<ApiKey[]>([]);
  let loading = $state(false);
  let errorMessage = $state('');
  let showAddDialog = $state(false);
  let showEditDialog = $state(false);
  let editingKey = $state<(ApiKey & { key?: string }) | null>(null);
  let visibleKeys = $state<Record<string, string>>({});

  // Form state
  let formData = $state({
    provider: 'openai' as const,
    name: '',
    key: '',
    isActive: true,
  });

  const providers = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'google', label: 'Google' },
    { value: 'groq', label: 'Groq' },
    { value: 'ollama', label: 'Ollama' },
    { value: 'openrouter', label: 'OpenRouter' },
    { value: 'other', label: 'Other' },
  ] as const;

  onMount(async () => {
    await loadApiKeys();
  });

  async function loadApiKeys() {
    loading = true;
    errorMessage = '';
    try {
      const result = await apiKeyClient.apiKey.getAll();
      apiKeys = result as ApiKey[];
    } catch (error) {
      errorMessage = 'Failed to load API keys';
    } finally {
      loading = false;
    }
  }

  function openAddDialog() {
    formData = {
      provider: 'openai',
      name: '',
      key: '',
      isActive: true,
    };
    showAddDialog = true;
  }

  async function openEditDialog(id: string) {
    errorMessage = '';
    try {
      const result = await apiKeyClient.apiKey.getById({ id });
      editingKey = result as ApiKey & { key?: string };
      formData = {
        provider: editingKey.provider as any,
        name: editingKey.name,
        key: editingKey.key || '',
        isActive: editingKey.isActive,
      };
      showEditDialog = true;
    } catch (error) {
      errorMessage = 'Failed to load API key details';
    }
  }

  async function handleCreate() {
    errorMessage = '';
    try {
      await apiKeyClient.apiKey.create({
        provider: formData.provider,
        name: formData.name,
        key: formData.key,
      });
      showAddDialog = false;
      await loadApiKeys();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to create API key';
    }
  }

  async function handleUpdate() {
    if (!editingKey) return;

    errorMessage = '';
    try {
      await apiKeyClient.apiKey.update({
        id: editingKey.id,
        provider: formData.provider,
        name: formData.name,
        key: formData.key || undefined,
        isActive: formData.isActive,
      });
      showEditDialog = false;
      editingKey = null;
      await loadApiKeys();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to update API key';
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    errorMessage = '';
    try {
      await apiKeyClient.apiKey.delete({ id });
      await loadApiKeys();
    } catch (error) {
      errorMessage = 'Failed to delete API key';
    }
  }

  async function toggleKeyVisibility(id: string) {
    if (visibleKeys[id]) {
      delete visibleKeys[id];
    } else {
      try {
        const result = await apiKeyClient.apiKey.getById({ id });
        visibleKeys[id] = (result as any).key;
      } catch (error) {
        errorMessage = 'Failed to retrieve API key';
      }
    }
    visibleKeys = { ...visibleKeys };
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      errorMessage = 'Failed to copy to clipboard';
    }
  }

  function getProviderLabel(provider: string) {
    return providers.find((p) => p.value === provider)?.label || provider;
  }

  function getProviderColor(provider: string) {
    const colors: Record<string, string> = {
      openai: 'bg-emerald-500',
      anthropic: 'bg-orange-500',
      google: 'bg-blue-500',
      groq: 'bg-purple-500',
      ollama: 'bg-gray-500',
      openrouter: 'bg-pink-500',
      other: 'bg-slate-500',
    };
    return colors[provider] || 'bg-slate-500';
  }
</script>

<header class="bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b p-4">
  <Sidebar.Trigger class="-ms-1" />
  <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item>
        <Breadcrumb.Page>API Keys</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb.List>
  </Breadcrumb.Root>
</header>

<div class="p-6">
  <div class="mx-auto max-w-6xl">
    <div class="mb-8">
      <h1 class="text-foreground mb-2 text-3xl font-bold">API Keys</h1>
      <p class="text-muted-foreground">
        Manage your API keys for different AI providers. Keys are encrypted and stored securely.
      </p>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-foreground text-lg font-semibold">Your API Keys</h3>
          <p class="text-muted-foreground text-sm">
            Add and manage your encrypted API keys
          </p>
        </div>
        <Button onclick={openAddDialog}>
          <PlusIcon class="mr-2 size-4" />
          Add API Key
        </Button>
      </div>

      {#if errorMessage}
        <div class="bg-destructive/10 border-destructive text-destructive rounded border p-3 text-sm">
          {errorMessage}
        </div>
      {/if}

      {#if loading}
        <div class="text-muted-foreground py-8 text-center">Loading API keys...</div>
      {:else if apiKeys.length === 0}
        <Card>
          <CardContent class="py-12">
            <div class="text-center">
              <ShieldIcon class="text-muted-foreground mx-auto mb-4 size-12 opacity-50" />
              <h4 class="text-foreground mb-2 text-lg font-semibold">No API keys configured</h4>
              <p class="text-muted-foreground mb-4 text-sm">
                Add your first API key to start using AI models
              </p>
              <Button onclick={openAddDialog} variant="outline">
                <KeyIcon class="mr-2 size-4" />
                Add Your First API Key
              </Button>
            </div>
          </CardContent>
        </Card>
      {:else}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each apiKeys as apiKey (apiKey.id)}
            <Card class={!apiKey.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-2">
                    <div
                      class="flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white {getProviderColor(apiKey.provider)}"
                    >
                      {getProviderLabel(apiKey.provider).charAt(0)}
                    </div>
                    <CardTitle class="text-base">
                      {apiKey.name}
                    </CardTitle>
                  </div>
                  <DropdownMenu.DropdownMenu>
                    <DropdownMenu.DropdownMenuTrigger
                      class="hover:bg-accent rounded p-1"
                      onclick={(e) => e.stopPropagation()}
                    >
                      <EditIcon class="size-4" />
                    </DropdownMenu.DropdownMenuTrigger>
                    <DropdownMenu.DropdownMenuContent>
                      <DropdownMenu.DropdownMenuItem onclick={() => openEditDialog(apiKey.id)}>
                        <EditIcon class="mr-2 size-4" />
                        Edit
                      </DropdownMenu.DropdownMenuItem>
                      <DropdownMenu.DropdownMenuItem
                        onclick={() => handleDelete(apiKey.id)}
                        class="text-destructive focus:text-destructive"
                      >
                        <Trash2Icon class="mr-2 size-4" />
                        Delete
                      </DropdownMenu.DropdownMenuItem>
                    </DropdownMenu.DropdownMenuContent>
                  </DropdownMenu.DropdownMenu>
                </div>
                <CardDescription class="text-xs">
                  {getProviderLabel(apiKey.provider)}
                  {#if !apiKey.isActive}
                    · <span class="text-muted-foreground">Inactive</span>
                  {/if}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <div class="text-muted-foreground text-xs">Key ending in</div>
                    <code class="bg-muted text-foreground rounded px-2 py-1 text-xs font-mono">
                      ••••{apiKey.keyLast4}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-6 w-6 p-0"
                      onclick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {#if visibleKeys[apiKey.id]}
                        <EyeOffIcon class="size-3" />
                      {:else}
                        <EyeIcon class="size-3" />
                      {/if}
                    </Button>
                  </div>

                  {#if visibleKeys[apiKey.id]}
                    <div class="space-y-1 text-xs">
                      <div class="flex items-center gap-2">
                        <code
                          class="bg-muted text-foreground flex-1 rounded px-2 py-1 text-xs font-mono break-all"
                        >
                          {visibleKeys[apiKey.id]}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          class="h-6 w-6 p-0"
                          onclick={() => copyToClipboard(visibleKeys[apiKey.id])}
                        >
                          <CopyIcon class="size-3" />
                        </Button>
                      </div>
                    </div>
                  {/if}

                  <div class="text-muted-foreground text-xs">
                    Added {new Date(apiKey.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          {/each}
        </div>
      {/if}
    </div>

    <div class="mt-8 rounded-lg border p-4">
      <div class="flex gap-3">
        <ShieldIcon class="text-primary size-5 shrink-0" />
        <div>
          <h4 class="text-foreground text-sm font-semibold">Security Information</h4>
          <p class="text-muted-foreground text-sm">
            Your API keys are encrypted at rest using AES-256-GCM encryption. Keys are never exposed in
            logs or error messages. Each user can only access their own keys.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Add API Key Dialog -->
{#if showAddDialog}
  <div
    class="bg-background/80 fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
    aria-labelledby="add-dialog-title"
  >
    <div
      class="bg-background max-h-[90vh] w-full max-w-lg overflow-hidden rounded-lg border shadow-lg"
    >
      <div class="border-b p-6">
        <h2 id="add-dialog-title" class="text-foreground text-xl font-semibold">Add New API Key</h2>
      </div>
      <div class="max-h-[calc(90vh-140px)] space-y-4 overflow-y-auto p-6">
        <div class="space-y-2">
          <Label for="provider">Provider</Label>
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
          <Label for="name">Name</Label>
          <Input
            id="name"
            bind:value={formData.name}
            placeholder="e.g., My OpenAI Key"
            required
          />
          <p class="text-muted-foreground text-xs">A friendly name to identify this key</p>
        </div>

        <div class="space-y-2">
          <Label for="key">API Key</Label>
          <Input
            id="key"
            bind:value={formData.key}
            placeholder="sk-..."
            type="password"
            autocomplete="off"
            required
          />
          <p class="text-muted-foreground text-xs">Your API key will be encrypted before storage</p>
        </div>
      </div>
      <div class="bg-muted/30 flex justify-end gap-2 border-b p-4">
        <Button variant="outline" onclick={() => (showAddDialog = false)}>Cancel</Button>
        <Button onclick={handleCreate} disabled={!formData.name || !formData.key}>
          <CheckIcon class="mr-2 size-4" />
          Add Key
        </Button>
      </div>
    </div>
  </div>
{/if}

<!-- Edit API Key Dialog -->
{#if showEditDialog && editingKey}
  <div
    class="bg-background/80 fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
    aria-labelledby="edit-dialog-title"
  >
    <div
      class="bg-background max-h-[90vh] w-full max-w-lg overflow-hidden rounded-lg border shadow-lg"
    >
      <div class="border-b p-6">
        <h2 id="edit-dialog-title" class="text-foreground text-xl font-semibold">Edit API Key</h2>
      </div>
      <div class="max-h-[calc(90vh-140px)] space-y-4 overflow-y-auto p-6">
        <div class="space-y-2">
          <Label for="edit-provider">Provider</Label>
          <select
            id="edit-provider"
            bind:value={formData.provider}
            class="border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-1 focus:outline-none"
          >
            {#each providers as provider}
              <option value={provider.value}>{provider.label}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-2">
          <Label for="edit-name">Name</Label>
          <Input
            id="edit-name"
            bind:value={formData.name}
            placeholder="e.g., My OpenAI Key"
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="edit-key">API Key</Label>
          <Input
            id="edit-key"
            bind:value={formData.key}
            placeholder="Leave empty to keep current key"
            type="password"
            autocomplete="off"
          />
          <p class="text-muted-foreground text-xs">
            Leave empty to keep the existing key, or enter a new key to replace it
          </p>
        </div>

        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            id="edit-active"
            bind:checked={formData.isActive}
            class="border-input bg-background focus:ring-ring rounded border px-2 py-1 text-sm focus:ring-1 focus:outline-none"
          />
          <Label for="edit-active" class="text-sm">Active</Label>
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
