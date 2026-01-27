<script lang="ts">
  import { getContext } from 'svelte';
  import type { Snippet } from 'svelte';
  import { mergeProps as mergeBitsProps } from 'bits-ui';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  type TabsContext = {
    value: string;
    setValue: (value: string) => void;
  };

  type Props = HTMLAttributes<HTMLButtonElement> & {
    value: string;
    children?: Snippet;
  };

  let className: Props['class'] = undefined;
  let { children, value, ...restProps }: Props = $props();

  const context = getContext<TabsContext>('tabs');
  const isSelected = $derived(context?.value === value);
</script>

<button
  class={cn(
    'ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
    isSelected
      ? 'bg-background text-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-background/50',
    className
  )}
  {...mergeBitsProps(restProps, {
    onclick: () => context?.setValue(value),
  })}
  aria-selected={isSelected}
  role="tab"
  type="button"
>
  {#if children}
    {@render children()}
  {/if}
</button>
