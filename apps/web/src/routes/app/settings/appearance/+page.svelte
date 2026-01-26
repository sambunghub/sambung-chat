<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import SecondarySidebarTrigger from '$lib/components/secondary-sidebar-trigger.svelte';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Slider } from '$lib/components/ui/slider/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { toast } from 'svelte-sonner';
  import { userPreferencesStore, type FontSize, FONT_SIZE_MAP } from '$lib/stores/user-preferences';
  import { cn } from '$lib/utils';
  import MinimizeIcon from '@lucide/svelte/icons/minimize';
  import MaximizeIcon from '@lucide/svelte/icons/maximize';
  import TypeIcon from '@lucide/svelte/icons/type';
  import EyeOffIcon from '@lucide/svelte/icons/eye-off';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import CheckIcon from '@lucide/svelte/icons/check';

  let loading = $state(true);
  let updating = $state(false);

  // Form state
  let sidebarWidth = $state(280);
  let fontSize = $state<FontSize>('medium');
  let privacyMode = $state(false);

  const FONT_SIZE_OPTIONS: { value: FontSize; label: string; description: string; size: string }[] =
    [
      { value: 'small', label: 'Small', description: '14px - Compact', size: '14px' },
      { value: 'medium', label: 'Medium', description: '16px - Default', size: '16px' },
      { value: 'large', label: 'Large', description: '18px - Comfortable', size: '18px' },
      {
        value: 'extra-large',
        label: 'Extra Large',
        description: '20px - Large',
        size: '20px',
      },
    ];

  onMount(async () => {
    await loadPreferences();
  });

  async function loadPreferences() {
    loading = true;
    try {
      await userPreferencesStore.load();
      const prefs = $userPreferencesStore;
      if (prefs) {
        sidebarWidth = prefs.sidebarWidth;
        fontSize = prefs.fontSize;
        privacyMode = prefs.privacyMode;
      }
    } catch (error) {
      toast.error('Failed to load preferences', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      loading = false;
    }
  }

  async function handleSidebarWidthChange(value: number) {
    sidebarWidth = value;
    updating = true;

    try {
      await userPreferencesStore.updatePreferences({ sidebarWidth: value });
      toast.success('Sidebar width updated', {
        description: `Width is now ${value}px`,
      });
    } catch (error) {
      toast.error('Failed to update sidebar width', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      // Revert on error
      sidebarWidth = $userPreferencesStore?.sidebarWidth || 280;
    } finally {
      updating = false;
    }
  }

  async function handleFontSizeChange(value: FontSize) {
    fontSize = value;
    updating = true;

    try {
      await userPreferencesStore.updatePreferences({ fontSize: value });
      toast.success('Font size updated', {
        description: `Font size is now ${value}`,
      });
    } catch (error) {
      toast.error('Failed to update font size', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      // Revert on error
      fontSize = $userPreferencesStore?.fontSize || 'medium';
    } finally {
      updating = false;
    }
  }

  async function handlePrivacyModeChange(checked: boolean) {
    privacyMode = checked;
    updating = true;

    try {
      await userPreferencesStore.updatePreferences({ privacyMode: checked });
      toast.success('Privacy mode updated', {
        description: checked
          ? 'Privacy mode enabled - chat content hidden'
          : 'Privacy mode disabled - chat content visible',
      });
    } catch (error) {
      toast.error('Failed to update privacy mode', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      // Revert on error
      privacyMode = $userPreferencesStore?.privacyMode || false;
    } finally {
      updating = false;
    }
  }

  async function handleReset() {
    updating = true;

    try {
      await userPreferencesStore.reset();
      sidebarWidth = 280;
      fontSize = 'medium';
      privacyMode = false;
      toast.success('Preferences reset to defaults', {
        description: 'All appearance settings have been reset',
      });
    } catch (error) {
      toast.error('Failed to reset preferences', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      updating = false;
    }
  }
</script>

<header class="bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b p-4">
  <SecondarySidebarTrigger class="-ms-1" />
  <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item>
        <Breadcrumb.Link href="/app/settings">Settings</Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Separator />
      <Breadcrumb.Item>
        <Breadcrumb.Page>Appearance</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb.List>
  </Breadcrumb.Root>
</header>

<div class="flex h-[calc(100vh-61px)]">
  <main class="flex-1 overflow-auto p-6">
    <div class="mx-auto max-w-4xl">
      <div class="mb-8">
        <h1 class="text-foreground mb-2 text-3xl font-bold">Appearance</h1>
        <p class="text-muted-foreground">Customize the look and feel of your workspace</p>
      </div>

      {#if loading}
        <div class="flex items-center justify-center py-12">
          <div
            class="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            role="status"
            aria-label="Loading"
          >
            <span class="sr-only">Loading preferences...</span>
          </div>
        </div>
      {:else}
        <div class="space-y-6">
          <!-- Sidebar Width Section -->
          <section>
            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  <MinimizeIcon class="size-5" />
                  Sidebar Width
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-4">
                <div>
                  <Label for="sidebar-width">Width: {sidebarWidth}px</Label>
                  <p class="text-muted-foreground mb-4 text-sm">
                    Adjust the width of the secondary sidebar
                  </p>
                  <div class="flex items-center gap-4">
                    <span class="text-muted-foreground text-sm">200px</span>
                    <div class="flex-1">
                      <Slider
                        min={200}
                        max={400}
                        step={10}
                        value={[sidebarWidth]}
                        disabled={updating}
                        oninput={(val) => handleSidebarWidthChange(val)}
                        className="flex"
                      />
                    </div>
                    <span class="text-muted-foreground text-sm">400px</span>
                  </div>
                </div>
                <div class="bg-muted/50 rounded-md border p-4">
                  <p class="text-muted-foreground text-sm">
                    <strong class="text-foreground">Live Preview:</strong> The sidebar width will update
                    immediately. The default is 280px.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <!-- Font Size Section -->
          <section>
            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  <TypeIcon class="size-5" />
                  Font Size
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-4">
                <div>
                  <Label>Text Size</Label>
                  <p class="text-muted-foreground mb-4 text-sm">
                    Choose the font size for the application text
                  </p>
                  <div class="grid gap-4 md:grid-cols-2">
                    {#each FONT_SIZE_OPTIONS as option}
                      <label
                        class={cn(
                          'relative flex cursor-pointer rounded-md border p-4 transition-all',
                          'hover:bg-accent hover:text-accent-foreground',
                          'data-[checked=true]:border-primary data-[checked=true]:bg-primary/10',
                          'focus-within:ring-ring focus-within:ring-2',
                          updating && 'pointer-events-none opacity-50',
                          fontSize === option.value && 'border-primary bg-primary/10'
                        )}
                        data-checked={fontSize === option.value}
                      >
                        <div class="flex items-start gap-3">
                          <input
                            type="radio"
                            name="font-size"
                            value={option.value}
                            checked={fontSize === option.value}
                            disabled={updating}
                            onchange={() => handleFontSizeChange(option.value)}
                            class="mt-1"
                            aria-label={option.label}
                          />
                          <div class="flex-1">
                            <div class="font-medium">{option.label}</div>
                            <div class="text-muted-foreground text-xs">{option.description}</div>
                            <div
                              class="text-muted-foreground mt-2"
                              style="font-size: {option.size}"
                            >
                              The quick brown fox jumps over the lazy dog
                            </div>
                          </div>
                          {#if fontSize === option.value}
                            <CheckIcon class="text-primary size-5" />
                          {/if}
                        </div>
                      </label>
                    {/each}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <!-- Privacy Mode Section -->
          <section>
            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  <EyeOffIcon class="size-5" />
                  Privacy Mode
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="space-y-1">
                    <Label for="privacy-mode">Enable Privacy Mode</Label>
                    <p class="text-muted-foreground text-sm">
                      Hide chat message content in the sidebar and chat list
                    </p>
                  </div>
                  <Switch
                    id="privacy-mode"
                    bind:checked={privacyMode}
                    disabled={updating}
                    onchange={async () => await handlePrivacyModeChange(privacyMode)}
                  />
                </div>
                <div class="bg-muted/50 rounded-md border p-4">
                  <p class="text-muted-foreground text-sm">
                    <strong class="text-foreground">Privacy Mode:</strong> When enabled, chat message
                    previews will be hidden in the sidebar and chat list. Only the chat title will be
                    visible.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <!-- Reset Section -->
          <section>
            <Card>
              <CardContent class="p-6">
                <div class="flex items-center justify-between">
                  <div class="space-y-1">
                    <h3 class="text-foreground font-medium">Reset to Defaults</h3>
                    <p class="text-muted-foreground text-sm">
                      Reset all appearance settings to their default values
                    </p>
                  </div>
                  <Button variant="outline" onclick={handleReset} disabled={updating} class="gap-2">
                    <RotateCcwIcon class="size-4" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      {/if}
    </div>
  </main>
</div>
