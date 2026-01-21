import { writable } from 'svelte/store';

/**
 * Secondary Sidebar State Store
 *
 * Controls the visibility of the secondary sidebar (context-aware sidebar)
 * This is separate from the main navigation rail sidebar
 */
function createSecondarySidebarStore() {
  const { subscribe, set, update } = writable(true);

  return {
    subscribe,
    toggle: () => update((n) => !n),
    open: () => set(true),
    close: () => set(false),
  };
}

export const secondarySidebarStore = createSecondarySidebarStore();
