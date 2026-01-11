<script lang="ts">
  interface Props {
    text: string;
    speed?: number;
    variation?: number;
    class?: string;
  }

  let { text, speed = 10, variation = 0, class: className = '' }: Props = $props();

  let display = $state('');
  let interval: ReturnType<typeof setInterval> | null = null;
  let isComplete = $state(false);
  let isBrowser = $state(false);

  // Check if we're in browser environment
  $effect(() => {
    isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  });

  // Typing effect using Svelte 5 runes
  $effect(() => {
    // Reset when text changes
    display = '';
    isComplete = false;

    if (!isBrowser || !text) return;

    let i = 0;
    const chars = text.split('');

    // Clear any existing interval
    if (interval) clearInterval(interval);

    // Start typing effect
    interval = setInterval(
      () => {
        if (i < chars.length) {
          display += chars[i];
          i++;
        } else {
          isComplete = true;
          if (interval) clearInterval(interval);
        }
      },
      speed + Math.random() * variation
    );

    return () => {
      if (interval) clearInterval(interval);
    };
  });
</script>

<span class={className}>
  {display}
  {#if !isComplete && text.length > 0}
    <span class="inline-block w-2 h-4 bg-current animate-pulse ml-1">&nbsp;</span>
  {/if}
</span>
