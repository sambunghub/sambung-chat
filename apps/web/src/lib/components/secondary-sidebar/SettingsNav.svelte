<script lang="ts">
  import { page } from '$app/stores';
  import CpuIcon from '@lucide/svelte/icons/cpu';
  import KeyIcon from '@lucide/svelte/icons/key';
  import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
  }

  let { title = 'Settings' }: Props = $props();

  const navItems = [
    {
      label: 'Account',
      href: '/app/settings/account',
      icon: BadgeCheckIcon,
    },
    {
      label: 'API Keys',
      href: '/app/settings/api-keys',
      icon: KeyIcon,
    },
    {
      label: 'Models',
      href: '/app/settings/models',
      icon: CpuIcon,
    },
  ];

  function isActive(href: string) {
    if (href === '/app/settings/models') {
      return $page.url.pathname === '/app/settings/models';
    }
    return $page.url.pathname.startsWith(href);
  }
</script>

<div class="flex h-full flex-col">
  <!-- Header -->
  <div class="border-b px-4 py-3">
    <h2 class="text-foreground text-sm font-semibold">{title}</h2>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 space-y-1 overflow-y-auto p-2">
    {#each navItems as item}
      {@const Icon = item.icon}
      <a
        href={item.href}
        class="hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActive(
          item.href
        )
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground'}"
      >
        <Icon class="size-4" />
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>
</div>
