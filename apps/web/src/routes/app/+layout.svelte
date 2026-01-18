<script lang="ts">
  import { page } from '$app/stores';
  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';

  const { children } = $props();

  // Server-side protection handles auth check
  // $page.data.user is available from +layout.server.ts
  const user = $derived($page.data?.user);
</script>

<!-- Sidebar layout for app pages -->
<Sidebar.Provider style="--sidebar-width: 280px; --sidebar-width-icon: 3rem;">
  <AppSidebar {user} />
  <Sidebar.Inset>
    {@render children()}
  </Sidebar.Inset>
</Sidebar.Provider>
