/**
 * Markdown Renderer with Syntax Highlighting, Mermaid, and LaTeX Support
 *
 * Uses marked for parsing and basic code formatting
 * Supports Mermaid diagrams for flowcharts, sequence diagrams, etc.
 * Supports LaTeX math rendering with KaTeX (lazy-loaded)
 */

import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { loadKatex, loadKatexCss, loadMermaid } from '$lib/utils/lazy-load';

/**
 * Configure marked renderer with basic code styling
 */
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * Typed interface for Mermaid window extensions
 * Prevents use of 'any' and provides type safety for Mermaid-related window properties
 */
interface MermaidWindow extends Window {
  // mermaid is loaded from CDN dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mermaid?: any;
  mermaidInitialized?: boolean;
  mermaidTheme?: 'dark' | 'light';
  mermaidThemeObserverSetup?: boolean;
  mermaidThemeObserver?: MutationObserver;
}

/**
 * Helper to get typed window object for Mermaid operations
 */
function getMermaidWindow(): MermaidWindow | undefined {
  return typeof window !== 'undefined' ? (window as MermaidWindow) : undefined;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

/**
 * Unescape HTML entities - used for Mermaid code that needs raw characters
 * Reverses the escapeHtml() function for specific use cases
 */
function unescapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#39;': "'",
    '&apos;': "'",
  };
  // Must replace &amp; last to avoid double-unescaping
  return text.replace(/&(quot|apos|lt|gt|#039|#39);/g, (m) => map[m] || m).replace(/&amp;/g, '&');
}

/**
 * Global flag to track if markdown dependencies are loaded
 */
let markdownDependenciesLoaded = false;
let markdownDependenciesLoading = false;

/**
 * Cache for lazy-loaded KaTeX module
 */
let cachedKatex: typeof import('katex') | null = null;
let katexLoadInProgress: Promise<typeof import('katex')> | null = null;

/**
 * Render LaTeX math to HTML using KaTeX
 * Note: This function will trigger lazy-loading of KaTeX on first call if not already loaded.
 * For better performance, call ensureMarkdownDependencies() before rendering.
 */
async function renderLatex(latex: string, displayMode: boolean): Promise<string> {
  // Load katex if not cached
  if (!cachedKatex) {
    if (katexLoadInProgress) {
      // Wait for existing load to complete
      try {
        cachedKatex = await katexLoadInProgress;
      } catch {
        // If load failed, reset for retry
        katexLoadInProgress = null;
        throw new Error('KaTeX failed to load');
      }
    } else {
      // Start new load with proper cleanup on failure
      katexLoadInProgress = loadKatex();
      try {
        cachedKatex = await katexLoadInProgress;
      } catch {
        // Clear the in-progress flag on failure so retry is possible
        katexLoadInProgress = null;
        throw new Error('KaTeX failed to load');
      } finally {
        // Always clear the in-progress flag after load completes (success or failure)
        katexLoadInProgress = null;
      }
    }
  }

  if (!cachedKatex) {
    throw new Error('KaTeX failed to load');
  }

  try {
    return cachedKatex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
      macros: {
        '\\R': '\\mathbb{R}',
      },
    });
  } catch (error) {
    // Sanitized logging: only log error type in production, full details in development
    const isDev = import.meta.env?.DEV ?? process.env?.NODE_ENV === 'development';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    if (isDev) {
      console.error('LaTeX rendering error:', error);
    } else {
      console.error(`LaTeX rendering error: ${errorName}`);
    }
    // Escape user-provided LaTeX content to prevent XSS in error output
    const safeErrorMessage = error instanceof Error ? escapeHtml(error.message) : 'Unknown error';
    const safeLatex = escapeHtml(latex);
    return `<span class="text-red-500" title="LaTeX error: ${safeErrorMessage}">\\(${safeLatex}\\)</span>`;
  }
}

/**
 * Synchronous fallback for rendering LaTeX (used if KaTeX not pre-loaded)
 * Returns the raw LaTeX string with a warning
 */
function renderLatexSync(latex: string, displayMode: boolean): string {
  if (cachedKatex) {
    try {
      return cachedKatex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        strict: false,
        trust: false,
        macros: {
          '\\R': '\\mathbb{R}',
        },
      });
    } catch (error) {
      // Sanitized logging: only log error type in production, full details in development
      const isDev = import.meta.env?.DEV ?? process.env?.NODE_ENV === 'development';
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      if (isDev) {
        console.error('LaTeX rendering error:', error);
      } else {
        console.error(`LaTeX rendering error: ${errorName}`);
      }
      // Escape user-provided LaTeX content to prevent XSS in error output
      const safeErrorMessage = error instanceof Error ? escapeHtml(error.message) : 'Unknown error';
      const safeLatex = escapeHtml(latex);
      return `<span class="text-red-500" title="LaTeX error: ${safeErrorMessage}">\\(${safeLatex}\\)</span>`;
    }
  }

  // KaTeX not loaded yet - return placeholder
  console.warn('KaTeX not loaded. Call ensureMarkdownDependencies() before rendering.');
  return `<span class="text-yellow-600 dark:text-yellow-400" title="LaTeX not loaded - call ensureMarkdownDependencies() first">\\(${latex}\\)</span>`;
}

/**
 * Protect LaTeX delimiters before markdown parsing
 * Returns: { processed: string, map: Map<string, {latex: string, displayMode: boolean}> }
 */
function protectLatexDelimiters(text: string): {
  processed: string;
  latexMap: Map<string, { latex: string; displayMode: boolean }>;
} {
  const latexMap = new Map<string, { latex: string; displayMode: boolean }>();
  let processed = text;
  let placeholderIndex = 0;

  // Protect block math ($$...$$)
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_match, latex) => {
    const placeholder = `%%%LATEX_BLOCK_${placeholderIndex}%%%`;
    latexMap.set(placeholder, { latex: latex.trim(), displayMode: true });
    placeholderIndex++;
    return placeholder;
  });

  // Protect inline math ($...$) but not when preceded by backslash (escaped $)
  processed = processed.replace(/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g, (match, latex) => {
    // Skip if this looks like currency (short, no spaces around, or ends with currency-like patterns)
    if (latex.length <= 2 && !/[0-9]/.test(latex)) {
      return match; // Keep original for currency-like patterns
    }
    const placeholder = `%%%LATEX_INLINE_${placeholderIndex}%%%`;
    latexMap.set(placeholder, { latex: latex.trim(), displayMode: false });
    placeholderIndex++;
    return placeholder;
  });

  return { processed, latexMap };
}

/**
 * Restore LaTeX placeholders with rendered KaTeX HTML
 * Note: Uses renderLatexSync() which requires KaTeX to be pre-loaded via ensureMarkdownDependencies()
 */
function restoreLatexPlaceholders(
  html: string,
  latexMap: Map<string, { latex: string; displayMode: boolean }>
): string {
  let restored = html;

  for (const [placeholder, { latex, displayMode }] of latexMap) {
    const rendered = renderLatexSync(latex, displayMode);
    restored = restored.replace(placeholder, rendered);
  }

  return restored;
}

// Counter for unique mermaid diagram IDs
let mermaidCounter = 0;

// Cache for mermaid config to avoid recalculating
let cachedMermaidConfig: ReturnType<typeof getMermaidTheme> | null = null;

// Debounce timer for theme changes
let themeChangeTimeout: ReturnType<typeof setTimeout> | null = null;

// Track which diagrams have been rendered to avoid re-rendering
const renderedDiagrams = new Set<string>();

// Custom renderer for code blocks
const renderer = new marked.Renderer();

renderer.code = function (code: { text: string; lang?: string; escaped?: boolean }) {
  const validLanguage = code.lang || 'text';

  // Check if this is a mermaid diagram
  if (validLanguage === 'mermaid') {
    const diagramId = `mermaid-diagram-${mermaidCounter++}`;

    // Use code.text directly - Mermaid will parse and sanitize the diagram content
    // The rendered SVG will be sanitized with DOMPurify before insertion
    const mermaidCode = code.text;

    // Use data-mermaid attribute for Mermaid v11
    return `
      <div class="relative group my-4">
        <div class="flex items-center justify-between px-4 py-2 bg-purple-500/10 rounded-t-lg border-b border-purple-500/20">
          <span class="text-xs font-mono text-purple-400">Mermaid Diagram</span>
        </div>
        <div class="p-4 rounded-b-lg bg-muted/30 flex justify-center">
          <pre class="mermaid" data-mermaid="${diagramId}" style="background: transparent;">${mermaidCode}</pre>
        </div>
      </div>
    `;
  }

  // For other code blocks, escape HTML to prevent XSS
  const escapedCode = code.escaped ? code.text : escapeHtml(code.text);
  const escapedLanguage = escapeHtml(validLanguage);

  // Create styled code block with language label
  return `
    <div class="relative group my-4">
      <div class="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-t-lg border-b border-border">
        <span class="text-xs font-mono text-muted-foreground">${escapedLanguage}</span>
      </div>
      <pre class="overflow-x-auto p-4 rounded-b-lg bg-muted/30"><code class="language-${escapedLanguage}">${escapedCode}</code></pre>
    </div>
  `;
};

marked.setOptions({ renderer });

/**
 * Detect current theme (dark or light)
 * Uses Tailwind's dark mode class detection
 */
function detectTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light';
  // Check for Tailwind dark mode class
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Get Mermaid theme configuration based on current theme
 */
function getMermaidTheme() {
  const theme = detectTheme();

  if (theme === 'dark') {
    return {
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'strict',
      themeVariables: {
        // Dark mode colors - optimized for visibility on dark backgrounds
        // Start/Stop nodes (rounded rectangles) - Green for start, Red for stop
        primaryColor: '#22c55e', // green-500 (START nodes)
        primaryTextColor: '#ffffff', // white
        primaryBorderColor: '#4ade80', // green-400

        // Decision nodes (diamonds) - Amber/Yellow for high contrast
        secondaryColor: '#f59e0b', // amber-500
        secondaryTextColor: '#ffffff', // white
        secondaryBorderColor: '#fbbf24', // amber-400

        // Process nodes (rectangles) - Indigo
        tertiaryColor: '#6366f1', // indigo-500
        tertiaryTextColor: '#ffffff', // white
        tertiaryBorderColor: '#818cf8', // indigo-400

        lineColor: '#94a3b8', // slate-400
        background: '#0f172a', // slate-900

        // Main background for regular nodes
        mainBkg: '#6366f1', // indigo-500
        mainTextColor: '#ffffff', // white
        nodeBorder: '#818cf8', // indigo-400

        // Cluster backgrounds
        clusterBkg: '#1e293b80', // slate-800 with opacity
        clusterBorder: '#475569', // slate-600

        titleColor: '#f1f5f9', // slate-100
        edgeLabelBackground: '#1e293b', // slate-800
        edgeLabelTextColor: '#f1f5f9', // slate-100

        actorBkg: '#3b82f6', // blue-500
        actorBorder: '#60a5fa', // blue-400
        actorTextColor: '#ffffff', // white
        actorLineColor: '#94a3b8', // slate-400

        signalColor: '#94a3b8', // slate-400
        signalTextColor: '#f1f5f9', // slate-100

        labelBoxBkgColor: '#1e293b', // slate-800
        labelBoxBorderColor: '#475569', // slate-600
        labelTextColor: '#f1f5f9', // slate-100

        loopTextColor: '#f1f5f9', // slate-100

        noteBorderColor: '#f59e0b', // amber-500
        noteBkgColor: '#451a0310', // amber-950 with low opacity
        noteTextColor: '#fef3c7', // amber-100

        activationBorderColor: '#6366f1', // indigo-500
        activationBkgColor: '#6366f120', // indigo-500 with opacity

        sequenceNumberColor: '#f8fafc', // slate-50

        // End node specific styling
        endColor: '#ef4444', // red-500 (END nodes)
        endTextColor: '#ffffff', // white
      },
    };
  }

  // Light mode theme
  return {
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'strict',
    themeVariables: {
      // Light mode colors - high contrast for all node types

      // Start/Stop nodes (rounded rectangles) - Green for start, Red for stop
      primaryColor: '#22c55e', // green-500 (START nodes)
      primaryTextColor: '#ffffff', // white
      primaryBorderColor: '#16a34a', // green-600

      // Decision nodes (diamonds) - Amber/Yellow for high contrast
      secondaryColor: '#f59e0b', // amber-500
      secondaryTextColor: '#ffffff', // white
      secondaryBorderColor: '#d97706', // amber-600

      // Process nodes (rectangles) - Indigo
      tertiaryColor: '#6366f1', // indigo-500
      tertiaryTextColor: '#ffffff', // white
      tertiaryBorderColor: '#4f46e5', // indigo-600

      lineColor: '#64748b', // slate-500
      background: '#ffffff',

      // Main background for regular nodes
      mainBkg: '#6366f1', // indigo-500
      mainTextColor: '#ffffff', // white
      nodeBorder: '#4f46e5', // indigo-600

      // Cluster backgrounds
      clusterBkg: '#f1f5f980', // slate-100 with opacity
      clusterBorder: '#cbd5e1', // slate-300

      titleColor: '#0f172a', // slate-900
      edgeLabelBackground: '#f8fafc', // slate-50
      edgeLabelTextColor: '#0f172a', // slate-900

      actorBkg: '#3b82f6', // blue-500
      actorBorder: '#2563eb', // blue-600
      actorTextColor: '#ffffff', // white
      actorLineColor: '#64748b', // slate-500

      signalColor: '#64748b', // slate-500
      signalTextColor: '#0f172a', // slate-900

      labelBoxBkgColor: '#f8fafc', // slate-50
      labelBoxBorderColor: '#e2e8f0', // slate-200
      labelTextColor: '#0f172a', // slate-900

      loopTextColor: '#0f172a', // slate-900

      noteBorderColor: '#f59e0b', // amber-500
      noteBkgColor: '#fef3c7', // amber-100
      noteTextColor: '#78350f', // amber-900

      activationBorderColor: '#6366f1', // indigo-500
      activationBkgColor: '#e0e7ff20', // indigo-100 with low opacity

      sequenceNumberColor: '#0f172a', // slate-900

      // End node specific styling
      endColor: '#ef4444', // red-500 (END nodes)
      endTextColor: '#ffffff', // white
    },
  };
}

/**
 * Initialize Mermaid diagrams after rendering
 * This should be called after the DOM is updated
 * Note: This will lazy-load Mermaid if not already loaded
 * OPTIMIZED: Caches config, tracks rendered diagrams, debounces theme changes
 */
export async function initMermaidDiagrams() {
  const mermaidWindow = getMermaidWindow();

  // Load Mermaid if not already loaded
  // Check for window.mermaid directly instead of isMermaidLoaded()
  // because isMermaidLoaded() returns true when load promise is created,
  // not when mermaid is actually available
  if (mermaidWindow && !mermaidWindow.mermaid) {
    try {
      await loadMermaid();
      // Wait a bit for mermaid to be fully ready
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      const isDev = import.meta.env?.DEV ?? process.env?.NODE_ENV === 'development';
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      if (isDev) {
        console.error('Failed to load Mermaid:', error);
      } else {
        console.error(`Failed to load Mermaid: ${errorName}`);
      }
      return;
    }
  }

  if (mermaidWindow && mermaidWindow.mermaid) {
    const mermaid = mermaidWindow.mermaid;

    // Find all mermaid diagrams in the DOM
    const diagrams = document.querySelectorAll('pre.mermaid[data-mermaid]');

    if (diagrams.length === 0) {
      return;
    }

    // Detect current theme
    const currentTheme = detectTheme();
    const previousTheme = mermaidWindow.mermaidTheme;

    // Re-initialize if theme changed
    if (previousTheme && previousTheme !== currentTheme) {
      // Clear previous initialization and cache
      if (mermaidWindow.mermaidInitialized) {
        // In Mermaid v11, we need to use run() to reinitialize
        try {
          await mermaid.run({
            querySelector: 'pre.mermaid[data-mermaid]',
          });
        } catch {
          // If run fails, fall back to full reinitialize
          await mermaid.initialize({ startOnLoad: false });
        }
        mermaidWindow.mermaidInitialized = false;
        cachedMermaidConfig = null;
        renderedDiagrams.clear();
      }
    }

    // Initialize mermaid with current theme if not already initialized
    if (!mermaidWindow.mermaidInitialized) {
      // Use cached config if available
      const config = cachedMermaidConfig || getMermaidTheme();
      cachedMermaidConfig = config;

      try {
        await mermaid.initialize(config);
        mermaidWindow.mermaidInitialized = true;
        mermaidWindow.mermaidTheme = currentTheme;
      } catch (error) {
        const isDev = import.meta.env?.DEV ?? process.env?.NODE_ENV === 'development';
        if (isDev) {
          console.error('Failed to initialize Mermaid:', error);
        } else {
          console.error('Failed to initialize Mermaid');
        }
        return;
      }
    }

    // Render each diagram individually (skip already rendered)
    const diagramArray = Array.from(diagrams);
    for (const diagram of diagramArray) {
      const diagramId = diagram.getAttribute('data-mermaid');

      // Skip if already rendered (performance optimization)
      if (diagramId && renderedDiagrams.has(diagramId)) {
        continue;
      }

      try {
        const definition = diagram.textContent || '';
        const id = diagramId || `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Create SVG from mermaid definition
        // In Mermaid v11, render() returns { svg } and handles the element replacement
        const { svg } = await mermaid.render(id, definition);

        // Sanitize SVG with DOMPurify before inserting (defense in depth)
        // Mermaid is configured with securityLevel: 'strict', but we add an extra layer of protection
        const sanitizedSvg = DOMPurify.sanitize(svg, {
          ADD_TAGS: [
            'svg',
            'path',
            'g',
            'rect',
            'circle',
            'text',
            'line',
            'polygon',
            'polyline',
            'ellipse',
            'foreignObject',
          ],
          ADD_ATTR: [
            'viewBox',
            'xmlns',
            'width',
            'height',
            'd',
            'fill',
            'stroke',
            'stroke-width',
            'x',
            'y',
            'cx',
            'cy',
            'r',
            'rx',
            'ry',
            'transform',
            'text-anchor',
            'font-family',
            'font-size',
            'font-weight',
            'dominant-baseline',
            'alignment-baseline',
            'points',
            'class',
            'style',
          ],
        });

        // Replace the pre element with the sanitized SVG
        diagram.outerHTML = `<div class="flex justify-center items-center p-4 rounded-b-lg bg-muted/30">${sanitizedSvg}</div>`;

        // Mark as rendered
        if (diagramId) {
          renderedDiagrams.add(diagramId);
        }
      } catch (error) {
        // Sanitized logging: only log error type in production, full details in development
        const isDev = import.meta.env?.DEV ?? process.env?.NODE_ENV === 'development';
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        if (isDev) {
          console.error('Failed to render mermaid diagram:', error);
        } else {
          console.error(`Failed to render mermaid diagram: ${errorName}`);
        }

        // Get error message (first line only for cleaner display)
        let errorMessage = 'Unable to render diagram';
        if (error instanceof Error) {
          errorMessage = error.message.split('\n')[0];
        }

        // Get original diagram code for reference
        const originalCode = diagram.textContent || '';

        // Replace entire pre element (not innerHTML) to prevent Mermaid from re-parsing error message
        // Using outerHTML ensures the mermaid class and data-mermaid attribute are removed
        diagram.outerHTML = `
          <div class="diagram-error">
            <details class="group" open>
              <summary class="cursor-pointer text-destructive font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span>Diagram rendering failed: ${escapeHtml(errorMessage)}</span>
              </summary>
              <div class="mt-3">
                <p class="text-sm text-muted-foreground mb-2">The mermaid diagram could not be rendered. This may be due to:</p>
                <ul class="text-sm text-muted-foreground list-disc list-inside mb-3 space-y-1">
                  <li>Incompatible syntax with Mermaid v11.12.2</li>
                  <li>Special characters in node labels that conflict with Mermaid keywords</li>
                  <li>Invalid diagram structure</li>
                  <li>Try using <code class="bg-muted px-1 rounded">text:</code> for labels with special characters</li>
                </ul>
                <div class="text-xs text-muted-foreground mb-1">Original diagram code:</div>
                <pre class="overflow-x-auto p-3 rounded bg-black/5 dark:bg-black/30 text-xs font-mono border border-border">${escapeHtml(originalCode)}</pre>
              </div>
            </details>
          </div>
        `;
      }
    }
  }
}

/**
 * Force re-render all Mermaid diagrams with current theme
 * Call this when the app theme changes
 * OPTIMIZED: Clears cache and rendered diagram tracking
 */
export async function reinitMermaidDiagrams() {
  const mermaidWindow = getMermaidWindow();
  if (mermaidWindow) {
    // Reset initialization state to force re-init with new theme
    mermaidWindow.mermaidInitialized = false;
    mermaidWindow.mermaidTheme = undefined;
    cachedMermaidConfig = null;
    renderedDiagrams.clear();
    await initMermaidDiagrams();
  }
}

/**
 * Ensure all markdown rendering dependencies are loaded
 * This function pre-loads KaTeX and Mermaid to avoid lazy-loading during rendering
 * Call this before rendering markdown with LaTeX or Mermaid diagrams
 * @returns Promise that resolves when all dependencies are loaded
 */
export async function ensureMarkdownDependencies(): Promise<void> {
  // Prevent concurrent loading
  if (markdownDependenciesLoaded) {
    return;
  }

  if (markdownDependenciesLoading) {
    // Wait for existing load to complete (poll every 50ms)
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (markdownDependenciesLoaded) {
          clearInterval(checkInterval);
          resolve();
        } else if (!markdownDependenciesLoading) {
          clearInterval(checkInterval);
          reject(new Error('Markdown dependencies loading failed'));
        }
      }, 50);
    });
  }

  markdownDependenciesLoading = true;

  try {
    // Load KaTeX and CSS if not already loaded
    if (!cachedKatex && !katexLoadInProgress) {
      katexLoadInProgress = loadKatex();
      try {
        cachedKatex = await katexLoadInProgress;
      } finally {
        // Always clear the in-progress flag, even on failure
        katexLoadInProgress = null;
      }
    } else if (katexLoadInProgress) {
      // Wait for existing load to complete
      try {
        cachedKatex = await katexLoadInProgress;
      } catch {
        // If load failed and initiator didn't clean up, reset for retry
        katexLoadInProgress = null;
        throw new Error('KaTeX load failed');
      }
    }

    // Load KaTeX CSS (using static import)
    await loadKatexCss();

    // Load Mermaid if not already loaded
    const mermaidWindow = getMermaidWindow();
    if (mermaidWindow && !mermaidWindow.mermaid) {
      await loadMermaid();
    }

    // Mark as loaded
    markdownDependenciesLoaded = true;
  } catch (error) {
    markdownDependenciesLoading = false;
    const isDev = import.meta.env?.DEV ?? process.env?.NODE_ENV === 'development';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    if (isDev) {
      console.error('Failed to load markdown dependencies:', error);
    } else {
      console.error(`Failed to load markdown dependencies: ${errorName}`);
    }
    throw error;
  } finally {
    markdownDependenciesLoading = false;
  }
}

/**
 * Setup theme change observer for Mermaid diagrams
 * Automatically re-renders diagrams when the theme changes
 * OPTIMIZED: Uses debouncing to prevent excessive re-renders
 */
export function setupMermaidThemeObserver() {
  const mermaidWindow = getMermaidWindow();
  if (!mermaidWindow) return;

  // Avoid setting up multiple observers
  if (mermaidWindow.mermaidThemeObserverSetup) {
    return;
  }
  mermaidWindow.mermaidThemeObserverSetup = true;

  // Use MutationObserver to watch for class changes on the html element
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const currentTheme = detectTheme();
        const previousTheme = mermaidWindow.mermaidTheme;

        // Re-render diagrams only if theme actually changed
        if (previousTheme && previousTheme !== currentTheme) {
          // Clear existing timeout (debounce)
          if (themeChangeTimeout) {
            clearTimeout(themeChangeTimeout);
          }

          // Debounce theme change to prevent excessive re-renders
          themeChangeTimeout = setTimeout(async () => {
            // Find all rendered Mermaid SVGs
            const svgContainers = document.querySelectorAll('.bg-muted\\/30 svg[id^="mermaid-"]');

            if (svgContainers.length > 0) {
              await reinitMermaidDiagrams();
            }
          }, 150); // 150ms debounce delay
        }
      }
    }
  });

  // Observe the html element for class changes
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  // Store observer for cleanup if needed
  mermaidWindow.mermaidThemeObserver = observer;
}

/**
 * Render markdown to HTML (synchronous)
 * Supports LaTeX math rendering with KaTeX
 * Note: marked.parse returns Promise in v17+, but we use marked.parse() for backward compat
 */
export function renderMarkdownSync(markdown: string): string {
  if (!markdown) return '';

  try {
    // Step 1: Protect LaTeX delimiters before markdown parsing
    const { processed: protectedMarkdown, latexMap } = protectLatexDelimiters(markdown);

    // Step 2: Parse markdown to HTML
    const tokens = marked.lexer(protectedMarkdown);
    let html = marked.parser(tokens);

    // Step 3: Restore LaTeX placeholders with rendered KaTeX (before sanitize)
    html = restoreLatexPlaceholders(html, latexMap);

    // Step 4: Sanitize HTML to prevent XSS
    // Use default tags + add KaTeX specific tags and Mermaid SVG tags
    return DOMPurify.sanitize(html, {
      // Keep all default DOMPurify tags, and add KaTeX/Mermaid specific ones
      ADD_TAGS: [
        // MathML elements for KaTeX
        'math',
        'semantics',
        'mrow',
        'mi',
        'mn',
        'mo',
        'mtext',
        'mspace',
        'mpadded',
        'mfrac',
        'msqrt',
        'mroot',
        'mstyle',
        'msub',
        'msup',
        'msubsup',
        'munder',
        'mover',
        'munderover',
        'mtable',
        'mtr',
        'mtd',
        'annotation',
        'annotation-xml',
        'mglyph',
        'none',
        'merror',
        'mphantom',
        'mprescripts',
        'ms',
        'maligngroup',
        'malignmark',
        'mlongdiv',
        'mscarries',
        'mscarry',
        'msgroup',
        'msline',
        'msrow',
        'mspace',
        'mstack',
        'msqrt',
        'mstyle',
        'msub',
        'msup',
        'msubsup',
        'munder',
        'mover',
        'munderover',
        // SVG and Mermaid elements
        'svg',
        'path',
        'g',
        'rect',
        'circle',
        'text',
        'line',
        'polygon',
        'polyline',
        'ellipse',
        'foreignObject',
      ],
      // Add KaTeX specific attributes
      ADD_ATTR: [
        'class',
        'style',
        'xmlns',
        'viewBox',
        'width',
        'height',
        'd',
        'stroke',
        'fill',
        'stroke-width',
        'x1',
        'y1',
        'x2',
        'y2',
        'encoding',
        'x',
        'y',
        'textlength',
        'id',
        'data-mermaid',
        'role',
        'rx',
        'ry',
        'cx',
        'cy',
        'r',
        'transform',
        'font-family',
        'font-size',
        'font-weight',
        'text-anchor',
        'dominant-baseline',
        'alignment-baseline',
        'points',
        'pathLength',
        // MathML attributes
        'display',
        'mode',
        'scriptlevel',
        'background',
        'color',
        'dir',
        'fontfamily',
        'fontsize',
        'fontstyle',
        'fontweight',
        'height',
        'linebreak',
        'lspace',
        'mathbackground',
        'mathcolor',
        'mathsize',
        'mathvariant',
        'maxsize',
        'minsize',
        'rowalign',
        'rowspacing',
        'rspace',
        'width',
        'columnalign',
        'columnlines',
        'columnspacing',
        'columnwidth',
        'rowlines',
        'rowspacing',
        'align',
        'shift',
        'selection',
        'span',
        'stretchy',
        'symmetric',
        'voffset',
        'lspace',
        'rspace',
        'form',
        'fence',
        'separator',
        'notation',
        'groupalign',
        'crossout',
        'position',
        'accent',
        'accentunder',
        'align',
        'bevelled',
        'linethickness',
        'numalign',
        'denomalign',
        'subscriptshift',
        'superscriptshift',
        'accent',
        'accentunder',
        'align',
        'dir',
        'torsion',
        'width',
        'height',
        'depth',
        'lquote',
        'rquote',
        'maxwidth',
        'minsize',
        'rspace',
        'lspace',
        'definitionURL',
        'encoding',
        'cd',
        'name',
        'src',
        'altimg',
        'altimg-width',
        'altimg-height',
        'altimg-valign',
        'fontfamily',
        'index',
        'lowlim',
        'uplim',
        'veryverythinmathspace',
        'verythinmathspace',
        'thinmathspace',
        'mediummathspace',
        'thickmathspace',
        'verythickmathspace',
        'veryverythickmathspace',
        'negativeveryverythinmathspace',
        'negativeverythinmathspace',
        'negativethinmathspace',
        'negativemediummathspace',
        'negativethickmathspace',
        'negativeverythickmathspace',
        'negativeveryverythickmathspace',
        'maxlabelwidth',
        'side',
        'position',
        'shift',
        'selection',
        'span',
        'stretchy',
        'symmetric',
        'voffset',
        'xlink:href',
        'xlink:title',
        'xlink:role',
        'xlink:type',
        'xml:space',
        'xmlns:xlink',
      ],
      // Allow data:* attributes for KaTeX
      ALLOW_DATA_ATTR: true,
      // Allow unknown protocols for data URIs
      ALLOW_UNKNOWN_PROTOCOLS: true,
      // Allow namespaced attributes (xlink, xml, xmlns)
      ALLOWED_NAMESPACES: ['http://www.w3.org/1999/xhtml', 'http://www.w3.org/2000/svg'],
    });
  } catch (error) {
    // Sanitized logging: only log error type in production, full details in development
    const isDev = import.meta.env?.DEV ?? process.env?.NODE_ENV === 'development';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    if (isDev) {
      console.error('Markdown parsing error:', error);
    } else {
      console.error(`Markdown parsing error: ${errorName}`);
    }
    return `<p>${escapeHtml(markdown)}</p>`;
  }
}
