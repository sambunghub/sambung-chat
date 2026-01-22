<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { orpc } from '$lib/orpc';
  import { Chat } from '@ai-sdk/svelte';
  import { DefaultChatTransport } from 'ai';
  import {
    renderMarkdownSync,
    initMermaidDiagrams,
    ensureMarkdownDependencies
  } from '$lib/markdown-renderer.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
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
  import TokenDisplay from '$lib/components/token-display.svelte';
  import ErrorDisplay from '$lib/components/error-display.svelte';
  import SecondarySidebarTrigger from '$lib/components/secondary-sidebar-trigger.svelte';
  import ChatSkeleton from '$lib/components/chat/chat-skeleton.svelte';

  // Get backend API URL for AI endpoint
  // Use PUBLIC_API_URL (client-side environment variable)
  const BACKEND_API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:5174';

  let input = $state('');
  let errorMessage = $state('');
  let errorCode = $state<string | undefined>(undefined);
  let errorType: 'error' | 'warning' | 'info' = $state('error');
  let isRetrying = $state(false);
  let retryCount = $state(0);
  let abortController = $state<AbortController | null>(null);
  let isStreamingResponse = $state(false);
  let wasStopped = $state(false);
  let stoppedMessageId = $state<string | null>(null);
  let stoppedMessageContent = $state<string | null>(null);
  let isSubmitting = $state(false);
  let chatData = $state<Awaited<ReturnType<typeof orpc.chat.getById>> | null>(null);
  let activeModel = $state<Awaited<ReturnType<typeof orpc.model.getActive>> | null>(null);
  let loading = $state(true);
  const MAX_RETRIES = 3;

  // Token tracking for streaming
  let streamingMessageId = $state<string | null>(null);
  let streamingTokenCount = $state(0);
  let messageTokenData = $state<Map<string, { exactTokens?: number; promptTokens?: number }>>(
    new Map()
  );

  // Custom fetch wrapper to include credentials (cookies) and modelId
  const authenticatedFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    // For AI API requests, include modelId from chat
    if (typeof input === 'string' && input.includes('/api/ai')) {
      const body = init?.body ? JSON.parse(init.body as string) : {};

      // Don't send modelId - let backend use the active model instead
      // This ensures chats always use the current active model, not outdated modelId
      delete body.modelId;

      return fetch(input, {
        ...init,
        credentials: 'include',
        headers: {
          ...init?.headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }

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
      api: `${BACKEND_API_URL}/api/ai`,
      fetch: authenticatedFetch,
    }),
  });

  let messagesContainer: HTMLDivElement | null = $state(null);
  let inputField: HTMLTextAreaElement | null = $state(null);

  // Reactive messages array for streaming updates
  let messages = $derived(chat.messages);

  // Chat statistics
  let chatStats = $derived(() => {
    const userMessages = messages.filter((m) => m.role === 'user');
    const assistantMessages = messages.filter((m) => m.role === 'assistant');
    const totalWords = messages.reduce((sum, msg) => {
      const textPart = msg.parts?.find(
        (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
      );
      const content = textPart && 'text' in textPart ? textPart.text : '';
      return sum + content.split(/\s+/).filter(Boolean).length;
    }, 0);

    return {
      messageCount: messages.length,
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

  // Lazy load markdown dependencies (KaTeX and Mermaid) on mount
  onMount(async () => {
    try {
      await ensureMarkdownDependencies();
    } catch (error) {
      console.error('Failed to load markdown dependencies:', error);
    }
  });

  // Auto-scroll to bottom
  $effect(() => {
    if (messages.length > 0 && messagesContainer) {
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
    if (messages.length > 0 && messagesContainer) {
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
    if (!isStreamingResponse && !isRetrying && !isSubmitting && messages.length > 0) {
      setTimeout(() => {
        inputField?.focus();
      }, 100);
    }
  });

  // Clear error when not streaming and when user starts typing
  $effect(() => {
    if (messages.length > 0 && !isStreaming() && input.length > 0) {
      clearError();
    }
  });

  // Helper function to clear error state
  function clearError() {
    errorMessage = '';
    errorCode = undefined;
    errorType = 'error';
  }

  // Helper function to categorize errors
  function categorizeError(
    errorMsg: string,
    errorObj?: Error & { code?: string }
  ): {
    code: string | undefined;
    type: 'error' | 'warning' | 'info';
    message: string;
  } {
    const msg = errorMsg.toLowerCase();

    // Check for error code first
    if (errorObj?.code) {
      switch (errorObj.code) {
        case 'TOO_MANY_REQUESTS':
          return { code: errorObj.code, type: 'warning', message: errorMsg };
        case 'UNAUTHORIZED':
          return { code: errorObj.code, type: 'error', message: errorMsg };
        case 'NOT_FOUND':
          return { code: errorObj.code, type: 'error', message: errorMsg };
        case 'SERVICE_UNAVAILABLE':
          return { code: errorObj.code, type: 'warning', message: errorMsg };
        default:
          return { code: errorObj.code, type: 'error', message: errorMsg };
      }
    }

    // Categorize based on message content
    if (msg.includes('rate limit') || msg.includes('429') || msg.includes('quota')) {
      return { code: 'TOO_MANY_REQUESTS', type: 'warning', message: errorMsg };
    }
    if (
      msg.includes('api key') ||
      msg.includes('unauthorized') ||
      msg.includes('401') ||
      msg.includes('authentication')
    ) {
      return { code: 'UNAUTHORIZED', type: 'error', message: errorMsg };
    }
    if (
      msg.includes('not found') ||
      msg.includes('404') ||
      (msg.includes('model') && (msg.includes('not available') || msg.includes('does not exist')))
    ) {
      return { code: 'NOT_FOUND', type: 'error', message: errorMsg };
    }
    if (
      msg.includes('context') ||
      msg.includes('too long') ||
      (msg.includes('maximum') && msg.includes('length'))
    ) {
      return { code: 'BAD_REQUEST', type: 'warning', message: errorMsg };
    }
    if (
      msg.includes('network') ||
      msg.includes('connection') ||
      msg.includes('timeout') ||
      msg.includes('fetch')
    ) {
      return { code: 'SERVICE_UNAVAILABLE', type: 'warning', message: errorMsg };
    }

    // Default error
    return { code: 'INTERNAL_SERVER_ERROR', type: 'error', message: errorMsg };
  }

  // Track tokens during streaming
  $effect(() => {
    if (isStreamingResponse && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        streamingMessageId = lastMessage.id || null;
        const textPart = lastMessage.parts?.find(
          (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text'
        );
        const content = textPart && 'text' in textPart ? textPart.text : '';
        streamingTokenCount = estimateTokens(content);
      }
    } else if (!isStreamingResponse && streamingMessageId) {
      // Streaming just ended, keep the last token count
      streamingMessageId = null;
      streamingTokenCount = 0;
      // Initialize Mermaid diagrams after streaming completes
      requestAnimationFrame(() => {
        initMermaidDiagrams();
      });
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
      // Fetch chat data and active model in parallel
      const results = await Promise.allSettled([
        orpc.chat.getById({ id: chatId()! }),
        orpc.model.getActive(),
      ]);

      // Extract chat result (fulfilled or rejected)
      const chatResult = results[0];
      const data = chatResult.status === 'fulfilled' ? chatResult.value : null;

      // Extract model result (fulfilled or rejected, set to null on rejection)
      const modelResult = results[1];
      const model = modelResult.status === 'fulfilled' ? modelResult.value : null;

      if (data) {
        chatData = data;

        // Clear existing messages and token data before loading new ones
        chat.messages = [];
        messageTokenData.clear();

        // Load existing messages into Chat SDK
        if (data.messages && data.messages.length > 0) {
          // Convert database messages to Chat SDK format
          for (const msg of data.messages) {
            let messageObj;

            if (msg.role === 'user') {
              messageObj = {
                role: 'user',
                parts: [{ type: 'text', text: msg.content }],
              } as any;
            } else if (msg.role === 'assistant') {
              messageObj = {
                role: 'assistant',
                parts: [{ type: 'text', text: msg.content }],
              } as any;

              // Extract token data from metadata if available
              if (msg.metadata && typeof msg.metadata === 'object') {
                const metadata = msg.metadata as any;
                if (metadata.tokens || metadata.promptTokens || metadata.completionTokens) {
                  messageTokenData.set(msg.id, {
                    exactTokens: metadata.completionTokens || metadata.tokens,
                    promptTokens: metadata.promptTokens,
                  });
                }
              }
            }

            if (messageObj) {
              chat.messages.push(messageObj);
            }
          }
        }
      }

      // Store active model for display (always set, even if data is null)
      activeModel = model;
    } catch (err) {
      console.error('Failed to load chat:', err);
      const errorObj = err instanceof Error ? err : new Error('Failed to load chat');
      const categorized = categorizeError(
        'Failed to load chat. Please try refreshing the page.',
        errorObj as any
      );
      errorMessage = categorized.message;
      errorCode = categorized.code;
      errorType = categorized.type;
    } finally {
      loading = false;
      // Initialize Mermaid diagrams after loading chat
      requestAnimationFrame(() => {
        initMermaidDiagrams();
      });
    }
  }

  function isStreaming() {
    return isStreamingResponse || isRetrying;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isRetrying || isStreamingResponse || isSubmitting) return;

    clearError();
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

          // Create the message and get the database record with metadata
          const createdMessage = await orpc.message.create({
            chatId: chatId()!,
            content: assistantContent,
            role: 'assistant',
          });

          // Extract token data from the saved message metadata
          if (
            createdMessage &&
            createdMessage.metadata &&
            typeof createdMessage.metadata === 'object'
          ) {
            const metadata = createdMessage.metadata as {
              tokens?: number;
              promptTokens?: number;
              completionTokens?: number;
            };
            if (metadata.tokens || metadata.promptTokens || metadata.completionTokens) {
              messageTokenData.set(assistantMessage.id || createdMessage.id, {
                exactTokens: metadata.completionTokens || metadata.tokens,
                promptTokens: metadata.promptTokens,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorObj = error instanceof Error ? error : new Error('Failed to send message');

      if (errorObj.name === 'AbortError') {
        errorMessage = wasStopped ? 'Generation was stopped' : 'Request was interrupted';
        errorCode = undefined;
        errorType = 'info';
      } else if (
        errorObj.message.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') ||
        errorObj.message.includes('chunked') ||
        errorObj.message.includes('network') ||
        errorObj.message.includes('fetch') ||
        errorObj.message.includes('No assistant response')
      ) {
        const categorized = categorizeError('Connection interrupted. Please try again.', errorObj);
        errorMessage = categorized.message;
        errorCode = categorized.code;
        errorType = categorized.type;
      } else {
        const categorized = categorizeError(errorObj.message, errorObj as any);
        errorMessage = categorized.message;
        errorCode = categorized.code;
        errorType = categorized.type;
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

              // Create the message and get the database record with metadata
              const createdMessage = await orpc.message.create({
                chatId: chatId()!,
                content: assistantContent,
                role: 'assistant',
              });

              // Extract token data from the saved message metadata
              if (
                createdMessage &&
                createdMessage.metadata &&
                typeof createdMessage.metadata === 'object'
              ) {
                const metadata = createdMessage.metadata as {
                  tokens?: number;
                  promptTokens?: number;
                  completionTokens?: number;
                };
                if (metadata.tokens || metadata.promptTokens || metadata.completionTokens) {
                  messageTokenData.set(assistantMessage.id || createdMessage.id, {
                    exactTokens: metadata.completionTokens || metadata.tokens,
                    promptTokens: metadata.promptTokens,
                  });
                }
              }
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

    clearError();
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
      const errorObj = error instanceof Error ? error : new Error('Failed to regenerate response');
      const categorized = categorizeError(errorObj.message, errorObj as any);
      errorMessage = categorized.message;
      errorCode = categorized.code;
      errorType = categorized.type;
    } finally {
      isStreamingResponse = false;
      abortController = null;
    }
  }

  // Handle retry action from error display
  function handleRetry() {
    if (!input.trim() && chat.messages.length > 0) {
      // If no input, retry the last user message
      const lastUserMessage = [...chat.messages].reverse().find((m) => m.role === 'user');
      if (lastUserMessage) {
        _handleRegenerate();
      }
    } else {
      // Otherwise, submit the current input
      handleSubmit(new Event('submit'));
    }
  }

  // Handle settings action from error display
  function handleSettings() {
    // Navigate to settings or open settings modal
    // For now, just clear the error
    // TODO: Implement proper navigation to settings
    clearError();
  }

  // Handle dismiss action from error display
  function handleDismiss() {
    clearError();
  }

  async function handleExport(format: 'json' | 'md' | 'txt') {
    if (!chatData) return;

    try {
      const exportData = {
        ...chatData,
        messages: chatData.messages.map((msg) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          metadata: msg.metadata || undefined,
          createdAt: msg.createdAt,
        })),
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

  // Estimate token count from text (approximately 4 characters per token for OpenAI)
  function estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  // Get token data for a message
  function getMessageTokenData(messageId: string) {
    return messageTokenData.get(messageId);
  }
</script>

<div class="flex h-screen flex-col overflow-hidden">
  <!-- Header -->
  <div class="shrink-0 border-b px-6 py-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <SecondarySidebarTrigger class="-ms-1" />
        <Separator orientation="vertical" class="data-[orientation=vertical]:h-4" />
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
              {#if activeModel}
                <span class="flex items-center gap-1">
                  <CodeIcon class="size-3" />
                  {activeModel.name}
                </span>
              {/if}
            </p>
          {/if}
        </div>
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
        <div class="w-full max-w-3xl">
          <ChatSkeleton count={3} />
        </div>
      </div>
    {:else if messages.length === 0}
      <div class="flex h-full items-center justify-center">
        <div class="text-muted-foreground text-center">
          <p class="mb-2 text-lg">Start a conversation</p>
          <p class="text-sm">Type a message below to begin chatting.</p>
        </div>
      </div>
    {:else}
      <div class="mx-auto max-w-3xl space-y-6">
        {#each messages as message, index (message.id || index)}
          {@const isLast = index === messages.length - 1}
          {@const isStreamingMessage =
            message.role === 'assistant' && isLast && isStreamingResponse && !wasStopped}
          {@const isStoppedMessage =
            message.role === 'assistant' && isLast && wasStopped && !isStreamingResponse}
          {@const isThisStoppedMessage = message.id === stoppedMessageId}
          {@const messageText =
            (message.parts?.find((p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text')
              ?.text as string) || ''}
          <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
            <div
              class="group max-w-[85%] rounded-2xl px-4 py-3 text-sm transition-all duration-200 hover:shadow-lg md:text-base {message.role ===
              'user'
                ? 'bg-accent text-accent-foreground rounded-tr-sm'
                : 'bg-muted text-card-foreground rounded-tl-sm'}"
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

              {#if message.role === 'assistant'}
                <div
                  class="markdown-content prose-p:text-card-foreground prose prose-sm max-w-none dark:prose-invert"
                  class:opacity-70={isThisStoppedMessage}
                >
                  {#if isThisStoppedMessage && stoppedMessageContent}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized by DOMPurify in markdown-renderer.ts -->
                    {@html renderMarkdownSync(stoppedMessageContent)}
                  {:else}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized by DOMPurify in markdown-renderer.ts -->
                    {@html renderMarkdownSync(messageText)}
                    {#if isStreamingMessage && !messageText}
                      <span class="ml-1 inline-block h-4 w-2 animate-pulse bg-current opacity-50"
                      ></span>
                    {/if}
                  {/if}
                </div>
                <!-- Token display for assistant messages -->
                <div class="mt-2">
                  {#if isStreamingResponse && streamingMessageId === message.id}
                    <TokenDisplay currentTokens={streamingTokenCount} isStreaming={true} />
                  {:else}
                    {@const tokenData = getMessageTokenData(message.id)}
                    {#if tokenData}
                      <TokenDisplay
                        exactTokens={tokenData.exactTokens}
                        promptTokens={tokenData.promptTokens}
                        isStreaming={false}
                      />
                    {/if}
                  {/if}
                </div>
              {:else}
                <div class="whitespace-pre-wrap">{messageText}</div>
              {/if}
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
      </div>
    {/if}

    {#if errorMessage}
      <div class="mx-auto mt-4 max-w-3xl">
        <ErrorDisplay
          message={errorMessage}
          code={errorCode}
          type={errorType}
          onRetry={handleRetry}
          onSettings={handleSettings}
          onDismiss={handleDismiss}
        />
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
