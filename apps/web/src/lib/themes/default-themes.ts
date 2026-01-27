/**
 * Default Built-in Themes
 *
 * This file exports the three built-in themes for SambungChat:
 * - Light: Clean, modern theme with bright backgrounds
 * - Dark: Easy-on-the-eyes theme for low-light environments
 * - High Contrast: Maximum accessibility theme with stark contrasts
 *
 * @module themes/default-themes
 */

import type { Theme } from '$lib/types/theme';

/**
 * Fixed ULIDs for built-in themes
 * These use deterministic ULIDs based on reasonable timestamps
 */
const LIGHT_THEME_ID = '01HZ000000000000000000000';
const DARK_THEME_ID = '01HZ000000000000000000001';
const HIGH_CONTRAST_THEME_ID = '01HZ000000000000000000002';

/**
 * Built-in timestamp for theme creation
 */
const BUILT_IN_TIMESTAMP = '2025-01-01T00:00:00.000Z';

/**
 * Light Theme
 *
 * A clean, modern theme with bright backgrounds and dark text.
 * Optimal for daytime use and well-lit environments.
 *
 * Color palette:
 * - Primary: Slate blue (professional, trustworthy)
 * - Background: Pure white (clean, minimal)
 * - Foreground: Dark slate (high readability)
 * - Accent: Light blue (subtle highlights)
 */
export const lightTheme: Theme = {
  id: LIGHT_THEME_ID,
  userId: null,
  name: 'Light',
  description: 'Clean, modern theme with bright backgrounds for daytime use',
  isBuiltIn: true,
  colors: {
    primary: '222 47% 11%', // Dark slate
    secondary: '210 40% 96%', // Light gray-blue
    background: '0 0% 100%', // Pure white
    foreground: '222 47% 11%', // Dark slate
    muted: '210 40% 96%', // Light gray
    mutedForeground: '215 16% 47%', // Medium gray
    accent: '210 100% 97%', // Very light blue
    accentForeground: '222 47% 11%', // Dark slate
    destructive: '0 84% 60%', // Bright red
    destructiveForeground: '0 0% 100%', // White
    border: '214 32% 91%', // Light gray
    input: '214 32% 91%', // Light gray
    ring: '222 47% 11%', // Dark slate
    radius: '0.625', // 10px
  },
  createdAt: BUILT_IN_TIMESTAMP,
  updatedAt: BUILT_IN_TIMESTAMP,
};

/**
 * Dark Theme
 *
 * A comfortable dark theme that reduces eye strain in low-light environments.
 * Uses dark grays instead of pure black for a softer, more modern look.
 *
 * Color palette:
 * - Primary: Light blue (visible against dark backgrounds)
 * - Background: Dark slate (easier on eyes than pure black)
 * - Foreground: Off-white (high readability without glare)
 * - Accent: Medium blue (subtle but visible)
 */
export const darkTheme: Theme = {
  id: DARK_THEME_ID,
  userId: null,
  name: 'Dark',
  description: 'Easy-on-the-eyes dark theme for low-light environments',
  isBuiltIn: true,
  colors: {
    primary: '210 40% 98%', // Off-white
    secondary: '217 33% 17%', // Dark slate
    background: '222 47% 11%', // Very dark slate
    foreground: '210 40% 98%', // Off-white
    muted: '217 33% 17%', // Dark slate
    mutedForeground: '215 20% 65%', // Medium gray
    accent: '217 33% 17%', // Dark slate
    accentForeground: '210 40% 98%', // Off-white
    destructive: '0 62% 30%', // Darker red
    destructiveForeground: '210 40% 98%', // Off-white
    border: '217 33% 17%', // Dark slate
    input: '217 33% 17%', // Dark slate
    ring: '210 40% 98%', // Off-white
    radius: '0.625', // 10px
  },
  createdAt: BUILT_IN_TIMESTAMP,
  updatedAt: BUILT_IN_TIMESTAMP,
};

/**
 * High Contrast Theme
 *
 * Maximum accessibility theme designed for users with visual impairments
 * or those who prefer the highest possible contrast ratio.
 *
 * Color palette:
 * - Primary: Bright blue (WCAG AAA compliant)
 * - Background: Pure black (maximum darkness)
 * - Foreground: Pure white (maximum brightness)
 * - Accent: Bright blue (clear focus indicators)
 * - Destructive: Bright red (unmistakable warnings)
 */
export const highContrastTheme: Theme = {
  id: HIGH_CONTRAST_THEME_ID,
  userId: null,
  name: 'High Contrast',
  description: 'Maximum accessibility theme with stark black and white contrast',
  isBuiltIn: true,
  colors: {
    primary: '207 90% 54%', // Bright blue (WCAG AAA)
    secondary: '0 0% 100%', // Pure white
    background: '0 0% 0%', // Pure black
    foreground: '0 0% 100%', // Pure white
    muted: '0 0% 10%', // Very dark gray
    mutedForeground: '0 0% 85%', // Light gray
    accent: '207 90% 54%', // Bright blue
    accentForeground: '0 0% 0%', // Pure black
    destructive: '0 100% 50%', // Pure red
    destructiveForeground: '0 0% 100%', // Pure white
    border: '0 0% 40%', // Medium gray
    input: '0 0% 40%', // Medium gray
    ring: '207 90% 54%', // Bright blue
    radius: '0.5', // 8px (slightly smaller for clarity)
  },
  createdAt: BUILT_IN_TIMESTAMP,
  updatedAt: BUILT_IN_TIMESTAMP,
};

/**
 * Array of all built-in themes
 * Use this for iterating over available default themes
 */
export const defaultThemes: Theme[] = [lightTheme, darkTheme, highContrastTheme];

/**
 * Map of theme IDs to theme objects
 * Useful for quick lookup by theme ID
 */
export const defaultThemesMap: Record<string, Theme> = {
  [LIGHT_THEME_ID]: lightTheme,
  [DARK_THEME_ID]: darkTheme,
  [HIGH_CONTRAST_THEME_ID]: highContrastTheme,
};

/**
 * Get a default theme by ID
 * @param id - The theme ID (LIGHT_THEME_ID, DARK_THEME_ID, or HIGH_CONTRAST_THEME_ID)
 * @returns The theme object, or undefined if not found
 */
export function getDefaultTheme(id: string): Theme | undefined {
  return defaultThemesMap[id];
}

/**
 * Get the light theme (convenience function)
 * @returns The light theme
 */
export function getLightTheme(): Theme {
  return lightTheme;
}

/**
 * Get the dark theme (convenience function)
 * @returns The dark theme
 */
export function getDarkTheme(): Theme {
  return darkTheme;
}

/**
 * Get the high contrast theme (convenience function)
 * @returns The high contrast theme
 */
export function getHighContrastTheme(): Theme {
  return highContrastTheme;
}
