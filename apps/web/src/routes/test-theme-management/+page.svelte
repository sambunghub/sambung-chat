<script lang="ts">
  import { onMount } from 'svelte';
  import ThemeManager from '$components/settings/theme-manager.svelte';
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { DownloadIcon, Palette, RotateCcwIcon } from '@lucide/svelte';
  import { orpc } from '$lib/orpc';
  import { downloadTheme } from '$lib/utils/theme-export';
  import { defaultThemes } from '$lib/themes';
  import { browser } from '$app/environment';

  // Test state
  let themeCount = $state(0);
  let updateCount = $state(0);
  let deleteCount = $state(0);
  let lastAction = $state<string | null>(null);
  let lastActionTime = $state<string | null>(null);

  /**
   * Handle theme update event
   */
  function handleThemeUpdated(themeId: string) {
    updateCount++;
    lastAction = `Updated theme: ${themeId}`;
    lastActionTime = new Date().toLocaleTimeString();
  }

  /**
   * Handle theme delete event
   */
  function handleThemeDeleted(themeId: string) {
    deleteCount++;
    lastAction = `Deleted theme: ${themeId}`;
    lastActionTime = new Date().toLocaleTimeString();
  }

  /**
   * Get theme count from backend
   */
  async function getThemeCount() {
    if (!browser) return;

    try {
      const themes = await orpc.theme.getAllThemes();
      const customThemes = themes.filter((t) => !t.isBuiltIn);
      themeCount = customThemes.length;
    } catch (error) {
      console.error('Failed to get theme count:', error);
    }
  }

  /**
   * Download a sample theme for testing
   */
  function downloadSampleTheme() {
    const lightTheme = defaultThemes.find((t) => t.name === 'Light');
    if (lightTheme) {
      downloadTheme(lightTheme);
      lastAction = 'Downloaded Light theme sample';
      lastActionTime = new Date().toLocaleTimeString();
    }
  }

  /**
   * Reset test counters
   */
  function resetCounters() {
    themeCount = 0;
    updateCount = 0;
    deleteCount = 0;
    lastAction = null;
    lastActionTime = null;
  }

  // Load initial data
  onMount(() => {
    getThemeCount();
  });
</script>

<svelte:head>
  <title>Theme Management Test</title>
  <meta name="description" content="Test theme management functionality" />
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-8">
  <!-- Page Header -->
  <div class="mb-8">
    <h1 class="text-foreground mb-2 text-3xl font-bold">Theme Management Test</h1>
    <p class="text-muted-foreground">Test interface for editing and deleting custom themes</p>
  </div>

  <div class="grid gap-6 lg:grid-cols-3">
    <!-- Main Content (2 columns) -->
    <div class="space-y-6 lg:col-span-2">
      <!-- Theme Manager Component -->
      <ThemeManager
        onThemeUpdated={(themeId) => handleThemeUpdated(themeId)}
        onThemeDeleted={(themeId) => handleThemeDeleted(themeId)}
      />

      <!-- Verification Checklist -->
      <Card>
        <CardHeader>
          <CardTitle>Manual Verification Checklist</CardTitle>
          <CardDescription>Verify the following features are working correctly</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <h4 class="font-semibold">Theme Loading</h4>
            <ul class="text-muted-foreground space-y-1 text-sm">
              <li>✓ Custom themes load from backend</li>
              <li>✓ Empty state shows when no custom themes exist</li>
              <li>✓ Error state displays if backend is unavailable</li>
              <li>✓ Loading indicator shows while fetching</li>
            </ul>
          </div>

          <Separator />

          <div class="space-y-2">
            <h4 class="font-semibold">Theme Display</h4>
            <ul class="text-muted-foreground space-y-1 text-sm">
              <li>✓ Theme name and description display correctly</li>
              <li>✓ Color preview swatches show theme colors</li>
              <li>✓ Active theme indicator displays for current theme</li>
              <li>✓ Last updated date shows correctly</li>
            </ul>
          </div>

          <Separator />

          <div class="space-y-2">
            <h4 class="font-semibold">Edit Functionality</h4>
            <ul class="text-muted-foreground space-y-1 text-sm">
              <li>✓ Edit button opens dialog with pre-filled data</li>
              <li>✓ Theme name can be edited</li>
              <li>✓ Theme description can be edited</li>
              <li>✓ All 13 color pickers work correctly</li>
              <li>✓ Save button validates form before submission</li>
              <li>✓ Loading state shows during update</li>
              <li>✓ Success message displays after update</li>
              <li>✓ Error message displays if update fails</li>
              <li>✓ Active theme updates in real-time</li>
              <li>✓ Dialog closes after successful update</li>
            </ul>
          </div>

          <Separator />

          <div class="space-y-2">
            <h4 class="font-semibold">Delete Functionality</h4>
            <ul class="text-muted-foreground space-y-1 text-sm">
              <li>✓ Delete button opens confirmation dialog</li>
              <li>✓ Dialog shows theme name and description</li>
              <li>✓ Warning displays if deleting active theme</li>
              <li>✓ Confirm button validates before deletion</li>
              <li>✓ Loading state shows during deletion</li>
              <li>✓ Error message displays if deletion fails</li>
              <li>✓ Active theme resets to Light after deletion</li>
              <li>✓ Theme removes from list after deletion</li>
              <li>✓ Dialog closes after successful deletion</li>
            </ul>
          </div>

          <Separator />

          <div class="space-y-2">
            <h4 class="font-semibold">Accessibility</h4>
            <ul class="text-muted-foreground space-y-1 text-sm">
              <li>✓ All buttons have proper aria-labels</li>
              <li>✓ Keyboard navigation works correctly</li>
              <li>✓ Dialog can be closed with Escape key</li>
              <li>✓ Buttons disabled during loading states</li>
              <li>✓ Color contrast meets accessibility standards</li>
            </ul>
          </div>

          <Separator />

          <div class="space-y-2">
            <h4 class="font-semibold">Integration</h4>
            <ul class="text-muted-foreground space-y-1 text-sm">
              <li>✓ onThemeUpdated callback fires correctly</li>
              <li>✓ onThemeDeleted callback fires correctly</li>
              <li>✓ Active theme applies changes in real-time</li>
              <li>✓ Theme appearance store updates correctly</li>
              <li>✓ ORPC backend integration works</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Sidebar (1 column) -->
    <div class="space-y-6">
      <!-- Instructions -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Palette class="size-5" />
            Testing Instructions
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3 text-sm">
          <div>
            <h4 class="mb-1 font-semibold">Setup</h4>
            <ol class="text-muted-foreground list-inside list-decimal space-y-1">
              <li>Create a custom theme first</li>
              <li>Or import a theme using the sample button</li>
              <li>Ensure backend is running</li>
            </ol>
          </div>

          <div>
            <h4 class="mb-1 font-semibold">Test Edit</h4>
            <ol class="text-muted-foreground list-inside list-decimal space-y-1">
              <li>Click Edit button on a theme</li>
              <li>Change theme name and colors</li>
              <li>Click Save Changes</li>
              <li>Verify update in list</li>
            </ol>
          </div>

          <div>
            <h4 class="mb-1 font-semibold">Test Delete</h4>
            <ol class="text-muted-foreground list-inside list-decimal space-y-1">
              <li>Click Delete button on a theme</li>
              <li>Read warning message</li>
              <li>Confirm deletion</li>
              <li>Verify removal from list</li>
            </ol>
          </div>

          <div>
            <h4 class="mb-1 font-semibold">Edge Cases</h4>
            <ul class="text-muted-foreground list-inside list-disc space-y-1">
              <li>Delete active theme</li>
              <li>Edit active theme (see real-time changes)</li>
              <li>Test with no custom themes</li>
              <li>Test with multiple custom themes</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <!-- Statistics -->
      <Card>
        <CardHeader>
          <CardTitle>Activity Statistics</CardTitle>
          <CardDescription>Track theme management operations</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="border-border bg-muted/30 rounded-lg border p-3 text-center">
              <p class="text-muted-foreground text-xs font-medium uppercase">Total Themes</p>
              <p class="text-foreground mt-1 text-2xl font-bold">{themeCount}</p>
            </div>

            <div class="border-border bg-muted/30 rounded-lg border p-3 text-center">
              <p class="text-muted-foreground text-xs font-medium uppercase">Updates</p>
              <p class="text-foreground mt-1 text-2xl font-bold">{updateCount}</p>
            </div>

            <div class="border-border bg-muted/30 rounded-lg border p-3 text-center">
              <p class="text-muted-foreground text-xs font-medium uppercase">Deletes</p>
              <p class="text-foreground mt-1 text-2xl font-bold">{deleteCount}</p>
            </div>

            <div class="border-border bg-muted/30 rounded-lg border p-3 text-center">
              <p class="text-muted-foreground text-xs font-medium uppercase">Total Actions</p>
              <p class="text-foreground mt-1 text-2xl font-bold">
                {updateCount + deleteCount}
              </p>
            </div>
          </div>

          {#if lastAction}
            <div class="border-border bg-muted/50 rounded-lg border p-3">
              <p class="text-muted-foreground mb-1 text-xs font-medium uppercase">Last Action</p>
              <p class="text-foreground text-sm">{lastAction}</p>
              {#if lastActionTime}
                <p class="text-muted-foreground mt-1 text-xs">{lastActionTime}</p>
              {/if}
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- Quick Actions -->
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Helper buttons for testing</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2">
          <Button
            variant="outline"
            class="w-full justify-start"
            onclick={downloadSampleTheme}
            disabled={!browser}
          >
            <DownloadIcon class="mr-2 size-4" />
            Download Sample Theme
          </Button>

          <Button
            variant="outline"
            class="w-full justify-start"
            onclick={getThemeCount}
            disabled={!browser}
          >
            <Palette class="mr-2 size-4" />
            Refresh Theme Count
          </Button>

          <Button
            variant="outline"
            class="w-full justify-start"
            onclick={resetCounters}
            disabled={!browser}
          >
            <RotateCcwIcon class="mr-2 size-4" />
            Reset Counters
          </Button>

          <Button
            variant="outline"
            class="w-full justify-start"
            onclick={() => window.location.reload()}
            disabled={!browser}
          >
            Reload Page
          </Button>
        </CardContent>
      </Card>

      <!-- API Reference -->
      <Card>
        <CardHeader>
          <CardTitle>API Reference</CardTitle>
          <CardDescription>ORPC endpoints used</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2 text-xs">
          <div>
            <p class="font-mono font-semibold">orpc.theme.getAllThemes()</p>
            <p class="text-muted-foreground">Fetch all themes (built-in + custom)</p>
          </div>

          <div>
            <p class="font-mono font-semibold">orpc.theme.updateTheme()</p>
            <p class="text-muted-foreground">Update theme name, description, or colors</p>
          </div>

          <div>
            <p class="font-mono font-semibold">orpc.theme.deleteTheme()</p>
            <p class="text-muted-foreground">Delete a custom theme</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</div>
