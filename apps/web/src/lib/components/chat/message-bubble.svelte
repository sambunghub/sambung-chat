<script lang="ts">
  import { chatViewMode } from '$lib/stores/chat-view-mode';
  import { cn } from '$lib/utils';

  interface Props {
    role: 'user' | 'assistant' | 'system';
    children: import('svelte').Snippet;
    class?: string;
    streaming?: boolean;
    animate?: boolean;
  }

  let {
    role,
    children,
    class: className = '',
    streaming = false,
    animate = true,
  }: Props = $props();

  let viewMode = $state('flat' as 'flat' | 'rounded');

  // Subscribe to store updates
  $effect(() => {
    const unsubscribe = chatViewMode.subscribe((value) => {
      viewMode = value;
    });
    return unsubscribe;
  });

  // Flat mode styles (document-like, clean)
  const flatUser = 'bg-primary/10 border-l-4 border-primary rounded-none px-6 py-4 max-w-[95%]';
  const flatAssistant =
    'bg-transparent border-l-4 border-muted-foreground/30 rounded-none px-6 py-4 max-w-[95%]';

  // Rounded mode styles (chat-like, modern)
  const roundedUser =
    'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] shadow-sm hover:shadow-md';
  const roundedAssistant =
    'bg-muted text-card-foreground rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-sm hover:shadow-md';

  const bubbleClass = $derived(() => {
    let baseClass = '';
    if (viewMode === 'flat') {
      baseClass = role === 'user' ? flatUser : flatAssistant;
    } else {
      baseClass = role === 'user' ? roundedUser : roundedAssistant;
    }

    // Add streaming animation styles
    if (streaming) {
      baseClass = cn(baseClass, 'border-primary border-2 shadow-lg streaming-pulse');
    }

    return baseClass;
  });
</script>

<div
  class={cn(
    'group max-w-[85%] text-sm transition-all duration-200 md:text-base',
    bubbleClass(),
    animate && 'message-enter',
    className
  )}
>
  {@render children()}
</div>
