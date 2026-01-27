# WAVE Browser Extension Setup Guide

## Overview

WAVE (Web Accessibility Evaluation Tool) is a browser extension that provides visual feedback about accessibility issues directly on your web pages.

## Installation

### Chrome/Edge

1. Visit Chrome Web Store
2. Search "WAVE Evaluation Tool"
3. Click "Add to Chrome" or "Add to Edge"
4. Pin extension to toolbar for easy access

Link: https://chrome.google.com/webstore/detail/wave-evaluation-tool/jbbplnpkjmmeebjpijfedlgcdilocofh

### Firefox

1. Visit Firefox Add-ons
2. Search "WAVE Evaluation Tool"
3. Click "Add to Firefox"
4. Pin extension to toolbar

Link: https://addons.mozilla.org/en-US/firefox/addon/wave-accessibility-tool/

## Usage

### Basic Usage

1. Open your application in browser (http://localhost:5173)
2. Click WAVE extension icon in toolbar
3. WAVE will analyze the page and overlay icons

### Understanding the Icons

**Error Icons** (Red)

- 🚨 **Alt text missing**: Image lacks alt attribute
- 🚨 **Empty link**: Link has no text content
- 🚨 **Empty button**: Button has no label
- 🚨 **Missing label**: Form input lacks label
- 🚨 **Low contrast**: Text fails WCAG AA contrast ratio
- 🚨 **Suspicious link text**: Generic text like "click here"

**Alert Icons** (Yellow)

- ⚠️ **Very low contrast**: Text fails but close to threshold
- ⚠️ **Document title missing**: No `<title>` tag
- ⚠️ **Skipped heading**: Heading level skipped (h1 → h3)
- ⚠️ **Redundant link**: Adjacent links go to same URL

**Feature Icons** (Green/Blue)

- ✅ **Alt text**: Image has alt text
- ✅ **Heading**: Heading element found
- ✅ **Landmark**: ARIA landmark region
- ✅ **Label**: Form input has label
- ✅ **Skip link**: Skip navigation link present
- ✅ **Heading order**: Headings follow logical order

### Code View

WAVE also provides:

- **Page structure**: Shows headings, landmarks, lists
- **Reading order**: Shows screen reader order
- **HTML code**: View source with issues highlighted
- **Styles**: See applied CSS

Click "Codes" or "Structure" tabs at bottom of WAVE panel.

## Testing Workflow

### 1. Homepage Audit

```
1. Open http://localhost:5173
2. Click WAVE extension
3. Count errors (should be 0)
4. Note alerts (review and fix if critical)
5. Check structure panel for landmarks
```

### 2. Page-by-Page Audit

```
For each page:
- / (homepage)
- /chat (main chat interface)
- /settings (settings page)
- /profile (user profile)
- Any other routes

1. Navigate to page
2. Run WAVE
3. Document errors
4. Fix issues
5. Re-run WAVE to verify
```

### 3. Component Audit

```
Test specific components:
- Modals and dialogs
- Dropdown menus
- Forms (login, settings)
- Chat interface
- Navigation
- Data tables

Use "No frames" option to test iframes/modals
```

## Common Issues and Fixes

### Missing Alt Text

**Issue**: Red icon on image
**Fix**:

```html
<!-- Bad -->
<img src="logo.png" />

<!-- Good -->
<img src="logo.png" alt="Company Logo" />

<!-- Decorative -->
<img src="decoration.png" alt="" />
```

### Low Contrast

**Issue**: Yellow icon with contrast ratio
**Fix**:

```css
/* Bad: #999 text on #fff background = 2.8:1 */
.text {
  color: #999999;
}

/* Good: #595959 text on #fff background = 7:1 */
.text {
  color: #595959;
}
```

Use: https://webaim.org/resources/contrastchecker/

### Empty Link

**Issue**: Red icon on link with no text
**Fix**:

```html
<!-- Bad -->
<a href="/page"><img src="icon.png" /></a>

<!-- Good -->
<a href="/page" aria-label="Go to page">
  <img src="icon.png" alt="Page icon" />
</a>
```

### Missing Form Label

**Issue**: Red icon on input
**Fix**:

```html
<!-- Bad -->
<input type="text" id="email" />

<!-- Good -->
<label for="email">Email</label>
<input type="text" id="email" />

<!-- Or -->
<input type="text" aria-label="Email address" />
```

### Skipped Heading

**Issue**: Yellow icon on heading
**Fix**:

```html
<!-- Bad: h1 → h3 -->
<h1>Title</h1>
<h3>Subtitle</h3>
<!-- Should be h2 -->

<!-- Good -->
<h1>Title</h1>
<h2>Subtitle</h2>
```

## Advanced Features

### Contrast Checker

1. Click "Contrast" tab in WAVE panel
2. Click eyedropper tool
3. Click on text in page
4. See contrast ratio and pass/fail
5. Click background to test background color

### Reading Order

1. Click "Structure" tab
2. See numbers showing reading order
3. Verify order makes sense
4. Check for skipped content

### Landmarks

1. Click "Structure" tab
2. See landmark regions (banner, main, nav, etc.)
3. Verify all content is in landmarks
4. Check for redundant landmarks

### Headings

1. Click "Structure" tab
2. See heading outline (H1, H2, H3...)
3. Verify logical hierarchy
4. Check for skipped levels

## Best Practices

### Before Starting

- Test on multiple pages (not just homepage)
- Test different user states (logged in/out)
- Test responsive views (mobile, tablet, desktop)
- Test with dynamic content (chat messages, modals)

### During Testing

- Take screenshots of WAVE results
- Document all errors in spreadsheet
- Note severity (critical, serious, moderate)
- Group similar issues for efficiency

### After Testing

- Prioritize critical errors (alt text, labels, contrast)
- Fix issues systematically
- Re-test with WAVE after fixes
- Document fixes in changelog

## Limitations

### WAVE Cannot Detect

- Keyboard accessibility (test manually)
- Screen reader announcements (test manually)
- Focus management (test manually)
- ARIA live region behavior (test manually)
- Semantic meaning of content (manual review needed)

### WAVE False Positives

- Decorative images marked with role="presentation"
- Buttons with aria-label (may show as empty)
- Icons in buttons (may show as empty link)
- Hidden content (skip links, off-screen content)

Always verify WAVE findings with manual testing.

## Integration with Automated Tests

### Workflow

```
1. Run automated tests (axe-core, Lighthouse)
   bun run test:a11y

2. Fix automated test failures

3. Run WAVE on all pages
   - Document remaining issues

4. Manual keyboard testing
   - Tab through all elements
   - Test all interactive features

5. Screen reader testing
   - Test with NVDA/JAWS
   - Document issues

6. Create accessibility issues tracker
   - Combine all findings
   - Prioritize fixes
```

## Reporting

### Creating WAVE Report

1. Take screenshot of WAVE overlay
2. Click "Codes" tab
3. Copy error summary
4. Document in spreadsheet:

| Page | Issue                     | WCAG  | Severity | Fix                     |
| ---- | ------------------------- | ----- | -------- | ----------------------- |
| Home | Missing alt text on logo  | 1.1.1 | Critical | Add alt="Company Logo"  |
| Chat | Low contrast on timestamp | 1.4.3 | Serious  | Darken color to #595959 |

### Export Options

WAVE doesn't have built-in export, but you can:

- Take screenshots (Cmd+Shift+4 on Mac)
- Copy-paste error list from Codes tab
- Print page to PDF (Cmd+P)

## Additional Resources

- [WAVE Help Documentation](https://wave.webaim.org/help)
- [WAVE FAQ](https://wave.webaim.org/faq)
- [WebAIM Resources](https://webaim.org/)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Support

For WAVE-specific issues:

- Check WAVE FAQ: https://wave.webaim.org/faq
- Contact WebAIM: info@webaim.org

For general accessibility questions:

- WebAIM Email Discussion List
- A11Y Project Slack
- Stack Overflow (accessibility tag)
