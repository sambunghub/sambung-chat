<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import {
    DownloadIcon,
    UploadIcon,
    FileJsonIcon,
    AlertCircleIcon,
    CheckCircleIcon,
    InfoIcon,
    RotateCcwIcon,
  } from '@lucide/svelte';
  import {
    importThemeFromFile,
    importMultipleThemes,
    validateThemeImport,
    createFileInput,
  } from '$lib/utils/theme-import';
  import { downloadTheme } from '$lib/utils/theme-export';
  import { getLightTheme, getDarkTheme, getHighContrastTheme } from '$lib/themes';
  import type { ThemeImportResult } from '$lib/utils/theme-import';

  // State
  let testResults = $state<ThemeImportResult[]>([]);
  let selectedFile = $state<File | null>(null);
  let isDragging = $state(false);
  let importHistory = $state<Array<{ timestamp: string; filename: string; success: boolean }>>([]);
  let stats = $state({
    totalImports: 0,
    successfulImports: 0,
    failedImports: 0,
  });

  // Sample exported themes for testing
  let sampleExports = $state<Record<string, string>>({});

  // Initialize sample exports
  onMount(() => {
    if (browser) {
      const light = getLightTheme();
      const dark = getDarkTheme();
      const highContrast = getHighContrastTheme();

      sampleExports = {
        light: JSON.stringify(downloadTheme(light), null, 2),
        dark: JSON.stringify(downloadTheme(dark), null, 2),
        highContrast: JSON.stringify(downloadTheme(highContrast), null, 2),
      };
    }
  });

  // File input handler
  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      selectedFile = file;
      await performImport(file);
    }

    // Reset input so same file can be selected again
    input.value = '';
  }

  // Drag and drop handlers
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;

    const file = event.dataTransfer?.files[0];
    if (file) {
      selectedFile = file;
      await performImport(file);
    }
  }

  // Import function
  async function performImport(file: File) {
    const result = await importThemeFromFile(file);

    testResults = [result, ...testResults].slice(0, 10); // Keep last 10 results

    // Update history
    importHistory = [
      {
        timestamp: new Date().toISOString(),
        filename: file.name,
        success: result.success,
      },
      ...importHistory,
    ].slice(0, 20);

    // Update stats
    stats.totalImports++;
    if (result.success) {
      stats.successfulImports++;
    } else {
      stats.failedImports++;
    }
  }

  // Quick test with sample theme
  async function testWithSample(sample: 'light' | 'dark' | 'highContrast') {
    if (!browser) return;

    const jsonContent = sampleExports[sample];
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const file = new File([blob], `theme_${sample}.json`, { type: 'application/json' });

    await performImport(file);
  }

  // Test with custom JSON
  function testWithCustomJSON() {
    if (!browser) return;

    const customTheme = {
      name: 'Custom Test Theme',
      description: 'A theme created for testing import functionality',
      colors: {
        primary: '250 100% 50%',
        secondary: '250 100% 45%',
        background: '0 0% 95%',
        foreground: '250 20% 10%',
        muted: '250 20% 90%',
        mutedForeground: '250 20% 40%',
        accent: '280 100% 50%',
        accentForeground: '0 0% 100%',
        destructive: '0 100% 50%',
        destructiveForeground: '0 0% 100%',
        border: '250 20% 85%',
        input: '250 20% 85%',
        ring: '250 100% 50%',
      },
      version: '1.0',
    };

    const jsonContent = JSON.stringify(customTheme, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const file = new File([blob], 'theme_custom_test.json', { type: 'application/json' });

    performImport(file);
  }

  // Test validation errors
  function testWithInvalidJSON() {
    if (!browser) return;

    const invalidThemes = [
      {
        name: 'AB', // Too short
        colors: { primary: '210 100% 50%' },
        version: '1.0',
      },
      {
        name: 'Missing Colors',
        version: '1.0',
        // Missing colors field
      },
      {
        name: 'Invalid Color Format',
        colors: {
          primary: 'rgb(255, 0, 0)', // Invalid HSL format
          secondary: '210 100% 50%',
          background: '0 0% 100%',
          foreground: '210 20% 10%',
          muted: '210 20% 90%',
          mutedForeground: '210 20% 40%',
          accent: '210 100% 50%',
          accentForeground: '0 0% 100%',
          destructive: '0 100% 50%',
          destructiveForeground: '0 0% 100%',
          border: '210 20% 85%',
          input: '210 20% 85%',
          ring: '210 100% 50%',
          radius: '0.5',
        },
        version: '1.0',
      },
    ];

    // Test first invalid theme
    const jsonContent = JSON.stringify(invalidThemes[0], null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const file = new File([blob], 'theme_invalid.json', { type: 'application/json' });

    performImport(file);
  }

  // Reset test results
  function resetResults() {
    testResults = [];
    importHistory = [];
    stats = {
      totalImports: 0,
      successfulImports: 0,
      failedImports: 0,
    };
    selectedFile = null;
  }

  // Open file picker
  async function openFileDialog() {
    try {
      const file = await createFileInput('.json', false);
      selectedFile = file as File;
      await performImport(file as File);
    } catch (error) {
      console.error('File selection cancelled or failed:', error);
    }
  }

  // Get status badge color
  function getStatusColor(success: boolean): string {
    return success
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
</script>

<div class="container mx-auto max-w-6xl space-y-6 p-6">
  <!-- Header -->
  <div class="border-b pb-4">
    <h1 class="flex items-center gap-2 text-3xl font-bold">
      <FileJsonIcon class="h-8 w-8" />
      Theme Import Test Suite
    </h1>
    <p class="text-muted-foreground mt-2">
      Comprehensive testing for theme JSON import functionality
    </p>
  </div>

  <div class="grid gap-6 md:grid-cols-3">
    <!-- Left Column: Instructions & Actions -->
    <div class="space-y-6">
      <!-- Instructions Card -->
      <div class="card space-y-3 p-4">
        <h2 class="flex items-center gap-2 font-semibold">
          <InfoIcon class="h-5 w-5 text-blue-500" />
          Testing Instructions
        </h2>
        <ol class="list-inside list-decimal space-y-2 text-sm">
          <li>Download a sample theme JSON file</li>
          <li>Upload the JSON file via drag & drop or file picker</li>
          <li>Review validation results and error messages</li>
          <li>Test with invalid files to see error handling</li>
          <li>Verify imported data structure is correct</li>
        </ol>
      </div>

      <!-- Statistics Card -->
      <div class="card space-y-3 p-4">
        <h2 class="font-semibold">Statistics</h2>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold">{stats.totalImports}</div>
            <div class="text-muted-foreground text-xs">Total</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-green-600">{stats.successfulImports}</div>
            <div class="text-muted-foreground text-xs">Success</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-red-600">{stats.failedImports}</div>
            <div class="text-muted-foreground text-xs">Failed</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card space-y-3 p-4">
        <h2 class="font-semibold">Quick Test Actions</h2>
        <div class="space-y-2">
          <button
            class="btn btn-secondary w-full py-2 text-sm"
            onclick={() => testWithSample('light')}
          >
            <DownloadIcon class="mr-2 h-4 w-4" />
            Test Light Theme
          </button>
          <button
            class="btn btn-secondary w-full py-2 text-sm"
            onclick={() => testWithSample('dark')}
          >
            <DownloadIcon class="mr-2 h-4 w-4" />
            Test Dark Theme
          </button>
          <button
            class="btn btn-secondary w-full py-2 text-sm"
            onclick={() => testWithSample('highContrast')}
          >
            <DownloadIcon class="mr-2 h-4 w-4" />
            Test High Contrast Theme
          </button>
          <button class="btn btn-outline w-full py-2 text-sm" onclick={testWithCustomJSON}>
            <FileJsonIcon class="mr-2 h-4 w-4" />
            Test Custom Theme
          </button>
          <button class="btn btn-destructive w-full py-2 text-sm" onclick={testWithInvalidJSON}>
            <AlertCircleIcon class="mr-2 h-4 w-4" />
            Test Invalid Theme
          </button>
          <button class="btn btn-outline w-full py-2 text-sm" onclick={resetResults}>
            <RotateCcwIcon class="mr-2 h-4 w-4" />
            Reset Results
          </button>
        </div>
      </div>
    </div>

    <!-- Middle Column: File Upload -->
    <div class="space-y-6">
      <!-- File Upload Area -->
      <div class="card p-6">
        <h2 class="mb-4 flex items-center gap-2 font-semibold">
          <UploadIcon class="h-5 w-5" />
          Upload Theme JSON File
        </h2>

        <!-- Drop Zone -->
        <div
          class="rounded-lg border-2 border-dashed p-8 text-center transition-colors {isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'}"
          ondragover={handleDragOver}
          ondragleave={handleDragLeave}
          ondrop={handleDrop}
          role="button"
          tabindex="0"
        >
          <UploadIcon class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <p class="mb-2 text-lg font-medium">Drag & drop theme JSON file here</p>
          <p class="text-muted-foreground mb-4 text-sm">or</p>

          <div class="space-y-2">
            <label class="btn btn-primary cursor-pointer">
              <input type="file" accept=".json" class="hidden" onchange={handleFileSelect} />
              Browse Files
            </label>
            <button class="btn btn-outline w-full" onclick={openFileDialog}>
              Open File Picker
            </button>
          </div>

          {#if selectedFile}
            <div class="bg-muted mt-4 rounded p-3 text-sm">
              <div class="font-medium">Selected File:</div>
              <div class="text-muted-foreground">{selectedFile.name}</div>
              <div class="text-muted-foreground mt-1 text-xs">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </div>
            </div>
          {/if}
        </div>

        <!-- Validation Info -->
        <div class="bg-muted mt-4 space-y-1 rounded p-3 text-sm">
          <div class="flex items-center gap-2 font-medium">
            <InfoIcon class="h-4 w-4 text-blue-500" />
            Validation Checks
          </div>
          <ul class="text-muted-foreground list-inside list-disc space-y-1 text-xs">
            <li>File must be valid JSON format</li>
            <li>Theme name: 3-100 characters</li>
            <li>All 14 color fields required</li>
            <li>Colors in HSL format: "H S% L%"</li>
            <li>Version field required</li>
          </ul>
        </div>
      </div>

      <!-- Sample Export Downloads -->
      <div class="card space-y-3 p-4">
        <h2 class="font-semibold">Sample Theme Exports</h2>
        <p class="text-muted-foreground text-sm">
          Download these sample theme files to test import functionality
        </p>
        <div class="space-y-2">
          <button
            class="btn btn-outline w-full py-2 text-sm"
            onclick={() => downloadTheme(getLightTheme())}
          >
            <DownloadIcon class="mr-2 h-4 w-4" />
            Download Light Theme
          </button>
          <button
            class="btn btn-outline w-full py-2 text-sm"
            onclick={() => downloadTheme(getDarkTheme())}
          >
            <DownloadIcon class="mr-2 h-4 w-4" />
            Download Dark Theme
          </button>
          <button
            class="btn btn-outline w-full py-2 text-sm"
            onclick={() => downloadTheme(getHighContrastTheme())}
          >
            <DownloadIcon class="mr-2 h-4 w-4" />
            Download High Contrast Theme
          </button>
        </div>
      </div>
    </div>

    <!-- Right Column: Results -->
    <div class="space-y-6">
      <!-- Recent Results -->
      <div class="card space-y-3 p-4">
        <h2 class="flex items-center gap-2 font-semibold">
          <CheckCircleIcon class="h-5 w-5" />
          Recent Import Results
        </h2>

        {#if testResults.length === 0}
          <p class="text-muted-foreground py-8 text-center text-sm">
            No imports yet. Upload a file to see results.
          </p>
        {:else}
          <div class="max-h-96 space-y-3 overflow-y-auto">
            {#each testResults as result}
              <div
                class="rounded border p-3 {result.success
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'}"
              >
                <div class="mb-2 flex items-start justify-between">
                  <div class="flex items-center gap-2">
                    {#if result.success}
                      <CheckCircleIcon class="h-4 w-4 text-green-600" />
                    {:else}
                      <AlertCircleIcon class="h-4 w-4 text-red-600" />
                    {/if}
                    <span class="text-sm font-medium">
                      {result.filename || 'Unknown file'}
                    </span>
                  </div>
                  <span class="rounded px-2 py-1 text-xs {getStatusColor(result.success)}">
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>

                {#if result.version}
                  <div class="text-muted-foreground mb-1 text-xs">
                    Version: {result.version}
                  </div>
                {/if}

                {#if result.warnings && result.warnings.length > 0}
                  <div class="mb-1 text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ {result.warnings[0]}
                  </div>
                {/if}

                {#if !result.success && result.errors.length > 0}
                  <div class="space-y-1 text-xs text-red-600 dark:text-red-400">
                    {#each result.errors as error}
                      <div class="flex items-start gap-1">
                        <span>•</span>
                        <span>{error}</span>
                      </div>
                    {/each}
                  </div>
                {/if}

                {#if result.success && result.theme}
                  <div class="mt-2 rounded bg-black/5 p-2 text-xs dark:bg-white/5">
                    <div class="mb-1 font-medium">Imported Theme Data:</div>
                    <div>Name: {result.theme.name}</div>
                    {#if result.theme.description}
                      <div class="truncate">Description: {result.theme.description}</div>
                    {/if}
                    <div>Colors: {Object.keys(result.theme.colors).length} fields</div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Import History -->
      <div class="card space-y-3 p-4">
        <h2 class="font-semibold">Import History</h2>

        {#if importHistory.length === 0}
          <p class="text-muted-foreground py-4 text-center text-sm">No import history yet</p>
        {:else}
          <div class="max-h-64 space-y-2 overflow-y-auto text-sm">
            {#each importHistory as item}
              <div class="flex items-center justify-between border-b py-2 last:border-0">
                <div class="flex items-center gap-2">
                  {#if item.success}
                    <CheckCircleIcon class="h-4 w-4 text-green-600" />
                  {:else}
                    <AlertCircleIcon class="h-4 w-4 text-red-600" />
                  {/if}
                  <span class="max-w-[150px] truncate" title={item.filename}>
                    {item.filename}
                  </span>
                </div>
                <span class="text-muted-foreground text-xs">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- API Reference -->
  <div class="card p-6">
    <h2 class="mb-4 text-lg font-semibold">API Reference</h2>
    <div class="grid gap-6 md:grid-cols-2">
      <div>
        <h3 class="mb-2 font-medium">Main Functions</h3>
        <ul class="space-y-2 text-sm">
          <li>
            <code class="bg-muted rounded px-2 py-1 text-xs">importThemeFromFile(file: File)</code>
            <br />
            <span class="text-muted-foreground">Import a single theme file</span>
          </li>
          <li>
            <code class="bg-muted rounded px-2 py-1 text-xs"
              >importMultipleThemes(files: FileList)</code
            >
            <br />
            <span class="text-muted-foreground">Import multiple theme files</span>
          </li>
          <li>
            <code class="bg-muted rounded px-2 py-1 text-xs"
              >validateThemeImport(data: unknown)</code
            >
            <br />
            <span class="text-muted-foreground">Validate theme data without file</span>
          </li>
          <li>
            <code class="bg-muted rounded px-2 py-1 text-xs">createFileInput()</code>
            <br />
            <span class="text-muted-foreground">Open programmatic file picker</span>
          </li>
        </ul>
      </div>
      <div>
        <h3 class="mb-2 font-medium">Types</h3>
        <ul class="space-y-2 text-sm">
          <li>
            <code class="bg-muted rounded px-2 py-1 text-xs">ThemeImportResult</code>
            <br />
            <span class="text-muted-foreground"
              >Result object with success flag, theme data, and errors</span
            >
          </li>
          <li>
            <code class="bg-muted rounded px-2 py-1 text-xs">CreateThemeData</code>
            <br />
            <span class="text-muted-foreground"
              >Theme data format for ORPC createTheme endpoint</span
            >
          </li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Verification Checklist -->
  <div class="card p-6">
    <h2 class="mb-4 text-lg font-semibold">Manual Verification Checklist</h2>
    <div class="grid gap-6 md:grid-cols-2">
      <div>
        <h3 class="mb-3 font-medium">Valid Imports</h3>
        <ul class="space-y-2 text-sm">
          <li class="flex items-center gap-2">
            <input type="checkbox" class="h-4 w-4" />
            <span>Import Light theme JSON file successfully</span>
          </li>
          <li class="flex items-center gap-2">
            <input type="checkbox" class="h-4 w-4" />
            <span>Import Dark theme JSON file successfully</span>
          </li>
          <li class="flex items-center gap-2">
            <input type="checkbox" class="h-4 w-4" />
            <span>Import High Contrast theme JSON file successfully</span>
          </li>
          <li class="flex items-center gap-2">
            <input type="checkbox" class="h-4 w-4" />
            <span>Verify imported data structure matches CreateThemeData</span>
          </li>
          <li class="flex items-center gap-2">
            <input type="checkbox" class="h-4 w-4" />
            <span>Test drag & drop file upload works</span>
          </li>
          <li class="flex items-center gap-2">
            <input type="checkbox" class="h-4 w-4" />
            <span>Test file picker dialog works</span>
          </li>
        </ul>
      </div>
      <div>
        <h3 class="mb-3 font-medium">Error Handling</h3>
        <ul class="space-y-2 text-sm">
          <li class="flex items-center gap-2">
            <input type="checkbox" class="h-4 w-4" />
            <span>Reject non-JSON files with error message</span>
          </li>
          <li class="flex items-center gap-2">
            <input type="checkbox" class="h-4 w-4" />
            <span>Reject invalid JSON syntax with error</span>
          </li>
          <li class="flex items-center gap-2">
            <input type="checkbox" class="h-4 w-4" />
            <span>Reject missing required fields with errors</span>
          </li>
          <li class="flex items-center gap-2">
            <input type="checkbox" class="h-4 w-4" />
            <span>Reject invalid HSL color formats with errors</span>
          </li>
          <li class="flex items-center gap-2">
            <input type="checkbox" class="h-4 w-4" />
            <span>Handle theme name length validation</span>
          </li>
          <li class="flex items-center gap-2">
            <input type="checkbox" class="h-4 w-4" />
            <span>Verify version compatibility warnings appear</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>
