<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { orpc } from '$lib/orpc';
  import { Chat } from '@ai-sdk/svelte';
  import { DefaultChatTransport } from 'ai';
  import { renderMarkdownSync } from '$lib/markdown-renderer.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { exportChat } from '$lib/utils/chat-export';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import FileJsonIcon from '@lucide/svelte/icons/file-json';
  import CodeIcon from '@lucide/svelte/icons/code';
  import SquareIcon from '@lucide/svelte/icons/square';
  import SendIcon from '@lucide/svelte/icons/send';
  import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
  import AlignLeftIcon from '@lucide/svelte/icons/align-left';
  import ClockIcon from '@lucide/svelte/icons/clock';

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

  // Chat statistics
  let chatStats = $derived(() => {
    const userMessages = chat.messages.filter((m) => m.role === 'user');
    const assistantMessages = chat.messages.filter((m) => m.role === 'assistant');
    const totalWords = chat.messages.reduce((sum, msg) => {
      const textPart = msg.parts?.find(
        (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
      );
      const content = textPart && 'text' in textPart ? textPart.text : '';
      return sum + content.split(/\s+/).filter(Boolean).length;
    }, 0);

    return {
      messageCount: chat.messages.length,
      userMessageCount: userMessages.length,
      assistantMessageCount: assistantMessages.length,
      totalWords,
      lastActivity: chatData?.updatedAt ? new Date(chatData.updatedAt).toLocaleString() : null,
    };
  });

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

  // Track current chat ID to prevent double loading
  let currentLoadedChatId = $state<string | null>(null);

  // Load chat when chatId changes (prevents double loading)
  $effect(() => {
    const id = chatId();
    if (id && id !== currentLoadedChatId) {
      loadChat();
      currentLoadedChatId = id;
    }
  });

  async function loadChat() {
    if (!chatId()) return;

    loading = true;
    try {
      const data = await orpc.chat.getById({ id: chatId()! });
      if (data) {
        chatData = data;

        // Clear existing messages before loading new ones
        chat.messages = [];

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
      // Send via AI SDK for streaming (optimistic UI - shows in chat, not saved to DB yet)
      await chat.sendMessage({ text: messageToSend });

      if (chat.messages.length === initialMessageCount) {
        throw new Error('No assistant response was received');
      }

      // AI successful! Now save both messages to database
      // Find the user and assistant messages that were just added
      const newUserMessage = chat.messages[initialMessageCount];
      const assistantMessage = chat.messages[chat.messages.length - 1];

      if (chatId()) {
        // Save user message first
        if (newUserMessage && newUserMessage.role === 'user') {
          const userTextPart = newUserMessage.parts?.find(
            (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
          );
          const userContent = userTextPart && 'text' in userTextPart ? userTextPart.text : '';
          await orpc.message.create({
            chatId: chatId()!,
            content: userContent,
          });
        }

        // Save assistant message
        if (assistantMessage && assistantMessage.role === 'assistant') {
          const assistantTextPart = assistantMessage.parts?.find(
            (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
          );
          const assistantContent =
            assistantTextPart && 'text' in assistantTextPart ? assistantTextPart.text : '';
          await orpc.message.create({
            chatId: chatId()!,
            content: assistantContent,
            role: 'assistant',
          });
        }
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

      // Retry logic with save to database after success
      if (!wasStopped && retryCount < MAX_RETRIES) {
        isRetrying = true;
        retryCount++;

        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));

        try {
          abortController = new AbortController();
          await chat.sendMessage({ text: messageToSend });

          // Retry successful! Save both messages to database
          const newUserMessage = chat.messages[initialMessageCount];
          const assistantMessage = chat.messages[chat.messages.length - 1];

          if (chatId()) {
            // Save user message first
            if (newUserMessage && newUserMessage.role === 'user') {
              const userTextPart = newUserMessage.parts?.find(
                (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
              );
              const userContent = userTextPart && 'text' in userTextPart ? userTextPart.text : '';
              await orpc.message.create({
                chatId: chatId()!,
                content: userContent,
              });
            }

            // Save assistant message
            if (assistantMessage && assistantMessage.role === 'assistant') {
              const assistantTextPart = assistantMessage.parts?.find(
                (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
              );
              const assistantContent =
                assistantTextPart && 'text' in assistantTextPart ? assistantTextPart.text : '';
              await orpc.message.create({
                chatId: chatId()!,
                content: assistantContent,
                role: 'assistant',
              });
            }
          }
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

<div class="flex h-screen flex-col overflow-hidden">
  <!-- Header -->
  <div class="shrink-0 border-b px-6 py-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-foreground text-xl font-semibold">
          {loading ? 'Loading...' : chatData?.title || 'Chat'}
        </h1>
        {#if chatData}
          <p class="text-muted-foreground flex items-center gap-3 text-sm">
            <span class="flex items-center gap-1">
              <MessageCircleIcon class="size-3" />
              {chatStats().messageCount} messages
            </span>
            <span class="flex items-center gap-1">
              <AlignLeftIcon class="size-3" />
              {chatStats().totalWords} words
            </span>
            <span class="flex items-center gap-1">
              <ClockIcon class="size-3" />
              {chatStats().lastActivity || 'N/A'}
            </span>
          </p>
        {/if}
      </div>
      <div class="flex gap-2">
        <DropdownMenu.DropdownMenu>
          <DropdownMenu.DropdownMenuTrigger
            class="bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
            title="Export chat"
          >
            <DownloadIcon class="size-4" />
          </DropdownMenu.DropdownMenuTrigger>
          <DropdownMenu.DropdownMenuContent>
            <DropdownMenu.DropdownMenuItem onclick={() => handleExport('md')}>
              <CodeIcon class="mr-2 size-4" />
              <span>Markdown</span>
            </DropdownMenu.DropdownMenuItem>
            <DropdownMenu.DropdownMenuItem onclick={() => handleExport('json')}>
              <FileJsonIcon class="mr-2 size-4" />
              <span>JSON</span>
            </DropdownMenu.DropdownMenuItem>
            <DropdownMenu.DropdownMenuItem onclick={() => handleExport('txt')}>
              <FileTextIcon class="mr-2 size-4" />
              <span>Plain Text</span>
            </DropdownMenu.DropdownMenuItem>
          </DropdownMenu.DropdownMenuContent>
        </DropdownMenu.DropdownMenu>
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
  <div class="shrink-0 border-t px-6 py-4">
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
