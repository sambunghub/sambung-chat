<script lang="ts">
  import SidebarWidthSetting from '$lib/components/settings/sidebar-width-setting.svelte';
  import { appearance } from '$lib/stores/appearance.store.js';
  import { onMount } from 'svelte';

  let currentSettings = $derived(appearance.currentSettings);

  onMount(() => {
    console.log('Current settings:', currentSettings);
  });
</script>

<div class="container mx-auto max-w-3xl p-6">
  <div class="mb-8">
    <h1 class="text-foreground text-3xl font-bold">Sidebar Width Setting Test</h1>
    <p class="text-muted-foreground mt-2">This page tests the sidebar width slider component</p>
  </div>

  <div class="space-y-8">
    <!-- Sidebar Width Component -->
    <SidebarWidthSetting />

    <!-- Debug Info -->
    <div class="border-border bg-muted/50 rounded-lg border p-4">
      <h2 class="text-foreground mb-3 text-lg font-semibold">Current Settings</h2>
      <pre class="text-sm">{JSON.stringify(currentSettings, null, 2)}</pre>
    </div>

    <!-- Visual demonstration -->
    <div class="border-border rounded-lg border p-6">
      <h2 class="text-foreground mb-4 text-xl font-semibold">Sidebar Width Demonstration</h2>
      <p class="text-muted-foreground mb-4 text-sm">
        The sidebar width setting controls the secondary sidebar width across the application.
        Current width: <span class="text-primary font-semibold"
          >{currentSettings.sidebarWidth}px</span
        >
        ({(currentSettings.sidebarWidth / 16).toFixed(1)}rem)
      </p>
      <div class="flex gap-4">
        <div
          class="bg-muted border-border flex items-center justify-center rounded-lg border-2 border-dashed transition-all duration-300"
          style="width: {currentSettings.sidebarWidth}px; min-width: 200px;"
        >
          <span class="text-muted-foreground text-sm font-medium">Sidebar</span>
        </div>
        <div class="bg-muted/50 border-border flex-1 rounded-lg border-2 border-dashed p-4">
          <span class="text-muted-foreground text-sm">Main Content Area</span>
        </div>
      </div>
    </div>
  </div>
</div>
