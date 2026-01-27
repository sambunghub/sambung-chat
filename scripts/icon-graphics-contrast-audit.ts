/**
 * Icon and Graphics Contrast Audit for WCAG 2.1 AA Compliance
 *
 * This script audits icons, buttons, charts, and graphical elements for
 * WCAG 1.4.11 Non-text Contrast requirements (3:1 minimum ratio).
 *
 * WCAG 1.4.11: Graphical objects and parts of graphical objects must have
 * at least 3:1 contrast ratio against adjacent colors.
 */

interface ColorToken {
  name: string;
  value: string;
  oklch: { l: number; c: number; h: number };
}

interface ColorPair {
  foreground: string;
  background: string;
  contrastRatio: number;
  passesIconGraphics: boolean;
  usage: string;
}

interface AuditResult {
  theme: 'light' | 'dark';
  pairs: ColorPair[];
  issues: {
    critical: ColorPair[]; // Below 3:1
    moderate: ColorPair[]; // 3:1 to 4.5:1 (passes but low margin)
  };
}

// OKLCH color definitions from app.css
const lightThemeColors: Record<string, string> = {
  background: 'oklch(1 0 0)',
  foreground: 'oklch(0.147 0.004 49.25)',
  card: 'oklch(1 0 0)',
  'card-foreground': 'oklch(0.147 0.004 49.25)',
  primary: 'oklch(0.216 0.006 56.043)',
  'primary-foreground': 'oklch(0.985 0.001 106.423)',
  secondary: 'oklch(0.97 0.001 106.424)',
  'secondary-foreground': 'oklch(0.216 0.006 56.043)',
  muted: 'oklch(0.97 0.001 106.424)',
  'muted-foreground': 'oklch(0.48 0.015 58.071)', // Fixed in subtask 4.1
  accent: 'oklch(0.97 0.001 106.424)',
  'accent-foreground': 'oklch(0.216 0.006 56.043)',
  destructive: 'oklch(0.45 0.19 27.325)', // Fixed in subtask 4.1
  border: 'oklch(0.923 0.003 48.717)',
  input: 'oklch(0.923 0.003 48.717)',
  ring: 'oklch(0.4 0.02 56.259)', // Fixed in subtask 2.2
  sidebar: 'oklch(0.985 0.001 106.423)',
  'sidebar-foreground': 'oklch(0.147 0.004 49.25)',
  'sidebar-primary': 'oklch(0.216 0.006 56.043)',
  'sidebar-primary-foreground': 'oklch(0.985 0.001 106.423)',
  'sidebar-accent': 'oklch(0.97 0.001 106.424)',
  'sidebar-accent-foreground': 'oklch(0.216 0.006 56.043)',
  'sidebar-border': 'oklch(0.923 0.003 48.717)',
  'sidebar-ring': 'oklch(0.4 0.02 56.259)', // Fixed in subtask 2.2

  // Chart colors
  'chart-1': 'oklch(0.646 0.222 41.116)',
  'chart-2': 'oklch(0.6 0.118 184.704)',
  'chart-3': 'oklch(0.398 0.07 227.392)',
  'chart-4': 'oklch(0.828 0.189 84.429)',
  'chart-5': 'oklch(0.769 0.188 70.08)',
};

const darkThemeColors: Record<string, string> = {
  background: 'oklch(0.147 0.004 49.25)',
  foreground: 'oklch(0.985 0.001 106.423)',
  card: 'oklch(0.216 0.006 56.043)',
  'card-foreground': 'oklch(0.985 0.001 106.423)',
  primary: 'oklch(0.923 0.003 48.717)',
  'primary-foreground': 'oklch(0.216 0.006 56.043)',
  secondary: 'oklch(0.268 0.007 34.298)',
  'secondary-foreground': 'oklch(0.985 0.001 106.423)',
  muted: 'oklch(0.268 0.007 34.298)',
  'muted-foreground': 'oklch(0.709 0.01 56.259)',
  accent: 'oklch(0.268 0.007 34.298)',
  'accent-foreground': 'oklch(0.985 0.001 106.423)',
  destructive: 'oklch(0.704 0.191 22.216)',
  border: 'oklch(1 0 0 / 10%)',
  input: 'oklch(1 0 0 / 15%)',
  ring: 'oklch(0.65 0.02 58.071)',
  sidebar: 'oklch(0.216 0.006 56.043)',
  'sidebar-foreground': 'oklch(0.985 0.001 106.423)',
  'sidebar-primary': 'oklch(0.488 0.243 264.376)',
  'sidebar-primary-foreground': 'oklch(0.985 0.001 106.423)',
  'sidebar-accent': 'oklch(0.268 0.007 34.298)',
  'sidebar-accent-foreground': 'oklch(0.985 0.001 106.423)',
  'sidebar-border': 'oklch(1 0 0 / 10%)',
  'sidebar-ring': 'oklch(0.65 0.02 58.071)',

  // Chart colors
  'chart-1': 'oklch(0.488 0.243 264.376)',
  'chart-2': 'oklch(0.696 0.17 162.48)',
  'chart-3': 'oklch(0.769 0.188 70.08)',
  'chart-4': 'oklch(0.627 0.265 303.9)',
  'chart-5': 'oklch(0.645 0.246 16.439)',
};

// Icon and graphics color combinations to test
const iconGraphicsCombinations: [string, string, string][] = [
  // Icons on backgrounds
  ['foreground', 'background', 'Body content icons'],
  ['foreground', 'card', 'Card content icons'],
  ['foreground', 'sidebar', 'Sidebar icons'],
  ['foreground', 'popover', 'Popover/menu icons'],

  // Muted icons (secondary, decorative)
  ['muted-foreground', 'background', 'Secondary/decorative icons'],
  ['muted-foreground', 'card', 'Card secondary icons'],
  ['muted-foreground', 'muted', 'Icons on muted background'],

  // Primary icons (active states, important icons)
  ['primary-foreground', 'primary', 'Icons on primary buttons'],
  ['primary', 'background', 'Primary colored icons (links, active states)'],

  // Accent icons (hover states, highlights)
  ['accent-foreground', 'accent', 'Icons on accent backgrounds'],
  ['accent-foreground', 'background', 'Accent colored icons'],

  // Destructive icons (delete, error icons)
  ['destructive', 'background', 'Delete/error icons'],
  ['destructive', 'card', 'Delete icons on cards'],

  // Sidebar icons
  ['sidebar-foreground', 'sidebar', 'Sidebar content icons'],
  ['sidebar-primary-foreground', 'sidebar-primary', 'Sidebar active state icons'],
  ['sidebar-accent-foreground', 'sidebar-accent', 'Sidebar hover icons'],

  // Chart colors on background
  ['chart-1', 'background', 'Chart color 1'],
  ['chart-2', 'background', 'Chart color 2'],
  ['chart-3', 'background', 'Chart color 3'],
  ['chart-4', 'background', 'Chart color 4'],
  ['chart-5', 'background', 'Chart color 5'],

  // Focus indicators (already checked in text audit, but critical for icons)
  ['ring', 'background', 'Focus rings around icons/buttons'],
  ['sidebar-ring', 'sidebar', 'Sidebar focus rings'],
];

// Parse OKLCH string
function parseOklch(oklchString: string): { l: number; c: number; h: number } | null {
  const match = oklchString.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
  if (!match) return null;

  const [, l, c, h, alpha] = match;
  const alphaValue = alpha
    ? alpha.endsWith('%')
      ? parseFloat(alpha) / 100
      : parseFloat(alpha)
    : 1;

  return {
    l: parseFloat(l),
    c: parseFloat(c) * alphaValue,
    h: parseFloat(h),
  };
}

// Convert OKLCH to sRGB (simplified approximation)
function oklchToSrgb(oklch: { l: number; c: number; h: number }): number[] {
  const { l, c, h } = oklch;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const L = l;
  const a = c * Math.cos(toRad(h));
  const b = c * Math.sin(toRad(h));

  // OKLab to XYZ (D65)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const X = +1.2268798758 * l3 - 0.5578149966 * m3 + 0.2813910452 * s3;
  const Y = +0.0416595986 * l3 + 0.8931850026 * m3 - 0.1336562929 * s3;
  const Z = -0.0458579186 * l3 - 0.0388394894 * m3 + 1.0568163333 * s3;

  // XYZ to linear sRGB (D65)
  const R = 3.2409699419 * X - 1.5373831776 * Y - 0.4986107603 * Z;
  const G = -0.9692436363 * X + 1.8759675015 * Y + 0.0415550574 * Z;
  const B = 0.0556300797 * X - 0.2039769589 * Y + 1.0569715142 * Z;

  // Gamma correction
  const gammaCorrect = (channel: number) => {
    if (channel <= 0.0031308) return 12.92 * channel;
    return 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
  };

  return [
    Math.max(0, Math.min(1, gammaCorrect(R))),
    Math.max(0, Math.min(1, gammaCorrect(G))),
    Math.max(0, Math.min(1, gammaCorrect(B))),
  ];
}

// Calculate relative luminance (WCAG 2.0 definition)
function calculateLuminance(rgb: number[]): number {
  const [r, g, b] = rgb.map((channel) => {
    if (channel <= 0.03928) return channel / 12.92;
    return Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Calculate contrast ratio (WCAG 2.0 definition)
function calculateContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function auditTheme(themeName: 'light' | 'dark', colors: Record<string, string>): AuditResult {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Auditing ${themeName.toUpperCase()} theme - Icons and Graphics`);
  console.log(`${'='.repeat(80)}\n`);

  const pairs: ColorPair[] = [];
  const issues = {
    critical: [] as ColorPair[],
    moderate: [] as ColorPair[],
  };

  console.log('Icon and Graphics Color Combinations:\n');
  console.log(`${'Usage'.padEnd(45)} ${'Contrast'.padStart(10)} ${'Status'.padStart(12)}`);
  console.log(`${'='.repeat(80)}`);

  for (const [fgName, bgName, usage] of iconGraphicsCombinations) {
    const fgColor = colors[fgName];
    const bgColor = colors[bgName];

    if (!fgColor || !bgColor) {
      console.warn(`Warning: Missing color definition for ${fgName} or ${bgName}`);
      continue;
    }

    const fgOklch = parseOklch(fgColor);
    const bgOklch = parseOklch(bgColor);

    if (!fgOklch || !bgOklch) {
      console.warn(`Warning: Could not parse OKLCH for ${fgName} or ${bgName}`);
      continue;
    }

    const fgRgb = oklchToSrgb(fgOklch);
    const bgRgb = oklchToSrgb(bgOklch);

    const fgLuminance = calculateLuminance(fgRgb);
    const bgLuminance = calculateLuminance(bgRgb);

    const contrastRatio = calculateContrastRatio(fgLuminance, bgLuminance);

    // WCAG 1.4.11 Non-text Contrast: 3:1 minimum for icons and graphics
    const passesIconGraphics = contrastRatio >= 3.0;

    const pair: ColorPair = {
      foreground: fgName,
      background: bgName,
      contrastRatio,
      passesIconGraphics,
      usage,
    };

    pairs.push(pair);

    // Categorize issues
    if (!passesIconGraphics) {
      issues.critical.push(pair);
    } else if (contrastRatio < 4.5) {
      issues.moderate.push(pair); // Passes 3:1 but below 4.5:1 (low margin)
    }

    // Format output
    const usageDisplay = `${usage} (${fgName} on ${bgName})`.padEnd(45);
    const ratioDisplay = `${contrastRatio.toFixed(2)}:1`.padStart(10);
    let statusDisplay = '✓ PASS'.padStart(12);
    if (!passesIconGraphics) statusDisplay = '✗ FAIL'.padStart(12);
    else if (contrastRatio < 4.5) statusDisplay = '~ LOW MARGIN'.padStart(12);

    console.log(`${usageDisplay}${ratioDisplay}${statusDisplay}`);
  }

  return { theme: themeName, pairs, issues };
}

function printSummary(lightResult: AuditResult, darkResult: AuditResult) {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('ICON AND GRAPHICS CONTRAST AUDIT SUMMARY');
  console.log('WCAG 1.4.11 Non-text Contrast (3:1 minimum)');
  console.log(`${'='.repeat(80)}\n`);

  const totalPairs = lightResult.pairs.length;
  const lightCritical = lightResult.issues.critical.length;
  const lightModerate = lightResult.issues.moderate.length;
  const lightPassing = totalPairs - lightCritical - lightModerate;

  const darkCritical = darkResult.issues.critical.length;
  const darkModerate = darkResult.issues.moderate.length;
  const darkPassing = totalPairs - darkCritical - darkModerate;

  console.log('Light Theme:');
  console.log(`  ✓ Passing (≥3:1):     ${lightPassing}/${totalPairs}`);
  console.log(`  ~ Low margin (3-4.5:1): ${lightModerate}/${totalPairs}`);
  console.log(`  ✗ Failing (< 3:1):     ${lightCritical}/${totalPairs}`);

  console.log('\nDark Theme:');
  console.log(`  ✓ Passing (≥3:1):     ${darkPassing}/${totalPairs}`);
  console.log(`  ~ Low margin (3-4.5:1): ${darkModerate}/${totalPairs}`);
  console.log(`  ✗ Failing (< 3:1):     ${darkCritical}/${totalPairs}`);

  console.log(`\n${'='.repeat(80)}\n`);

  // Print critical issues
  if (lightCritical > 0 || darkCritical > 0) {
    console.log('❌ CRITICAL ISSUES (Icon/Graphics below 3:1):\n');

    const printIssues = (result: AuditResult, themeName: string) => {
      if (result.issues.critical.length > 0) {
        console.log(`\n${themeName}:`);
        result.issues.critical.forEach((pair) => {
          console.log(`  ✗ ${pair.usage}`);
          console.log(
            `    ${pair.foreground} on ${pair.background}: ${pair.contrastRatio.toFixed(2)}:1`
          );
        });
      }
    };

    printIssues(lightResult, 'Light Theme');
    printIssues(darkResult, 'Dark Theme');
    console.log();
  } else {
    console.log('✅ No critical contrast issues found!');
    console.log('✅ All icons and graphics meet WCAG 1.4.11 3:1 requirement.');
    console.log();

    if (lightModerate > 0 || darkModerate > 0) {
      console.log('⚠️  LOW MARGIN WARNINGS (3:1 to 4.5:1):\n');
      console.log('These combinations pass the minimum 3:1 requirement but have');
      console.log('a low margin of error. Consider improving for better accessibility.\n');

      const printModerate = (result: AuditResult, themeName: string) => {
        if (result.issues.moderate.length > 0) {
          console.log(`\n${themeName}:`);
          result.issues.moderate.forEach((pair) => {
            console.log(`  ~ ${pair.usage}`);
            console.log(
              `    ${pair.foreground} on ${pair.background}: ${pair.contrastRatio.toFixed(2)}:1`
            );
          });
        }
      };

      printModerate(lightResult, 'Light Theme');
      printModerate(darkResult, 'Dark Theme');
      console.log();
    }
  }

  console.log(`${'='.repeat(80)}\n`);

  // WCAG 1.4.11 Requirements
  console.log('WCAG 1.4.11 Non-text Contrast Requirements:');
  console.log('  • Icons and graphics: 3.0:1 minimum');
  console.log('  • UI components and borders: 3.0:1 minimum');
  console.log('  • Focus indicators: 3.0:1 minimum');
  console.log('  • Chart elements: 3.0:1 minimum');
  console.log('\nNote: This audit assumes icons inherit text color classes.');
  console.log('      Verify icon usage in actual components matches these assumptions.');
  console.log();
}

// Run audit
console.log('\n');
console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║            Icon and Graphics Contrast Audit - WCAG 1.4.11                   ║');
console.log('║                  SambungChat - Accessibility Compliance                      ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('\n');

const lightResult = auditTheme('light', lightThemeColors);
const darkResult = auditTheme('dark', darkThemeColors);
printSummary(lightResult, darkResult);

// Export results
export { lightResult, darkResult };
