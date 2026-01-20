<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import ModelsManager from './models-manager.svelte';
  import { page } from '$app/stores';
</script>

<header class="bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b p-4">
  <Sidebar.Trigger class="-ms-1" />
  <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item>
        <Breadcrumb.Page>Settings</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb.List>
  </Breadcrumb.Root>
</header>

<div class="flex h-[calc(100vh-61px)]">
  <!-- Settings Navigation Sidebar -->
  <aside class="bg-muted/10 w-64 border-r p-4">
    <nav class="space-y-1">
      <a
        href="/app/settings"
        class="hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page
          .url.pathname === '/app/settings'
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-cpu"
          ><rect x="4" y="4" width="16" height="16" rx="2" /><rect
            x="9"
            y="9"
            width="6"
            height="6"
          /><path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" /><path
            d="M20 15h2"
          /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" /></svg
        >
        AI Models
      </a>
      <a
        href="/app/settings/api-keys"
        class="hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page
          .url.pathname === '/app/settings/api-keys'
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-key"
          ><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" /><circle
            cx="16.5"
            cy="7.5"
            r=".5"
            fill="currentColor"
          /></svg
        >
        API Keys
      </a>
    </nav>
  </aside>

  <!-- Settings Content -->
  <main class="flex-1 overflow-auto p-6">
    <div class="mx-auto max-w-5xl">
      <h1 class="text-foreground mb-2 text-3xl font-bold">Settings</h1>
      <p class="text-muted-foreground mb-8">Manage your application settings and preferences</p>

      <!-- Models Management Section -->
      <section>
        <h2 class="text-foreground mb-4 text-2xl font-semibold">AI Models</h2>
        <ModelsManager />
      </section>
    </div>
  </main>
</div>
