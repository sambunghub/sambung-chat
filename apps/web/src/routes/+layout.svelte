<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
  import '../app.css';
  import '@sambung-chat/ui/styles.css';
  import { queryClient } from '$lib/orpc';
  import { LayoutHeader } from '@sambung-chat/ui';
  import { authClient } from '$lib/auth-client';
  import { goto, page } from '$app/navigation';

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
</QueryClientProvider>
