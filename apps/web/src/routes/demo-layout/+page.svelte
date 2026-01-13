<script lang="ts">
  import { AppLayout, AuthLayout, NavigationRail, SecondarySidebar } from '@sambung-chat/ui';
  import { Button } from '@sambung-chat/ui';
  import { User } from '@lucide/svelte';

  let currentPath = $state('/chat');
  let showDemo = $state('applayout');
</script>

<div class="min-h-screen bg-background">
  <!-- Demo Navigation -->
  <nav class="border-b border-border bg-card p-4">
    <div class="container mx-auto flex items-center justify-between">
      <h1 class="text-xl font-bold">Layout Components Demo</h1>
      <div class="flex gap-2">
        <Button
          variant={showDemo === 'applayout' ? 'default' : 'outline'}
          size="sm"
          onclick={() => (showDemo = 'applayout')}
        >
          AppLayout
        </Button>
        <Button
          variant={showDemo === 'auth' ? 'default' : 'outline'}
          size="sm"
          onclick={() => (showDemo = 'auth')}
        >
          AuthLayout
        </Button>
        <Button
          variant={showDemo === 'navigation' ? 'default' : 'outline'}
          size="sm"
          onclick={() => (showDemo = 'navigation')}
        >
          NavigationRail
        </Button>
        <Button
          variant={showDemo === 'sidebar' ? 'default' : 'outline'}
          size="sm"
          onclick={() => (showDemo = 'sidebar')}
        >
          SecondarySidebar
        </Button>
      </div>
    </div>
  </nav>

  <!-- Demo Content -->
  <div class="p-8">
    {#if showDemo === 'applayout'}
      <section class="mb-8">
        <h2 class="text-2xl font-bold mb-4">AppLayout Demo</h2>
        <p class="text-muted-foreground mb-4">
          Main application layout with Navigation Rail and Secondary Sidebar. Responsive design -
          try resizing your browser.
        </p>

        <div class="rounded-lg border border-border overflow-hidden" style="height: 600px;">
          <AppLayout>
            {#snippet rail()}
              <NavigationRail {currentPath} onNavigate={(path) => (currentPath = path)}>
                {#snippet userMenu()}
                  <Button variant="ghost" size="icon" class="w-12 h-12 rounded-lg">
                    <User class="w-5 h-5" />
                  </Button>
                {/snippet}
              </NavigationRail>
            {/snippet}

            {#snippet sidebar()}
              <SecondarySidebar
                context="chat"
                onSearch={(q) => console.log('Search:', q)}
                onNew={() => console.log('New chat')}
              >
                {#snippet content()}
                  <div class="space-y-2">
                    {#each ['Chat 1', 'Chat 2', 'Chat 3'] as chat}
                      <div class="p-3 rounded-md hover:bg-muted cursor-pointer">
                        {chat}
                      </div>
                    {/each}
                  </div>
                {/snippet}
              </SecondarySidebar>
            {/snippet}

            <div class="p-6">
              <h3 class="text-xl font-semibold mb-4">Main Content Area</h3>
              <div class="rounded-lg border border-border p-4">
                <p>This is the main content area. Resize the window to see responsive behavior:</p>
                <ul class="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li><strong>Mobile (&lt;768px):</strong> Navigation rail and sidebar hidden</li>
                  <li>
                    <strong>Tablet (768-1024px):</strong> Navigation rail visible, sidebar collapsed (hover
                    to expand)
                  </li>
                  <li>
                    <strong>Desktop (&ge;1024px):</strong> Both navigation rail and full sidebar visible
                  </li>
                </ul>
              </div>
            </div>
          </AppLayout>
        </div>
      </section>
    {/if}

    {#if showDemo === 'auth'}
      <section class="mb-8">
        <h2 class="text-2xl font-bold mb-4">AuthLayout Demo</h2>
        <p class="text-muted-foreground mb-4">Centered card layout for authentication pages.</p>

        <div class="rounded-lg border border-border overflow-hidden">
          <AuthLayout
            title="Sign In"
            description="Enter your credentials to access your account"
            showLogo={true}
          >
            <form class="space-y-4" onsubmit={(e) => e.preventDefault()}>
              <div>
                <label class="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  class="w-full px-3 py-2 border border-input rounded-md bg-background"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  class="w-full px-3 py-2 border border-input rounded-md bg-background"
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" class="w-full">Sign In</Button>
            </form>
            {#snippet footer()}
              <p class="mt-6 text-center text-xs text-muted-foreground">
                Custom footer: Don't have an account? <a
                  href="#"
                  class="text-primary hover:underline">Sign up</a
                >
              </p>
            {/snippet}
          </AuthLayout>
        </div>
      </section>
    {/if}

    {#if showDemo === 'navigation'}
      <section class="mb-8">
        <h2 class="text-2xl font-bold mb-4">NavigationRail Demo</h2>
        <p class="text-muted-foreground mb-4">64px icon-based navigation rail with tooltips.</p>

        <div class="rounded-lg border border-border p-4 inline-block">
          <NavigationRail {currentPath} onNavigate={(path) => (currentPath = path)}>
            {#snippet userMenu()}
              <Button variant="ghost" size="icon" class="w-12 h-12 rounded-lg">
                <User class="w-5 h-5" />
              </Button>
            {/snippet}
          </NavigationRail>
        </div>

        <div class="rounded-lg border border-border p-4 mt-4">
          <p class="text-sm">
            Current selection: <strong>{currentPath}</strong>
          </p>
          <p class="text-sm text-muted-foreground mt-2">
            Hover over icons to see tooltips. Click to navigate.
          </p>
        </div>
      </section>
    {/if}

    {#if showDemo === 'sidebar'}
      <section class="mb-8">
        <h2 class="text-2xl font-bold mb-4">SecondarySidebar Demo</h2>
        <p class="text-muted-foreground mb-4">
          280px context-aware sidebar with search and action buttons.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Chat Context -->
          <div class="space-y-2">
            <h3 class="font-semibold">Chat Context</h3>
            <div class="rounded-lg border border-border overflow-hidden">
              <SecondarySidebar
                context="chat"
                onSearch={(q) => console.log('Search chats:', q)}
                onNew={() => console.log('New chat')}
              >
                {#snippet content()}
                  <div class="space-y-2">
                    {#each Array(5) as _, i}
                      <div class="p-2 rounded hover:bg-muted cursor-pointer text-sm">
                        Chat {i + 1}
                      </div>
                    {/each}
                  </div>
                {/snippet}
              </SecondarySidebar>
            </div>
          </div>

          <!-- Prompts Context -->
          <div class="space-y-2">
            <h3 class="font-semibold">Prompts Context</h3>
            <div class="rounded-lg border border-border overflow-hidden">
              <SecondarySidebar
                context="prompts"
                onSearch={(q) => console.log('Search prompts:', q)}
                onNew={() => console.log('New prompt')}
              >
                {#snippet content()}
                  <div class="space-y-2">
                    {#each ['Prompt 1', 'Prompt 2', 'Prompt 3'] as prompt}
                      <div class="p-2 rounded hover:bg-muted cursor-pointer text-sm">
                        {prompt}
                      </div>
                    {/each}
                  </div>
                {/snippet}
              </SecondarySidebar>
            </div>
          </div>

          <!-- Settings Context -->
          <div class="space-y-2">
            <h3 class="font-semibold">Settings Context</h3>
            <div class="rounded-lg border border-border overflow-hidden">
              <SecondarySidebar context="settings">
                {#snippet content()}
                  <div class="space-y-2">
                    {#each ['General', 'Appearance', 'Integrations'] as setting}
                      <div class="p-2 rounded hover:bg-muted cursor-pointer text-sm">
                        {setting}
                      </div>
                    {/each}
                  </div>
                {/snippet}
              </SecondarySidebar>
            </div>
          </div>
        </div>
      </section>
    {/if}
  </div>
</div>
