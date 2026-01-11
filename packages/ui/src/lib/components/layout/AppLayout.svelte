<script lang="ts">
  import { cn } from '../../utils';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    rail?: Snippet;
    sidebar?: Snippet;
    mobileNav?: Snippet;
    class?: string;
  }

  let { children, rail, sidebar, mobileNav, class: className = '' }: Props = $props();

  // Responsive breakpoint detection
  let isMobile = $state(false);
  let isTablet = $state(false);

  $effect(() => {
    const checkBreakpoint = () => {
      if (typeof window === 'undefined') return;
      isMobile = window.innerWidth < 768;
      isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  });
</script>

<div class={cn('flex h-screen overflow-hidden bg-background', className)}>
  <!-- Navigation Rail (64px) -->
  {#if !isMobile && rail}
    {@render rail()}
  {/if}

  <!-- Main Content Area -->
  <div class="flex flex-1 overflow-hidden">
    <!-- Secondary Sidebar (280px) -->
    {#if !isMobile && sidebar}
      <div
        class={cn(
          'bg-card border-r border-border transition-all duration-300',
          isTablet ? 'w-16 hover:w-[280px]' : 'w-[280px]'
        )}
      >
        {@render sidebar()}
      </div>
    {/if}

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto">
      {@render children()}
    </main>
  </div>

  <!-- Mobile Bottom Navigation -->
  {#if isMobile && mobileNav}
    <div class="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      {@render mobileNav()}
    </div>
  {/if}
</div>

<style>
  /* Hide scrollbar but keep functionality */
  :global(.overflow-y-auto) {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted-foreground) / 0.3) hsl(var(--muted) / 0.1);
  }

  :global(.overflow-y-auto::-webkit-scrollbar) {
    width: 6px;
  }

  :global(.overflow-y-auto::-webkit-scrollbar-track) {
    background: transparent;
  }

  :global(.overflow-y-auto::-webkit-scrollbar-thumb) {
    background-color: hsl(var(--muted-foreground) / 0.3);
    border-radius: 3px;
  }

  :global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
    background-color: hsl(var(--muted-foreground) / 0.5);
  }
</style>
