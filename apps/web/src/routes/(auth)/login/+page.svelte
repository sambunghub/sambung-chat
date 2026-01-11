<script lang="ts">
  import { SignInForm, SignUpForm } from '@sambung-chat/ui';
  import { authClient } from '$lib/auth-client';
  import { goto } from '$app/navigation';

  let showSignIn = $state(true);

  async function handleSignIn(credentials: { email: string; password: string }) {
    const result = await authClient.signIn.email(credentials);

    if (result.error) {
      console.error('Sign in error:', result.error);
      return;
    }

    goto('/dashboard');
  }

  async function handleSignUp(credentials: { name: string; email: string; password: string }) {
    const result = await authClient.signUp.email(credentials);

    if (result.error) {
      console.error('Sign up error:', result.error);
      return;
    }

    goto('/dashboard');
  }
</script>

{#if showSignIn}
  <SignInForm onSubmit={handleSignIn} switchToSignUp={() => (showSignIn = false)} />
{:else}
  <SignUpForm onSubmit={handleSignUp} switchToSignIn={() => (showSignIn = true)} />
{/if}
