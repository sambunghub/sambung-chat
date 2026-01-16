<script lang="ts">
  import LoginForm from '$lib/components/login-form.svelte';
  import { authClient } from '../../../lib/auth-client';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  async function handleSignIn(credentials: { email: string; password: string }) {
    try {
      const result = await authClient.signIn.email(credentials);

      if (result.error) {
        alert('Login failed: ' + (result.error as any)?.message || 'Unknown error');
        return;
      }

      // After successful login, redirect to app
      // Server-side will handle auth check on next request
      const redirectTo = new URLSearchParams($page.url.search).get('redirect') || '/app/chat';
      goto(redirectTo);
    } catch (err) {
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
  <LoginForm onSignIn={handleSignIn} onSSO={handleSSO} />
</div>
