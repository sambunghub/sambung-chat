<script lang="ts">
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { setSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
  import {
    SIDEBAR_COOKIE_MAX_AGE,
    SIDEBAR_COOKIE_NAME,
  } from '$lib/components/ui/sidebar/constants.js';

  const { children } = $props();

  // Server-side protection handles auth check
  // $page.data.user is available from +layout.server.ts
  const user = $derived($page.data?.user);

  // Initialize sidebar context BEFORE rendering children
  let sidebarOpen = $state(true);
  setSidebar({
    open: () => sidebarOpen,
    setOpen: (value: boolean) => {
      sidebarOpen = value;

      // Only set cookie in browser
      if (browser) {
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      }
    },
  });
</script>

<!-- Sidebar layout for app pages -->
<Sidebar.Provider style="--sidebar-width: 280px; --sidebar-width-icon: 3rem;">
  <AppSidebar {user} />
  <Sidebar.Inset>
    {@render children()}
  </Sidebar.Inset>
</Sidebar.Provider>
