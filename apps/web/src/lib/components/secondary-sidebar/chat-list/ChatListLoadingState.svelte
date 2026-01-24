<script lang="ts">
  import type { ChatListLoadingStateProps } from './types.js';

  let { loading, searching }: ChatListLoadingStateProps = $props();
</script>

<div class="text-muted-foreground flex items-center justify-center p-8 text-sm">
  {loading ? 'Loading chats...' : 'Searching...'}
</div>
