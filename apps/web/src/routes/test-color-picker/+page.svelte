<script lang="ts">
  import ColorPicker from '$lib/components/settings/color-picker.svelte';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
  import type { HSLColor } from '$lib/types/theme.js';
  import { PaletteIcon } from '@lucide/svelte';

  // Test colors for different theme aspects
  let primaryColor = $state<HSLColor>('222 47% 11%');
  let secondaryColor = $state<HSLColor>('210 40% 96%');
  let backgroundColor = $state<HSLColor>('0 0% 100%');
  let foregroundColor = $state<HSLColor>('222 47% 11%');
  let accentColor = $state<HSLColor>('210 40% 96%');
  let destructiveColor = $state<HSLColor>('0 84% 60%');

  // Preset colors for quick testing
  const presetColors: Record<string, HSLColor> = {
    blue: '217 91% 60%',
    green: '142 76% 36%',
    red: '0 84% 60%',
    purple: '262 83% 58%',
    orange: '25 95% 53%',
    dark: '222 47% 11%',
    light: '210 40% 98%'
  };

  function applyPreset(colorName: string) {
    const color = presetColors[colorName];
    if (color) {
      primaryColor = color;
    }
  }

  function handlePrimaryChange(color: HSLColor) {
    primaryColor = color;
  }

  function handleSecondaryChange(color: HSLColor) {
    secondaryColor = color;
  }

  function handleBackgroundChange(color: HSLColor) {
    backgroundColor = color;
  }

  function handleForegroundChange(color: HSLColor) {
    foregroundColor = color;
  }

  function handleAccentChange(color: HSLColor) {
    accentColor = color;
  }

  function handleDestructiveChange(color: HSLColor) {
    destructiveColor = color;
  }
</script>

<div class="container mx-auto max-w-4xl p-6">
  <div class="mb-8">
    <div class="flex items-center gap-3">
      <PaletteIcon class="text-muted-foreground size-8" />
      <div>
        <h1 class="text-foreground text-3xl font-bold">Color Picker Test</h1>
        <p class="text-muted-foreground mt-2">
          Test the color picker component for custom theme creation
        </p>
      </div>
    </div>
  </div>

  <div class="space-y-8">
    <!-- Color Picker for Primary Color -->
    <Card>
      <CardHeader>
        <CardTitle class="text-xl">Primary Color</CardTitle>
        <CardDescription>
          Main brand color for buttons, links, and active states
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ColorPicker
          value={primaryColor}
          label="Primary Color"
          description="The main accent color for the application"
          onChange={handlePrimaryChange}
        />

        <div class="mt-4 space-y-2">
          <p class="text-muted-foreground text-sm font-medium">Quick Presets:</p>
          <div class="flex gap-2">
            {#each Object.entries(presetColors) as [name, color]}
              <button
                onclick={() => applyPreset(name)}
                class="border-border hover:border-primary inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors"
                type="button"
              >
                <div
                  class="size-4 rounded"
                  style="background-color: hsl({color});"
                ></div>
                <span class="capitalize">{name}</span>
              </button>
            {/each}
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Multiple Color Pickers Grid -->
    <div class="grid gap-6 md:grid-cols-2">
      <!-- Secondary Color -->
      <Card>
        <CardHeader>
          <CardTitle>Secondary Color</CardTitle>
          <CardDescription>Subtle accents and secondary actions</CardDescription>
        </CardHeader>
        <CardContent>
          <ColorPicker
            value={secondaryColor}
            label="Secondary Color"
            showValues={true}
            onChange={handleSecondaryChange}
          />
        </CardContent>
      </Card>

      <!-- Background Color -->
      <Card>
        <CardHeader>
          <CardTitle>Background Color</CardTitle>
          <CardDescription>Main page and card backgrounds</CardDescription>
        </CardHeader>
        <CardContent>
          <ColorPicker
            value={backgroundColor}
            label="Background Color"
            showValues={true}
            onChange={handleBackgroundChange}
          />
        </CardContent>
      </Card>

      <!-- Foreground Color -->
      <Card>
        <CardHeader>
          <CardTitle>Foreground Color</CardTitle>
          <CardDescription>Body text and headings</CardDescription>
        </CardHeader>
        <CardContent>
          <ColorPicker
            value={foregroundColor}
            label="Foreground Color"
            showValues={true}
            onChange={handleForegroundChange}
          />
        </CardContent>
      </Card>

      <!-- Accent Color -->
      <Card>
        <CardHeader>
          <CardTitle>Accent Color</CardTitle>
          <CardDescription>Highlights and focus indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <ColorPicker
            value={accentColor}
            label="Accent Color"
            showValues={true}
            onChange={handleAccentChange}
          />
        </CardContent>
      </Card>

      <!-- Destructive Color -->
      <Card>
        <CardHeader>
          <CardTitle>Destructive Color</CardTitle>
          <CardDescription>Error messages and danger actions</CardDescription>
        </CardHeader>
        <CardContent>
          <ColorPicker
            value={destructiveColor}
            label="Destructive Color"
            showValues={true}
            onChange={handleDestructiveChange}
          />
        </CardContent>
      </Card>
    </div>

    <!-- Live Theme Preview -->
    <Card>
      <CardHeader>
        <CardTitle>Live Theme Preview</CardTitle>
        <CardDescription>
          See how the selected colors look in actual UI components
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          class="rounded-lg border-2 p-6 transition-colors"
          style="background-color: hsl({backgroundColor}); border-color: hsl({foregroundColor}, 0.1);"
        >
          <div class="space-y-4">
            <!-- Headings -->
            <div>
              <h2
                class="text-2xl font-bold"
                style="color: hsl({foregroundColor});"
              >
                Welcome to Your Custom Theme
              </h2>
              <p class="text-sm" style="color: hsl({foregroundColor}); opacity: 0.7;">
                This is how your theme looks in action
              </p>
            </div>

            <!-- Buttons Preview -->
            <div class="flex flex-wrap gap-3">
              <button
                class="text-white px-4 py-2 rounded-md font-medium transition-colors"
                style="background-color: hsl({primaryColor});"
              >
                Primary Button
              </button>
              <button
                class="px-4 py-2 rounded-md font-medium border-2 transition-colors"
                style="background-color: hsl({secondaryColor}); color: hsl({foregroundColor}); border-color: hsl({foregroundColor}, 0.2);"
              >
                Secondary Button
              </button>
              <button
                class="text-white px-4 py-2 rounded-md font-medium transition-colors"
                style="background-color: hsl({destructiveColor});"
              >
                Destructive
              </button>
            </div>

            <!-- Cards Preview -->
            <div class="grid gap-4 md:grid-cols-2">
              <div
                class="rounded-lg border-2 p-4 transition-colors"
                style="background-color: hsl({accentColor}); border-color: hsl({primaryColor}, 0.2);"
              >
                <h3
                  class="text-lg font-semibold mb-2"
                  style="color: hsl({foregroundColor});"
                >
                  Accent Card
                </h3>
                <p class="text-sm" style="color: hsl({foregroundColor}); opacity: 0.8;">
                  This card uses the accent color for background
                </p>
              </div>

              <div
                class="rounded-lg border-2 p-4 transition-colors"
                style="background-color: hsl({secondaryColor}); border-color: hsl({foregroundColor}, 0.1);"
              >
                <h3
                  class="text-lg font-semibold mb-2"
                  style="color: hsl({foregroundColor});"
                >
                  Secondary Card
                </h3>
                <p class="text-sm" style="color: hsl({foregroundColor}); opacity: 0.8;">
                  This card uses the secondary color
                </p>
              </div>
            </div>

            <!-- Form Elements -->
            <div class="space-y-3">
              <div>
                <label for="test-input" class="text-sm font-medium" style="color: hsl({foregroundColor});">
                  Input Field
                </label>
                <input
                  id="test-input"
                  type="text"
                  placeholder="Enter some text..."
                  class="w-full rounded-md border-2 px-3 py-2 transition-colors"
                  style="background-color: hsl({backgroundColor}); border-color: hsl({foregroundColor}, 0.2); color: hsl({foregroundColor});"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Current Values Display -->
    <Card>
      <CardHeader>
        <CardTitle>Current Color Values</CardTitle>
        <CardDescription>HSL values for all selected colors</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="border-border bg-muted/30 rounded-lg border p-4">
          <pre class="text-sm font-mono">{JSON.stringify({
            primary: primaryColor,
            secondary: secondaryColor,
            background: backgroundColor,
            foreground: foregroundColor,
            accent: accentColor,
            destructive: destructiveColor
          }, null, 2)}</pre>
        </div>
      </CardContent>
    </Card>
  </div>
</div>
