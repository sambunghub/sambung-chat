/**
 * Color Contrast Audit for WCAG 2.1 AA Compliance
 *
 * This script audits all color combinations in the application
 * for WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
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
  passesAA: boolean;
  passesAAA: boolean;
  passesLargeTextAA: boolean;
}

interface AuditResult {
  theme: 'light' | 'dark';
  pairs: ColorPair[];
  issues: {
    critical: ColorPair[];
    serious: ColorPair[];
    moderate: ColorPair[];
  };
}

// OKLCH color definitions from app.css
const lightThemeColors: Record<string, string> = {
  background: 'oklch(1 0 0)',
  foreground: 'oklch(0.147 0.004 49.25)',
  card: 'oklch(1 0 0)',
  'card-foreground': 'oklch(0.147 0.004 49.25)',
  popover: 'oklch(1 0 0)',
  'popover-foreground': 'oklch(0.147 0.004 49.25)',
  primary: 'oklch(0.216 0.006 56.043)',
  'primary-foreground': 'oklch(0.985 0.001 106.423)',
  secondary: 'oklch(0.97 0.001 106.424)',
  'secondary-foreground': 'oklch(0.216 0.006 56.043)',
  muted: 'oklch(0.97 0.001 106.424)',
  'muted-foreground': 'oklch(0.553 0.013 58.071)',
  accent: 'oklch(0.97 0.001 106.424)',
  'accent-foreground': 'oklch(0.216 0.006 56.043)',
  destructive: 'oklch(0.577 0.245 27.325)',
  border: 'oklch(0.923 0.003 48.717)',
  input: 'oklch(0.923 0.003 48.717)',
  ring: 'oklch(0.709 0.01 56.259)',
  sidebar: 'oklch(0.985 0.001 106.423)',
  'sidebar-foreground': 'oklch(0.147 0.004 49.25)',
  'sidebar-primary': 'oklch(0.216 0.006 56.043)',
  'sidebar-primary-foreground': 'oklch(0.985 0.001 106.423)',
  'sidebar-accent': 'oklch(0.97 0.001 106.424)',
  'sidebar-accent-foreground': 'oklch(0.216 0.006 56.043)',
  'sidebar-border': 'oklch(0.923 0.003 48.717)',
  'sidebar-ring': 'oklch(0.709 0.01 56.259)',
};

const darkThemeColors: Record<string, string> = {
  background: 'oklch(0.147 0.004 49.25)',
  foreground: 'oklch(0.985 0.001 106.423)',
  card: 'oklch(0.216 0.006 56.043)',
  'card-foreground': 'oklch(0.985 0.001 106.423)',
  popover: 'oklch(0.216 0.006 56.043)',
  'popover-foreground': 'oklch(0.985 0.001 106.423)',
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
};

// Parsed OKLCH color with alpha channel
interface ParsedOklch {
  l: number;
  c: number;
  h: number;
  alpha: number;
}

// Parse OKLCH string
function parseOklch(oklchString: string): ParsedOklch | null {
  // Handle opacity: oklch(1 0 0 / 10%)
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
    c: parseFloat(c), // Don't scale chroma by alpha
    h: parseFloat(h),
    alpha: alphaValue,
  };
}

// Composite transparent OKLCH color over opaque background
// Using simple alpha blending in OKLab space (approximate but sufficient for contrast)
function compositeOklchOverBackground(
  foreground: ParsedOklch,
  bgRgb: number[]
): { l: number; c: number; h: number } {
  // Convert background RGB to OKLab
  const bgLinearRgb = bgRgb.map((channel) => {
    if (channel <= 0.04045) return channel / 12.92;
    return Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  // RGB to XYZ (D65)
  const X = 0.4124564 * bgLinearRgb[0] + 0.3575761 * bgLinearRgb[1] + 0.1804375 * bgLinearRgb[2];
  const Y = 0.2126729 * bgLinearRgb[0] + 0.7151522 * bgLinearRgb[1] + 0.072175 * bgLinearRgb[2];
  const Z = 0.0193339 * bgLinearRgb[0] + 0.119192 * bgLinearRgb[1] + 0.9503041 * bgLinearRgb[2];

  // XYZ to OKLab (D65)
  const l_ = Math.cbrt(X / 0.95047);
  const m_ = Math.cbrt(Y);
  const s_ = Math.cbrt(Z / 1.08883);

  const Lbg = 0.8189280104 * l_ + 0.3618667452 * m_ - 0.1288547322 * s_;
  const abg = 0.1298938622 * l_ + 0.6077840022 * m_ + 0.2623809544 * s_;
  const bbg = 0.0352654958 * l_ - 0.5957860022 * m_ + 0.5644858026 * s_;

  // Convert foreground OKLCh to OKLab
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const aFg = foreground.c * Math.cos(toRad(foreground.h));
  const bFg = foreground.c * Math.sin(toRad(foreground.h));

  // Alpha blend in OKLab space
  const alpha = foreground.alpha;
  const L = Lbg * (1 - alpha) + foreground.l * alpha;
  const a = abg * (1 - alpha) + aFg * alpha;
  const b = bbg * (1 - alpha) + bFg * alpha;

  // Convert blended OKLab back to OKLCh
  const C = Math.sqrt(a * a + b * b);
  const H = Math.atan2(b, a) * (180 / Math.PI);

  return { l: L, c: C, h: H < 0 ? H + 360 : H };
}

// Convert OKLCH to sRGB (simplified approximation)
function oklchToSrgb(oklch: { l: number; c: number; h: number }): number[] {
  const { l, c, h } = oklch;

  // Convert OKLCh to OKLab
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const L = l;
  const a = c * Math.cos(toRad(h));
  const b = c * Math.sin(toRad(h));

  // OKLab to linear sRGB (approximate)
  // This is a simplified conversion - for production use a proper library
  // Using the forward transform from OKLab to XYZ to sRGB

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

  // Gamma correction (sRGB to linear)
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

// Common color combinations to test
const colorCombinations: [string, string][] = [
  // Text on backgrounds
  ['foreground', 'background'],
  ['foreground', 'card'],
  ['foreground', 'popover'],
  ['foreground', 'sidebar'],

  // Primary text
  ['primary-foreground', 'primary'],
  ['primary', 'background'], // Links, buttons

  // Secondary text
  ['secondary-foreground', 'secondary'],

  // Muted text
  ['muted-foreground', 'background'],
  ['muted-foreground', 'muted'],

  // Accent text
  ['accent-foreground', 'accent'],

  // Destructive
  ['destructive', 'background'],

  // Borders and inputs
  ['border', 'background'],
  ['input', 'background'],

  // Card content
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],

  // Sidebar
  ['sidebar-foreground', 'sidebar'],
  ['sidebar-primary-foreground', 'sidebar-primary'],
  ['sidebar-accent-foreground', 'sidebar-accent'],

  // Focus rings (check against adjacent colors)
  ['ring', 'background'],
  ['sidebar-ring', 'sidebar'],
];

function auditTheme(themeName: 'light' | 'dark', colors: Record<string, string>): AuditResult {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Auditing ${themeName.toUpperCase()} theme`);
  console.log(`${'='.repeat(80)}\n`);

  const pairs: ColorPair[] = [];
  const issues = {
    critical: [] as ColorPair[],
    serious: [] as ColorPair[],
    moderate: [] as ColorPair[],
  };

  // UI component color names (require 3.0:1 per WCAG 1.4.11)
  const uiComponentNames = new Set([
    'border',
    'input',
    'ring',
    'sidebar',
    'sidebar-ring',
    'sidebar-primary',
    'sidebar-accent',
    'card',
    'popover',
  ]);

  console.log('Color Combinations:\n');
  console.log(
    `${'Foreground'.padEnd(35)} ${'Background'.padEnd(35)} ${'Ratio'.padStart(8)} ${'Status'.padStart(10)} ${'Type'.padStart(12)}`
  );
  console.log(`${'='.repeat(107)}`);

  for (const [fgName, bgName] of colorCombinations) {
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

    // Get background RGB for alpha compositing
    const bgRgb = oklchToSrgb(bgOklch);

    // Composite foreground over background if it has alpha < 1
    let finalFgOklch: { l: number; c: number; h: number };
    if (fgOklch.alpha < 1) {
      // Composite transparent foreground over background
      finalFgOklch = compositeOklchOverBackground(fgOklch, bgRgb);
    } else {
      finalFgOklch = { l: fgOklch.l, c: fgOklch.c, h: fgOklch.h };
    }

    const fgRgb = oklchToSrgb(finalFgOklch);

    const fgLuminance = calculateLuminance(fgRgb);
    const bgLuminance = calculateLuminance(bgRgb);

    const contrastRatio = calculateContrastRatio(fgLuminance, bgLuminance);

    // Determine required threshold based on color pair type
    // UI components: 3.0:1 (WCAG 1.4.11), Normal text: 4.5:1
    const isUiComponent = uiComponentNames.has(fgName) || uiComponentNames.has(bgName);
    const requiredThreshold = isUiComponent ? 3.0 : 4.5;

    const passesLargeTextAA = contrastRatio >= 3.0;
    const passesAA = contrastRatio >= requiredThreshold;
    const passesAAA = contrastRatio >= 7.0;

    const pair: ColorPair = {
      foreground: fgName,
      background: bgName,
      contrastRatio,
      passesAA,
      passesAAA,
      passesLargeTextAA,
    };

    pairs.push(pair);

    // Categorize issues based on actual requirement
    if (!passesLargeTextAA) {
      issues.critical.push(pair);
    } else if (!passesAA) {
      issues.serious.push(pair);
    } else if (!passesAAA) {
      issues.moderate.push(pair);
    }

    // Format output
    const fgDisplay = `${fgName} (${fgColor})`.padEnd(35);
    const bgDisplay = `${bgName} (${bgColor})`.padEnd(35);
    const ratioDisplay = `${contrastRatio.toFixed(2)}:1`.padStart(8);
    const typeDisplay = isUiComponent ? 'UI Component'.padStart(12) : 'Text'.padStart(12);
    let statusDisplay = '✓ PASS'.padStart(10);
    if (!passesLargeTextAA) statusDisplay = '✗ FAIL'.padStart(10);
    else if (!passesAA) statusDisplay = '! WARN'.padStart(10);
    else if (!passesAAA) statusDisplay = '~ MOD'.padStart(10);

    console.log(`${fgDisplay}${bgDisplay}${ratioDisplay}${statusDisplay}${typeDisplay}`);
  }

  return { theme: themeName, pairs, issues };
}

function printSummary(lightResult: AuditResult, darkResult: AuditResult) {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('AUDIT SUMMARY');
  console.log(`${'='.repeat(80)}\n`);

  const totalPairs = lightResult.pairs.length;
  const lightCritical = lightResult.issues.critical.length;
  const lightSerious = lightResult.issues.serious.length;
  const lightModerate = lightResult.issues.moderate.length;
  const lightPassing = totalPairs - lightCritical - lightSerious - lightModerate;

  const darkCritical = darkResult.issues.critical.length;
  const darkSerious = darkResult.issues.serious.length;
  const darkModerate = darkResult.issues.moderate.length;
  const darkPassing = totalPairs - darkCritical - darkSerious - darkModerate;

  console.log('Light Theme:');
  console.log(`  ✓ Passing AA:     ${lightPassing}/${totalPairs}`);
  console.log(`  ! Moderate (AAA): ${lightModerate}/${totalPairs}`);
  console.log(`  ⚠ Serious (< 4.5:1): ${lightSerious}/${totalPairs}`);
  console.log(`  ✗ Critical (< 3:1):  ${lightCritical}/${totalPairs}`);

  console.log('\nDark Theme:');
  console.log(`  ✓ Passing AA:     ${darkPassing}/${totalPairs}`);
  console.log(`  ! Moderate (AAA): ${darkModerate}/${totalPairs}`);
  console.log(`  ⚠ Serious (< 4.5:1): ${darkSerious}/${totalPairs}`);
  console.log(`  ✗ Critical (< 3:1):  ${darkCritical}/${totalPairs}`);

  console.log(`\n${'='.repeat(80)}\n`);

  // Print critical and serious issues
  if (lightCritical > 0 || lightSerious > 0 || darkCritical > 0 || darkSerious > 0) {
    console.log('ISSUES REQUIRING ATTENTION:\n');

    const printIssues = (result: AuditResult, themeName: string) => {
      if (result.issues.critical.length > 0) {
        console.log(`\n${themeName} - CRITICAL (< 3:1):`);
        result.issues.critical.forEach((pair) => {
          console.log(
            `  ✗ ${pair.foreground} on ${pair.background}: ${pair.contrastRatio.toFixed(2)}:1`
          );
        });
      }

      if (result.issues.serious.length > 0) {
        console.log(`\n${themeName} - SERIOUS (< 4.5:1):`);
        result.issues.serious.forEach((pair) => {
          console.log(
            `  ⚠ ${pair.foreground} on ${pair.background}: ${pair.contrastRatio.toFixed(2)}:1`
          );
        });
      }
    };

    printIssues(lightResult, 'Light Theme');
    printIssues(darkResult, 'Dark Theme');
    console.log();
  } else {
    console.log('✓ No critical or serious contrast issues found!');
    console.log('✓ All color combinations meet WCAG 2.1 AA standards.');
    console.log('  (Some combinations may not meet AAA - 7:1)');
  }

  console.log(`\n${'='.repeat(80)}\n`);

  // WCAG 2.1 Requirements
  console.log('WCAG 2.1 AA Requirements:');
  console.log('  • Normal text (< 18pt or < 14pt bold): 4.5:1');
  console.log('  • Large text (≥ 18pt or ≥ 14pt bold): 3.0:1');
  console.log('  • Graphics and icons: 3.0:1');
  console.log('  • UI components and borders: 3.0:1');
  console.log('\nWCAG 2.1 AAA Requirements (Optional):');
  console.log('  • Normal text: 7.0:1');
  console.log('  • Large text: 4.5:1');
  console.log();
}

// Run audit
console.log('\n');
console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                 WCAG 2.1 AA Color Contrast Audit                            ║');
console.log('║                   SambungChat - Accessibility Compliance                      ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('\n');

const lightResult = auditTheme('light', lightThemeColors);
const darkResult = auditTheme('dark', darkThemeColors);
printSummary(lightResult, darkResult);

// Export results for potential programmatic use
export { lightResult, darkResult };
