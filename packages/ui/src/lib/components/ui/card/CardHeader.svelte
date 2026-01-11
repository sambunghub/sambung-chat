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

<div class={cn('flex flex-col space-y-1.5 p-6', className)} {...$$restProps}>
  {@render children()}
</div>
