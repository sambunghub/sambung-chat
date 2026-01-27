<script lang="ts">
  import RegisterForm from '$lib/components/register-form.svelte';
  import { authClient } from '../../../lib/auth-client';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  interface PageData {
    showSSO: boolean;
    showEmailPassword: boolean;
  }

  export let data: PageData;

  async function handleSignUp(credentials: { name: string; email: string; password: string }) {
    try {
      const result = await authClient.signUp.email(credentials);

      if (result.error) {
        type AuthError = { message?: string };
        const errorMsg = (result.error as AuthError)?.message || 'Unknown error';
        alert('Sign up failed: ' + errorMsg);
        return;
      }

      // After successful signup, redirect to app
      // Server-side will handle auth check on next request
      const redirectTo = new URLSearchParams($page.url.search).get('redirect') || '/app/chat';
      goto(redirectTo);
    } catch {
      alert('An unexpected error occurred');
    }
  }

  async function handleSSO() {
    try {
      const callbackURL = `${$page.url.origin}/app/chat`;
      // Use oauth2 for generic OAuth providers like Keycloak
      await authClient.signIn.oauth2({
        providerId: 'keycloak',
        callbackURL,
      });
    } catch {
      alert('SSO failed: Please try again');
    }
  }
</script>

<div class="w-full max-w-sm">
  <h1 class="sr-only">Create your account</h1>
  <RegisterForm
    onSignUp={data?.showEmailPassword ? handleSignUp : undefined}
    onSSO={data?.showSSO ? handleSSO : undefined}
    showSSO={data?.showSSO ?? false}
    showEmailPassword={data?.showEmailPassword ?? true}
  />
</div>
