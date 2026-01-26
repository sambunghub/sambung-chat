<script lang="ts">
  import { Label } from '$lib/components/ui/label/index.js';
  import { cn } from '$lib/utils.js';
  import type { HSLColor } from '$lib/types/theme.js';
  import { CopyIcon } from '@lucide/svelte';
  import { browser } from '$app/environment';

  /**
   * Component props
   */
  interface Props {
    /** Current HSL color value */
    value: HSLColor;

    /** Label for the color picker */
    label?: string;

    /** Description of what this color is for */
    description?: string;

    /** Additional CSS classes for the container */
    class?: string;

    /** Whether to show the HSL values */
    showValues?: boolean;

    /** Whether to disable the picker */
    disabled?: boolean;

    /** Callback when color changes */
    onChange?: (color: HSLColor) => void;
  }

  let {
    value,
    label = 'Color',
    description,
    class: className,
    showValues = true,
    disabled = false,
    onChange
  }: Props = $props();

  // Local state for color picker
  let hexInput = $state('#000000');
  let hue = $state(0);
  let saturation = $state(0);
  let lightness = $state(0);

  // Parse HSL color string to numbers
  function parseHSL(hsl: HSLColor): { h: number; s: number; l: number } {
    const match = hsl.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
    if (!match) {
      return { h: 0, s: 0, l: 0 };
    }
    return {
      h: parseInt(match[1]),
      s: parseInt(match[2]),
      l: parseInt(match[3])
    };
  }

  // Convert HSL to hex for the color input
  function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  // Convert hex to HSL
  function hexToHSL(hex: string): { h: number; s: number; l: number } {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  // Format HSL as string
  function formatHSL(h: number, s: number, l: number): HSLColor {
    return `${h} ${s}% ${l}%` as HSLColor;
  }

  // Initialize from props
  $effect(() => {
    const parsed = parseHSL(value);
    hue = parsed.h;
    saturation = parsed.s;
    lightness = parsed.l;
    hexInput = hslToHex(hue, saturation, lightness);
  });

  /**
   * Handle hex color input change
   */
  function handleHexChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const hex = target.value;
    hexInput = hex;
    const hsl = hexToHSL(hex);
    hue = hsl.h;
    saturation = hsl.s;
    lightness = hsl.l;
    const newColor = formatHSL(hue, saturation, lightness);
    onChange?.(newColor);
  }

  /**
   * Handle hue slider change
   */
  function handleHueChange(event: Event) {
    const target = event.target as HTMLInputElement;
    hue = parseInt(target.value);
    updateColor();
  }

  /**
   * Handle saturation slider change
   */
  function handleSaturationChange(event: Event) {
    const target = event.target as HTMLInputElement;
    saturation = parseInt(target.value);
    updateColor();
  }

  /**
   * Handle lightness slider change
   */
  function handleLightnessChange(event: Event) {
    const target = event.target as HTMLInputElement;
    lightness = parseInt(target.value);
    updateColor();
  }

  /**
   * Update color and sync hex input
   */
  function updateColor() {
    if (browser) {
      hexInput = hslToHex(hue, saturation, lightness);
    }
    const newColor = formatHSL(hue, saturation, lightness);
    onChange?.(newColor);
  }

  /**
   * Copy HSL value to clipboard
   */
  async function copyToClipboard() {
    if (!browser) return;

    const hslString = formatHSL(hue, saturation, lightness);
    try {
      await navigator.clipboard.writeText(hslString);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  /**
   * Get CSS color string for preview
   */
  const cssColor = $derived(`hsl(${hue}, ${saturation}%, ${lightness}%)`);

  /**
   * Get text color based on lightness (for readability)
   */
  const textColor = $derived(lightness > 50 ? '#000' : '#fff');
</script>

<div class={cn('space-y-3', className)}>
  {#if label || description}
    <div class="space-y-1">
      {#if label}
        <Label for="{label}-color" class="text-sm font-medium">{label}</Label>
      {/if}
      {#if description}
        <p class="text-muted-foreground text-xs">{description}</p>
      {/if}
    </div>
  {/if}

  <!-- Color Preview and Controls -->
  <div class="space-y-3">
    <!-- Color Preview with Hex Input -->
    <div class="flex items-center gap-3">
      <div
        class="border-border size-12 rounded-lg border-2 shadow-sm transition-colors"
        style="background-color: {cssColor};"
        aria-label="Color preview"
      ></div>

      <div class="flex-1">
        <input
          id="{label}-color"
          type="color"
          bind:value={hexInput}
          oninput={handleHexChange}
          class="h-10 w-full cursor-pointer rounded border"
          disabled={disabled}
          aria-label="{label} hex color picker"
        />
      </div>

      {#if showValues && browser}
        <button
          onclick={copyToClipboard}
          class="border-input hover:bg-accent hover:text-accent-foreground inline-flex size-10 items-center justify-center rounded-md border transition-colors"
          type="button"
          aria-label="Copy HSL value"
          title="Copy HSL value"
        >
          <CopyIcon class="size-4" />
        </button>
      {/if}
    </div>

    {#if showValues}
      <div class="border-border bg-muted/30 rounded-md border p-2">
        <code class="text-xs font-mono">{formatHSL(hue, saturation, lightness)}</code>
      </div>
    {/if}

    <!-- HSL Sliders -->
    <div class="space-y-3">
      <!-- Hue -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <Label for="{label}-hue" class="text-xs font-medium">Hue</Label>
          <span class="text-muted-foreground text-xs">{hue}°</span>
        </div>
        <input
          id="{label}-hue"
          type="range"
          min="0"
          max="360"
          bind:value={hue}
          oninput={handleHueChange}
          class="h-2 w-full cursor-pointer appearance-none rounded-lg"
          style="background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);"
          disabled={disabled}
          aria-label="Hue slider"
        />
      </div>

      <!-- Saturation -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <Label for="{label}-saturation" class="text-xs font-medium">Saturation</Label>
          <span class="text-muted-foreground text-xs">{saturation}%</span>
        </div>
        <input
          id="{label}-saturation"
          type="range"
          min="0"
          max="100"
          bind:value={saturation}
          oninput={handleSaturationChange}
          class="h-2 w-full cursor-pointer appearance-none rounded-lg"
          style="background: linear-gradient(to right, hsl({hue}, 0%, {lightness}%), hsl({hue}, 100%, {lightness}%));"
          disabled={disabled}
          aria-label="Saturation slider"
        />
      </div>

      <!-- Lightness -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <Label for="{label}-lightness" class="text-xs font-medium">Lightness</Label>
          <span class="text-muted-foreground text-xs">{lightness}%</span>
        </div>
        <input
          id="{label}-lightness"
          type="range"
          min="0"
          max="100"
          bind:value={lightness}
          oninput={handleLightnessChange}
          class="h-2 w-full cursor-pointer appearance-none rounded-lg"
          style="background: linear-gradient(to right, #000000, hsl({hue}, {saturation}%, 50%), #ffffff);"
          disabled={disabled}
          aria-label="Lightness slider"
        />
      </div>
    </div>

    <!-- Color Preview Box with Sample Text -->
    <div
      class="flex items-center justify-center rounded-lg border-2 p-4 transition-colors"
      style="background-color: {cssColor}; border-color: hsl({hue}, {saturation}%, {Math.max(0, lightness - 20)}%);"
    >
      <span class="text-sm font-medium" style="color: {textColor};">
        Sample Text
      </span>
    </div>
  </div>
</div>
