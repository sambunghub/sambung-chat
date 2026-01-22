// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session?: import('better-auth').Session;
      user?: import('better-auth').User;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  // Declare Vite environment variables for TypeScript
  interface ImportMetaEnv {
    readonly PUBLIC_API_URL: string;
    readonly PUBLIC_SERVER_URL: string;
  }

  /**
   * Mermaid global object (loaded from CDN)
   * Minimal type definition for the Mermaid library
   */
  interface Window {
    mermaid?: {
      initialize: (config: any) => Promise<void>;
      render: (id: string, text: string) => Promise<{ svg: string }>;
    };

    /**
     * Track Mermaid initialization state
     */
    mermaidInitialized?: boolean;

    /**
     * Track current Mermaid theme ('dark' | 'light')
     */
    mermaidTheme?: 'dark' | 'light';

    /**
     * Track if Mermaid theme change observer is set up
     */
    mermaidThemeObserverSetup?: boolean;

    /**
     * Store the MutationObserver for Mermaid theme changes
     */
    mermaidThemeObserver?: MutationObserver;
  }
}

export {};
