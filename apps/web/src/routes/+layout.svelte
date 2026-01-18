<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { ModeWatcher } from 'mode-watcher';
  import '../app.css';

  const { children } = $props();

  // SSR-safe: only render ModeWatcher after mount to prevent hydration issues
  let mounted = $state(false);

  onMount(() => {
    mounted = true;
  });
</script>

<!-- ModeWatcher must be at root level for global theme tracking -->
<!-- Render only after mount to prevent hydration mismatch -->
{#if mounted || browser}
  <ModeWatcher defaultMode="dark" />
{/if}

{@render children()}
