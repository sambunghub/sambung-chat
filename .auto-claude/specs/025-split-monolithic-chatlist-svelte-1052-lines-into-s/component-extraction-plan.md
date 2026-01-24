# Component Extraction Plan: ChatList.svelte Refactoring

**Created:** 2026-01-24
**Status:** Planning Phase
**Current ChatList.svelte Size:** 1031 lines
**Target Size:** ~100-150 lines (orchestration only)

---

## Executive Summary

This document defines the component boundaries and data flow patterns for refactoring the monolithic ChatList.svelte (1031 lines) into focused, reusable components following Single Responsibility Principle.

**Key Goals:**
- Reduce ChatList.svelte from 1031 to ~100-150 lines
- Extract 8 focused components and 1 composable
- Maintain 100% feature parity
- Follow Svelte 5 runes pattern ($state, $props, $derived)
- Match existing patterns (FolderList/FolderListItem)

---

## Current State Analysis

### Responsibilities in ChatList.svelte (Lines 1-1031)

| Category | Lines | Description |
|----------|-------|-------------|
| **State Management** | ~100 | chats, folders, models, loading, searching, error, filters (7 states) |
| **Data Fetching** | ~150 | loadChats, loadFolders, loadModels, orpc.chat.search |
| **Chat Operations** | ~120 | selectChat, createNewChat, deleteChat, renameChat, togglePin |
| **Folder Operations** | ~180 | createFolder, moveChatToFolder, rename, delete, collapse state |
| **Export Operations** | ~80 | handleExportAll, exporting state, format selection |
| **Derived Data** | ~50 | groupedChats, filteredChats, availableProviders, hasActiveFilters |
| **UI Rendering** | ~270 | Header, search, filters, chat groups, dialogs |
| **Filter Dialog** | ~165 | Advanced filters (providers, models, dates) |

### Code Patterns Observed

**Existing Pattern (FolderList.svelte → FolderListItem.svelte):**
```typescript
// Container Component (FolderList)
- Manages state: folders, loading, error
- Data fetching: loadFolders()
- CRUD operations: create, delete, rename
- Passes data + callbacks to children

// Presentational Component (FolderListItem)
- Props: folder, onDelete, onRename
- Local UI state only: isRenaming, showActions
- Renders UI, emits events
```

**ChatList.svelte Should Follow Same Pattern:**
```typescript
// Container Component (ChatList)
- Manage state: chats, folders, filters
- Data fetching: useChatListData composable
- Pass data + callbacks to children

// Presentational Components
- ChatListHeader, ChatListFilters, PinnedChatsSection, etc.
- Receive data + callbacks via props
- Local UI state only
```

---

## Proposed Component Architecture

### Architecture Overview

```
ChatList.svelte (Orchestration Layer - ~150 lines)
│
├─ useChatListData.ts (Data Layer - ~300 lines)
│  ├─ State: chats, folders, models, loading, error, filters
│  ├─ Methods: loadChats, loadFolders, selectChat, deleteChat, etc.
│  └─ Derived: groupedChats, filteredChats
│
├─ ChatListHeader.svelte (UI Component - ~50 lines)
│  └─ Props: title, onToggleCollapse, onCreateNewChat, onExportAll
│
├─ ChatListFilters.svelte (UI Component - ~80 lines)
│  └─ Props: searchQuery, folders, selectedFolderId, showPinnedOnly
│        onSearchChange, onFolderChange, onPinnedChange, onSearchKeydown
│        onOpenAdvancedFilters, hasActiveFilters
│
├─ ChatListFilterDialog.svelte (UI Component - ~200 lines)
│  └─ Props: show, providers, models, selectedProviders, selectedModelIds
│        dateFrom, dateTo, onProvidersChange, onModelsChange, onDateChange
│        onClearAll, hasAnyFilters
│
├─ PinnedChatsSection.svelte (UI Component - ~40 lines)
│  └─ Props: pinnedChats, currentChatId, searchQuery, folders
│        onSelectChat, onDeleteChat, onRenameChat, onTogglePin
│        onMoveToFolder, onCreateFolder
│
├─ FolderChatsSection.svelte (UI Component - ~120 lines)
│  └─ Props: folderGroups, currentChatId, searchQuery, folders
│        collapsedFolders, onSelectChat, onDeleteChat, onRenameChat
│        onTogglePin, onMoveToFolder, onCreateFolder, onToggleFolder
│        onStartFolderRename, onSaveFolderRename, onCancelFolderRename
│        onDeleteFolder, renamingFolderId, folderRenameValue, onFolderKeydown
│
├─ FolderItem.svelte (UI Component - ~100 lines)
│  └─ Props: folder, folderChats, isCollapsed, isRenaming, renameValue
│        currentChatId, searchQuery, folders, onToggle, onStartRename
│        onSaveRename, onCancelRename, onDelete, onFolderKeydown
│        onSelectChat, onDeleteChat, onRenameChat, onTogglePin
│        onMoveToFolder, onCreateFolder
│
├─ NoFolderChatsSection.svelte (UI Component - ~40 lines)
│  └─ Props: noFolderChats, currentChatId, searchQuery, folders
│        onSelectChat, onDeleteChat, onRenameChat, onTogglePin
│        onMoveToFolder, onCreateFolder
│
├─ ChatListLoadingState.svelte (UI Component - ~20 lines)
│  └─ Props: loading, searching
│
└─ ChatListErrorState.svelte (UI Component - ~30 lines)
   └─ Props: error, onRetry
```

---

## Component Details

### 1. useChatListData.ts (Data Layer Composable)

**Purpose:** Centralize all data fetching, state management, and business logic.

**Location:** `apps/web/src/lib/components/secondary-sidebar/chat-list/useChatListData.ts`

**Responsibilities:**
- Data fetching (chats, folders, models)
- State management (filter states, loading, error)
- CRUD operations (chat CRUD, folder CRUD)
- Export operations
- Derived computations (groupedChats, filteredChats)

**Interface:**
```typescript
interface UseChatListDataReturn {
  // State
  chats: Chat[]
  folders: Folder[]
  models: Model[]
  loading: boolean
  searching: boolean
  error: string | null
  searchQuery: string
  selectedFolderId: string
  showPinnedOnly: boolean
  selectedProviders: Array<Provider>
  selectedModelIds: string[]
  dateFrom: string
  dateTo: string
  collapsedFolders: Record<string, boolean>
  isInitialLoad: boolean
  renamingFolderId: string | null
  folderRenameValue: string
  exporting: boolean
  exportFormat: 'json' | 'md' | 'zip' | 'zip-optimized' | null

  // Derived
  filteredChats: Chat[]
  availableProviders: Provider[]
  availableModels: Model[]
  hasActiveFilters: boolean
  hasAnyFilters: boolean

  // Methods - Data Fetching
  loadChats(): Promise<void>
  loadFolders(): Promise<void>
  loadModels(): Promise<void>

  // Methods - Chat Operations
  selectChat(chatId: string): Promise<void>
  createNewChat(): Promise<void>
  deleteChat(chatId: string): Promise<void>
  renameChat(chatId: string, newTitle: string): Promise<void>
  togglePin(chatId: string): Promise<void>

  // Methods - Folder Operations
  createFolder(chatId: string): Promise<void>
  moveChatToFolder(chatId: string, folderId: string | null): Promise<void>
  renameFolder(folderId: string, newName: string): Promise<void>
  deleteFolder(folderId: string, folderName: string): Promise<void>
  toggleFolder(folderId: string): void
  isFolderCollapsed(folderId: string): boolean
  startFolderRename(folderId: string, folderName: string): void
  saveFolderRename(): Promise<void>
  cancelFolderRename(): void

  // Methods - Filter Operations
  handleSearchKeydown(e: KeyboardEvent): void
  handleFolderChange(): void
  handlePinnedChange(): void
  handleProvidersChange(): void
  handleModelsChange(): void
  handleDateChange(): void
  handleClearAllFilters(): void

  // Methods - Export Operations
  handleExportAll(format: 'json' | 'md' | 'zip'): Promise<void>
}

export function useChatListData(): UseChatListDataReturn
```

**Implementation Notes:**
- Use Svelte 5 runes ($state, $derived)
- All async operations must have error handling
- Optimistic updates for local state
- Call orpc methods for backend operations
- Return interface (not object) for better type inference

---

### 2. ChatListHeader.svelte

**Purpose:** Render header with title, export dropdown, and new chat button.

**Location:** `apps/web/src/lib/components/secondary-sidebar/chat-list/ChatListHeader.svelte`

**Props Interface:**
```typescript
interface Props {
  title: string
  exporting: boolean
  onCreateNewChat: () => void
  onExportAll: (format: 'json' | 'md' | 'zip') => void
}
```

**Template Structure:**
```svelte
<Sidebar.Header class="border-b p-4">
  <div class="mb-3 flex items-center justify-between">
    <h2 class="text-lg font-semibold">{title}</h2>
    <div class="flex gap-2">
      <!-- Export Dropdown -->
      <DropdownMenu.Root>
        <DropdownMenu.Trigger disabled={exporting}>
          <DownloadIcon />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item onclick={() => onExportAll('json')}>
            Export All as JSON
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => onExportAll('md')}>
            Export All as Markdown
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => onExportAll('zip')}>
            Export All as ZIP
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <!-- New Chat Button -->
      <Button onclick={onCreateNewChat}>
        <PlusIcon /> New Chat
      </Button>
    </div>
  </div>
</Sidebar.Header>
```

**State:** None (pure presentational)

**Size:** ~50 lines

---

### 3. ChatListFilters.svelte

**Purpose:** Render search input and inline filters (folder dropdown, pinned checkbox).

**Location:** `apps/web/src/lib/components/secondary-sidebar/chat-list/ChatListFilters.svelte`

**Props Interface:**
```typescript
interface Props {
  searchQuery: string
  folders: Folder[]
  selectedFolderId: string
  showPinnedOnly: boolean
  hasActiveFilters: boolean
  onSearchChange: (query: string) => void
  onSearchKeydown: (e: KeyboardEvent) => void
  onFolderChange: (folderId: string) => void
  onPinnedChange: (checked: boolean) => void
  onOpenAdvancedFilters: () => void
}
```

**Template Structure:**
```svelte
<div class="p-4 pt-0 space-y-2">
  <!-- Search Input -->
  <div class="flex items-center gap-2">
    <Input
      type="text"
      placeholder="Search chats... (press Enter)"
      value={searchQuery}
      oninput={(e) => onSearchChange(e.currentTarget.value)}
      onkeydown={onSearchKeydown}
      class="h-8 flex-1"
    />
    <Button
      onclick={onOpenAdvancedFilters}
      variant={hasActiveFilters ? 'default' : 'outline'}
      class="h-8 px-3"
    >
      <SlidersHorizontalIcon />
      {#if hasActiveFilters}
        <span class="ml-1.5 text-xs">Active</span>
      {/if}
    </Button>
  </div>

  <!-- Inline Filters -->
  <div class="flex items-center gap-2">
    <select
      value={selectedFolderId}
      onchange={(e) => onFolderChange(e.currentTarget.value)}
      class="flex-1 rounded border px-2 py-1.5 text-sm"
    >
      <option value="">All Folders</option>
      {#each folders as folder}
        <option value={folder.id}>{folder.name}</option>
      {/each}
    </select>
    <label class="flex items-center gap-1.5 text-xs">
      <input
        type="checkbox"
        checked={showPinnedOnly}
        onchange={(e) => onPinnedChange(e.currentTarget.checked)}
        class="rounded border px-1 py-0.5 text-sm"
      />
      Pinned only
    </label>
  </div>
</div>
```

**State:** None (pure presentational)

**Size:** ~80 lines

---

### 4. ChatListFilterDialog.svelte

**Purpose:** Render advanced filter dialog (providers, models, date range).

**Location:** `apps/web/src/lib/components/secondary-sidebar/chat-list/ChatListFilterDialog.svelte`

**Props Interface:**
```typescript
interface Props {
  show: boolean
  folders: Folder[]
  models: Model[]
  selectedProviders: Array<Provider>
  selectedModelIds: string[]
  dateFrom: string
  dateTo: string
  hasAnyFilters: boolean
  onProvidersChange: (providers: Array<Provider>) => void
  onModelsChange: (modelIds: string[]) => void
  onDateChange: (dateFrom: string, dateTo: string) => void
  onClearAll: () => void
  onClose: () => void
}
```

**State:**
- `providerOpen: boolean` (local dropdown state)
- `modelOpen: boolean` (local dropdown state)

**Size:** ~200 lines

**Implementation:** Extract lines 866-1029 from ChatList.svelte

---

### 5. PinnedChatsSection.svelte

**Purpose:** Render pinned chats section with header and chat list.

**Location:** `apps/web/src/lib/components/secondary-sidebar/chat-list/PinnedChatsSection.svelte`

**Props Interface:**
```typescript
interface Props {
  pinnedChats: Chat[]
  currentChatId: string | undefined
  searchQuery: string
  folders: Folder[]
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onRenameChat: (chatId: string, newTitle: string) => void
  onTogglePin: (chatId: string) => void
  onMoveToFolder: (chatId: string, folderId: string | null) => void
  onCreateFolder: (chatId: string) => void
}
```

**Template Structure:**
```svelte
{#if pinnedChats.length > 0}
  <div class="mb-4">
    <h3 class="text-muted-foreground mb-2 flex items-center gap-1.5 px-2 text-xs font-semibold uppercase">
      Pinned
    </h3>
    {#each pinnedChats as chat (chat.id)}
      <ChatListItem
        {chat}
        {folders}
        isActive={currentChatId === chat.id}
        onSelect={() => onSelectChat(chat.id)}
        onDelete={() => onDeleteChat(chat.id)}
        onRename={(newTitle) => onRenameChat(chat.id, newTitle)}
        onTogglePin={() => onTogglePin(chat.id)}
        onMoveToFolder={(folderId) => onMoveToFolder(chat.id, folderId)}
        onCreateFolder={() => onCreateFolder(chat.id)}
        {searchQuery}
        matchingMessages={chat.matchingMessages}
      />
    {/each}
  </div>
{/if}
```

**State:** None (pure presentational)

**Size:** ~40 lines

---

### 6. FolderChatsSection.svelte

**Purpose:** Render folder groups with collapsible folders and chat lists.

**Location:** `apps/web/src/lib/components/secondary-sidebar/chat-list/FolderChatsSection.svelte`

**Props Interface:**
```typescript
interface Props {
  folderGroups: Array<{ folder: Folder; chats: Chat[] }>
  currentChatId: string | undefined
  searchQuery: string
  folders: Folder[]
  collapsedFolders: Record<string, boolean>
  renamingFolderId: string | null
  folderRenameValue: string
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onRenameChat: (chatId: string, newTitle: string) => void
  onTogglePin: (chatId: string) => void
  onMoveToFolder: (chatId: string, folderId: string | null) => void
  onCreateFolder: (chatId: string) => void
  onToggleFolder: (folderId: string) => void
  onStartFolderRename: (folderId: string, folderName: string) => void
  onSaveFolderRename: () => Promise<void>
  onCancelFolderRename: () => void
  onDeleteFolder: (folderId: string, folderName: string) => void
  onFolderKeydown: (e: KeyboardEvent) => void
}
```

**Template Structure:**
```svelte
{#each folderGroups as { folder, chats: folderChats } (folder.id)}
  {#if folderChats.length > 0}
    <FolderItem
      {folder}
      folderChats={folderChats}
      isCollapsed={collapsedFolders[folder.id] ?? true}
      isRenaming={renamingFolderId === folder.id}
      renameValue={folderRenameValue}
      {currentChatId}
      {searchQuery}
      {folders}
      onToggle={() => onToggleFolder(folder.id)}
      onStartRename={() => onStartFolderRename(folder.id, folder.name)}
      onSaveRename={onSaveFolderRename}
      onCancelRename={onCancelFolderRename}
      onDelete={() => onDeleteFolder(folder.id, folder.name)}
      onFolderKeydown={onFolderKeydown}
      onSelectChat={onSelectChat}
      onDeleteChat={onDeleteChat}
      onRenameChat={onRenameChat}
      onTogglePin={onTogglePin}
      onMoveToFolder={onMoveToFolder}
      onCreateFolder={onCreateFolder}
    />
  {/if}
{/each}
```

**State:** None (delegates to FolderItem)

**Size:** ~30 lines

---

### 7. FolderItem.svelte

**Purpose:** Render individual folder with collapsible header, rename UI, and chat list.

**Location:** `apps/web/src/lib/components/secondary-sidebar/chat-list/FolderItem.svelte`

**Props Interface:**
```typescript
interface Props {
  folder: Folder
  folderChats: Chat[]
  isCollapsed: boolean
  isRenaming: boolean
  renameValue: string
  currentChatId: string | undefined
  searchQuery: string
  folders: Folder[]
  onToggle: () => void
  onStartRename: () => void
  onSaveRename: () => Promise<void>
  onCancelRename: () => void
  onDelete: () => void
  onFolderKeydown: (e: KeyboardEvent) => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onRenameChat: (chatId: string, newTitle: string) => void
  onTogglePin: (chatId: string) => void
  onMoveToFolder: (chatId: string, folderId: string | null) => void
  onCreateFolder: (chatId: string) => void
}
```

**Template Structure:**
```svelte
<div class="mb-3">
  <!-- Folder Header -->
  <div class="group/folder relative">
    {#if isRenaming}
      <!-- Rename Input -->
      <input
        type="text"
        class="w-full rounded border px-2 py-1 text-xs font-semibold uppercase"
        value={renameValue}
        oninput={(e) => renameValue = e.currentTarget.value}
        onkeydown={onFolderKeydown}
        onblur={onSaveRename}
        use:autofocus
      />
    {:else}
      <!-- Folder Display -->
      <div
        role="button"
        onclick={onToggle}
        class="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold uppercase"
      >
        {#if isCollapsed}
          <ChevronRightIcon />
        {:else}
          <ChevronDownIcon />
        {/if}
        <FolderIcon />
        <span class="flex-1">{folder.name}</span>

        <!-- Folder Actions -->
        <span class="flex gap-0.5 opacity-0 group-hover/folder:opacity-100">
          <button onclick={onStartRename}>
            <PencilIcon />
          </button>
          <button onclick={onDelete}>
            <Trash2Icon />
          </button>
        </span>

        <span class="text-xs">{folderChats.length}</span>
      </div>
    {/if}
  </div>

  <!-- Folder Chats -->
  {#if !isCollapsed}
    {#each folderChats as chat (chat.id)}
      <ChatListItem
        {chat}
        {folders}
        isActive={currentChatId === chat.id}
        onSelect={() => onSelectChat(chat.id)}
        onDelete={() => onDeleteChat(chat.id)}
        onRename={(newTitle) => onRenameChat(chat.id, newTitle)}
        onTogglePin={() => onTogglePin(chat.id)}
        onMoveToFolder={(folderId) => onMoveToFolder(chat.id, folderId)}
        onCreateFolder={() => onCreateFolder(chat.id)}
        {searchQuery}
        matchingMessages={chat.matchingMessages}
      />
    {/each}
  {/if}
</div>
```

**State:**
- `localRenameValue: string` (local binding for rename input)

**Size:** ~100 lines

---

### 8. NoFolderChatsSection.svelte

**Purpose:** Render chats without folder section.

**Location:** `apps/web/src/lib/components/secondary-sidebar/chat-list/NoFolderChatsSection.svelte`

**Props Interface:**
```typescript
interface Props {
  noFolderChats: Chat[]
  currentChatId: string | undefined
  searchQuery: string
  folders: Folder[]
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onRenameChat: (chatId: string, newTitle: string) => void
  onTogglePin: (chatId: string) => void
  onMoveToFolder: (chatId: string, folderId: string | null) => void
  onCreateFolder: (chatId: string) => void
}
```

**Template Structure:**
```svelte
{#if noFolderChats.length > 0}
  <div class="mb-4">
    <h3 class="text-muted-foreground mb-2 flex items-center gap-1.5 px-2 text-xs font-semibold uppercase">
      No Folder
    </h3>
    {#each noFolderChats as chat (chat.id)}
      <ChatListItem
        {chat}
        {folders}
        isActive={currentChatId === chat.id}
        onSelect={() => onSelectChat(chat.id)}
        onDelete={() => onDeleteChat(chat.id)}
        onRename={(newTitle) => onRenameChat(chat.id, newTitle)}
        onTogglePin={() => onTogglePin(chat.id)}
        onMoveToFolder={(folderId) => onMoveToFolder(chat.id, folderId)}
        onCreateFolder={() => onCreateFolder(chat.id)}
        {searchQuery}
        matchingMessages={chat.matchingMessages}
      />
    {/each}
  </div>
{/if}
```

**State:** None (pure presentational)

**Size:** ~40 lines

---

### 9. ChatListLoadingState.svelte

**Purpose:** Render loading/searching indicator.

**Location:** `apps/web/src/lib/components/secondary-sidebar/chat-list/ChatListLoadingState.svelte`

**Props Interface:**
```typescript
interface Props {
  loading: boolean
  searching: boolean
}
```

**Template:**
```svelte
<div class="text-muted-foreground flex items-center justify-center p-8 text-sm">
  {loading ? 'Loading chats...' : 'Searching...'}
</div>
```

**State:** None

**Size:** ~10 lines

---

### 10. ChatListErrorState.svelte

**Purpose:** Render error display with retry button.

**Location:** `apps/web/src/lib/components/secondary-sidebar/chat-list/ChatListErrorState.svelte`

**Props Interface:**
```typescript
interface Props {
  error: string | null
  onRetry: () => void
}
```

**Template:**
```svelte
<div class="flex flex-col items-center gap-3 p-4 text-center">
  <div class="text-destructive text-sm">
    <svg class="mx-auto mb-2 size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <p class="font-medium">Failed to load chats</p>
    <p class="text-muted-foreground mt-1">{error}</p>
  </div>
  <Button size="sm" onclick={onRetry} variant="outline">
    <svg class="mr-1 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
    Retry
  </Button>
</div>
```

**State:** None

**Size:** ~30 lines

---

### 11. ChatList.svelte (Refactored)

**Purpose:** Orchestration component - compose child components and manage data flow.

**Location:** `apps/web/src/lib/components/secondary-sidebar/ChatList.svelte`

**Responsibilities:**
- Import useChatListData composable
- Compose child components
- Pass data and callbacks as props
- Handle conditional rendering (loading, error, empty)

**Template Structure:**
```svelte
<script lang="ts">
  import { useChatListData } from './chat-list/useChatListData';
  import ChatListHeader from './chat-list/ChatListHeader.svelte';
  import ChatListFilters from './chat-list/ChatListFilters.svelte';
  import ChatListFilterDialog from './chat-list/ChatListFilterDialog.svelte';
  import PinnedChatsSection from './chat-list/PinnedChatsSection.svelte';
  import FolderChatsSection from './chat-list/FolderChatsSection.svelte';
  import NoFolderChatsSection from './chat-list/NoFolderChatsSection.svelte';
  import ChatListLoadingState from './chat-list/ChatListLoadingState.svelte';
  import ChatListErrorState from './chat-list/ChatListErrorState.svelte';
  import ChatEmptyState from './ChatEmptyState.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';

  interface Props {
    currentChatId?: string;
  }

  let { currentChatId }: Props = $props();

  // Use composable for all data management
  const data = useChatListData();

  // Local UI state only
  let showFilterDialog = $state(false);

  // Filter dialog state
  function handleOpenFilterDialog() {
    showFilterDialog = true;
  }

  function handleCloseFilterDialog() {
    showFilterDialog = false;
  }
</script>

<div class="flex h-full flex-col">
  <!-- Header -->
  <ChatListHeader
    title="Chats"
    exporting={data.exporting}
    onCreateNewChat={data.createNewChat}
    onExportAll={data.handleExportAll}
  />

  <!-- Filters -->
  <ChatListFilters
    searchQuery={data.searchQuery}
    folders={data.folders}
    selectedFolderId={data.selectedFolderId}
    showPinnedOnly={data.showPinnedOnly}
    hasActiveFilters={data.hasActiveFilters}
    onSearchChange={(query) => data.searchQuery = query}
    onSearchKeydown={data.handleSearchKeydown}
    onFolderChange={(id) => {
      data.selectedFolderId = id;
      data.handleFolderChange();
    }}
    onPinnedChange={(checked) => {
      data.showPinnedOnly = checked;
      data.handlePinnedChange();
    }}
    onOpenAdvancedFilters={handleOpenFilterDialog}
  />

  <!-- Content -->
  <Sidebar.Content class="flex-1 overflow-hidden">
    {#if data.error}
      <ChatListErrorState
        error={data.error}
        onRetry={data.loadChats}
      />
    {:else if data.loading || data.searching}
      <ChatListLoadingState
        loading={data.loading}
        searching={data.searching}
      />
    {:else if data.chats.length === 0}
      <ChatEmptyState onNewChat={data.createNewChat} />
    {:else}
      <div class="h-full max-h-[50vh] overflow-y-auto">
        <div class="px-2">
          <!-- Pinned Section -->
          <PinnedChatsSection
            pinnedChats={data.groupedChats().pinnedChats}
            {currentChatId}
            searchQuery={data.searchQuery}
            folders={data.folders}
            onSelectChat={data.selectChat}
            onDeleteChat={data.deleteChat}
            onRenameChat={data.renameChat}
            onTogglePin={data.togglePin}
            onMoveToFolder={data.moveChatToFolder}
            onCreateFolder={data.createFolder}
          />

          <!-- Folders Section -->
          <FolderChatsSection
            folderGroups={data.groupedChats().folderGroups}
            {currentChatId}
            searchQuery={data.searchQuery}
            folders={data.folders}
            collapsedFolders={data.collapsedFolders}
            renamingFolderId={data.renamingFolderId}
            folderRenameValue={data.folderRenameValue}
            onSelectChat={data.selectChat}
            onDeleteChat={data.deleteChat}
            onRenameChat={data.renameChat}
            onTogglePin={data.togglePin}
            onMoveToFolder={data.moveChatToFolder}
            onCreateFolder={data.createFolder}
            onToggleFolder={data.toggleFolder}
            onStartFolderRename={data.startFolderRename}
            onSaveFolderRename={data.saveFolderRename}
            onCancelFolderRename={data.cancelFolderRename}
            onDeleteFolder={data.deleteFolder}
            onFolderKeydown={data.handleFolderKeydown}
          />

          <!-- No Folder Section -->
          <NoFolderChatsSection
            noFolderChats={data.groupedChats().noFolderChats}
            {currentChatId}
            searchQuery={data.searchQuery}
            folders={data.folders}
            onSelectChat={data.selectChat}
            onDeleteChat={data.deleteChat}
            onRenameChat={data.renameChat}
            onTogglePin={data.togglePin}
            onMoveToFolder={data.moveChatToFolder}
            onCreateFolder={data.createFolder}
          />
        </div>
      </div>
    {/if}
  </Sidebar.Content>
</div>

<!-- Filter Dialog -->
<ChatListFilterDialog
  show={showFilterDialog}
  folders={data.folders}
  models={data.models}
  selectedProviders={data.selectedProviders}
  selectedModelIds={data.selectedModelIds}
  dateFrom={data.dateFrom}
  dateTo={data.dateTo}
  hasAnyFilters={data.hasAnyFilters}
  onProvidersChange={(providers) => {
    data.selectedProviders = providers;
    data.handleProvidersChange();
  }}
  onModelsChange={(ids) => {
    data.selectedModelIds = ids;
    data.handleModelsChange();
  }}
  onDateChange={(from, to) => {
    data.dateFrom = from;
    data.dateTo = to;
    data.handleDateChange();
  }}
  onClearAll={data.handleClearAllFilters}
  onClose={handleCloseFilterDialog}
/>
```

**State:**
- `showFilterDialog: boolean` (local UI state only)

**Size:** ~150 lines (down from 1031 lines)

---

## Data Flow Patterns

### Pattern 1: Container-Presentational (Smart-Dumb)

**Container Components (Smart):**
- ChatList.svelte (orchestration)
- useChatListData.ts (data layer)

**Presentational Components (Dumb):**
- ChatListHeader, ChatListFilters, PinnedChatsSection, etc.

**Data Flow:**
```
┌─────────────────────────────────────────────────────────┐
│ ChatList.svelte (Orchestration)                        │
│                                                         │
│  const data = useChatListData()  ← All state & logic   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Presentational Components (Pure UI)               │ │
│  │                                                   │ │
│  │  <ChatListHeader                                   │ │
│  │    onCreateNewChat={data.createNewChat}     ← Pass │ │
│  │  />                                                │ │
│  │                                                   │ │
│  │  <ChatListFilters                                  │ │
│  │    searchQuery={data.searchQuery}        ← Pass    │ │
│  │    onSearchChange={(q) => data.searchQuery = q}   │ │
│  │  />                                                │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         │
         │ Events flow up (callbacks)
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ useChatListData.ts (Data Layer)                        │
│                                                         │
│  - Manages all state ($state)                          │
│  - Fetches data (orpc calls)                           │
│  - Business logic (CRUD operations)                    │
│  - Derived computations ($derived)                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Pattern 2: Props Down, Events Up

**Props Down (Data Flow Parent → Child):**
```typescript
// Parent passes data to child
<PinnedChatsSection
  pinnedChats={data.groupedChats().pinnedChats}  ← Data down
  currentChatId={currentChatId}                    ← Data down
  onSelectChat={data.selectChat}                   ← Callback down
/>
```

**Events Up (User Interaction → Child → Parent → Data Layer):**
```typescript
// User clicks chat in child
<ChatListItem
  onSelect={() => onSelectChat(chat.id)}  // Callback defined in parent
/>

// Parent handler
onSelectChat={data.selectChat}  // Calls composable method

// Composable executes
async function selectChat(chatId: string) {
  await goto(`/app/chat/${chatId}`);
}
```

### Pattern 3: State Lifting

**Local UI State (Keep in Component):**
- Dropdown open/close states
- Hover states
- Focus states
- Temporary input values

**Shared State (Lift to Composable):**
- chats, folders, models (data)
- loading, searching, error (app state)
- filter values (searchQuery, selectedFolderId, etc.)
- collapsedFolders (persistent UI state)

**Example:**
```typescript
// ❌ WRONG: Duplicate state in child
<script>
  let chats = $state([]);  // Don't duplicate!
</script>

// ✅ CORRECT: Receive via props
<script>
  let { chats, onSelectChat }: Props = $props();
</script>
```

### Pattern 4: Derived State ($derived)

**Computed Values in Composable:**
```typescript
// In useChatListData.ts
let groupedChats = $derived(() => {
  // Compute grouped chats from chats + folders
  return groupChatsByFolder(chats, folders);
});
```

**Usage:**
```typescript
// In ChatList.svelte
<PinnedChatsSection
  pinnedChats={data.groupedChats().pinnedChats}  // Derived value
/>
```

### Pattern 5: Optimistic Updates

**Update Local State Immediately:**
```typescript
async function deleteChat(chatId: string) {
  // Optimistic update (local state)
  chats = chats.filter(c => c.id !== chatId);

  try {
    // Backend call
    await orpc.chat.delete({ id: chatId });
  } catch (err) {
    // Rollback on error
    await loadChats();
  }
}
```

---

## Type Definitions Strategy

### Centralized Types File

**Location:** `apps/web/src/lib/components/secondary-sidebar/chat-list/types.ts`

**Export Types:**
```typescript
// Domain Types
export interface Chat {
  id: string;
  title: string;
  modelId: string;
  pinned: boolean;
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  matchingMessages?: MatchingMessage[];
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
}

export interface Model {
  id: string;
  provider: string;
  modelId: string;
  name: string;
  baseUrl?: string;
  apiKeyId?: string;
  isActive: boolean;
  avatarUrl?: string;
  settings?: ModelSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchingMessage {
  id: string;
  chatId: string;
  role: string;
  content: string;
  createdAt: Date;
}

// Grouped Chats Type
export interface GroupedChats {
  pinnedChats: Chat[];
  folderGroups: Array<{ folder: Folder; chats: Chat[] }>;
  noFolderChats: Chat[];
}

// Provider Types
export type Provider = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama' | 'custom';

// Export Format Types
export type ExportFormat = 'json' | 'md' | 'zip' | 'zip-optimized';

// Composable Return Type
export interface UseChatListDataReturn {
  // State (see full definition in useChatListData section)
}

// Component Props Types
export interface ChatListHeaderProps {
  title: string;
  exporting: boolean;
  onCreateNewChat: () => void;
  onExportAll: (format: 'json' | 'md' | 'zip') => void;
}

export interface ChatListFiltersProps {
  searchQuery: string;
  folders: Folder[];
  selectedFolderId: string;
  showPinnedOnly: boolean;
  hasActiveFilters: boolean;
  onSearchChange: (query: string) => void;
  onSearchKeydown: (e: KeyboardEvent) => void;
  onFolderChange: (folderId: string) => void;
  onPinnedChange: (checked: boolean) => void;
  onOpenAdvancedFilters: () => void;
}

// ... etc for other components
```

**Import Strategy:**
```typescript
// In components
import type { Chat, Folder, GroupedChats } from './types';
import type { ChatListFiltersProps } from './types';
```

---

## File Structure

```
apps/web/src/lib/components/secondary-sidebar/
├── ChatList.svelte                    (orchestration, ~150 lines)
├── ChatListItem.svelte                (existing, keep as-is)
├── ChatEmptyState.svelte              (existing, keep as-is)
└── chat-list/                         (new directory)
    ├── types.ts                       (shared type definitions)
    ├── useChatListData.ts             (data composable, ~300 lines)
    ├── ChatListHeader.svelte          (~50 lines)
    ├── ChatListFilters.svelte         (~80 lines)
    ├── ChatListFilterDialog.svelte    (~200 lines)
    ├── PinnedChatsSection.svelte      (~40 lines)
    ├── FolderChatsSection.svelte      (~30 lines)
    ├── FolderItem.svelte              (~100 lines)
    ├── NoFolderChatsSection.svelte    (~40 lines)
    ├── ChatListLoadingState.svelte    (~10 lines)
    ├── ChatListErrorState.svelte      (~30 lines)
    └── utils/                         (optional, for future)
        └── chat-grouping.ts           (if needed)
```

---

## Implementation Phases

**Phase 1: Analysis & Preparation** (Current Phase)
- ✅ 1.1: Analyze ChatList.svelte responsibilities
- 🔄 1.2: Create component extraction plan (THIS TASK)
- ✅ 1.3: Document acceptance criteria

**Phase 2: Extract Data Layer**
- 2.1: Create useChatListData.ts composable
- 2.2: Update ChatList.svelte to use composable

**Phase 3: Extract Header Components**
- 3.1: Create ChatListHeader.svelte
- 3.2: Create ChatListFilters.svelte
- 3.3: Update ChatList.svelte to use header components

**Phase 4: Extract Chat Group Components**
- 4.1: Create PinnedChatsSection.svelte
- 4.2: Create NoFolderChatsSection.svelte
- 4.3: Create FolderChatsSection.svelte
- 4.4: Create FolderItem.svelte
- 4.5: Update ChatList.svelte to use chat group components

**Phase 5: Extract Loading & Error States**
- 5.1: Create ChatListLoadingState.svelte
- 5.2: Create ChatListErrorState.svelte
- 5.3: Update ChatList.svelte to use state components

**Phase 6: Create Derived Utilities** (Optional)
- 6.1: Create chat-grouping.ts utility
- 6.2: Update ChatList.svelte to use grouping utility

**Phase 7: Type Definitions**
- 7.1: Create types.ts
- 7.2: Update all components to use shared types

**Phase 8: Final Integration & Testing**
- 8.1: Refactor ChatList.svelte to orchestration component
- 8.2: Run type checks
- 8.3: Run hydration checks
- 8.4: Manual testing of all features
- 8.5: Build and preview

---

## Success Metrics

### Code Quality
- ChatList.svelte reduced from 1031 to ~150 lines (85% reduction)
- All components < 200 lines (SRP compliance)
- No duplicated logic across components
- Type safety: 0 TypeScript errors

### Functionality
- 100% feature parity (no regressions)
- All interactions work (search, filter, CRUD, export)
- No console errors or warnings
- Clean hydration (0 mismatches)

### Maintainability
- Clear component responsibilities
- Easy to add new features
- Easy to test individual components
- Follows existing patterns (FolderList/FolderListItem)

---

## Migration Strategy

### Step-by-Step Approach

**Step 1: Create Directory Structure**
```bash
mkdir -p apps/web/src/lib/components/secondary-sidebar/chat-list
```

**Step 2: Create Type Definitions**
- Create `types.ts` with all shared types
- Export Chat, Folder, Model, etc.

**Step 3: Extract Data Layer**
- Create `useChatListData.ts` with all state and methods
- Move all data fetching, CRUD operations, filters
- Test: ChatList.svelte should still work

**Step 4: Extract UI Components Incrementally**
- Start with simple components (LoadingState, ErrorState)
- Then extract sections (PinnedChatsSection, NoFolderChatsSection)
- Then extract complex components (FolderItem, FolderChatsSection)
- Finally extract header (ChatListHeader, ChatListFilters)

**Step 5: Refactor ChatList.svelte**
- Remove all extracted code
- Keep only orchestration (compose components)
- Should be ~150 lines

**Step 6: Testing & Verification**
- Run type checks
- Run hydration checks
- Manual testing all features
- Build and preview

### Git Strategy

**Commit Granularity:**
1. Create directory + types.ts
2. Create useChatListData.ts
3. Create ChatListLoadingState + ChatListErrorState
4. Create PinnedChatsSection + NoFolderChatsSection
5. Create FolderItem + FolderChatsSection
6. Create ChatListHeader + ChatListFilters
7. Refactor ChatList.svelte to orchestration
8. Testing and fixes

**Commit Message Format:**
```
refactor(chat-list): extract useChatListData composable

- Move all state management to useChatListData.ts
- Extract data fetching, CRUD operations, filters
- Reduce ChatList.svelte from 1031 to 780 lines

Related: #025
```

---

## Risks & Mitigation

### Risk 1: Breaking Functionality
**Mitigation:**
- Incremental extraction (one component at a time)
- Test after each extraction
- Keep ChatList.svelte working until final refactor

### Risk 2: Type Errors
**Mitigation:**
- Create types.ts first
- Export all types from single source
- Use strict TypeScript checking

### Risk 3: Hydration Mismatches
**Mitigation:**
- Follow hydration rules (see CLAUDE.md)
- Use snippet child pattern for triggers
- Initialize state with falsy values
- Test with bun run check:hydration

### Risk 4: Performance Regression
**Mitigation:**
- Use $derived for computed values
- Avoid unnecessary re-renders
- Keep component props minimal
- Test bundle size impact

### Risk 5: Merge Conflicts
**Mitigation:**
- Work in feature branch
- Frequent commits
- Small, focused changes
- Communicate with team

---

## Questions & Decisions

### Open Questions

1. **Should we extract chat-grouping.ts utility?**
   - Pros: Reusable, testable
   - Cons: Adds complexity
   - Decision: Defer to Phase 6 (optional)

2. **Should FolderItem manage its own rename state?**
   - Pros: Self-contained
   - Cons: Duplication across components
   - Decision: Keep rename state in composable (follows existing pattern)

3. **Should we use Context API for sharing data?**
   - Pros: Avoid prop drilling
   - Cons: Adds complexity, not needed for shallow tree
   - Decision: No, use props (follows existing pattern)

4. **Should we export components individually or from index?**
   - Pros: Cleaner imports
   - Cons: More files
   - Decision: Export from index.ts in Phase 7

---

## Next Steps

**Immediate Actions (This Subtask):**
1. ✅ Create this component extraction plan document
2. Update implementation_plan.json notes with reference to this document
3. Get user approval of architecture
4. Proceed to Phase 2 (Extract Data Layer)

**Phase 2 Preparation:**
1. Create `chat-list/` directory
2. Create `types.ts` with all type definitions
3. Start creating `useChatListData.ts`

---

## Appendix: Reference Patterns

### FolderList Pattern (Container-Presentational)

**Container (FolderList.svelte):**
```typescript
// State
let folders = $state<Folder[]>([]);
let loading = $state(true);
let error = $state<string | null>(null);

// Methods
async function loadFolders() { /* ... */ }
async function deleteFolder(id: string) { /* ... */ }
async function renameFolder(id: string, name: string) { /* ... */ }
```

**Presentational (FolderListItem.svelte):**
```typescript
// Props
interface Props {
  folder: Folder;
  onDelete: () => void;
  onRename: (newName: string) => void;
}

// Local state only
let isRenaming = $state(false);
let renameValue = $state('');
```

**ChatList Should Follow Same Pattern:**
- Container: ChatList.svelte + useChatListData.ts
- Presentational: All child components
- Data flow: Props down, events up

---

**Document End**

*Last Updated: 2026-01-24*
*Status: Ready for Implementation*
