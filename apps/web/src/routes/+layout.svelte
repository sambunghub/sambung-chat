<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { ModeWatcher } from 'mode-watcher';
  import { Toaster } from 'svelte-sonner';
  import { setupMermaidThemeObserver } from '$lib/markdown-renderer';
  import SkipLinks from '$lib/components/skip-links.svelte';
  import '../app.css';

  const { children } = $props();

  // Setup Mermaid theme observer on mount (browser only)
  onMount(() => {
    // Setup Mermaid theme observer to detect theme changes
    setupMermaidThemeObserver();
  });
</script>

<SkipLinks />

{@render children()}

<!-- ModeWatcher and Toaster: render only in browser to prevent hydration issues -->
{#if browser}
  <ModeWatcher defaultMode="dark" />
  <Toaster richColors position="top-right" />
{/if}
