/**
 * Theme Types Usage Example
 *
 * This file demonstrates the usage of theme types and serves as a basic verification
 * that the type definitions are correct and usable.
 *
 * @module types/__tests__/theme
 */

import type {
  HSLColor,
  ThemeColors,
  Theme,
  CreateThemeData,
  UpdateThemeData,
  ThemeExport,
  ThemeValidationResult,
  ThemePreview,
  ThemeApplicationSettings,
} from '../theme';
import { ThemeType, ThemePresetCategory } from '../theme';

/**
 * Example HSL color values
 */
const exampleBlue: HSLColor = '210 100% 50%';
const exampleRed: HSLColor = '0 100% 50%';
const exampleDark: HSLColor = '0 0% 10%';
const exampleLight: HSLColor = '0 0% 100%';

/**
 * Example theme colors (dark theme)
 */
const darkThemeColors: ThemeColors = {
  primary: '210 100% 50%',
  secondary: '210 100% 45%',
  background: '222 47% 11%',
  foreground: '210 40% 98%',
  muted: '217 33% 17%',
  mutedForeground: '215 20% 65%',
  accent: '210 100% 50%',
  accentForeground: '0 0% 100%',
  destructive: '0 100% 50%',
  destructiveForeground: '0 0% 100%',
  border: '217 33% 17%',
  input: '217 33% 17%',
  ring: '210 100% 50%',
  radius: '0.5',
};

/**
 * Example theme colors (light theme)
 */
const lightThemeColors: ThemeColors = {
  primary: '210 100% 50%',
  secondary: '210 100% 45%',
  background: '0 0% 100%',
  foreground: '210 20% 10%',
  muted: '210 20% 90%',
  mutedForeground: '210 20% 40%',
  accent: '210 100% 50%',
  accentForeground: '0 0% 100%',
  destructive: '0 100% 50%',
  destructiveForeground: '0 0% 100%',
  border: '210 20% 85%',
  input: '210 20% 85%',
  ring: '210 100% 50%',
  radius: '0.5',
};

/**
 * Example complete theme object
 */
const exampleTheme: Theme = {
  id: '01HJKXVB9Z8YABC123DEF456',
  userId: '01HJKXVB9Z8YABC123DEF457',
  name: 'Ocean Dark',
  description: 'A calming dark blue theme',
  isBuiltIn: false,
  colors: darkThemeColors,
  createdAt: '2026-01-26T04:00:00.000Z',
  updatedAt: '2026-01-26T04:00:00.000Z',
};

/**
 * Example theme creation data
 */
const createThemeData: CreateThemeData = {
  name: 'Custom Light Theme',
  description: 'My custom light theme',
  colors: lightThemeColors,
};

/**
 * Example theme update data
 */
const updateThemeData: UpdateThemeData = {
  name: 'Updated Theme Name',
  colors: {
    primary: '220 100% 55%',
    secondary: '220 100% 50%',
  },
};

/**
 * Example theme export format
 */
const themeExport: ThemeExport = {
  name: 'My Custom Theme',
  description: 'A beautiful custom theme',
  colors: darkThemeColors,
  version: '1.0.0',
};

/**
 * Example theme validation result
 */
const validationResult: ThemeValidationResult = {
  valid: true,
  errors: [],
  warnings: ['Consider adjusting contrast ratio for better accessibility'],
};

/**
 * Example theme preview data
 */
const themePreview: ThemePreview = {
  id: '01HJKXVB9Z8YABC123DEF456',
  name: 'Ocean Dark',
  type: ThemeType.CUSTOM,
  primaryColor: '210 100% 50%',
  backgroundColor: '222 47% 11%',
  isActive: true,
};

/**
 * Example theme application settings
 */
const themeApplicationSettings: ThemeApplicationSettings = {
  applyImmediately: true,
  confirmBeforeApply: false,
  syncToBackend: true,
};

// Export examples for reference
export {
  exampleBlue,
  exampleRed,
  exampleDark,
  exampleLight,
  darkThemeColors,
  lightThemeColors,
  exampleTheme,
  createThemeData,
  updateThemeData,
  themeExport,
  validationResult,
  themePreview,
  themeApplicationSettings,
};
