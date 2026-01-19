<script lang="ts">
  import { goto } from '$app/navigation';
  import { orpc } from '$lib/orpc';
  import { onMount } from 'svelte';
  import ChatListItem from './ChatListItem.svelte';
  import ChatEmptyState from './ChatEmptyState.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { autofocus } from '$lib/actions/autofocus.js';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import PanelLeftCloseIcon from '@lucide/svelte/icons/panel-left-close';
  import FolderIcon from '@lucide/svelte/icons/folder';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

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
  let searching = $state(false);
  let error = $state<string | null>(null);
  let searchQuery = $state('');
  let selectedFolderId = $state<string>('');
  let showPinnedOnly = $state(false);
  let collapsedFolders = $state<Record<string, boolean>>({});
  let isInitialLoad = $state(true);

  // Folder rename state
  let renamingFolderId = $state<string | null>(null);
  let folderRenameValue = $state('');

  // Computed - filtered chats (API handles filtering, just return chats)
  let filteredChats = $derived(() => chats);

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

  // Handle filter changes (folder, pinned) - direct event handlers, not reactive
  function handleFolderChange() {
    if (!isInitialLoad) {
      loadChats();
    }
  }

  function handlePinnedChange() {
    if (!isInitialLoad) {
      loadChats();
    }
  }

  // Load chats with search & filters
  async function loadChats() {
    // Use searching state for filter changes, loading for initial load
    if (isInitialLoad) {
      loading = true;
    } else {
      searching = true;
    }
    error = null;

    try {
      const result = await orpc.chat.search({
        query: searchQuery || undefined,
        folderId: selectedFolderId || undefined,
        pinnedOnly: showPinnedOnly || undefined,
      });
      chats = result as Chat[];
    } catch (err) {
      console.error('Failed to load chats:', err);
      // Only set error if it's a network/fetch error (not cancellation)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        error = 'Network error - check if server is running';
      } else {
        error = err instanceof Error ? err.message : 'Failed to load chats';
      }
    } finally {
      loading = false;
      searching = false;
      isInitialLoad = false;
    }
  }

  // Handle search on Enter key
  function handleSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      loadChats();
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

  // Handle folder rename
  function startFolderRename(folderId: string, folderName: string) {
    renamingFolderId = folderId;
    folderRenameValue = folderName;
  }

  // Handle folder keyboard events (for accessibility)
  function handleFolderKeyPress(folderId: string, folderName: string, e: KeyboardEvent) {
    if (e.key === 'Enter') {
      startFolderRename(folderId, folderName);
    }
  }

  async function saveFolderRename() {
    if (!renamingFolderId || !folderRenameValue.trim()) {
      renamingFolderId = null;
      folderRenameValue = '';
      return;
    }

    try {
      await orpc.folder.update({ id: renamingFolderId, name: folderRenameValue.trim() });
      // Update local state
      folders = folders.map((f) =>
        f.id === renamingFolderId ? { ...f, name: folderRenameValue.trim() } : f
      );
      renamingFolderId = null;
      folderRenameValue = '';
    } catch (err) {
      console.error('Failed to rename folder:', err);
      alert('Failed to rename folder. Please try again.');
    }
  }

  function cancelFolderRename() {
    renamingFolderId = null;
    folderRenameValue = '';
  }

  function handleFolderKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      saveFolderRename();
    } else if (e.key === 'Escape') {
      cancelFolderRename();
    }
  }

  // Handle folder delete
  async function deleteFolder(folderId: string, folderName: string) {
    const confirmed = confirm(
      `Are you sure you want to delete folder "${folderName}"?\n\nAll chats in this folder will be moved to "No Folder".`
    );

    if (!confirmed) return;

    try {
      // Get chats in this folder
      const chatsInFolder = chats.filter((c) => c.folderId === folderId);

      // Move all chats to "No Folder" (folderId = null)
      for (const chat of chatsInFolder) {
        await orpc.chat.updateFolder({ id: chat.id, folderId: null });
      }

      // Delete the folder
      await orpc.folder.delete({ id: folderId });

      // Update local state
      chats = chats.map((c) => (c.folderId === folderId ? { ...c, folderId: null } : c));
      folders = folders.filter((f) => f.id !== folderId);
    } catch (err) {
      console.error('Failed to delete folder:', err);
      alert('Failed to delete folder. Please try again.');
    }
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

    <!-- Search Input (press Enter to search) -->
    <div class="mb-3">
      <Input
        type="text"
        placeholder="Search chats... (press Enter)"
        bind:value={searchQuery}
        onkeydown={handleSearchKeydown}
        class="h-8"
      />
    </div>

    <!-- Filter Controls -->
    <div class="flex items-center justify-between gap-2">
      <select
        value={selectedFolderId}
        onchange={(e) => {
          selectedFolderId = e.currentTarget.value;
          handleFolderChange();
        }}
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
          checked={showPinnedOnly}
          onchange={(e) => {
            showPinnedOnly = e.currentTarget.checked;
            handlePinnedChange();
          }}
          class="border-input bg-background focus:ring-ring rounded border px-1 py-0.5 text-sm focus:ring-1 focus:outline-none"
        />
        Pinned only
      </label>
    </div>
  </Sidebar.Header>

  <!-- Content -->
  <Sidebar.Content class="flex-1 overflow-hidden">
    {#if error}
      <div class="flex flex-col items-center gap-3 p-4 text-center">
        <div class="text-destructive text-sm">
          <svg class="mx-auto mb-2 size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="font-medium">Failed to load chats</p>
          <p class="text-muted-foreground mt-1">{error}</p>
        </div>
        <Button size="sm" onclick={loadChats} variant="outline">
          <svg class="mr-1 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Retry
        </Button>
      </div>
    {:else if loading || searching}
      <div class="text-muted-foreground flex items-center justify-center p-8 text-sm">
        {loading ? 'Loading chats...' : 'Searching...'}
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
                  {searchQuery}
                />
              {/each}
            </div>
          {/if}

          <!-- Folders Section -->
          {#each groupedChats().folderGroups as { folder, chats: folderChats } (folder.id)}
            {#if folderChats.length > 0}
              <div class="mb-3">
                <!-- Collapsible Folder Header -->
                <div
                  class="group/folder relative"
                  ondblclick={() => startFolderRename(folder.id, folder.name)}
                  onkeydown={(e) => handleFolderKeyPress(folder.id, folder.name, e)}
                  role="button"
                  tabindex="0"
                  aria-label={`Folder ${folder.name}, double-click to rename`}
                >
                  {#if renamingFolderId === folder.id}
                    <!-- Inline Rename Input -->
                    <input
                      type="text"
                      class="bg-background focus:ring-ring w-full rounded border px-2 py-1 text-xs font-semibold uppercase focus:ring-1 focus:outline-none"
                      bind:value={folderRenameValue}
                      onkeydown={handleFolderKeydown}
                      onblur={saveFolderRename}
                      use:autofocus
                    />
                  {:else}
                    <!-- Folder Display -->
                    <div
                      role="button"
                      tabindex="0"
                      aria-label={`Toggle folder ${folder.name}`}
                      onclick={(e) => {
                        // Only toggle if not clicking on actions
                        if ((e.target as HTMLElement).closest('[data-action]')) return;
                        toggleFolder(folder.id);
                      }}
                      onkeydown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleFolder(folder.id);
                        }
                      }}
                      class="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold uppercase transition-colors"
                    >
                      {#if isFolderCollapsed(folder.id)}
                        <ChevronRightIcon class="size-3.5" />
                      {:else}
                        <ChevronDownIcon class="size-3.5" />
                      {/if}
                      <FolderIcon class="size-3" />
                      <span class="flex-1 text-left">{folder.name}</span>

                      <!-- Folder Actions (visible on hover) -->
                      <span
                        class="flex gap-0.5 opacity-0 transition-opacity group-hover/folder:opacity-100"
                      >
                        <div
                          data-action
                          onclick={() => startFolderRename(folder.id, folder.name)}
                          onkeydown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              startFolderRename(folder.id, folder.name);
                            }
                          }}
                          class="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer rounded p-0.5"
                          role="button"
                          tabindex="0"
                          aria-label={`Rename folder ${folder.name}`}
                          title="Rename folder"
                        >
                          <PencilIcon class="size-3" />
                        </div>
                        <div
                          data-action
                          onclick={() => deleteFolder(folder.id, folder.name)}
                          onkeydown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              deleteFolder(folder.id, folder.name);
                            }
                          }}
                          class="text-muted-foreground hover:text-destructive hover:bg-accent cursor-pointer rounded p-0.5"
                          role="button"
                          tabindex="0"
                          aria-label={`Delete folder ${folder.name}`}
                          title="Delete folder"
                        >
                          <Trash2Icon class="size-3" />
                        </div>
                      </span>

                      <span class="text-muted-foreground text-xs">
                        {folderChats.length}
                      </span>
                    </div>
                  {/if}
                </div>

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
                      {searchQuery}
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
                  {searchQuery}
                />
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </Sidebar.Content>
</div>
