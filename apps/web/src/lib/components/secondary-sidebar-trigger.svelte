<script lang="ts">
  import { secondarySidebarStore } from '$lib/stores/secondary-sidebar.js';
  import PanelLeftOpenIcon from '@lucide/svelte/icons/panel-left-open';
  import PanelLeftCloseIcon from '@lucide/svelte/icons/panel-left-close';

  let { className = '', ...restProps } = $props();

  function handleToggle() {
    secondarySidebarStore.toggle();
  }

  const isOpen = $derived($secondarySidebarStore);

  const baseClass =
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9';

  const buttonClass = $derived(`${baseClass} ${className || ''}`.trim());
</script>

<button
  {...restProps}
  class={buttonClass}
  onclick={handleToggle}
  aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
  data-state={isOpen ? 'open' : 'closed'}
  type="button"
>
  {#if isOpen}
    <PanelLeftCloseIcon class="size-4" />
  {:else}
    <PanelLeftOpenIcon class="size-4" />
  {/if}
</button>
