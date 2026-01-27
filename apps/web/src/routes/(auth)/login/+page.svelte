<script lang="ts">
  import LoginForm from '$lib/components/login-form.svelte';
  import { authClient } from '../../../lib/auth-client';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  interface PageData {
    showSSO: boolean;
    showEmailPassword: boolean;
  }

  export let data: PageData;

  async function handleSignIn(credentials: { email: string; password: string }) {
    try {
      const result = await authClient.signIn.email(credentials);

      if (result.error) {
        type AuthError = { message?: string };
        const errorMsg = (result.error as AuthError)?.message || 'Unknown error';
        alert('Login failed: ' + errorMsg);
        return;
      }

      // After successful login, redirect to app
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
  <h1 class="sr-only">Sign in to your account</h1>
  <LoginForm
    onSignIn={data?.showEmailPassword ? handleSignIn : undefined}
    onSSO={data?.showSSO ? handleSSO : undefined}
    showSSO={data?.showSSO ?? false}
    showEmailPassword={data?.showEmailPassword ?? true}
  />
</div>
