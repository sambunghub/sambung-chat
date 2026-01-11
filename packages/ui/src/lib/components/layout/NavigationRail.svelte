<script lang="ts">
  import { cn } from '../../utils';
  import * as Tooltip from '../ui/tooltip';
  import { Button } from '../ui/button';
  import { MessageSquare, Sparkles, Settings } from '@lucide/svelte';

  export interface NavigationRailProps {
    currentPath?: string;
    onNavigate?: (path: string) => void;
    class?: string;
    userMenu?: import('svelte').Snippet;
  }

  interface Props extends NavigationRailProps {}

  let { currentPath = '/', onNavigate, class: className = '', userMenu }: Props = $props();

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    path: string;
  }

  const navItems: NavItem[] = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
    { id: 'prompts', label: 'Prompts', icon: Sparkles, path: '/prompts' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];
</script>

<nav
  class={cn('w-16 bg-card border-r border-border flex flex-col items-center py-4 gap-2', className)}
>
  <div class="flex-1 flex flex-col items-center gap-1 w-full">
    {#each navItems as item (item.id)}
      <Tooltip.Root delayDuration={200}>
        <Tooltip.Trigger>
          <Button
            variant={currentPath === item.path ? 'secondary' : 'ghost'}
            size="icon"
            class={cn(
              'relative w-12 h-12 rounded-lg transition-all duration-200',
              currentPath === item.path
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted'
            )}
            onclick={() => onNavigate?.(item.path)}
          >
            <svelte:component this={item.icon} class="w-5 h-5" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content side="right">
          {item.label}
        </Tooltip.Content>
      </Tooltip.Root>
    {/each}
  </div>

  <!-- User Menu at bottom -->
  <div class="mt-auto">
    {#if userMenu}
      {@render userMenu()}
    {:else}
      <Button variant="ghost" size="icon" class="w-12 h-12 rounded-lg">
        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span class="text-xs font-medium text-primary">U</span>
        </div>
      </Button>
    {/if}
  </div>
</nav>
