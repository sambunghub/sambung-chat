<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import type { Snippet } from 'svelte';
  import { themeStore } from '../../stores';

  interface Props {
    storageKey?: string;
    defaultTheme?: 'light' | 'dark' | 'system';
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    children?: Snippet;
  }

  let {
    storageKey = 'sambungchat-ui-theme',
    defaultTheme = 'system',
    enableSystem = true,
    disableTransitionOnChange = false,
    children,
  }: Props = $props();

  let isBrowser = $state(false);

  $effect(() => {
    isBrowser = typeof window !== 'undefined';
  });

  // Initialize theme on mount
  onMount(() => {
    if (!isBrowser) return;

    // Get stored theme or use default
    const storedTheme = localStorage.getItem(storageKey) as 'light' | 'dark' | 'system' | null;
    const theme = storedTheme ?? defaultTheme;
    themeStore.setTheme(theme);

    // Listen for system theme changes when in 'system' mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const currentTheme = get(themeStore);
      if (currentTheme.theme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        themeStore.setTheme('system'); // Re-apply system theme
      }
    };

    // Use addEventListener with modern browser support
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  });

  // Apply theme transition disable if needed
  function disableTrans() {
    if (!isBrowser) return;
    document.documentElement.classList.add('no-transition');
  }

  function enableTrans() {
    if (!isBrowser) return;
    setTimeout(() => {
      document.documentElement.classList.remove('no-transition');
    }, 0);
  }
</script>

{@render children?.()}

<style>
  /* Disable transitions during theme change */
  :global(.no-transition),
  :global(.no-transition *) {
    transition-property: none !important;
  }
</style>
