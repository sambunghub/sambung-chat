<script lang="ts">
  import { goto } from '$app/navigation';
  import { orpc } from '../../lib/orpc';
  import { onMount } from 'svelte';

  let { data }: { data: { user?: Record<string, unknown> } | undefined } = $props();

  let privateData = $state<{ message: string } | null>(null);
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  // Get user from page data (SSR-safe)
  const user = $derived(data?.user);

  $effect(() => {
    if (!user) {
      goto('/login');
    }
  });

  // Load private data on mount when authenticated
  onMount(async () => {
    if (user && typeof window !== 'undefined') {
      await loadPrivateData();
    }
  });

  async function loadPrivateData() {
    isLoading = true;
    error = null;
    try {
      privateData = await orpc.privateData();
    } catch (err) {
      error = (err as Error)?.message ?? 'Failed to load private data';
      console.error('Failed to load private data:', err);
    } finally {
      isLoading = false;
    }
  }
</script>

{#if !user}
  <div>Redirecting to login...</div>
{:else if isLoading}
  <div>Loading...</div>
{:else if error}
  <div>Error: {error}</div>
{:else}
  <div>
    <h1>Dashboard</h1>
    <p>Welcome {user.name}</p>
    <p>API: {privateData?.message}</p>
  </div>
{/if}
