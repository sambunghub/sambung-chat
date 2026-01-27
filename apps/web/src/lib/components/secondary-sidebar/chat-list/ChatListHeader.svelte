<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import FileJsonIcon from '@lucide/svelte/icons/file-json';
  import CodeIcon from '@lucide/svelte/icons/code';
  import PackageIcon from '@lucide/svelte/icons/package';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import type { ChatListHeaderProps } from './types.js';

  let { title, exporting, onCreateNewChat, onExportAll }: ChatListHeaderProps = $props();
</script>

<div class="mb-3 flex items-center justify-between">
  <h2 class="text-lg font-semibold">{title}</h2>
  <div class="flex gap-2">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        class="bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
        disabled={exporting}
        title="Export all chats"
      >
        <DownloadIcon class="size-4" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item onclick={() => onExportAll('json')} disabled={exporting}>
          <FileJsonIcon class="mr-2 size-4" />
          <span>Export All as JSON</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => onExportAll('md')} disabled={exporting}>
          <CodeIcon class="mr-2 size-4" />
          <span>Export All as Markdown</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => onExportAll('zip')} disabled={exporting}>
          <PackageIcon class="mr-2 size-4" />
          <span>Export All as ZIP</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
    <Button size="sm" onclick={onCreateNewChat} variant="default">
      <PlusIcon class="mr-1 size-4" />
      New Chat
    </Button>
  </div>
</div>
