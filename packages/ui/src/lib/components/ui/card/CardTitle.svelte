<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  type $$Props = {
    class?: string;
    children: Snippet;
  };

  export let className: $$Props['class'] = undefined;
  export let children: $$Props['children'];
</script>

<h3 class={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...$$restProps}>
  {@render children()}
</h3>
