<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getContext } from 'svelte';
  import Input from './input.svelte';

  export let value: string;
  export let disabled = false;
  export let className: HTMLAttributes<'class'>['class'] = undefined;

  const radioGroup = getContext<{
    value: string;
    disabled: boolean;
    setValue: (val: string) => void;
  }>('radio-group');

  const isChecked = $derived(radioGroup?.value === value);
  const isDisabled = $derived(disabled || radioGroup?.disabled);

  function handleClick() {
    if (!isDisabled) {
      radioGroup?.setValue(value);
    }
  }
</script>

<div
  data-radio-item=""
  role="radio"
  aria-checked={isChecked}
  aria-disabled={isDisabled}
  tabindex={isChecked ? 0 : -1}
  onclick={handleClick}
  onkeydown={(e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  }}
  class={cn(
    'relative flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-all',
    'hover:bg-accent hover:text-accent-foreground',
    'focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-none',
    isDisabled && 'cursor-not-allowed opacity-50',
    isChecked && 'border-primary bg-primary text-primary-foreground',
    className
  )}
>
  <Input {value} disabled={isDisabled} {isChecked} />
  {@render children()}
</div>
