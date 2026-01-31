/**
 * Chat Bubble View Mode Store
 *
 * Manages the chat bubble view mode preference (flat vs rounded).
 * Persists to localStorage for user preference retention.
 */

import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';

type ViewMode = 'flat' | 'rounded';

interface ChatViewModeStore extends Writable<ViewMode> {
  toggle: () => void;
}

const STORAGE_KEY = 'chatBubbleMode';

// Initial view mode
function getInitialViewMode(): ViewMode {
  if (!browser) return 'flat';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'flat' || stored === 'rounded') {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read chat bubble mode from localStorage:', error);
  }

  return 'flat'; // default
}

// Create writable store
function createChatViewModeStore(): ChatViewModeStore {
  const { set, update, subscribe } = writable<ViewMode>(getInitialViewMode());

  if (browser) {
    // Subscribe to changes and save to localStorage
    subscribe((value) => {
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch (error) {
        console.warn('Failed to save chat bubble mode to localStorage:', error);
      }
    });
  }

  return {
    set,
    update,
    subscribe,
    toggle: () => update((mode) => (mode === 'flat' ? 'rounded' : 'flat')),
  };
}

export const chatViewMode = createChatViewModeStore();

// Helper functions
export function toggleChatViewMode() {
  chatViewMode.toggle();
}

export function setChatViewMode(mode: ViewMode) {
  chatViewMode.set(mode);
}
