<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
  import { ModeWatcher } from 'mode-watcher';
  import '../../app.css';
  import '@sambung-chat/ui/styles.css';
  import { queryClient } from '../../lib/orpc';
  import { AuthLayout } from '@sambung-chat/ui';

  const { children } = $props();
</script>

<!-- ModeWatcher for global theme tracking on auth pages -->
<ModeWatcher defaultMode="dark" />

<QueryClientProvider client={queryClient}>
  <AuthLayout>
    {@render children()}
  </AuthLayout>
  <SvelteQueryDevtools />
</QueryClientProvider>
