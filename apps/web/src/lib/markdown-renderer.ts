/**
 * Markdown Renderer with Syntax Highlighting, Mermaid, and LaTeX Support
 *
 * Uses marked for parsing and basic code formatting
 * Supports Mermaid diagrams for flowcharts, sequence diagrams, etc.
 * Supports LaTeX math rendering with KaTeX
 */

import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import katex from 'katex';

/**
 * Configure marked renderer with basic code styling
 */
marked.setOptions({
  breaks: true,
  gfm: true,
});

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
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Render LaTeX math to HTML using KaTeX
 */
function renderLatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
      macros: {
        '\\R': '\\mathbb{R}',
      },
    });
  } catch (error) {
    console.error('LaTeX rendering error:', error);
    return `<span class="text-red-500" title="LaTeX error: ${error instanceof Error ? error.message : 'Unknown error'}">\\(${latex}\\)</span>`;
  }
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
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
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
 */
function restoreLatexPlaceholders(
  html: string,
  latexMap: Map<string, { latex: string; displayMode: boolean }>
): string {
  let restored = html;

  for (const [placeholder, { latex, displayMode }] of latexMap) {
    const rendered = renderLatex(latex, displayMode);
    restored = restored.replace(placeholder, rendered);
  }

  return restored;
}

// Counter for unique mermaid diagram IDs
let mermaidCounter = 0;

// Custom renderer for code blocks
const renderer = new marked.Renderer();

renderer.code = function (code: { text: string; lang?: string; escaped?: boolean }) {
  const validLanguage = code.lang || 'text';
  const escapedCode = code.escaped ? code.text : escapeHtml(code.text);

  // Check if this is a mermaid diagram
  if (validLanguage === 'mermaid') {
    const diagramId = `mermaid-diagram-${mermaidCounter++}`;
    // Use data-mermaid attribute for Mermaid v11
    return `
      <div class="relative group my-4">
        <div class="flex items-center justify-between px-4 py-2 bg-purple-500/10 rounded-t-lg border-b border-purple-500/20">
          <span class="text-xs font-mono text-purple-400">Mermaid Diagram</span>
        </div>
        <div class="p-4 rounded-b-lg bg-muted/30 flex justify-center">
          <pre class="mermaid" data-mermaid="${diagramId}" style="background: transparent;">${escapedCode}</pre>
        </div>
      </div>
    `;
  }

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
      securityLevel: 'loose',
      themeVariables: {
        // Dark mode colors - optimized for visibility on dark backgrounds
        primaryColor: '#6366f1', // indigo-500
        primaryTextColor: '#f8fafc', // slate-50
        primaryBorderColor: '#818cf8', // indigo-400
        lineColor: '#94a3b8', // slate-400
        secondaryColor: '#8b5cf6', // violet-500
        tertiaryColor: '#1e293b', // slate-800
        background: '#0f172a', // slate-900
        mainBkg: '#1e293b', // slate-800
        nodeBorder: '#475569', // slate-600
        clusterBkg: '#1e293b80', // slate-800 with opacity
        clusterBorder: '#475569', // slate-600
        titleColor: '#f1f5f9', // slate-100
        edgeLabelBackground: '#1e293b', // slate-800
        actorBkg: '#1e293b', // slate-800
        actorBorder: '#64748b', // slate-500
        actorTextColor: '#f1f5f9', // slate-100
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
      },
    };
  }

  // Light mode theme
  return {
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    themeVariables: {
      // Light mode colors
      primaryColor: '#6366f1', // indigo-500
      primaryTextColor: '#0f172a', // slate-900
      primaryBorderColor: '#4f46e5', // indigo-600
      lineColor: '#64748b', // slate-500
      secondaryColor: '#8b5cf6', // violet-500
      tertiaryColor: '#f1f5f9', // slate-100
      background: '#ffffff',
      mainBkg: '#f8fafc', // slate-50
      nodeBorder: '#e2e8f0', // slate-200
      clusterBkg: '#f1f5f980', // slate-100 with opacity
      clusterBorder: '#cbd5e1', // slate-300
      titleColor: '#0f172a', // slate-900
      edgeLabelBackground: '#f8fafc', // slate-50
      actorBkg: '#f8fafc', // slate-50
      actorBorder: '#94a3b8', // slate-400
      actorTextColor: '#0f172a', // slate-900
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
    },
  };
}

/**
 * Initialize Mermaid diagrams after rendering
 * This should be called after the DOM is updated
 */
export async function initMermaidDiagrams() {
  if (typeof window !== 'undefined' && (window as any).mermaid) {
    const mermaid = (window as any).mermaid;

    // Find all mermaid diagrams in the DOM
    const diagrams = document.querySelectorAll('pre.mermaid[data-mermaid]');

    if (diagrams.length === 0) {
      return;
    }

    // Detect current theme
    const currentTheme = detectTheme();
    const previousTheme = (window as any).mermaidTheme;

    // Re-initialize if theme changed
    if (previousTheme !== currentTheme) {
      // Clear previous initialization
      if ((window as any).mermaidInitialized) {
        await mermaid.initialize({ startOnLoad: false });
        (window as any).mermaidInitialized = false;
      }
    }

    // Initialize mermaid with current theme if not already initialized
    if (!(window as any).mermaidInitialized) {
      await mermaid.initialize(getMermaidTheme());
      (window as any).mermaidInitialized = true;
      (window as any).mermaidTheme = currentTheme;
    }

    // Render each diagram individually
    for (const diagram of diagrams) {
      try {
        const definition = diagram.textContent || '';
        const id =
          diagram.getAttribute('data-mermaid') ||
          `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Create SVG from mermaid definition
        const { svg } = await mermaid.render(id, definition);

        // Replace the pre element with the SVG
        diagram.outerHTML = `<div class="flex justify-center items-center p-4 rounded-b-lg bg-muted/30">${svg}</div>`;
      } catch (error) {
        console.error('Failed to render mermaid diagram:', error);
        diagram.innerHTML = `<p class="text-red-500">Failed to render diagram. Check syntax.</p>`;
      }
    }
  }
}

/**
 * Force re-render all Mermaid diagrams with current theme
 * Call this when the app theme changes
 */
export async function reinitMermaidDiagrams() {
  if (typeof window !== 'undefined') {
    // Reset initialization state to force re-init with new theme
    (window as any).mermaidInitialized = false;
    (window as any).mermaidTheme = undefined;
    await initMermaidDiagrams();
  }
}

/**
 * Setup theme change observer for Mermaid diagrams
 * Automatically re-renders diagrams when the theme changes
 */
export function setupMermaidThemeObserver() {
  if (typeof window === 'undefined') return;

  // Avoid setting up multiple observers
  if ((window as any).mermaidThemeObserverSetup) {
    return;
  }
  (window as any).mermaidThemeObserverSetup = true;

  // Use MutationObserver to watch for class changes on the html element
  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const currentTheme = detectTheme();
        const previousTheme = (window as any).mermaidTheme;

        // Re-render diagrams only if theme actually changed
        if (previousTheme && previousTheme !== currentTheme) {
          // Small delay to ensure CSS has been applied
          setTimeout(async () => {
            // Find all rendered Mermaid SVGs
            const svgContainers = document.querySelectorAll('.bg-muted\\/30 svg[id^="mermaid-"]');

            if (svgContainers.length > 0) {
              await reinitMermaidDiagrams();
            }
          }, 50);
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
  (window as any).mermaidThemeObserver = observer;
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
        'mglyph',
        'none',
        'foreignObject', // For Mermaid SVG text content
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
      ],
      // Allow data:* attributes for KaTeX
      ALLOW_DATA_ATTR: true,
      // Allow unknown protocols for data URIs
      ALLOW_UNKNOWN_PROTOCOLS: true,
    });
  } catch (error) {
    console.error('Markdown parsing error:', error);
    return `<p>${escapeHtml(markdown)}</p>`;
  }
}
