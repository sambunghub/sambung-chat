<script lang="ts">
  import FontFamilySetting from '$lib/components/settings/font-family-setting.svelte';
  import { appearance } from '$lib/stores/appearance.store.js';
  import { onMount } from 'svelte';

  let currentSettings = $derived(appearance.currentSettings);

  // Get the CSS font family string for the current selection
  const getFontFamilyCSS = (fontFamily: string) => {
    switch (fontFamily) {
      case 'system-ui':
        return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      case 'sans-serif':
        return 'Arial, "Helvetica Neue", Helvetica, sans-serif';
      case 'monospace':
        return '"SF Mono", "Monaco", "Inconsolata", "Fira Mono", "Droid Sans Mono", "Source Code Pro", monospace';
      default:
        return fontFamily;
    }
  };

  const currentFontFamily = $derived(getFontFamilyCSS(currentSettings.fontFamily));

  onMount(() => {
    console.log('Current settings:', currentSettings);
    console.log('Current font family:', currentFontFamily);
  });
</script>

<div class="container mx-auto max-w-3xl p-6">
  <div class="mb-8">
    <h1 class="text-foreground text-3xl font-bold">Font Family Setting Test</h1>
    <p class="text-muted-foreground mt-2">This page tests the font family selector component</p>
  </div>

  <div class="space-y-8">
    <!-- Font Family Component -->
    <FontFamilySetting />

    <!-- Debug Info -->
    <div class="border-border bg-muted/50 rounded-lg border p-4">
      <h2 class="text-foreground mb-3 text-lg font-semibold">Current Settings</h2>
      <pre class="text-sm">{JSON.stringify(currentSettings, null, 2)}</pre>
      <p class="text-muted-foreground mt-3 text-sm">
        <strong>CSS Font Family:</strong>
        {currentFontFamily}
      </p>
    </div>

    <!-- Live Preview of Different Font Families -->
    <div class="border-border rounded-lg border p-6">
      <h2 class="text-foreground mb-4 text-xl font-semibold">Font Family Preview</h2>

      <div class="space-y-6">
        <div>
          <h3 class="text-muted-foreground mb-2 text-sm font-medium uppercase">Normal Text</h3>
          <p style="font-family: {currentFontFamily}; font-size: 16px; line-height: 1.6;">
            This is how normal text will appear with your selected font family. The quick brown fox
            jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick
            daft zebras jump!
          </p>
        </div>

        <div>
          <h3 class="text-muted-foreground mb-2 text-sm font-medium uppercase">Headings</h3>
          <h4 style="font-family: {currentFontFamily};" class="text-2xl font-bold">Heading Text</h4>
        </div>

        <div>
          <h3 class="text-muted-foreground mb-2 text-sm font-medium uppercase">
            Code/Technical (if monospace selected)
          </h3>
          <code
            style="font-family: {currentFontFamily};"
            class="border-border bg-muted rounded border px-2 py-1 text-sm"
          >
            const example = "Code snippet";
          </code>
        </div>

        <div>
          <h3 class="text-muted-foreground mb-2 text-sm font-medium uppercase">
            Paragraph with Muted Text
          </h3>
          <p style="font-family: {currentFontFamily}; font-size: 15px;">
            This is regular text with
            <span class="text-muted-foreground">muted text</span>
            in the middle.
          </p>
        </div>
      </div>
    </div>

    <!-- Sample Content Block -->
    <div class="border-border rounded-lg border p-6">
      <h2 class="text-foreground mb-4 text-xl font-semibold">Sample Content Block</h2>
      <div style="font-family: {currentFontFamily};">
        <h3 class="mb-2 text-lg font-semibold">Understanding Font Families</h3>
        <p class="mb-3 text-base leading-relaxed">
          Font families play a crucial role in the readability and aesthetics of any application.
          Each font family has its own character:
        </p>
        <ul class="mb-3 ml-6 list-disc space-y-1 text-base">
          <li>
            <strong>System UI:</strong> Matches your operating system's native font for a familiar feel
          </li>
          <li>
            <strong>Sans Serif:</strong> Clean, modern, and highly readable for general content
          </li>
          <li>
            <strong>Monospace:</strong> Fixed-width characters ideal for code and technical content
          </li>
        </ul>
        <p class="text-base">
          Select the font family that best suits your preferences and use case!
        </p>
      </div>
    </div>
  </div>
</div>
