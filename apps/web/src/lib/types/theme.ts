/**
 * Theme Type Definitions
 *
 * This file contains all type definitions for the theming system,
 * including color interfaces, theme types, and theme-related utilities.
 *
 * @module types/theme
 */

/**
 * Font size options (in pixels)
 */
export type FontSize = '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20';

/**
 * Font family options
 */
export type FontFamily = 'system-ui' | 'sans-serif' | 'monospace';

/**
 * Message density options
 */
export type MessageDensity = 'compact' | 'comfortable' | 'spacious';

/**
 * Appearance settings interface
 */
export interface AppearanceSettings {
  /** Font size in pixels */
  fontSize: FontSize;
  /** Font family option */
  fontFamily: FontFamily;
  /** Sidebar width in pixels */
  sidebarWidth: number;
  /** Message density setting */
  messageDensity: MessageDensity;
  /** Active theme ID */
  themeId: string;
}

/**
 * HSL color string format
 * Format: "H S%" where H is hue (0-360), S is saturation (0-100%), L is lightness (0-100%)
 * Example: "210 100% 50%" represents a bright blue
 */
export type HSLColor = `${number} ${number}% ${number}%`;

/**
 * Theme color palette interface
 * Defines all color values for a theme, stored as HSL color strings for CSS variables
 *
 * These colors map to CSS custom properties used throughout the application:
 * - --primary, --secondary, etc.
 * - --background, --foreground
 * - --muted, --muted-foreground
 * - --accent, --accent-foreground
 * - --destructive, --destructive-foreground
 * - --border, --input, --ring
 */
export interface ThemeColors {
  /** Primary brand color (buttons, links, active states) */
  primary: HSLColor;

  /** Secondary brand color (subtle accents, secondary actions) */
  secondary: HSLColor;

  /** Main background color (page background, card backgrounds) */
  background: HSLColor;

  /** Main foreground/text color (body text, headings) */
  foreground: HSLColor;

  /** Muted background color (disabled states, less prominent areas) */
  muted: HSLColor;

  /** Muted foreground color (placeholder text, disabled text) */
  mutedForeground: HSLColor;

  /** Accent color (highlights, focus indicators, special elements) */
  accent: HSLColor;

  /** Accent foreground color (text on accent backgrounds) */
  accentForeground: HSLColor;

  /** Destructive/error color (danger actions, error messages) */
  destructive: HSLColor;

  /** Destructive foreground color (text on destructive backgrounds) */
  destructiveForeground: HSLColor;

  /** Border color (dividers, borders, outlines) */
  border: HSLColor;

  /** Input border color (form inputs, text areas) */
  input: HSLColor;

  /** Focus ring color (keyboard focus indicators) */
  ring: HSLColor;

  /** Border radius for rounded corners (in rem, e.g., "0.5" for 8px) */
  radius: string;
}

/**
 * Base theme interface
 * Represents a complete theme with metadata and color palette
 */
export interface Theme {
  /** Unique theme identifier (ULID) */
  id: string;

  /** User ID who owns this theme (null for built-in themes) */
  userId: string | null;

  /** Human-readable theme name */
  name: string;

  /** Optional theme description */
  description?: string | null;

  /** Whether this is a built-in theme (cannot be modified/deleted by users) */
  isBuiltIn: boolean;

  /** Theme color palette */
  colors: ThemeColors;

  /** ISO timestamp when theme was created */
  createdAt: string;

  /** ISO timestamp when theme was last updated */
  updatedAt: string;
}

/**
 * Theme creation data interface
 * Required fields for creating a new custom theme
 */
export interface CreateThemeData {
  /** Human-readable theme name */
  name: string;

  /** Optional theme description */
  description?: string;

  /** Theme color palette (all colors required) */
  colors: ThemeColors;
}

/**
 * Theme update data interface
 * Optional fields for updating an existing theme
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateThemeData {
  /** Updated theme name */
  name?: string;

  /** Updated theme description */
  description?: string;

  /** Updated theme color palette */
  colors?: Partial<ThemeColors>;
}

/**
 * Theme export format
 * Structure for exporting/importing themes as JSON
 * Excludes database-specific fields like id, userId, timestamps
 */
export interface ThemeExport {
  /** Theme name */
  name: string;

  /** Theme description */
  description?: string;

  /** Theme color palette */
  colors: ThemeColors;

  /** Export format version (for future compatibility) */
  version: string;
}

/**
 * Theme type enum
 * Distinguishes between built-in and custom themes
 */
export enum ThemeType {
  /** Built-in theme (pre-installed, cannot be modified) */
  BUILT_IN = 'built-in',

  /** Custom user-created theme */
  CUSTOM = 'custom',
}

/**
 * Theme preset category
 * Categories for organizing theme presets
 */
export enum ThemePresetCategory {
  /** Light themes (light backgrounds, dark text) */
  LIGHT = 'light',

  /** Dark themes (dark backgrounds, light text) */
  DARK = 'dark',

  /** High contrast themes (maximum readability) */
  HIGH_CONTRAST = 'high-contrast',

  /** Custom themes (user-created) */
  CUSTOM = 'custom',
}

/**
 * Theme validation result
 * Result of validating theme data
 */
export interface ThemeValidationResult {
  /** Whether the theme data is valid */
  valid: boolean;

  /** Array of validation error messages (empty if valid) */
  errors: string[];

  /** Array of validation warnings (non-critical issues) */
  warnings?: string[];
}

/**
 * Theme preview data
 * Minimal theme data for preview cards/ thumbnails
 */
export interface ThemePreview {
  /** Theme ID */
  id: string;

  /** Theme name */
  name: string;

  /** Theme type (built-in or custom) */
  type: ThemeType;

  /** Primary color for preview */
  primaryColor: HSLColor;

  /** Background color for preview */
  backgroundColor: HSLColor;

  /** Whether this is the currently active theme */
  isActive?: boolean;
}

/**
 * Theme application settings
 * Settings that control how a theme is applied
 */
export interface ThemeApplicationSettings {
  /** Whether to apply theme immediately on selection */
  applyImmediately: boolean;

  /** Whether to show a confirmation dialog before applying theme */
  confirmBeforeApply: boolean;

  /** Whether to save theme preference to backend */
  syncToBackend: boolean;
}
