<script lang="ts">
  import { onMount } from 'svelte';
  import ChatListHeader from './chat-list/ChatListHeader.svelte';
  import ChatListFilters from './chat-list/ChatListFilters.svelte';
  import ChatListFilterDialog from './chat-list/ChatListFilterDialog.svelte';
  import ChatListLoadingState from './chat-list/ChatListLoadingState.svelte';
  import ChatListErrorState from './chat-list/ChatListErrorState.svelte';
  import ChatEmptyState from './ChatEmptyState.svelte';
  import PinnedChatsSection from './chat-list/PinnedChatsSection.svelte';
  import FolderChatsSection from './chat-list/FolderChatsSection.svelte';
  import NoFolderChatsSection from './chat-list/NoFolderChatsSection.svelte';
  import { useChatListData } from './chat-list/useChatListData.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';

  interface Props {
    currentChatId?: string;
  }

  let { currentChatId }: Props = $props();

  // Use composable for all data management
  const data = useChatListData();

  // Initial load
  onMount(() => {
    data.loadChats();
    data.loadFolders();
    data.loadModels();
  });

  // Local UI state for filter dialog
  let showFilterDialog = $state(false);

  function handleOpenAdvancedFilters() {
    showFilterDialog = true;
  }

  function handleFolderRenameValueChange(value: string) {
    data.folderRenameValue = value;
  }
</script>

<div class="flex h-full flex-col">
  <!-- Header -->
  <Sidebar.Header class="border-b p-4">
    <ChatListHeader
      title="Chats"
      exporting={data.exporting}
      onCreateNewChat={data.createNewChat}
      onExportAll={data.handleExportAll}
    />

    <ChatListFilters
      searchQuery={data.searchQuery}
      folders={data.folders}
      selectedFolderId={data.selectedFolderId}
      showPinnedOnly={data.showPinnedOnly}
      hasActiveFilters={data.hasActiveFilters}
      onSearchChange={data.handleSearchChange}
      onSearchKeydown={data.handleSearchKeydown}
      onFolderChange={data.handleFolderSelect}
      onPinnedChange={data.handlePinnedToggle}
      onOpenAdvancedFilters={handleOpenAdvancedFilters}
    />
  </Sidebar.Header>

  <!-- Content -->
  <Sidebar.Content class="flex-1 overflow-hidden">
    {#if data.error}
      <ChatListErrorState error={data.error} onRetry={data.loadChats} />
    {:else if data.loading || data.searching}
      <ChatListLoadingState loading={data.loading} searching={data.searching} />
    {:else if data.chats.length === 0}
      <ChatEmptyState onNewChat={data.createNewChat} />
    {:else}
      <div class="h-full max-h-[50vh] overflow-y-auto">
        <div class="px-2">
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
            onFolderRenameValueChange={handleFolderRenameValueChange}
          />

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
  providers={data.availableProviders()}
  models={data.availableModels()}
  selectedProviders={data.selectedProviders}
  selectedModelIds={data.selectedModelIds}
  dateFrom={data.dateFrom}
  dateTo={data.dateTo}
  onProvidersChange={data.handleProvidersChange}
  onModelsChange={data.handleModelsChange}
  onDateChange={data.handleDateChange}
  onClearAll={data.handleClearAllFilters}
  hasAnyFilters={data.hasAnyFilters}
/>
