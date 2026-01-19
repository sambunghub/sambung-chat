<script lang="ts">
  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';

  let { children, data } = $props();

  // Server-side protection handles auth check
  // data.user is available from +layout.server.ts (SSR-safe)
  const user = $derived(data?.user);
</script>

<!-- Sidebar layout for app pages -->
<Sidebar.Provider style="--sidebar-width: 280px; --sidebar-width-icon: 3rem;">
  <AppSidebar {user} />
  <Sidebar.Inset>
    {@render children()}
  </Sidebar.Inset>
</Sidebar.Provider>
