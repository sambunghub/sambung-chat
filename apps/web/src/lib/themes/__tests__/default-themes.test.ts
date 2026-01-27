/**
 * Default Themes Tests
 *
 * Tests for default built-in themes to ensure:
 * - Proper type structure
 * - Valid HSL color values
 * - Required fields present
 * - Built-in theme flags set correctly
 */

import { describe, it, expect } from 'vitest';
import {
  lightTheme,
  darkTheme,
  highContrastTheme,
  defaultThemes,
  defaultThemesMap,
  getDefaultTheme,
  getLightTheme,
  getDarkTheme,
  getHighContrastTheme,
} from '../default-themes';

describe('Default Themes', () => {
  describe('lightTheme', () => {
    it('should have correct structure', () => {
      expect(lightTheme).toMatchObject({
        id: expect.any(String),
        userId: null,
        name: 'Light',
        isBuiltIn: true,
        colors: expect.any(Object),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should have valid HSL color values', () => {
      const hslRegex = /^\d+ \d+% \d+%$/;
      const colorFields = Object.entries(lightTheme.colors).filter(([key]) => key !== 'radius');
      colorFields.forEach(([, color]) => {
        if (typeof color === 'string') {
          expect(color).toMatch(hslRegex);
        }
      });
    });

    it('should have light background', () => {
      const lightness = parseInt(lightTheme.colors.background.split(' ')[2]);
      expect(lightness).toBeGreaterThan(90);
    });
  });

  describe('darkTheme', () => {
    it('should have correct structure', () => {
      expect(darkTheme).toMatchObject({
        id: expect.any(String),
        userId: null,
        name: 'Dark',
        isBuiltIn: true,
        colors: expect.any(Object),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should have valid HSL color values', () => {
      const hslRegex = /^\d+ \d+% \d+%$/;
      const colorFields = Object.entries(darkTheme.colors).filter(([key]) => key !== 'radius');
      colorFields.forEach(([, color]) => {
        if (typeof color === 'string') {
          expect(color).toMatch(hslRegex);
        }
      });
    });

    it('should have dark background', () => {
      const lightness = parseInt(darkTheme.colors.background.split(' ')[2]);
      expect(lightness).toBeLessThan(20);
    });
  });

  describe('highContrastTheme', () => {
    it('should have correct structure', () => {
      expect(highContrastTheme).toMatchObject({
        id: expect.any(String),
        userId: null,
        name: 'High Contrast',
        isBuiltIn: true,
        colors: expect.any(Object),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should have valid HSL color values', () => {
      const hslRegex = /^\d+ \d+% \d+%$/;
      const colorFields = Object.entries(highContrastTheme.colors).filter(
        ([key]) => key !== 'radius'
      );
      colorFields.forEach(([, color]) => {
        if (typeof color === 'string') {
          expect(color).toMatch(hslRegex);
        }
      });
    });

    it('should have pure black background and white foreground', () => {
      expect(highContrastTheme.colors.background).toBe('0 0% 0%');
      expect(highContrastTheme.colors.foreground).toBe('0 0% 100%');
    });
  });

  describe('defaultThemes array', () => {
    it('should contain exactly three themes', () => {
      expect(defaultThemes).toHaveLength(3);
    });

    it('should contain all built-in themes', () => {
      expect(defaultThemes).toContain(lightTheme);
      expect(defaultThemes).toContain(darkTheme);
      expect(defaultThemes).toContain(highContrastTheme);
    });

    it('should have all themes marked as built-in', () => {
      defaultThemes.forEach((theme) => {
        expect(theme.isBuiltIn).toBe(true);
        expect(theme.userId).toBeNull();
      });
    });
  });

  describe('defaultThemesMap', () => {
    it('should map all theme IDs to theme objects', () => {
      Object.values(defaultThemesMap).forEach((theme) => {
        expect(defaultThemes).toContain(theme);
      });
    });

    it('should have entries for all themes', () => {
      expect(Object.keys(defaultThemesMap)).toHaveLength(3);
    });
  });

  describe('getDefaultTheme', () => {
    it('should return light theme by ID', () => {
      const theme = getDefaultTheme(lightTheme.id);
      expect(theme).toBe(lightTheme);
    });

    it('should return dark theme by ID', () => {
      const theme = getDefaultTheme(darkTheme.id);
      expect(theme).toBe(darkTheme);
    });

    it('should return high contrast theme by ID', () => {
      const theme = getDefaultTheme(highContrastTheme.id);
      expect(theme).toBe(highContrastTheme);
    });

    it('should return undefined for invalid ID', () => {
      const theme = getDefaultTheme('invalid-id');
      expect(theme).toBeUndefined();
    });
  });

  describe('Convenience functions', () => {
    it('getLightTheme should return light theme', () => {
      expect(getLightTheme()).toBe(lightTheme);
    });

    it('getDarkTheme should return dark theme', () => {
      expect(getDarkTheme()).toBe(darkTheme);
    });

    it('getHighContrastTheme should return high contrast theme', () => {
      expect(getHighContrastTheme()).toBe(highContrastTheme);
    });
  });

  describe('Theme color consistency', () => {
    it('should have all required color fields', () => {
      const requiredFields = [
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

      defaultThemes.forEach((theme) => {
        requiredFields.forEach((field) => {
          expect(theme.colors).toHaveProperty(field);
        });
      });
    });

    it('should have consistent radius values', () => {
      defaultThemes.forEach((theme) => {
        expect(typeof theme.colors.radius).toBe('string');
        expect(parseFloat(theme.colors.radius)).not.toBeNaN();
      });
    });
  });

  describe('Theme accessibility', () => {
    it('should have good contrast ratios for light theme', () => {
      // For light theme, foreground should be significantly darker than background
      const bgLightness = parseInt(lightTheme.colors.background.split(' ')[2]);
      const fgLightness = parseInt(lightTheme.colors.foreground.split(' ')[2]);
      expect(bgLightness - fgLightness).toBeGreaterThan(70);
    });

    it('should have good contrast ratios for dark theme', () => {
      // For dark theme, foreground should be significantly lighter than background
      const bgLightness = parseInt(darkTheme.colors.background.split(' ')[2]);
      const fgLightness = parseInt(darkTheme.colors.foreground.split(' ')[2]);
      expect(fgLightness - bgLightness).toBeGreaterThan(70);
    });

    it('should have maximum contrast for high contrast theme', () => {
      const bgLightness = parseInt(highContrastTheme.colors.background.split(' ')[2]);
      const fgLightness = parseInt(highContrastTheme.colors.foreground.split(' ')[2]);
      expect(Math.abs(bgLightness - fgLightness)).toBe(100);
    });
  });
});
