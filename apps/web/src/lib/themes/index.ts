/**
 * Themes Module
 *
 * Exports all theme-related utilities and default themes
 *
 * @module themes
 */

// Re-export Theme type for convenience
export type { Theme } from '$lib/types/theme';

export {
  lightTheme,
  darkTheme,
  highContrastTheme,
  defaultThemes,
  defaultThemesMap,
  getDefaultTheme,
  getLightTheme,
  getDarkTheme,
  getHighContrastTheme,
} from './default-themes';

export {
  applyTheme,
  removeTheme,
  getCurrentTheme,
  isThemeApplied,
  applyThemeById,
  initializeTheme,
  updateThemeColors,
  exportThemeAsCssVariables,
  resetToDefaultTheme,
} from './theme-manager';
