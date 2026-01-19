<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(async () => {
    try {
      // Sign out from Better Auth - this clears session cookies
      await authClient.signOut();
    } catch (error) {
      console.error('[Logout Error]', error);
    } finally {
      // Always redirect to login after logout attempt
      goto('/login', { replaceState: true });
    }
  });
</script>

<div class="flex h-screen items-center justify-center">
  <p class="text-muted-foreground">Signing out...</p>
</div>
