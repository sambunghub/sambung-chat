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

<p class={cn('text-sm text-muted-foreground', className)} {...$$restProps}>
  {@render children?.()}
</p>
