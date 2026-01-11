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

<div
  class={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
  {...$$restProps}
>
  {@render children()}
</div>
