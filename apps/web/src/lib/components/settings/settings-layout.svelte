<script lang="ts">
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import SecondarySidebarTrigger from '$lib/components/secondary-sidebar-trigger.svelte';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs/index.js';
  import type { Snippet } from 'svelte';

  /**
   * Settings Layout Component
   *
   * This is a reference implementation showing the pattern for settings pages
   * with tabbed navigation. Currently, the Appearance Settings page implements
   * this pattern directly rather than using this component.
   *
   * For a new settings page, you can either:
   * 1. Copy the pattern from apps/web/src/routes/app/settings/appearance/+page.svelte
   * 2. Use this component as a layout wrapper (future enhancement)
   *
   * The pattern consists of:
   * - Header with breadcrumb navigation
   * - Page title and description
   * - Tabbed navigation (Tabs, TabsList, TabsTrigger)
   * - Tab content areas (TabsContent)
   * - Card-based sections for organization
   *
   * @example
   * See apps/web/src/routes/app/settings/appearance/+page.svelte for a working example
   */
</script>

<!-- SETTINGS LAYOUT PATTERN REFERENCE

This component documents the standard layout pattern for settings pages.
For a complete working example, see: apps/web/src/routes/app/settings/appearance/+page.svelte

The pattern consists of:
- Header with breadcrumb navigation
- Page title and description
- Tabbed navigation (Tabs, TabsList, TabsTrigger)
- Tab content areas (TabsContent)
- Card-based sections for organization
-->

<div class="flex items-center justify-center p-12">
  <div class="text-center">
    <p class="text-muted-foreground text-lg">Settings Layout Pattern Reference</p>
    <p class="text-muted-foreground mb-4 text-sm">See component source code for documentation</p>
    <code class="bg-muted rounded px-2 py-1 text-xs">
      apps/web/src/routes/app/settings/appearance/+page.svelte
    </code>
  </div>
</div>
