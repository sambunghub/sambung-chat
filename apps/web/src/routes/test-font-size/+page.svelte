<script lang="ts">
  import FontSizeSetting from '$lib/components/settings/font-size-setting.svelte';
  import { appearance } from '$lib/stores/appearance.store.js';
  import { onMount } from 'svelte';

  let currentSettings = $derived(appearance.currentSettings);

  onMount(() => {
    console.log('Current settings:', currentSettings);
  });
</script>

<div class="container mx-auto max-w-3xl p-6">
  <div class="mb-8">
    <h1 class="text-foreground text-3xl font-bold">Font Size Setting Test</h1>
    <p class="text-muted-foreground mt-2">This page tests the font size slider component</p>
  </div>

  <div class="space-y-8">
    <!-- Font Size Component -->
    <FontSizeSetting />

    <!-- Debug Info -->
    <div class="border-border bg-muted/50 rounded-lg border p-4">
      <h2 class="text-foreground mb-3 text-lg font-semibold">Current Settings</h2>
      <pre class="text-sm">{JSON.stringify(currentSettings, null, 2)}</pre>
    </div>

    <!-- Live Preview of Whole Page -->
    <div class="border-border rounded-lg border p-6">
      <h2 class="text-foreground mb-4 text-xl font-semibold">Page Text Preview</h2>
      <p style="font-size: {currentSettings.fontSize}px;">
        This is how all the text on the page will look with your selected font size. The quick brown
        fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
      </p>
      <p class="text-muted-foreground mt-4" style="font-size: {currentSettings.fontSize}px;">
        This is muted text that also uses the selected font size.
      </p>
    </div>
  </div>
</div>
