<script lang="ts">
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
        <Breadcrumb.Page>Agents</Breadcrumb.Page>
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
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
    <h1 class="mb-3 text-3xl font-bold">Agents Library</h1>
    <p class="text-muted-foreground mb-6 text-lg">
      Create and manage AI agents with custom personalities and capabilities
    </p>
    <div class="text-muted-foreground text-sm">
      <p>Coming Soon</p>
      <p class="mt-2">Build, customize, and deploy AI agents for your specific needs</p>
    </div>
  </div>
</div>
