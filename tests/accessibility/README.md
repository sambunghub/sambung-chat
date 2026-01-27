# Accessibility Testing Guide

This guide covers automated accessibility testing tools configured for SambungChat to ensure WCAG 2.1 AA compliance.

## Tools Overview

### 1. **axe-core with jest-axe** (Component Testing)

- **Purpose**: Unit testing individual Svelte components for accessibility violations
- **Coverage**: WCAG 2.1 AA rules, ARIA attributes, keyboard accessibility
- **Runner**: Vitest with jsdom environment

### 2. **@axe-core/playwright** (E2E Testing)

- **Purpose**: End-to-end accessibility testing of user flows
- **Coverage**: Full page audits, keyboard navigation, focus management
- **Runner**: Playwright

### 3. **Lighthouse CI** (Performance & Accessibility)

- **Purpose**: Continuous monitoring of accessibility scores
- **Coverage**: Accessibility score (0-100), performance, best practices
- **Runner**: Lighthouse CI

### 4. **WAVE** (Manual Testing)

- **Purpose**: Visual accessibility assessment in browser
- **Coverage**: Visual contrast, reading order, structural analysis
- **Tool**: Browser extension (Chrome/Firefox)

## Quick Start

### Install Dependencies

All dependencies are already installed via `bun install`:

- `jest-axe` - jest-axe for component testing
- `@axe-core/playwright` - axe-core for Playwright
- `@lhci/cli` - Lighthouse CI

### Run Tests

```bash
# Run component accessibility tests (jest-axe)
bun run test:axe

# Run component tests in watch mode
bun run test:axe:watch

# Run E2E accessibility tests (Playwright axe-core)
bun run test:e2e tests/e2e/accessibility.spec.ts

# Run Lighthouse CI audit
bun run test:lighthouse

# Run all accessibility tests
bun run test:a11y
```

## Test Categories

### Component Tests (`tests/accessibility/components.spec.ts`)

Tests individual components in isolation:

- Buttons, links, forms
- Modals, dialogs
- Navigation, menus
- Tables, lists
- Images, icons
- Color contrast
- Focus indicators
- ARIA attributes

**Example**:

```typescript
import { render } from '@testing-library/svelte';
import { axe } from 'jest-axe';

test('Button has no violations', async () => {
  const { container } = render(Button, { props: { label: 'Click me' } });
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### E2E Tests (`tests/e2e/accessibility.spec.ts`)

Tests full user flows:

- Page accessibility audits
- Keyboard navigation
- Landmark structure
- Heading hierarchy
- Focus trapping in modals
- ARIA live regions
- Form labels and errors

**Example**:

```typescript
test('Homepage is accessible', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### Lighthouse CI (`lighthouserc.json`)

Automated audits for:

- Accessibility score (threshold: 90/100)
- Color contrast
- ARIA attributes
- Alt text
- Form labels
- Heading structure
- And more...

## Writing New Tests

### Component Tests

1. Import necessary utilities:

```typescript
import { render } from '@testing-library/svelte';
import { axe } from 'jest-axe';
```

2. Write test:

```typescript
describe('MyComponent', () => {
  it('should be accessible', async () => {
    const { container } = render(MyComponent, {
      props: {
        /* props */
      },
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### E2E Tests

1. Use axe-core Playwright integration:

```typescript
import AxeBuilder from '@axe-core/playwright';

test('My page is accessible', async ({ page }) => {
  await page.goto('/my-page');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

## WCAG 2.1 AA Compliance Checklist

### Perceivable

- ✅ Text alternatives for images (alt text)
- ✅ Captions for videos
- ✅ Audio descriptions for videos
- ✅ Color contrast: 4.5:1 for text, 3:1 for UI components
- ✅ Resizable text (up to 200%)
- ✅ Images of text avoided

### Operable

- ✅ Keyboard accessible (all functions)
- ✅ No keyboard trap
- ✅ Skip navigation links
- ✅ Focus indicators visible
- ✅ Focus order logical
- ✅ Sufficient time for interaction
- ✅ No flashing content (3x/second)

### Understandable

- ✅ Page titles unique and descriptive
- ✅ Focus order predictable
- ✅ Consistent navigation
- ✅ Error identification
- ✅ Labels and instructions
- ✅ Error prevention (for important actions)

### Robust

- ✅ Compatible with assistive technologies
- ✅ Valid HTML
- ✅ ARIA attributes correct
- ✅ Proper landmark regions

## Manual Testing with WAVE

### Setup

1. Install WAVE browser extension:
   - Chrome: https://chrome.google.com/webstore/detail/wave-evaluation-tool/jbbplnpkjmmeebjpijfedlgcdilocofh
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/wave-accessibility-tool/

2. Open your application in browser

3. Click WAVE extension icon

4. Review visual indicators:
   - **Icons**: Errors, alerts, features
   - **Color codes**: Contrast issues, structural problems
   - **Outline**: Reading order, landmarks

### WAVE Checks

- **Alt text**: Green icon = good, red = missing
- **Contrast**: Yellow icon = fails WCAG AA
- **Headings**: Shows heading structure
- **Landmarks**: Shows ARIA landmarks
- **Reading order**: Shows screen reader order

### Common WAVE Issues

| Issue            | Impact   | Fix                              |
| ---------------- | -------- | -------------------------------- |
| Missing alt text | Critical | Add `alt` attribute to images    |
| Low contrast     | Serious  | Increase color contrast to 4.5:1 |
| Empty link       | Serious  | Add link text or aria-label      |
| Empty button     | Serious  | Add button text or aria-label    |
| Missing label    | Serious  | Add `<label>` for inputs         |
| Skipped heading  | Moderate | Use proper heading hierarchy     |

## CI/CD Integration

### Pre-commit Hooks

Accessibility tests run in pre-commit hooks:

```bash
# Run on commit (automatic)
git commit

# Run manually
bun run test:a11y
```

### GitHub Actions (Future)

Add to CI workflow:

```yaml
- name: Run accessibility tests
  run: |
    bun run test:axe
    bun run test:e2e tests/e2e/accessibility.spec.ts
    bun run test:lighthouse
```

## Accessibility Audit Workflow

1. **Automated Testing** (Phase 1)
   - Run `bun run test:a11y`
   - Review failures
   - Fix critical violations

2. **Manual Keyboard Testing** (Phase 2)
   - Tab through all interactive elements
   - Test Enter/Space/Arrow keys
   - Check focus indicators
   - Test modals and dropdowns

3. **Screen Reader Testing** (Phase 3)
   - Test with NVDA (Windows)
   - Test with JAWS (Windows)
   - Test with VoiceOver (macOS)
   - Verify announcements

4. **WAVE Analysis** (Phase 4)
   - Run WAVE on all pages
   - Fix contrast issues
   - Fix alt text issues
   - Verify landmarks

5. **Documentation** (Phase 5)
   - Document keyboard shortcuts
   - Create accessibility statement
   - Update user guides

## Troubleshooting

### Test Failures

**Violation: "color-contrast"**

```bash
# Check contrast ratio
# Use: https://webaim.org/resources/contrastchecker/
# Fix: Adjust colors to meet 4.5:1 ratio
```

**Violation: "button-name"**

```typescript
// Add button text or aria-label
<Button>Click me</Button>
<Button aria-label="Close dialog">×</Button>
```

**Violation: "image-alt"**

```svelte
<!-- Add alt text -->
<img src="logo.png" alt="Company Logo" />
<img src="decorative.png" alt="" role="presentation" />
```

**Violation: "label"**

```svelte
<!-- Add labels to form inputs -->
<label for="email">Email</label>
<input id="email" type="email" />

<!-- Or use aria-label -->
<input aria-label="Email address" type="email" />
```

### Lighthouse CI Issues

**Server not available**

```bash
# Run without uploading
lhci autorun --collect.url=http://localhost:5173 --upload.target=temporary-public-storage
```

**Port already in use**

```bash
# Kill existing process
lsof -ti:5173 | xargs kill -9

# Or use different port
lhci autorun --collect.url=http://localhost:5174
```

## Resources

- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize&levels=aaa)
- [axe-core Rules](https://www.deque.com/axe/core-documentation/)
- [Lighthouse Documentation](https://github.com/GoogleChrome/lighthouse)
- [WAVE Help](https://wave.webaim.org/help)
- [WebAIM Checklist](https://webaim.org/standards/wcag/checklist)
- [A11Y Project Checklist](https://www.a11yproject.com/checklist/)

## Contributing

When adding new components:

1. Write accessibility tests alongside component tests
2. Test with keyboard navigation
3. Test with screen reader
4. Verify color contrast
5. Add ARIA attributes where needed

## Support

For accessibility issues or questions:

1. Check this guide
2. Review WCAG guidelines
3. Test with WAVE extension
4. Consult with accessibility expert
