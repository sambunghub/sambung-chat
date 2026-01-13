<script lang="ts">
  import { createForm } from '@tanstack/svelte-form';
  import { z } from 'zod';
  import { Button } from '../ui/button';
  import { Input } from '../ui/input';
  import { Label } from '../ui/label';
  import { Loader2 } from '@lucide/svelte';

  interface SignUpCredentials {
    name: string;
    email: string;
    password: string;
  }

  interface Props {
    onSubmit?: (credentials: SignUpCredentials) => Promise<void> | void;
    switchToSignIn?: () => void;
    isLoading?: boolean;
  }

  let { onSubmit, switchToSignIn, isLoading = false }: Props = $props();

  // Local state for validation errors
  let validationError = $state<string | null>(null);

  const validationSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  });

  const form = createForm(() => ({
    defaultValues: { name: '', email: '', password: '' },
    onSubmit: async ({ value }) => {
      validationError = null;
      await onSubmit?.(value);
    },
    validators: {
      onSubmit: validationSchema,
    },
    // Handle validation errors at form level
    onInvalidSubmit: ({ formApi }: { value: SignUpCredentials; formApi: any }) => {
      // Get first field error
      const fields = formApi.state.fields;
      for (const [, field] of Object.entries(fields)) {
        const fieldState = field as { errors: string[] };
        if (fieldState.errors.length > 0) {
          validationError = fieldState.errors[0] ?? 'Validation error';
          return;
        }
      }
      validationError = 'Please fix the errors in the form';
    },
  }));
</script>

<div class="space-y-6">
  <!-- Error Alert -->
  {#if validationError}
    <div
      class="p-3 rounded-lg text-sm text-destructive bg-destructive/10 border border-destructive/20 flex items-start gap-2"
      role="alert"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-4 h-4 mt-0.5 shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <circle cx="12" cy="16" r="1" />
      </svg>
      <span>{validationError}</span>
    </div>
  {/if}

  <form
    class="space-y-4"
    onsubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    }}
  >
    <form.Field name="name">
      {#snippet children(field)}
        <div class="space-y-2">
          <Label for={field.name}>Name</Label>
          <Input
            id={field.name}
            name={field.name}
            type="text"
            placeholder="John Doe"
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
            placeholder="Create a strong password"
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
      selector={(state) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
        isValid: state.isValid,
        isTouched: state.isTouched,
      })}
    >
      {#snippet children(state)}
        <Button
          type="submit"
          class="w-full"
          disabled={!state.canSubmit || isLoading || state.isSubmitting}
        >
          {#if isLoading || state.isSubmitting}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            Creating account...
          {:else}
            Create Account
          {/if}
        </Button>
      {/snippet}
    </form.Subscribe>
  </form>

  <div class="text-center text-sm">
    <span class="text-muted-foreground">Already have an account? </span>
    {#if switchToSignIn}
      <button
        type="button"
        class="text-primary font-medium hover:underline text-primary/90 hover:text-primary"
        onclick={switchToSignIn}
      >
        Sign in
      </button>
    {/if}
  </div>
</div>
