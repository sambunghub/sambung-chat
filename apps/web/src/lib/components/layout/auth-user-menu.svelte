<script lang="ts" module>
  interface User {
    name?: string;
    email?: string;
  }

  export interface Props {
    user?: User | null;
    isLoadingUser?: boolean;
    onSignIn?: () => void;
    onSignOut?: () => void;
  }
</script>

<script lang="ts">
  let { user, isLoadingUser = false, onSignIn, onSignOut }: Props = $props();
</script>

<div class="relative">
  {#if isLoadingUser}
    <div class="h-8 w-24 animate-pulse rounded bg-neutral-700"></div>
  {:else if user}
    <div class="flex items-center gap-3">
      <span class="hidden text-sm text-neutral-300 sm:inline" title={user?.email ?? ''}>
        {user?.name || user?.email?.split('@')[0] || 'User'}
      </span>
      <button
        onclick={() => onSignOut?.()}
        class="rounded bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-700"
      >
        Sign Out
      </button>
    </div>
  {:else}
    <div class="flex items-center gap-2">
      <button
        onclick={() => onSignIn?.()}
        class="rounded bg-[hsl(var(--color-primary))] px-3 py-1 text-sm text-white transition-colors hover:bg-[hsl(var(--color-primary-hover))]"
      >
        Sign In
      </button>
    </div>
  {/if}
</div>
