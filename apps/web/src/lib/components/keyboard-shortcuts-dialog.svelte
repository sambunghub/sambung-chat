<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import DialogContent from '$lib/components/ui/dialog/dialog-content.svelte';
  import DialogTitle from '$lib/components/ui/dialog/dialog-title.svelte';
  import DialogDescription from '$lib/components/ui/dialog/dialog-description.svelte';
  import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
  import { cn } from '$lib/utils';

  interface ShortcutGroup {
    title: string;
    shortcuts: {
      keys: string[];
      description: string;
    }[];
  }

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['Tab'], description: 'Move focus to next element' },
        { keys: ['Shift', 'Tab'], description: 'Move focus to previous element' },
        { keys: ['Arrow Keys'], description: 'Navigate within lists, menus' },
        { keys: ['Home', 'End'], description: 'Jump to start/end of content' },
        {
          keys: ['Page Up', 'Page Down'],
          description: 'Scroll through content',
        },
      ],
    },
    {
      title: 'Actions',
      shortcuts: [
        { keys: ['Enter'], description: 'Activate buttons, links, submit forms' },
        {
          keys: ['Space'],
          description: 'Toggle checkboxes, radio buttons, toggle buttons',
        },
        { keys: ['Escape'], description: 'Close modals, dropdowns, cancel' },
      ],
    },
    {
      title: 'Chat',
      shortcuts: [
        { keys: ['Enter'], description: 'Send message' },
        { keys: ['Shift', 'Enter'], description: 'Insert new line in message' },
      ],
    },
  ];

  let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<Dialog.Root bind:open>
  <DialogContent class="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
    <DialogTitle class="flex items-center gap-2">
      <HelpCircleIcon class="size-5" />
      Keyboard Shortcuts
    </DialogTitle>
    <DialogDescription>
      Navigate and use SambungChat more efficiently with these keyboard shortcuts.
    </DialogDescription>

    <div class="space-y-6 py-4">
      {#each shortcutGroups as group}
        <div>
          <h3 class="text-foreground mb-3 font-semibold">{group.title}</h3>
          <div class="space-y-2">
            {#each group.shortcuts as shortcut}
              <div class="flex items-center justify-between gap-4">
                <span class="text-muted-foreground text-sm">{shortcut.description}</span>
                <div class="flex gap-1">
                  {#each shortcut.keys as key}
                    <kbd
                      class={cn(
                        'bg-muted text-muted-foreground border-border inline-flex min-h-[2rem] min-w-[2.5rem] items-center justify-center rounded border px-2 py-1 text-xs font-medium shadow-sm',
                        shortcut.keys.length > 1 && 'first:rounded-r-none last:rounded-l-none'
                      )}
                    >
                      {key}
                    </kbd>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <div class="bg-muted/50 border-border mt-4 rounded border p-4">
      <p class="text-muted-foreground text-sm">
        <strong class="text-foreground">Tip:</strong> Most interactive elements are keyboard
        accessible. Press
        <kbd class="bg-background mx-1 rounded border px-1.5 py-0.5 text-xs">Tab</kbd> to move between
        elements and look for visible focus indicators.
      </p>
    </div>
  </DialogContent>
</Dialog.Root>
