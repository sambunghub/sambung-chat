<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import ColorPicker from '$lib/components/settings/color-picker.svelte';
  import { orpc } from '$lib/orpc';
  import type { HSLColor, ThemeColors, CreateThemeData } from '$lib/types/theme.js';
  import { cn } from '$lib/utils.js';
  import { browser } from '$app/environment';
  import { Palette, SaveIcon, Loader2Icon } from '@lucide/svelte';

  /**
   * Component props
   */
  interface Props {
    /** Callback when theme is successfully created */
    onThemeCreated?: (themeId: string) => void;

    /** Additional CSS classes for the container */
    class?: string;

    /** Whether to show the preview panel */
    showPreview?: boolean;
  }

  let {
    onThemeCreated,
    class: className,
    showPreview = true
  }: Props = $props();

  // Form state
  let themeName = $state('');
  let themeDescription = $state('');

  // Color state with default values
  let colors = $state<ThemeColors>({
    primary: '210 100% 50%' as HSLColor,
    secondary: '210 100% 45%' as HSLColor,
    background: '0 0% 100%' as HSLColor,
    foreground: '210 20% 10%' as HSLColor,
    muted: '210 20% 90%' as HSLColor,
    mutedForeground: '210 20% 40%' as HSLColor,
    accent: '210 100% 50%' as HSLColor,
    accentForeground: '0 0% 100%' as HSLColor,
    destructive: '0 100% 50%' as HSLColor,
    destructiveForeground: '0 0% 100%' as HSLColor,
    border: '210 20% 85%' as HSLColor,
    input: '210 20% 85%' as HSLColor,
    ring: '210 100% 50%' as HSLColor,
    radius: '0.5'
  });

  // UI state
  let isCreating = $state(false);
  let errorMessage = $state<string | null>(null);
  let successMessage = $state<string | null>(null);

  /**
   * Color field configuration
   * Defines the order, labels, and descriptions for each color picker
   */
  const COLOR_FIELDS = [
    {
      key: 'primary' as const,
      label: 'Primary',
      description: 'Main brand color for buttons and links'
    },
    {
      key: 'secondary' as const,
      label: 'Secondary',
      description: 'Subtle accent color for secondary actions'
    },
    {
      key: 'background' as const,
      label: 'Background',
      description: 'Main background color for pages and cards'
    },
    {
      key: 'foreground' as const,
      label: 'Foreground',
      description: 'Primary text color for headings and body text'
    },
    {
      key: 'muted' as const,
      label: 'Muted',
      description: 'Background color for disabled states'
    },
    {
      key: 'mutedForeground' as const,
      label: 'Muted Foreground',
      description: 'Text color for placeholders and disabled text'
    },
    {
      key: 'accent' as const,
      label: 'Accent',
      description: 'Highlight color for focused elements'
    },
    {
      key: 'accentForeground' as const,
      label: 'Accent Foreground',
      description: 'Text color on accent backgrounds'
    },
    {
      key: 'destructive' as const,
      label: 'Destructive',
      description: 'Color for danger actions and error messages'
    },
    {
      key: 'destructiveForeground' as const,
      label: 'Destructive Foreground',
      description: 'Text color on destructive backgrounds'
    },
    {
      key: 'border' as const,
      label: 'Border',
      description: 'Color for borders and dividers'
    },
    {
      key: 'input' as const,
      label: 'Input',
      description: 'Border color for form inputs and text areas'
    },
    {
      key: 'ring' as const,
      label: 'Ring',
      description: 'Focus ring color for keyboard navigation'
    }
  ] as const;

  /**
   * Handle color change
   */
  function handleColorChange(key: keyof ThemeColors, value: HSLColor) {
    colors[key] = value;
    // Clear messages when user makes changes
    errorMessage = null;
    successMessage = null;
  }

  /**
   * Validate form before submission
   */
  function validateForm(): boolean {
    if (!themeName.trim()) {
      errorMessage = 'Please enter a theme name';
      return false;
    }

    if (themeName.trim().length < 3) {
      errorMessage = 'Theme name must be at least 3 characters';
      return false;
    }

    if (themeName.trim().length > 100) {
      errorMessage = 'Theme name must be less than 100 characters';
      return false;
    }

    if (themeDescription && themeDescription.length > 500) {
      errorMessage = 'Description must be less than 500 characters';
      return false;
    }

    return true;
  }

  /**
   * Handle form submission
   */
  async function handleSubmit() {
    if (!browser || isCreating) return;

    // Clear previous messages
    errorMessage = null;
    successMessage = null;

    // Validate form
    if (!validateForm()) {
      return;
    }

    isCreating = true;

    try {
      // Prepare theme data
      const themeData: CreateThemeData = {
        name: themeName.trim(),
        description: themeDescription.trim() || undefined,
        colors: colors
      };

      // Call ORPC to create theme
      const result = await orpc.theme.createTheme(themeData);

      if (result) {
        successMessage = `Theme "${themeName}" created successfully!`;

        // Reset form
        themeName = '';
        themeDescription = '';

        // Reset colors to defaults
        colors = {
          primary: '210 100% 50%' as HSLColor,
          secondary: '210 100% 45%' as HSLColor,
          background: '0 0% 100%' as HSLColor,
          foreground: '210 20% 10%' as HSLColor,
          muted: '210 20% 90%' as HSLColor,
          mutedForeground: '210 20% 40%' as HSLColor,
          accent: '210 100% 50%' as HSLColor,
          accentForeground: '0 0% 100%' as HSLColor,
          destructive: '0 100% 50%' as HSLColor,
          destructiveForeground: '0 0% 100%' as HSLColor,
          border: '210 20% 85%' as HSLColor,
          input: '210 20% 85%' as HSLColor,
          ring: '210 100% 50%' as HSLColor,
          radius: '0.5'
        };

        // Notify parent component
        onThemeCreated?.(result.id);
      }
    } catch (error) {
      console.error('Failed to create theme:', error);
      errorMessage =
        error instanceof Error ? error.message : 'Failed to create theme. Please try again.';
    } finally {
      isCreating = false;
    }
  }

  /**
   * Check if form is valid
   */
  const isFormValid = $derived(
    themeName.trim().length >= 3 &&
    themeName.trim().length <= 100 &&
    (!themeDescription || themeDescription.length <= 500)
  );

  /**
   * Get CSS color for preview elements
   */
  function getCssColor(hsl: HSLColor): string {
    const [h, s, l] = hsl.split(' ');
    return `hsl(${h}, ${s}, ${l})`;
  }
</script>

<Card class={cn('overflow-hidden', className)}>
  <CardHeader class="space-y-1 pb-4">
    <div class="flex items-center gap-2">
      <Palette class="text-muted-foreground size-5" />
      <CardTitle class="text-lg">Create Custom Theme</CardTitle>
    </div>
    <CardDescription>
      Design your own theme with custom colors for a personalized experience
    </CardDescription>
  </CardHeader>

  <CardContent class="space-y-6">
    <!-- Theme Metadata -->
    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="theme-name" class="text-sm font-medium">
          Theme Name <span class="text-destructive">*</span>
        </Label>
        <Input
          id="theme-name"
          bind:value={themeName}
          placeholder="My Custom Theme"
          disabled={isCreating}
          aria-required="true"
          aria-describedby="theme-name-hint"
        />
        <p id="theme-name-hint" class="text-muted-foreground text-xs">
          A descriptive name for your theme (3-100 characters)
        </p>
      </div>

      <div class="space-y-2">
        <Label for="theme-description" class="text-sm font-medium">
          Description <span class="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="theme-description"
          bind:value={themeDescription}
          placeholder="A brief description of your theme"
          disabled={isCreating}
          aria-describedby="theme-description-hint"
        />
        <p id="theme-description-hint" class="text-muted-foreground text-xs">
          Optional description (max 500 characters)
        </p>
      </div>
    </div>

    <!-- Color Pickers -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <Label class="text-base font-semibold">Theme Colors</Label>
        <span class="text-muted-foreground text-xs">
          Customize each color to create your perfect theme
        </span>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        {#each COLOR_FIELDS as field}
          <ColorPicker
            value={colors[field.key]}
            label={field.label}
            description={field.description}
            onChange={(value) => handleColorChange(field.key, value)}
            disabled={isCreating}
            showValues={false}
          />
        {/each}
      </div>
    </div>

    <!-- Live Preview -->
    {#if showPreview}
      <div class="space-y-3">
        <Label class="text-base font-semibold">Live Preview</Label>
        <div
          class="border-border rounded-lg border-2 p-6 transition-colors"
          style="background-color: {getCssColor(colors.background)}; color: {getCssColor(colors.foreground)};"
        >
          <div class="space-y-4">
            <!-- Preview heading -->
            <h3
              class="text-lg font-bold"
              style="color: {getCssColor(colors.primary)};"
            >
              Sample Heading
            </h3>

            <!-- Preview paragraph -->
            <p class="text-sm leading-relaxed" style="color: {getCssColor(colors.foreground)};">
              This is how your theme will look when applied. The text color, background,
              and accents all reflect your chosen colors.
            </p>

            <!-- Preview buttons -->
            <div class="flex flex-wrap gap-2">
              <button
                class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                style="background-color: {getCssColor(colors.primary)}; color: {getCssColor(colors.accentForeground)};"
                type="button"
              >
                Primary Button
              </button>

              <button
                class="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors"
                style="border-color: {getCssColor(colors.border)}; color: {getCssColor(colors.foreground)}; background-color: {getCssColor(colors.secondary)};"
                type="button"
              >
                Secondary Button
              </button>

              <button
                class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                style="background-color: {getCssColor(colors.destructive)}; color: {getCssColor(colors.destructiveForeground)};"
                type="button"
              >
                Destructive
              </button>
            </div>

            <!-- Preview input -->
            <div class="space-y-1">
              <input
                type="text"
                placeholder="Sample input field"
                class="w-full rounded-md border px-3 py-2 text-sm"
                style="border-color: {getCssColor(colors.input)}; background-color: {getCssColor(colors.background)}; color: {getCssColor(colors.foreground)};"
                readonly
              />
            </div>

            <!-- Preview card -->
            <div
              class="rounded-md border p-4"
              style="border-color: {getCssColor(colors.border)}; background-color: {getCssColor(colors.muted)};"
            >
              <p class="text-sm font-medium" style="color: {getCssColor(colors.mutedForeground)};">
                Muted card component example
              </p>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Error Message -->
    {#if errorMessage}
      <div class="destructive bg-destructive/10 text-destructive rounded-md border p-3">
        <p class="text-sm font-medium">{errorMessage}</p>
      </div>
    {/if}

    <!-- Success Message -->
    {#if successMessage}
      <div class="border-border bg-muted/30 text-foreground rounded-md border p-3">
        <p class="text-sm font-medium">{successMessage}</p>
      </div>
    {/if}

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 border-t pt-4" style="border-color: {getCssColor(colors.border)};">
      <Button
        onclick={handleSubmit}
        disabled={!isFormValid || isCreating}
        variant="default"
        type="button"
      >
        {#if isCreating}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
          Creating...
        {:else}
          <SaveIcon class="mr-2 size-4" />
          Create Theme
        {/if}
      </Button>
    </div>
  </CardContent>
</Card>
