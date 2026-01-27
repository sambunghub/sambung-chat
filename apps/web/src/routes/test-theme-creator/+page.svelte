<script lang="ts">
  import ThemeCreator from '$lib/components/settings/theme-creator.svelte';
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '$lib/components/ui/card/index.js';
  import { CheckIcon } from '@lucide/svelte';

  // State to track created themes
  let createdThemes = $state<Array<{ id: string; name: string; timestamp: Date }>>([]);

  /**
   * Handle theme creation
   */
  function handleThemeCreated(themeId: string) {
    createdThemes = [
      {
        id: themeId,
        name: `Theme ${createdThemes.length + 1}`,
        timestamp: new Date(),
      },
      ...createdThemes,
    ];
  }
</script>

<div class="container mx-auto max-w-7xl space-y-8 p-6">
  <!-- Header -->
  <div class="space-y-2">
    <h1 class="text-foreground text-3xl font-bold">Theme Creator Test Page</h1>
    <p class="text-muted-foreground text-lg">
      Test the custom theme creation interface with live preview
    </p>
  </div>

  <!-- Main Content -->
  <div class="grid gap-8 lg:grid-cols-3">
    <!-- Theme Creator -->
    <div class="lg:col-span-2">
      <ThemeCreator onThemeCreated={handleThemeCreated} showPreview={true} />
    </div>

    <!-- Sidebar -->
    <div class="space-y-6">
      <!-- Instructions Card -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Instructions</CardTitle>
          <CardDescription>How to create a custom theme</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3 text-sm">
          <ol class="list-decimal space-y-2 pl-4">
            <li>
              <span class="font-semibold">Enter a name</span> for your theme (required, 3-100 characters)
            </li>
            <li>
              <span class="font-semibold">Add a description</span> (optional, max 500 characters)
            </li>
            <li>
              <span class="font-semibold">Customize colors</span> using the color pickers for each theme
              aspect
            </li>
            <li>
              <span class="font-semibold">Preview your theme</span> in the live preview panel below
            </li>
            <li>
              <span class="font-semibold">Click "Create Theme"</span> to save your custom theme
            </li>
          </ol>

          <div class="border-border bg-muted/50 mt-4 rounded-lg border p-3">
            <p class="text-muted-foreground text-xs font-medium uppercase">Color Tips</p>
            <ul class="text-muted-foreground mt-2 space-y-1 text-xs">
              <li>• Use high contrast between background and foreground</li>
              <li>• Ensure text is readable on colored backgrounds</li>
              <li>• Test with both light and dark color schemes</li>
              <li>• Consider color blindness accessibility</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <!-- Created Themes List -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Created Themes</CardTitle>
          <CardDescription>Themes created during this session</CardDescription>
        </CardHeader>
        <CardContent>
          {#if createdThemes.length === 0}
            <p class="text-muted-foreground text-sm">No themes created yet.</p>
          {:else}
            <div class="space-y-2">
              {#each createdThemes as theme (theme.id)}
                <div class="border-border flex items-center gap-3 rounded-lg border p-3">
                  <div class="bg-primary/20 flex size-8 items-center justify-center rounded-full">
                    <CheckIcon class="text-primary size-4" />
                  </div>
                  <div class="flex-1">
                    <p class="text-foreground text-sm font-medium">{theme.name}</p>
                    <p class="text-muted-foreground text-xs">
                      {theme.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- Color Reference Card -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Color Reference</CardTitle>
          <CardDescription>What each color controls</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2 text-sm">
          <div class="space-y-1">
            <p class="font-medium">Primary</p>
            <p class="text-muted-foreground text-xs">Main brand color (buttons, links)</p>
          </div>
          <div class="space-y-1">
            <p class="font-medium">Secondary</p>
            <p class="text-muted-foreground text-xs">Subtle accents</p>
          </div>
          <div class="space-y-1">
            <p class="font-medium">Background</p>
            <p class="text-muted-foreground text-xs">Page and card backgrounds</p>
          </div>
          <div class="space-y-1">
            <p class="font-medium">Foreground</p>
            <p class="text-muted-foreground text-xs">Primary text color</p>
          </div>
          <div class="space-y-1">
            <p class="font-medium">Accent</p>
            <p class="text-muted-foreground text-xs">Highlights and focus indicators</p>
          </div>
          <div class="space-y-1">
            <p class="font-medium">Destructive</p>
            <p class="text-muted-foreground text-xs">Danger actions and errors</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>

  <!-- Full Page Preview Section -->
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">Component Examples</CardTitle>
      <CardDescription>See how your theme affects different UI components</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Alert Messages -->
      <div class="space-y-3">
        <p class="text-foreground text-sm font-semibold">Alert Messages</p>
        <div class="grid gap-3 md:grid-cols-3">
          <div class="border-border bg-muted text-muted-foreground rounded-md border p-4">
            <p class="text-sm font-medium">Info Message</p>
            <p class="text-xs">This is a neutral info message.</p>
          </div>
          <div class="border-primary/50 bg-primary/10 text-primary rounded-md border p-4">
            <p class="text-sm font-medium">Success Message</p>
            <p class="text-xs">Your theme was created successfully!</p>
          </div>
          <div
            class="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-4"
          >
            <p class="text-sm font-medium">Error Message</p>
            <p class="text-xs">Something went wrong.</p>
          </div>
        </div>
      </div>

      <!-- Form Elements -->
      <div class="space-y-3">
        <p class="text-foreground text-sm font-semibold">Form Elements</p>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-foreground text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              class="border-input bg-background text-foreground w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div class="space-y-2">
            <label class="text-foreground text-sm font-medium">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              class="border-input bg-background text-foreground w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
