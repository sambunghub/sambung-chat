<script lang="ts">
  import FolderIcon from '@lucide/svelte/icons/folder';
  import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
  import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
  import EditIcon from '@lucide/svelte/icons/edit';
  import TrashIcon from '@lucide/svelte/icons/trash-2';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { buttonVariants } from '$lib/components/ui/button/index.js';
  import { autofocus } from '$lib/actions/autofocus.js';

  // Types
  interface Folder {
    id: string;
    name: string;
    userId: string;
    createdAt: Date;
  }

  interface Props {
    folder: Folder;
    onDelete: () => void;
    onRename: (newName: string) => void;
  }

  let { folder, onDelete, onRename }: Props = $props();

  let isRenaming = $state(false);
  let renameValue = $state('');
  let showActions = $state(false);
  let isOpen = $state(false);

  // Initialize rename value when entering rename mode
  $effect(() => {
    if (isRenaming) {
      renameValue = folder.name;
    }
  });

  // Handle rename submit
  function handleRenameSubmit() {
    if (renameValue.trim() && renameValue !== folder.name) {
      onRename(renameValue.trim());
    }
    isRenaming = false;
    renameValue = folder.name;
  }

  // Handle rename cancel
  function handleRenameCancel() {
    isRenaming = false;
    renameValue = folder.name;
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
  class="group hover:bg-accent/50 text-muted-foreground hover:text-foreground relative flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors"
  onmouseenter={() => (showActions = true)}
  onmouseleave={() => (showActions = false)}
  onclick={() => (isOpen = !isOpen)}
  role="button"
  tabindex="0"
  aria-expanded={isOpen}
  onkeydown={(e) => e.key === 'Enter' && (isOpen = !isOpen)}
>
  <!-- Folder Icon -->
  {#if isOpen}
    <FolderOpenIcon class="text-muted-foreground size-4 shrink-0" />
  {:else}
    <FolderIcon class="text-muted-foreground size-4 shrink-0" />
  {/if}

  <!-- Folder Name -->
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
      <span class="block truncate">{folder.name}</span>
    {/if}
  </div>

  <!-- Actions Menu (visible on hover) -->
  {#if showActions && !isRenaming}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        class="group/actions focus:ring-ring absolute right-1 rounded-sm opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
        onclick={(e) => e.stopPropagation()}
      >
        <div
          class={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            class: 'data-[state=open]:bg-accent size-7 p-0',
          })}
        >
          <MoreVerticalIcon class="size-4" />
          <span class="sr-only">Open menu</span>
        </div>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content class="w-48">
        <DropdownMenu.Item onclick={(e) => handleMenuClick(e, () => (isRenaming = true))}>
          <EditIcon class="mr-2 size-4" />
          Rename
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          onclick={(e) => handleMenuClick(e, onDelete)}
          class="text-destructive focus:text-destructive"
        >
          <TrashIcon class="mr-2 size-4" />
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/if}
</div>
