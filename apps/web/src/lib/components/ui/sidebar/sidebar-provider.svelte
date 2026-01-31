<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  import { cn, type WithElementRef } from '$lib/utils.js';
  import type { HTMLAttributes } from 'svelte/elements';
  import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON } from './constants.js';

  let {
    ref = $bindable(null),
    open = $bindable(true),
    onOpenChange = () => {},
    class: className,
    style,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  } = $props();

  // Track if component is mounted in browser
  let isMounted = $state(false);

  // Only set isMounted to true after client-side hydration
  onMount(() => {
    isMounted = true;
  });
</script>

{#if isMounted}
  <!-- Client-side after hydration: render with Tooltip.Provider -->
  <Tooltip.Provider delayDuration={0}>
    <div
      data-slot="sidebar-wrapper"
      style="--sidebar-width: {SIDEBAR_WIDTH}; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
      class={cn(
        'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full',
        className
      )}
      bind:this={ref}
      {...restProps}
    >
      {#if children}
        {@render children()}
      {/if}
    </div>
  </Tooltip.Provider>
{:else}
  <!-- Server-side and before hydration: render without Tooltip.Provider -->
  <div
    data-slot="sidebar-wrapper"
    style="--sidebar-width: {SIDEBAR_WIDTH}; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
    class={cn(
      'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full',
      className
    )}
    bind:this={ref}
    {...restProps}
  >
    {#if children}
      {@render children()}
    {/if}
  </div>
{/if}
