<script lang="ts">
  import { page } from '$app/stores';
  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';

  const { children } = $props();

  // Server-side protection handles auth check
  // $page.data.user is available from +layout.server.ts
  const user = $derived($page.data?.user);

  // Use pathname as key to ensure fresh sidebar context for each route
  // This prevents sidebar state from persisting across navigation
  const sidebarKey = $derived($page.url.pathname);
</script>

<!-- Sidebar layout for app pages -->
{#key sidebarKey}
  <Sidebar.Provider style="--sidebar-width: 350px;">
    <AppSidebar {user} />
    <Sidebar.Inset>
      {@render children()}
    </Sidebar.Inset>
  </Sidebar.Provider>
{/key}
