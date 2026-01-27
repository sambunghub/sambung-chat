<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import {
    downloadTheme,
    exportThemeToJSON,
    exportThemeToFormat,
    generateThemeFilename,
    validateThemeExport,
    type ThemeExport,
  } from '$lib/utils/theme-export';
  import {
    importThemeFromFile,
    validateThemeImport,
    type ThemeImportResult,
  } from '$lib/utils/theme-import';
  import { getLightTheme, getDarkTheme, getHighContrastTheme, type Theme } from '$lib/themes';
  import {
    Download,
    Upload,
    CheckCircle2,
    XCircle,
    FileText,
    RefreshCw,
    TestTube,
    CheckCircle,
    AlertCircle,
  } from '@lucide/svelte';

  // Test state
  let tests = $state<
    Array<{
      id: string;
      name: string;
      status: 'pending' | 'running' | 'passed' | 'failed';
      result?: string;
      error?: string;
      duration?: number;
    }>
  >([]);

  let testSummary = $state({
    total: 0,
    passed: 0,
    failed: 0,
    running: 0,
    pending: 0,
  });

  let isRunning = $state(false);
  let testLog = $state<string[]>([]);

  // Custom themes for testing
  const customThemes: Theme[] = [
    {
      id: 'test-purple-1',
      name: 'Purple Dream',
      description: 'A custom purple theme for testing',
      colors: {
        primary: '250 100% 65%',
        secondary: '250 50% 55%',
        background: '250 20% 98%',
        foreground: '250 10% 15%',
        muted: '250 20% 90%',
        mutedForeground: '250 20% 40%',
        accent: '280 100% 65%',
        accentForeground: '0 0% 100%',
        destructive: '0 100% 50%',
        destructiveForeground: '0 0% 100%',
        border: '250 20% 85%',
        input: '250 20% 85%',
        ring: '250 100% 65%',
        radius: '0.5rem',
      },
      isBuiltIn: false,
      userId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'test-ocean-2',
      name: 'Ocean Blue',
      description: 'Calm ocean blue theme',
      colors: {
        primary: '200 100% 50%',
        secondary: '200 80% 45%',
        background: '200 10% 96%',
        foreground: '200 20% 10%',
        muted: '200 20% 92%',
        mutedForeground: '200 20% 35%',
        accent: '180 100% 50%',
        accentForeground: '0 0% 100%',
        destructive: '0 100% 50%',
        destructiveForeground: '0 0% 100%',
        border: '200 20% 88%',
        input: '200 20% 88%',
        ring: '200 100% 50%',
        radius: '0.5rem',
      },
      isBuiltIn: false,
      userId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'test-forest-3',
      name: 'Forest Green',
      description: 'Natural forest green theme',
      colors: {
        primary: '140 60% 45%',
        secondary: '140 50% 40%',
        background: '140 10% 96%',
        foreground: '140 10% 10%',
        muted: '140 20% 90%',
        mutedForeground: '140 20% 30%',
        accent: '160 80% 45%',
        accentForeground: '0 0% 100%',
        destructive: '0 100% 50%',
        destructiveForeground: '0 0% 100%',
        border: '140 20% 85%',
        input: '140 20% 85%',
        ring: '140 60% 45%',
        radius: '0.5rem',
      },
      isBuiltIn: false,
      userId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // All test themes (built-in + custom)
  const allTestThemes = [getLightTheme(), getDarkTheme(), getHighContrastTheme(), ...customThemes];

  /**
   * Add log entry
   */
  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    testLog = [`[${timestamp}] ${message}`, ...testLog].slice(0, 100);
  }

  /**
   * Initialize test suite
   */
  function initializeTests() {
    tests = [
      {
        id: 'export-builtin-light',
        name: 'Export Light Theme',
        status: 'pending',
      },
      {
        id: 'export-builtin-dark',
        name: 'Export Dark Theme',
        status: 'pending',
      },
      {
        id: 'export-builtin-high-contrast',
        name: 'Export High Contrast Theme',
        status: 'pending',
      },
      {
        id: 'export-custom-purple',
        name: 'Export Custom Purple Theme',
        status: 'pending',
      },
      {
        id: 'export-custom-ocean',
        name: 'Export Custom Ocean Theme',
        status: 'pending',
      },
      {
        id: 'export-custom-forest',
        name: 'Export Custom Forest Theme',
        status: 'pending',
      },
      {
        id: 'validate-export-format',
        name: 'Validate Export Format',
        status: 'pending',
      },
      {
        id: 'validate-json-structure',
        name: 'Validate JSON Structure',
        status: 'pending',
      },
      {
        id: 'test-filename-generation',
        name: 'Test Filename Generation',
        status: 'pending',
      },
      {
        id: 'import-builtin-light',
        name: 'Import Light Theme',
        status: 'pending',
      },
      {
        id: 'import-builtin-dark',
        name: 'Import Dark Theme',
        status: 'pending',
      },
      {
        id: 'import-builtin-high-contrast',
        name: 'Import High Contrast Theme',
        status: 'pending',
      },
      {
        id: 'import-custom-purple',
        name: 'Import Custom Purple Theme',
        status: 'pending',
      },
      {
        id: 'roundtrip-light',
        name: 'Round-trip Test: Light Theme',
        status: 'pending',
      },
      {
        id: 'roundtrip-dark',
        name: 'Round-trip Test: Dark Theme',
        status: 'pending',
      },
      {
        id: 'roundtrip-custom',
        name: 'Round-trip Test: Custom Theme',
        status: 'pending',
      },
      {
        id: 'validate-hsl-format',
        name: 'Validate HSL Color Format',
        status: 'pending',
      },
      {
        id: 'test-invalid-json',
        name: 'Test Invalid JSON Error',
        status: 'pending',
      },
      {
        id: 'test-missing-fields',
        name: 'Test Missing Fields Error',
        status: 'pending',
      },
      {
        id: 'test-invalid-hsl',
        name: 'Test Invalid HSL Format Error',
        status: 'pending',
      },
    ];

    testSummary = {
      total: tests.length,
      passed: 0,
      failed: 0,
      running: 0,
      pending: tests.length,
    };

    testLog = [];
    addLog('Test suite initialized with ' + tests.length + ' tests');
  }

  /**
   * Update test status
   */
  function updateTestStatus(
    testId: string,
    status: 'running' | 'passed' | 'failed',
    result?: string,
    error?: string,
    duration?: number
  ) {
    tests = tests.map((t) => {
      if (t.id === testId) {
        return { ...t, status, result, error, duration };
      }
      return t;
    });

    // Update summary
    const updatedTests = tests;
    testSummary = {
      total: tests.length,
      passed: updatedTests.filter((t) => t.status === 'passed').length,
      failed: updatedTests.filter((t) => t.status === 'failed').length,
      running: updatedTests.filter((t) => t.status === 'running').length,
      pending: updatedTests.filter((t) => t.status === 'pending').length,
    };
  }

  /**
   * Test: Export theme to format
   */
  async function testExportTheme(theme: Theme, testId: string) {
    updateTestStatus(testId, 'running');
    addLog(`Testing export: ${theme.name}`);
    const startTime = performance.now();

    try {
      // Export to format
      const exportData = exportThemeToFormat(theme);

      // Validate export data
      const validation = validateThemeExport(exportData);

      if (!validation.valid) {
        throw new Error('Export validation failed: ' + validation.errors.join(', '));
      }

      // Verify required fields
      if (!exportData.name || !exportData.colors || !exportData.version) {
        throw new Error('Missing required fields in export data');
      }

      // Verify colors
      const colorFields = [
        'primary',
        'secondary',
        'background',
        'foreground',
        'muted',
        'mutedForeground',
        'accent',
        'accentForeground',
        'destructive',
        'destructiveForeground',
        'border',
        'input',
        'ring',
        'radius',
      ];

      for (const field of colorFields) {
        if (!exportData.colors[field as keyof typeof exportData.colors]) {
          throw new Error(`Missing color field: ${field}`);
        }
      }

      // Verify version
      if (exportData.version !== '1.0') {
        throw new Error(`Unexpected version: ${exportData.version}`);
      }

      const duration = Math.round(performance.now() - startTime);
      updateTestStatus(testId, 'passed', `Exported ${exportData.name}`, undefined, duration);
      addLog(`✓ Export successful: ${theme.name} (${duration}ms)`);
      return exportData;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      const message = error instanceof Error ? error.message : String(error);
      updateTestStatus(testId, 'failed', undefined, message, duration);
      addLog(`✗ Export failed: ${theme.name} - ${message}`);
      throw error;
    }
  }

  /**
   * Test: Import theme from JSON
   */
  async function testImportTheme(exportData: ThemeExport, testId: string) {
    updateTestStatus(testId, 'running');
    addLog(`Testing import: ${exportData.name}`);
    const startTime = performance.now();

    try {
      // Create file from export data
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const file = new File([blob], `theme_${exportData.name.toLowerCase()}.json`, {
        type: 'application/json',
      });

      // Import theme
      const result = await importThemeFromFile(file);

      if (!result.success) {
        throw new Error('Import validation failed: ' + result.errors.join(', '));
      }

      // Verify imported data
      if (!result.theme) {
        throw new Error('No theme data in import result');
      }

      if (result.theme.name !== exportData.name) {
        throw new Error(`Name mismatch: expected "${exportData.name}", got "${result.theme.name}"`);
      }

      // Verify colors match
      const exportColorKeys = Object.keys(exportData.colors);
      const importColorKeys = Object.keys(result.theme.colors);

      if (exportColorKeys.length !== importColorKeys.length) {
        throw new Error(
          `Color count mismatch: export has ${exportColorKeys.length}, import has ${importColorKeys.length}`
        );
      }

      for (const key of exportColorKeys) {
        const exportValue = exportData.colors[key as keyof typeof exportData.colors];
        const importValue = result.theme.colors[key as keyof typeof result.theme.colors];

        if (exportValue !== importValue) {
          throw new Error(
            `Color value mismatch for ${key}: export="${exportValue}", import="${importValue}"`
          );
        }
      }

      const duration = Math.round(performance.now() - startTime);
      updateTestStatus(testId, 'passed', `Imported ${result.theme.name}`, undefined, duration);
      addLog(`✓ Import successful: ${exportData.name} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      const message = error instanceof Error ? error.message : String(error);
      updateTestStatus(testId, 'failed', undefined, message, duration);
      addLog(`✗ Import failed: ${exportData.name} - ${message}`);
      throw error;
    }
  }

  /**
   * Test: Round-trip export and import
   */
  async function testRoundTrip(theme: Theme, testId: string) {
    updateTestStatus(testId, 'running');
    addLog(`Testing round-trip: ${theme.name}`);
    const startTime = performance.now();

    try {
      // Export
      const exportData = exportThemeToFormat(theme);

      // Create file
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const file = new File([blob], 'theme_roundtrip_test.json', { type: 'application/json' });

      // Import
      const result = await importThemeFromFile(file);

      if (!result.success || !result.theme) {
        throw new Error('Round-trip import failed');
      }

      // Verify all colors match exactly
      for (const key of Object.keys(theme.colors)) {
        const original = theme.colors[key as keyof typeof theme.colors];
        const imported = result.theme.colors[key as keyof typeof result.theme.colors];

        if (original !== imported) {
          throw new Error(
            `Round-trip color mismatch for ${key}: original="${original}", imported="${imported}"`
          );
        }
      }

      const duration = Math.round(performance.now() - startTime);
      updateTestStatus(testId, 'passed', 'Data integrity verified', undefined, duration);
      addLog(`✓ Round-trip successful: ${theme.name} (${duration}ms)`);
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      const message = error instanceof Error ? error.message : String(error);
      updateTestStatus(testId, 'failed', undefined, message, duration);
      addLog(`✗ Round-trip failed: ${theme.name} - ${message}`);
    }
  }

  /**
   * Test: Error handling
   */
  async function testErrorHandling() {
    // Test invalid JSON
    updateTestStatus('test-invalid-json', 'running');
    addLog('Testing invalid JSON error handling');
    try {
      const invalidJson = '{ invalid json }';
      const blob = new Blob([invalidJson], { type: 'application/json' });
      const file = new File([blob], 'invalid.json', { type: 'application/json' });

      const result = await importThemeFromFile(file);

      if (result.success) {
        throw new Error('Invalid JSON should fail validation');
      }

      updateTestStatus('test-invalid-json', 'passed', 'Correctly rejected invalid JSON');
      addLog('✓ Invalid JSON error handling works');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateTestStatus('test-invalid-json', 'failed', undefined, message);
      addLog(`✗ Invalid JSON test failed: ${message}`);
    }

    // Test missing fields
    updateTestStatus('test-missing-fields', 'running');
    addLog('Testing missing fields error handling');
    try {
      const incompleteTheme = {
        name: 'Incomplete',
        colors: {
          primary: '210 100% 50%',
          // Missing many required fields
        },
        version: '1.0',
      };

      const jsonContent = JSON.stringify(incompleteTheme, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const file = new File([blob], 'incomplete.json', { type: 'application/json' });

      const result = await importThemeFromFile(file);

      if (result.success) {
        throw new Error('Incomplete theme should fail validation');
      }

      if (result.errors.length === 0) {
        throw new Error('Should have validation errors');
      }

      updateTestStatus(
        'test-missing-fields',
        'passed',
        `Correctly rejected (${result.errors.length} errors)`
      );
      addLog('✓ Missing fields error handling works');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateTestStatus('test-missing-fields', 'failed', undefined, message);
      addLog(`✗ Missing fields test failed: ${message}`);
    }

    // Test invalid HSL format
    updateTestStatus('test-invalid-hsl', 'running');
    addLog('Testing invalid HSL format error handling');
    try {
      const invalidHsl = {
        name: 'Invalid HSL Theme',
        description: 'Theme with invalid HSL format',
        colors: {
          primary: 'rgb(255, 0, 0)', // Invalid: should be HSL
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
          radius: '0.5rem',
        },
        version: '1.0',
      };

      const jsonContent = JSON.stringify(invalidHsl, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const file = new File([blob], 'invalid_hsl.json', { type: 'application/json' });

      const result = await importThemeFromFile(file);

      if (result.success) {
        throw new Error('Invalid HSL format should fail validation');
      }

      const hasHslError = result.errors.some((e) => e.includes('Invalid HSL format'));
      if (!hasHslError) {
        throw new Error('Should have HSL format error');
      }

      updateTestStatus('test-invalid-hsl', 'passed', 'Correctly rejected invalid HSL');
      addLog('✓ Invalid HSL format error handling works');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateTestStatus('test-invalid-hsl', 'failed', undefined, message);
      addLog(`✗ Invalid HSL test failed: ${message}`);
    }
  }

  /**
   * Run all tests
   */
  async function runAllTests() {
    if (isRunning) return;
    isRunning = true;

    initializeTests();

    addLog('Starting test suite...');

    // Export tests
    addLog('=== EXPORT TESTS ===');
    await testExportTheme(getLightTheme(), 'export-builtin-light');
    await testExportTheme(getDarkTheme(), 'export-builtin-dark');
    await testExportTheme(getHighContrastTheme(), 'export-builtin-high-contrast');
    await testExportTheme(customThemes[0], 'export-custom-purple');
    await testExportTheme(customThemes[1], 'export-custom-ocean');
    await testExportTheme(customThemes[2], 'export-custom-forest');

    // Validation tests
    addLog('=== VALIDATION TESTS ===');
    updateTestStatus('validate-export-format', 'running');
    try {
      const lightExport = exportThemeToFormat(getLightTheme());
      const validation = validateThemeExport(lightExport);
      if (validation.valid) {
        updateTestStatus('validate-export-format', 'passed', 'All exports validated');
        addLog('✓ Export format validation passed');
      } else {
        throw new Error('Validation failed: ' + validation.errors.join(', '));
      }
    } catch (error) {
      updateTestStatus(
        'validate-export-format',
        'failed',
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }

    updateTestStatus('validate-json-structure', 'running');
    try {
      // Verify JSON structure for all themes
      for (const theme of allTestThemes) {
        const json = exportThemeToJSON(theme);
        const parsed = JSON.parse(json);

        if (!parsed.name || !parsed.colors || !parsed.version) {
          throw new Error(`Invalid JSON structure for ${theme.name}`);
        }
      }
      updateTestStatus('validate-json-structure', 'passed', 'JSON structure valid for all themes');
      addLog('✓ JSON structure validation passed');
    } catch (error) {
      updateTestStatus(
        'validate-json-structure',
        'failed',
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }

    updateTestStatus('test-filename-generation', 'running');
    updateTestStatus('validate-hsl-format', 'running');
    try {
      // Test filename generation
      for (const theme of allTestThemes) {
        const filename = generateThemeFilename(theme);
        if (!filename.startsWith('theme_') || !filename.endsWith('.json')) {
          throw new Error(`Invalid filename format: ${filename}`);
        }
      }

      // Test HSL format validation
      for (const theme of allTestThemes) {
        const exportData = exportThemeToFormat(theme);
        const validation = validateThemeImport(exportData);

        if (!validation.valid) {
          throw new Error(`HSL validation failed for ${theme.name}`);
        }
      }

      updateTestStatus('test-filename-generation', 'passed', 'Filenames generated correctly');
      updateTestStatus('validate-hsl-format', 'passed', 'All HSL colors valid');
      addLog('✓ Filename generation passed');
      addLog('✓ HSL format validation passed');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateTestStatus('test-filename-generation', 'failed', undefined, message);
      updateTestStatus('validate-hsl-format', 'failed', undefined, message);
    }

    // Import tests
    addLog('=== IMPORT TESTS ===');
    await testImportTheme(exportThemeToFormat(getLightTheme()), 'import-builtin-light');
    await testImportTheme(exportThemeToFormat(getDarkTheme()), 'import-builtin-dark');
    await testImportTheme(
      exportThemeToFormat(getHighContrastTheme()),
      'import-builtin-high-contrast'
    );
    await testImportTheme(exportThemeToFormat(customThemes[0]), 'import-custom-purple');

    // Round-trip tests
    addLog('=== ROUND-TRIP TESTS ===');
    await testRoundTrip(getLightTheme(), 'roundtrip-light');
    await testRoundTrip(getDarkTheme(), 'roundtrip-dark');
    await testRoundTrip(customThemes[0], 'roundtrip-custom');

    // Error handling tests
    addLog('=== ERROR HANDLING TESTS ===');
    await testErrorHandling();

    // Summary
    addLog('=== TEST SUITE COMPLETE ===');
    addLog(`Total: ${testSummary.total}`);
    addLog(`Passed: ${testSummary.passed}`);
    addLog(`Failed: ${testSummary.failed}`);
    addLog(`Success Rate: ${((testSummary.passed / testSummary.total) * 100).toFixed(1)}%`);

    isRunning = false;
  }

  // Initialize on mount
  onMount(() => {
    if (browser) {
      initializeTests();
    }
  });
</script>

<svelte:head>
  <title>Theme Export/Import Test Suite</title>
  <meta name="description" content="Comprehensive testing for theme JSON export and import" />
</svelte:head>

<div class="container mx-auto max-w-7xl space-y-6 p-6">
  <!-- Header -->
  <div class="flex items-center justify-between border-b pb-4">
    <div>
      <h1 class="flex items-center gap-2 text-3xl font-bold">
        <TestTube class="text-primary h-8 w-8" />
        Theme Export/Import Test Suite
      </h1>
      <p class="text-muted-foreground mt-2">
        Comprehensive testing for theme JSON export and import with various custom themes
      </p>
    </div>
    <div class="flex items-center gap-4">
      <div class="text-right">
        <div class="text-2xl font-bold">{testSummary.passed}/{testSummary.total}</div>
        <div class="text-muted-foreground text-sm">Tests Passed</div>
      </div>
      <Button onclick={runAllTests} disabled={isRunning} size="lg">
        <RefreshCw class="mr-2 h-4 w-4 {isRunning ? 'animate-spin' : ''}" />
        {isRunning ? 'Running...' : 'Run All Tests'}
      </Button>
    </div>
  </div>

  <div class="grid gap-6 lg:grid-cols-4">
    <!-- Test Results -->
    <div class="space-y-4 lg:col-span-3">
      <!-- Summary Cards -->
      <div class="grid grid-cols-4 gap-4">
        <Card>
          <CardContent class="pt-6">
            <div class="text-center">
              <div class="text-3xl font-bold">{testSummary.total}</div>
              <div class="text-muted-foreground text-sm">Total Tests</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <div class="text-center">
              <div class="text-3xl font-bold text-green-600">{testSummary.passed}</div>
              <div class="text-muted-foreground text-sm">Passed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <div class="text-center">
              <div class="text-3xl font-bold text-red-600">{testSummary.failed}</div>
              <div class="text-muted-foreground text-sm">Failed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600">
                {testSummary.total > 0
                  ? ((testSummary.passed / testSummary.total) * 100).toFixed(0)
                  : 0}%
              </div>
              <div class="text-muted-foreground text-sm">Success Rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Test List -->
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>Detailed results for each test case</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            {#each tests as test}
              <div
                class="flex items-center justify-between rounded-lg border p-3 {test.status ===
                'passed'
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                  : test.status === 'failed'
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                    : test.status === 'running'
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                      : 'border-muted bg-muted/30'}"
              >
                <div class="flex flex-1 items-center gap-3">
                  {#if test.status === 'passed'}
                    <CheckCircle class="h-5 w-5 text-green-600" />
                  {:else if test.status === 'failed'}
                    <XCircle class="h-5 w-5 text-red-600" />
                  {:else if test.status === 'running'}
                    <RefreshCw class="h-5 w-5 animate-spin text-blue-600" />
                  {:else}
                    <div class="border-muted-foreground/30 h-5 w-5 rounded-full border-2" />
                  {/if}
                  <div class="flex-1">
                    <div class="font-medium">{test.name}</div>
                    {#if test.result}
                      <div class="text-sm text-green-600 dark:text-green-400">
                        {test.result}
                      </div>
                    {/if}
                    {#if test.error}
                      <div class="text-sm text-red-600 dark:text-red-400">{test.error}</div>
                    {/if}
                  </div>
                </div>
                {#if test.duration}
                  <div class="text-muted-foreground font-mono text-xs">{test.duration}ms</div>
                {/if}
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Sidebar -->
    <div class="space-y-4">
      <!-- Test Info -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Test Coverage</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3 text-sm">
          <div>
            <div class="mb-1 font-semibold">Export Tests</div>
            <div class="text-muted-foreground">6 themes (3 built-in + 3 custom)</div>
          </div>
          <div>
            <div class="mb-1 font-semibold">Import Tests</div>
            <div class="text-muted-foreground">4 theme imports</div>
          </div>
          <div>
            <div class="mb-1 font-semibold">Round-trip Tests</div>
            <div class="text-muted-foreground">3 data integrity tests</div>
          </div>
          <div>
            <div class="mb-1 font-semibold">Error Handling</div>
            <div class="text-muted-foreground">3 validation tests</div>
          </div>
          <div>
            <div class="mb-1 font-semibold">Format Tests</div>
            <div class="text-muted-foreground">4 format validations</div>
          </div>
        </CardContent>
      </Card>

      <!-- Test Themes -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Test Themes</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2 text-sm">
          <div class="font-semibold">Built-in Themes:</div>
          <ul class="text-muted-foreground ml-2 list-inside list-disc space-y-1">
            <li>Light</li>
            <li>Dark</li>
            <li>High Contrast</li>
          </ul>
          <div class="pt-2 font-semibold">Custom Themes:</div>
          <ul class="text-muted-foreground ml-2 list-inside list-disc space-y-1">
            <li>Purple Dream</li>
            <li>Ocean Blue</li>
            <li>Forest Green</li>
          </ul>
        </CardContent>
      </Card>

      <!-- Activity Log -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <FileText class="h-4 w-4" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="max-h-96 space-y-1 overflow-y-auto font-mono text-xs">
            {#each testLog as log}
              <div class="text-muted-foreground">{log}</div>
            {/each}
            {#if testLog.length === 0}
              <div class="text-muted-foreground py-4 text-center">No activity yet</div>
            {/if}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</div>
