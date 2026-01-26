<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let value: number[] = [0];
  export let disabled = false;
  export let className: HTMLAttributes<'class'>['class'] = undefined;
  export let oninput: ((value: number) => void) | undefined = undefined;

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const newValue = Number(target.value);
    value = [newValue];
    oninput?.(newValue);
  }
</script>

<div class={cn('relative flex w-full items-center', className)}>
  <input
    type="range"
    {min}
    {max}
    {step}
    {value}
    {disabled}
    oninput={handleInput}
    class="bg-secondary h-2 w-full cursor-pointer appearance-none rounded-full [clip-path:inset(0_0_0_0_round_theme('radius'))]"
    style="background-image: linear-gradient(var(--primary), var(--primary)); background-size: {((value[0] -
      min) /
      (max - min)) *
      100}% 100%; background-repeat: no-repeat;"
    class:opacity-50={disabled}
    aria-valuenow={value[0]}
    aria-valuemin={min}
    aria-valuemax={max}
  />
  <style>
    input[type='range']::-webkit-slider-thumb {
      appearance: none;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 50%;
      background: hsl(var(--primary));
      cursor: pointer;
      border: 2px solid hsl(var(--background));
      box-shadow: 0 0 0 1px hsl(var(--primary));
    }

    input[type='range']::-moz-range-thumb {
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 50%;
      background: hsl(var(--primary));
      cursor: pointer;
      border: 2px solid hsl(var(--background));
      box-shadow: 0 0 0 1px hsl(var(--primary));
    }

    input[type='range']:focus::-webkit-slider-thumb {
      box-shadow: 0 0 0 4px hsl(var(--primary) / 0.2);
    }

    input[type='range']:focus::-moz-range-thumb {
      box-shadow: 0 0 0 4px hsl(var(--primary) / 0.2);
    }

    input[type='range']:disabled::-webkit-slider-thumb {
      cursor: not-allowed;
      opacity: 0.5;
    }

    input[type='range']:disabled::-moz-range-thumb {
      cursor: not-allowed;
      opacity: 0.5;
    }
  </style>
</div>
