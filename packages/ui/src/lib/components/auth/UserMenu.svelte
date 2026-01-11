<script lang="ts" module>
	export interface Props {
		user?: any | null;
		isLoadingUser?: boolean;
		onSignIn?: () => void;
		onSignOut?: () => void;
	}
</script>

<script lang="ts">
	let {
		user,
		isLoadingUser = false,
		onSignIn,
		onSignOut
	}: import("./UserMenu.svelte").Props = $props();
</script>

<div class="relative">
	{#if isLoadingUser}
		<div class="h-8 w-24 animate-pulse rounded bg-neutral-700"></div>
	{:else if user}
		<div class="flex items-center gap-3">
			<span class="text-sm text-neutral-300 hidden sm:inline" title={user?.email ?? ''}>
				{user?.name || user?.email?.split('@')[0] || 'User'}
			</span>
			<button
				onclick={() => onSignOut?.()}
				class="rounded px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white transition-colors"
			>
				Sign Out
			</button>
		</div>
	{:else}
		<div class="flex items-center gap-2">
			<button
				onclick={() => onSignIn?.()}
				class="rounded px-3 py-1 text-sm bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white transition-colors"
			>
				Sign In
			</button>
		</div>
	{/if}
</div>
