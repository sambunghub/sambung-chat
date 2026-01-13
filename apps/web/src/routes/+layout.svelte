<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
  import { ModeWatcher } from 'mode-watcher';
  import '../app.css';
  import '@sambung-chat/ui/styles.css';
  import { queryClient } from '../lib/orpc';
  import { LayoutHeader } from '@sambung-chat/ui';
  import { authClient } from '../lib/auth-client';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // Dynamic import Toaster for client-side only rendering
  import { onMount } from 'svelte';
  let ToasterComponent = $state<any>(null);

  onMount(async () => {
    const { Toaster } = await import('@sambung-chat/ui');
    ToasterComponent = Toaster;
  });

  const { children } = $props();

  const sessionQuery = authClient.useSession();

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/todos', '/ai'];

  // Redirect to login if accessing protected route without session
  $effect(() => {
    if ($sessionQuery.isPending) return;

    const isProtectedRoute = protectedRoutes.some((route) => $page.url.pathname.startsWith(route));

    if (isProtectedRoute && !$sessionQuery.data?.user) {
      goto('/login');
    }
  });
</script>

<!-- ModeWatcher must be at root level for global theme tracking -->
<ModeWatcher defaultMode="dark" />

<QueryClientProvider client={queryClient}>
  <div class="grid h-svh grid-rows-[auto_1fr]">
    <LayoutHeader
      user={$sessionQuery.data?.user}
      isLoadingUser={$sessionQuery.isPending}
      onNavigate={(path) => goto(path)}
      onSignIn={() => goto('/login')}
      onSignOut={async () => {
        await authClient.signOut();
        goto('/login');
      }}
    />
    <main class="overflow-y-auto">
      {@render children()}
    </main>
  </div>
  <SvelteQueryDevtools />
  {#if ToasterComponent}
    {@const Toaster = ToasterComponent}
    <Toaster />
  {/if}
</QueryClientProvider>
