<script lang="ts">
	import { createForm } from '@tanstack/svelte-form';
	import { z } from 'zod';

	interface SignInCredentials {
		email: string;
		password: string;
	}

	interface Props {
		onSubmit?: (credentials: SignInCredentials) => Promise<void> | void;
		switchToSignUp?: () => void;
	}

	let { onSubmit, switchToSignUp }: Props = $props();

	const validationSchema = z.object({
		email: z.string().email('Invalid email address'),
		password: z.string().min(1, 'Password is required'),
	});

	const form = createForm(() => ({
		defaultValues: { email: '', password: '' },
		onSubmit: async ({ value }) => {
			await onSubmit?.(value);
		},
		validators: {
			onSubmit: validationSchema,
		},
	}));
</script>

<div class="mx-auto mt-10 w-full max-w-md p-6">
	<h1 class="mb-6 text-center font-bold text-3xl">Welcome Back</h1>

	<form
		class="space-y-4"
		onsubmit={(e) => {
			e.preventDefault();
			e.stopPropagation();
			form.handleSubmit();
		}}
	>
		<form.Field name="email">
			{#snippet children(field)}
				<div class="space-y-1">
					<label for={field.name}>Email</label>
					<input
						id={field.name}
						name={field.name}
						type="email"
						class="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-[hsl(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--color-primary))] disabled:opacity-50"
						onblur={field.handleBlur}
						value={field.state.value}
						oninput={(e: Event) => {
							const target = e.target as HTMLInputElement;
							field.handleChange(target.value);
						}}
					/>
					{#if field.state.meta.isTouched}
						{#each field.state.meta.errors as error}
							<p class="text-sm text-red-500" role="alert">{error}</p>
						{/each}
					{/if}
				</div>
			{/snippet}
		</form.Field>

		<form.Field name="password">
			{#snippet children(field)}
				<div class="space-y-1">
					<label for={field.name}>Password</label>
					<input
						id={field.name}
						name={field.name}
						type="password"
						class="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-[hsl(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--color-primary))] disabled:opacity-50"
						onblur={field.handleBlur}
						value={field.state.value}
						oninput={(e: Event) => {
							const target = e.target as HTMLInputElement;
							field.handleChange(target.value);
						}}
					/>
					{#if field.state.meta.isTouched}
						{#each field.state.meta.errors as error}
							<p class="text-sm text-red-500" role="alert">{error}</p>
						{/each}
					{/if}
				</div>
			{/snippet}
		</form.Field>

		<form.Subscribe
			selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
		>
			{#snippet children(state)}
				<button
					type="submit"
					class="w-full rounded bg-[hsl(var(--color-primary))] px-4 py-2 font-semibold text-white hover:bg-[hsl(var(--color-primary-hover))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!state.canSubmit || state.isSubmitting}
				>
					{state.isSubmitting ? 'Submitting...' : 'Sign In'}
				</button>
			{/snippet}
		</form.Subscribe>
	</form>

	{#if switchToSignUp}
		<div class="mt-4 text-center">
			<button
				type="button"
				class="text-[hsl(var(--color-accent))] hover:text-[hsl(var(--color-accent-hover))]"
				onclick={switchToSignUp}
			>
				Need an account? Sign Up
			</button>
		</div>
	{/if}
</div>
