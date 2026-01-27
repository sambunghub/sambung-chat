<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { ModeWatcher } from 'mode-watcher';
  import { Toaster } from 'svelte-sonner';
  import { setupMermaidThemeObserver } from '$lib/markdown-renderer';
  import SkipLinks from '$lib/components/skip-links.svelte';
  import { initializeAppearanceSettings } from '$lib/utils/apply-settings';
  import { appearance } from '$lib/stores/appearance.store';
  import '../app.css';

  const { children } = $props();

  // Setup on mount (browser only)
  onMount(() => {
    if (browser) {
      // Initialize appearance settings first (fonts, theme)
      initializeAppearanceSettings();

      // Setup Mermaid theme observer to detect theme changes
      setupMermaidThemeObserver();
    }
  });

  // Watch for appearance settings changes
  $effect(() => {
    if (!browser) return;

    // Subscribe to store to track changes
    const unsubscribe = appearance.subscribe((state) => {
      const settings = state.settings;

      // Apply font size
      document.documentElement.style.setProperty('--font-size-base', `${settings.fontSize}px`);

      // Apply font family
      const fontFamilyStacks: Record<string, string> = {
        'system-ui':
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        'sans-serif': '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        monospace:
          '"Fira Code", "JetBrains Mono", "Cascadia Code", Consolas, "Courier New", monospace',
      };
      document.documentElement.style.setProperty(
        '--font-family-base',
        fontFamilyStacks[settings.fontFamily]
      );

      // Apply sidebar width
      document.documentElement.style.setProperty('--sidebar-width', `${settings.sidebarWidth}px`);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  });
</script>

<SkipLinks />

{@render children()}

<!-- ModeWatcher and Toaster: render only in browser to prevent hydration issues -->
{#if browser}
  <ModeWatcher defaultMode="dark" />
  <Toaster richColors position="top-right" />
{/if}
