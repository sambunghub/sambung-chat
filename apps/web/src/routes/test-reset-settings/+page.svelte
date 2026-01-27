<script lang="ts">
  import ResetSettings from '$lib/components/settings/reset-settings.svelte';
  import { appearance } from '$lib/stores/appearance.store.js';
  import SettingsPreview from '$lib/components/settings/settings-preview.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import CheckIcon from '@lucide/svelte/icons/check';
  import XIcon from '@lucide/svelte/icons/x';

  // Track reset events
  let resetCount = $state(0);
  let currentSettingsJson = $state('{}');

  // Load current settings on mount and changes
  $effect(() => {
    currentSettingsJson = JSON.stringify(appearance.currentSettings, null, 2);
  });

  /**
   * Handle reset callback
   */
  function handleReset() {
    resetCount++;
  }

  /**
   * Set some custom settings for testing
   */
  function setCustomSettings() {
    appearance.updateSettings({
      fontSize: '18',
      fontFamily: 'monospace',
      sidebarWidth: 350,
      messageDensity: 'compact',
      themeId: 'light',
    });
  }

  /**
   * Set all settings to defaults
   */
  function setDefaultSettings() {
    appearance.updateSettings({
      fontSize: '16',
      fontFamily: 'system-ui',
      sidebarWidth: 280,
      messageDensity: 'comfortable',
      themeId: 'light',
    });
  }

  /**
   * Check if settings are at defaults
   */
  const isAtDefaults = $derived(() => {
    const s = appearance.currentSettings;
    return (
      s.fontSize === '16' &&
      s.fontFamily === 'system-ui' &&
      s.sidebarWidth === 280 &&
      s.messageDensity === 'comfortable' &&
      s.themeId === 'light'
    );
  });
</script>

<svelte:head>
  <title>Reset Settings Test - Appearance Settings</title>
  <meta name="description" content="Test page for Reset Settings component" />
</svelte:head>

<div class="container mx-auto max-w-5xl px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-foreground mb-2 text-3xl font-bold">Reset Settings Test</h1>
    <p class="text-muted-foreground">
      Test page for the Reset Settings component with live verification
    </p>
  </div>

  <div class="grid gap-8 lg:grid-cols-2">
    <!-- Left Column: Test Controls -->
    <div class="space-y-6">
      <!-- Instructions -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Test Instructions</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <ol class="list-decimal space-y-2 pl-4 text-sm">
            <li>
              Use the <strong>Set Custom Settings</strong> button to set non-default values
            </li>
            <li>
              Verify the Reset Settings component shows custom settings and enables the reset button
            </li>
            <li>
              Click <strong>Reset to Defaults</strong> and confirm the dialog appears
            </li>
            <li>Verify the dialog shows all settings that will be reset</li>
            <li>Confirm reset and verify settings return to defaults</li>
            <li>
              Use the <strong>Set Default Settings</strong> button to reset manually for comparison
            </li>
          </ol>

          <Separator />

          <div class="space-y-2">
            <p class="text-sm font-medium">Quick Actions:</p>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" onclick={setCustomSettings}>
                Set Custom Settings
              </Button>
              <Button variant="outline" size="sm" onclick={setDefaultSettings}>
                Set Default Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Reset Settings Component -->
      <ResetSettings onReset={handleReset} />

      <!-- Current Settings Display -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Current Settings</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Status Badge -->
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground text-sm">Status:</span>
            {#if isAtDefaults()}
              <div
                class="bg-primary/10 text-primary flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              >
                <CheckIcon class="size-3" />
                At Defaults
              </div>
            {:else}
              <div
                class="bg-destructive/10 text-destructive flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              >
                <XIcon class="size-3" />
                Custom Settings
              </div>
            {/if}
          </div>

          <Separator />

          <!-- Settings Values -->
          <div class="space-y-2">
            <p class="text-muted-foreground text-xs font-medium uppercase">Settings Values</p>
            <div class="bg-muted/50 rounded-md p-3">
              <pre class="text-xs">{currentSettingsJson}</pre>
            </div>
          </div>

          <!-- Reset Counter -->
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground text-sm">Resets Performed:</span>
            <span class="text-foreground font-semibold">{resetCount}</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Right Column: Preview -->
    <div class="space-y-6">
      <!-- Live Preview -->
      <SettingsPreview
        title="Settings Preview"
        description="See how current settings affect the chat interface"
      />

      <!-- Expected Defaults Reference -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Default Values Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Font Size:</span>
              <span class="text-foreground font-mono">16px</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Font Family:</span>
              <span class="text-foreground font-mono">system-ui</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Sidebar Width:</span>
              <span class="text-foreground font-mono">280px</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Message Density:</span>
              <span class="text-foreground font-mono">comfortable</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Theme ID:</span>
              <span class="text-foreground font-mono">null</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Test Checklist -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Verification Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ul class="space-y-2 text-sm">
            <li class="flex items-start gap-2">
              <input type="checkbox" class="mt-0.5" id="check-1" />
              <label for="check-1"> Reset button is disabled when settings are at defaults </label>
            </li>
            <li class="flex items-start gap-2">
              <input type="checkbox" class="mt-0.5" id="check-2" />
              <label for="check-2">
                Reset button shows destructive variant when custom settings exist
              </label>
            </li>
            <li class="flex items-start gap-2">
              <input type="checkbox" class="mt-0.5" id="check-3" />
              <label for="check-3"> Component displays count of settings that will be reset </label>
            </li>
            <li class="flex items-start gap-2">
              <input type="checkbox" class="mt-0.5" id="check-4" />
              <label for="check-4"> Confirmation dialog opens when reset button is clicked </label>
            </li>
            <li class="flex items-start gap-2">
              <input type="checkbox" class="mt-0.5" id="check-5" />
              <label for="check-5">
                Dialog shows list of settings with current → default values
              </label>
            </li>
            <li class="flex items-start gap-2">
              <input type="checkbox" class="mt-0.5" id="check-6" />
              <label for="check-6"> Cancel button closes dialog without resetting </label>
            </li>
            <li class="flex items-start gap-2">
              <input type="checkbox" class="mt-0.5" id="check-7" />
              <label for="check-7">
                Confirm button resets settings and shows success message
              </label>
            </li>
            <li class="flex items-start gap-2">
              <input type="checkbox" class="mt-0.5" id="check-8" />
              <label for="check-8"> onReset callback is triggered after successful reset </label>
            </li>
            <li class="flex items-start gap-2">
              <input type="checkbox" class="mt-0.5" id="check-9" />
              <label for="check-9"> Preview updates to reflect default settings after reset </label>
            </li>
            <li class="flex items-start gap-2">
              <input type="checkbox" class="mt-0.5" id="check-10" />
              <label for="check-10"> Settings persist in localStorage after reset </label>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </div>
</div>
