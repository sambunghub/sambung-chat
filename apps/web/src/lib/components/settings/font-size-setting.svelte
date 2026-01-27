<script lang="ts">
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '$lib/components/ui/card/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { appearance, type FontSize } from '$lib/stores/appearance.store.js';
  import { cn } from '$lib/utils.js';
  import { onMount } from 'svelte';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import TypeIcon from '@lucide/svelte/icons/type';

  // Font size options in pixels
  const FONT_SIZE_OPTIONS: FontSize[] = ['12', '13', '14', '15', '16', '17', '18', '19', '20'];

  /**
   * Component props
   */
  interface Props {
    /** Additional CSS classes for the container */
    class?: string;
    /** Whether to show the preview text */
    showPreview?: boolean;
    /** Custom preview text */
    previewText?: string;
  }

  let {
    class: className,
    showPreview = true,
    previewText = 'The quick brown fox jumps over the lazy dog.',
  }: Props = $props();

  // Local state for immediate feedback before store update
  let localValue = $state<FontSize>(appearance.currentSettings.fontSize);
  let isDragging = $state(false);

  // Sync local state with store
  $effect(() => {
    if (!isDragging) {
      localValue = appearance.currentSettings.fontSize;
    }
  });

  /**
   * Handle slider input change
   */
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value as FontSize;
    localValue = value;
  }

  /**
   * Handle slider change (on release)
   */
  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value as FontSize;
    localValue = value;
    isDragging = false;

    // Update the store
    appearance.updateSetting('fontSize', value);
  }

  /**
   * Handle slider drag start
   */
  function handleDragStart() {
    isDragging = true;
  }

  /**
   * Decrease font size by 1px
   */
  function decreaseFontSize() {
    const currentIndex = FONT_SIZE_OPTIONS.indexOf(localValue);
    if (currentIndex > 0) {
      const newValue = FONT_SIZE_OPTIONS[currentIndex - 1];
      localValue = newValue;
      appearance.updateSetting('fontSize', newValue);
    }
  }

  /**
   * Increase font size by 1px
   */
  function increaseFontSize() {
    const currentIndex = FONT_SIZE_OPTIONS.indexOf(localValue);
    if (currentIndex < FONT_SIZE_OPTIONS.length - 1) {
      const newValue = FONT_SIZE_OPTIONS[currentIndex + 1];
      localValue = newValue;
      appearance.updateSetting('fontSize', newValue);
    }
  }

  /**
   * Calculate percentage for slider position
   */
  const sliderPercentage = $derived(((parseInt(localValue) - 12) / (20 - 12)) * 100);

  // Get display label for font size
  const fontSizeLabel = $derived(`${localValue}px`);
</script>

<Card class={cn('overflow-hidden', className)}>
  <CardHeader class="space-y-1 pb-4">
    <div class="flex items-center gap-2">
      <TypeIcon class="text-muted-foreground size-5" />
      <CardTitle class="text-lg">Font Size</CardTitle>
    </div>
    <CardDescription>Adjust the base font size for text throughout the application</CardDescription>
  </CardHeader>

  <CardContent class="space-y-6">
    <!-- Font Size Slider Control -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <Label for="font-size-slider" class="text-sm font-medium">
          Font Size: <span class="text-primary font-semibold">{fontSizeLabel}</span>
        </Label>

        <!-- Quick adjust buttons -->
        <div class="flex items-center gap-1">
          <button
            onclick={decreaseFontSize}
            disabled={localValue === '12'}
            class="border-input hover:bg-accent hover:text-accent-foreground disabled:border-border/40 disabled:text-muted-foreground/40 inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm transition-colors disabled:cursor-not-allowed disabled:bg-transparent"
            type="button"
            aria-label="Decrease font size"
          >
            <MinusIcon class="size-3" />
          </button>
          <button
            onclick={increaseFontSize}
            disabled={localValue === '20'}
            class="border-input hover:bg-accent hover:text-accent-foreground disabled:border-border/40 disabled:text-muted-foreground/40 inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm transition-colors disabled:cursor-not-allowed disabled:bg-transparent"
            type="button"
            aria-label="Increase font size"
          >
            <PlusIcon class="size-3" />
          </button>
        </div>
      </div>

      <!-- Custom Slider -->
      <div class="relative flex items-center gap-3">
        <span class="text-muted-foreground text-xs font-medium">12px</span>

        <div class="relative flex-1">
          <input
            id="font-size-slider"
            type="range"
            min="12"
            max="20"
            step="1"
            value={localValue}
            oninput={handleInput}
            onchange={handleChange}
            onmousedown={handleDragStart}
            ontouchstart={handleDragStart}
            class="pointer-events-none absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            aria-label="Font size slider"
          />
          <div
            class="bg-muted relative h-2 w-full overflow-hidden rounded-full"
            role="presentation"
          >
            <div
              class="bg-primary h-full transition-all duration-75 ease-out"
              style="width: {sliderPercentage}%"
            ></div>
          </div>
          <div
            class="bg-background border-primary ring-offset-background absolute top-1/2 size-5 -translate-y-1/2 rounded-full border-2 shadow-sm transition-all duration-75 ease-out"
            style="left: calc({sliderPercentage}% - 10px)"
            role="presentation"
          ></div>
        </div>

        <span class="text-muted-foreground text-xs font-medium">20px</span>
      </div>

      <!-- Size presets -->
      <div class="flex gap-2">
        {#each ['14', '16', '18'] as preset}
          <button
            onclick={() => {
              localValue = preset as FontSize;
              appearance.updateSetting('fontSize', preset as FontSize);
            }}
            class="border-input hover:border-primary hover:bg-accent hover:text-accent-foreground data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary inline-flex h-8 flex-1 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors"
            data-active={localValue === preset}
            aria-pressed={localValue === preset}
            type="button"
          >
            {preset}px
          </button>
        {/each}
      </div>
    </div>

    {#if showPreview}
      <!-- Live Preview -->
      <div class="border-border bg-muted/30 rounded-lg border p-4">
        <p class="text-muted-foreground mb-2 text-xs font-medium uppercase">Preview</p>
        <p class="text-foreground leading-relaxed" style="font-size: {localValue}px;">
          {previewText}
        </p>
        <p class="text-muted-foreground mt-2 leading-relaxed" style="font-size: {localValue}px;">
          This is how your text will appear with the selected font size.
        </p>
      </div>
    {/if}
  </CardContent>
</Card>
