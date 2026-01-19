<script lang="ts">
  import { authClient } from '../lib/auth-client';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let mounted = $state(false);
  const sessionQuery = authClient.useSession();

  onMount(() => {
    mounted = true;
  });

  $effect(() => {
    if (mounted && !$sessionQuery.isPending) {
      if ($sessionQuery.data?.user) {
        goto('/app/chat');
      } else {
        goto('/login');
      }
    }
  });
</script>

<div class="flex h-screen items-center justify-center">
  <p class="text-muted-foreground">Loading...</p>
</div>
