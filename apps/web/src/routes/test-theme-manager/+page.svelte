<script lang="ts">
  import { browser } from '$app/environment';
  import {
    applyTheme,
    removeTheme,
    getCurrentTheme,
    isThemeApplied,
    updateThemeColors,
    exportThemeAsCssVariables,
    resetToDefaultTheme,
  } from '$lib/themes/theme-manager';
  import { lightTheme, darkTheme, highContrastTheme } from '$lib/themes';
  import { Paintbrush, Palette, RefreshCw, Trash2, CheckCircle } from '@lucide/svelte';

  let currentThemeName = $state('None (default)');
  let activeButton = $state<'light' | 'dark' | 'high-contrast' | 'none'>('none');
  let cssVariables = $state<Record<string, string>>({});
  let updateLogs = $state<string[]>([]);

  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    updateLogs = [`[${timestamp}] ${message}`, ...updateLogs].slice(0, 10);
  }

  function applyLightTheme() {
    applyTheme(lightTheme);
    currentThemeName = lightTheme.name;
    activeButton = 'light';
    addLog(`Applied theme: ${lightTheme.name}`);
    updateCssVariablesDisplay();
  }

  function applyDarkTheme() {
    applyTheme(darkTheme);
    currentThemeName = darkTheme.name;
    activeButton = 'dark';
    addLog(`Applied theme: ${darkTheme.name}`);
    updateCssVariablesDisplay();
  }

  function applyHighContrastTheme() {
    applyTheme(highContrastTheme);
    currentThemeName = highContrastTheme.name;
    activeButton = 'high-contrast';
    addLog(`Applied theme: ${highContrastTheme.name}`);
    updateCssVariablesDisplay();
  }

  function removeCurrentTheme() {
    removeTheme();
    currentThemeName = 'None (default CSS)';
    activeButton = 'none';
    addLog('Removed theme - using default CSS');
    updateCssVariablesDisplay();
  }

  function resetToLight() {
    resetToDefaultTheme();
    currentThemeName = lightTheme.name;
    activeButton = 'light';
    addLog('Reset to default light theme');
    updateCssVariablesDisplay();
  }

  function updatePrimaryColor() {
    updateThemeColors({ primary: '0 100% 50%' }); // Bright red
    addLog('Updated primary color to red');
    updateCssVariablesDisplay();
  }

  function updateBackgroundColor() {
    updateThemeColors({ background: '210 100% 95%' }); // Very light blue
    addLog('Updated background color to light blue');
    updateCssVariablesDisplay();
  }

  function updateMultipleColors() {
    updateThemeColors({
      primary: '120 100% 40%', // Green
      accent: '280 100% 60%', // Purple
    });
    addLog('Updated primary to green and accent to purple');
    updateCssVariablesDisplay();
  }

  function getCurrentThemeInfo() {
    const theme = getCurrentTheme();
    if (theme) {
      addLog(`Current theme: ${theme.name} (ID: ${theme.id})`);
    } else {
      addLog('No theme currently applied');
    }
  }

  function checkLightTheme() {
    const isApplied = isThemeApplied(lightTheme);
    addLog(`Light theme applied: ${isApplied}`);
  }

  function exportCssVariables() {
    const vars = exportThemeAsCssVariables();
    addLog(`Exported ${Object.keys(vars).length} CSS variables`);
    cssVariables = vars;
  }

  function updateCssVariablesDisplay() {
    if (browser) {
      exportCssVariables();
    }
  }

  // Initialize on mount
  if (browser) {
    updateCssVariablesDisplay();
    addLog('Theme manager test page loaded');
  }
</script>

<div class="container">
  <header>
    <div class="header-icon">
      <Palette />
    </div>
    <div>
      <h1>Theme Manager Test</h1>
      <p>Testing theme application, color updates, and CSS variable management</p>
    </div>
  </header>

  <section class="status-section">
    <h2>Current Status</h2>
    <div class="status-card">
      <div class="status-item">
        <span class="status-label">Active Theme:</span>
        <span class="status-value">{currentThemeName}</span>
      </div>
      <div class="status-item">
        <span class="status-label">CSS Variables:</span>
        <span class="status-value">{Object.keys(cssVariables).length} defined</span>
      </div>
    </div>
  </section>

  <section>
    <h2>Theme Application</h2>
    <div class="button-grid">
      <button
        class="theme-button light"
        class:active={activeButton === 'light'}
        onclick={applyLightTheme}
      >
        <Paintbrush />
        <span>Apply Light Theme</span>
      </button>
      <button
        class="theme-button dark"
        class:active={activeButton === 'dark'}
        onclick={applyDarkTheme}
      >
        <Paintbrush />
        <span>Apply Dark Theme</span>
      </button>
      <button
        class="theme-button high-contrast"
        class:active={activeButton === 'high-contrast'}
        onclick={applyHighContrastTheme}
      >
        <Paintbrush />
        <span>Apply High Contrast Theme</span>
      </button>
      <button
        class="theme-button"
        class:active={activeButton === 'none'}
        onclick={removeCurrentTheme}
      >
        <Trash2 />
        <span>Remove Theme</span>
      </button>
      <button class="theme-button reset" onclick={resetToLight}>
        <RefreshCw />
        <span>Reset to Default</span>
      </button>
    </div>
  </section>

  <section>
    <h2>Dynamic Color Updates</h2>
    <p class="description">Test updating individual colors without changing the entire theme</p>
    <div class="button-grid">
      <button class="action-button" onclick={updatePrimaryColor}>
        <Paintbrush />
        <span>Set Primary to Red</span>
      </button>
      <button class="action-button" onclick={updateBackgroundColor}>
        <Paintbrush />
        <span>Set Background to Light Blue</span>
      </button>
      <button class="action-button" onclick={updateMultipleColors}>
        <Palette />
        <span>Update Primary + Accent</span>
      </button>
    </div>
  </section>

  <section>
    <h2>Theme Info & Queries</h2>
    <div class="button-grid">
      <button class="query-button" onclick={getCurrentThemeInfo}>
        <CheckCircle />
        <span>Get Current Theme</span>
      </button>
      <button class="query-button" onclick={checkLightTheme}>
        <CheckCircle />
        <span>Check if Light Applied</span>
      </button>
      <button class="query-button" onclick={exportCssVariables}>
        <Palette />
        <span>Export CSS Variables</span>
      </button>
    </div>
  </section>

  <section>
    <h2>Activity Log</h2>
    <div class="log-container">
      {#each updateLogs as log}
        <div class="log-entry">{log}</div>
      {/each}
      {#if updateLogs.length === 0}
        <div class="log-empty">No activity yet</div>
      {/if}
    </div>
  </section>

  <section>
    <h2>CSS Variables Preview</h2>
    <div class="variables-grid">
      {#each Object.entries(cssVariables).slice(0, 12) as [name, value]}
        <div class="variable-card">
          <div class="variable-name">{name}</div>
          <div class="variable-value">{value}</div>
          {#if name.includes('background') || name.includes('primary') || name.includes('accent')}
            <div
              class="variable-preview"
              style="background: hsl({value}); border: 1px solid hsl({cssVariables['--border']})"
            ></div>
          {/if}
        </div>
      {/each}
    </div>
    {#if Object.keys(cssVariables).length > 12}
      <p class="more-hint">Showing 12 of {Object.keys(cssVariables).length} variables</p>
    {/if}
  </section>

  <section>
    <h2>UI Component Preview</h2>
    <div class="preview-section">
      <div class="preview-group">
        <h4>Buttons</h4>
        <div class="button-row">
          <button class="preview-btn primary">Primary</button>
          <button class="preview-btn secondary">Secondary</button>
          <button class="preview-btn destructive">Destructive</button>
        </div>
      </div>

      <div class="preview-group">
        <h4>Input Fields</h4>
        <input type="text" placeholder="Enter some text..." class="preview-input" />
      </div>

      <div class="preview-group">
        <h4>Cards</h4>
        <div class="preview-card">
          <h5>Card Title</h5>
          <p>This card uses the current theme's background and foreground colors.</p>
        </div>
      </div>

      <div class="preview-group">
        <h4>Text Styles</h4>
        <p class="text-muted">Muted text example</p>
        <p class="text-accent">Accent text example</p>
        <p class="text-destructive">Destructive text example</p>
      </div>
    </div>
  </section>
</div>

<style>
  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    border-radius: var(--radius);
  }

  header h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  header p {
    font-size: 1rem;
    color: hsl(var(--muted-foreground));
  }

  section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    background: hsl(var(--card));
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  h4 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .description {
    color: hsl(var(--muted-foreground));
    margin-bottom: 1rem;
  }

  /* Status Section */
  .status-section {
    background: hsl(var(--accent));
  }

  .status-card {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .status-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .status-label {
    font-size: 0.875rem;
    color: hsl(var(--muted-foreground));
    font-weight: 500;
  }

  .status-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  /* Button Grid */
  .button-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .theme-button,
  .action-button,
  .query-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    font-weight: 500;
    border: 2px solid hsl(var(--border));
    border-radius: var(--radius);
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    cursor: pointer;
    transition: all 0.2s;
  }

  .theme-button:hover,
  .action-button:hover,
  .query-button:hover {
    background: hsl(var(--accent));
    color: hsl(var(--accent-foreground));
    border-color: hsl(var(--accent));
  }

  .theme-button.active {
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    border-color: hsl(var(--primary));
    font-weight: 600;
  }

  .theme-button.light {
    border-color: hsl(222 47% 11%);
  }

  .theme-button.dark {
    border-color: hsl(210 40% 98%);
  }

  .theme-button.high-contrast {
    border-color: hsl(207 90% 54%);
  }

  .theme-button.reset {
    color: hsl(var(--destructive));
    border-color: hsl(var(--destructive));
  }

  /* Activity Log */
  .log-container {
    max-height: 300px;
    overflow-y: auto;
    background: hsl(var(--muted));
    border-radius: var(--radius);
    padding: 1rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.85rem;
  }

  .log-entry {
    padding: 0.25rem 0;
    border-bottom: 1px solid hsl(var(--border));
    color: hsl(var(--foreground));
  }

  .log-entry:last-child {
    border-bottom: none;
  }

  .log-empty {
    color: hsl(var(--muted-foreground));
    font-style: italic;
    text-align: center;
    padding: 1rem;
  }

  /* CSS Variables Grid */
  .variables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 0.75rem;
  }

  .variable-card {
    padding: 0.75rem;
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    background: hsl(var(--background));
  }

  .variable-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: hsl(var(--foreground));
    margin-bottom: 0.25rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  .variable-value {
    font-size: 0.75rem;
    color: hsl(var(--muted-foreground));
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    margin-bottom: 0.5rem;
  }

  .variable-preview {
    height: 30px;
    width: 100%;
    border-radius: 4px;
  }

  .more-hint {
    color: hsl(var(--muted-foreground));
    font-size: 0.875rem;
    text-align: center;
    margin-top: 1rem;
    font-style: italic;
  }

  /* UI Preview */
  .preview-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .preview-group {
    padding: 1rem;
    background: hsl(var(--muted));
    border-radius: var(--radius);
  }

  .button-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .preview-btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.95rem;
    font-weight: 500;
    border-radius: var(--radius);
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .preview-btn:hover {
    opacity: 0.9;
  }

  .preview-btn.primary {
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
  }

  .preview-btn.secondary {
    background: hsl(var(--secondary));
    color: hsl(var(--secondary-foreground));
  }

  .preview-btn.destructive {
    background: hsl(var(--destructive));
    color: hsl(var(--destructive-foreground));
  }

  .preview-input {
    width: 100%;
    padding: 0.625rem;
    border: 1px solid hsl(var(--input));
    border-radius: var(--radius);
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    font-size: 1rem;
  }

  .preview-input:focus {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }

  .preview-card {
    padding: 1.25rem;
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    background: hsl(var(--card));
  }

  .preview-card h5 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .preview-card p {
    opacity: 0.9;
  }

  .text-muted {
    color: hsl(var(--muted-foreground));
  }

  .text-accent {
    color: hsl(var(--accent));
  }

  .text-destructive {
    color: hsl(var(--destructive));
  }
</style>
