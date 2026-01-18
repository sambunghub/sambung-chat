<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { cn } from '$lib/utils.js';
  import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
  import type { ComponentProps } from 'svelte';
  import { useSidebar } from './context.svelte.js';

  let {
    ref = $bindable(null),
    class: className,
    onclick,
    ...restProps
  }: ComponentProps<typeof Button> & {
    onclick?: (e: MouseEvent) => void;
  } = $props();

  const sidebar = useSidebar();

  function handleToggle(e: MouseEvent) {
    onclick?.(e);
    // Safe toggle with fallback
    if (sidebar?.toggle) {
      sidebar.toggle();
    }
  }
</script>

<Button
  data-sidebar="trigger"
  data-slot="sidebar-trigger"
  variant="ghost"
  size="icon"
  class={cn('size-7', className)}
  type="button"
  onclick={handleToggle}
  {...restProps}
>
  <PanelLeftIcon />
  <span class="sr-only">Toggle Sidebar</span>
</Button>
