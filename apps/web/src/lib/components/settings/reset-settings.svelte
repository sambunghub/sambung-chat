<script lang="ts">
  import { browser } from '$app/environment';
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { appearance, type AppearanceSettings } from '$lib/stores/appearance.store.js';
  import { cn } from '$lib/utils.js';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';

  /**
   * Component props
   */
  interface Props {
    /** Additional CSS classes for the container */
    class?: string;
    /** Callback function called after successful reset */
    onReset?: () => void;
  }

  let { class: className, onReset }: Props = $props();

  // Dialog state
  let dialogOpen = $state(false);
  let isResetting = $state(false);
  let resetSuccess = $state(false);
  let errorMessage = $state<string | null>(null);

  // Current settings to display in confirmation
  let currentSettings = $state<AppearanceSettings | null>(null);

  // Default settings for comparison
  const DEFAULT_SETTINGS: AppearanceSettings = {
    fontSize: '16',
    fontFamily: 'system-ui',
    sidebarWidth: 280,
    messageDensity: 'comfortable',
    themeId: 'light',
  };

  /**
   * Load current settings on mount
   */
  $effect(() => {
    if (browser) {
      currentSettings = appearance.currentSettings;
    }
  });

  /**
   * Open confirmation dialog
   */
  function openDialog() {
    if (!browser) return;

    // Clear previous messages
    errorMessage = null;
    resetSuccess = false;

    // Load current settings
    currentSettings = appearance.currentSettings;

    // Open dialog
    dialogOpen = true;
  }

  /**
   * Handle reset confirmation
   */
  async function handleReset() {
    if (!browser) return;

    isResetting = true;
    errorMessage = null;
    resetSuccess = false;

    try {
      // Reset to defaults
      await appearance.resetToDefaults();

      // Show success message
      resetSuccess = true;

      // Close dialog after brief delay
      setTimeout(() => {
        dialogOpen = false;
        resetSuccess = false;

        // Call callback if provided
        if (onReset) {
          onReset();
        }
      }, 1500);
    } catch (error) {
      // Handle error
      console.error('Failed to reset settings:', error);
      errorMessage =
        error instanceof Error
          ? error.message
          : 'An error occurred while resetting settings. Please try again.';
    } finally {
      isResetting = false;
    }
  }

  /**
   * Handle dialog close
   */
  function handleDialogClose() {
    if (isResetting) return; // Prevent closing during reset

    dialogOpen = false;
    errorMessage = null;
    resetSuccess = false;
  }

  /**
   * Check if any settings differ from defaults
   */
  const hasCustomSettings = $derived(() => {
    if (!currentSettings) return false;

    return (
      currentSettings.fontSize !== DEFAULT_SETTINGS.fontSize ||
      currentSettings.fontFamily !== DEFAULT_SETTINGS.fontFamily ||
      currentSettings.sidebarWidth !== DEFAULT_SETTINGS.sidebarWidth ||
      currentSettings.messageDensity !== DEFAULT_SETTINGS.messageDensity ||
      currentSettings.themeId !== DEFAULT_SETTINGS.themeId
    );
  });

  /**
   * Get list of settings that will be reset
   */
  const settingsToReset = $derived(() => {
    if (!currentSettings) return [];

    const settings: Array<{ label: string; current: string; default: string }> = [];

    if (currentSettings.fontSize !== DEFAULT_SETTINGS.fontSize) {
      settings.push({
        label: 'Font Size',
        current: `${currentSettings.fontSize}px`,
        default: `${DEFAULT_SETTINGS.fontSize}px`,
      });
    }

    if (currentSettings.fontFamily !== DEFAULT_SETTINGS.fontFamily) {
      settings.push({
        label: 'Font Family',
        current: currentSettings.fontFamily,
        default: DEFAULT_SETTINGS.fontFamily,
      });
    }

    if (currentSettings.sidebarWidth !== DEFAULT_SETTINGS.sidebarWidth) {
      settings.push({
        label: 'Sidebar Width',
        current: `${currentSettings.sidebarWidth}px`,
        default: `${DEFAULT_SETTINGS.sidebarWidth}px`,
      });
    }

    if (currentSettings.messageDensity !== DEFAULT_SETTINGS.messageDensity) {
      settings.push({
        label: 'Message Density',
        current: currentSettings.messageDensity,
        default: DEFAULT_SETTINGS.messageDensity,
      });
    }

    if (currentSettings.themeId !== DEFAULT_SETTINGS.themeId) {
      settings.push({
        label: 'Theme',
        current: currentSettings.themeId ? 'Custom' : 'Default',
        default: 'Default',
      });
    }

    return settings;
  });
</script>

<Card class={cn('overflow-hidden', className)}>
  <CardHeader class="space-y-1 pb-4">
    <div class="flex items-center gap-2">
      <RotateCcwIcon class="text-muted-foreground size-5" />
      <CardTitle class="text-lg">Reset Settings</CardTitle>
    </div>
    <CardDescription>Restore all appearance settings to their default values</CardDescription>
  </CardHeader>

  <CardContent class="space-y-4">
    <!-- Reset Button -->
    <div class="flex items-center justify-between">
      <div class="text-sm">
        {#if hasCustomSettings()}
          <p class="text-foreground font-medium">You have custom settings</p>
          <p class="text-muted-foreground text-xs">
            {settingsToReset().length} setting{settingsToReset().length !== 1 ? 's' : ''} will be reset
            to defaults
          </p>
        {:else}
          <p class="text-foreground font-medium">All settings are at defaults</p>
          <p class="text-muted-foreground text-xs">No changes to reset</p>
        {/if}
      </div>

      <Button
        variant={hasCustomSettings() ? 'destructive' : 'outline'}
        size="sm"
        onclick={openDialog}
        disabled={!hasCustomSettings() || !browser}
        aria-label="Reset all settings to defaults"
      >
        <RotateCcwIcon class="mr-2 size-4" />
        Reset to Defaults
      </Button>
    </div>

    {#if hasCustomSettings()}
      <!-- Settings that will be reset -->
      <div class="border-border bg-muted/30 rounded-md border p-3">
        <p class="text-muted-foreground mb-2 text-xs font-medium uppercase">
          Settings that will be reset
        </p>
        <div class="space-y-1">
          {#each settingsToReset() as setting}
            <div class="flex items-center justify-between text-xs">
              <span class="text-foreground">{setting.label}</span>
              <div class="flex items-center gap-2">
                <span class="text-muted-foreground decoration-destructive line-through">
                  {setting.current}
                </span>
                <span class="text-muted-foreground">→</span>
                <span class="text-primary font-medium">{setting.default}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </CardContent>
</Card>

<!-- Confirmation Dialog -->
<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Content onInteractOutside={(e) => e.preventDefault()} class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <AlertTriangleIcon class="text-destructive size-5" />
        Reset All Settings?
      </Dialog.Title>
      <Dialog.Description>
        This action cannot be undone. All appearance settings will be restored to their default
        values.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      {#if settingsToReset().length > 0}
        <div class="border-border bg-muted/50 rounded-md border p-3">
          <p class="text-muted-foreground mb-2 text-xs font-medium uppercase">Settings to reset</p>
          <div class="space-y-2">
            {#each settingsToReset() as setting}
              <div class="flex items-center justify-between text-sm">
                <span class="text-foreground">{setting.label}</span>
                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground decoration-destructive line-through">
                    {setting.current}
                  </span>
                  <span class="text-muted-foreground">→</span>
                  <span class="text-primary font-medium">{setting.default}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if errorMessage}
        <div
          class="bg-destructive/10 text-destructive border-destructive/50 flex items-start gap-2 rounded-md border p-3 text-sm"
        >
          <AlertTriangleIcon class="mt-0.5 size-4 shrink-0" />
          <div>
            <p class="font-medium">Reset Failed</p>
            <p class="text-destructive/80 text-xs">{errorMessage}</p>
          </div>
        </div>
      {/if}

      {#if resetSuccess}
        <div class="bg-primary/10 text-primary flex items-start gap-2 rounded-md p-3 text-sm">
          <RotateCcwIcon class="mt-0.5 size-4 shrink-0" />
          <div>
            <p class="font-medium">Settings Reset Successfully</p>
            <p class="text-primary/80 text-xs">
              All appearance settings have been restored to defaults.
            </p>
          </div>
        </div>
      {/if}
    </div>

    <Dialog.Footer class="gap-2 sm:gap-0">
      <Button
        variant="outline"
        onclick={handleDialogClose}
        disabled={isResetting}
        class="flex-1 sm:flex-none"
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        onclick={handleReset}
        disabled={isResetting}
        class="flex-1 sm:flex-none"
      >
        {#if isResetting}
          Resetting...
        {:else}
          Reset to Defaults
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
