<script lang="ts">
  import SettingsPreview from '$lib/components/settings/settings-preview.svelte';
  import { Card, CardContent } from '$lib/components/ui/card/index.js';
  import { appearance } from '$lib/stores/appearance.store.js';
  import SettingsIcon from '@lucide/svelte/icons/settings';
</script>

<div class="container mx-auto max-w-5xl p-6">
  <div class="mb-8">
    <div class="flex items-center gap-3">
      <SettingsIcon class="text-primary size-8" />
      <div>
        <h1 class="text-foreground text-3xl font-bold">Settings Preview Component</h1>
        <p class="text-muted-foreground mt-1">Test page for the live settings preview component</p>
      </div>
    </div>
  </div>

  <div class="space-y-8">
    <!-- Instructions Card -->
    <Card>
      <CardContent class="p-6">
        <div class="space-y-4">
          <div>
            <h2 class="text-foreground mb-2 text-xl font-semibold">Instructions</h2>
            <p class="text-muted-foreground text-sm leading-relaxed">
              This page tests the SettingsPreview component which shows a live preview of how
              appearance settings affect message appearance. Follow these steps to verify
              functionality:
            </p>
          </div>

          <ol class="text-muted-foreground list-inside list-decimal space-y-2 text-sm">
            <li>
              <span class="text-foreground">Open Appearance Settings:</span> Navigate to
              <code class="bg-muted rounded px-1.5 py-0.5 text-xs">/app/settings/appearance</code>
              in another tab
            </li>
            <li>
              <span class="text-foreground">Adjust Settings:</span> Change font size, font family, or
              message density settings
            </li>
            <li>
              <span class="text-foreground">Observe Live Preview:</span> Watch the preview below update
              in real-time to reflect your changes
            </li>
            <li>
              <span class="text-foreground">Verify Responsiveness:</span> Ensure the preview adapts correctly
              to different screen sizes
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>

    <!-- Main Preview -->
    <div>
      <h2 class="text-foreground mb-4 text-xl font-semibold">Default Preview</h2>
      <SettingsPreview />
    </div>

    <!-- Custom Title Preview -->
    <div>
      <h2 class="text-foreground mb-4 text-xl font-semibold">Custom Title Preview</h2>
      <SettingsPreview
        title="Message Appearance Preview"
        description="This is a customized preview with a different title"
      />
    </div>

    <!-- Current Settings Display -->
    <Card>
      <CardContent class="p-6">
        <h2 class="text-foreground mb-4 text-xl font-semibold">Current Settings Values</h2>
        <div class="bg-muted/50 rounded-lg p-4 font-mono text-sm">
          <pre class="whitespace-pre-wrap">{JSON.stringify(
              appearance.currentSettings,
              null,
              2
            )}</pre>
        </div>
      </CardContent>
    </Card>

    <!-- Quick Actions -->
    <Card>
      <CardContent class="p-6">
        <h2 class="text-foreground mb-4 text-xl font-semibold">Quick Test Actions</h2>
        <div class="flex flex-wrap gap-3">
          <button
            onclick={() => appearance.updateSetting('fontSize', '12')}
            class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            type="button"
          >
            Set Font Size: 12px
          </button>
          <button
            onclick={() => appearance.updateSetting('fontSize', '16')}
            class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            type="button"
          >
            Set Font Size: 16px
          </button>
          <button
            onclick={() => appearance.updateSetting('fontSize', '20')}
            class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            type="button"
          >
            Set Font Size: 20px
          </button>
          <button
            onclick={() => appearance.updateSetting('fontFamily', 'monospace')}
            class="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            type="button"
          >
            Set Monospace Font
          </button>
          <button
            onclick={() => appearance.updateSetting('messageDensity', 'compact')}
            class="bg-accent text-accent-foreground hover:bg-accent/80 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            type="button"
          >
            Set Compact Density
          </button>
          <button
            onclick={() => appearance.updateSetting('messageDensity', 'spacious')}
            class="bg-accent text-accent-foreground hover:bg-accent/80 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            type="button"
          >
            Set Spacious Density
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
</div>
