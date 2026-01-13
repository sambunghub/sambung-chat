<script lang="ts">
  import { cn } from '../../utils';
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children: Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<!-- shadcn-svelte login-01 pattern: simple centered form -->
<div class={cn('flex h-screen w-full items-center justify-center px-4', className)}>
  {@render children()}
</div>
