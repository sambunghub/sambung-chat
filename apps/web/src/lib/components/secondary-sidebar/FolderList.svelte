<script lang="ts">
  import { orpc } from '$lib/orpc';
  import { onMount } from 'svelte';
  import FolderListItem from './FolderListItem.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import FolderPlusIcon from '@lucide/svelte/icons/folder-plus';
  import XIcon from '@lucide/svelte/icons/x';

  // Types
  interface Folder {
    id: string;
    name: string;
    userId: string;
    createdAt: Date;
  }

  interface Props {
    currentChatId?: string;
  }

  let { currentChatId: _currentChatId }: Props = $props();

  // State
  let folders = $state<Folder[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let showCreateForm = $state(false);
  let newFolderName = $state('');
  let isCreating = $state(false);

  // Load folders on mount
  async function loadFolders() {
    loading = true;
    error = null;
    try {
      const result = await orpc.folder.getAll();
      folders = result as Folder[];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load folders';
    } finally {
      loading = false;
    }
  }

  // Initial load
  onMount(() => {
    loadFolders();
  });

  // Handle folder creation
  async function handleCreateFolder() {
    if (!newFolderName.trim() || isCreating) return;

    isCreating = true;
    try {
      await orpc.folder.create({
        name: newFolderName.trim(),
      });
      newFolderName = '';
      showCreateForm = false;
      await loadFolders();
    } catch (err) {
      console.error('Failed to create folder:', err);
    } finally {
      isCreating = false;
    }
  }

  // Handle folder deletion
  async function deleteFolder(folderId: string) {
    try {
      await orpc.folder.delete({ id: folderId });
      folders = folders.filter((f) => f.id !== folderId);
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  }

  // Handle folder rename
  async function renameFolder(folderId: string, newName: string) {
    try {
      await orpc.folder.update({ id: folderId, name: newName });
      folders = folders.map((f) => (f.id === folderId ? { ...f, name: newName } : f));
    } catch (err) {
      console.error('Failed to rename folder:', err);
    }
  }
</script>

<div class="flex h-full flex-col">
  <!-- Header -->
  <Sidebar.Header class="border-b p-4">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-semibold">Folders</h2>
      <Button
        size="sm"
        onclick={() => (showCreateForm = !showCreateForm)}
        variant="outline"
        disabled={showCreateForm}
      >
        <FolderPlusIcon class="size-4" />
      </Button>
    </div>

    {#if showCreateForm}
      <div class="flex gap-2">
        <Input
          type="text"
          placeholder="Folder name..."
          bind:value={newFolderName}
          onkeydown={(e) => e.key === 'Enter' && handleCreateFolder()}
          class="h-8"
          disabled={isCreating}
        />
        <Button
          size="sm"
          onclick={handleCreateFolder}
          disabled={!newFolderName.trim() || isCreating}
        >
          {isCreating ? '...' : 'Add'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onclick={() => {
            showCreateForm = false;
            newFolderName = '';
          }}
        >
          <XIcon class="size-4" />
        </Button>
      </div>
    {/if}
  </Sidebar.Header>

  <!-- Content -->
  <Sidebar.Content class="flex-1 overflow-hidden">
    {#if loading}
      <div class="text-muted-foreground flex items-center justify-center p-8 text-sm">
        Loading folders...
      </div>
    {:else if error}
      <div class="flex flex-col items-center justify-center p-8 text-center">
        <p class="text-destructive mb-2">Error loading folders</p>
        <p class="text-muted-foreground mb-4 text-sm">{error}</p>
        <Button size="sm" variant="outline" onclick={loadFolders}>Retry</Button>
      </div>
    {:else if folders.length === 0}
      <div class="flex flex-col items-center justify-center p-8 text-center">
        <FolderPlusIcon class="text-muted-foreground mb-2 size-8" />
        <p class="text-muted-foreground mb-4 text-sm">No folders yet</p>
        <Button size="sm" variant="outline" onclick={() => (showCreateForm = true)}>
          Create Folder
        </Button>
      </div>
    {:else}
      <div class="h-full overflow-y-auto px-2">
        {#each folders as folder (folder.id)}
          <FolderListItem
            {folder}
            onDelete={() => deleteFolder(folder.id)}
            onRename={(newName) => renameFolder(folder.id, newName)}
          />
        {/each}
      </div>
    {/if}
  </Sidebar.Content>
</div>
