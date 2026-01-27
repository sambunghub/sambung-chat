<script lang="ts">
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { darkTheme, lightTheme, highContrastTheme } from '$lib/themes';
  import {
    downloadTheme,
    exportThemeToJSON,
    exportThemeToFormat,
    generateThemeFilename,
    validateThemeExport,
    type ThemeExport,
  } from '$lib/utils/theme-export';
  import Download from '@lucide/svelte/icons/download';
  import FileText from '@lucide/svelte/icons/file-text';
  import Check from '@lucide/svelte/icons/check';
  import AlertCircle from '@lucide/svelte/icons/alert-circle';
  import Code from '@lucide/svelte/icons/code';

  // Track export operations
  let exportCount = $state(0);
  let lastExportedTheme = $state<string>('');
  let exportResults = $state<
    Array<{
      themeName: string;
      filename: string;
      timestamp: string;
      success: boolean;
    }>
  >([]);

  /**
   * Handle theme download
   */
  function handleDownload(theme: typeof darkTheme) {
    try {
      const filename = generateThemeFilename(theme);
      const exportData = downloadTheme(theme);

      // Track export
      exportCount++;
      lastExportedTheme = theme.name;
      exportResults.push({
        themeName: theme.name,
        filename,
        timestamp: new Date().toLocaleTimeString(),
        success: true,
      });
    } catch (error) {
      console.error('Export failed:', error);
      exportResults.push({
        themeName: theme.name,
        filename: 'N/A',
        timestamp: new Date().toLocaleTimeString(),
        success: false,
      });
    }
  }

  /**
   * Export theme to JSON string (for preview)
   */
  function previewExport(theme: typeof darkTheme): string {
    return exportThemeToJSON(theme);
  }

  /**
   * Validate export data
   */
  function testValidation(theme: typeof darkTheme) {
    const exportData = exportThemeToFormat(theme);
    return validateThemeExport(exportData);
  }

  // Built-in themes for testing
  const themes = [lightTheme, darkTheme, highContrastTheme];
</script>

<svelte:head>
  <title>Theme Export Test</title>
  <meta name="description" content="Test page for theme export functionality" />
</svelte:head>

<div class="container mx-auto max-w-7xl p-6">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-foreground mb-2 text-3xl font-bold">Theme Export Test</h1>
    <p class="text-muted-foreground text-lg">
      This page tests the theme export functionality including JSON conversion, file download, and
      validation.
    </p>
  </div>

  <div class="grid gap-6 lg:grid-cols-3">
    <!-- Instructions Sidebar -->
    <div class="lg:col-span-1">
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <FileText class="text-muted-foreground size-5" />
            <CardTitle class="text-lg">Test Instructions</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <h3 class="font-semibold">Manual Testing Steps:</h3>
            <ol class="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
              <li>Click each "Download" button below</li>
              <li>Verify a .json file is downloaded</li>
              <li>Open the downloaded JSON file</li>
              <li>Check that the file has valid JSON format</li>
              <li>Verify all required fields are present</li>
              <li>Check color values are in HSL format</li>
              <li>Verify the version field is "1.0"</li>
              <li>Test with custom filename option</li>
            </ol>
          </div>

          <div class="border-border border-t pt-4">
            <h3 class="mb-2 font-semibold">File Format:</h3>
            <code class="text-muted-foreground bg-muted block rounded p-2 text-xs">
              theme_&lt;name&gt;_&lt;date&gt;.json
            </code>
            <p class="text-muted-foreground mt-2 text-xs">Example: theme_dark_2025-01-26.json</p>
          </div>

          <div class="border-border border-t pt-4">
            <h3 class="mb-2 font-semibold">Export Schema:</h3>
            <pre class="text-muted-foreground bg-muted overflow-x-auto rounded p-2 text-xs">{`{
  "name": string,
  "description"?: string,
  "colors": ThemeColors,
  "version": "1.0"
}`}</pre>
          </div>

          <div class="border-border border-t pt-4">
            <h3 class="mb-2 font-semibold">Statistics:</h3>
            <div class="text-muted-foreground space-y-1 text-sm">
              <div class="flex justify-between">
                <span>Total Exports:</span>
                <span class="font-mono font-semibold">{exportCount}</span>
              </div>
              <div class="flex justify-between">
                <span>Last Export:</span>
                <span class="font-mono text-xs">{lastExportedTheme || 'None'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Main Content Area -->
    <div class="space-y-6 lg:col-span-2">
      <!-- Export Buttons -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Download class="text-muted-foreground size-5" />
              <CardTitle>Theme Export Functions</CardTitle>
            </div>
            <span class="border-border rounded border px-2 py-1 text-xs">Interactive</span>
          </div>
          <CardDescription>
            Click the download buttons to export each theme as a JSON file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            {#each themes as theme}
              <div class="border-border flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h4 class="font-semibold">{theme.name}</h4>
                  <p class="text-muted-foreground text-sm">{theme.description}</p>
                  <code class="text-muted-foreground mt-1 block text-xs">ID: {theme.id}</code>
                </div>
                <Button onclick={() => handleDownload(theme)} variant="default">
                  <Download class="mr-2 size-4" />
                  Download
                </Button>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>

      <!-- JSON Preview -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <Code class="text-muted-foreground size-5" />
            <CardTitle>JSON Export Preview</CardTitle>
          </div>
          <CardDescription>Preview of what the exported JSON looks like</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            {#each themes as theme, index}
              <div>
                <h4 class="mb-2 font-semibold">{theme.name} Theme</h4>
                <pre
                  class="text-muted-foreground bg-muted max-h-64 overflow-auto rounded-lg p-4 text-xs"><code
                    >{previewExport(theme)}</code
                  ></pre>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>

      <!-- Validation Results -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <Check class="text-muted-foreground size-5" />
            <CardTitle>Validation Results</CardTitle>
          </div>
          <CardDescription>
            Verify that export data meets the ThemeExport schema requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            {#each themes as theme}
              {@const validation = testValidation(theme)}
              <div class="border-border flex items-start justify-between rounded-lg border p-4">
                <div class="flex-1">
                  <div class="mb-2 flex items-center gap-2">
                    <h4 class="font-semibold">{theme.name}</h4>
                    {#if validation.valid}
                      <span
                        class="bg-primary text-primary-foreground flex items-center gap-1 rounded px-2 py-1 text-xs"
                      >
                        <Check class="size-3" />
                        Valid
                      </span>
                    {:else}
                      <span
                        class="bg-destructive text-destructive-foreground flex items-center gap-1 rounded px-2 py-1 text-xs"
                      >
                        <AlertCircle class="size-3" />
                        Invalid
                      </span>
                    {/if}
                  </div>
                  {#if !validation.valid && validation.errors.length > 0}
                    <ul class="text-destructive list-inside list-disc text-sm">
                      {#each validation.errors as error}
                        <li>{error}</li>
                      {/each}
                    </ul>
                  {:else}
                    <p class="text-muted-foreground text-sm">
                      All required fields present and valid
                    </p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>

      <!-- Export History -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <FileText class="text-muted-foreground size-5" />
            <CardTitle>Export History</CardTitle>
          </div>
          <CardDescription>Record of export operations during this session</CardDescription>
        </CardHeader>
        <CardContent>
          {#if exportResults.length > 0}
            <div class="space-y-2">
              {#each exportResults.slice().reverse() as result}
                <div class="border-border flex items-center justify-between rounded-lg border p-3">
                  <div class="flex items-center gap-3">
                    {#if result.success}
                      <Check class="text-primary size-5" />
                    {:else}
                      <AlertCircle class="text-destructive size-5" />
                    {/if}
                    <div>
                      <h4 class="font-semibold">{result.themeName}</h4>
                      <code class="text-muted-foreground text-xs">{result.filename}</code>
                    </div>
                  </div>
                  <span class="text-muted-foreground text-xs">{result.timestamp}</span>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-muted-foreground py-4 text-center text-sm">
              No exports yet. Click a download button above to export a theme.
            </p>
          {/if}
        </CardContent>
      </Card>

      <!-- API Reference -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <Code class="text-muted-foreground size-5" />
            <CardTitle>API Reference</CardTitle>
          </div>
          <CardDescription>Available export functions and their signatures</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div>
              <h4 class="mb-1 font-mono text-sm font-semibold">downloadTheme(theme, filename?)</h4>
              <p class="text-muted-foreground text-sm">
                Export and download theme as JSON file. Returns ThemeExport data.
              </p>
            </div>
            <div>
              <h4 class="mb-1 font-mono text-sm font-semibold">exportThemeToJSON(theme)</h4>
              <p class="text-muted-foreground text-sm">
                Convert theme to JSON string. Returns formatted JSON string.
              </p>
            </div>
            <div>
              <h4 class="mb-1 font-mono text-sm font-semibold">exportThemeToFormat(theme)</h4>
              <p class="text-muted-foreground text-sm">
                Convert theme to export format. Returns ThemeExport object.
              </p>
            </div>
            <div>
              <h4 class="mb-1 font-mono text-sm font-semibold">generateThemeFilename(theme)</h4>
              <p class="text-muted-foreground text-sm">
                Generate filename in format: theme_&lt;name&gt;_&lt;date&gt;.json
              </p>
            </div>
            <div>
              <h4 class="mb-1 font-mono text-sm font-semibold">validateThemeExport(data)</h4>
              <p class="text-muted-foreground text-sm">
                Validate export data. Returns {'{'} valid: boolean, errors: string[] }.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</div>
