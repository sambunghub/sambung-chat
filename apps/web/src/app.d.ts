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
}

export {};
