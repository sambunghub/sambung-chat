<script lang="ts">
  import { chatViewMode } from '$lib/stores/chat-view-mode';
  import { Button } from '$lib/components/ui/button/index.js';
  import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
  import SquareIcon from '@lucide/svelte/icons/square';

  let viewMode = $state('flat' as 'flat' | 'rounded');

  // Subscribe to store updates
  $effect(() => {
    const unsubscribe = chatViewMode.subscribe((value) => {
      viewMode = value;
    });
    return unsubscribe;
  });

  function toggleViewMode() {
    chatViewMode.toggle();
  }
</script>

<Button
  variant="ghost"
  size="sm"
  onclick={toggleViewMode}
  title={viewMode === 'flat' ? 'Switch to rounded mode' : 'Switch to flat mode'}
  aria-label={viewMode === 'flat' ? 'Switch to rounded mode' : 'Switch to flat mode'}
>
  {#if viewMode === 'flat'}
    <SquareIcon class="size-4" />
  {:else}
    <MessageCircleIcon class="size-4" />
  {/if}
</Button>
