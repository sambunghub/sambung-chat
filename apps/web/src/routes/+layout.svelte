<script lang="ts">
    import { QueryClientProvider } from '@tanstack/svelte-query';
    import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import '../app.css';
	import '@sambung-chat/ui/styles.css';
    import { queryClient } from '$lib/orpc';
    import { LayoutHeader } from '@sambung-chat/ui';
    import { authClient } from '$lib/auth-client';
    import { goto } from '$app/navigation';

	const { children } = $props();

	const sessionQuery = authClient.useSession();
</script>

<QueryClientProvider client={queryClient}>
    <div class="grid h-svh grid-rows-[auto_1fr]">
		<LayoutHeader
			user={$sessionQuery.data?.user}
			isLoadingUser={$sessionQuery.isPending}
			onNavigate={(path) => goto(path)}
			onSignIn={() => goto('/login')}
			onSignOut={async () => {
				await authClient.signOut({
					fetchOptions: {
						onSuccess: () => goto('/')
					}
				});
			}}
		/>
		<main class="overflow-y-auto">
			{@render children()}
		</main>
    </div>
    <SvelteQueryDevtools />
</QueryClientProvider>
