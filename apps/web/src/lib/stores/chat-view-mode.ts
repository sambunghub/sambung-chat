/**
 * Chat Bubble View Mode Store
 *
 * Manages the chat bubble view mode preference (flat vs rounded).
 * Persists to localStorage for user preference retention.
 */

import { browser } from '$app/environment';

type ViewMode = 'flat' | 'rounded';

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

// Create view mode state
let viewMode = $state<ViewMode>(getInitialViewMode());

// Save to localStorage when changed
if (browser) {
  $effect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, viewMode);
    } catch (error) {
      console.warn('Failed to save chat bubble mode to localStorage:', error);
    }
  });
}

export function chatViewMode() {
  return {
    get mode() {
      return viewMode;
    },
    set mode(value: ViewMode) {
      if (value === 'flat' || value === 'rounded') {
        viewMode = value;
      }
    },
    toggle() {
      viewMode = viewMode === 'flat' ? 'rounded' : 'flat';
    },
  };
}
