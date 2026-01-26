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
  }>({
    localStorage: false,
    storeSettings: false,
    cssVariables: false,
    themeApplied: false,
    allSettings: false
  });

  // Current settings snapshots
  let localStorageSnapshot = $state<Record<string, unknown> | null>(null);
  let storeSnapshot = $state<Record<string, unknown> | null>(null);
  let cssVariablesSnapshot = $state<Record<string, string>>({});

  // Test history
  let testHistory = $state<Array<{
    timestamp: string;
    action: string;
    details: Record<string, unknown>;
  }>>([]);

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
        storageAccess
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
      storeSnapshot = currentSettings;

      if (localStorageSnapshot) {
        const match = JSON.stringify(currentSettings) === JSON.stringify(localStorageSnapshot);
        verificationResults.storeSettings = match;
        if (match) testsPassed++; else testsFailed++;
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
      const fontFamilyMatch = cssVariablesSnapshot['--font-family-base'].includes(settings.fontFamily === 'system-ui' ? 'system-ui' : settings.fontFamily === 'sans-serif' ? 'Inter' : 'Fira Code');
      const sidebarWidthMatch = cssVariablesSnapshot['--sidebar-width'] === `${settings.sidebarWidth}px`;

      verificationResults.cssVariables = fontSizeMatch && fontFamilyMatch && sidebarWidthMatch;
      if (verificationResults.cssVariables) testsPassed++; else testsFailed++;
    } catch (error) {
      verificationResults.cssVariables = false;
      testsFailed++;
    }

    // Test 4: Check theme is applied
    try {
      const currentTheme = getCurrentTheme();
      const themeApplied = currentTheme !== null;
      verificationResults.themeApplied = themeApplied;
      if (themeApplied) testsPassed++; else testsFailed++;
    } catch (error) {
      verificationResults.themeApplied = false;
      testsFailed++;
    }

    // Test 5: Check all settings are present and valid
    try {
      const settings = appearance.currentSettings;
      const hasFontSize = settings.fontSize && ['12', '13', '14', '15', '16', '17', '18', '19', '20'].includes(settings.fontSize);
      const hasFontFamily = settings.fontFamily && ['system-ui', 'sans-serif', 'monospace'].includes(settings.fontFamily);
      const hasSidebarWidth = settings.sidebarWidth && !isNaN(parseInt(settings.sidebarWidth));
      const hasMessageDensity = settings.messageDensity && ['compact', 'comfortable', 'spacious'].includes(settings.messageDensity);
      const hasThemeId = settings.themeId !== undefined; // Can be null or string

      verificationResults.allSettings = hasFontSize && hasFontFamily && hasSidebarWidth && hasMessageDensity && hasThemeId;
      if (verificationResults.allSettings) testsPassed++; else testsFailed++;
    } catch (error) {
      verificationResults.allSettings = false;
      testsFailed++;
    }

    // Record verification results
    addTestHistory('Verification Run', {
      passed: testsPassed,
      failed: testsFailed,
      results: verificationResults
    });
  }

  function addTestHistory(action: string, details: Record<string, unknown>) {
    testHistory = [
      {
        timestamp: new Date().toISOString(),
        action,
        details
      },
      ...testHistory
    ].slice(0, 50); // Keep last 50 entries
  }

  function setCustomSettings() {
    if (!browser || storageAccess !== 'available') return;

    appearance.updateSettings({
      fontSize: '18',
      fontFamily: 'monospace',
      sidebarWidth: '320',
      messageDensity: 'spacious',
      themeId: null
    });

    addTestHistory('Settings Changed', {
      newSettings: appearance.currentSettings,
      action: 'setCustomSettings'
    });

    // Re-run verification
    setTimeout(() => runVerification(), 100);
  }

  function setDefaultSettings() {
    if (!browser || storageAccess !== 'available') return;

    appearance.updateSettings({
      fontSize: '16',
      fontFamily: 'system-ui',
      sidebarWidth: '280',
      messageDensity: 'comfortable',
      themeId: null
    });

    addTestHistory('Settings Changed', {
      newSettings: appearance.currentSettings,
      action: 'setDefaultSettings'
    });

    // Re-run verification
    setTimeout(() => runVerification(), 100);
  }

  function resetToDefaults() {
    if (!browser || storageAccess !== 'available') return;

    appearance.resetToDefaults();

    addTestHistory('Settings Reset', {
      newSettings: appearance.currentSettings,
      action: 'resetToDefaults'
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
      action: 'resetRefreshCount'
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
      action: 'resetAllTestData'
    });

    // Re-run verification
    setTimeout(() => runVerification(), 100);
  }

  const testSteps = [
    {
      title: '1. Initial Setup',
      description: 'Set custom settings and refresh the page',
      action: 'setCustomSettings',
      expected: 'Settings should persist after refresh'
    },
    {
      title: '2. First Refresh Test',
      description: 'Click "Refresh Page" button',
      action: 'refreshPage',
      expected: 'All verification tests should pass (green checks)'
    },
    {
      title: '3. Change Settings',
      description: 'Set different settings and refresh again',
      action: 'setDefaultSettings',
      expected: 'New settings should persist after refresh'
    },
    {
      title: '4. Second Refresh Test',
      description: 'Click "Refresh Page" button again',
      action: 'refreshPage',
      expected: 'Updated settings should be preserved'
    },
    {
      title: '5. Reset Test',
      description: 'Reset to defaults and refresh',
      action: 'resetToDefaults',
      expected: 'Default settings should persist after refresh'
    },
    {
      title: '6. Final Verification',
      description: 'Final refresh to confirm persistence',
      action: 'refreshPage',
      expected: 'Default settings should be active'
    },
    {
      title: '7. Browser Session Test',
      description: 'Close browser completely, reopen, and navigate here',
      action: 'browserRestart',
      expected: 'Settings should persist across browser sessions'
    }
  ];

  const verificationTests = [
    {
      key: 'localStorage',
      label: 'localStorage Settings',
      description: 'Settings are stored in localStorage',
      critical: true
    },
    {
      key: 'storeSettings',
      label: 'Store State',
      description: 'Appearance store matches localStorage',
      critical: true
    },
    {
      key: 'cssVariables',
      label: 'CSS Variables Applied',
      description: 'Font size, family, and width applied to CSS',
      critical: true
    },
    {
      key: 'themeApplied',
      label: 'Theme Applied',
      description: 'Current theme is active',
      critical: false
    },
    {
      key: 'allSettings',
      label: 'All Settings Present',
      description: 'All required settings are valid',
      critical: true
    }
  ];
</script>

<svelte:head>
  <title>Persistence Test - Appearance Settings</title>
  <meta name="description" content="Test appearance settings persistence across page refreshes and browser sessions" />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold mb-2 flex items-center gap-2">
      <RefreshCw class="w-8 h-8" />
      Settings Persistence Test
    </h1>
    <p class="text-muted-foreground">
      Verify that appearance settings persist across page refreshes and browser sessions
    </p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Left Column: Instructions and Status -->
    <div class="space-y-6">
      <!-- Storage Status -->
      <div class="bg-card border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5" />
          Storage Status
        </h2>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Browser Storage:</span>
            <span class="text-sm">
              {#if storageAccess === 'available'}
                <span class="text-green-600 dark:text-green-400 font-medium">Available</span>
              {:else if storageAccess === 'unavailable'}
                <span class="text-red-600 dark:text-red-400 font-medium">Unavailable</span>
              {:else}
                <span class="text-yellow-600 dark:text-yellow-400 font-medium">Unknown</span>
              {/if}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Refresh Count:</span>
            <span class="text-sm font-mono">{refreshCount}</span>
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
      <div class="bg-card border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">Test Status</h2>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Tests Passed:</span>
            <span class="text-sm font-bold text-green-600 dark:text-green-400">{testsPassed}/5</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Tests Failed:</span>
            <span class="text-sm font-bold text-red-600 dark:text-red-400">{testsFailed}/5</span>
          </div>
          <div class="pt-3 border-t">
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
      <div class="bg-card border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
        <div class="space-y-2">
          <button
            onclick={setCustomSettings}
            disabled={storageAccess !== 'available'}
            class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Set Custom Settings (18px, Mono, 320px, Spacious)
          </button>
          <button
            onclick={setDefaultSettings}
            disabled={storageAccess !== 'available'}
            class="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Set Default Settings (16px, System, 280px, Comfortable)
          </button>
          <button
            onclick={resetToDefaults}
            disabled={storageAccess !== 'available'}
            class="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw class="w-4 h-4" />
            Reset to Defaults
          </button>
          <button
            onclick={refreshPage}
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
          >
            <RefreshCw class="w-4 h-4" />
            Refresh Page
          </button>
          <div class="pt-2 border-t space-y-2">
            <button
              onclick={clearTestHistory}
              class="w-full px-3 py-1.5 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 text-xs font-medium"
            >
              Clear Test History
            </button>
            <button
              onclick={resetRefreshCount}
              class="w-full px-3 py-1.5 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 text-xs font-medium"
            >
              Reset Refresh Count
            </button>
            <button
              onclick={resetAllTestData}
              class="w-full px-3 py-1.5 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 text-xs font-medium"
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
      <div class="bg-card border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">Verification Results</h2>
        <div class="space-y-3">
          {#each verificationTests as test}
            <div class="p-3 rounded-md border {verificationResults[test.key] ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}">
              <div class="flex items-start gap-3">
                <div class="mt-0.5">
                  {#if verificationResults[test.key]}
                    <Check class="w-5 h-5 text-green-600 dark:text-green-400" />
                  {:else}
                    <X class="w-5 h-5 text-red-600 dark:text-red-400" />
                  {/if}
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-sm">{test.label}</span>
                    {#if test.critical}
                      <span class="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded">Critical</span>
                    {/if}
                  </div>
                  <p class="text-xs text-muted-foreground mt-0.5">{test.description}</p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Current Settings -->
      <div class="bg-card border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">Current Settings</h2>
        <div class="space-y-3 text-sm">
          <div class="flex items-center justify-between py-2 border-b">
            <span class="font-medium">Font Size:</span>
            <span class="font-mono bg-muted px-2 py-1 rounded">{appearance.currentSettings.fontSize}px</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b">
            <span class="font-medium">Font Family:</span>
            <span class="font-mono bg-muted px-2 py-1 rounded">{appearance.currentSettings.fontFamily}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b">
            <span class="font-medium">Sidebar Width:</span>
            <span class="font-mono bg-muted px-2 py-1 rounded">{appearance.currentSettings.sidebarWidth}px</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b">
            <span class="font-medium">Message Density:</span>
            <span class="font-mono bg-muted px-2 py-1 rounded">{appearance.currentSettings.messageDensity}</span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="font-medium">Theme ID:</span>
            <span class="font-mono bg-muted px-2 py-1 rounded">{appearance.currentSettings.themeId || 'null (default)'}</span>
          </div>
        </div>
      </div>

      <!-- CSS Variables -->
      <div class="bg-card border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">CSS Variables</h2>
        <div class="space-y-3 text-sm">
          <div class="p-3 bg-muted rounded-md">
            <div class="font-mono text-xs break-all">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium">--font-size-base:</span>
                <span>{cssVariablesSnapshot['--font-size-base'] || 'not set'}</span>
              </div>
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium">--font-family-base:</span>
                <span class="text-xs truncate ml-2">{cssVariablesSnapshot['--font-family-base'] || 'not set'}</span>
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
      <div class="bg-card border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">Test Steps</h2>
        <div class="space-y-4">
          {#each testSteps as step, index}
            <div class="border-l-2 border-primary pl-4 pb-4">
              <div class="flex items-start gap-2">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <div>
                  <h3 class="font-medium text-sm">{step.title}</h3>
                  <p class="text-xs text-muted-foreground mt-1">{step.description}</p>
                  <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Expected: {step.expected}
                  </p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Test History -->
      <div class="bg-card border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">Test History</h2>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          {#if testHistory.length === 0}
            <p class="text-sm text-muted-foreground text-center py-4">No test history yet</p>
          {:else}
            {#each testHistory as entry}
              <div class="p-3 bg-muted rounded-md text-xs">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium">{entry.action}</span>
                  <span class="text-muted-foreground">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
                <pre class="text-xs overflow-x-auto mt-1">{JSON.stringify(entry.details, null, 2)}</pre>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <!-- localStorage Preview -->
      <div class="bg-card border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">localStorage Preview</h2>
        <div class="space-y-2">
          {#if localStorageSnapshot}
            <pre class="text-xs bg-muted p-3 rounded-md overflow-x-auto">{JSON.stringify(localStorageSnapshot, null, 2)}</pre>
          {:else}
            <p class="text-sm text-muted-foreground text-center py-4">No localStorage data</p>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Live Preview Section -->
  <div class="mt-8 bg-card border rounded-lg p-6">
    <h2 class="text-lg font-semibold mb-4">Live Preview</h2>
    <p class="text-sm text-muted-foreground mb-4">
      This text demonstrates your current font size and family settings. Changes should be visible immediately.
    </p>
    <div class="p-4 bg-muted rounded-md" style="font-size: var(--font-size-base); font-family: var(--font-family-base);">
      <p class="mb-2">
        This is a sample paragraph with the current appearance settings applied.
      </p>
      <p class="mb-2">
        Font size: <strong>{appearance.currentSettings.fontSize}px</strong> |
        Font family: <strong>{appearance.currentSettings.fontFamily}</strong> |
        Sidebar width: <strong>{appearance.currentSettings.sidebarWidth}px</strong>
      </p>
      <p class="text-sm text-muted-foreground">
        Refresh the page and these settings should remain the same.
      </p>
    </div>
  </div>

  <!-- Important Notes -->
  <div class="mt-8 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
    <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">
      <AlertCircle class="w-5 h-5 text-blue-600 dark:text-blue-400" />
      Important Notes
    </h2>
    <ul class="space-y-2 text-sm">
      <li class="flex items-start gap-2">
        <span class="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
        <span><strong>Page Refresh Test:</strong> Set custom settings, refresh the page, and verify all tests pass.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
        <span><strong>Browser Session Test:</strong> Close your browser completely, reopen it, and navigate back to this page. Settings should persist.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
        <span><strong>Storage Access:</strong> If storage is unavailable, persistence testing cannot work. Check browser settings.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
        <span><strong>Backend Sync:</strong> Settings are saved to localStorage immediately, then synced to backend in the background (1 second debounce).</span>
      </li>
    </ul>
  </div>
</div>
