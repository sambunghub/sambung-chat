<script lang="ts">
  import { cn } from '$lib/utils';

  export interface HeaderProps {
    class?: string;
    logoHref?: string;
  }

  let { class: className = '', logoHref = '/' }: HeaderProps = $props();
</script>

<header
  class={cn(
    'border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 fixed top-0 right-0 left-0 z-50 h-[60px] border-b backdrop-blur',
    className
  )}
>
  <div class="container flex h-full items-center justify-center px-4">
    <a
      href={logoHref}
      class="flex items-center space-x-2 text-xl font-bold transition-opacity hover:opacity-80"
    >
      <span class="from-primary to-primary/50 bg-gradient-to-r bg-clip-text text-transparent">
        SambungChat
      </span>
    </a>
  </div>
</header>
