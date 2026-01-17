# Sidebar Implementation Journey

## Overview

This document captures the journey of implementing a dual-sidebar navigation system (NavigationRail + SecondarySidebar) in SambungChat using shadcn-svelte components.

## Context

**Date:** 2026-01-16
**Branch:** `feat/refactor-ui-to-web`
**Commit:** e186a6f - "feat: implement complete navigation system with dual-sidebar architecture"

## The Challenge

### Initial Requirements

1. Implement dual-sidebar system:
   - **Navigation Rail (64px)**: Icon-based primary navigation
   - **Secondary Sidebar (280px)**: Context-aware content (chat history, agents list, etc.)
2. Use shadcn-svelte sidebar components
3. Support collapsible sidebar functionality
4. Ensure proper hydration and SSR

## Problems Encountered

### Problem 1: Nested `Sidebar.Root` Structure

**Error:** `HierarchyRequestError: Failed to execute 'appendChild' on 'Node': This node type does not support this method.`

**Root Cause:**
The `app-sidebar.svelte` component had nested `Sidebar.Root` components:

```svelte
<Sidebar.Root>  <!-- Outer root -->
  <Sidebar.Root>  <!-- Nav Rail -->
  <Sidebar.Root>  <!-- Secondary Sidebar -->
</Sidebar.Root>
```

Each `Sidebar.Root` creates its own DOM structure with specific `data-sidebar` attributes. Nesting them caused DOM manipulation failures during hydration.

**Solution:**
Replaced outer `Sidebar.Root` with a simple flex `<div>` container:

```svelte
<div class="flex overflow-hidden">
  <Sidebar.Root collapsible="none">  <!-- Nav Rail -->
  <Sidebar.Root collapsible="none">  <!-- Secondary Sidebar -->
</div>
```

**Files Modified:**

- [`apps/web/src/lib/components/app-sidebar.svelte`](../apps/web/src/lib/components/app-sidebar.svelte#L92-L214)

### Problem 2: Nested `Sidebar.Inset` Components

**Error:** Hydration mismatch between server and client rendering

**Root Cause:**
Both the app layout AND individual pages had `Sidebar.Inset`:

- Layout: `<Sidebar.Inset>{@render children()}</Sidebar.Inset>`
- Pages: `<Sidebar.Inset><header>...</header><div>...</div></Sidebar.Inset>`

This created a double-nested structure that shadcn-svelte sidebar doesn't support.

**Solution:**
Removed `Sidebar.Inset` from individual pages, keeping it only in the app layout:

```svelte
<!-- Layout -->
<Sidebar.Provider>
  <AppSidebar {user} />
  <Sidebar.Inset>
    {@render children()}
  </Sidebar.Inset>
</Sidebar.Provider>

<!-- Pages - direct content, no Sidebar.Inset wrapper -->
<header class="...">...</header>
<div class="...">...</div>
```

**Files Modified:**

- [`apps/web/src/routes/app/+layout.svelte`](../apps/web/src/routes/app/+layout.svelte)
- [`apps/web/src/routes/app/agents/+page.svelte`](../apps/web/src/routes/app/agents/+page.svelte)
- [`apps/web/src/routes/app/prompts/+page.svelte`](../apps/web/src/routes/app/prompts/+page.svelte)
- [`apps/web/src/routes/app/chat/+page.svelte`](../apps/web/src/routes/app/chat/+page.svelte)

### Problem 3: Tooltip Provider SSR Mismatch

**Error:** `Failed to hydrate: TypeError: element2.getAttribute is not a function in tooltip-provider.svelte`

**Root Cause:**
The `bits-ui` Tooltip.Provider component doesn't handle SSR well. When included in server-rendered HTML, it creates DOM elements that behave differently during client-side hydration.

**Solution:**
Use browser-only rendering for Tooltip.Provider in sidebar-provider.svelte:

```svelte
<script lang="ts">
  import { browser } from '$app/environment';
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
</script>

{#if browser}
  <Tooltip.Provider delayDuration={0}>
    <div><!-- content --></div>
  </Tooltip.Provider>
{:else}
  <!-- Server-side: render without Tooltip.Provider -->
  <div><!-- content --></div>
{/if}
```

**Files Modified:**

- [`packages/ui/src/lib/components/ui/sidebar/sidebar-provider.svelte`](../packages/ui/src/lib/components/ui/sidebar/sidebar-provider.svelte)

### Problem 4: Tooltip Content Default Values

**Error:** Hydration mismatch in sidebar menu buttons

**Root Cause:**
The header logo button in `app-sidebar.svelte` didn't have `tooltipContent={undefined}`, causing the default tooltip wrapper to create SSR/client mismatch.

**Solution:**

```svelte
<Sidebar.MenuButton size="lg" class="md:h-8 md:p-0" tooltipContent={undefined}>
```

**Files Modified:**

- [`apps/web/src/lib/components/app-sidebar.svelte`](../apps/web/src/lib/components/app-sidebar.svelte#L103)

## Final Architecture

### Layout Structure

```svelte
<!-- apps/web/src/routes/app/+layout.svelte -->
<Sidebar.Provider style="--sidebar-width: 280px; --sidebar-width-icon: 3rem;">
  <AppSidebar {user} />
  <Sidebar.Inset>
    {@render children()}
  </Sidebar.Inset>
</Sidebar.Provider>
```

### App Sidebar Component

```svelte
<!-- apps/web/src/lib/components/app-sidebar.svelte -->
<div class="flex overflow-hidden">
  <!-- Navigation Rail (64px) -->
  <Sidebar.Root collapsible="none" class="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-e">
    <!-- Nav rail content -->
  </Sidebar.Root>

  <!-- Secondary Sidebar (280px) -->
  {#if !isSettingsContext(sidebarConfig)}
    <Sidebar.Root collapsible="none" class="flex-1">
      <!-- Context-aware content -->
    </Sidebar.Root>
  {/if}
</div>
```

### Page Structure

```svelte
<!-- Individual pages (agents, prompts, chat, etc.) -->
<script>
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
</script>

<header class="bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b p-4">
  <Sidebar.Trigger class="-ms-1" />
  <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item>
        <Breadcrumb.Page>Page Title</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb.List>
  </Breadcrumb.Root>
</header>

<div class="flex h-[calc(100vh-61px)] flex-col">
  <!-- Page content -->
</div>
```

## Key Lessons Learned

### 1. Don't Nest Sidebar Components

- Each `Sidebar.Root` creates its own DOM structure
- Never nest `Sidebar.Root` inside another `Sidebar.Root`
- Use regular `<div>` containers for custom layout needs

### 2. Sidebar.Inset Belongs in Layout Only

- `Sidebar.Inset` should wrap page content at the layout level
- Individual pages should NOT have their own `Sidebar.Inset` wrapper
- This prevents double-nesting issues

### 3. Use Browser-Only Rendering for SSR-Unsafe Components

- Wrap components that don't handle SSR well with `{#if browser}` checks
- Import `browser` from `$app/environment`
- This prevents hydration mismatches from third-party libraries like `bits-ui`

### 4. Disable Tooltips When Not Needed

- Use `tooltipContent={undefined}` to disable default tooltip behavior
- Prevents SSR hydration mismatches
- Especially important for logo/home buttons

### 5. Follow shadcn-svelte Reference Patterns

- Refer to official examples: https://shadcn-svelte.com/blocks/sidebar
- **sidebar-09** (Collapsible nested sidebars) was the closest match for dual-sidebar layout
- Follow the exact structure: `Provider > AppSidebar + Inset`

### 6. CSS Variables Must Be Set Correctly

```svelte
<Sidebar.Provider style="--sidebar-width: 280px; --sidebar-width-icon: 3rem;">
```

- Define both `--sidebar-width` and `--sidebar-width-icon`
- Set on `Sidebar.Provider` to propagate to all sidebar components

### 7. Null-Safe Data Access for Server Load Functions

```svelte
<!-- Use optional chaining and null coalescing -->
<Component
  showFeature={data?.showFeature ?? false}
  {data?.item}
/>

<!-- Or use derived values in components -->
<script>
  let { showFeature = false }: Props = $props();
  const isEnabled = $derived(Boolean(showFeature));
</script>
```

## Configuration Files

### Navigation Configuration

Navigation items are configured in JSON for easy maintenance:

**Primary Navigation:** [`apps/web/src/lib/navigation/nav-rail-menu.config.json`](../apps/web/src/lib/navigation/nav-rail-menu.config.json)

```json
{
  "menuItems": [
    {
      "id": "chat",
      "label": "Chat",
      "icon": "MessageSquare",
      "path": "/app/chat",
      "enabled": true,
      "order": 1
    }
  ]
}
```

**Secondary Sidebar:** [`apps/web/src/lib/navigation/secondary-sidebar-menu.config.json`](../apps/web/src/lib/navigation/secondary-sidebar-menu.config.json)

```json
{
  "contexts": {
    "chat": {
      "label": "Chat History",
      "header": { "title": "Chats" },
      "categories": [...]
    }
  }
}
```

## Testing & Verification

### Auth Redirect Verification

```bash
# Should return 302 redirect to /login when not authenticated
curl -sI http://localhost:5173/app/agents

# Should return 200 with content when authenticated
curl -sL http://localhost:5173/app/agents | grep -E "(Agents|Library)"
```

### TypeScript Verification

```bash
cd apps/web
bun run check
# Expected: 0 errors, 0 warnings
```

## Future Improvements

### TODO Items

1. **Sidebar Collapse Functionality** - Currently broken, needs restoration
2. **Mobile Responsiveness** - Test and improve mobile experience
3. **Keyboard Shortcuts** - Implement keyboard navigation (Alt+C for Chat, etc.)
4. **Context-Aware Search** - Functional search in secondary sidebar
5. **Action Buttons** - Wire up "New Chat", "Create Agent" buttons

### Known Limitations

- Secondary sidebar is currently always expanded (no collapse state)
- Search input is present but not functional
- Category expansion state not persisted
- No loading skeletons for async data

## References

- [shadcn-svelte Sidebar Blocks](https://shadcn-svelte.com/blocks/sidebar)
- [shadcn-svelte Sidebar API](https://shadcn-svelte.com/docs/components/sidebar)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [SvelteKit Routing](https://kit.svelte.dev/docs/routing)

## Related Files

- [`apps/web/src/lib/components/app-sidebar.svelte`](../apps/web/src/lib/components/app-sidebar.svelte)
- [`apps/web/src/routes/app/+layout.svelte`](../apps/web/src/routes/app/+layout.svelte)
- [`apps/web/src/hooks.server.ts`](../apps/web/src/hooks.server.ts)
- [`packages/ui/src/lib/components/ui/sidebar/`](../packages/ui/src/lib/components/ui/sidebar/)

---

**Last Updated:** 2026-01-16
**Status:** ✅ Base structure working, collapse functionality pending
