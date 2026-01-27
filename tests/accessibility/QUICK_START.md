# Accessibility Testing Quick Start

## One-Command Testing

```bash
# Run all accessibility tests
bun run test:a11y
```

This runs:

1. Component tests with jest-axe (`test:axe`)
2. E2E tests with Playwright axe-core (`test:e2e tests/e2e/accessibility.spec.ts`)

## Individual Tools

### 1. Component Testing (jest-axe)

```bash
# Run component accessibility tests
bun run test:axe

# Watch mode (re-run on file changes)
bun run test:axe:watch
```

### 2. E2E Testing (Playwright + axe-core)

```bash
# Run E2E accessibility tests
bun run test:e2e tests/e2e/accessibility.spec.ts

# Run with UI mode
bun run test:e2e:ui tests/e2e/accessibility.spec.ts

# Debug mode
bun run test:e2e:debug tests/e2e/accessibility.spec.ts
```

### 3. Lighthouse CI

```bash
# Run Lighthouse accessibility audit
bun run test:lighthouse
```

### 4. WAVE (Manual)

```bash
# Install WAVE browser extension
# Chrome: https://chrome.google.com/webstore/detail/wave-evaluation-tool/jbbplnpkjmmeebjpijfedlgcdilocofh
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/wave-accessibility-tool/

# Then:
# 1. Open http://localhost:5173
# 2. Click WAVE extension
# 3. Review visual feedback
```

## What Gets Tested

### Automated Tests (jest-axe)

- ✅ ARIA attributes (valid, required, roles)
- ✅ Button names
- ✅ Heading order
- ✅ Image alt text
- ✅ Form labels
- ✅ Link names
- ✅ List structure
- ✅ Color contrast (basic)
- ✅ Duplicate IDs
- ✅ Document language
- ✅ Page title

### E2E Tests (Playwright)

- ✅ Full page accessibility audits
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Landmark regions
- ✅ Heading hierarchy
- ✅ Link descriptions
- ✅ Image alt text
- ✅ Form labels
- ✅ Focus indicators
- ✅ Modal focus traps
- ✅ ARIA live regions

### Lighthouse CI

- ✅ Accessibility score (threshold: 90/100)
- ✅ All WCAG 2.1 AA automated checks
- ✅ Color contrast
- ✅ ARIA best practices
- ✅ Semantic HTML

### WAVE (Manual)

- ✅ Visual contrast verification
- ✅ Reading order
- ✅ Landmark regions
- ✅ Heading structure
- ✅ Alt text verification
- ✅ Form labels
- ✅ Link text quality

## Quick Fixes

### Missing Alt Text

```svelte
<img src="logo.png" alt="Company Logo" />
<img src="decorative.png" alt="" />
```

### Missing Button Label

```svelte
<Button>Click me</Button>
<Button aria-label="Close dialog">×</Button>
```

### Missing Form Label

```svelte
<label for="email">Email</label>
<input id="email" type="email" />
```

### Low Contrast

```css
/* Ensure 4.5:1 for normal text, 3:1 for large text */
.text {
  color: #595959;
} /* On white background */
```

### Missing Heading

```svelte
<h1>Page Title</h1><h2>Section Title</h2><h3>Subsection</h3>
```

## Common Failures

| Error            | Fix                                     |
| ---------------- | --------------------------------------- |
| `button-name`    | Add button text or `aria-label`         |
| `image-alt`      | Add `alt` attribute to images           |
| `label`          | Add `<label>` or `aria-label` to inputs |
| `link-name`      | Add link text or `aria-label`           |
| `color-contrast` | Increase contrast to 4.5:1              |
| `heading-order`  | Use proper heading hierarchy            |
| `duplicate-id`   | Ensure IDs are unique                   |

## Test Structure

```
tests/
├── accessibility/
│   ├── setup.ts           # jest-axe configuration
│   ├── components.spec.ts # Component tests
│   ├── README.md          # Detailed guide
│   └── QUICK_START.md     # This file
├── e2e/
│   ├── accessibility.spec.ts # E2E tests
│   └── ...
└── ...

lighthouserc.json          # Lighthouse CI config
```

## Next Steps

1. ✅ Run `bun run test:a11y` to see current state
2. ✅ Review and fix critical violations
3. ✅ Run WAVE manually on all pages
4. ✅ Test keyboard navigation
5. ✅ Document remaining issues
6. ✅ Plan fixes based on severity

## Need Help?

- Full Guide: `tests/accessibility/README.md`
- WAVE Setup: `scripts/accessibility-setup-guide.md`
- WCAG 2.1 AA: https://www.w3.org/WAI/WCAG21/quickref/
- WebAIM: https://webaim.org/
