/**
 * Theme Export Utilities
 *
 * Provides functions to export themes as JSON files for sharing and backup.
 * Follows the ThemeExport format which excludes database-specific fields.
 *
 * @module utils/theme-export
 */

import { browser } from '$app/environment';
import type { Theme, ThemeExport } from '$lib/types/theme';

// Re-export types for convenience
export type { ThemeExport };

/**
 * Current theme export format version
 * Used for future compatibility when updating the export format
 */
export const THEME_EXPORT_VERSION = '1.0';

/**
 * Sanitize theme name for filename
 * Removes or replaces characters that are problematic in filenames
 *
 * @param name - Theme name to sanitize
 * @returns Sanitized filename-safe name
 *
 * @example
 * ```ts
 * sanitizeThemeName('My Cool Theme!'); // "My_Cool_Theme"
 * ```
 */
function sanitizeThemeName(name: string): string {
  return name
    .replace(/[^a-z0-9]/gi, '_') // Replace non-alphanumeric chars with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase()
    .slice(0, 50); // Limit length to 50 characters
}

/**
 * Convert theme to export format
 *
 * Transforms a Theme object into ThemeExport format by removing
 * database-specific fields (id, userId, timestamps, isBuiltIn) and
 * adding version information.
 *
 * @param theme - The theme to convert
 * @returns Theme object in export format
 *
 * @example
 * ```ts
 * import { exportThemeToJSON } from '$lib/utils/theme-export';
 * import { darkTheme } from '$lib/themes';
 *
 * const exportData = exportThemeToJSON(darkTheme);
 * console.log(exportData.version); // "1.0"
 * ```
 */
export function exportThemeToFormat(theme: Theme): ThemeExport {
  return {
    name: theme.name,
    description: theme.description || undefined,
    colors: theme.colors,
    version: THEME_EXPORT_VERSION,
  };
}

/**
 * Convert theme to JSON string
 *
 * Serializes a theme to JSON format for file export.
 *
 * @param theme - The theme to convert
 * @returns JSON string representation of the theme
 *
 * @example
 * ```ts
 * import { exportThemeToJSON } from '$lib/utils/theme-export';
 * import { darkTheme } from '$lib/themes';
 *
 * const jsonString = exportThemeToJSON(darkTheme);
 * console.log(jsonString); // '{"name":"Dark",...}'
 * ```
 */
export function exportThemeToJSON(theme: Theme): string {
  const exportData = exportThemeToFormat(theme);
  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate filename for theme export
 *
 * Creates a filename in the format: theme_<name>_<date>.json
 *
 * @param theme - The theme to generate filename for
 * @returns Generated filename
 *
 * @example
 * ```ts
 * import { generateThemeFilename } from '$lib/utils/theme-export';
 * import { darkTheme } from '$lib/themes';
 *
 * const filename = generateThemeFilename(darkTheme);
 * // "theme_dark_2025-01-26.json"
 * ```
 */
export function generateThemeFilename(theme: Theme): string {
  const sanitizedName = sanitizeThemeName(theme.name);
  const timestamp = new Date().toISOString().split('T')[0];
  return `theme_${sanitizedName}_${timestamp}.json`;
}

/**
 * Download content as file
 *
 * Helper function to trigger browser download of a file.
 * Must be called in browser environment.
 *
 * @param content - File content as string
 * @param filename - Name of the file to download
 * @param mimeType - MIME type of the file
 *
 * @example
 * ```ts
 * downloadFile('{"key":"value"}', 'data.json', 'application/json');
 * ```
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  if (!browser) {
    console.warn('Cannot download file outside browser environment');
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export theme and download as JSON file
 *
 * This is the main function for theme export. It converts the theme
 * to export format, generates a filename, and triggers the browser download.
 *
 * @param theme - The theme to export
 * @param filename - Optional custom filename (default: auto-generated)
 * @returns The export data for reference
 *
 * @example
 * ```ts
 * import { downloadTheme } from '$lib/utils/theme-export';
 * import { darkTheme } from '$lib/themes';
 *
 * // Export with auto-generated filename
 * downloadTheme(darkTheme);
 *
 * // Export with custom filename
 * downloadTheme(darkTheme, 'my-dark-theme.json');
 * ```
 */
export function downloadTheme(theme: Theme, filename?: string): ThemeExport {
  const exportData = exportThemeToFormat(theme);
  const jsonString = JSON.stringify(exportData, null, 2);
  const finalFilename = filename || generateThemeFilename(theme);

  downloadFile(jsonString, finalFilename, 'application/json');

  return exportData;
}

/**
 * Validate theme export data
 *
 * Checks if an object matches the ThemeExport format and contains
 * all required fields with valid values.
 *
 * @param data - Object to validate
 * @returns Validation result with valid flag and error messages
 *
 * @example
 * ```ts
 * import { validateThemeExport } from '$lib/utils/theme-export';
 *
 * const result = validateThemeExport(someObject);
 * if (result.valid) {
 *   console.log('Theme export is valid');
 * } else {
 *   console.error('Errors:', result.errors);
 * }
 * ```
 */
export function validateThemeExport(data: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if data is an object
  if (typeof data !== 'object' || data === null) {
    return {
      valid: false,
      errors: ['Theme export must be an object'],
    };
  }

  const exportData = data as Partial<ThemeExport>;

  // Check required fields
  if (!exportData.name || typeof exportData.name !== 'string') {
    errors.push('Theme name is required and must be a string');
  }

  if (exportData.name && (exportData.name.length < 3 || exportData.name.length > 100)) {
    errors.push('Theme name must be between 3 and 100 characters');
  }

  // Check colors object
  if (!exportData.colors || typeof exportData.colors !== 'object') {
    errors.push('Theme colors are required');
  } else {
    // Check required color fields
    const requiredColors: (keyof ThemeExport['colors'])[] = [
      'primary',
      'secondary',
      'background',
      'foreground',
      'muted',
      'mutedForeground',
      'accent',
      'accentForeground',
      'destructive',
      'destructiveForeground',
      'border',
      'input',
      'ring',
      'radius',
    ];

    for (const colorKey of requiredColors) {
      if (!exportData.colors[colorKey]) {
        errors.push(`Missing required color: ${colorKey}`);
      }
    }
  }

  // Check version
  if (!exportData.version || typeof exportData.version !== 'string') {
    errors.push('Theme export version is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
