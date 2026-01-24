<script lang="ts">
  import { goto } from '$app/navigation';
  import { orpc } from '$lib/orpc';
  import { onMount } from 'svelte';
  import ChatListItem from './ChatListItem.svelte';
  import ChatEmptyState from './ChatEmptyState.svelte';
  import ChatListHeader from './chat-list/ChatListHeader.svelte';
  import ChatListFilters from './chat-list/ChatListFilters.svelte';
  import ChatListLoadingState from './chat-list/ChatListLoadingState.svelte';
  import ChatListErrorState from './chat-list/ChatListErrorState.svelte';
  import PinnedChatsSection from './chat-list/PinnedChatsSection.svelte';
  import FolderChatsSection from './chat-list/FolderChatsSection.svelte';
  import NoFolderChatsSection from './chat-list/NoFolderChatsSection.svelte';
  import { groupChatsByFolder } from './chat-list/utils/chat-grouping.js';
  import type { Chat, Folder } from './chat-list/types.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { autofocus } from '$lib/actions/autofocus.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { exportAllChats, type ChatsByFolder } from '$lib/utils/chat-export';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

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

  // Group chats by folder and pinned status using pure utility function
  let groupedChats = $derived(() => groupChatsByFolder(filteredChats(), folders));

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

  // Handler wrappers for ChatListFilters component
  function handleSearchChange(query: string) {
    searchQuery = query;
  }

  function handleFolderSelect(folderId: string) {
    selectedFolderId = folderId;
    handleFolderChange();
  }

  function handlePinnedToggle(checked: boolean) {
    showPinnedOnly = checked;
    handlePinnedChange();
  }

  function handleOpenAdvancedFilters() {
    showFilterDialog = true;
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
      chats = result || [];
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
      folders = (result as Folder[]) || [];
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  }

  // Load models
  async function loadModels() {
    try {
      const result = await orpc.model.getAll();
      models = (result as Model[]) || [];
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

  // Handle folder rename
  function startFolderRename(folderId: string, folderName: string) {
    renamingFolderId = folderId;
    folderRenameValue = folderName;
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
    <ChatListHeader
      title="Chats"
      {exporting}
      onCreateNewChat={createNewChat}
      onExportAll={handleExportAll}
    />

    <ChatListFilters
      {searchQuery}
      {folders}
      selectedFolderId={selectedFolderId}
      showPinnedOnly={showPinnedOnly}
      hasActiveFilters={hasActiveFilters}
      onSearchChange={handleSearchChange}
      onSearchKeydown={handleSearchKeydown}
      onFolderChange={handleFolderSelect}
      onPinnedChange={handlePinnedToggle}
      onOpenAdvancedFilters={handleOpenAdvancedFilters}
    />
  </Sidebar.Header>

  <!-- Content -->
  <Sidebar.Content class="flex-1 overflow-hidden">
    {#if error}
      <ChatListErrorState {error} onRetry={loadChats} />
    {:else if loading || searching}
      <ChatListLoadingState {loading} {searching} />
    {:else if chats.length === 0}
      <ChatEmptyState onNewChat={createNewChat} />
    {:else}
      <div class="h-full max-h-[50vh] overflow-y-auto">
        <div class="px-2">
          <PinnedChatsSection
            pinnedChats={groupedChats().pinnedChats}
            {currentChatId}
            {searchQuery}
            {folders}
            onSelectChat={selectChat}
            onDeleteChat={deleteChat}
            onRenameChat={renameChat}
            onTogglePin={togglePin}
            onMoveToFolder={moveChatToFolder}
            onCreateFolder={createFolder}
          />

          <FolderChatsSection
            folderGroups={groupedChats().folderGroups}
            {currentChatId}
            {searchQuery}
            {folders}
            collapsedFolders={collapsedFolders}
            renamingFolderId={renamingFolderId}
            folderRenameValue={folderRenameValue}
            onSelectChat={selectChat}
            onDeleteChat={deleteChat}
            onRenameChat={renameChat}
            onTogglePin={togglePin}
            onMoveToFolder={moveChatToFolder}
            onCreateFolder={createFolder}
            onToggleFolder={toggleFolder}
            onStartFolderRename={startFolderRename}
            onSaveFolderRename={saveFolderRename}
            onCancelFolderRename={cancelFolderRename}
            onDeleteFolder={deleteFolder}
            onFolderKeydown={handleFolderKeydown}
            onFolderRenameValueChange={(value) => {
              folderRenameValue = value;
            }}
          />

          <NoFolderChatsSection
            noFolderChats={groupedChats().noFolderChats}
            {currentChatId}
            {searchQuery}
            {folders}
            onSelectChat={selectChat}
            onDeleteChat={deleteChat}
            onRenameChat={renameChat}
            onTogglePin={togglePin}
            onMoveToFolder={moveChatToFolder}
            onCreateFolder={createFolder}
          />
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
