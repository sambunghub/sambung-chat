<script lang="ts">
  import PinIcon from '@lucide/svelte/icons/pin';
  import PinOffIcon from '@lucide/svelte/icons/pin-off';
  import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
  import FolderIcon from '@lucide/svelte/icons/folder';
  import FolderInputIcon from '@lucide/svelte/icons/folder-input';
  import FolderPlusIcon from '@lucide/svelte/icons/folder-plus';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { buttonVariants } from '$lib/components/ui/button/index.js';
  import { autofocus } from '$lib/actions/autofocus.js';

  // Types
  interface Chat {
    id: string;
    title: string;
    modelId: string;
    pinned: boolean;
    folderId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface MatchingMessage {
    id: string;
    chatId: string;
    role: string;
    content: string;
    createdAt: Date;
  }

  interface Folder {
    id: string;
    name: string;
    userId: string;
    createdAt: Date;
  }

  interface Props {
    chat: Chat;
    folders: Folder[];
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onRename: (newTitle: string) => void;
    onTogglePin: () => void;
    onMoveToFolder: (folderId: string | null) => void;
    onCreateFolder: () => void;
    searchQuery?: string;
    matchingMessages?: MatchingMessage[];
  }

  let {
    chat,
    folders,
    isActive,
    onSelect,
    onDelete,
    onRename,
    onTogglePin,
    onMoveToFolder,
    onCreateFolder,
    searchQuery = '',
    matchingMessages = [],
  }: Props = $props();

  let isRenaming = $state(false);
  let renameValue = $state('');
  let showActions = $state(false);
  let isDropdownOpen = $state(false);

  // Initialize rename value when entering rename mode
  $effect(() => {
    if (isRenaming) {
      renameValue = chat.title;
    }
  });

  // Reset showActions when dropdown closes
  $effect(() => {
    if (!isDropdownOpen) {
      // Small delay to prevent flickering
      const timeout = setTimeout(() => {
        showActions = false;
      }, 100);
      return () => clearTimeout(timeout);
    }
  });

  // Format relative time
  function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  }

  // HTML escape utility
  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Highlight search query in text
  function highlightText(text: string, query: string): string {
    if (!query || !query.trim()) return text;

    // First HTML-escape the text to prevent XSS
    const escapedText = escapeHtml(text);

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escapedText.replace(
      regex,
      '<mark class="bg-primary/30 text-foreground rounded px-0.5">$1</mark>'
    );
  }

  // Truncate text to max length, preserving word boundaries
  function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
  }

  // Handle rename submit
  function handleRenameSubmit() {
    if (renameValue.trim() && renameValue !== chat.title) {
      onRename(renameValue.trim());
    }
    isRenaming = false;
    renameValue = chat.title;
  }

  // Handle rename cancel
  function handleRenameCancel() {
    isRenaming = false;
    renameValue = chat.title;
  }

  // Handle keyboard events for rename
  function handleRenameKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  }

  // Helper to handle dropdown menu item clicks
  function handleMenuClick(e: Event, action: () => void) {
    e.stopPropagation();
    action();
  }
</script>

<div
  class="group relative flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors {isActive
    ? 'bg-accent text-accent-foreground'
    : chat.pinned
      ? 'bg-accent/30 text-accent-foreground'
      : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'}"
  onmouseenter={() => (showActions = true)}
  onmouseleave={() => !isDropdownOpen && (showActions = false)}
  onclick={onSelect}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && onSelect()}
>
  <!-- Pin Icon -->
  {#if chat.pinned}
    <div class="bg-primary/10 text-primary rounded p-0.5">
      <PinIcon class="size-3 shrink-0" />
    </div>
  {:else}
    <div class="size-3.5 shrink-0"></div>
  {/if}

  <!-- Chat Title/Info -->
  <div class="min-w-0 flex-1">
    {#if isRenaming}
      <input
        type="text"
        class="bg-background focus:ring-ring w-full rounded border px-2 py-0.5 text-xs focus:ring-1 focus:outline-none"
        bind:value={renameValue}
        onkeydown={handleRenameKeydown}
        onblur={handleRenameSubmit}
        use:autofocus
      />
    {:else}
      <div class="flex items-center gap-2">
        <span class="min-w-0 flex-1 truncate">
          {@html highlightText(chat.title, searchQuery)}
        </span>
        <span class="text-muted-foreground shrink-0 text-xs whitespace-nowrap">
          {getRelativeTime(chat.updatedAt)}
        </span>
      </div>

      <!-- Matching Message Snippets -->
      {#if searchQuery && matchingMessages && matchingMessages.length > 0}
        <div class="text-muted-foreground mt-1 space-y-0.5">
          {#each matchingMessages.slice(0, 2) as msg}
            <div class="flex items-start gap-1.5 text-xs">
              <span class="shrink-0 text-[10px] font-medium uppercase opacity-70">
                {msg.role === 'user' ? 'You' : 'AI'}:
              </span>
              <span class="line-clamp-2 flex-1 opacity-80">
                {@html highlightText(truncateText(msg.content, 80), searchQuery)}
              </span>
            </div>
          {/each}
          {#if matchingMessages.length > 2}
            <div class="text-muted-foreground pl-2 text-[10px] italic opacity-60">
              +{matchingMessages.length - 2} more match{matchingMessages.length - 2 > 1 ? 'es' : ''}
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>

  <!-- Actions Menu (visible on hover or when dropdown is open) -->
  {#if (showActions || isDropdownOpen) && !isRenaming}
    <DropdownMenu.Root bind:open={isDropdownOpen}>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <button
            {...props}
            class={buttonVariants({
              variant: 'ghost',
              size: 'sm',
              class:
                'group/actions focus:ring-ring data-[state=open]:bg-accent absolute right-1 size-7 rounded-sm p-0 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100',
            })}
            onclick={(e) => e.stopPropagation()}
            aria-label="Options for {chat.title}"
          >
            <MoreVerticalIcon class="size-4" />
          </button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content class="w-48">
        <DropdownMenu.Item onclick={(e) => handleMenuClick(e, onTogglePin)}>
          {#if chat.pinned}
            <PinOffIcon class="mr-2 size-4" />
            Unpin
          {:else}
            <PinIcon class="mr-2 size-4" />
            Pin
          {/if}
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={(e) => handleMenuClick(e, () => (isRenaming = true))}>
          <PencilIcon class="mr-2 size-4" />
          Rename
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={(e) => handleMenuClick(e, onCreateFolder)}>
          <FolderPlusIcon class="mr-2 size-4" />
          New Folder
        </DropdownMenu.Item>

        <!-- Move to Folder Submenu -->
        {#if folders.length > 0}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger>
              <FolderInputIcon class="mr-2 size-4" />
              Move to
            </DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent class="w-48">
              <DropdownMenu.Item onclick={(e) => handleMenuClick(e, () => onMoveToFolder(null))}>
                <FolderIcon class="mr-2 size-4" />
                No Folder
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              {#each folders as folder}
                <DropdownMenu.Item
                  onclick={(e) => handleMenuClick(e, () => onMoveToFolder(folder.id))}
                >
                  <FolderIcon class="mr-2 size-4" />
                  {folder.name}
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
        {/if}

        <DropdownMenu.Separator />
        <DropdownMenu.Item
          onclick={(e) => handleMenuClick(e, onDelete)}
          class="text-destructive focus:text-destructive"
        >
          <Trash2Icon class="mr-2 size-4" />
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/if}
</div>
