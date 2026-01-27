<script lang="ts">
  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import KeyboardShortcutsDialog from '$lib/components/keyboard-shortcuts-dialog.svelte';
  import { browser } from '$app/environment';

  let { children, data } = $props();

  // Server-side protection handles auth check
  // data.user is available from +layout.server.ts (SSR-safe)
  const user = $derived(data?.user);

  // Global keyboard shortcut for help dialog
  let showKeyboardShortcuts = $state(false);

  $effect(() => {
    if (!browser) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Open keyboard shortcuts dialog with "?" key
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if typing in an input
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        showKeyboardShortcuts = true;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<!-- Sidebar layout for app pages -->
<Sidebar.Provider style="--sidebar-width: 280px; --sidebar-width-icon: 3rem;">
  <AppSidebar {user} />
  <Sidebar.Inset id="main-content" tabindex={-1}>
    {@render children()}
  </Sidebar.Inset>
</Sidebar.Provider>

<KeyboardShortcutsDialog bind:open={showKeyboardShortcuts} />
