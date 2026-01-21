<script lang="ts">
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { cn } from '$lib/utils.js';

  /**
   * Props for the ChatSkeleton component
   */
  interface Props {
    /** Number of skeleton messages to display (default: 3) */
    count?: number;
    /** Optional CSS class for the container */
    class?: string;
  }

  let { count = 3, class: className }: Props = $props();

  // Generate alternating message types for visual variety
  const skeletonMessages = $derived(
    Array.from({ length: count }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
    }))
  );
</script>

<div class={cn('space-y-4', className)}>
  {#each skeletonMessages as msg (msg.role)}
    <div class="flex w-full {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
      <div
        class="max-w-[85%] space-y-3 rounded-2xl px-4 py-3 {msg.role === 'user'
          ? 'bg-accent ml-auto rounded-tr-sm'
          : 'bg-muted rounded-tl-sm'}"
      >
        <!-- Role label skeleton -->
        <Skeleton
          class={cn(
            'h-4 w-20',
            msg.role === 'user' ? 'bg-accent-foreground/20' : 'bg-muted-foreground/20'
          )}
        />

        <!-- Message content skeleton lines -->
        <div class="space-y-2">
          <Skeleton
            class={cn(
              'h-4 w-full',
              msg.role === 'user' ? 'bg-accent-foreground/20' : 'bg-card-foreground/20'
            )}
          />
          <Skeleton
            class={cn(
              'h-4 w-4/5',
              msg.role === 'user' ? 'bg-accent-foreground/20' : 'bg-card-foreground/20'
            )}
          />
          <Skeleton
            class={cn(
              'h-4 w-3/5',
              msg.role === 'user' ? 'bg-accent-foreground/20' : 'bg-card-foreground/20'
            )}
          />
        </div>
      </div>
    </div>
  {/each}
</div>
