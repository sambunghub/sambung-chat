<script lang="ts">
  import { appearance } from '$lib/stores/appearance.store';
  import { onMount } from 'svelte';

  let mounted = $state(false);

  // Local state from store
  let settings = $state(appearance.currentSettings);
  let loading = $state(false);
  let syncing = $state(false);
  let error = $state<string | null>(null);

  onMount(() => {
    mounted = true;

    // Subscribe to store updates
    const unsubscribe = appearance.subscribe((state) => {
      settings = state.settings;
      loading = state.loading;
      syncing = state.syncing;
      error = state.error;
    });

    return unsubscribe;
  });

  // Test functions
  function testFontSize() {
    const sizes: Array<'12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20'> = [
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
    ];
    const currentIndex = sizes.indexOf(settings.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    appearance.updateSetting('fontSize', sizes[nextIndex]);
  }

  function testFontFamily() {
    const families: Array<'system-ui' | 'sans-serif' | 'monospace'> = [
      'system-ui',
      'sans-serif',
      'monospace',
    ];
    const currentIndex = families.indexOf(settings.fontFamily);
    const nextIndex = (currentIndex + 1) % families.length;
    appearance.updateSetting('fontFamily', families[nextIndex]);
  }

  function testDensity() {
    const densities: Array<'compact' | 'comfortable' | 'spacious'> = [
      'compact',
      'comfortable',
      'spacious',
    ];
    const currentIndex = densities.indexOf(settings.messageDensity);
    const nextIndex = (currentIndex + 1) % densities.length;
    appearance.updateSetting('messageDensity', densities[nextIndex]);
  }

  function testSidebarWidth() {
    const currentWidth = settings.sidebarWidth;
    const newWidth = currentWidth >= 400 ? 200 : currentWidth + 50;
    appearance.updateSetting('sidebarWidth', newWidth);
  }

  async function testReset() {
    await appearance.resetToDefaults();
  }
</script>

<div class="container mx-auto p-8">
  <h1 class="mb-6 text-3xl font-bold">Appearance Store Test Page</h1>

  {#if !mounted}
    <p class="text-muted-foreground">Loading...</p>
  {:else if loading}
    <p class="text-blue-500">Loading settings from backend...</p>
  {:else}
    <div class="space-y-6">
      <!-- Status Section -->
      <section class="bg-card rounded-lg border p-4">
        <h2 class="mb-4 text-xl font-semibold">Status</h2>
        <div class="space-y-2 text-sm">
          {#if syncing}
            <p class="text-yellow-600">⏳ Syncing to backend...</p>
          {/if}
          {#if error}
            <p class="text-red-600">❌ Error: {error}</p>
          {/if}
          <p class="text-green-600">✅ Store loaded successfully</p>
        </div>
      </section>

      <!-- Current Settings -->
      <section class="bg-card rounded-lg border p-4">
        <h2 class="mb-4 text-xl font-semibold">Current Settings</h2>
        <pre class="bg-muted overflow-auto rounded p-4 text-xs">{JSON.stringify(
            settings,
            null,
            2
          )}</pre>
      </section>

      <!-- Live Preview -->
      <section class="bg-card rounded-lg border p-4">
        <h2 class="mb-4 text-xl font-semibold">Live Preview</h2>
        <div
          class="bg-background rounded border p-4"
          style="font-size: {settings.fontSize}px; font-family: {settings.fontFamily}"
        >
          <p class="mb-2">
            Font Size: <strong>{settings.fontSize}px</strong>
          </p>
          <p class="mb-2">
            Font Family: <strong>{settings.fontFamily}</strong>
          </p>
          <p class="mb-2">
            Message Density: <strong>{settings.messageDensity}</strong>
          </p>
          <p>
            Sidebar Width: <strong>{settings.sidebarWidth}px</strong>
          </p>
        </div>
      </section>

      <!-- Test Controls -->
      <section class="bg-card rounded-lg border p-4">
        <h2 class="mb-4 text-xl font-semibold">Test Controls</h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            onclick={testFontSize}
            class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Cycle Font Size (current: {settings.fontSize}px)
          </button>

          <button
            onclick={testFontFamily}
            class="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Cycle Font Family (current: {settings.fontFamily})
          </button>

          <button
            onclick={testDensity}
            class="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
          >
            Cycle Density (current: {settings.messageDensity})
          </button>

          <button
            onclick={testSidebarWidth}
            class="rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            Cycle Sidebar Width (current: {settings.sidebarWidth}px)
          </button>

          <button
            onclick={testReset}
            class="col-span-full rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Reset to Defaults
          </button>
        </div>
      </section>

      <!-- LocalStorage Check -->
      <section class="bg-card rounded-lg border p-4">
        <h2 class="mb-4 text-xl font-semibold">LocalStorage</h2>
        <p class="text-muted-foreground mb-2 text-sm">
          Settings should be persisted to localStorage automatically. Refresh the page to verify
          persistence.
        </p>
        <button
          onclick={() => window.location.reload()}
          class="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          Refresh Page
        </button>
      </section>

      <!-- Instructions -->
      <section class="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
        <h2 class="mb-4 text-xl font-semibold">Testing Instructions</h2>
        <ol class="list-inside list-decimal space-y-2 text-sm">
          <li>
            Click the test buttons to change settings and verify the live preview updates
            immediately
          </li>
          <li>Verify "Syncing to backend..." message appears (debounced by 1 second)</li>
          <li>Refresh the page to verify settings persist in localStorage</li>
          <li>
            Check browser DevTools → Application → Local Storage for key "appearance-settings"
          </li>
          <li>Reset to defaults and verify all values return to their defaults</li>
        </ol>
      </section>
    </div>
  {/if}
</div>
