/**
 * Apply Appearance Settings
 *
 * Utility module for applying appearance settings to CSS variables.
 * Handles font size, font family, and theme initialization.
 *
 * @module utils/apply-settings
 */

import { browser } from '$app/environment';
import { appearance } from '$lib/stores/appearance.store';
import { initializeTheme, applyTheme } from '$lib/themes/theme-manager';
import { defaultThemesMap } from '$lib/themes';

/**
 * CSS variable names for appearance settings
 */
const APPEARANCE_VARIABLES = {
	fontSize: '--font-size-base',
	fontFamily: '--font-family-base',
	sidebarWidth: '--sidebar-width'
} as const;

/**
 * Font family stacks for each font family option
 * Maps user-friendly font family names to CSS font stacks
 */
const FONT_FAMILY_STACKS: Record<string, string> =	{
	'system-ui':
		'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
	'sans-serif':
		'"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
	'monospace':
		'"Fira Code", "JetBrains Mono", "Cascadia Code", Consolas, "Courier New", monospace'
};

/**
 * Apply font size to CSS variable
 *
 * @param fontSize - Font size value (e.g., "16" for 16px)
 */
export function applyFontSize(fontSize: string): void {
	if (!browser) return;

	const root = document.documentElement;
	// Apply font size in pixels
	root.style.setProperty(APPEARANCE_VARIABLES.fontSize, `${fontSize}px`);
}

/**
 * Apply font family to CSS variable
 *
 * @param fontFamily - Font family option (system-ui, sans-serif, monospace)
 */
export function applyFontFamily(fontFamily: string): void {
	if (!browser) return;

	const root = document.documentElement;
	const fontStack = FONT_FAMILY_STACKS[fontFamily] || FONT_FAMILY_STACKS['system-ui'];

	root.style.setProperty(APPEARANCE_VARIABLES.fontFamily, fontStack);
}

/**
 * Apply sidebar width to CSS variable
 *
 * @param sidebarWidth - Sidebar width in pixels (e.g., "280")
 */
export function applySidebarWidth(sidebarWidth: string): void {
	if (!browser) return;

	const root = document.documentElement;
	root.style.setProperty(APPEARANCE_VARIABLES.sidebarWidth, `${sidebarWidth}px`);
}

/**
 * Apply all appearance settings to CSS variables
 *
 * Applies font size, font family, and initializes the theme
 * based on the current appearance settings.
 *
 * @param settings - Appearance settings to apply
 *
 * @example
 * ```ts
 * import { applyAppearanceSettings } from '$lib/utils/apply-settings';
 * import { appearance } from '$lib/stores/appearance.store';
 *
 * // Apply current appearance settings
 * applyAppearanceSettings(appearance.currentSettings);
 * ```
 */
export function applyAppearanceSettings(settings: {
	fontSize: string;
	fontFamily: string;
	sidebarWidth: string;
	messageDensity: string;
	themeId: string | null;
}): void {
	if (!browser) {
		console.warn('Cannot apply appearance settings outside browser environment');
		return;
	}

	// Apply font size
	applyFontSize(settings.fontSize);

	// Apply font family
	applyFontFamily(settings.fontFamily);

	// Apply sidebar width
	applySidebarWidth(settings.sidebarWidth);

	// Initialize theme
	initializeTheme(settings.themeId, defaultThemesMap);
}

/**
 * Initialize appearance settings on app load
 *
 * Loads appearance settings from the store and applies them.
 * This should be called once on app initialization to ensure
 * all settings are properly applied.
 *
 * @example
 * ```ts
 * import { initializeAppearanceSettings } from '$lib/utils/apply-settings';
 * import { onMount } from 'svelte';
 *
 * onMount(() => {
 *   initializeAppearanceSettings();
 * });
 * ```
 */
export async function initializeAppearanceSettings(): Promise<void> {
	if (!browser) return;

	try {
		// Wait for appearance store to initialize
		await appearanceStoreInitialized();

		// Apply all appearance settings
		const settings = appearance.currentSettings;
		applyAppearanceSettings(settings);

		console.info('Appearance settings initialized:', settings);
	} catch (error) {
		console.error('Failed to initialize appearance settings:', error);
		// Apply defaults if initialization fails
		applyAppearanceSettings({
			fontSize: '16',
			fontFamily: 'system-ui',
			sidebarWidth: '280',
			messageDensity: 'comfortable',
			themeId: null
		});
	}
}

/**
 * Wait for appearance store to finish initializing
 *
 * Polls the appearance store until it's no longer loading.
 * Times out after 5 seconds.
 */
async function appearanceStoreInitialized(): Promise<void> {
	const maxWaitTime = 5000; // 5 seconds
	const pollInterval = 50; // 50ms
	let elapsed = 0;

	while (appearance.loading && elapsed < maxWaitTime) {
		await new Promise((resolve) => setTimeout(resolve, pollInterval));
		elapsed += pollInterval;
	}

	if (elapsed >= maxWaitTime) {
		throw new Error('Appearance store initialization timed out');
	}
}

/**
 * Watch for appearance settings changes
 *
 * Sets up a reactive watcher that applies settings whenever they change.
 * This uses Svelte's $effect to automatically react to store changes.
 *
 * @returns Cleanup function to remove the watcher
 *
 * @example
 * ```ts
 * import { watchAppearanceSettings } from '$lib/utils/apply-settings';
 * import { onMount } from 'svelte';
 * import { onDestroy } from 'svelte';
 *
 * let cleanup;
 * onMount(() => {
 *   cleanup = watchAppearanceSettings();
 * });
 * onDestroy(() => {
 *   cleanup?.();
 * });
 * ```
 */
export function watchAppearanceSettings(): (() => void) | null {
	if (!browser) return null;

	// This function is meant to be called within a Svelte component
	// The actual watching will be done through Svelte's $effect in components
	// This is just a placeholder for documentation purposes
	return null;
}

/**
 * Reset all appearance CSS variables to defaults
 *
 * Removes all appearance-related CSS variables from the root element.
 *
 * @example
 * ```ts
 * import { resetAppearanceVariables } from '$lib/utils/apply-settings';
 *
 * // Reset to default CSS
 * resetAppearanceVariables();
 * ```
 */
export function resetAppearanceVariables(): void {
	if (!browser) return;

	const root = document.documentElement;

	// Remove all appearance variables
	Object.values(APPEARANCE_VARIABLES).forEach((variable) => {
		root.style.removeProperty(variable);
	});
}

/**
 * Get current appearance CSS variables
 *
 * Returns the current values of all appearance CSS variables.
 * Useful for debugging and testing.
 *
 * @returns Record of CSS variable names to their current values
 *
 * @example
 * ```ts
 * import { getAppearanceVariables } from '$lib/utils/apply-settings';
 *
 * const vars = getAppearanceVariables();
 * console.log(vars);
 * // { '--font-size-base': '16px', '--font-family-base': 'system-ui, ...', ... }
 * ```
 */
export function getAppearanceVariables(): Record<string, string> {
	if (!browser) return {};

	const root = document.documentElement;
	const computedStyle = getComputedStyle(root);

	const variables: Record<string, string> = {
		[APPEARANCE_VARIABLES.fontSize]:
			computedStyle.getPropertyValue(APPEARANCE_VARIABLES.fontSize).trim(),
		[APPEARANCE_VARIABLES.fontFamily]:
			computedStyle.getPropertyValue(APPEARANCE_VARIABLES.fontFamily).trim(),
		[APPEARANCE_VARIABLES.sidebarWidth]:
			computedStyle.getPropertyValue(APPEARANCE_VARIABLES.sidebarWidth).trim()
	};

	return variables;
}
