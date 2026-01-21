<script lang="ts">
  import { browser } from '$app/environment';
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
</script>

{#if browser}
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
  <!-- Server-side: render without Tooltip.Provider to avoid hydration issues -->
  <div
    data-slot="sidebar-wrapper"
    style="--sidebar-width: {SIDEBAR_WIDTH}; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
    class={cn(
      'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full',
      className
    )}
    {...restProps}
  >
    {#if children}
      {@render children()}
    {/if}
  </div>
{/if}
