<script lang="ts">
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
  import type { ChatListFiltersProps } from './types.js';

  let {
    searchQuery,
    folders,
    selectedFolderId,
    showPinnedOnly,
    hasActiveFilters,
    onSearchChange,
    onSearchKeydown,
    onFolderChange,
    onPinnedChange,
    onOpenAdvancedFilters,
  }: ChatListFiltersProps = $props();
</script>

<div class="space-y-2">
  <!-- Search Input (press Enter to search) -->
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
      size="sm"
      onclick={onOpenAdvancedFilters}
      variant={hasActiveFilters ? 'default' : 'outline'}
      class="h-8 px-3"
      title={hasActiveFilters ? 'Filters active - click to view' : 'Filter chats'}
    >
      <SlidersHorizontalIcon class="size-4" />
      {#if hasActiveFilters}
        <span class="ml-1.5 text-xs">Active</span>
      {/if}
    </Button>
  </div>

  <!-- Inline Filters: Folder and Pinned -->
  <div class="flex items-center gap-2">
    <select
      value={selectedFolderId}
      onchange={(e) => onFolderChange(e.currentTarget.value)}
      class="border-input bg-background focus:ring-ring flex-1 rounded-md border px-2 py-1.5 text-sm focus:ring-1 focus:outline-none"
    >
      <option value="">All Folders</option>
      {#each folders as folder}
        <option value={folder.id}>{folder.name}</option>
      {/each}
    </select>
    <label class="text-muted-foreground flex items-center gap-1.5 text-xs">
      <input
        type="checkbox"
        checked={showPinnedOnly}
        onchange={(e) => onPinnedChange(e.currentTarget.checked)}
        class="border-input bg-background focus:ring-ring rounded border px-1 py-0.5 text-sm focus:ring-1 focus:outline-none"
      />
      Pinned only
    </label>
  </div>
</div>
