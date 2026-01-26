/**
 * Theme Manager
 *
 * Manages theme application and CSS variable updates for the application.
 * Applies theme colors to the root element and handles theme switching.
 *
 * @module themes/theme-manager
 */

import { browser } from '$app/environment';
import type { Theme, ThemeColors } from '$lib/types/theme';
import { lightTheme } from './default-themes';

/**
 * CSS variable names for theme colors
 * Maps theme color fields to CSS custom property names
 */
const CSS_VARIABLES = {
	primary: '--primary',
	secondary: '--secondary',
	background: '--background',
	foreground: '--foreground',
	muted: '--muted',
	mutedForeground: '--muted-foreground',
	accent: '--accent',
	accentForeground: '--accent-foreground',
	destructive: '--destructive',
	destructiveForeground: '--destructive-foreground',
	border: '--border',
	input: '--input',
	ring: '--ring',
	radius: '--radius'
} as const;

/**
 * Additional CSS variables that are derived from theme colors
 * These map to components that don't have dedicated theme colors
 */
const DERIVED_VARIABLES = {
	primaryForeground: '--primary-foreground',
	secondaryForeground: '--secondary-foreground',
	card: '--card',
	cardForeground: '--card-foreground',
	popover: '--popover',
	popoverForeground: '--popover-foreground',
	sidebar: '--sidebar',
	sidebarForeground: '--sidebar-foreground',
	sidebarPrimary: '--sidebar-primary',
	sidebarPrimaryForeground: '--sidebar-primary-foreground',
	sidebarAccent: '--sidebar-accent',
	sidebarAccentForeground: '--sidebar-accent-foreground',
	sidebarBorder: '--sidebar-border',
	sidebarRing: '--sidebar-ring'
} as const;

/**
 * Currently applied theme
 * Tracks which theme is currently active
 */
let currentTheme: Theme | null = null;

/**
 * Apply theme colors as CSS variables to the root element
 *
 * This function updates all CSS custom properties with theme colors.
 * It handles both direct theme colors and derived colors for components.
 *
 * @param theme - The theme to apply
 * @throws Error if called outside browser environment
 *
 * @example
 * ```ts
 * import { applyTheme } from '$lib/themes/theme-manager';
 * import { darkTheme } from '$lib/themes';
 *
 * // Apply dark theme
 * applyTheme(darkTheme);
 * ```
 */
export function applyTheme(theme: Theme): void {
	if (!browser) {
		console.warn('Cannot apply theme outside browser environment');
		return;
	}

	const root = document.documentElement;
	const colors = theme.colors;

	// Apply primary theme colors
	root.style.setProperty(CSS_VARIABLES.primary, colors.primary);
	root.style.setProperty(CSS_VARIABLES.secondary, colors.secondary);
	root.style.setProperty(CSS_VARIABLES.background, colors.background);
	root.style.setProperty(CSS_VARIABLES.foreground, colors.foreground);
	root.style.setProperty(CSS_VARIABLES.muted, colors.muted);
	root.style.setProperty(CSS_VARIABLES.mutedForeground, colors.mutedForeground);
	root.style.setProperty(CSS_VARIABLES.accent, colors.accent);
	root.style.setProperty(CSS_VARIABLES.accentForeground, colors.accentForeground);
	root.style.setProperty(CSS_VARIABLES.destructive, colors.destructive);
	root.style.setProperty(CSS_VARIABLES.destructiveForeground, colors.destructiveForeground);
	root.style.setProperty(CSS_VARIABLES.border, colors.border);
	root.style.setProperty(CSS_VARIABLES.input, colors.input);
	root.style.setProperty(CSS_VARIABLES.ring, colors.ring);
	root.style.setProperty(CSS_VARIABLES.radius, colors.radius + 'rem');

	// Apply derived colors (map to existing theme colors)
	root.style.setProperty(DERIVED_VARIABLES.primaryForeground, colors.accentForeground);
	root.style.setProperty(DERIVED_VARIABLES.secondaryForeground, colors.foreground);
	root.style.setProperty(DERIVED_VARIABLES.card, colors.background);
	root.style.setProperty(DERIVED_VARIABLES.cardForeground, colors.foreground);
	root.style.setProperty(DERIVED_VARIABLES.popover, colors.background);
	root.style.setProperty(DERIVED_VARIABLES.popoverForeground, colors.foreground);
	root.style.setProperty(DERIVED_VARIABLES.sidebar, colors.background);
	root.style.setProperty(DERIVED_VARIABLES.sidebarForeground, colors.foreground);
	root.style.setProperty(DERIVED_VARIABLES.sidebarPrimary, colors.primary);
	root.style.setProperty(DERIVED_VARIABLES.sidebarPrimaryForeground, colors.accentForeground);
	root.style.setProperty(DERIVED_VARIABLES.sidebarAccent, colors.accent);
	root.style.setProperty(DERIVED_VARIABLES.sidebarAccentForeground, colors.accentForeground);
	root.style.setProperty(DERIVED_VARIABLES.sidebarBorder, colors.border);
	root.style.setProperty(DERIVED_VARIABLES.sidebarRing, colors.ring);

	// Track current theme
	currentTheme = theme;
}

/**
 * Remove theme-specific CSS variables (reset to default)
 *
 * Removes all theme CSS variables from the root element, allowing
 * the default CSS values to take over.
 *
 * @example
 * ```ts
 * import { removeTheme } from '$lib/themes/theme-manager';
 *
 * // Reset to default theme
 * removeTheme();
 * ```
 */
export function removeTheme(): void {
	if (!browser) {
		console.warn('Cannot remove theme outside browser environment');
		return;
	}

	const root = document.documentElement;

	// Remove all theme CSS variables
	Object.values(CSS_VARIABLES).forEach((variable) => {
		root.style.removeProperty(variable);
	});

	Object.values(DERIVED_VARIABLES).forEach((variable) => {
		root.style.removeProperty(variable);
	});

	currentTheme = null;
}

/**
 * Get the currently applied theme
 *
 * Returns the theme object that is currently active, or null if no theme is applied.
 *
 * @returns The currently applied theme, or null
 *
 * @example
 * ```ts
 * import { getCurrentTheme } from '$lib/themes/theme-manager';
 *
 * const theme = getCurrentTheme();
 * console.log(theme?.name); // "Dark" (if dark theme is active)
 * ```
 */
export function getCurrentTheme(): Theme | null {
	return currentTheme;
}

/**
 * Check if a specific theme is currently applied
 *
 * @param theme - The theme to check
 * @returns True if the theme is currently applied
 *
 * @example
 * ```ts
 * import { isThemeApplied, darkTheme } from '$lib/themes';
 *
 * if (isThemeApplied(darkTheme)) {
 *   console.log('Dark theme is active');
 * }
 * ```
 */
export function isThemeApplied(theme: Theme): boolean {
	return currentTheme?.id === theme.id;
}

/**
 * Apply theme by ID
 *
 * Loads and applies a theme by its ID. Supports both built-in and custom themes.
 * For custom themes, you must provide a map of available themes.
 *
 * @param themeId - The ID of the theme to apply
 * @param customThemes - Optional map of custom themes (for user-created themes)
 * @returns True if theme was applied successfully
 *
 * @example
 * ```ts
 * import { applyThemeById } from '$lib/themes/theme-manager';
 * import { orpc } from '$lib/orpc';
 *
 * // Apply theme by ID from backend
 * const theme = await orpc.theme.getById(themeId);
 * if (theme) {
 *   applyThemeById(theme.id, { [theme.id]: theme });
 * }
 * ```
 */
export function applyThemeById(
	themeId: string,
	customThemes?: Record<string, Theme>
): boolean {
	// Try built-in themes first (accessed via imports in components)
	// This function is meant to be called with explicit theme objects

	if (customThemes && customThemes[themeId]) {
		applyTheme(customThemes[themeId]);
		return true;
	}

	return false;
}

/**
 * Initialize theme from appearance settings
 *
 * Loads and applies the theme based on the user's appearance settings.
 * This should be called on app initialization to apply the saved theme.
 *
 * @param themeId - The theme ID from appearance settings (or null for default)
 * @param availableThemes - Map of available themes (includes built-in themes)
 *
 * @example
 * ```ts
 * import { initializeTheme } from '$lib/themes/theme-manager';
 * import { appearance } from '$lib/stores/appearance.store';
 * import { defaultThemesMap } from '$lib/themes';
 *
 * // On app load
 * const themeId = appearance.currentSettings.themeId;
 * const theme = themeId ? defaultThemesMap[themeId] : lightTheme;
 * if (theme) {
 *   initializeTheme(theme.id, defaultThemesMap);
 * }
 * ```
 */
export function initializeTheme(themeId: string | null, availableThemes: Record<string, Theme>): void {
	if (!browser) return;

	// If no theme ID or theme not found, use light theme as default
	const theme =
		themeId && availableThemes[themeId] ? availableThemes[themeId] : lightTheme;

	applyTheme(theme);
}

/**
 * Update theme colors dynamically
 *
 * Updates specific theme colors without changing the entire theme.
 * Useful for real-time color customization or preview.
 *
 * @param colorUpdates - Partial theme colors to update
 *
 * @example
 * ```ts
 * import { updateThemeColors } from '$lib/themes/theme-manager';
 *
 * // Update just the primary color
 * updateThemeColors({ primary: '220 100% 50%' });
 * ```
 */
export function updateThemeColors(colorUpdates: Partial<ThemeColors>): void {
	if (!browser || !currentTheme) {
		console.warn('Cannot update theme colors: no theme is currently applied');
		return;
	}

	const root = document.documentElement;

	// Map theme color fields to CSS variables
	const colorToVariable: Record<keyof ThemeColors, string> = {
		primary: CSS_VARIABLES.primary,
		secondary: CSS_VARIABLES.secondary,
		background: CSS_VARIABLES.background,
		foreground: CSS_VARIABLES.foreground,
		muted: CSS_VARIABLES.muted,
		mutedForeground: CSS_VARIABLES.mutedForeground,
		accent: CSS_VARIABLES.accent,
		accentForeground: CSS_VARIABLES.accentForeground,
		destructive: CSS_VARIABLES.destructive,
		destructiveForeground: CSS_VARIABLES.destructiveForeground,
		border: CSS_VARIABLES.border,
		input: CSS_VARIABLES.input,
		ring: CSS_VARIABLES.ring,
		radius: CSS_VARIABLES.radius
	};

	// Update only the provided colors
	for (const [colorName, colorValue] of Object.entries(colorUpdates)) {
		const variable = colorToVariable[colorName as keyof ThemeColors];
		if (variable && colorValue) {
			const value = colorName === 'radius' ? colorValue + 'rem' : colorValue;
			root.style.setProperty(variable, value);
		}
	}

	// Update current theme object
	currentTheme = {
		...currentTheme,
		colors: {
			...currentTheme.colors,
			...colorUpdates
		}
	};
}

/**
 * Export current theme as CSS variables object
 *
 * Returns the current theme colors as a record of CSS variable names to values.
 * Useful for debugging or passing theme to iframe/webview contexts.
 *
 * @returns Record of CSS variable names to HSL values
 *
 * @example
 * ```ts
 * import { exportThemeAsCssVariables } from '$lib/themes/theme-manager';
 *
 * const cssVars = exportThemeAsCssVariables();
 * console.log(cssVars);
 * // { '--primary': '222 47% 11%', '--background': '0 0% 100%', ... }
 * ```
 */
export function exportThemeAsCssVariables(): Record<string, string> {
	if (!currentTheme) {
		return {};
	}

	const colors = currentTheme.colors;
	const variables: Record<string, string> = {
		[CSS_VARIABLES.primary]: colors.primary,
		[CSS_VARIABLES.secondary]: colors.secondary,
		[CSS_VARIABLES.background]: colors.background,
		[CSS_VARIABLES.foreground]: colors.foreground,
		[CSS_VARIABLES.muted]: colors.muted,
		[CSS_VARIABLES.mutedForeground]: colors.mutedForeground,
		[CSS_VARIABLES.accent]: colors.accent,
		[CSS_VARIABLES.accentForeground]: colors.accentForeground,
		[CSS_VARIABLES.destructive]: colors.destructive,
		[CSS_VARIABLES.destructiveForeground]: colors.destructiveForeground,
		[CSS_VARIABLES.border]: colors.border,
		[CSS_VARIABLES.input]: colors.input,
		[CSS_VARIABLES.ring]: colors.ring,
		[CSS_VARIABLES.radius]: colors.radius + 'rem',
		// Derived variables
		[DERIVED_VARIABLES.primaryForeground]: colors.accentForeground,
		[DERIVED_VARIABLES.secondaryForeground]: colors.foreground,
		[DERIVED_VARIABLES.card]: colors.background,
		[DERIVED_VARIABLES.cardForeground]: colors.foreground,
		[DERIVED_VARIABLES.popover]: colors.background,
		[DERIVED_VARIABLES.popoverForeground]: colors.foreground,
		[DERIVED_VARIABLES.sidebar]: colors.background,
		[DERIVED_VARIABLES.sidebarForeground]: colors.foreground,
		[DERIVED_VARIABLES.sidebarPrimary]: colors.primary,
		[DERIVED_VARIABLES.sidebarPrimaryForeground]: colors.accentForeground,
		[DERIVED_VARIABLES.sidebarAccent]: colors.accent,
		[DERIVED_VARIABLES.sidebarAccentForeground]: colors.accentForeground,
		[DERIVED_VARIABLES.sidebarBorder]: colors.border,
		[DERIVED_VARIABLES.sidebarRing]: colors.ring
	};

	return variables;
}

/**
 * Reset to light theme (default)
 *
 * Convenience function to reset the application to the default light theme.
 *
 * @example
 * ```ts
 * import { resetToDefaultTheme } from '$lib/themes/theme-manager';
 *
 * // Reset to light theme
 * resetToDefaultTheme();
 * ```
 */
export function resetToDefaultTheme(): void {
	applyTheme(lightTheme);
}
