<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '$lib/components/ui/card/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { appearance } from '$lib/stores/appearance.store.js';
  import { applyTheme, getCurrentTheme } from '$lib/themes';
  import { defaultThemes, type Theme } from '$lib/themes';
  import { orpc } from '$lib/orpc';
  import { cn } from '$lib/utils.js';
  import { CheckIcon } from '@lucide/svelte';
  import Palette from '@lucide/svelte/icons/palette';
  import type { HSLColor, ThemeColors } from '$lib/types/theme.js';

  /**
   * Theme option interface for display
   */
  interface ThemeOption {
    id: string;
    name: string;
    description: string;
    theme: Theme;
    isBuiltIn: boolean;
  }

  /**
   * Component props
   */
  interface Props {
    /** Additional CSS classes for the container */
    class?: string;
    /** Whether to show the description for each theme */
    showDescription?: boolean;
    /** Callback when theme is changed */
    onThemeChange?: (themeId: string) => void;
  }

  let { class: className, showDescription = true, onThemeChange }: Props = $props();

  // Available themes (built-in + custom)
  let availableThemes = $state<ThemeOption[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let applyingTheme = $state<string | null>(null);

  // Current theme ID from appearance store
  let currentThemeId = $state<string | null>(appearance.currentSettings.themeId);

  // Sync local state with store
  $effect(() => {
    currentThemeId = appearance.currentSettings.themeId;
  });

  /**
   * Load all available themes (built-in + custom)
   */
  async function loadThemes() {
    loading = true;
    error = null;

    try {
      // Start with built-in themes
      const themes: ThemeOption[] = defaultThemes.map((theme) => ({
        id: theme.id,
        name: theme.name,
        description: theme.description || '',
        theme,
        isBuiltIn: true,
      }));

      // Try to load custom themes from backend
      try {
        const customThemes = await orpc.theme.getAllThemes();

        // Add custom themes to the list
        for (const customTheme of customThemes) {
          // Convert flat color structure from DB to ThemeColors
          const colors: ThemeColors = {
            primary: customTheme.primary as HSLColor,
            secondary: customTheme.secondary as HSLColor,
            background: customTheme.background as HSLColor,
            foreground: customTheme.foreground as HSLColor,
            muted: customTheme.muted as HSLColor,
            mutedForeground: customTheme.mutedForeground as HSLColor,
            accent: customTheme.accent as HSLColor,
            accentForeground: customTheme.accentForeground as HSLColor,
            destructive: customTheme.destructive as HSLColor,
            destructiveForeground: customTheme.destructiveForeground as HSLColor,
            border: customTheme.border as HSLColor,
            input: customTheme.input as HSLColor,
            ring: customTheme.ring as HSLColor,
            radius: customTheme.radius,
          };

          // Convert to Theme type (ORPC returns the theme data structure)
          const theme: Theme = {
            id: customTheme.id,
            userId: customTheme.userId,
            name: customTheme.name,
            description: customTheme.description,
            isBuiltIn: customTheme.isBuiltIn,
            colors,
            createdAt:
              customTheme.createdAt instanceof Date
                ? customTheme.createdAt.toISOString()
                : customTheme.createdAt,
            updatedAt:
              customTheme.updatedAt instanceof Date
                ? customTheme.updatedAt.toISOString()
                : customTheme.updatedAt,
          };

          themes.push({
            id: theme.id,
            name: theme.name,
            description: theme.description || '',
            theme,
            isBuiltIn: theme.isBuiltIn,
          });
        }
      } catch (err) {
        // Backend might not be available or user not authenticated
        // Just use built-in themes
        console.info('Could not load custom themes from backend:', err);
      }

      availableThemes = themes;
    } catch (err) {
      error = 'Failed to load themes';
      console.error('Error loading themes:', err);
    } finally {
      loading = false;
    }
  }

  /**
   * Handle theme selection
   */
  async function handleThemeSelect(themeId: string, theme: Theme) {
    applyingTheme = themeId;

    try {
      // Apply the theme visually
      applyTheme(theme);

      // Update appearance store
      appearance.updateSetting('themeId', themeId);

      // Notify parent component
      if (onThemeChange) {
        onThemeChange(themeId);
      }
    } catch (err) {
      error = 'Failed to apply theme';
      console.error('Error applying theme:', err);
    } finally {
      applyingTheme = null;
    }
  }

  /**
   * Check if a theme is currently active
   */
  function isThemeActive(themeId: string): boolean {
    // Check appearance store first
    if (currentThemeId === themeId) {
      return true;
    }

    // If no themeId in store, check if light theme is applied (default)
    if (!currentThemeId) {
      const current = getCurrentTheme();
      return current?.id === themeId;
    }

    return false;
  }

  /**
   * Get theme preview colors
   */
  function getThemePreviewColors(theme: Theme) {
    return {
      primary: theme.colors.primary,
      background: theme.colors.background,
      foreground: theme.colors.foreground,
      accent: theme.colors.accent,
    };
  }

  // Load themes on mount
  onMount(() => {
    loadThemes();
  });

  /**
   * Get currently selected theme option
   */
  const selectedTheme = $derived(
    availableThemes.find((t) => isThemeActive(t.id)) || availableThemes[0]
  );
</script>

<Card class={cn('overflow-hidden', className)}>
  <CardHeader class="space-y-1 pb-4">
    <div class="flex items-center gap-2">
      <Palette class="text-muted-foreground size-5" />
      <CardTitle class="text-lg">Theme</CardTitle>
    </div>
    <CardDescription>Choose your preferred color scheme for the application</CardDescription>
  </CardHeader>

  <CardContent class="space-y-4">
    {#if loading}
      <!-- Loading state -->
      <div class="flex min-h-[200px] items-center justify-center">
        <div class="text-muted-foreground text-sm">Loading themes...</div>
      </div>
    {:else if error}
      <!-- Error state -->
      <div
        class="border-destructive/50 bg-destructive/10 flex items-center gap-2 rounded-lg border p-4"
      >
        <p class="text-destructive text-sm">{error}</p>
      </div>
    {:else if availableThemes.length === 0}
      <!-- Empty state -->
      <div class="border-border bg-muted/30 rounded-lg border p-4">
        <p class="text-muted-foreground text-sm">No themes available</p>
      </div>
    {:else}
      <!-- Theme Options -->
      <div class="space-y-2">
        <Label class="text-sm font-medium">Select Theme</Label>

        <div class="grid gap-3">
          {#each availableThemes as option}
            {@const isActive = isThemeActive(option.id)}
            {@const isApplying = applyingTheme === option.id}
            {@const colors = getThemePreviewColors(option.theme)}
            <button
              onclick={() => handleThemeSelect(option.id, option.theme)}
              disabled={isApplying}
              class="border-input hover:border-primary hover:bg-accent/50 data-[active=true]:border-primary data-[active=true]:bg-primary/5 data-[active=true]:ring-primary relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 data-[active=true]:ring-1"
              data-active={isActive}
              aria-pressed={isActive}
              type="button"
            >
              <!-- Selection indicator -->
              <div class="text-primary mt-0.5">
                <div
                  class="border-primary data-[active=true]:bg-primary flex size-4 items-center justify-center rounded-full border-2"
                  data-active={isActive}
                >
                  {#if isActive}
                    <CheckIcon class="size-3" />
                  {/if}
                </div>
              </div>

              <!-- Theme preview and info -->
              <div class="flex-1 space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold">{option.name}</span>
                    {#if !option.isBuiltIn}
                      <span
                        class="border-border bg-muted text-muted-foreground rounded border px-1.5 py-0.5 text-xs font-medium uppercase"
                      >
                        Custom
                      </span>
                    {/if}
                  </div>
                  {#if isApplying}
                    <span class="text-muted-foreground animate-pulse text-xs font-medium uppercase">
                      Applying...
                    </span>
                  {/if}
                </div>

                {#if showDescription && option.description}
                  <p class="text-muted-foreground text-sm leading-relaxed">
                    {option.description}
                  </p>
                {/if}

                <!-- Color preview swatches -->
                <div class="flex items-center gap-1.5">
                  <!-- Primary color -->
                  <div
                    class="rounded-md border-2 border-white/20"
                    style="background-color: hsl({colors.primary})"
                    title="Primary"
                  >
                    <div class="size-6"></div>
                  </div>
                  <!-- Background color -->
                  <div
                    class="rounded-md border-2 border-white/20"
                    style="background-color: hsl({colors.background})"
                    title="Background"
                  >
                    <div class="size-6"></div>
                  </div>
                  <!-- Foreground color -->
                  <div
                    class="rounded-md border-2 border-white/20"
                    style="background-color: hsl({colors.foreground})"
                    title="Foreground"
                  >
                    <div class="size-6"></div>
                  </div>
                  <!-- Accent color -->
                  <div
                    class="rounded-md border-2 border-white/20"
                    style="background-color: hsl({colors.accent})"
                    title="Accent"
                  >
                    <div class="size-6"></div>
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Current Selection Summary -->
      {#if selectedTheme}
        <div class="border-border bg-muted/30 rounded-lg border p-3">
          <p class="text-muted-foreground mb-1 text-xs font-medium uppercase">Current Selection</p>
          <p class="text-foreground text-base font-semibold">
            {selectedTheme.name}
            {#if !selectedTheme.isBuiltIn}
              <span class="text-muted-foreground font-normal"> (Custom)</span>
            {/if}
          </p>
          {#if selectedTheme.description}
            <p class="text-muted-foreground mt-1 text-xs">
              {selectedTheme.description}
            </p>
          {/if}
        </div>
      {/if}
    {/if}
  </CardContent>
</Card>
