<script lang="ts">
  import { mergeProps as mergeBitsProps } from 'bits-ui';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  type Props = HTMLAttributes<HTMLDivElement>;

  let className: Props['class'] = undefined;
  let { children, ...restProps }: Props = $props();
</script>

<div
  class={cn(
    'bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-lg p-1',
    className
  )}
  {...mergeBitsProps(restProps)}
>
  {@render children?.()}
</div>
