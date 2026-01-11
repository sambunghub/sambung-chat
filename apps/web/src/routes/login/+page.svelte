<script lang="ts">
  import { SignInForm, SignUpForm } from '@sambung-chat/ui';
  import { authClient } from '$lib/auth-client';
  import { goto } from '$app/navigation';

  let showSignIn = $state(true);

  async function handleSignIn(credentials: { email: string; password: string }) {
    await authClient.signIn.email(credentials, {
      onSuccess: () => goto('/dashboard'),
    });
  }

  async function handleSignUp(credentials: { name: string; email: string; password: string }) {
    await authClient.signUp.email(credentials, {
      onSuccess: () => goto('/dashboard'),
    });
  }
</script>

{#if showSignIn}
  <SignInForm onSubmit={handleSignIn} switchToSignUp={() => (showSignIn = false)} />
{:else}
  <SignUpForm onSubmit={handleSignUp} switchToSignIn={() => (showSignIn = true)} />
{/if}
