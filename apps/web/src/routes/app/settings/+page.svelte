<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import ModelsManager from './models-manager.svelte';
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

<div class="p-6">
  <div class="mx-auto max-w-5xl">
    <h1 class="text-foreground mb-2 text-3xl font-bold">Settings</h1>
    <p class="text-muted-foreground mb-8">Manage your application settings and preferences</p>

    <!-- Models Management Section -->
    <section>
      <h2 class="text-foreground mb-4 text-2xl font-semibold">AI Models</h2>
      <ModelsManager />
    </section>
  </div>
</div>
