<script lang="ts">
  import { goto } from '$app/navigation';
  import { orpc } from '$lib/orpc';
  import { onMount } from 'svelte';
  import ChatListItem from './ChatListItem.svelte';
  import ChatEmptyState from './ChatEmptyState.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import PanelLeftCloseIcon from '@lucide/svelte/icons/panel-left-close';
  import FolderIcon from '@lucide/svelte/icons/folder';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

  // Types
  interface Chat {
    id: string;
    title: string;
    modelId: string;
    pinned: boolean;
    folderId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface Folder {
    id: string;
    name: string;
    userId: string;
    createdAt: Date;
  }

  interface Props {
    currentChatId?: string;
    onToggleCollapse?: () => void;
  }

  let { currentChatId, onToggleCollapse }: Props = $props();

  // State
  let chats = $state<Chat[]>([]);
  let folders = $state<Folder[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let searchQuery = $state('');
  let debouncedSearch = $state('');
  let searchTimeout: ReturnType<typeof setTimeout>;
  let selectedFolderId = $state<string>('');
  let showPinnedOnly = $state(false);
  let collapsedFolders = $state<Record<string, boolean>>({});

  // Computed - filtered chats
  let filteredChats = $derived(() => {
    let results = [...chats]; // ← Clone array to prevent mutation

    // Filter by search query
    if (debouncedSearch) {
      results = results.filter((chat) =>
        chat.title.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Filter by folder
    if (selectedFolderId) {
      results = results.filter((chat) => chat.folderId === selectedFolderId);
    }

    // Filter by pinned only
    if (showPinnedOnly) {
      results = results.filter((chat) => chat.pinned);
    }

    // Sort: pinned first, then by date
    return results.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  });

  // Group chats by folder and time period
  let groupedChats = $derived(() => {
    const pinnedChats: Chat[] = [];
    const folderGroupsArray: Array<{ folder: Folder; chats: Chat[] }> = [];
    const noFolderChats: Chat[] = [];

    // Build folder groups array
    if (folders && folders.length > 0) {
      const folderRecord: Record<string, Chat[]> = {};

      // Initialize folder record
      for (const folder of folders) {
        folderRecord[folder.id] = [];
      }

      // Group chats by folder
      for (const chat of filteredChats()) {
        if (chat.pinned) {
          pinnedChats.push(chat);
        } else if (chat.folderId && folderRecord[chat.folderId]) {
          folderRecord[chat.folderId]!.push(chat);
        } else {
          noFolderChats.push(chat);
        }
      }

      // Convert to array
      for (const folder of folders) {
        const chats = folderRecord[folder.id] || [];
        folderGroupsArray.push({ folder, chats });
      }
    } else {
      // No folders - all chats go to noFolderChats
      for (const chat of filteredChats()) {
        if (chat.pinned) {
          pinnedChats.push(chat);
        } else {
          noFolderChats.push(chat);
        }
      }
    }

    return { pinnedChats, folderGroups: folderGroupsArray, noFolderChats };
  });

  // Debounced search
  $effect(() => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      debouncedSearch = searchQuery;
    }, 300);
  });

  // Load chats on mount
  async function loadChats() {
    loading = true;
    error = null;
    try {
      const result = await orpc.chat.getAll();
      chats = result as Chat[];
    } catch (err) {
      console.error('Failed to load chats:', err);
      error = err instanceof Error ? err.message : 'Failed to load chats';
    } finally {
      loading = false;
    }
  }

  // Load folders
  async function loadFolders() {
    try {
      const result = await orpc.folder.getAll();
      folders = result as Folder[];
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  }

  // Initial load
  onMount(() => {
    loadChats();
    loadFolders();
  });

  // Handle chat selection
  async function selectChat(chatId: string) {
    await goto(`/app/chat/${chatId}`);
  }

  // Handle new chat - redirect to /app/chat without creating database row
  async function createNewChat() {
    try {
      await goto('/app/chat');
    } catch (err) {
      console.error('Failed to navigate to new chat:', err);
    }
  }

  // Handle chat deletion
  async function deleteChat(chatId: string) {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    const confirmed = confirm(
      `Are you sure you want to delete "${chat.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await orpc.chat.delete({ id: chatId });
      // Remove from local state
      chats = chats.filter((c) => c.id !== chatId);
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  }

  // Handle chat rename
  async function renameChat(chatId: string, newTitle: string) {
    try {
      await orpc.chat.update({ id: chatId, title: newTitle });
      // Update local state
      chats = chats.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c));
    } catch (err) {
      console.error('Failed to rename chat:', err);
    }
  }

  // Handle pin toggle
  async function togglePin(chatId: string) {
    try {
      const updated = await orpc.chat.togglePin({ id: chatId });
      // Update local state
      chats = chats.map((c) => (c.id === chatId ? { ...c, pinned: updated.pinned } : c));
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  }

  // Handle folder creation
  async function createFolder(chatId: string) {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;

    try {
      // Create new folder
      const newFolder = await orpc.folder.create({
        name: folderName.trim(),
      });

      // Move chat to new folder
      await orpc.chat.updateFolder({ id: chatId, folderId: newFolder.id });

      // Update local state
      chats = chats.map((c) => (c.id === chatId ? { ...c, folderId: newFolder.id } : c));

      // Reload folders to get updated list
      await loadFolders();
    } catch (err) {
      console.error('Failed to create folder:', err);
      alert('Failed to create folder. Please try again.');
    }
  }

  // Handle moving chat to folder
  async function moveChatToFolder(chatId: string, folderId: string | null) {
    try {
      await orpc.chat.updateFolder({ id: chatId, folderId });
      // Update local state
      chats = chats.map((c) => (c.id === chatId ? { ...c, folderId } : c));
    } catch (err) {
      console.error('Failed to move chat to folder:', err);
    }
  }

  // Toggle folder collapsed state
  function toggleFolder(folderId: string) {
    collapsedFolders = {
      ...collapsedFolders,
      [folderId]: !collapsedFolders[folderId],
    };
  }

  // Check if folder is collapsed (default to true = hidden)
  function isFolderCollapsed(folderId: string): boolean {
    return collapsedFolders[folderId] ?? true;
  }
</script>

<div class="flex h-full flex-col">
  <!-- Header -->
  <Sidebar.Header class="border-b p-4">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-semibold">Chats</h2>
      <div class="flex gap-2">
        {#if onToggleCollapse}
          <Button
            size="sm"
            onclick={onToggleCollapse}
            variant="ghost"
            title="Collapse chat list"
            class="h-8 w-8 p-0"
          >
            <PanelLeftCloseIcon class="size-4" />
          </Button>
        {/if}
        <Button size="sm" onclick={createNewChat} variant="default">
          <PlusIcon class="mr-1 size-4" />
          New Chat
        </Button>
      </div>
    </div>

    <!-- Search Input with Debounce -->
    <div class="mb-3">
      <Input
        type="text"
        placeholder="Search chats..."
        bind:value={searchQuery}
        oninput={() => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
            debouncedSearch = searchQuery;
          }, 300);
        }}
        class="h-8"
      />
    </div>

    <!-- Filter Controls -->
    <div class="flex items-center justify-between gap-2">
      <select
        bind:value={selectedFolderId}
        class="border-input bg-background focus:ring-ring flex-1 rounded-md border px-2 py-1 text-sm focus:ring-1 focus:outline-none"
      >
        <option value="">All Folders</option>
        {#each folders as folder}
          <option value={folder.id}>{folder.name}</option>
        {/each}
      </select>
      <label class="text-muted-foreground flex items-center gap-1.5 text-xs">
        <input
          type="checkbox"
          bind:checked={showPinnedOnly}
          class="border-input bg-background focus:ring-ring rounded border px-1 py-0.5 text-sm focus:ring-1 focus:outline-none"
        />
        Pinned only
      </label>
    </div>
  </Sidebar.Header>

  <!-- Content -->
  <Sidebar.Content class="flex-1 overflow-hidden">
    {#if loading}
      <div class="text-muted-foreground flex items-center justify-center p-8 text-sm">
        Loading chats...
      </div>
    {:else if error}
      <div class="flex flex-col items-center justify-center p-8 text-center">
        <p class="text-destructive mb-2">Error loading chats</p>
        <p class="text-muted-foreground mb-4 text-sm">{error}</p>
        <Button size="sm" variant="outline" onclick={loadChats}>Retry</Button>
      </div>
    {:else if chats.length === 0}
      <ChatEmptyState onNewChat={createNewChat} />
    {:else}
      <div class="h-full max-h-[50vh] overflow-y-auto">
        <div class="px-2">
          <!-- Pinned Section -->
          {#if groupedChats().pinnedChats.length > 0}
            <div class="mb-4">
              <h3
                class="text-muted-foreground mb-2 flex items-center gap-1.5 px-2 text-xs font-semibold uppercase"
              >
                Pinned
              </h3>
              {#each groupedChats().pinnedChats as chat (chat.id)}
                <ChatListItem
                  {chat}
                  {folders}
                  isActive={currentChatId === chat.id}
                  onSelect={() => selectChat(chat.id)}
                  onDelete={() => deleteChat(chat.id)}
                  onRename={(newTitle) => renameChat(chat.id, newTitle)}
                  onTogglePin={() => togglePin(chat.id)}
                  onMoveToFolder={(folderId) => moveChatToFolder(chat.id, folderId)}
                  onCreateFolder={() => createFolder(chat.id)}
                />
              {/each}
            </div>
          {/if}

          <!-- Folders Section -->
          {#each groupedChats().folderGroups as { folder, chats: folderChats } (folder.id)}
            {#if folderChats.length > 0}
              <div class="mb-3">
                <!-- Collapsible Folder Header -->
                <button
                  onclick={() => toggleFolder(folder.id)}
                  class="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold uppercase transition-colors"
                >
                  {#if isFolderCollapsed(folder.id)}
                    <ChevronRightIcon class="size-3.5" />
                  {:else}
                    <ChevronDownIcon class="size-3.5" />
                  {/if}
                  <FolderIcon class="size-3" />
                  {folder.name}
                  <span class="text-muted-foreground ml-auto text-xs">
                    {folderChats.length}
                  </span>
                </button>

                <!-- Folder Chats (only show when expanded) -->
                {#if !isFolderCollapsed(folder.id)}
                  {#each folderChats as chat (chat.id)}
                    <ChatListItem
                      {chat}
                      {folders}
                      isActive={currentChatId === chat.id}
                      onSelect={() => selectChat(chat.id)}
                      onDelete={() => deleteChat(chat.id)}
                      onRename={(newTitle) => renameChat(chat.id, newTitle)}
                      onTogglePin={() => togglePin(chat.id)}
                      onMoveToFolder={(folderId) => moveChatToFolder(chat.id, folderId)}
                      onCreateFolder={() => createFolder(chat.id)}
                    />
                  {/each}
                {/if}
              </div>
            {/if}
          {/each}

          <!-- No Folder Section -->
          {#if groupedChats().noFolderChats.length > 0}
            <div class="mb-4">
              <h3
                class="text-muted-foreground mb-2 flex items-center gap-1.5 px-2 text-xs font-semibold uppercase"
              >
                No Folder
              </h3>
              {#each groupedChats().noFolderChats as chat (chat.id)}
                <ChatListItem
                  {chat}
                  {folders}
                  isActive={currentChatId === chat.id}
                  onSelect={() => selectChat(chat.id)}
                  onDelete={() => deleteChat(chat.id)}
                  onRename={(newTitle) => renameChat(chat.id, newTitle)}
                  onTogglePin={() => togglePin(chat.id)}
                  onMoveToFolder={(folderId) => moveChatToFolder(chat.id, folderId)}
                  onCreateFolder={() => createFolder(chat.id)}
                />
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </Sidebar.Content>
</div>
