<script lang="ts">
  import { ModeWatcher } from 'mode-watcher';
  import '../app.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  const { children } = $props();

  // Get user from page.data (populated by +layout.server.ts or route-level load functions)
  const user = $derived($page.data?.user);

  // Handle root redirects based on auth state
  $effect(() => {
    const path = $page.url.pathname;

    // If on root and not authenticated, redirect to login
    if (path === '/' && !user) {
      goto('/login');
    }
    // If on root and authenticated, redirect to app
    else if (path === '/' && user) {
      goto('/app/chat');
    }
  });
</script>

<!-- ModeWatcher must be at root level for global theme tracking -->
<ModeWatcher defaultMode="dark" />
{@render children()}
