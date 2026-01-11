<script lang="ts" module>
  export interface NavLink {
    to: string;
    label: string;
  }

  export interface Props {
    links?: NavLink[];
    user?: any | null;
    isLoadingUser?: boolean;
    onSignIn?: () => void;
    onSignOut?: () => void;
    onNavigate?: (path: string) => void;
  }
</script>

<script lang="ts">
  import UserMenu from '../auth/UserMenu.svelte';

  type Props = import('./Header.svelte').Props;

  let {
    links = [
      { to: '/', label: 'Home' },
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/todos', label: 'Todos' },
      { to: '/ai', label: 'AI Chat' },
    ],
    user,
    isLoadingUser = false,
    onSignIn,
    onSignOut,
    onNavigate,
  }: Props = $props();

  function handleNavigate(path: string) {
    onNavigate?.(path);
  }
</script>

<div>
  <div class="flex flex-row items-center justify-between px-4 py-2 md:px-6">
    <nav class="flex gap-4 text-lg">
      {#each links as link (link.to)}
        <button
          onclick={() => handleNavigate(link.to)}
          class="hover:text-neutral-400 transition-colors"
        >
          {link.label}
        </button>
      {/each}
    </nav>
    <div class="flex items-center gap-2">
      <UserMenu {user} {isLoadingUser} {onSignIn} {onSignOut} />
    </div>
  </div>
  <hr class="border-neutral-800" />
</div>
