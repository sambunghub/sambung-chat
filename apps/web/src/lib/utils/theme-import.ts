/**
 * Theme Import Utilities
 *
 * Provides functions to import themes from JSON files for sharing and backup.
 * Complements the theme-export module with import functionality.
 *
 * @module utils/theme-import
 */

import { browser } from '$app/environment';
import type { CreateThemeData, ThemeExport } from '$lib/types/theme';
import { validateThemeExport } from '$lib/utils/theme-export';

/**
 * Theme import result interface
 * Result of importing a theme file
 */
export interface ThemeImportResult {
  /** Whether the import was successful */
  success: boolean;

  /** Imported theme data (if successful) */
  theme?: CreateThemeData;

  /** Array of error messages (empty if successful) */
  errors: string[];

  /** Array of warning messages (non-critical issues) */
  warnings?: string[];

  /** Original filename */
  filename?: string;

  /** Export version from the file */
  version?: string;
}

/**
 * Parse JSON file content
 *
 * Reads a File object and parses its JSON content.
 * Must be called in browser environment.
 *
 * @param file - File object to parse
 * @returns Parsed JavaScript object
 * @throws Error if not in browser environment or parsing fails
 *
 * @example
 * ```ts
 * try {
 *   const data = await parseJSONFile(fileObject);
 *   console.log(data);
 * } catch (error) {
 *   console.error('Failed to parse file:', error);
 * }
 * ```
 */
async function parseJSONFile(file: File): Promise<unknown> {
  if (!browser) {
    throw new Error('Cannot parse file outside browser environment');
  }

  // Validate file type
  if (!file.type.includes('json')) {
    throw new Error('Invalid file type. Please select a JSON file.');
  }

  // Read file content
  const text = await file.text();

  // Parse JSON
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Validate HSL color format
 *
 * Checks if a string matches the HSL color format: "H S% L%"
 * where H is 0-360, S is 0-100%, L is 0-100%
 *
 * @param color - Color string to validate
 * @returns True if valid HSL format
 *
 * @example
 * ```ts
 * isValidHSLColor('210 100% 50%'); // true
 * isValidHSLColor('rgb(255, 0, 0)'); // false
 * ```
 */
function isValidHSLColor(color: unknown): boolean {
  if (typeof color !== 'string') return false;
  return /^\d+\s+\d+%\s+\d+%$/.test(color);
}

/**
 * Validate theme colors
 *
 * Validates that all color fields in ThemeExport match HSL format.
 * Adds detailed error messages for invalid colors.
 *
 * @param colors - Colors object from ThemeExport
 * @returns Array of validation error messages (empty if all valid)
 */
function validateThemeColors(colors: ThemeExport['colors']): string[] {
  const errors: string[] = [];
  const colorFields: (keyof ThemeExport['colors'])[] = [
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
  ];

  for (const field of colorFields) {
    const color = colors[field];
    if (color && !isValidHSLColor(color)) {
      errors.push(`Invalid HSL format for ${field}: "${color}". Expected format: "H S% L%"`);
    }
  }

  // Validate radius
  if (colors.radius && typeof colors.radius !== 'string') {
    errors.push(`Invalid radius value. Expected string, got ${typeof colors.radius}`);
  }

  return errors;
}

/**
 * Convert ThemeExport to CreateThemeData
 *
 * Transforms a ThemeExport object into CreateThemeData format
 * for creating a new theme via the API.
 *
 * @param exportData - Theme export data
 * @returns Theme data ready for creation
 *
 * @example
 * ```ts
 * const createData = convertImportToCreateData(exportData);
 * await orpc.theme.createTheme(createData);
 * ```
 */
function convertImportToCreateData(exportData: ThemeExport): CreateThemeData {
  return {
    name: exportData.name,
    description: exportData.description,
    colors: exportData.colors,
  };
}

/**
 * Import theme from JSON file
 *
 * Main function for importing themes. Reads the file, validates its content,
 * and converts it to CreateThemeData format.
 *
 * @param file - File object from file input
 * @returns Promise resolving to import result
 *
 * @example
 * ```ts
 * import { importThemeFromFile } from '$lib/utils/theme-import';
 *
 * // In a file input change handler
 * async function handleFileSelect(event: Event) {
 *   const input = event.target as HTMLInputElement;
 *   const file = input.files?.[0];
 *   if (!file) return;
 *
 *   const result = await importThemeFromFile(file);
 *
 *   if (result.success && result.theme) {
 *     // Create theme via API
 *     await orpc.theme.createTheme(result.theme);
 *   } else {
 *     // Show errors to user
 *     console.error('Import failed:', result.errors);
 *   }
 * }
 * ```
 */
export async function importThemeFromFile(file: File): Promise<ThemeImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Parse file
    const data = await parseJSONFile(file);

    // Validate export structure
    const validationResult = validateThemeExport(data);
    if (!validationResult.valid) {
      return {
        success: false,
        errors: validationResult.errors,
        filename: file.name,
      };
    }

    // Type guard: ensure data is ThemeExport
    const exportData = data as ThemeExport;

    // Validate HSL color formats
    const colorErrors = validateThemeColors(exportData.colors);
    if (colorErrors.length > 0) {
      return {
        success: false,
        errors: colorErrors,
        filename: file.name,
      };
    }

    // Convert to CreateThemeData
    const themeData = convertImportToCreateData(exportData);

    // Check version compatibility
    if (exportData.version !== '1.0') {
      warnings.push(
        `Theme file version ${exportData.version} may not be fully compatible with current version 1.0`
      );
    }

    return {
      success: true,
      theme: themeData,
      errors: [],
      warnings: warnings.length > 0 ? warnings : undefined,
      filename: file.name,
      version: exportData.version,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : String(error)],
      filename: file.name,
    };
  }
}

/**
 * Batch import multiple theme files
 *
 * Imports multiple theme files and returns results for each file.
 * Useful for importing a folder of themes.
 *
 * @param files - Array of File objects
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to array of import results
 *
 * @example
 * ```ts
 * import { importMultipleThemes } from '$lib/utils/theme-import';
 *
 * const results = await importMultipleThemes(
 *   fileInput.files,
 *   (current, total) => console.log(`Importing ${current}/${total}`)
 * );
 *
 * const successful = results.filter(r => r.success);
 * console.log(`Imported ${successful.length} themes`);
 * ```
 */
export async function importMultipleThemes(
  files: FileList | File[],
  onProgress?: (current: number, total: number, filename: string) => void
): Promise<ThemeImportResult[]> {
  const fileArray = Array.from(files);
  const results: ThemeImportResult[] = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];

    // Report progress
    if (onProgress) {
      onProgress(i + 1, fileArray.length, file.name);
    }

    // Import theme
    const result = await importThemeFromFile(file);
    results.push(result);
  }

  return results;
}

/**
 * Create a file input element for theme import
 *
 * Helper function to create a file input element and trigger a click.
 * Returns a promise that resolves with the selected file.
 *
 * @param accept - Optional accept attribute (default: ".json")
 * @param multiple - Optional multiple attribute (default: false)
 * @returns Promise resolving to selected File(s)
 *
 * @example
 * ```ts
 * import { createFileInput } from '$lib/utils/theme-import';
 *
 * const file = await createFileInput('.json', false);
 * if (file) {
 *   const result = await importThemeFromFile(file);
 *   // Process result...
 * }
 * ```
 */
export function createFileInput(
  accept: string = '.json',
  multiple: boolean = false
): Promise<File | File[]> {
  return new Promise((resolve, reject) => {
    if (!browser) {
      reject(new Error('Cannot create file input outside browser environment'));
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;

      if (!files || files.length === 0) {
        reject(new Error('No file selected'));
        return;
      }

      if (multiple) {
        resolve(Array.from(files));
      } else {
        resolve(files[0]);
      }
    };

    input.oncancel = () => {
      reject(new Error('File selection cancelled'));
    };

    input.click();
  });
}

/**
 * Validate theme import without parsing file
 *
 * Useful for validating theme data that has already been parsed.
 * This is a convenience wrapper around validateThemeExport with
 * additional color format validation.
 *
 * @param data - Parsed JavaScript object to validate
 * @returns Validation result with errors array
 *
 * @example
 * ```ts
 * import { validateThemeImport } from '$lib/utils/theme-import';
 *
 * const result = validateThemeImport(someObject);
 * if (result.valid) {
 *   console.log('Theme import data is valid');
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateThemeImport(data: unknown): { valid: boolean; errors: string[] } {
  // First validate basic structure
  const baseValidation = validateThemeExport(data);
  if (!baseValidation.valid) {
    return baseValidation;
  }

  // Then validate color formats
  const exportData = data as ThemeExport;
  const colorErrors = validateThemeColors(exportData.colors);

  if (colorErrors.length > 0) {
    return {
      valid: false,
      errors: colorErrors,
    };
  }

  return {
    valid: true,
    errors: [],
  };
}
