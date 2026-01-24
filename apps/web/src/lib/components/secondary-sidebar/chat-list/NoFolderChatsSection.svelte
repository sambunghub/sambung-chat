<script lang="ts">
  import ChatListItem from '../ChatListItem.svelte';

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

  interface Props {
    noFolderChats: Chat[];
    currentChatId: string | undefined;
    searchQuery: string;
    folders: Folder[];
    onSelectChat: (chatId: string) => void;
    onDeleteChat: (chatId: string) => void;
    onRenameChat: (chatId: string, newTitle: string) => void;
    onTogglePin: (chatId: string) => void;
    onMoveToFolder: (chatId: string, folderId: string | null) => void;
    onCreateFolder: (chatId: string) => void;
  }

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
    onCreateFolder
  }: Props = $props();
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
