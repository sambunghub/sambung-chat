/**
 * Lazy Loading Utility for KaTeX and Mermaid
 *
 * Dynamically loads heavy dependencies only when needed, reducing initial bundle size.
 * Uses promise caching to ensure each library is loaded only once.
 */

/**
 * Cached promises for loaded libraries
 */
const cachedLoads = {
  katex: null as Promise<typeof import('katex')> | null,
  mermaid: null as Promise<void> | null,
  katexCss: null as Promise<void> | null,
};

/**
 * Dynamically load KaTeX library
 * @returns Promise that resolves with the katex module
 */
export async function loadKatex(): Promise<typeof import('katex')> {
  if (cachedLoads.katex) {
    return cachedLoads.katex;
  }

  cachedLoads.katex = (async () => {
    try {
      // Dynamically import katex
      const katex = await import('katex');
      return katex;
    } catch (error) {
      cachedLoads.katex = null;
      throw new Error(
        `Failed to load KaTeX: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  })();

  return cachedLoads.katex;
}

/**
 * Dynamically load KaTeX CSS
 * @returns Promise that resolves when CSS is loaded
 */
export async function loadKatexCss(): Promise<void> {
  if (cachedLoads.katexCss) {
    return cachedLoads.katexCss;
  }

  cachedLoads.katexCss = (async () => {
    try {
      // Create and inject link element for KaTeX CSS
      if (typeof document === 'undefined') {
        throw new Error('Cannot load CSS outside browser environment');
      }

      // Check if already loaded
      const existingLink = document.querySelector('link[href*="katex.min.css"]');
      if (existingLink) {
        return;
      }

      // Use CDN for KaTeX CSS (works in both dev and production)
      // Match katex package version (v0.16.x)
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'; // Using 0.16.11 for compatibility
      link.crossOrigin = 'anonymous';

      // Wait for load
      const loadPromise = new Promise<void>((resolve, reject) => {
        link.onload = () => resolve();
        link.onerror = () => reject(new Error('Failed to load KaTeX CSS'));
      });

      document.head.appendChild(link);
      await loadPromise;
    } catch (error) {
      cachedLoads.katexCss = null;
      throw new Error(
        `Failed to load KaTeX CSS: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  })();

  return cachedLoads.katexCss;
}

/**
 * Load both KaTeX library and its CSS
 * @returns Promise that resolves with the katex module
 */
export async function loadKatexWithCss(): Promise<typeof import('katex')> {
  await loadKatexCss();
  return loadKatex();
}

/**
 * Dynamically load Mermaid from CDN
 * @returns Promise that resolves when mermaid is available on window
 */
export async function loadMermaid(): Promise<void> {
  if (cachedLoads.mermaid) {
    return cachedLoads.mermaid;
  }

  cachedLoads.mermaid = (async () => {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Cannot load Mermaid outside browser environment');
      }

      // Check if already loaded
      if ((window as any).mermaid) {
        return;
      }

      // Inject Mermaid script tag
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
      script.async = true;

      // Wait for load with polling for mermaid readiness
      const loadPromise = new Promise<void>((resolve, reject) => {
        const timeoutMs = 5000; // 5 second timeout
        const pollIntervalMs = 50; // Check every 50ms
        const startTime = Date.now();

        script.onload = () => {
          // Poll for mermaid availability instead of fixed setTimeout
          const pollForMermaid = () => {
            const elapsed = Date.now() - startTime;

            // Check timeout
            if (elapsed > timeoutMs) {
              reject(new Error('Mermaid load timeout: mermaid not available after 5 seconds'));
              return;
            }

            // Check if mermaid is available
            if ((window as any).mermaid) {
              resolve();
            } else {
              // Continue polling
              setTimeout(pollForMermaid, pollIntervalMs);
            }
          };

          // Start polling
          pollForMermaid();
        };
        script.onerror = () => reject(new Error('Failed to load Mermaid script'));
      });

      document.head.appendChild(script);
      await loadPromise;
    } catch (error) {
      cachedLoads.mermaid = null;
      throw new Error(
        `Failed to load Mermaid: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  })();

  return cachedLoads.mermaid;
}

/**
 * Load all markdown dependencies (KaTeX and Mermaid)
 * Use this function to ensure all dependencies are ready before rendering markdown
 * @returns Promise that resolves when all dependencies are loaded
 */
export async function loadMarkdownDependencies(): Promise<{
  katex: typeof import('katex');
  mermaid: void;
}> {
  const [katex, mermaid] = await Promise.all([loadKatexWithCss(), loadMermaid()]);
  return { katex, mermaid };
}

/**
 * Check if KaTeX is loaded
 */
export function isKatexLoaded(): boolean {
  return cachedLoads.katex !== null;
}

/**
 * Check if Mermaid is loaded
 */
export function isMermaidLoaded(): boolean {
  return cachedLoads.mermaid !== null;
}

/**
 * Reset cached loads (useful for testing or error recovery)
 */
export function resetLazyLoads(): void {
  cachedLoads.katex = null;
  cachedLoads.mermaid = null;
  cachedLoads.katexCss = null;
}
