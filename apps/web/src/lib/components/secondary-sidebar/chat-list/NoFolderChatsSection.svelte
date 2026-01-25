<script lang="ts">
  import ChatListItem from '../ChatListItem.svelte';
  import type { NoFolderChatsSectionProps } from './types.js';

  let {
    noFolderChats,
    currentChatId,
    searchQuery,
    folders,
    onSelectChat,
    onDeleteChat,
    onRenameChat,
    onTogglePin,
    onMoveToFolder,
    onCreateFolder,
  }: NoFolderChatsSectionProps = $props();
</script>

{#if noFolderChats.length > 0}
  <div class="mb-4">
    <h3
      class="text-muted-foreground mb-2 flex items-center gap-1.5 px-2 text-xs font-semibold uppercase"
    >
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
