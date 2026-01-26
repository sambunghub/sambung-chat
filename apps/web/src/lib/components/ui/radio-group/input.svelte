<script lang="ts">
  import { cn } from '$lib/utils';

  export let value: string;
  export let disabled = false;
  export let isChecked = $state(false);

  // Actual hidden input for form submission
  export let inputElement: HTMLInputElement;

  // Update checked state from parent
  $effect(() => {
    isChecked = value === parentValue;
  });

  // Forward value from parent
  let parentValue = $state('');

  // Set from parent via prop
  export function setParentValue(val: string) {
    parentValue = val;
  }
</script>

<input
  type="radio"
  bind:this={inputElement}
  {value}
  {disabled}
  {isChecked}
  class={cn(
    'border-primary text-primary ring-offset-background focus-visible:ring-ring aspect-square h-4 w-4 rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
  )}
  onchange={(e) => {
    isChecked = e.currentTarget.checked;
  }}
  aria-hidden="true"
  tabindex="-1"
  style="position: absolute; opacity: 0; pointer-events: none;"
/>
