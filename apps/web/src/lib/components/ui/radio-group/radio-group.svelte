<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';
  import { setContext } from 'svelte';

  export let value = '';
  export let disabled = false;
  export let className: HTMLAttributes<'class'>['class'] = undefined;

  // Provide context for children items
  setContext('radio-group', {
    value: $derived(value),
    disabled,
    setValue: (val: string) => {
      value = val;
    },
  });
</script>

<div
  role="radiogroup"
  class={cn('grid gap-2', className)}
  aria-orientation="vertical"
  onkeydown={(e) => {
    // Handle arrow key navigation
    const items = Array.from(
      e.currentTarget.querySelectorAll('[data-radio-item]:not([disabled])')
    ) as HTMLElement[];
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + items.length) % items.length;
        break;
      default:
        return;
    }

    items[nextIndex]?.focus();
  }}
>
  {@render children()}
</div>
