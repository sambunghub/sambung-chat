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
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { exportAllChats, type ChatsByFolder } from '$lib/utils/chat-export';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import FileJsonIcon from '@lucide/svelte/icons/file-json';
  import CodeIcon from '@lucide/svelte/icons/code';
  import PackageIcon from '@lucide/svelte/icons/package';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import FolderIcon from '@lucide/svelte/icons/folder';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';

  // Types
  interface MatchingMessage {
    id: string;
    chatId: string;
    role: string;
    content: string;
    createdAt: Date;
  }

  interface Chat {
    id: string;
    title: string;
    modelId: string;
    pinned: boolean;
    folderId: string | null;
    createdAt: Date;
    updatedAt: Date;
    matchingMessages?: MatchingMessage[];
  }

  interface Folder {
    id: string;
    name: string;
    userId: string;
    createdAt: Date;
  }

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
    currentChatId?: string;
  }

  let { currentChatId }: Props = $props();

  // State
  let chats = $state<Chat[]>([]);
  let folders = $state<Folder[]>([]);
  let models = $state<Model[]>([]);
  let loading = $state(true);
  let searching = $state(false);
  let error = $state<string | null>(null);
  let searchQuery = $state('');
  let selectedFolderId = $state<string>('');
  let showPinnedOnly = $state(false);
  let selectedProviders = $state<
    Array<'openai' | 'anthropic' | 'google' | 'groq' | 'ollama' | 'custom'>
  >([]);
  let selectedModelIds = $state<Array<string>>([]);
  let dateFrom = $state<string>('');
  let dateTo = $state<string>('');
  let collapsedFolders = $state<Record<string, boolean>>({});
  let isInitialLoad = $state(true);

  // Folder rename state
  let renamingFolderId = $state<string | null>(null);
  let folderRenameValue = $state('');

  // Export state
  let exporting = $state(false);
  let exportFormat = $state<'json' | 'md' | 'zip' | 'zip-optimized' | null>(null);

  // Filter dialog state
  let showFilterDialog = $state(false);

  // Computed - filtered chats (API handles filtering, just return chats)
  let filteredChats = $derived(() => chats);

  // Computed - unique providers from user's models
  let availableProviders = $derived(() => {
    const providerSet = new Set(models.map((m) => m.provider));
    return Array.from(providerSet).sort() as Array<
      'openai' | 'anthropic' | 'google' | 'groq' | 'ollama' | 'custom'
    >;
  });

  // Computed - available models filtered by selected providers
  let availableModels = $derived(() => {
    if (selectedProviders.length === 0) {
      return models.sort((a, b) => a.name.localeCompare(b.name));
    }
    return models
      .filter((m) => selectedProviders.includes(m.provider as any))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  // Computed - provider labels for display
  const providerLabels: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    groq: 'Groq',
    ollama: 'Ollama',
    custom: 'Custom',
  };

  // Computed - check if advanced filters are active (for filter button state)
  let hasActiveFilters = $derived(
    !isInitialLoad &&
      (selectedProviders.length > 0 ||
        selectedModelIds.length > 0 ||
        dateFrom !== '' ||
        dateTo !== '')
  );

  // Computed - check if any filters are active (for showing "Clear All" button)
  let hasAnyFilters = $derived(
    !isInitialLoad &&
      (searchQuery !== '' ||
        selectedFolderId !== '' ||
        showPinnedOnly ||
        selectedProviders.length > 0 ||
        selectedModelIds.length > 0 ||
        dateFrom !== '' ||
        dateTo !== '')
  );

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

  function handleProvidersChange() {
    if (!isInitialLoad) {
      // Clear model selection when providers change
      selectedModelIds = [];
      loadChats();
    }
  }

  function handleModelsChange() {
    if (!isInitialLoad) {
      loadChats();
    }
  }

  function handleDateChange() {
    if (!isInitialLoad) {
      loadChats();
    }
  }

  // Clear all filters and reset to default view
  function handleClearAllFilters() {
    searchQuery = '';
    selectedFolderId = '';
    showPinnedOnly = false;
    selectedProviders = [];
    selectedModelIds = [];
    dateFrom = '';
    dateTo = '';
    loadChats();
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
        searchInMessages: searchQuery ? true : undefined,
        folderId: selectedFolderId || undefined,
        pinnedOnly: showPinnedOnly || undefined,
        providers: selectedProviders.length > 0 ? selectedProviders : undefined,
        modelIds: selectedModelIds.length > 0 ? selectedModelIds : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      chats = result;
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

  // Load models
  async function loadModels() {
    try {
      const result = await orpc.model.getAll();
      models = result as Model[];
    } catch (err) {
      console.error('Failed to load models:', err);
    }
  }

  // Initial load
  onMount(() => {
    loadChats();
    loadFolders();
    loadModels();
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
      // Delete the folder - backend will automatically move chats to "No Folder"
      await orpc.folder.delete({ id: folderId });

      // Update local state
      chats = chats.map((c) => (c.folderId === folderId ? { ...c, folderId: null } : c));
      folders = folders.filter((f) => f.id !== folderId);
    } catch (err) {
      console.error('Failed to delete folder:', err);
      alert('Failed to delete folder. Please try again.');
    }
  }

  // Handle export all chats
  async function handleExportAll(format: 'json' | 'md' | 'zip') {
    if (exporting) return;

    exporting = true;
    exportFormat = format;

    try {
      // Fetch all chats with messages and folder information
      const chatsByFolder = await orpc.chat.getChatsByFolder();

      // Map format from UI to export utility format
      if (format === 'zip') {
        exportFormat = 'zip-optimized'; // Use optimized ZIP with both formats
      } else {
        exportFormat = format;
      }

      // Export with progress tracking
      const result = await exportAllChats(chatsByFolder as ChatsByFolder, exportFormat, {
        onProgress: (current, total, message) => {
          // Progress tracking could be added here in future
          // For now, the export operation shows loading state
        },
        onError: (chat, error) => {
          // Log error but continue exporting
          console.warn(`Failed to export chat "${chat.title}":`, error);
          return true; // Continue with remaining chats
        },
      });

      // Show success message
      if (result.success) {
        alert(`Successfully exported ${result.exported} chat(s)!`);
      } else {
        // Partial success - some chats failed
        alert(
          `Export completed with warnings:\n` +
            `✓ Exported: ${result.exported} chat(s)\n` +
            `✗ Failed: ${result.failed} chat(s)\n\n` +
            `Check console for details.`
        );
      }
    } catch (err) {
      console.error('Failed to export chats:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to export chats: ${errorMessage}\n\nPlease try again.`);
    } finally {
      exporting = false;
      exportFormat = null;
    }
  }
</script>

<div class="flex h-full flex-col">
  <!-- Header -->
  <Sidebar.Header class="border-b p-4">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-semibold">Chats</h2>
      <div class="flex gap-2">
        <DropdownMenu.DropdownMenu>
          <DropdownMenu.DropdownMenuTrigger
            class="bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
            disabled={exporting}
            title="Export all chats"
          >
            <DownloadIcon class="size-4" />
          </DropdownMenu.DropdownMenuTrigger>
          <DropdownMenu.DropdownMenuContent>
            <DropdownMenu.DropdownMenuItem
              onclick={() => handleExportAll('json')}
              disabled={exporting}
            >
              <FileJsonIcon class="mr-2 size-4" />
              <span>Export All as JSON</span>
            </DropdownMenu.DropdownMenuItem>
            <DropdownMenu.DropdownMenuItem
              onclick={() => handleExportAll('md')}
              disabled={exporting}
            >
              <CodeIcon class="mr-2 size-4" />
              <span>Export All as Markdown</span>
            </DropdownMenu.DropdownMenuItem>
            <DropdownMenu.DropdownMenuItem
              onclick={() => handleExportAll('zip')}
              disabled={exporting}
            >
              <PackageIcon class="mr-2 size-4" />
              <span>Export All as ZIP</span>
            </DropdownMenu.DropdownMenuItem>
          </DropdownMenu.DropdownMenuContent>
        </DropdownMenu.DropdownMenu>
        <Button size="sm" onclick={createNewChat} variant="default">
          <PlusIcon class="mr-1 size-4" />
          New Chat
        </Button>
      </div>
    </div>

    <!-- Search Input (press Enter to search) -->
    <div class="mb-2">
      <div class="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Search chats... (press Enter)"
          bind:value={searchQuery}
          onkeydown={handleSearchKeydown}
          class="h-8 flex-1"
        />
        <Button
          size="sm"
          onclick={() => (showFilterDialog = true)}
          variant={hasActiveFilters ? 'default' : 'outline'}
          class="h-8 px-3"
          title={hasActiveFilters ? 'Filters active - click to view' : 'Filter chats'}
        >
          <SlidersHorizontalIcon class="size-4" />
          {#if hasActiveFilters}
            <span class="ml-1.5 text-xs">Active</span>
          {/if}
        </Button>
      </div>
    </div>

    <!-- Inline Filters: Folder and Pinned -->
    <div class="flex items-center gap-2">
      <select
        value={selectedFolderId}
        onchange={(e) => {
          selectedFolderId = e.currentTarget.value;
          handleFolderChange();
        }}
        class="border-input bg-background focus:ring-ring flex-1 rounded-md border px-2 py-1.5 text-sm focus:ring-1 focus:outline-none"
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
                  matchingMessages={chat.matchingMessages}
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
                      matchingMessages={chat.matchingMessages}
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
                  matchingMessages={chat.matchingMessages}
                />
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </Sidebar.Content>
</div>

<!-- Filter Dialog -->
<Dialog.Root bind:open={showFilterDialog}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Advanced Filters</Dialog.Title>
      <Dialog.Description>Filter by AI provider, model, and date range</Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <!-- Provider Filter -->
      {#if availableProviders().length > 0}
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
              {#each availableProviders() as provider (provider)}
                {@const isSelected = selectedProviders.includes(provider)}
                <DropdownMenu.CheckboxItem
                  checked={isSelected}
                  onselect={() => {
                    if (isSelected) {
                      selectedProviders = selectedProviders.filter((p) => p !== provider);
                    } else {
                      selectedProviders = [...selectedProviders, provider];
                    }
                    handleProvidersChange();
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
                    handleProvidersChange();
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
      {#if availableModels().length > 0}
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
              {#each availableModels() as model (model.id)}
                {@const isSelected = selectedModelIds.includes(model.id)}
                <DropdownMenu.CheckboxItem
                  checked={isSelected}
                  onselect={() => {
                    if (isSelected) {
                      selectedModelIds = selectedModelIds.filter((id) => id !== model.id);
                    } else {
                      selectedModelIds = [...selectedModelIds, model.id];
                    }
                    handleModelsChange();
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
                    handleModelsChange();
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
                handleDateChange();
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
                handleDateChange();
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
          onclick={handleClearAllFilters}
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
