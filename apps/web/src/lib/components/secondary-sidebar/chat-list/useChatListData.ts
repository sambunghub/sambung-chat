import { goto } from '$app/navigation';
import { orpc } from '$lib/orpc';
import { exportAllChats, type ChatsByFolder } from '$lib/utils/chat-export';
import type { Chat, Folder } from './types.js';
import { groupChatsByFolder } from './utils/chat-grouping.js';

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

type Provider = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama' | 'custom';

export function useChatListData() {
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
  let selectedProviders = $state<Provider[]>([]);
  let selectedModelIds = $state<Array<string>>([]);
  let dateFrom = $state<string>('');
  let dateTo = $state<string>('');
  let collapsedFolders = $state<Record<string, boolean>>({});
  let isInitialLoad = $state(true);
  let renamingFolderId = $state<string | null>(null);
  let folderRenameValue = $state('');
  let exporting = $state(false);
  let exportFormat = $state<'json' | 'md' | 'zip' | 'zip-optimized' | null>(null);

  // Computed - filtered chats (API handles filtering, just return chats)
  let filteredChats = $derived(() => chats);

  // Computed - unique providers from user's models
  let availableProviders = $derived(() => {
    const providerSet = new Set(models.map((m) => m.provider));
    return Array.from(providerSet).sort() as Provider[];
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

  // Computed - check if advanced filters are active
  let hasActiveFilters = $derived(
    !isInitialLoad &&
      (selectedProviders.length > 0 ||
        selectedModelIds.length > 0 ||
        dateFrom !== '' ||
        dateTo !== '')
  );

  // Computed - check if any filters are active
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

  // Group chats by folder and pinned status
  let groupedChats = $derived(() => groupChatsByFolder(filteredChats(), folders));

  // Load chats with search & filters
  async function loadChats() {
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

  // Handle search on Enter key
  function handleSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      loadChats();
    }
  }

  // Handle chat selection
  async function selectChat(chatId: string) {
    await goto(`/app/chat/${chatId}`);
  }

  // Handle new chat
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
      chats = chats.filter((c) => c.id !== chatId);
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  }

  // Handle chat rename
  async function renameChat(chatId: string, newTitle: string) {
    try {
      await orpc.chat.update({ id: chatId, title: newTitle });
      chats = chats.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c));
    } catch (err) {
      console.error('Failed to rename chat:', err);
    }
  }

  // Handle pin toggle
  async function togglePin(chatId: string) {
    try {
      const updated = await orpc.chat.togglePin({ id: chatId });
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
      const newFolder = await orpc.folder.create({
        name: folderName.trim(),
      });

      await orpc.chat.updateFolder({ id: chatId, folderId: newFolder.id });

      chats = chats.map((c) => (c.id === chatId ? { ...c, folderId: newFolder.id } : c));

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
      await orpc.folder.delete({ id: folderId });
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
      const chatsByFolder = await orpc.chat.getChatsByFolder();

      if (format === 'zip') {
        exportFormat = 'zip-optimized';
      } else {
        exportFormat = format;
      }

      const result = await exportAllChats(chatsByFolder as ChatsByFolder, exportFormat, {
        onProgress: () => {},
        onError: (chat, error) => {
          console.warn(`Failed to export chat "${chat.title}":`, error);
          return true;
        },
      });

      if (result.success) {
        alert(`Successfully exported ${result.exported} chat(s)!`);
      } else {
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

  // Filter change handlers
  function handleSearchChange(query: string) {
    searchQuery = query;
  }

  function handleFolderSelect(folderId: string) {
    selectedFolderId = folderId;
    if (!isInitialLoad) {
      loadChats();
    }
  }

  function handlePinnedToggle(checked: boolean) {
    showPinnedOnly = checked;
    if (!isInitialLoad) {
      loadChats();
    }
  }

  function handleProvidersChange() {
    if (!isInitialLoad) {
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

  return {
    // State
    chats,
    folders,
    models,
    loading,
    searching,
    error,
    searchQuery,
    selectedFolderId,
    showPinnedOnly,
    selectedProviders,
    selectedModelIds,
    dateFrom,
    dateTo,
    collapsedFolders,
    renamingFolderId,
    folderRenameValue,
    exporting,
    exportFormat,
    isInitialLoad,

    // Derived
    filteredChats,
    availableProviders,
    availableModels,
    hasActiveFilters,
    hasAnyFilters,
    groupedChats,

    // Methods - Data Fetching
    loadChats,
    loadFolders,
    loadModels,

    // Methods - Chat Operations
    selectChat,
    createNewChat,
    deleteChat,
    renameChat,
    togglePin,

    // Methods - Folder Operations
    createFolder,
    moveChatToFolder,
    toggleFolder,
    startFolderRename,
    saveFolderRename,
    cancelFolderRename,
    handleFolderKeydown,
    deleteFolder,

    // Methods - Export
    handleExportAll,

    // Methods - Filter Operations
    handleSearchChange,
    handleSearchKeydown,
    handleFolderSelect,
    handlePinnedToggle,
    handleProvidersChange,
    handleModelsChange,
    handleDateChange,
    handleClearAllFilters,
  };
}
