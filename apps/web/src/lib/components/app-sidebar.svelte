<script lang="ts">
  import NavUser from './nav-user.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getIcon } from '$lib/navigation/icon-mapper';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import CommandIcon from '@lucide/svelte/icons/command';
  import type { ComponentProps } from 'svelte';

  // Load nav config from JSON
  import navRailConfig from '$lib/navigation/nav-rail-menu.config.json';
  import secondarySidebarConfig from '$lib/navigation/secondary-sidebar-menu.config.json';

  // Type definitions for nav config
  interface NavItem {
    id: string;
    label: string;
    icon: string;
    path: string;
    description: string;
    keyboardShortcut?: string;
    enabled: boolean;
    requiresTeam?: boolean;
    order: number;
  }

  // Type guards for sidebar config
  function isSettingsContext(ctx: unknown): ctx is { hidden: boolean; description: string } {
    return typeof ctx === 'object' && ctx !== null && 'hidden' in ctx;
  }

  function hasHeader(ctx: unknown): ctx is { header: { title: string; actionButton?: unknown } } {
    return typeof ctx === 'object' && ctx !== null && 'header' in ctx;
  }

  function hasSearch(ctx: unknown): ctx is { search: { placeholder: string } } {
    return typeof ctx === 'object' && ctx !== null && 'search' in ctx;
  }

  function hasCategories(ctx: unknown): ctx is { categories: unknown[] } {
    return typeof ctx === 'object' && ctx !== null && 'categories' in ctx;
  }

  interface Props {
    ref?: ComponentProps<typeof Sidebar.Root>['ref'];
    user?: {
      name: string;
      email: string;
      avatar?: string;
    };
  }

  let { ref = $bindable(null), user, ...restProps }: Props = $props();

  // Filter enabled menu items
  const menuItems = navRailConfig.menuItems.filter((item) => item.enabled);

  // Get active nav item based on current path
  const activeNavId = $derived(() => {
    const path = $page.url.pathname;
    for (const item of menuItems) {
      if (item.path === '/team' && path.startsWith('/team')) return item.id;
      if (path === item.path || path.startsWith(item.path + '/')) return item.id;
    }
    return menuItems[0]?.id || 'chat';
  });

  // Get secondary sidebar context config
  const sidebarConfig = $derived(
    secondarySidebarConfig.contexts[
      activeNavId() as keyof typeof secondarySidebarConfig.contexts
    ] || secondarySidebarConfig.contexts.chat
  );

  const sidebar = useSidebar();

  // Handle navigation
  function handleNavClick(item: NavItem) {
    goto(item.path);
    sidebar.setOpen(true);
  }

  // Type guard for action button
  function hasActionButton(
    header: unknown
  ): header is { title: string; actionButton: { label: string; icon?: string } } {
    return typeof header === 'object' && header !== null && 'actionButton' in header;
  }
</script>

<Sidebar.Root
  bind:ref
  collapsible="icon"
  class="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
  {...restProps}
>
  <!-- Navigation Rail (64px) -->
  <Sidebar.Root collapsible="none" class="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-e">
    <Sidebar.Header>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton size="lg" class="md:h-8 md:p-0">
            {#snippet child({ props })}
              <a href="/app/chat" {...props}>
                <div
                  class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                >
                  <CommandIcon class="size-4" />
                </div>
                <div class="grid flex-1 text-start text-sm leading-tight">
                  <span class="truncate font-medium">Sambung</span>
                  <span class="truncate text-xs">Chat</span>
                </div>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Header>
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupContent class="px-1.5 md:px-0">
          <Sidebar.Menu>
            {#each menuItems as item (item.id)}
              {@const Icon = getIcon(item.icon)}
              {#if Icon}
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton
                    onclick={() => handleNavClick(item)}
                    isActive={activeNavId() === item.id}
                    class="px-2.5 md:px-2"
                    tooltipContent={undefined}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
              {/if}
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer>
      {#if user}
        <NavUser {user} />
      {/if}
    </Sidebar.Footer>
  </Sidebar.Root>

  <!-- Secondary Sidebar (280px) - Context aware content -->
  {#if !isSettingsContext(sidebarConfig)}
    <Sidebar.Root collapsible="none" class="hidden flex-1 md:flex">
      <Sidebar.Header class="gap-3.5 border-b p-4">
        <div class="flex w-full items-center justify-between">
          <div class="text-foreground text-base font-medium">
            {hasHeader(sidebarConfig) && sidebarConfig.header.title
              ? sidebarConfig.header.title
              : sidebarConfig.label}
          </div>
          {#if hasHeader(sidebarConfig) && hasActionButton(sidebarConfig.header)}
            <button
              class="focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              {#if sidebarConfig.header.actionButton.icon}
                {@const ActionIcon = getIcon(sidebarConfig.header.actionButton.icon)}
                {#if ActionIcon}
                  <ActionIcon class="mr-1 size-4" />
                {/if}
              {/if}
              {sidebarConfig.header.actionButton.label}
            </button>
          {/if}
        </div>
        {#if hasSearch(sidebarConfig)}
          {@const SearchIcon = getIcon('Search')}
          {#if SearchIcon}
            <div class="relative">
              <SearchIcon class="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
              <input
                type="text"
                placeholder={sidebarConfig.search.placeholder}
                class="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-8 w-full rounded-md border bg-transparent px-3 py-1 pl-8 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          {/if}
        {/if}
      </Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Group class="px-0">
          <Sidebar.GroupContent>
            {#if hasCategories(sidebarConfig)}
              {#each sidebarConfig.categories as category}
                {@const CategoryIcon = getIcon(category.icon)}
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton>
                    {#if CategoryIcon}
                      <CategoryIcon />
                    {/if}
                    <span>{category.label}</span>
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
              {/each}
            {:else}
              <div class="text-muted-foreground p-4 text-center text-sm">
                <p>No items to display</p>
              </div>
            {/if}
          </Sidebar.GroupContent>
        </Sidebar.Group>
      </Sidebar.Content>
    </Sidebar.Root>
  {/if}
</Sidebar.Root>
