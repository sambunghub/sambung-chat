<script lang="ts">
  import { createForm } from '@tanstack/svelte-form';
  import { z } from 'zod';
  import { Button } from '../ui/button';
  import { Input } from '../ui/input';
  import { Label } from '../ui/label';
  import { Loader2 } from '@lucide/svelte';

  interface SignInCredentials {
    email: string;
    password: string;
  }

  interface Props {
    onSubmit?: (credentials: SignInCredentials) => Promise<void> | void;
    switchToSignUp?: () => void;
    isLoading?: boolean;
  }

  let { onSubmit, switchToSignUp, isLoading = false }: Props = $props();

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

<div class="space-y-6">
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
        <div class="space-y-2">
          <Label for={field.name}>Email</Label>
          <Input
            id={field.name}
            name={field.name}
            type="email"
            placeholder="name@example.com"
            required
            disabled={isLoading}
            onblur={field.handleBlur}
            value={field.state.value}
            oninput={(e: Event) => {
              const target = e.target as HTMLInputElement;
              field.handleChange(target.value);
            }}
          />
          {#if field.state.meta.isTouched && field.state.meta.errors.length > 0}
            <p class="text-sm text-destructive" role="alert">
              {field.state.meta.errors[0]}
            </p>
          {/if}
        </div>
      {/snippet}
    </form.Field>

    <form.Field name="password">
      {#snippet children(field)}
        <div class="space-y-2">
          <Label for={field.name}>Password</Label>
          <Input
            id={field.name}
            name={field.name}
            type="password"
            placeholder="Enter your password"
            required
            disabled={isLoading}
            onblur={field.handleBlur}
            value={field.state.value}
            oninput={(e: Event) => {
              const target = e.target as HTMLInputElement;
              field.handleChange(target.value);
            }}
          />
          {#if field.state.meta.isTouched && field.state.meta.errors.length > 0}
            <p class="text-sm text-destructive" role="alert">
              {field.state.meta.errors[0]}
            </p>
          {/if}
        </div>
      {/snippet}
    </form.Field>

    <form.Subscribe
      selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
    >
      {#snippet children(state)}
        <Button
          type="submit"
          class="w-full"
          disabled={!state.canSubmit || isLoading || state.isSubmitting}
        >
          {#if isLoading || state.isSubmitting}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            Signing in...
          {:else}
            Sign In
          {/if}
        </Button>
      {/snippet}
    </form.Subscribe>
  </form>

  <div class="text-center text-sm">
    <span class="text-muted-foreground">Don't have an account? </span>
    {#if switchToSignUp}
      <button
        type="button"
        class="text-primary font-medium hover:underline text-primary/90 hover:text-primary"
        onclick={switchToSignUp}
      >
        Sign up
      </button>
    {/if}
  </div>
</div>
