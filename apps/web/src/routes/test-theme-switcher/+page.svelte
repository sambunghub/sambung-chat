<script lang="ts">
  import ThemeSwitcher from '$lib/components/settings/theme-switcher.svelte';
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { appearance } from '$lib/stores/appearance.store.js';
  import { getCurrentTheme } from '$lib/themes';
  import { EyeIcon, PaletteIcon, CheckIcon } from '@lucide/svelte';
  import Eye from '@lucide/svelte/icons/eye';
  import Palette from '@lucide/svelte/icons/palette';
  import Check from '@lucide/svelte/icons/check';

  // Track theme changes
  let themeChangeCount = $state(0);
  let lastThemeChange = $state<string>('');
  let currentThemeInfo = $state<{
    id: string;
    name: string;
    isBuiltIn: boolean;
  } | null>(null);

  /**
   * Handle theme change from switcher
   */
  function handleThemeChange(themeId: string) {
    themeChangeCount++;
    lastThemeChange = new Date().toLocaleTimeString();

    const currentTheme = getCurrentTheme();
    if (currentTheme) {
      currentThemeInfo = {
        id: currentTheme.id,
        name: currentTheme.name,
        isBuiltIn: currentTheme.isBuiltIn,
      };
    }
  }

  /**
   * Reset to no theme (default)
   */
  function resetToDefault() {
    appearance.updateSetting('themeId', 'light');
    themeChangeCount++;
    lastThemeChange = new Date().toLocaleTimeString();
    currentThemeInfo = null;
  }

  /**
   * Get current theme ID from store
   */
  const storeThemeId = $derived(appearance.currentSettings.themeId);

  /**
   * Get current theme from theme manager
   */
  const currentTheme = $derived(getCurrentTheme());
</script>

<svelte:head>
  <title>Theme Switcher Test</title>
  <meta name="description" content="Test page for theme switcher component" />
</svelte:head>

<div class="container mx-auto max-w-7xl p-6">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-foreground mb-2 text-3xl font-bold">Theme Switcher Component Test</h1>
    <p class="text-muted-foreground text-lg">
      This page tests the theme switcher component with live preview and theme application.
    </p>
  </div>

  <div class="grid gap-6 lg:grid-cols-3">
    <!-- Instructions Sidebar -->
    <div class="lg:col-span-1">
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <Eye class="text-muted-foreground size-5" />
            <CardTitle class="text-lg">Test Instructions</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <h3 class="font-semibold">Manual Testing Steps:</h3>
            <ol class="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
              <li>Verify all themes are displayed correctly</li>
              <li>Check that built-in themes show their names and descriptions</li>
              <li>Click on different themes to apply them</li>
              <li>Verify the entire page changes to the new theme</li>
              <li>Check that the selected theme shows a checkmark indicator</li>
              <li>Verify color preview swatches match the theme</li>
              <li>Test "Current Selection" summary updates correctly</li>
              <li>Verify theme changes persist across page reloads</li>
            </ol>
          </div>

          <div class="border-border border-t pt-4">
            <h3 class="mb-2 font-semibold">What to Look For:</h3>
            <ul class="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>Visual theme application (colors change)</li>
              <li>Selection state (checkmark, border highlight)</li>
              <li>Loading states when applying themes</li>
              <li>Error handling if backend unavailable</li>
              <li>Color preview accuracy</li>
              <li>Built-in vs Custom theme badges</li>
            </ul>
          </div>

          <div class="border-border border-t pt-4">
            <h3 class="mb-2 font-semibold">Available Themes:</h3>
            <ul class="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>Light (built-in)</li>
              <li>Dark (built-in)</li>
              <li>High Contrast (built-in)</li>
              <li>Custom themes (from backend)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Main Test Area -->
    <div class="space-y-6 lg:col-span-2">
      <!-- Theme Switcher Component -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <Palette class="text-muted-foreground size-5" />
            <CardTitle class="text-lg">Theme Switcher Component</CardTitle>
          </div>
          <CardDescription>Select a theme to apply it to the entire application</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher onThemeChange={handleThemeChange} />
        </CardContent>
      </Card>

      <!-- Current State Display -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <Check class="text-muted-foreground size-5" />
            <CardTitle class="text-lg">Current State</CardTitle>
          </div>
          <CardDescription>Real-time display of current theme and settings</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <!-- Store Theme ID -->
            <div class="border-border bg-muted/30 rounded-lg border p-3">
              <p class="text-muted-foreground mb-1 text-xs font-medium uppercase">Store Theme ID</p>
              <p class="text-foreground font-mono text-sm break-all">
                {storeThemeId || 'null (default)'}
              </p>
            </div>

            <!-- Current Theme from Manager -->
            <div class="border-border bg-muted/30 rounded-lg border p-3">
              <p class="text-muted-foreground mb-1 text-xs font-medium uppercase">Current Theme</p>
              <p class="text-foreground font-mono text-sm break-all">
                {currentTheme?.name || 'None'}
              </p>
            </div>

            <!-- Theme Change Count -->
            <div class="border-border bg-muted/30 rounded-lg border p-3">
              <p class="text-muted-foreground mb-1 text-xs font-medium uppercase">Theme Changes</p>
              <p class="text-foreground text-lg font-bold">{themeChangeCount}</p>
            </div>

            <!-- Last Change Time -->
            <div class="border-border bg-muted/30 rounded-lg border p-3">
              <p class="text-muted-foreground mb-1 text-xs font-medium uppercase">Last Change</p>
              <p class="text-foreground text-sm">{lastThemeChange || 'Never'}</p>
            </div>
          </div>

          <!-- Last Applied Theme Info -->
          {#if currentThemeInfo}
            <div class="border-border bg-muted/30 rounded-lg border p-3">
              <p class="text-muted-foreground mb-2 text-xs font-medium uppercase">
                Last Applied Theme
              </p>
              <div class="space-y-1 text-sm">
                <p class="text-foreground">
                  <strong>Name:</strong>
                  {currentThemeInfo.name}
                </p>
                <p class="text-foreground">
                  <strong>ID:</strong>
                  {currentThemeInfo.id}
                </p>
                <p class="text-foreground">
                  <strong>Type:</strong>
                  {currentThemeInfo.isBuiltIn ? 'Built-in' : 'Custom'}
                </p>
              </div>
            </div>
          {/if}

          <!-- Reset Button -->
          <div class="flex gap-2">
            <Button onclick={resetToDefault} variant="outline">Reset to Default</Button>
            <Button
              onclick={() => {
                window.location.reload();
              }}
              variant="outline"
            >
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Visual Theme Preview -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">UI Component Preview</CardTitle>
          <CardDescription>
            See how the current theme affects different UI components
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Buttons -->
          <div class="space-y-2">
            <p class="text-muted-foreground text-sm font-medium">Buttons</p>
            <div class="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>

          <!-- Inputs -->
          <div class="space-y-2">
            <p class="text-muted-foreground text-sm font-medium">Input Fields</p>
            <div class="grid gap-2 md:grid-cols-2">
              <input
                type="text"
                placeholder="Default input"
                class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
              <input
                type="email"
                placeholder="Email input"
                class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>
          </div>

          <!-- Cards -->
          <div class="space-y-2">
            <p class="text-muted-foreground text-sm font-medium">Cards</p>
            <div class="grid gap-2 md:grid-cols-2">
              <div class="border-border bg-card text-card-foreground rounded-lg border p-4">
                <h4 class="mb-2 font-semibold">Card Title</h4>
                <p class="text-muted-foreground text-sm">
                  This is a card component showing the current theme colors.
                </p>
              </div>
              <div class="border-border bg-card text-card-foreground rounded-lg border p-4">
                <h4 class="mb-2 font-semibold">Another Card</h4>
                <p class="text-muted-foreground text-sm">
                  Cards use the card background and foreground colors from the theme.
                </p>
              </div>
            </div>
          </div>

          <!-- Text Styles -->
          <div class="space-y-2">
            <p class="text-muted-foreground text-sm font-medium">Text Styles</p>
            <div class="space-y-1">
              <h1 class="text-3xl font-bold">Heading 1</h1>
              <h2 class="text-2xl font-semibold">Heading 2</h2>
              <h3 class="text-xl font-medium">Heading 3</h3>
              <p class="text-base">
                Body text with normal weight. The quick brown fox jumps over the lazy dog.
              </p>
              <p class="text-muted-foreground text-sm">
                Muted text for secondary information and descriptions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Verification Checklist -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Verification Checklist</CardTitle>
          <CardDescription>Mark each item as you verify it works correctly</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            {#each ['Theme switcher component renders without errors', 'All built-in themes (Light, Dark, High Contrast) are displayed', 'Each theme shows name, description, and color preview swatches', 'Clicking a theme applies it visually to the entire page', 'Selected theme shows checkmark and highlighted border', 'Color preview swatches accurately represent theme colors', '"Current Selection" summary shows correct theme', 'Theme change counter increments when selecting themes', 'Theme changes persist after page reload', 'Reset to Default button clears the theme selection', 'UI component preview shows correct theme colors', 'Loading state displays while themes are being fetched', 'Error handling works if backend is unavailable', 'Custom themes (if any) are loaded and displayed', 'Custom themes show "Custom" badge'] as item}
              <label class="flex items-start gap-2">
                <input type="checkbox" class="mt-1" />
                <span class="text-sm">{item}</span>
              </label>
            {/each}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</div>
