<script lang="ts">
  /**
   * Token Display Component
   *
   * Shows token usage statistics for AI responses.
   * Displays approximate token count during streaming and exact count when complete.
   */

  interface Props {
    /** Current token count (can be approximate during streaming) */
    currentTokens?: number;
    /** Whether the response is currently streaming */
    isStreaming?: boolean;
    /** Exact token count from the provider (available after stream completes) */
    exactTokens?: number;
    /** Prompt tokens used */
    promptTokens?: number;
  }

  let {
    currentTokens = 0,
    isStreaming = false,
    exactTokens,
    promptTokens,
  }: Props = $props();

  // Display tokens: use exact if available and not streaming, otherwise use current
  let displayTokens = $derived(
    !isStreaming && exactTokens !== undefined ? exactTokens : currentTokens
  );

  // Format token number with comma separator
  function formatTokens(count: number): string {
    return count.toLocaleString();
  }

  // Calculate total tokens if prompt tokens are available
  let totalTokens = $derived(
    promptTokens !== undefined ? promptTokens + displayTokens : displayTokens
  );
</script>

{#if displayTokens > 0 || isStreaming}
  <div
    class="text-muted-foreground inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs"
    title="Tokens used"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="size-3"
    >
      <path d="M12 2H2v10l9.3 9.3a1 1 0 0 0 1.4 0l8.6-8.6a1 1 0 0 0 0-1.4L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
    <span class="font-mono">
      {isStreaming ? '~' : ''}
      {formatTokens(displayTokens)}
      {promptTokens !== undefined ? ` / ${formatTokens(totalTokens)}` : ''}
      tokens
    </span>
    {#if isStreaming}
      <span
        class="animate-pulse"
        aria-label="Streaming"
      >⋯</span>
    {/if}
  </div>
{/if}
