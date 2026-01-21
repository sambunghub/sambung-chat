<script lang="ts">
  import './chat.css';
  import { page } from '$app/stores';
  import { Chat } from '@ai-sdk/svelte';
  import { DefaultChatTransport } from 'ai';
  import { fade } from 'svelte/transition';
  import { renderMarkdownSync } from '$lib/markdown-renderer.js';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import { orpc } from '$lib/orpc';
  import { goto } from '$app/navigation';
  import ModelSelector from '$lib/components/model-selector.svelte';

  // Use PUBLIC_URL for AI endpoint (backend)
  const PUBLIC_API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

  // Custom fetch wrapper to include credentials (cookies)
  const authenticatedFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, {
      ...init,
      credentials: 'include',
      headers: {
        ...init?.headers,
      },
    });
  };

  let input = $state('');
  let errorMessage = $state('');
  let isRetrying = $state(false);
  let retryCount = $state(0);
  let abortController = $state<AbortController | null>(null);
  let isStreamingResponse = $state(false);
  let wasStopped = $state(false);
  let stoppedMessageId = $state<string | null>(null);
  let stoppedMessageContent = $state<string | null>(null);
  let isSubmitting = $state(false);
  let currentChatId = $state<string | null>(null);
  let selectedModel:
    | { id: string; provider: string; modelId: string; name: string; isActive: boolean }
    | undefined = $state(undefined);
  const MAX_RETRIES = 3;

  const chat = new Chat({
    transport: new DefaultChatTransport({
      api: `${PUBLIC_API_URL}/api/ai`,
      fetch: authenticatedFetch,
    }),
  });

  let messagesContainer: HTMLDivElement | null = $state(null);
  let inputField: HTMLTextAreaElement | null = $state(null);

  $effect(() => {
    if (chat.messages.length > 0 && messagesContainer) {
      requestAnimationFrame(() => {
        messagesContainer?.scrollTo({
          top: messagesContainer.scrollHeight,
          behavior: 'smooth',
        });
      });
    }
  });

  $effect(() => {
    if (!isStreamingResponse && !isRetrying && !isSubmitting && chat.messages.length > 0) {
      setTimeout(() => {
        inputField?.focus();
      }, 100);
    }
  });

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
    stoppedMessageId = null;
    stoppedMessageContent = null;

    const messageToSend = text;
    input = '';

    if (inputField) {
      inputField.style.height = 'auto';
    }

    isStreamingResponse = true;
    isSubmitting = true;
    abortController = new AbortController();
    const initialMessageCount = chat.messages.length;

    try {
      // Create chat if doesn't exist
      if (!currentChatId) {
        const modelId = selectedModel?.modelId || selectedModel?.id || 'gpt-4o-mini';
        const newChat = await orpc.chat.create({
          title: messageToSend.slice(0, 50) + (messageToSend.length > 50 ? '...' : ''),
          modelId: modelId,
        });
        currentChatId = newChat.id;
      }

      // Save user message to database
      await orpc.message.create({
        chatId: currentChatId,
        content: messageToSend,
      });

      // Send via AI SDK for streaming
      await chat.sendMessage({ text: messageToSend });

      if (chat.messages.length === initialMessageCount) {
        throw new Error('No assistant response was received');
      }

      // Save assistant message to database
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        const textPart = lastMessage.parts.find(
          (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
        );
        if (textPart && 'text' in textPart) {
          await orpc.message.create({
            chatId: currentChatId,
            content: textPart.text as string,
            role: 'assistant',
          });
        }
      }

      // Redirect to /app/chat/[id] after everything is saved
      if (currentChatId && $page.url.pathname === '/app/chat') {
        await goto(`/app/chat/${currentChatId}`, { replaceState: true });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorObj = error instanceof Error ? error : new Error('Failed to send message');

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

      input = messageToSend;
    } finally {
      isStreamingResponse = false;
      isSubmitting = false;
      abortController = null;
    }
  }

  function handleStop() {
    wasStopped = true;
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      stoppedMessageId = lastMessage.id;
      const textPart = lastMessage.parts.find(
        (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
      );
      if (textPart && 'text' in textPart) {
        stoppedMessageContent = renderMarkdownSync(textPart.text as string);
      }
    }

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
      const textPart = lastMessage.parts.find(
        (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
      );
      if (textPart && 'text' in textPart) {
        await chat.sendMessage({ text: textPart.text as string });
      }
    } catch (error) {
      console.error('Retry failed:', error);
      errorMessage =
        `Retry ${retryCount}/${MAX_RETRIES} failed: ` +
        (error instanceof Error ? error.message : 'Unknown error');

      if (retryCount >= MAX_RETRIES) {
        errorMessage = 'Failed after multiple attempts. Please try again later.';
      }
    } finally {
      isRetrying = false;
      isStreamingResponse = false;
    }
  }

  function isStreaming() {
    return isStreamingResponse;
  }

  function hasError() {
    return errorMessage.length > 0;
  }
</script>

<header
  class="bg-background sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b p-4"
>
  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item>
        <Breadcrumb.Page>Chat</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb.List>
  </Breadcrumb.Root>

  <div class="flex items-center gap-2">
    <ModelSelector
      onSelectModel={(model) => {
        selectedModel = model;
      }}
      selectedModelId={selectedModel?.id}
    />
  </div>
</header>

<div class="flex h-[calc(100vh-61px)] flex-col">
  <div bind:this={messagesContainer} class="flex-1 space-y-4 overflow-y-auto scroll-smooth p-4">
    {#if chat.messages.length === 0}
      <div in:fade={{ duration: 500 }} class="text-muted-foreground mt-8 text-center">
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
          class="text-primary mx-auto mb-4 opacity-50"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h2 class="mb-2 text-xl font-semibold">Start a conversation</h2>
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
          class="group max-w-[85%] rounded-2xl px-4 py-3 text-sm transition-all duration-200 hover:shadow-lg md:text-base"
          class:ml-auto={message.role === 'user'}
          class:bg-accent={message.role === 'user'}
          class:bg-muted={message.role === 'assistant'}
          class:rounded-tr-sm={message.role === 'user'}
          class:rounded-tl-sm={message.role === 'assistant'}
        >
          <p
            class="mb-1.5 text-xs font-medium opacity-70"
            class:text-accent-foreground={message.role === 'user'}
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
              <span class="text-muted-foreground ml-2 inline-flex items-center gap-1">
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
            class="markdown-content prose prose-sm max-w-none dark:prose-invert"
            class:prose-p:text-accent-foreground={message.role === 'user'}
            class:prose-p:text-card-foreground={message.role === 'assistant'}
            class:opacity-70={isThisStoppedMessage}
          >
            {#if isThisStoppedMessage && stoppedMessageContent}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized by DOMPurify in markdown-renderer.ts -->
              {@html stoppedMessageContent}
            {:else}
              {#each message.parts as part, partIndex (partIndex)}
                {#if part.type === 'text'}
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized by DOMPurify in markdown-renderer.ts -->
                  {@html renderMarkdownSync(part.text)}
                  {#if isStreamingMessage && !part.text}
                    <span class="ml-1 inline-block h-4 w-2 animate-pulse bg-current opacity-50"
                    ></span>
                  {/if}
                {/if}
              {/each}
            {/if}
          </div>
        </div>

        {#if isStoppedMessage}
          <div
            in:fade={{ duration: 300 }}
            class="text-muted-foreground mt-2 ml-4 flex items-center gap-2 text-sm"
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

    {#if hasError()}
      <div
        in:fade={{ duration: 300 }}
        class="border-destructive/50 bg-destructive/10 flex items-center justify-between gap-3 rounded-xl border p-4"
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
            class="text-destructive mt-0.5 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <div class="flex-1">
            <p class="text-destructive font-medium">Connection Error</p>
            <p class="text-muted-foreground mt-1 text-sm">{errorMessage}</p>
          </div>
        </div>
        {#if retryCount < MAX_RETRIES}
          <button
            type="button"
            onclick={handleRetry}
            disabled={isRetrying}
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
    class="border-border bg-background flex items-end gap-2 border-t p-4"
  >
    <div class="relative flex-1">
      <textarea
        name="prompt"
        bind:value={input}
        bind:this={inputField}
        placeholder="Type your message..."
        rows="1"
        class="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 w-full resize-none overflow-y-auto rounded-xl border px-4 py-3 pr-12 transition-all duration-200 focus:ring-2 focus:outline-none disabled:opacity-50"
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
          target.style.height = 'auto';
          target.style.height = Math.min(target.scrollHeight, 200) + 'px';
        }}
      ></textarea>
      <div class="text-muted-foreground pointer-events-none absolute right-3 bottom-3 text-xs">
        {#if isStreaming() || isRetrying}
          <span class="flex items-center gap-1">
            <span class="animate-spin">⋯</span>
          </span>
        {:else}
          <div class="hidden items-center gap-1 sm:flex">
            <kbd class="text-xs">⇧</kbd>
            <kbd class="text-xs">⏎</kbd>
          </div>
        {/if}
      </div>
    </div>

    {#if isStreaming() && !isRetrying}
      <button
        type="button"
        onclick={handleStop}
        class="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive inline-flex h-11 w-auto shrink-0 items-center justify-center gap-2 rounded-xl px-4 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-95"
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
        class="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
