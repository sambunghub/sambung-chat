import { browser } from '$app/environment';
import { orpc } from '$lib/orpc';

/**
 * Appearance Settings Types
 */

export type FontSize = '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20';
export type FontFamily = 'system-ui' | 'sans-serif' | 'monospace';
export type MessageDensity = 'compact' | 'comfortable' | 'spacious';

export interface AppearanceSettings {
	fontSize: FontSize;
	fontFamily: FontFamily;
	sidebarWidth: string;
	messageDensity: MessageDensity;
	themeId: string | null;
}

// Default settings values
const DEFAULT_SETTINGS: AppearanceSettings = {
	fontSize: '16',
	fontFamily: 'system-ui',
	sidebarWidth: '280',
	messageDensity: 'comfortable',
	themeId: null,
};

// Local storage key
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
 * Appearance Settings Store
 *
 * Manages appearance settings using Svelte 5 runes with localStorage sync.
 *
 * STORAGE STRATEGY:
 * 1. localStorage is the PRIMARY storage and source of truth
 * 2. Backend sync is SECONDARY and happens asynchronously with debouncing
 * 3. If backend is unavailable, settings remain functional via localStorage
 * 4. All changes are immediately saved to localStorage before attempting backend sync
 *
 * FALLBACK BEHAVIOR:
 * - Initialization: Tries backend first, falls back to localStorage if unavailable
 * - Updates: Saves to localStorage immediately, syncs to backend in background
 * - Errors: Backend sync failures don't affect localStorage persistence
 */
class AppearanceStore {
	// Reactive state using Svelte 5 runes
	settings = $state<AppearanceSettings>(
		loadFromStorage() || { ...DEFAULT_SETTINGS }
	);

	loading = $state(false);
	syncing = $state(false);
	error = $state<string | null>(null);

	constructor() {
		// Initialize settings on mount
		this.initialize();
	}

	/**
	 * Initialize settings - load from backend if available, otherwise use localStorage
	 *
	 * FALLBACK BEHAVIOR:
	 * 1. Attempts to load from backend first (for authenticated users)
	 * 2. If backend fails (offline, unauthenticated, server error), falls back to localStorage
	 * 3. If localStorage is empty, uses DEFAULT_SETTINGS
	 * 4. Backend settings are synced to localStorage for future use
	 */
	async initialize(): Promise<void> {
		if (!browser) return;

		this.loading = true;
		this.error = null;

		try {
			// Try to load from backend first
			const backendSettings = await orpc.appearance.getSettings();

			if (backendSettings) {
				this.settings = {
					fontSize: backendSettings.fontSize as FontSize,
					fontFamily: backendSettings.fontFamily as FontFamily,
					sidebarWidth: backendSettings.sidebarWidth,
					messageDensity: backendSettings.messageDensity as MessageDensity,
					themeId: backendSettings.themeId,
				};

				// Sync to localStorage for offline fallback
				saveToStorage(this.settings);
			}
		} catch (error) {
			// FALLBACK: Backend unavailable - use localStorage as source of truth
			// This handles:
			// - Network errors (offline, server down)
			// - Authentication errors (not logged in)
			// - API errors (endpoint not available)
			console.info('Could not load settings from backend, using localStorage:', error);
			this.settings = loadFromStorage() || { ...DEFAULT_SETTINGS };
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Update a single setting
	 *
	 * FALLBACK BEHAVIOR:
	 * 1. Immediately saves to localStorage (primary storage)
	 * 2. Schedules backend sync in background (1 second debounce)
	 * 3. If backend sync fails, settings remain safe in localStorage
	 */
	updateSetting<K extends keyof AppearanceSettings>(
		key: K,
		value: AppearanceSettings[K]
	): void {
		this.settings[key] = value;

		// IMMEDIATE: Save to localStorage first (primary storage)
		saveToStorage(this.settings);

		// BACKGROUND: Schedule backend sync (fails silently if unavailable)
		this.scheduleSync();
	}

	/**
	 * Update multiple settings at once
	 *
	 * FALLBACK BEHAVIOR:
	 * 1. Immediately saves all updates to localStorage (primary storage)
	 * 2. Schedules backend sync in background (1 second debounce)
	 * 3. If backend sync fails, settings remain safe in localStorage
	 */
	updateSettings(updates: Partial<Omit<AppearanceSettings, 'id'>>): void {
		this.settings = {
			...this.settings,
			...updates,
		};

		// IMMEDIATE: Save to localStorage first (primary storage)
		saveToStorage(this.settings);

		// BACKGROUND: Schedule backend sync (fails silently if unavailable)
		this.scheduleSync();
	}

	/**
	 * Reset all settings to defaults
	 *
	 * FALLBACK BEHAVIOR:
	 * 1. Immediately resets localStorage to defaults (primary storage)
	 * 2. Attempts to sync to backend (fails gracefully if unavailable)
	 * 3. Settings remain functional even if backend reset fails
	 */
	async resetToDefaults(): Promise<void> {
		this.settings = { ...DEFAULT_SETTINGS };

		// IMMEDIATE: Save to localStorage first (primary storage)
		saveToStorage(this.settings);

		// BACKGROUND: Try to sync to backend (fails gracefully)
		try {
			await this.syncToBackend();
			await orpc.appearance.resetSettings();
		} catch (error) {
			console.error('Failed to reset settings on backend (using localStorage):', error);
			// Don't throw - localStorage already has the reset values
		}
	}

	/**
	 * Sync settings to backend (debounced)
	 */
	private syncTimeout: ReturnType<typeof setTimeout> | null = null;

	private scheduleSync(): void {
		if (this.syncTimeout) {
			clearTimeout(this.syncTimeout);
		}

		// Debounce sync to avoid too many API calls
		this.syncTimeout = setTimeout(() => {
			this.syncToBackend();
		}, 1000); // 1 second debounce
	}

	/**
	 * Sync settings to backend immediately
	 *
	 * FALLBACK BEHAVIOR:
	 * - This is a BEST-EFFORT sync to backend
	 * - If sync fails, settings remain safe in localStorage
	 * - Errors are logged but don't affect the user experience
	 * - localStorage remains the source of truth
	 */
	async syncToBackend(): Promise<void> {
		if (!browser || this.syncing) return;

		this.syncing = true;
		this.error = null;

		try {
			await orpc.appearance.updateSettings({
				fontSize: this.settings.fontSize,
				fontFamily: this.settings.fontFamily,
				sidebarWidth: this.settings.sidebarWidth,
				messageDensity: this.settings.messageDensity,
				themeId: this.settings.themeId,
			});
		} catch (error) {
			this.error = 'Failed to sync settings to backend';
			console.error('Failed to sync appearance settings (settings remain in localStorage):', error);
			// DON'T THROW: localStorage is still the source of truth
			// The user's settings are safe and functional
		} finally {
			this.syncing = false;
		}
	}

	/**
	 * Get current settings value
	 */
	get currentSettings(): AppearanceSettings {
		return this.settings;
	}

	/**
	 * Subscribe to settings changes (for compatibility with Svelte stores)
	 */
	subscribe(run: (value: AppearanceSettings) => void) {
		// Run immediately with current value
		run(this.settings);

		// Return unsubscribe function
		return () => {
			// No-op for runes-based store
			// Components should use reactive $derived instead
		};
	}
}

// Create singleton instance
export const appearanceStore = new AppearanceStore();

// Export convenience functions for common operations
export function updateAppearanceSetting<K extends keyof AppearanceSettings>(
	key: K,
	value: AppearanceSettings[K]
): void {
	appearanceStore.updateSetting(key, value);
}

export function updateAppearanceSettings(
	updates: Partial<Omit<AppearanceSettings, 'id'>>
): void {
	appearanceStore.updateSettings(updates);
}

export function resetAppearanceToDefaults(): void {
	appearanceStore.resetToDefaults();
}

// Export settings object for direct access (use with $derived in components)
export const appearance = appearanceStore;
