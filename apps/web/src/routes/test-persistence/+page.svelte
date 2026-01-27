<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { appearance } from '$lib/stores/appearance.store';
  import { getAppearanceVariables } from '$lib/utils/apply-settings';
  import { getCurrentTheme, isThemeApplied } from '$lib/themes/theme-manager';
  import { RefreshCw, RotateCcw, Check, X, AlertCircle, Info } from '@lucide/svelte';

  // Track if this is the first load
  let isFirstLoad = $state(true);
  let storageAccess = $state<'available' | 'unavailable' | 'unknown'>('unknown');

  // Test counters
  let refreshCount = $state(0);
  let testsPassed = $state(0);
  let testsFailed = $state(0);

  // Verification results
  let verificationResults = $state<{
    localStorage: boolean;
    storeSettings: boolean;
    cssVariables: boolean;
    themeApplied: boolean;
    allSettings: boolean;
    [key: string]: boolean;
  }>({
    localStorage: false,
    storeSettings: false,
    cssVariables: false,
    themeApplied: false,
    allSettings: false,
  });

  // Current settings snapshots
  let localStorageSnapshot = $state<Record<string, unknown> | null>(null);
  let storeSnapshot = $state<Record<string, unknown> | null>(null);
  let cssVariablesSnapshot = $state<Record<string, string>>({});

  // Test history
  let testHistory = $state<
    Array<{
      timestamp: string;
      action: string;
      details: Record<string, unknown>;
    }>
  >([]);

  // Load refresh count from sessionStorage (persists across page refreshes)
  onMount(() => {
    if (!browser) {
      storageAccess = 'unavailable';
      return;
    }

    // Check if localStorage is available
    try {
      localStorage.setItem('test-access', 'test');
      localStorage.removeItem('test-access');
      storageAccess = 'available';

      // Load refresh count from sessionStorage
      const savedRefreshCount = sessionStorage.getItem('persistence-test-refresh-count');
      if (savedRefreshCount) {
        refreshCount = parseInt(savedRefreshCount, 10);
        isFirstLoad = refreshCount === 0;
      }
      refreshCount++;
      sessionStorage.setItem('persistence-test-refresh-count', refreshCount.toString());

      // Run verification tests
      runVerification();

      // Record test history
      addTestHistory('Page Load', {
        refreshCount,
        isFirstLoad,
        storageAccess,
      });
    } catch (error) {
      storageAccess = 'unavailable';
      console.error('localStorage is not available:', error);
    }
  });

  function runVerification() {
    testsPassed = 0;
    testsFailed = 0;

    // Test 1: Check localStorage has settings
    try {
      const stored = localStorage.getItem('appearance-settings');
      if (stored) {
        localStorageSnapshot = JSON.parse(stored);
        verificationResults.localStorage = true;
        testsPassed++;
      } else {
        verificationResults.localStorage = false;
        testsFailed++;
      }
    } catch (error) {
      verificationResults.localStorage = false;
      testsFailed++;
    }

    // Test 2: Check store settings match localStorage
    try {
      const currentSettings = appearance.currentSettings;
      storeSnapshot = currentSettings as unknown as Record<string, unknown>;

      if (localStorageSnapshot) {
        const match = JSON.stringify(currentSettings) === JSON.stringify(localStorageSnapshot);
        verificationResults.storeSettings = match;
        if (match) testsPassed++;
        else testsFailed++;
      } else {
        verificationResults.storeSettings = false;
        testsFailed++;
      }
    } catch (error) {
      verificationResults.storeSettings = false;
      testsFailed++;
    }

    // Test 3: Check CSS variables are applied
    try {
      cssVariablesSnapshot = getAppearanceVariables();

      const settings = appearance.currentSettings;
      const fontSizeMatch = cssVariablesSnapshot['--font-size-base'] === `${settings.fontSize}px`;
      const fontFamilyMatch = cssVariablesSnapshot['--font-family-base'].includes(
        settings.fontFamily === 'system-ui'
          ? 'system-ui'
          : settings.fontFamily === 'sans-serif'
            ? 'Inter'
            : 'Fira Code'
      );
      const sidebarWidthMatch =
        cssVariablesSnapshot['--sidebar-width'] === `${settings.sidebarWidth}px`;

      verificationResults.cssVariables = fontSizeMatch && fontFamilyMatch && sidebarWidthMatch;
      if (verificationResults.cssVariables) testsPassed++;
      else testsFailed++;
    } catch (error) {
      verificationResults.cssVariables = false;
      testsFailed++;
    }

    // Test 4: Check theme is applied
    try {
      const currentTheme = getCurrentTheme();
      const themeApplied = currentTheme !== null;
      verificationResults.themeApplied = themeApplied;
      if (themeApplied) testsPassed++;
      else testsFailed++;
    } catch (error) {
      verificationResults.themeApplied = false;
      testsFailed++;
    }

    // Test 5: Check all settings are present and valid
    try {
      const settings = appearance.currentSettings;
      const hasFontSize =
        settings.fontSize &&
        ['12', '13', '14', '15', '16', '17', '18', '19', '20'].includes(settings.fontSize);
      const hasFontFamily =
        settings.fontFamily &&
        ['system-ui', 'sans-serif', 'monospace'].includes(settings.fontFamily);
      const hasSidebarWidth =
        typeof settings.sidebarWidth === 'number' && !isNaN(settings.sidebarWidth);
      const hasMessageDensity =
        settings.messageDensity &&
        ['compact', 'comfortable', 'spacious'].includes(settings.messageDensity);
      const hasThemeId = settings.themeId !== undefined; // Can be null or string

      verificationResults.allSettings =
        hasFontSize && hasFontFamily && hasSidebarWidth && hasMessageDensity && hasThemeId;
      if (verificationResults.allSettings) testsPassed++;
      else testsFailed++;
    } catch (error) {
      verificationResults.allSettings = false;
      testsFailed++;
    }

    // Record verification results
    addTestHistory('Verification Run', {
      passed: testsPassed,
      failed: testsFailed,
      results: verificationResults,
    });
  }

  function addTestHistory(action: string, details: Record<string, unknown>) {
    testHistory = [
      {
        timestamp: new Date().toISOString(),
        action,
        details,
      },
      ...testHistory,
    ].slice(0, 50); // Keep last 50 entries
  }

  function setCustomSettings() {
    if (!browser || storageAccess !== 'available') return;

    appearance.updateSettings({
      fontSize: '18',
      fontFamily: 'monospace',
      sidebarWidth: 320,
      messageDensity: 'spacious',
      themeId: 'light',
    });

    addTestHistory('Settings Changed', {
      newSettings: appearance.currentSettings,
      action: 'setCustomSettings',
    });

    // Re-run verification
    setTimeout(() => runVerification(), 100);
  }

  function setDefaultSettings() {
    if (!browser || storageAccess !== 'available') return;

    appearance.updateSettings({
      fontSize: '16',
      fontFamily: 'system-ui',
      sidebarWidth: 280,
      messageDensity: 'comfortable',
      themeId: 'light',
    });

    addTestHistory('Settings Changed', {
      newSettings: appearance.currentSettings,
      action: 'setDefaultSettings',
    });

    // Re-run verification
    setTimeout(() => runVerification(), 100);
  }

  function resetToDefaults() {
    if (!browser || storageAccess !== 'available') return;

    appearance.resetToDefaults();

    addTestHistory('Settings Reset', {
      newSettings: appearance.currentSettings,
      action: 'resetToDefaults',
    });

    // Re-run verification
    setTimeout(() => runVerification(), 100);
  }

  function refreshPage() {
    if (!browser) return;
    window.location.reload();
  }

  function clearTestHistory() {
    testHistory = [];
  }

  function resetRefreshCount() {
    if (!browser) return;
    sessionStorage.removeItem('persistence-test-refresh-count');
    refreshCount = 0;
    isFirstLoad = true;

    addTestHistory('Refresh Count Reset', {
      refreshCount: 0,
      action: 'resetRefreshCount',
    });
  }

  function resetAllTestData() {
    if (!browser) return;

    // Clear test history from memory
    testHistory = [];

    // Reset refresh count
    sessionStorage.removeItem('persistence-test-refresh-count');
    refreshCount = 0;
    isFirstLoad = true;

    // Reset settings to defaults
    appearance.resetToDefaults();

    addTestHistory('All Test Data Reset', {
      action: 'resetAllTestData',
    });

    // Re-run verification
    setTimeout(() => runVerification(), 100);
  }

  const testSteps = [
    {
      title: '1. Initial Setup',
      description: 'Set custom settings and refresh the page',
      action: 'setCustomSettings',
      expected: 'Settings should persist after refresh',
    },
    {
      title: '2. First Refresh Test',
      description: 'Click "Refresh Page" button',
      action: 'refreshPage',
      expected: 'All verification tests should pass (green checks)',
    },
    {
      title: '3. Change Settings',
      description: 'Set different settings and refresh again',
      action: 'setDefaultSettings',
      expected: 'New settings should persist after refresh',
    },
    {
      title: '4. Second Refresh Test',
      description: 'Click "Refresh Page" button again',
      action: 'refreshPage',
      expected: 'Updated settings should be preserved',
    },
    {
      title: '5. Reset Test',
      description: 'Reset to defaults and refresh',
      action: 'resetToDefaults',
      expected: 'Default settings should persist after refresh',
    },
    {
      title: '6. Final Verification',
      description: 'Final refresh to confirm persistence',
      action: 'refreshPage',
      expected: 'Default settings should be active',
    },
    {
      title: '7. Browser Session Test',
      description: 'Close browser completely, reopen, and navigate here',
      action: 'browserRestart',
      expected: 'Settings should persist across browser sessions',
    },
  ];

  const verificationTests = [
    {
      key: 'localStorage',
      label: 'localStorage Settings',
      description: 'Settings are stored in localStorage',
      critical: true,
    },
    {
      key: 'storeSettings',
      label: 'Store State',
      description: 'Appearance store matches localStorage',
      critical: true,
    },
    {
      key: 'cssVariables',
      label: 'CSS Variables Applied',
      description: 'Font size, family, and width applied to CSS',
      critical: true,
    },
    {
      key: 'themeApplied',
      label: 'Theme Applied',
      description: 'Current theme is active',
      critical: false,
    },
    {
      key: 'allSettings',
      label: 'All Settings Present',
      description: 'All required settings are valid',
      critical: true,
    },
  ];
</script>

<svelte:head>
  <title>Persistence Test - Appearance Settings</title>
  <meta
    name="description"
    content="Test appearance settings persistence across page refreshes and browser sessions"
  />
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="mb-2 flex items-center gap-2 text-3xl font-bold">
      <RefreshCw class="h-8 w-8" />
      Settings Persistence Test
    </h1>
    <p class="text-muted-foreground">
      Verify that appearance settings persist across page refreshes and browser sessions
    </p>
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Left Column: Instructions and Status -->
    <div class="space-y-6">
      <!-- Storage Status -->
      <div class="bg-card rounded-lg border p-6">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Info class="h-5 w-5" />
          Storage Status
        </h2>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Browser Storage:</span>
            <span class="text-sm">
              {#if storageAccess === 'available'}
                <span class="font-medium text-green-600 dark:text-green-400">Available</span>
              {:else if storageAccess === 'unavailable'}
                <span class="font-medium text-red-600 dark:text-red-400">Unavailable</span>
              {:else}
                <span class="font-medium text-yellow-600 dark:text-yellow-400">Unknown</span>
              {/if}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Refresh Count:</span>
            <span class="font-mono text-sm">{refreshCount}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">First Load:</span>
            <span class="text-sm">
              {#if isFirstLoad}
                <span class="text-green-600 dark:text-green-400">Yes</span>
              {:else}
                <span class="text-blue-600 dark:text-blue-400">No (refresh #{refreshCount})</span>
              {/if}
            </span>
          </div>
        </div>
      </div>

      <!-- Test Status -->
      <div class="bg-card rounded-lg border p-6">
        <h2 class="mb-4 text-lg font-semibold">Test Status</h2>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Tests Passed:</span>
            <span class="text-sm font-bold text-green-600 dark:text-green-400">{testsPassed}/5</span
            >
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Tests Failed:</span>
            <span class="text-sm font-bold text-red-600 dark:text-red-400">{testsFailed}/5</span>
          </div>
          <div class="border-t pt-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Overall Result:</span>
              <span class="text-sm font-bold">
                {#if testsFailed === 0 && testsPassed === 5}
                  <span class="text-green-600 dark:text-green-400">PASS</span>
                {:else if testsFailed > 0}
                  <span class="text-red-600 dark:text-red-400">FAIL</span>
                {:else}
                  <span class="text-yellow-600 dark:text-yellow-400">RUNNING...</span>
                {/if}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-card rounded-lg border p-6">
        <h2 class="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div class="space-y-2">
          <button
            onclick={setCustomSettings}
            disabled={storageAccess !== 'available'}
            class="bg-primary text-primary-foreground w-full rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Set Custom Settings (18px, Mono, 320px, Spacious)
          </button>
          <button
            onclick={setDefaultSettings}
            disabled={storageAccess !== 'available'}
            class="bg-secondary text-secondary-foreground w-full rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Set Default Settings (16px, System, 280px, Comfortable)
          </button>
          <button
            onclick={resetToDefaults}
            disabled={storageAccess !== 'available'}
            class="bg-destructive text-destructive-foreground flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw class="h-4 w-4" />
            Reset to Defaults
          </button>
          <button
            onclick={refreshPage}
            class="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RefreshCw class="h-4 w-4" />
            Refresh Page
          </button>
          <div class="space-y-2 border-t pt-2">
            <button
              onclick={clearTestHistory}
              class="bg-muted text-muted-foreground hover:bg-muted/80 w-full rounded-md px-3 py-1.5 text-xs font-medium"
            >
              Clear Test History
            </button>
            <button
              onclick={resetRefreshCount}
              class="bg-muted text-muted-foreground hover:bg-muted/80 w-full rounded-md px-3 py-1.5 text-xs font-medium"
            >
              Reset Refresh Count
            </button>
            <button
              onclick={resetAllTestData}
              class="bg-muted text-muted-foreground hover:bg-muted/80 w-full rounded-md px-3 py-1.5 text-xs font-medium"
            >
              Reset All Test Data
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Middle Column: Verification Results -->
    <div class="space-y-6">
      <!-- Verification Tests -->
      <div class="bg-card rounded-lg border p-6">
        <h2 class="mb-4 text-lg font-semibold">Verification Results</h2>
        <div class="space-y-3">
          {#each verificationTests as test}
            <div
              class="rounded-md border p-3 {verificationResults[test.key]
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
                : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'}"
            >
              <div class="flex items-start gap-3">
                <div class="mt-0.5">
                  {#if verificationResults[test.key]}
                    <Check class="h-5 w-5 text-green-600 dark:text-green-400" />
                  {:else}
                    <X class="h-5 w-5 text-red-600 dark:text-red-400" />
                  {/if}
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">{test.label}</span>
                    {#if test.critical}
                      <span
                        class="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        >Critical</span
                      >
                    {/if}
                  </div>
                  <p class="text-muted-foreground mt-0.5 text-xs">{test.description}</p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Current Settings -->
      <div class="bg-card rounded-lg border p-6">
        <h2 class="mb-4 text-lg font-semibold">Current Settings</h2>
        <div class="space-y-3 text-sm">
          <div class="flex items-center justify-between border-b py-2">
            <span class="font-medium">Font Size:</span>
            <span class="bg-muted rounded px-2 py-1 font-mono"
              >{appearance.currentSettings.fontSize}px</span
            >
          </div>
          <div class="flex items-center justify-between border-b py-2">
            <span class="font-medium">Font Family:</span>
            <span class="bg-muted rounded px-2 py-1 font-mono"
              >{appearance.currentSettings.fontFamily}</span
            >
          </div>
          <div class="flex items-center justify-between border-b py-2">
            <span class="font-medium">Sidebar Width:</span>
            <span class="bg-muted rounded px-2 py-1 font-mono"
              >{appearance.currentSettings.sidebarWidth}px</span
            >
          </div>
          <div class="flex items-center justify-between border-b py-2">
            <span class="font-medium">Message Density:</span>
            <span class="bg-muted rounded px-2 py-1 font-mono"
              >{appearance.currentSettings.messageDensity}</span
            >
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="font-medium">Theme ID:</span>
            <span class="bg-muted rounded px-2 py-1 font-mono"
              >{appearance.currentSettings.themeId || 'null (default)'}</span
            >
          </div>
        </div>
      </div>

      <!-- CSS Variables -->
      <div class="bg-card rounded-lg border p-6">
        <h2 class="mb-4 text-lg font-semibold">CSS Variables</h2>
        <div class="space-y-3 text-sm">
          <div class="bg-muted rounded-md p-3">
            <div class="font-mono text-xs break-all">
              <div class="mb-1 flex items-center justify-between">
                <span class="font-medium">--font-size-base:</span>
                <span>{cssVariablesSnapshot['--font-size-base'] || 'not set'}</span>
              </div>
              <div class="mb-1 flex items-center justify-between">
                <span class="font-medium">--font-family-base:</span>
                <span class="ml-2 truncate text-xs"
                  >{cssVariablesSnapshot['--font-family-base'] || 'not set'}</span
                >
              </div>
              <div class="flex items-center justify-between">
                <span class="font-medium">--sidebar-width:</span>
                <span>{cssVariablesSnapshot['--sidebar-width'] || 'not set'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Test Steps and History -->
    <div class="space-y-6">
      <!-- Test Steps -->
      <div class="bg-card rounded-lg border p-6">
        <h2 class="mb-4 text-lg font-semibold">Test Steps</h2>
        <div class="space-y-4">
          {#each testSteps as step, index}
            <div class="border-primary border-l-2 pb-4 pl-4">
              <div class="flex items-start gap-2">
                <span
                  class="bg-primary text-primary-foreground flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 class="text-sm font-medium">{step.title}</h3>
                  <p class="text-muted-foreground mt-1 text-xs">{step.description}</p>
                  <p class="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    Expected: {step.expected}
                  </p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Test History -->
      <div class="bg-card rounded-lg border p-6">
        <h2 class="mb-4 text-lg font-semibold">Test History</h2>
        <div class="max-h-96 space-y-2 overflow-y-auto">
          {#if testHistory.length === 0}
            <p class="text-muted-foreground py-4 text-center text-sm">No test history yet</p>
          {:else}
            {#each testHistory as entry}
              <div class="bg-muted rounded-md p-3 text-xs">
                <div class="mb-1 flex items-center justify-between">
                  <span class="font-medium">{entry.action}</span>
                  <span class="text-muted-foreground"
                    >{new Date(entry.timestamp).toLocaleTimeString()}</span
                  >
                </div>
                <pre class="mt-1 overflow-x-auto text-xs">{JSON.stringify(
                    entry.details,
                    null,
                    2
                  )}</pre>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <!-- localStorage Preview -->
      <div class="bg-card rounded-lg border p-6">
        <h2 class="mb-4 text-lg font-semibold">localStorage Preview</h2>
        <div class="space-y-2">
          {#if localStorageSnapshot}
            <pre class="bg-muted overflow-x-auto rounded-md p-3 text-xs">{JSON.stringify(
                localStorageSnapshot,
                null,
                2
              )}</pre>
          {:else}
            <p class="text-muted-foreground py-4 text-center text-sm">No localStorage data</p>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Live Preview Section -->
  <div class="bg-card mt-8 rounded-lg border p-6">
    <h2 class="mb-4 text-lg font-semibold">Live Preview</h2>
    <p class="text-muted-foreground mb-4 text-sm">
      This text demonstrates your current font size and family settings. Changes should be visible
      immediately.
    </p>
    <div
      class="bg-muted rounded-md p-4"
      style="font-size: var(--font-size-base); font-family: var(--font-family-base);"
    >
      <p class="mb-2">This is a sample paragraph with the current appearance settings applied.</p>
      <p class="mb-2">
        Font size: <strong>{appearance.currentSettings.fontSize}px</strong> | Font family:
        <strong>{appearance.currentSettings.fontFamily}</strong>
        | Sidebar width: <strong>{appearance.currentSettings.sidebarWidth}px</strong>
      </p>
      <p class="text-muted-foreground text-sm">
        Refresh the page and these settings should remain the same.
      </p>
    </div>
  </div>

  <!-- Important Notes -->
  <div
    class="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/20"
  >
    <h2 class="mb-3 flex items-center gap-2 text-lg font-semibold">
      <AlertCircle class="h-5 w-5 text-blue-600 dark:text-blue-400" />
      Important Notes
    </h2>
    <ul class="space-y-2 text-sm">
      <li class="flex items-start gap-2">
        <span class="mt-0.5 text-blue-600 dark:text-blue-400">•</span>
        <span
          ><strong>Page Refresh Test:</strong> Set custom settings, refresh the page, and verify all tests
          pass.</span
        >
      </li>
      <li class="flex items-start gap-2">
        <span class="mt-0.5 text-blue-600 dark:text-blue-400">•</span>
        <span
          ><strong>Browser Session Test:</strong> Close your browser completely, reopen it, and navigate
          back to this page. Settings should persist.</span
        >
      </li>
      <li class="flex items-start gap-2">
        <span class="mt-0.5 text-blue-600 dark:text-blue-400">•</span>
        <span
          ><strong>Storage Access:</strong> If storage is unavailable, persistence testing cannot work.
          Check browser settings.</span
        >
      </li>
      <li class="flex items-start gap-2">
        <span class="mt-0.5 text-blue-600 dark:text-blue-400">•</span>
        <span
          ><strong>Backend Sync:</strong> Settings are saved to localStorage immediately, then synced
          to backend in the background (1 second debounce).</span
        >
      </li>
    </ul>
  </div>
</div>
