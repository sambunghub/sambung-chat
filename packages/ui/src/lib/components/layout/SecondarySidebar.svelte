<script lang="ts">
  import { cn } from '../../utils';
  import { Button } from '../ui/button';
  import { Plus, Search } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLInputElement } from 'svelte/elements';

  export interface SecondarySidebarProps {
    context?: 'chat' | 'prompts' | 'settings';
    searchQuery?: string;
    onSearch?: (query: string) => void;
    onNew?: () => void;
    class?: string;
    content?: Snippet;
    footer?: Snippet;
  }

  interface Props extends SecondarySidebarProps {}

  let {
    context = 'chat',
    searchQuery = '',
    onSearch,
    onNew,
    class: className = '',
    content,
    footer,
  }: Props = $props();

  let searchInput = $state<HTMLInputElement | undefined>(undefined);
  let isTablet = $state(false);

  // Detect tablet mode for collapsed sidebar
  $effect(() => {
    if (typeof window === 'undefined') return;
    isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  });
</script>

<aside
  class={cn(
    'flex flex-col h-full bg-card border-r border-border transition-all duration-300',
    className
  )}
>
  <!-- Header / Action Section -->
  <div class="p-4 border-b border-border">
    {#if context === 'chat'}
      <Button onclick={() => onNew?.()} class="w-full justify-start gap-2" variant="default">
        <Plus class="w-4 h-4" />
        <span class={cn('transition-opacity duration-200', isTablet && 'opacity-0')}>
          New Chat
        </span>
      </Button>
    {:else if context === 'prompts'}
      <Button onclick={() => onNew?.()} class="w-full justify-start gap-2" variant="default">
        <Plus class="w-4 h-4" />
        <span class={cn('transition-opacity duration-200', isTablet && 'opacity-0')}>
          New Prompt
        </span>
      </Button>
    {:else}
      <div
        class={cn(
          'font-semibold',
          'transition-opacity duration-200',
          isTablet && 'text-sm:opacity-0'
        )}
      >
        Settings
      </div>
    {/if}
  </div>

  <!-- Search Section -->
  {#if context !== 'settings'}
    <div class="p-4 border-b border-border">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          bind:this={searchInput}
          type="text"
          placeholder={context === 'chat' ? 'Search chats...' : 'Search prompts...'}
          class={cn(
            'w-full pl-10 pr-4 py-2 text-sm bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring',
            isTablet && 'px-2 pl-9'
          )}
          bind:value={searchQuery}
          oninput={(e) => onSearch?.(e.currentTarget.value)}
        />
      </div>
    </div>
  {/if}

  <!-- Content Section (scrollable) -->
  <div class="flex-1 overflow-y-auto p-2">
    {#if content}
      {@render content()}
    {:else}
      <!-- Default: Empty state -->
      <div class="flex flex-col items-center justify-center h-full text-center p-4">
        <p class="text-sm text-muted-foreground">
          {context === 'chat' && 'No chats yet'}
          {context === 'prompts' && 'No prompts yet'}
          {context === 'settings' && 'Settings navigation'}
        </p>
      </div>
    {/if}
  </div>

  <!-- Footer Section -->
  {#if context === 'chat' && footer}
    <div
      class={cn(
        'p-4 border-t border-border',
        'transition-opacity duration-200',
        isTablet && 'text-xs:opacity-0'
      )}
    >
      {@render footer()}
    </div>
  {/if}
</aside>

<style>
  input::placeholder {
    color: hsl(var(--color-muted-foreground));
  }
</style>
