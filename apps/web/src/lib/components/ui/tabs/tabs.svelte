<script lang="ts">
  import { setContext } from 'svelte';
  import type { Snippet } from 'svelte';
  import { mergeProps as mergeBitsProps } from 'bits-ui';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  type TabsContext = {
    value: string;
    setValue: (value: string) => void;
  };

  type Props = HTMLAttributes<HTMLDivElement> & {
    children: Snippet;
    value?: string;
    onValueChange?: (value: string) => void;
    defaultValue?: string;
  };

  let className: Props['class'] = undefined;
  let {
    children,
    value: controlledValue,
    onValueChange,
    defaultValue,
    ...restProps
  }: Props = $props();

  let internalValue = $state(defaultValue ?? '0');

  const value = $derived(controlledValue ?? internalValue);

  function setValue(newValue: string) {
    if (controlledValue === undefined) {
      internalValue = newValue;
    }
    onValueChange?.(newValue);
  }

  setContext<TabsContext>('tabs', {
    value,
    setValue,
  });
</script>

<div class={cn('w-full', className)} {...mergeBitsProps(restProps)} data-value={value}>
  {@render children()}
</div>
