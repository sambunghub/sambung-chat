/**
 * Appearance Settings Store
 *
 * Uses Svelte stores for reactive state management of appearance settings.
 * Settings are persisted to localStorage (primary) and synced to backend (secondary).
 *
 * ARCHITECTURE NOTES:
 * 1. localStorage is PRIMARY storage - always available and immediate
 * 2. Backend sync is SECONDARY and happens asynchronously with debouncing
 * 3. If backend is unavailable, settings remain functional via localStorage
 * 4. All changes are immediately saved to localStorage before attempting backend sync
 *
 * FALLBACK BEHAVIOR:
 * - Initialization: Tries backend first, falls back to localStorage if unavailable
 * - Updates: Saves to localStorage immediately, syncs to backend in background
 * - Errors: Backend sync failures don't affect localStorage persistence
 */

import { browser } from '$app/environment';
import { writable, derived, type Readable } from 'svelte/store';
import { orpc } from '$lib/orpc';
import type { AppearanceSettings, FontSize, FontFamily, MessageDensity } from '$lib/types/theme';

// Re-export types for convenience
export type { AppearanceSettings, FontSize, FontFamily, MessageDensity };

// Default settings
const DEFAULT_SETTINGS: AppearanceSettings = {
  fontSize: '16',
  fontFamily: 'system-ui',
  sidebarWidth: 280,
  messageDensity: 'comfortable',
  themeId: 'light',
};

// Storage keys
const STORAGE_KEY = 'appearance-settings';

/**
 * Load settings from localStorage
 */
function loadFromStorage(): AppearanceSettings | null {
  if (!browser) return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as AppearanceSettings;
    }
  } catch (error) {
    console.error('Failed to load appearance settings from localStorage:', error);
  }
  return null;
}

/**
 * Save settings to localStorage
 */
function saveToStorage(settings: AppearanceSettings): void {
  if (!browser) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save appearance settings to localStorage:', error);
  }
}

/**
 * Create the appearance store with all state and methods
 */
function createAppearanceStore() {
  // Initial state
  const initialState = {
    settings: loadFromStorage() || { ...DEFAULT_SETTINGS },
    loading: false,
    syncing: false,
    error: null as string | null,
  };

  // Create the store with writable
  const { subscribe, set, update } = writable(initialState);

  // Sync timeout ID
  let syncTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Update state helper
   */
  function setState(updates: Partial<typeof initialState>): void {
    update((state) => ({ ...state, ...updates }));
  }

  /**
   * Initialize settings - load from backend if available, otherwise use localStorage
   */
  async function initialize(): Promise<void> {
    if (!browser) return;

    setState({ loading: true, error: null });

    try {
      // Try to load from backend first
      const backendSettings = await orpc.appearance.getSettings();

      if (backendSettings) {
        const newSettings: AppearanceSettings = {
          fontSize: backendSettings.fontSize as FontSize,
          fontFamily: backendSettings.fontFamily as FontFamily,
          sidebarWidth:
            typeof backendSettings.sidebarWidth === 'string'
              ? parseInt(backendSettings.sidebarWidth, 10)
              : backendSettings.sidebarWidth,
          messageDensity: backendSettings.messageDensity as MessageDensity,
          themeId: backendSettings.themeId || 'light',
        };

        setState({ settings: newSettings });

        // Sync to localStorage for offline fallback
        saveToStorage(newSettings);
      }
    } catch (error) {
      // FALLBACK: Backend unavailable - use localStorage as source of truth
      console.info('Could not load settings from backend, using localStorage:', error);
      const localSettings = loadFromStorage() || { ...DEFAULT_SETTINGS };
      setState({ settings: localSettings });
    } finally {
      setState({ loading: false });
    }
  }

  /**
   * Schedule backend sync with debouncing
   */
  function scheduleSync(): void {
    // Clear existing timeout
    if (syncTimeoutId) {
      clearTimeout(syncTimeoutId);
    }

    // Schedule new sync
    syncTimeoutId = setTimeout(async () => {
      if (!browser) return;

      setState({ syncing: true });

      try {
        const currentSettings = get().settings;
        await orpc.appearance.updateSettings({
          fontSize: currentSettings.fontSize,
          fontFamily: currentSettings.fontFamily,
          sidebarWidth: String(currentSettings.sidebarWidth),
          messageDensity: currentSettings.messageDensity,
          themeId: currentSettings.themeId,
        });
        setState({ error: null });
      } catch (error) {
        // Silently fail - settings are safe in localStorage
        console.info('Could not sync settings to backend (will retry later):', error);
      } finally {
        setState({ syncing: false });
      }
    }, 1000); // 1 second debounce
  }

  /**
   * Get current state (helper function)
   */
  function get(): typeof initialState {
    let currentState: typeof initialState | null = null;
    subscribe((state) => {
      currentState = state;
    })();

    // Immediately unsubscribe to avoid memory leak
    const unsubscribe = subscribe(() => {});
    unsubscribe();

    return currentState!;
  }

  /**
   * Update a single setting
   */
  function updateSetting<K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K]
  ): void {
    const newSettings = { ...get().settings, [key]: value };
    setState({ settings: newSettings });

    // IMMEDIATE: Save to localStorage first (primary storage)
    saveToStorage(newSettings);

    // BACKGROUND: Schedule backend sync (fails silently if unavailable)
    scheduleSync();
  }

  /**
   * Update multiple settings at once
   */
  function updateSettings(updates: Partial<Omit<AppearanceSettings, 'id'>>): void {
    const newSettings = { ...get().settings, ...updates };
    setState({ settings: newSettings });

    // IMMEDIATE: Save to localStorage first (primary storage)
    saveToStorage(newSettings);

    // BACKGROUND: Schedule backend sync (fails silently if unavailable)
    scheduleSync();
  }

  /**
   * Reset all settings to defaults
   */
  function resetToDefaults(): void {
    setState({ settings: { ...DEFAULT_SETTINGS } });
    saveToStorage(DEFAULT_SETTINGS);
    scheduleSync();
  }

  // Initialize on creation
  initialize();

  return {
    subscribe,
    updateSetting,
    updateSettings,
    resetToDefaults,
    get currentSettings() {
      return get().settings;
    },
  };
}

// Create store instance
export const appearance = createAppearanceStore();

// Export convenience functions for common operations
export function updateAppearanceSetting<K extends keyof AppearanceSettings>(
  key: K,
  value: AppearanceSettings[K]
): void {
  appearance.updateSetting(key, value);
}

export function updateAppearanceSettings(updates: Partial<Omit<AppearanceSettings, 'id'>>): void {
  appearance.updateSettings(updates);
}

export function resetAppearanceToDefaults(): void {
  appearance.resetToDefaults();
}
