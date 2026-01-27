<script lang="ts">
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '$lib/components/ui/card/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { appearance, type FontFamily } from '$lib/stores/appearance.store.js';
  import { cn } from '$lib/utils.js';
  import { CheckIcon } from '@lucide/svelte';
  import TypeIcon from '@lucide/svelte/icons/type';

  /**
   * Font family option interface
   */
  interface FontFamilyOption {
    value: FontFamily;
    label: string;
    description: string;
    fontFamily: string;
  }

  // Font family options with their CSS font families
  const FONT_FAMILY_OPTIONS: FontFamilyOption[] = [
    {
      value: 'system-ui',
      label: 'System UI',
      description: 'Default system font (San Francisco on Mac, Segoe UI on Windows)',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    {
      value: 'sans-serif',
      label: 'Sans Serif',
      description: 'Clean and modern sans-serif fonts',
      fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    },
    {
      value: 'monospace',
      label: 'Monospace',
      description: 'Fixed-width fonts for code and technical content',
      fontFamily:
        '"SF Mono", "Monaco", "Inconsolata", "Fira Mono", "Droid Sans Mono", "Source Code Pro", monospace',
    },
  ];

  /**
   * Component props
   */
  interface Props {
    /** Additional CSS classes for the container */
    class?: string;
    /** Whether to show the description for each font */
    showDescription?: boolean;
  }

  let { class: className, showDescription = true }: Props = $props();

  // Local state for immediate feedback before store update
  let localValue = $state<FontFamily>(appearance.currentSettings.fontFamily);

  // Sync local state with store
  $effect(() => {
    localValue = appearance.currentSettings.fontFamily;
  });

  /**
   * Handle font family selection
   */
  function handleFontFamilySelect(value: FontFamily) {
    localValue = value;
    appearance.updateSetting('fontFamily', value);
  }

  /**
   * Get selected font family option
   */
  const selectedOption = $derived(
    FONT_FAMILY_OPTIONS.find((option) => option.value === localValue) || FONT_FAMILY_OPTIONS[0]
  );
</script>

<Card class={cn('overflow-hidden', className)}>
  <CardHeader class="space-y-1 pb-4">
    <div class="flex items-center gap-2">
      <TypeIcon class="text-muted-foreground size-5" />
      <CardTitle class="text-lg">Font Family</CardTitle>
    </div>
    <CardDescription>Choose the font style used throughout the application</CardDescription>
  </CardHeader>

  <CardContent class="space-y-4">
    <!-- Font Family Options -->
    <div class="space-y-2">
      <Label class="text-sm font-medium">Select Font Family</Label>

      <div class="grid gap-3">
        {#each FONT_FAMILY_OPTIONS as option}
          <button
            onclick={() => handleFontFamilySelect(option.value)}
            class="border-input hover:border-primary hover:bg-accent/50 data-[selected=true]:border-primary data-[selected=true]:bg-primary/5 data-[selected=true]:ring-primary relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-left transition-all data-[selected=true]:ring-1"
            data-selected={localValue === option.value}
            aria-pressed={localValue === option.value}
            type="button"
          >
            <!-- Selection indicator -->
            <div class="text-primary mt-0.5">
              <div
                class="border-primary data-[selected=true]:bg-primary flex size-4 items-center justify-center rounded-full border-2"
                data-selected={localValue === option.value}
              >
                {#if localValue === option.value}
                  <CheckIcon class="size-3" />
                {/if}
              </div>
            </div>

            <!-- Font family info -->
            <div class="flex-1 space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-semibold" style="font-family: {option.fontFamily};">
                  {option.label}
                </span>
                <span class="text-muted-foreground text-xs uppercase">
                  {option.value}
                </span>
              </div>

              {#if showDescription}
                <p class="text-muted-foreground text-sm leading-relaxed">
                  {option.description}
                </p>
              {/if}

              <!-- Preview text with the font -->
              <p class="text-foreground mt-2 text-sm" style="font-family: {option.fontFamily};">
                The quick brown fox jumps over the lazy dog.
              </p>
            </div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Current Selection Summary -->
    <div class="border-border bg-muted/30 rounded-lg border p-3">
      <p class="text-muted-foreground mb-1 text-xs font-medium uppercase">Current Selection</p>
      <p
        class="text-foreground text-base font-semibold"
        style="font-family: {selectedOption.fontFamily};"
      >
        {selectedOption.label}
        <span class="text-muted-foreground font-normal"> ({selectedOption.value})</span>
      </p>
    </div>
  </CardContent>
</Card>
