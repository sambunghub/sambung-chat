import { writable, get } from 'svelte/store';
import { orpc } from '$lib/orpc';
import { browser } from '$app/environment';

// Font size options
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

// Font size mappings to CSS values
export const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: '0.875rem', // 14px
  medium: '1rem', // 16px
  large: '1.125rem', // 18px
  'extra-large': '1.25rem', // 20px
};

// User preferences interface
export interface UserPreferences {
  id: string;
  userId: string;
  sidebarWidth: number; // 200-400
  fontSize: FontSize;
  privacyMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Default preferences
const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  sidebarWidth: 280,
  fontSize: 'medium',
  privacyMode: false,
};

// Create store
function createUserPreferencesStore() {
  const { subscribe, set } = writable<UserPreferences | null>(null);
  let loading = false;

  // Load preferences from API
  async function load() {
    if (loading) return;
    loading = true;

    try {
      const prefs = await orpc.userPreferences.get();
      set(prefs);

      // Apply to document immediately
      if (browser) {
        applyPreferences(prefs);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    } finally {
      loading = false;
    }
  }

  // Update preferences
  async function updatePreferences(
    updates: Partial<Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ) {
    const current = get(store);

    // Optimistic update
    if (current) {
      const updated = { ...current, ...updates };
      set(updated);

      // Apply immediately
      if (browser) {
        applyPreferences(updated);
      }
    }

    try {
      const result = await orpc.userPreferences.update(updates);
      set(result);
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      // Revert on error
      if (current) {
        set(current);
        if (browser) {
          applyPreferences(current);
        }
      }
    }
  }

  // Apply preferences to document
  function applyPreferences(prefs: UserPreferences) {
    if (!browser) return;

    // Apply font size
    document.documentElement.style.setProperty('--font-size-base', FONT_SIZE_MAP[prefs.fontSize]);

    // Apply privacy mode (add class to body)
    if (prefs.privacyMode) {
      document.body.classList.add('privacy-mode');
    } else {
      document.body.classList.remove('privacy-mode');
    }
  }

  // Reset to defaults
  async function reset() {
    await updatePreferences(DEFAULT_PREFERENCES);
  }

  const store = {
    subscribe,
    load,
    updatePreferences,
    reset,
  };

  return store;
}

export const userPreferencesStore = createUserPreferencesStore();

// Helper stores for individual values
export const sidebarWidth = {
  subscribe: (callback: (value: number) => void) =>
    userPreferencesStore.subscribe((prefs) => {
      if (prefs) callback(prefs.sidebarWidth);
    }),
  update: async (value: number) => {
    await userPreferencesStore.updatePreferences({ sidebarWidth: value });
  },
};

export const fontSize = {
  subscribe: (callback: (value: FontSize) => void) =>
    userPreferencesStore.subscribe((prefs) => {
      if (prefs) callback(prefs.fontSize);
    }),
  update: async (value: FontSize) => {
    await userPreferencesStore.updatePreferences({ fontSize: value });
  },
};

export const privacyMode = {
  subscribe: (callback: (value: boolean) => void) =>
    userPreferencesStore.subscribe((prefs) => {
      if (prefs) callback(prefs.privacyMode);
    }),
  toggle: async () => {
    const current = get(userPreferencesStore);
    if (current) {
      await userPreferencesStore.updatePreferences({
        privacyMode: !current.privacyMode,
      });
    }
  },
  update: async (value: boolean) => {
    await userPreferencesStore.updatePreferences({ privacyMode: value });
  },
};
