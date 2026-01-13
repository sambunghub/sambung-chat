<script lang="ts">
  import { Button } from '../ui/button';

  interface Props {
    user?: { id: string; name: string; email: string } | null;
    isLoadingUser?: boolean;
    onNavigate?: (path: string) => void;
    onSignIn?: () => void;
    onSignOut?: () => Promise<void>;
  }

  let { user = null, isLoadingUser = false, onNavigate, onSignIn, onSignOut }: Props = $props();
</script>

<header
  class="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
  <div class="container flex h-14 items-center justify-between px-4">
    <div class="flex items-center gap-6">
      <a
        href="/"
        onclick={(e) => {
          e.preventDefault();
          onNavigate?.('/');
        }}
        class="flex items-center space-x-2"
      >
        <span class="font-bold text-xl">SambungChat</span>
      </a>
      <nav class="flex items-center gap-4 text-sm">
        <a
          href="/todos"
          onclick={(e) => {
            e.preventDefault();
            onNavigate?.('/todos');
          }}
          class="transition-colors hover:text-foreground/80 text-foreground/60"
        >
          Todos
        </a>
        <a
          href="/ai"
          onclick={(e) => {
            e.preventDefault();
            onNavigate?.('/ai');
          }}
          class="transition-colors hover:text-foreground/80 text-foreground/60"
        >
          AI Chat
        </a>
      </nav>
    </div>

    <div class="flex items-center gap-2">
      <!-- Light/Dark mode toggle - temporarily hidden -->
      <!-- <button
				onclick={toggleMode}
				class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
				type="button"
			>
				{#if currentMode === 'dark'}
					<Sun class="size-5" />
				{:else}
					<Moon class="size-5" />
				{/if}
			</button> -->

      {#if isLoadingUser}
        <div class="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
      {:else if user}
        <div class="flex items-center gap-3">
          <div class="text-sm">
            <p class="font-medium">{user.name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onclick={async () => {
              await onSignOut?.();
            }}
          >
            Sign Out
          </Button>
        </div>
      {:else}
        <Button
          size="sm"
          onclick={() => {
            onSignIn?.();
          }}
        >
          Sign In
        </Button>
      {/if}
    </div>
  </div>
</header>
