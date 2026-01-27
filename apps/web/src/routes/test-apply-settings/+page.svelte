<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import {
    applyAppearanceSettings,
    getAppearanceVariables,
    applyFontSize,
    applyFontFamily,
    applySidebarWidth,
    resetAppearanceVariables,
  } from '$lib/utils/apply-settings';
  import { appearance } from '$lib/stores/appearance.store';
  import Info from '@lucide/svelte/icons/info';
  import Check from '@lucide/svelte/icons/check';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';

  // Test state
  let currentVariables = $state<Record<string, string>>({});
  let settings = $state(appearance.currentSettings);
  let testCount = $state(0);
  let lastAction = $state<string>('');
  let actionLog = $state<string[]>([]);

  // Update displayed variables
  function updateVariables() {
    if (browser) {
      currentVariables = getAppearanceVariables();
    }
  }

  // Log action
  function logAction(action: string) {
    lastAction = action;
    actionLog = [`[${new Date().toLocaleTimeString()}] ${action}`, ...actionLog].slice(0, 10);
    testCount++;
  }

  // Apply all settings
  function testApplyAll() {
    applyAppearanceSettings(settings);
    updateVariables();
    logAction('Applied all appearance settings');
  }

  // Apply individual settings
  function testFontSize() {
    applyFontSize(settings.fontSize);
    updateVariables();
    logAction(`Applied font size: ${settings.fontSize}px`);
  }

  function testFontFamily() {
    applyFontFamily(settings.fontFamily);
    updateVariables();
    logAction(`Applied font family: ${settings.fontFamily}`);
  }

  function testSidebarWidth() {
    applySidebarWidth(settings.sidebarWidth);
    updateVariables();
    logAction(`Applied sidebar width: ${settings.sidebarWidth}px`);
  }

  // Reset variables
  function testReset() {
    resetAppearanceVariables();
    updateVariables();
    logAction('Reset all appearance variables');
  }

  // Quick test actions
  function quickTestFontSize(size: string) {
    applyFontSize(size);
    updateVariables();
    logAction(`Quick test font size: ${size}px`);
  }

  function quickTestFontFamily(family: string) {
    applyFontFamily(family);
    updateVariables();
    logAction(`Quick test font family: ${family}`);
  }

  // Initialize on mount
  onMount(() => {
    updateVariables();
    logAction('Page loaded - appearance settings initialized');

    // Watch for settings changes
    $effect(() => {
      settings = appearance.currentSettings;
      updateVariables();
      logAction('Settings changed from store');
    });
  });
</script>

<div class="container mx-auto max-w-7xl px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="mb-2 flex items-center gap-2 text-3xl font-bold">
      <Info class="h-8 w-8" />
      Apply Settings Utility Test
    </h1>
    <p class="text-muted-foreground">
      Test the CSS variable application for appearance settings (font size, font family, sidebar
      width)
    </p>
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Main Content -->
    <div class="space-y-6 lg:col-span-2">
      <!-- Current CSS Variables -->
      <div class="card bg-card border-border rounded-lg border p-6">
        <h2 class="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Check class="h-5 w-5" />
          Current CSS Variables
        </h2>

        <div class="space-y-3 font-mono text-sm">
          <div class="bg-muted flex items-center justify-between rounded p-3">
            <span class="font-semibold">--font-size-base</span>
            <span class="text-primary">{currentVariables['--font-size-base'] || 'not set'}</span>
          </div>
          <div class="bg-muted flex items-center justify-between rounded p-3">
            <span class="font-semibold">--font-family-base</span>
            <span class="text-primary max-w-md text-right break-all">
              {currentVariables['--font-family-base'] || 'not set'}
            </span>
          </div>
          <div class="bg-muted flex items-center justify-between rounded p-3">
            <span class="font-semibold">--sidebar-width</span>
            <span class="text-primary">{currentVariables['--sidebar-width'] || 'not set'}</span>
          </div>
        </div>
      </div>

      <!-- Test Actions -->
      <div class="card bg-card border-border rounded-lg border p-6">
        <h2 class="mb-4 text-xl font-semibold">Test Actions</h2>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            onclick={testApplyAll}
            class="bg-primary text-primary-foreground rounded px-4 py-2 transition hover:opacity-90"
          >
            Apply All Settings
          </button>
          <button
            onclick={testReset}
            class="bg-destructive text-destructive-foreground rounded px-4 py-2 transition hover:opacity-90"
          >
            Reset Variables
          </button>
          <button
            onclick={testFontSize}
            class="bg-secondary text-secondary-foreground rounded px-4 py-2 transition hover:opacity-90"
          >
            Apply Font Size
          </button>
          <button
            onclick={testFontFamily}
            class="bg-secondary text-secondary-foreground rounded px-4 py-2 transition hover:opacity-90"
          >
            Apply Font Family
          </button>
          <button
            onclick={testSidebarWidth}
            class="bg-secondary text-secondary-foreground rounded px-4 py-2 transition hover:opacity-90"
          >
            Apply Sidebar Width
          </button>
        </div>
      </div>

      <!-- Quick Tests -->
      <div class="card bg-card border-border rounded-lg border p-6">
        <h2 class="mb-4 text-xl font-semibold">Quick Tests</h2>

        <div class="space-y-4">
          <!-- Font Size Quick Tests -->
          <div>
            <h3 class="mb-2 text-sm font-semibold">Font Size</h3>
            <div class="flex flex-wrap gap-2">
              {#each ['12', '14', '16', '18', '20'] as size}
                <button
                  onclick={() => quickTestFontSize(size)}
                  class="bg-muted hover:bg-muted-foreground/10 rounded px-3 py-1 text-sm"
                >
                  {size}px
                </button>
              {/each}
            </div>
          </div>

          <!-- Font Family Quick Tests -->
          <div>
            <h3 class="mb-2 text-sm font-semibold">Font Family</h3>
            <div class="flex flex-wrap gap-2">
              {#each ['system-ui', 'sans-serif', 'monospace'] as family}
                <button
                  onclick={() => quickTestFontFamily(family)}
                  class="bg-muted hover:bg-muted-foreground/10 rounded px-3 py-1 text-sm"
                >
                  {family}
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <!-- Live Preview -->
      <div class="card bg-card border-border rounded-lg border p-6">
        <h2 class="mb-4 text-xl font-semibold">Live Preview</h2>

        <div class="space-y-4">
          <div>
            <h3 class="mb-2 font-semibold">Heading Text</h3>
            <p class="text-muted-foreground">
              This is a preview of how your font settings affect the text. The quick brown fox jumps
              over the lazy dog.
            </p>
          </div>

          <div>
            <h3 class="mb-2 font-semibold">Code Sample</h3>
            <pre class="bg-muted overflow-x-auto rounded p-3 text-sm"><code
                >const greeting = "Hello, World!";
console.log(greeting);</code
              ></pre>
          </div>

          <div>
            <h3 class="mb-2 font-semibold">Regular Text</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="space-y-6">
      <!-- Instructions -->
      <div class="card bg-card border-border rounded-lg border p-6">
        <h2 class="mb-3 text-lg font-semibold">Instructions</h2>
        <ol class="text-muted-foreground list-inside list-decimal space-y-2 text-sm">
          <li>Check current CSS variables above</li>
          <li>Test individual functions to apply specific settings</li>
          <li>Use quick tests to try different values</li>
          <li>Watch live preview update in real-time</li>
          <li>Check activity log for action history</li>
        </ol>
      </div>

      <!-- Current Settings -->
      <div class="card bg-card border-border rounded-lg border p-6">
        <h2 class="mb-3 text-lg font-semibold">Current Settings</h2>
        <div class="space-y-2 font-mono text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Font Size:</span>
            <span>{settings.fontSize}px</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Font Family:</span>
            <span>{settings.fontFamily}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Sidebar Width:</span>
            <span>{settings.sidebarWidth}px</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Message Density:</span>
            <span>{settings.messageDensity}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Theme ID:</span>
            <span>{settings.themeId || 'default'}</span>
          </div>
        </div>
      </div>

      <!-- Statistics -->
      <div class="card bg-card border-border rounded-lg border p-6">
        <h2 class="mb-3 text-lg font-semibold">Statistics</h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Total Actions:</span>
            <span class="font-semibold">{testCount}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Last Action:</span>
            <span class="font-semibold">{lastAction || 'none'}</span>
          </div>
        </div>
      </div>

      <!-- Activity Log -->
      <div class="card bg-card border-border rounded-lg border p-6">
        <h2 class="mb-3 flex items-center gap-2 text-lg font-semibold">
          <RotateCcw class="h-4 w-4" />
          Activity Log
        </h2>
        <div class="max-h-64 space-y-1 overflow-y-auto font-mono text-xs">
          {#each actionLog as log}
            <div class="text-muted-foreground">{log}</div>
          {:else}
            <div class="text-muted-foreground italic">No activity yet</div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
