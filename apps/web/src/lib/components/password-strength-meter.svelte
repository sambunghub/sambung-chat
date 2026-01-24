<script lang="ts">
	import { browser } from '$app/environment';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { cn } from '$lib/utils.js';
	import { calculatePasswordStrength } from '$lib/utils/password-strength.js';
	import type { HTMLAttributes } from 'svelte/elements';

	export type PasswordStrengthMeterProps = HTMLAttributes<HTMLDivElement> & {
		/** The password to analyze */
		password: string;
		/** Whether to show improvement suggestions */
		showSuggestions?: boolean;
	};

	let {
		password,
		showSuggestions = true,
		class: className,
		...restProps
	}: PasswordStrengthMeterProps = $props();

	// Calculate password strength in real-time using $derived
	const strength = $derived(calculatePasswordStrength(password));

	// Determine color based on strength level
	const strengthColor = $derived(() => {
		switch (strength.level) {
			case 'very_weak':
			case 'weak':
				return 'bg-destructive';
			case 'medium':
				return 'bg-yellow-500';
			case 'strong':
			case 'very_strong':
				return 'bg-green-500';
			default:
				return 'bg-primary';
		}
	});

	// Get display text for strength level
	const strengthText = $derived(() => {
		switch (strength.level) {
			case 'very_weak':
				return 'Very Weak';
			case 'weak':
				return 'Weak';
			case 'medium':
				return 'Medium';
			case 'strong':
				return 'Strong';
			case 'very_strong':
				return 'Very Strong';
			default:
				return '';
		}
	});

	// Only render on client-side when password has content (SSR-safe)
	const shouldRender = $derived(browser && password.length > 0);
</script>

{#if shouldRender}
	<div
		class={cn('space-y-2', className)}
		aria-live="polite"
		aria-atomic="true"
		{...restProps}
	>
		<!-- Progress bar with strength indicator -->
		<div class="space-y-1">
			<div class="flex items-center justify-between text-sm">
				<span class="text-muted-foreground font-medium">Password strength</span>
				<span class={cn('font-semibold', strengthColor())}>{strengthText()}</span>
			</div>
			<Progress value={strength.percentage} class="h-2" />
		</div>

		<!-- Suggestions for improvement -->
		{#if showSuggestions && strength.suggestions.length > 0}
			<div class="rounded-md bg-muted/50 p-3">
				<p class="text-sm font-medium text-muted-foreground mb-1.5">
					Suggestions to improve:
				</p>
				<ul class="space-y-1">
					{#each strength.suggestions as suggestion}
						<li class="text-sm text-muted-foreground flex items-start gap-2">
							<span class="text-destructive mt-0.5">•</span>
							<span>{suggestion}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
{/if}
