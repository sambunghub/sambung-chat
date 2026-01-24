<script lang="ts">
	import { browser } from '$app/environment';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import { cn } from '$lib/utils.js';
	import { getPasswordRequirements } from '$lib/utils/password-strength.js';
	import type { HTMLAttributes } from 'svelte/elements';

	export type PasswordRequirementsProps = HTMLAttributes<HTMLDivElement> & {
		/** The password to check requirements against */
		password: string;
	};

	let {
		password,
		class: className,
		...restProps
	}: PasswordRequirementsProps = $props();

	// Get requirements checklist using $derived for real-time updates
	const requirements = $derived(getPasswordRequirements(password));

	// SSR-safe: only render on client-side
	const shouldRender = $derived(browser);
</script>

{#if shouldRender}
	<div
		class={cn('space-y-2 text-sm', className)}
		role="list"
		aria-label="Password requirements"
		{...restProps}
	>
		{#each requirements as requirement}
			<div
				class="flex items-center gap-2"
				role="listitem"
				aria-label={requirement.met ? `${requirement.label} - met` : `${requirement.label} - not met`}
			>
				{#if requirement.met}
					<CheckCircle2Icon
						class="h-4 w-4 text-green-500 flex-shrink-0"
						aria-hidden="true"
					/>
				{:else}
					<XCircleIcon class="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
				{/if}
				<span
					class={cn(
						'text-muted-foreground',
						requirement.met && 'text-green-600 dark:text-green-400'
					)}
				>
					{requirement.label}
				</span>
			</div>
		{/each}
	</div>
{/if}
