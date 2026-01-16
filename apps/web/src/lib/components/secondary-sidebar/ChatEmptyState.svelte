<script lang="ts">
  import MessageSquarePlusIcon from '@lucide/svelte/icons/message-square-plus';
  import { Button } from '$lib/components/ui/button/index.js';

  interface Props {
    onNewChat: () => void;
  }

  let { onNewChat }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center p-8 text-center">
  <MessageSquarePlusIcon class="text-muted-foreground mb-4 size-12" />
  <h3 class="mb-2 text-lg font-medium">No chats yet</h3>
  <p class="text-muted-foreground mb-4 text-sm">Start your first conversation</p>
  <Button size="sm" variant="default" onclick={onNewChat}>Create New Chat</Button>
</div>
