<script lang="ts">
  import { cn } from '../../utils';
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    description?: string;
    showLogo?: boolean;
    class?: string;
    children: Snippet;
    footer?: Snippet;
  }

  let {
    title = '',
    description = '',
    showLogo = true,
    class: className = '',
    children,
    footer,
  }: Props = $props();
</script>

<div
  class={cn('min-h-screen flex items-center justify-center bg-background px-4 py-12', className)}
>
  <div class="w-full max-w-md">
    <!-- Logo Section -->
    {#if showLogo}
      <div class="flex flex-col items-center mb-8">
        <div class="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mb-4">
          <span class="text-2xl font-bold text-primary-foreground">SC</span>
        </div>
        <h1 class="text-2xl font-bold text-foreground">SambungChat</h1>
        <p class="text-sm text-muted-foreground">Connect any AI model. Self-hosted.</p>
      </div>
    {/if}

    <!-- Card Container -->
    <div class="bg-card border border-border rounded-lg shadow-sm p-8">
      <!-- Title & Description -->
      {#if title || description}
        <div class="mb-6">
          {#if title}
            <h2 class="text-xl font-semibold text-foreground">{title}</h2>
          {/if}
          {#if description}
            <p class="text-sm text-muted-foreground mt-1">{description}</p>
          {/if}
        </div>
      {/if}

      <!-- Form Content -->
      {@render children()}
    </div>

    <!-- Footer -->
    {#if footer}
      <div class="mt-6">
        {@render footer()}
      </div>
    {:else}
      <p class="mt-6 text-center text-xs text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    {/if}
  </div>
</div>

<style>
  /* Subtle background pattern */
  div {
    background-image: radial-gradient(
      circle at 1px 1px,
      hsl(var(--muted-foreground) / 0.05) 1px,
      transparent 0
    );
    background-size: 24px 24px;
  }
</style>
