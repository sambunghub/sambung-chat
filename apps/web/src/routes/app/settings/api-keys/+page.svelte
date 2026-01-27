<script lang="ts">
  import { onMount } from 'svelte';
  import { orpc } from '$lib/orpc';
  import { page } from '$app/stores';
  import { Card, CardContent } from '$lib/components/ui/card/index.js';
  import ShieldIcon from '@lucide/svelte/icons/shield';
  import SecondarySidebarTrigger from '$lib/components/secondary-sidebar-trigger.svelte';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import { ApiKeyForm, ApiKeyList, type ApiKeyFormData } from '$lib/components/settings/api-keys';
  import { toast } from 'svelte-sonner';
  import * as Dialog from '$lib/components/ui/dialog/index.js';

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
  let showAddDialog = $state(false);
  let showEditDialog = $state(false);
  let submitting = $state(false);
  let editingKey = $state<(ApiKey & { key?: string }) | null>(null);
  let visibleKeys = $state<Record<string, string>>({});

  // Form state
  let formData = $state<ApiKeyFormData>({
    provider: 'openai',
    name: '',
    key: '',
    isActive: true,
  });

  onMount(async () => {
    await loadApiKeys();
  });

  async function loadApiKeys() {
    loading = true;
    try {
      const result = await apiKeyClient.apiKey.getAll();
      apiKeys = (result as ApiKey[]) || [];
    } catch (error) {
      toast.error('Failed to load API keys', {
        description: error instanceof Error ? error.message : 'Please try again later',
        action: {
          label: 'Retry',
          onClick: () => loadApiKeys(),
        },
      });
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
    submitting = true;
    try {
      const result = await apiKeyClient.apiKey.getById({ id });
      editingKey = (result as ApiKey & { key?: string }) || null;
      formData = {
        provider: editingKey.provider as any,
        name: editingKey.name,
        key: editingKey.key || '',
        isActive: editingKey.isActive,
      };
      showEditDialog = true;
    } catch (error) {
      toast.error('Failed to load API key details', {
        description: error instanceof Error ? error.message : 'Please try again',
        action: {
          label: 'Retry',
          onClick: () => openEditDialog(id),
        },
      });
    } finally {
      submitting = false;
    }
  }

  async function handleCreate(data: ApiKeyFormData) {
    submitting = true;

    // Optimistic update: Create temporary key
    const tempId = crypto.randomUUID();
    const optimisticKey: ApiKey = {
      id: tempId,
      provider: data.provider,
      name: data.name,
      keyLast4: data.key.slice(-4),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add optimistically to the list
    const previousKeys = [...apiKeys];
    apiKeys = [optimisticKey, ...apiKeys];
    showAddDialog = false;

    try {
      const result = await apiKeyClient.apiKey.create({
        provider: data.provider,
        name: data.name,
        key: data.key,
      });

      // Replace optimistic key with real key
      apiKeys = apiKeys.map((key) => (key.id === tempId ? (result as ApiKey) : key));

      toast.success('API key created successfully', {
        description: `"${data.name}" has been added to your keys`,
      });
    } catch (error) {
      // Revert optimistic update on error
      apiKeys = previousKeys;
      showAddDialog = true;

      toast.error('Failed to create API key', {
        description: error instanceof Error ? error.message : 'Please try again',
        action: {
          label: 'Retry',
          onClick: () => handleCreate(data),
        },
      });
    } finally {
      submitting = false;
    }
  }

  async function handleUpdate(data: ApiKeyFormData) {
    if (!editingKey) return;

    submitting = true;

    // Store previous state for rollback
    const previousKeys = [...apiKeys];
    const editingKeyId = editingKey.id;

    // Optimistic update: Update key in place
    apiKeys = apiKeys.map((key) =>
      key.id === editingKeyId
        ? {
            ...key,
            provider: data.provider,
            name: data.name,
            isActive: data.isActive,
            updatedAt: new Date(),
          }
        : key
    );
    showEditDialog = false;

    try {
      await apiKeyClient.apiKey.update({
        id: editingKeyId,
        provider: data.provider,
        name: data.name,
        key: data.key || undefined,
        isActive: data.isActive,
      });

      toast.success('API key updated successfully', {
        description: `"${data.name}" has been updated`,
      });
    } catch (error) {
      // Revert optimistic update on error
      apiKeys = previousKeys;
      showEditDialog = true;

      toast.error('Failed to update API key', {
        description: error instanceof Error ? error.message : 'Please try again',
        action: {
          label: 'Retry',
          onClick: () => handleUpdate(data),
        },
      });
    } finally {
      submitting = false;
    }
  }

  async function handleDelete(id: string) {
    const keyToDelete = apiKeys.find((k) => k.id === id);

    if (
      !confirm(
        `Are you sure you want to delete "${keyToDelete?.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    // Optimistic update: Remove key from list
    const previousKeys = [...apiKeys];
    apiKeys = apiKeys.filter((key) => key.id !== id);

    try {
      await apiKeyClient.apiKey.delete({ id });

      toast.success('API key deleted successfully', {
        description: `"${keyToDelete?.name}" has been removed`,
      });
    } catch (error) {
      // Revert optimistic update on error
      apiKeys = previousKeys;

      toast.error('Failed to delete API key', {
        description: error instanceof Error ? error.message : 'Please try again',
        action: {
          label: 'Retry',
          onClick: () => handleDelete(id),
        },
      });
    }
  }

  async function toggleKeyVisibility(id: string) {
    if (visibleKeys[id]) {
      delete visibleKeys[id];
      visibleKeys = { ...visibleKeys };
    } else {
      try {
        const result = await apiKeyClient.apiKey.getById({ id });
        visibleKeys[id] = (result as any).key;
        visibleKeys = { ...visibleKeys };
      } catch (error) {
        toast.error('Failed to retrieve API key', {
          description: error instanceof Error ? error.message : 'Please try again',
        });
      }
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard', {
        description: 'API key has been copied to your clipboard',
      });
    } catch (error) {
      toast.error('Failed to copy to clipboard', {
        description: 'Please check your browser permissions',
      });
    }
  }
</script>

<header class="bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b p-4">
  <SecondarySidebarTrigger class="-ms-1" />
  <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item>
        <Breadcrumb.Link href="/app/settings">Settings</Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Separator />
      <Breadcrumb.Item>
        <Breadcrumb.Page>API Keys</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb.List>
  </Breadcrumb.Root>
</header>

<div class="flex h-[calc(100vh-61px)]">
  <main class="flex-1 overflow-auto p-6">
    <div class="mx-auto max-w-6xl">
      <div class="mb-8">
        <h1 class="text-foreground mb-2 text-3xl font-bold">API Keys</h1>
        <p class="text-muted-foreground">
          Manage your API keys for different AI providers. Keys are encrypted and stored securely.
        </p>
      </div>

      <ApiKeyList
        {apiKeys}
        {loading}
        {visibleKeys}
        onadd={openAddDialog}
        onedit={openEditDialog}
        ondelete={handleDelete}
        ontogglevisibility={toggleKeyVisibility}
        oncopy={copyToClipboard}
      />

      <div class="mt-8 rounded-lg border p-4">
        <div class="flex gap-3">
          <ShieldIcon class="text-primary size-5 shrink-0" />
          <div>
            <h4 class="text-foreground text-sm font-semibold">Security Information</h4>
            <p class="text-muted-foreground text-sm">
              Your API keys are encrypted at rest using AES-256-GCM encryption. Keys are never
              exposed in logs or error messages. Each user can only access their own keys.
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Add API Key Dialog -->
<Dialog.Root bind:open={showAddDialog}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Add New API Key</Dialog.Title>
      <Dialog.Description>
        Enter your API key details to add a new provider credential
      </Dialog.Description>
    </Dialog.Header>
    <div class="max-h-[calc(90vh-140px)] overflow-y-auto py-4">
      <ApiKeyForm
        bind:data={formData}
        {submitting}
        onsubmit={handleCreate}
        oncancel={() => (showAddDialog = false)}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Edit API Key Dialog -->
<Dialog.Root bind:open={showEditDialog}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Edit API Key</Dialog.Title>
      <Dialog.Description>Update your API key details and settings</Dialog.Description>
    </Dialog.Header>
    <div class="max-h-[calc(90vh-140px)] overflow-y-auto py-4">
      <ApiKeyForm
        bind:data={formData}
        isEdit={true}
        {submitting}
        onsubmit={handleUpdate}
        oncancel={() => (showEditDialog = false)}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>
