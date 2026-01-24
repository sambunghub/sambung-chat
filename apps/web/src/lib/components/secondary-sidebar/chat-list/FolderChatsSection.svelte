<script lang="ts">
  import ChatListItem from '../ChatListItem.svelte';
  import { autofocus } from '$lib/actions/autofocus.js';
  import FolderIcon from '@lucide/svelte/icons/folder';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

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

  interface FolderGroup {
    folder: Folder;
    chats: Chat[];
  }

  interface Props {
    folderGroups: FolderGroup[];
    currentChatId: string | undefined;
    searchQuery: string;
    folders: Folder[];
    collapsedFolders: Record<string, boolean>;
    renamingFolderId: string | null;
    folderRenameValue: string;
    onSelectChat: (chatId: string) => void;
    onDeleteChat: (chatId: string) => void;
    onRenameChat: (chatId: string, newTitle: string) => void;
    onTogglePin: (chatId: string) => void;
    onMoveToFolder: (chatId: string, folderId: string | null) => void;
    onCreateFolder: (chatId: string) => void;
    onToggleFolder: (folderId: string) => void;
    onStartFolderRename: (folderId: string, folderName: string) => void;
    onSaveFolderRename: () => void;
    onCancelFolderRename: () => void;
    onDeleteFolder: (folderId: string, folderName: string) => void;
    onFolderKeydown: (e: KeyboardEvent) => void;
    onFolderRenameValueChange: (value: string) => void;
  }

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
    onFolderRenameValueChange
  }: Props = $props();

  function isFolderCollapsed(folderId: string): boolean {
    return collapsedFolders[folderId] ?? true;
  }
</script>

{#each folderGroups as { folder, chats: folderChats } (folder.id)}
  {#if folderChats.length > 0}
    <div class="mb-3">
      <!-- Collapsible Folder Header -->
      <div
        class="group/folder relative"
        ondblclick={() => onStartFolderRename(folder.id, folder.name)}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            onStartFolderRename(folder.id, folder.name);
          }
        }}
        role="button"
        tabindex="0"
        aria-label={`Folder ${folder.name}, double-click to rename`}
      >
        {#if renamingFolderId === folder.id}
          <!-- Inline Rename Input -->
          <input
            type="text"
            class="bg-background focus:ring-ring w-full rounded border px-2 py-1 text-xs font-semibold uppercase focus:ring-1 focus:outline-none"
            value={folderRenameValue}
            oninput={(e) => onFolderRenameValueChange(e.currentTarget.value)}
            onkeydown={onFolderKeydown}
            onblur={onSaveFolderRename}
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
              onToggleFolder(folder.id);
            }}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleFolder(folder.id);
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
                onclick={() => onStartFolderRename(folder.id, folder.name)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onStartFolderRename(folder.id, folder.name);
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
                onclick={() => onDeleteFolder(folder.id, folder.name)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDeleteFolder(folder.id, folder.name);
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
  {/if}
{/each}
