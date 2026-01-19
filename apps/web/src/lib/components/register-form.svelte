<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import {
    FieldGroup,
    Field,
    FieldLabel,
    FieldDescription,
  } from '$lib/components/ui/field/index.js';

  interface Props {
    onSignUp?: (credentials: { name: string; email: string; password: string }) => void;
    onSSO?: () => void;
    showSSO?: boolean;
    showEmailPassword?: boolean;
  }

  let { onSignUp, onSSO, showSSO = false, showEmailPassword = true }: Props = $props();

  // Ensure boolean values for SSR/client consistency
  const shouldShowSSO = $derived(Boolean(showSSO));
  const shouldShowEmailPassword = $derived(Boolean(showEmailPassword));

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let isSubmitting = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!name || !email || !password || isSubmitting) return;

    isSubmitting = true;
    try {
      await onSignUp?.({ name, email, password });
    } finally {
      isSubmitting = false;
    }
  }

  async function handleSSO() {
    if (isSubmitting) return;
    isSubmitting = true;
    try {
      await onSSO?.();
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Card.Root class="mx-auto w-full max-w-sm">
  <Card.Header>
    <Card.Title class="text-2xl">Create an account</Card.Title>
    <Card.Description>Enter your details to get started</Card.Description>
  </Card.Header>
  <Card.Content>
    <form onsubmit={handleSubmit}>
      <FieldGroup>
        {#if shouldShowEmailPassword}
          <Field>
            <FieldLabel for="name">Name</FieldLabel>
            <Input
              id="name"
              type="text"
              bind:value={name}
              placeholder="John Doe"
              required
              disabled={isSubmitting}
            />
          </Field>
          <Field>
            <FieldLabel for="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              bind:value={email}
              placeholder="m@example.com"
              required
              disabled={isSubmitting}
            />
          </Field>
          <Field>
            <FieldLabel for="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              bind:value={password}
              placeholder="Create a password"
              required
              disabled={isSubmitting}
            />
          </Field>
          <Field>
            <Button
              type="submit"
              class="w-full"
              disabled={isSubmitting || !name || !email || !password}
            >
              {isSubmitting ? 'Creating account...' : 'Sign Up'}
            </Button>
          </Field>
        {/if}

        {#if shouldShowSSO}
          <Field>
            <Button
              type="button"
              variant="outline"
              class="w-full"
              onclick={handleSSO}
              disabled={isSubmitting}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                class="mr-2 h-4 w-4"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
                  fill="currentColor"
                  opacity="0.3"
                />
                <path
                  d="M17 9V7c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V11c0-1.1-.9-2-2-2zm-6-2h4v2h-4V7zm6 12H9V11h8v8z"
                  fill="currentColor"
                />
                <path d="M13 14h-2v2h2v-2z" fill="currentColor" />
              </svg>
              {isSubmitting ? 'Redirecting...' : 'Sign Up with Keycloak'}
            </Button>
          </Field>
        {/if}

        <FieldDescription class="text-center">
          Already have an account? <a href="/login" class="underline">Sign in</a>
        </FieldDescription>
      </FieldGroup>
    </form>
  </Card.Content>
</Card.Root>
