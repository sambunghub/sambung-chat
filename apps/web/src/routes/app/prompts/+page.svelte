<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import SecondarySidebarTrigger from '$lib/components/secondary-sidebar-trigger.svelte';
</script>

<header class="bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b p-4">
  <SecondarySidebarTrigger class="-ms-1" />
  <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item>
        <Breadcrumb.Page>Prompts</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb.List>
  </Breadcrumb.Root>
</header>

<div class="flex h-[calc(100vh-61px)] items-center justify-center p-8">
  <div class="text-center">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="96"
      height="96"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="text-primary mx-auto mb-6 opacity-50"
    >
      <path
        d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962.63l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1.1.73v.47a2 2 0 0 1-1 1.74l.15-.09a2 2 0 0 0 .73-2.73l.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
      />
      <path d="M14 9V6a3 3 0 0 0-3-3" />
      <path d="M20.2 6a3 3 0 0 0-3-3" />
      <path d="M6.1 12.2a3 3 0 0 0 3.756 0M11 19a2 2 0 0 1-2 0" />
    </svg>
    <h1 class="mb-3 text-3xl font-bold">Prompts Library</h1>
    <p class="text-muted-foreground mb-6 text-lg">
      Save and reuse prompt templates for consistent AI interactions
    </p>
    <div class="text-muted-foreground text-sm">
      <p>Coming Soon</p>
      <p class="mt-2">Create, organize, and share effective prompt templates</p>
    </div>
  </div>
</div>
