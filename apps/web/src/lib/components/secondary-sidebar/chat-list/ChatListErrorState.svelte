<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import type { ChatListErrorStateProps } from './types.js';

  let { error, onRetry }: ChatListErrorStateProps = $props();
</script>

<div class="flex flex-col items-center gap-3 p-4 text-center">
  <div class="text-destructive text-sm">
    <AlertCircleIcon class="mx-auto mb-2 size-8" />
    <p class="font-medium">Failed to load chats</p>
    <p class="text-muted-foreground mt-1">{error}</p>
  </div>
  <Button size="sm" onclick={onRetry} variant="outline">
    <RefreshCwIcon class="mr-1 size-4" />
    Retry
  </Button>
</div>
