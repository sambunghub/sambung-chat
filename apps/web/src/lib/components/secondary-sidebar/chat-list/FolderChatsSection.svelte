<script lang="ts">
  import FolderItem from './FolderItem.svelte';
  import type { FolderChatsSectionProps } from './types.js';

  let {
    folderGroups,
    currentChatId,
    searchQuery,
    folders,
    collapsedFolders,
    renamingFolderId,
    folderRenameValue,
    onSelectChat,
    onDeleteChat,
    onRenameChat,
    onTogglePin,
    onMoveToFolder,
    onCreateFolder,
    onToggleFolder,
    onStartFolderRename,
    onSaveFolderRename,
    onCancelFolderRename,
    onDeleteFolder,
    onFolderKeydown,
    onFolderRenameValueChange,
  }: FolderChatsSectionProps = $props();

  function isFolderCollapsed(folderId: string): boolean {
    return collapsedFolders[folderId] ?? true;
  }
</script>

{#each folderGroups as { folder, chats: folderChats } (folder.id)}
  {#if folderChats.length > 0}
    <FolderItem
      {folder}
      {folderChats}
      isCollapsed={isFolderCollapsed(folder.id)}
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
      {onFolderKeydown}
      {onFolderRenameValueChange}
      {onSelectChat}
      {onDeleteChat}
      {onRenameChat}
      {onTogglePin}
      {onMoveToFolder}
      {onCreateFolder}
    />
  {/if}
{/each}
