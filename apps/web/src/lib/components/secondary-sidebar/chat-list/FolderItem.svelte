<script lang="ts">
  import ChatListItem from '../ChatListItem.svelte';
  import { autofocus } from '$lib/actions/autofocus.js';
  import FolderIcon from '@lucide/svelte/icons/folder';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import type { FolderItemProps } from './types.js';

  let {
    folder,
    folderChats,
    isCollapsed,
    isRenaming,
    renameValue,
    currentChatId,
    searchQuery,
    folders,
    onToggle,
    onStartRename,
    onSaveRename,
    onCancelRename,
    onDelete,
    onFolderKeydown,
    onFolderRenameValueChange,
    onSelectChat,
    onDeleteChat,
    onRenameChat,
    onTogglePin,
    onMoveToFolder,
    onCreateFolder,
  }: FolderItemProps = $props();
</script>

<div class="mb-3">
  <!-- Collapsible Folder Header -->
  <div
    class="group/folder relative"
    ondblclick={onStartRename}
    onkeydown={(e) => {
      if (e.key === 'Enter') {
        onStartRename();
      }
    }}
    role="button"
    tabindex="0"
    aria-label={`Folder ${folder.name}, double-click to rename`}
  >
    {#if isRenaming}
      <!-- Inline Rename Input -->
      <input
        type="text"
        class="bg-background focus:ring-ring w-full rounded border px-2 py-1 text-xs font-semibold uppercase focus:ring-1 focus:outline-none"
        value={renameValue}
        oninput={(e) => onFolderRenameValueChange(e.currentTarget.value)}
        onkeydown={onFolderKeydown}
        onblur={onSaveRename}
        use:autofocus
      />
    {:else}
      <!-- Folder Display -->
      <div
        role="button"
        tabindex="0"
        aria-label={`Toggle folder ${folder.name}`}
        aria-expanded={!isCollapsed}
        onclick={(e) => {
          // Only toggle if not clicking on actions
          if ((e.target as HTMLElement).closest('[data-action]')) return;
          onToggle();
        }}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        class="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold uppercase transition-colors"
      >
        {#if isCollapsed}
          <ChevronRightIcon class="size-3.5" />
        {:else}
          <ChevronDownIcon class="size-3.5" />
        {/if}
        <FolderIcon class="size-3" />
        <span class="flex-1 text-left">{folder.name}</span>

        <!-- Folder Actions (visible on hover) -->
        <span class="flex gap-0.5 opacity-0 transition-opacity group-hover/folder:opacity-100">
          <div
            data-action
            onclick={onStartRename}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStartRename();
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
            onclick={onDelete}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onDelete();
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
