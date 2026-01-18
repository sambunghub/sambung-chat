<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { orpc } from '$lib/orpc';
  import { Chat } from '@ai-sdk/svelte';
  import { DefaultChatTransport } from 'ai';
  import { renderMarkdownSync } from '$lib/markdown-renderer.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { exportChat } from '$lib/utils/chat-export';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import SquareIcon from '@lucide/svelte/icons/square';
  import SendIcon from '@lucide/svelte/icons/send';

  // Use PUBLIC_URL for AI endpoint (backend)
  const PUBLIC_API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

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
  let chatData = $state<Awaited<ReturnType<typeof orpc.chat.getById>> | null>(null);
  let loading = $state(true);
  const MAX_RETRIES = 3;

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

  const chat = new Chat({
    transport: new DefaultChatTransport({
      api: `${PUBLIC_API_URL}/ai`,
      fetch: authenticatedFetch,
    }),
  });

  let messagesContainer: HTMLDivElement | null = $state(null);
  let inputField: HTMLTextAreaElement | null = $state(null);

  // Get chat ID from URL
  let chatId = $derived(() => {
    const id = $page.params.id;
    return id || null;
  });

  // Auto-scroll to bottom
  $effect(() => {
    if (chat.messages.length > 0 && messagesContainer) {
      // Scroll to bottom immediately without animation on mount
      requestAnimationFrame(() => {
        messagesContainer?.scrollTo({
          top: messagesContainer.scrollHeight,
          behavior: 'auto',
        });
      });
    }
  });

  // Auto-scroll when new messages arrive
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

  // Focus input when not streaming
  $effect(() => {
    if (!isStreamingResponse && !isRetrying && !isSubmitting && chat.messages.length > 0) {
      setTimeout(() => {
        inputField?.focus();
      }, 100);
    }
  });

  // Clear error when not streaming
  $effect(() => {
    if (chat.messages.length > 0 && !isStreaming()) {
      errorMessage = '';
    }
  });

  // Load chat data on mount
  onMount(async () => {
    if (chatId()) {
      await loadChat();
    }
  });

  // Reload chat when chatId changes
  $effect(() => {
    if (chatId()) {
      loadChat();
    }
  });

  async function loadChat() {
    if (!chatId()) return;

    loading = true;
    try {
      const data = await orpc.chat.getById({ id: chatId()! });
      if (data) {
        chatData = data;
        // Load existing messages into Chat SDK
        if (data.messages && data.messages.length > 0) {
          // Convert database messages to Chat SDK format
          for (const msg of data.messages) {
            if (msg.role === 'user') {
              chat.messages.push({
                role: 'user',
                parts: [{ type: 'text', text: msg.content }],
              } as any);
            } else if (msg.role === 'assistant') {
              chat.messages.push({
                role: 'assistant',
                parts: [{ type: 'text', text: msg.content }],
              } as any);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
      errorMessage = 'Failed to load chat';
    } finally {
      loading = false;
    }
  }

  function isStreaming() {
    return isStreamingResponse || isRetrying;
  }

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
      // Save user message to database
      if (chatId()) {
        await orpc.message.create({
          chatId: chatId()!,
          content: messageToSend,
        });
      }

      // Send via AI SDK for streaming
      await chat.sendMessage({ text: messageToSend });

      if (chat.messages.length === initialMessageCount) {
        throw new Error('No assistant response was received');
      }

      // Save assistant message to database
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant' && chatId()) {
        // For AI SDK Chat, extract content from parts
        const textPart = lastMessage.parts?.find(
          (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
        );
        const content = textPart && 'text' in textPart ? textPart.text : '';
        await orpc.message.create({
          chatId: chatId()!,
          content: content,
          role: 'assistant',
        });
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
        errorMessage = 'Connection interrupted. Please try again.';
      } else {
        errorMessage = errorObj.message;
      }

      if (!wasStopped && retryCount < MAX_RETRIES) {
        isRetrying = true;
        retryCount++;

        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));

        try {
          abortController = new AbortController();
          await chat.sendMessage({ text: messageToSend });
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        } finally {
          isRetrying = false;
        }
      }
    } finally {
      isStreamingResponse = false;
      isSubmitting = false;
      abortController = null;
    }
  }

  function handleStop() {
    if (abortController) {
      abortController.abort();
      wasStopped = true;
      isStreamingResponse = false;
      isSubmitting = false;

      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        stoppedMessageId = lastMessage.id;
        const textPart = lastMessage.parts?.find(
          (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
        );
        stoppedMessageContent = textPart && 'text' in textPart ? textPart.text : '';
      }
    }
  }

  async function _handleRegenerate() {
    const lastUserMessage = [...chat.messages].reverse().find((m) => m.role === 'user');

    if (!lastUserMessage) return;

    // Remove last assistant message if exists
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      chat.messages.pop();
    }

    errorMessage = '';
    isStreamingResponse = true;
    abortController = new AbortController();

    try {
      const textPart = lastUserMessage.parts?.find(
        (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
      );
      const content = textPart && 'text' in textPart ? textPart.text : '';
      await chat.sendMessage({ text: content });
    } catch (error) {
      console.error('Failed to regenerate:', error);
      errorMessage = 'Failed to regenerate response';
    } finally {
      isStreamingResponse = false;
      abortController = null;
    }
  }

  async function handleExport(format: 'json' | 'md' | 'txt') {
    if (!chatData) return;

    try {
      const exportData = {
        ...chatData,
        messages: chat.messages.map((msg, idx) => {
          const textPart = msg.parts?.find(
            (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
          );
          const content = textPart && 'text' in textPart ? textPart.text : '';
          return {
            id: chatId() || '', // Use ULID string
            role: msg.role,
            content: content,
            createdAt: new Date(),
          };
        }),
      };
      exportChat(exportData, format, chatId() || undefined);
    } catch (err) {
      console.error('Failed to export chat:', err);
    }
  }

  function handleInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function autoResize(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }
</script>

<div class="flex h-full flex-col">
  <!-- Header -->
  <div class="border-b px-6 py-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-foreground text-xl font-semibold">
          {loading ? 'Loading...' : chatData?.title || 'Chat'}
        </h1>
        {#if chatData}
          <p class="text-muted-foreground text-sm">
            {chatData.modelId} • {new Date(chatData.updatedAt).toLocaleString()}
          </p>
        {/if}
      </div>
      <div class="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onclick={() => handleExport('md')}
          title="Export as Markdown"
        >
          <DownloadIcon class="size-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onclick={() => handleExport('json')}
          title="Export as JSON"
        >
          <DownloadIcon class="size-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onclick={() => handleExport('txt')}
          title="Export as Text"
        >
          <DownloadIcon class="size-4" />
        </Button>
      </div>
    </div>
  </div>

  <!-- Messages Area -->
  <div bind:this={messagesContainer} class="flex-1 overflow-y-auto px-6 py-4">
    {#if loading}
      <div class="flex h-full items-center justify-center">
        <div class="text-muted-foreground">Loading chat...</div>
      </div>
    {:else if chat.messages.length === 0}
      <div class="flex h-full items-center justify-center">
        <div class="text-muted-foreground text-center">
          <p class="mb-2 text-lg">Start a conversation</p>
          <p class="text-sm">Type a message below to begin chatting.</p>
        </div>
      </div>
    {:else}
      <div class="mx-auto max-w-3xl space-y-6">
        {#each chat.messages as message, index (message.id || index)}
          <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
            <div
              class="max-w-[80%] rounded-lg px-4 py-2 {message.role === 'user'
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted text-card-foreground'}"
            >
              {#if message.role === 'assistant'}
                <div
                  class="prose-p:text-card-foreground prose prose-sm max-w-none dark:prose-invert"
                >
                  {@html renderMarkdownSync(
                    (message.parts?.find(
                      (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
                    )?.text as string) || ''
                  )}
                </div>
              {:else}
                <div class="whitespace-pre-wrap">
                  {(message.parts?.find(
                    (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
                  )?.text as string) || ''}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if errorMessage}
      <div class="mx-auto mt-4 max-w-3xl">
        <div class="bg-destructive/10 border-destructive text-destructive rounded-lg border p-4">
          <p class="text-sm font-medium">Error</p>
          <p class="text-sm">{errorMessage}</p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Input Area -->
  <div class="border-t px-6 py-4">
    <div class="mx-auto max-w-3xl">
      <form onsubmit={handleSubmit}>
        <div class="flex gap-2">
          <textarea
            bind:this={inputField}
            bind:value={input}
            oninput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              autoResize(target);
            }}
            onkeydown={handleInputKeydown}
            placeholder="Type your message..."
            disabled={isStreaming()}
            rows="1"
            class="focus:ring-ring flex-1 rounded-md border px-4 py-2 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
            class:border-input={true}
            class:bg-background={true}
          ></textarea>
          {#if isStreaming()}
            <Button
              type="button"
              size="icon"
              variant="outline"
              onclick={handleStop}
              title="Stop generation"
            >
              <SquareIcon class="size-4" />
            </Button>
          {:else}
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isSubmitting}
              title="Send message"
            >
              <SendIcon class="size-4" />
            </Button>
          {/if}
        </div>
      </form>
    </div>
  </div>
</div>
