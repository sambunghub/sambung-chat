<script lang="ts">
  import { lightTheme, darkTheme, highContrastTheme } from '$lib/themes';
  import type { Theme } from '$lib/types/theme';
  import { browser } from '$app/environment';

  let currentTheme = $state<Theme>(lightTheme);
  let activeTheme = $state<'light' | 'dark' | 'high-contrast'>('light');

  function applyTheme(theme: Theme) {
    if (!browser) return;

    const root = document.documentElement;
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--foreground', theme.colors.foreground);
    root.style.setProperty('--muted', theme.colors.muted);
    root.style.setProperty('--muted-foreground', theme.colors.mutedForeground);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--accent-foreground', theme.colors.accentForeground);
    root.style.setProperty('--destructive', theme.colors.destructive);
    root.style.setProperty('--destructive-foreground', theme.colors.destructiveForeground);
    root.style.setProperty('--border', theme.colors.border);
    root.style.setProperty('--input', theme.colors.input);
    root.style.setProperty('--ring', theme.colors.ring);
    root.style.setProperty('--radius', theme.colors.radius + 'rem');

    currentTheme = theme;
  }

  function setLightTheme() {
    activeTheme = 'light';
    applyTheme(lightTheme);
  }

  function setDarkTheme() {
    activeTheme = 'dark';
    applyTheme(darkTheme);
  }

  function setHighContrastTheme() {
    activeTheme = 'high-contrast';
    applyTheme(highContrastTheme);
  }
</script>

<div class="container">
  <header>
    <h1>Default Themes Test</h1>
    <p>Testing the three built-in themes: Light, Dark, and High Contrast</p>
  </header>

  <section>
    <h2>Theme Switcher</h2>
    <div class="theme-buttons">
      <button class="theme-btn" class:active={activeTheme === 'light'} onclick={setLightTheme}>
        Light Theme
      </button>
      <button class="theme-btn" class:active={activeTheme === 'dark'} onclick={setDarkTheme}>
        Dark Theme
      </button>
      <button
        class="theme-btn"
        class:active={activeTheme === 'high-contrast'}
        onclick={setHighContrastTheme}
      >
        High Contrast Theme
      </button>
    </div>
  </section>

  <section>
    <h2>Current Theme: {currentTheme.name}</h2>
    <p class="description">{currentTheme.description}</p>

    <h3>Theme Metadata</h3>
    <div class="metadata">
      <div class="metadata-item">
        <strong>ID:</strong> <code>{currentTheme.id}</code>
      </div>
      <div class="metadata-item">
        <strong>User ID:</strong> <code>{currentTheme.userId || 'null (built-in)'}</code>
      </div>
      <div class="metadata-item">
        <strong>Built-in:</strong> <code>{currentTheme.isBuiltIn.toString()}</code>
      </div>
      <div class="metadata-item">
        <strong>Created:</strong> <code>{currentTheme.createdAt}</code>
      </div>
    </div>
  </section>

  <section>
    <h3>Color Palette</h3>
    <div class="color-grid">
      {#each Object.entries(currentTheme.colors) as [name, value]}
        <div class="color-card">
          <div class="color-swatch" style="background: hsl({value})"></div>
          <div class="color-info">
            <div class="color-name">{name}</div>
            <div class="color-value">{value}</div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section>
    <h3>UI Component Preview</h3>
    <div class="preview-section">
      <h4>Buttons</h4>
      <div class="button-group">
        <button class="btn-primary">Primary Button</button>
        <button class="btn-secondary">Secondary Button</button>
        <button class="btn-destructive">Destructive Button</button>
      </div>

      <h4>Form Inputs</h4>
      <div class="form-group">
        <label for="test-input">Text Input</label>
        <input id="test-input" type="text" placeholder="Enter some text..." />
      </div>

      <h4>Cards</h4>
      <div class="card">
        <h5>Card Title</h5>
        <p>
          This is a sample card with default styling. It should adapt to the current theme colors.
        </p>
      </div>

      <h4>Text Styles</h4>
      <div class="text-styles">
        <p class="text-muted">Muted text for less prominent information</p>
        <p class="text-accent">Accent text for highlights</p>
        <p class="text-destructive">Destructive text for warnings and errors</p>
      </div>
    </div>
  </section>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  header p {
    font-size: 1.1rem;
    opacity: 0.8;
  }

  section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) * 1);
    background: var(--background);
  }

  h2 {
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.4rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }

  h4 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .theme-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .theme-btn {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    border: 2px solid var(--border);
    border-radius: calc(var(--radius) * 1);
    background: var(--background);
    color: var(--foreground);
    cursor: pointer;
    transition: all 0.2s;
  }

  .theme-btn:hover {
    background: var(--accent);
    color: var(--accent-foreground);
  }

  .theme-btn.active {
    background: var(--primary);
    color: var(--accent-foreground);
    border-color: var(--primary);
  }

  .description {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .metadata {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .metadata-item {
    font-size: 0.9rem;
  }

  code {
    padding: 0.2rem 0.4rem;
    background: var(--muted);
    border-radius: calc(var(--radius) * 0.5);
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.85rem;
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .color-card {
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) * 1);
    overflow: hidden;
  }

  .color-swatch {
    height: 80px;
    width: 100%;
  }

  .color-info {
    padding: 0.75rem;
  }

  .color-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .color-value {
    font-size: 0.85rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    opacity: 0.8;
  }

  .preview-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .button-group {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  button {
    padding: 0.625rem 1.25rem;
    font-size: 0.95rem;
    font-weight: 500;
    border-radius: calc(var(--radius) * 1);
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  button:hover {
    opacity: 0.9;
  }

  .btn-primary {
    background: var(--primary);
    color: var(--accent-foreground);
  }

  .btn-secondary {
    background: var(--secondary);
    color: var(--secondary-foreground);
  }

  .btn-destructive {
    background: var(--destructive);
    color: var(--destructive-foreground);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 500;
    font-size: 0.95rem;
  }

  input {
    padding: 0.625rem;
    border: 1px solid var(--input);
    border-radius: calc(var(--radius) * 1);
    background: var(--background);
    color: var(--foreground);
    font-size: 1rem;
  }

  input:focus {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  .card {
    padding: 1.25rem;
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) * 1);
    background: var(--card);
  }

  .card h5 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .card p {
    opacity: 0.9;
  }

  .text-styles {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .text-muted {
    color: var(--muted-foreground);
  }

  .text-accent {
    color: var(--accent);
  }

  .text-destructive {
    color: var(--destructive);
  }
</style>
