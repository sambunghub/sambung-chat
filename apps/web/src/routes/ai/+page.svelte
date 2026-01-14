<script lang="ts">
  import { Chat } from '@ai-sdk/svelte';
  import { DefaultChatTransport } from 'ai';
  import { fade } from 'svelte/transition';
  import { renderMarkdownSync } from '../../lib/markdown-renderer.js';

  // Use PUBLIC_URL for AI endpoint (backend)
  const PUBLIC_API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

  let input = $state('');
  let errorMessage = $state('');
  let isRetrying = $state(false);
  let retryCount = $state(0);
  let abortController = $state<AbortController | null>(null);
  let isStreamingResponse = $state(false); // Manual streaming state
  let wasStopped = $state(false); // Track if stream was manually stopped
  let stoppedMessageId = $state<string | null>(null); // Track ID of stopped message
  let stoppedMessageContent = $state<string | null>(null); // Store content when stopped
  let isSubmitting = $state(false); // Prevent double-submit
  const MAX_RETRIES = 3;

  const chat = new Chat({
    transport: new DefaultChatTransport({
      api: `${PUBLIC_API_URL}/ai`,
    }),
  });

  let messagesContainer: HTMLDivElement | null = $state(null);
  let inputField: HTMLTextAreaElement | null = $state(null);

  // Smooth auto-scroll with better UX
  $effect(() => {
    if (chat.messages.length > 0 && messagesContainer) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        messagesContainer?.scrollTo({
          top: messagesContainer.scrollHeight,
          behavior: 'smooth',
        });
      });
    }
  });

  // Auto-focus input field when streaming stops, is stopped, or after errors
  $effect(() => {
    // Focus when: not streaming AND not retrying AND not submitting AND there are messages
    // This covers: completion, manual stop, and after errors
    if (!isStreamingResponse && !isRetrying && !isSubmitting && chat.messages.length > 0) {
      // Small delay to ensure the UI has updated
      setTimeout(() => {
        inputField?.focus();
      }, 100);
    }
  });

  // Clear error when new messages arrive
  $effect(() => {
    if (chat.messages.length > 0 && !isStreaming()) {
      errorMessage = '';
    }
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isRetrying || isStreamingResponse || isSubmitting) return;

    errorMessage = '';
    retryCount = 0;
    wasStopped = false;
    stoppedMessageId = null; // Reset stopped message ID
    stoppedMessageContent = null; // Reset stopped message content

    // Clear input immediately to prevent double-send
    const messageToSend = text;
    input = '';

    // Reset textarea height to 1 line
    if (inputField) {
      inputField.style.height = 'auto';
    }

    // Set streaming state
    isStreamingResponse = true;
    isSubmitting = true;

    // Create abort controller for this request
    abortController = new AbortController();

    // Track initial message count
    const initialMessageCount = chat.messages.length;

    try {
      await chat.sendMessage({ text: messageToSend });

      // Check if assistant message was created
      if (chat.messages.length === initialMessageCount) {
        throw new Error('No assistant response was received');
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      // Check for specific error types
      const errorObj = error instanceof Error ? error : new Error('Failed to send message');

      // Detect incomplete chunked encoding or network errors
      if (errorObj.name === 'AbortError') {
        errorMessage = wasStopped ? 'Generation was stopped' : 'Request was interrupted';
      } else if (
        errorObj.message.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') ||
        errorObj.message.includes('chunked') ||
        errorObj.message.includes('network') ||
        errorObj.message.includes('fetch') ||
        errorObj.message.includes('No assistant response')
      ) {
        errorMessage = 'Connection interrupted. The response was incomplete. Please try again.';
      } else {
        errorMessage = errorObj.message;
      }

      // Restore input on error
      input = messageToSend;
    } finally {
      isStreamingResponse = false;
      isSubmitting = false;
      abortController = null;
    }
  }

  function handleStop() {
    // Mark as manually stopped
    wasStopped = true;

    // Track the last assistant message ID and capture its content
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      stoppedMessageId = lastMessage.id;
      // Capture the current content as HTML
      const textPart = lastMessage.parts.find(
        (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
      );
      if (textPart && 'text' in textPart) {
        stoppedMessageContent = renderMarkdownSync(textPart.text as string);
      }
    }

    // Abort the current stream
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    isStreamingResponse = false;
  }

  async function handleRetry() {
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') return;

    isRetrying = true;
    isStreamingResponse = true;
    errorMessage = '';
    retryCount++;

    try {
      // Get the last user message text and resend
      const textPart = lastMessage.parts.find(
        (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
      );
      if (textPart && 'text' in textPart) {
        await chat.sendMessage({ text: textPart.text as string });
      }
    } catch (error) {
      console.error('Retry failed:', error);
      errorMessage = `Retry ${retryCount}/${MAX_RETRIES} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

      // If max retries reached, show different message
      if (retryCount >= MAX_RETRIES) {
        errorMessage = 'Failed after multiple attempts. Please try again later.';
      }
    } finally {
      isRetrying = false;
      isStreamingResponse = false;
    }
  }

  // Check if last message is from assistant and still streaming
  // More accurate check: text exists and is not empty
  function isStreaming() {
    return isStreamingResponse;
  }

  function hasError() {
    return errorMessage.length > 0;
  }
</script>

<div class="mx-auto grid h-full w-full max-w-3xl grid-rows-[1fr_auto] overflow-hidden p-4">
  <div bind:this={messagesContainer} class="mb-4 space-y-4 overflow-y-auto pb-4 scroll-smooth">
    {#if chat.messages.length === 0}
      <div in:fade={{ duration: 500 }} class="mt-8 text-center text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mx-auto mb-4 text-primary opacity-50"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h2 class="text-xl font-semibold mb-2">Start a conversation</h2>
        <p class="text-sm">Ask me anything to get started!</p>
      </div>
    {/if}

    {#each chat.messages as message, index (message.id + '-' + index)}
      {@const isLast = index === chat.messages.length - 1}
      {@const isStreamingMessage =
        message.role === 'assistant' && isLast && isStreamingResponse && !wasStopped}
      {@const isStoppedMessage =
        message.role === 'assistant' && isLast && wasStopped && !isStreamingResponse}
      {@const isThisStoppedMessage = message.id === stoppedMessageId}

      <div
        in:fade={{ duration: 400 }}
        class="flex w-full {message.role === 'user' ? 'justify-end' : 'justify-start'}"
      >
        <div
          class="group max-w-[85%] rounded-2xl px-4 py-3 text-sm md:text-base transition-all duration-200 hover:shadow-lg"
          class:ml-auto={message.role === 'user'}
          class:bg-primary={message.role === 'user'}
          class:bg-muted={message.role === 'assistant'}
          class:rounded-tr-sm={message.role === 'user'}
          class:rounded-tl-sm={message.role === 'assistant'}
        >
          <p
            class="mb-1.5 text-xs font-medium opacity-70"
            class:text-primary-foreground={message.role === 'user'}
            class:text-muted-foreground={message.role === 'assistant'}
          >
            {message.role === 'user' ? 'You' : 'AI Assistant'}
            {#if isStreamingMessage}
              <span class="ml-2 inline-flex items-center gap-1">
                <span class="animate-pulse">●</span>
                <span class="animate-pulse" style="animation-delay: 0.2s">●</span>
                <span class="animate-pulse" style="animation-delay: 0.4s">●</span>
              </span>
            {:else if isStoppedMessage}
              <span class="ml-2 inline-flex items-center gap-1 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
                <span>Stopped</span>
              </span>
            {/if}
          </p>

          <div
            class="prose prose-sm dark:prose-invert max-w-none markdown-content"
            class:prose-p:text-primary-foreground={message.role === 'user'}
            class:prose-p:text-foreground={message.role === 'assistant'}
            class:opacity-70={isThisStoppedMessage}
          >
            {#if isThisStoppedMessage && stoppedMessageContent}
              <!-- Show frozen content from when stopped -->
              {@html stoppedMessageContent}
            {:else}
              {#each message.parts as part, partIndex (partIndex)}
                {#if part.type === 'text'}
                  {@html renderMarkdownSync(part.text)}
                  {#if isStreamingMessage && !part.text}
                    <span class="inline-block w-2 h-4 ml-1 bg-current animate-pulse opacity-50"
                    ></span>
                  {/if}
                {/if}
              {/each}
            {/if}
          </div>
        </div>

        <!-- Interrupted message indicator -->
        {#if isStoppedMessage}
          <div
            in:fade={{ duration: 300 }}
            class="ml-4 mt-2 flex items-center gap-2 text-sm text-muted-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="shrink-0"
            >
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            <span class="italic">Generation stopped by user</span>
          </div>
        {/if}
      </div>
    {/each}

    <!-- Error Message with Retry Button -->
    {#if hasError()}
      <div
        in:fade={{ duration: 300 }}
        class="flex items-center justify-between gap-3 rounded-xl border border-destructive/50 bg-destructive/10 p-4"
      >
        <div class="flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mt-0.5 shrink-0 text-destructive"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <div class="flex-1">
            <p class="font-medium text-destructive">Connection Error</p>
            <p class="text-sm text-muted-foreground mt-1">{errorMessage}</p>
          </div>
        </div>
        {#if retryCount < MAX_RETRIES}
          <button
            type="button"
            onclick={handleRetry}
            disabled={isRetrying}
            class="shrink-0 inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
          >
            {#if isRetrying}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="animate-spin"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Retrying...
            {:else}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
                />
              </svg>
              Retry
            {/if}
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <form
    onsubmit={handleSubmit}
    class="w-full flex items-end gap-2 pt-3 border-t border-border bg-background p-2"
  >
    <div class="flex-1 relative">
      <textarea
        name="prompt"
        bind:value={input}
        bind:this={inputField}
        placeholder="Type your message..."
        rows="1"
        class="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all duration-200 resize-none overflow-y-auto"
        style="max-height: 200px"
        autocomplete="off"
        disabled={isStreaming() || isRetrying || isSubmitting}
        onkeydown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        oninput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          // Auto-resize textarea based on content, max ~8 lines (200px)
          target.style.height = 'auto';
          target.style.height = Math.min(target.scrollHeight, 200) + 'px';
        }}
      ></textarea>
      <div class="absolute right-3 bottom-3 text-xs text-muted-foreground pointer-events-none">
        {#if isStreaming() || isRetrying}
          <span class="flex items-center gap-1">
            <span class="animate-spin">⋯</span>
          </span>
        {:else}
          <div class="hidden sm:flex items-center gap-1">
            <kbd class="text-xs">⇧</kbd>
            <kbd class="text-xs">⏎</kbd>
          </div>
        {/if}
      </div>
    </div>

    <!-- Send Button or Stop Button -->
    {#if isStreaming() && !isRetrying}
      <button
        type="button"
        onclick={handleStop}
        class="inline-flex h-11 w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-destructive px-4 text-destructive-foreground hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Stop generation"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
        >
          <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
        <span class="text-sm font-medium">Stop</span>
      </button>
    {:else}
      <button
        type="submit"
        disabled={!input.trim() || isStreaming() || isRetrying || isSubmitting}
        class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Send message"
      >
        {#if isRetrying}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="animate-spin"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="transition-transform duration-200"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        {/if}
      </button>
    {/if}
  </form>
</div>

<style>
  /* Smooth scroll behavior */
  :global(.scroll-smooth) {
    scroll-behavior: smooth;
  }

  /* Custom scrollbar for webkit browsers */
  :global(.overflow-y-auto::-webkit-scrollbar) {
    width: 6px;
  }

  :global(.overflow-y-auto::-webkit-scrollbar-track) {
    background: transparent;
  }

  :global(.overflow-y-auto::-webkit-scrollbar-thumb) {
    background: hsl(var(--color-border) / 0.5);
    border-radius: 3px;
  }

  :global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
    background: hsl(var(--color-border));
  }

  /* Markdown content styling */
  :global(.markdown-content) {
    line-height: 1.7;
  }

  /* Code blocks - enhanced visibility */
  :global(.markdown-content pre) {
    border-radius: 0.75rem;
    margin: 1rem 0;
    overflow-x: auto;
    background: linear-gradient(
      145deg,
      hsl(var(--color-muted) / 0.8),
      hsl(var(--color-muted) / 0.4)
    );
    border: 1px solid hsl(var(--color-border) / 0.8);
    box-shadow: 0 4px 6px -1px hsl(var(--color-border) / 0.3);
  }

  :global(.markdown-content code) {
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
    font-size: 0.875em;
  }

  /* Inline code - more prominent */
  :global(.markdown-content :not(pre) > code) {
    background: linear-gradient(
      135deg,
      hsl(var(--color-primary) / 0.15),
      hsl(var(--color-primary) / 0.08)
    );
    color: hsl(var(--color-primary));
    padding: 0.2rem 0.5rem;
    border-radius: 0.375rem;
    font-weight: 600;
    border: 1px solid hsl(var(--color-primary) / 0.2);
    box-shadow: 0 1px 2px hsl(var(--color-primary) / 0.1);
  }

  /* Code block language label - more prominent */
  :global(.markdown-content pre > div:first-child) {
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
    background: linear-gradient(
      135deg,
      hsl(var(--color-muted) / 0.95),
      hsl(var(--color-muted) / 0.7)
    );
    border-bottom: 2px solid hsl(var(--color-primary) / 0.3);
  }

  /* Headings - enhanced visibility */
  :global(.markdown-content h1) {
    font-size: 1.5rem;
    font-weight: 800;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    background: linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-primary) / 0.7));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    padding-bottom: 0.25rem;
    border-bottom: 2px solid hsl(var(--color-primary) / 0.2);
  }

  :global(.markdown-content h2) {
    font-size: 1.25rem;
    font-weight: 700;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
    color: hsl(var(--color-primary));
    background: linear-gradient(90deg, hsl(var(--color-primary) / 0.1), transparent);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    border-left: 3px solid hsl(var(--color-primary));
  }

  :global(.markdown-content h3) {
    font-size: 1.125rem;
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: hsl(var(--color-foreground));
    background: hsl(var(--color-muted) / 0.3);
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
  }

  /* Lists - enhanced bullet points */
  :global(.markdown-content ul),
  :global(.markdown-content ol) {
    padding-left: 1.5rem;
    margin: 0.75rem 0;
  }

  :global(.markdown-content li) {
    margin: 0.4rem 0;
    padding-left: 0.25rem;
  }

  :global(.markdown-content ul li::marker) {
    color: hsl(var(--color-primary));
    font-size: 1.2em;
  }

  :global(.markdown-content ol li::marker) {
    color: hsl(var(--color-primary));
    font-weight: 600;
  }

  /* Blockquotes - more prominent */
  :global(.markdown-content blockquote) {
    border-left: 4px solid hsl(var(--color-primary));
    padding: 1rem 1.25rem;
    margin: 1.25rem 0;
    font-style: italic;
    color: hsl(var(--color-foreground));
    background: linear-gradient(90deg, hsl(var(--color-primary) / 0.1), transparent);
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px hsl(var(--color-border) / 0.2);
  }

  /* Tables - enhanced visibility */
  :global(.markdown-content table) {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 1.5rem 0;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px hsl(var(--color-border) / 0.3);
  }

  :global(.markdown-content th),
  :global(.markdown-content td) {
    border: 1px solid hsl(var(--color-border) / 0.5);
    padding: 0.75rem 1rem;
  }

  :global(.markdown-content th) {
    background: linear-gradient(
      135deg,
      hsl(var(--color-primary) / 0.15),
      hsl(var(--color-primary) / 0.05)
    );
    font-weight: 700;
    color: hsl(var(--color-primary));
    text-transform: uppercase;
    font-size: 0.875em;
    letter-spacing: 0.05em;
  }

  :global(.markdown-content tr:nth-child(even)) {
    background-color: hsl(var(--color-muted) / 0.3);
  }

  :global(.markdown-content tr:hover) {
    background-color: hsl(var(--color-muted) / 0.5);
  }

  /* Links */
  :global(.markdown-content a) {
    color: hsl(var(--color-primary));
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  :global(.markdown-content a:hover) {
    text-decoration-thickness: 2px;
  }
</style>
