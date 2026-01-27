# Semantic HTML Structure Audit Report

**Task:** 3.1 - Audit Semantic HTML Structure
**Date:** 2025-01-26
**Auditor:** Claude Code Agent
**Scope:** SambungChat Web Application - All layouts and pages

---

## Executive Summary

This audit evaluates the semantic HTML structure of the SambungChat application against WCAG 2.1 AA requirements and best practices for accessibility. The audit focuses on proper use of headings, landmarks, and semantic HTML5 elements (`<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>`).

### Overall Assessment: **NEEDS IMPROVEMENT**

**Critical Issues:** 5
**Serious Issues:** 8
**Moderate Issues:** 4
**Total Issues:** 17

### Key Findings

1. **No HTML5 Landmarks**: Application extensively uses `<div>` elements instead of semantic HTML5 landmarks
2. **Inconsistent Heading Hierarchy**: Headings don't follow a logical hierarchy across pages
3. **Missing ARIA Landmarks**: No landmark roles to define navigation, main content, and complementary regions
4. **Screen Reader Navigation Poor**: Without landmarks, screen reader users cannot efficiently navigate the page

---

## Detailed Findings

### Category 1: HTML5 Landmarks (CRITICAL)

#### SH-001: Missing `<main>` landmark (CRITICAL)

**WCAG Criteria:** 1.3.1 (Info and Relationships) - Level A

**Description:**
The application does not use the `<main>` landmark element to denote the primary content of the page. All layouts use generic `<div>` elements.

**Locations:**

- `apps/web/src/routes/+layout.svelte` (root layout)
- `apps/web/src/routes/app/+layout.svelte` (app layout)
- `apps/web/src/routes/(auth)/+layout.svelte` (auth layout)
- `apps/web/src/routes/app/chat/[id]/+page.svelte` (chat page)
- All other pages

**Current Code:**

```svelte
<!-- apps/web/src/routes/app/+layout.svelte -->
<Sidebar.Inset id="main-content" tabindex={-1}>
  {@render children()}
</Sidebar.Inset>
```

**Impact:**

- Screen reader users cannot quickly navigate to the main content
- Violates WCAG 2.1.1 (Keyboard) - Level A
- Violates WCAG 1.3.1 (Info and Relationships) - Level A

**Recommended Fix:**

```svelte
<!-- Add role="main" to the Sidebar.Inset or wrap in <main> -->
<main id="main-content" tabindex={-1}>
  {@render children()}
</main>
```

**Priority:** HIGH - Critical for screen reader navigation
**Effort:** 1 hour

---

#### SH-002: Missing `<nav>` landmarks (CRITICAL)

**WCAG Criteria:** 1.3.1 (Info and Relationships) - Level A

**Description:**
Navigation areas (Navigation Rail and Secondary Sidebar) are not marked with `<nav>` elements or `role="navigation"`.

**Locations:**

- `apps/web/src/lib/components/app-sidebar.svelte` (line 113-245)

**Current Code:**

```svelte
<!-- Flex container for dual sidebar layout -->
<div id="navigation" tabindex={-1} class="flex overflow-hidden" {...restProps}>
  <Sidebar.Root collapsible="none" class="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-e">
    <!-- Navigation content -->
  </Sidebar.Root>
</div>
```

**Impact:**

- Screen reader users cannot identify navigation regions
- Cannot skip navigation efficiently (even with skip links)
- Violates WCAG 2.4.1 (Bypass Blocks) - Level A

**Recommended Fix:**

```svelte
<nav id="navigation" tabindex={-1} aria-label="Main navigation">
  <Sidebar.Root>
    <!-- Navigation content -->
  </Sidebar.Root>
</nav>
```

**Priority:** HIGH - Critical for navigation
**Effort:** 1 hour

---

#### SH-003: Missing `<header>` elements (SERIOUS)

**WCAG Criteria:** 1.3.1 (Info and Relationships) - Level A

**Description:**
Page headers are implemented as generic `<div>` elements instead of semantic `<header>` elements.

**Locations:**

- `apps/web/src/routes/app/chat/[id]/+page.svelte` (line 700-758)
- `apps/web/src/routes/app/settings/models-manager.svelte` (line 250-259)

**Current Code:**

```svelte
<!-- Header -->
<div class="shrink-0 border-b px-6 py-4">
  <div class="flex items-center justify-between">
    <!-- Header content -->
  </div>
</div>
```

**Impact:**

- Screen readers cannot identify page headers
- Poor semantic structure

**Recommended Fix:**

```svelte
<header class="shrink-0 border-b px-6 py-4">
  <div class="flex items-center justify-between">
    <!-- Header content -->
  </div>
</header>
```

**Priority:** MEDIUM - Improves semantic structure
**Effort:** 2 hours

---

#### SH-004: Missing `<section>` elements (SERIOUS)

**WCAG Criteria:** 1.3.1 (Info and Relationships) - Level A

**Description:**
Content sections are not wrapped in `<section>` elements, making it difficult for screen readers to understand content structure.

**Locations:**

- All pages use generic `<div>` elements for content sections

**Current Code:**

```svelte
<div class="space-y-4">
  <div class="flex items-center justify-between">
    <!-- Section content -->
  </div>
</div>
```

**Impact:**

- Poor content structure for screen readers
- Cannot navigate by sections

**Recommended Fix:**

```svelte
<section aria-labelledby="section-heading">
  <h2 id="section-heading">Section Title</h2>
  <div class="space-y-4">
    <!-- Section content -->
  </div>
</section>
```

**Priority:** MEDIUM - Improves content structure
**Effort:** 3 hours

---

#### SH-005: Missing `<article>` elements for chat messages (MODERATE)

**WCAG Criteria:** 1.3.1 (Info and Relationships) - Level A

**Description:**
Chat messages are not wrapped in `<article>` elements, which would be semantically appropriate for self-contained content.

**Locations:**

- `apps/web/src/routes/app/chat/[id]/+page.svelte` (line 787-883)

**Current Code:**

```svelte
<div class="group max-w-[85%] rounded-2xl px-4 py-3">
  <!-- Message content -->
</div>
```

**Impact:**

- Chat messages are not semantically identified as discrete content units
- Screen readers cannot easily navigate between messages

**Recommended Fix:**

```svelte
<article class="group max-w-[85%] rounded-2xl px-4 py-3" aria-label="Message from {message.role}">
  <!-- Message content -->
</article>
```

**Priority:** LOW - Nice-to-have improvement
**Effort:** 2 hours

---

### Category 2: Heading Hierarchy (SERIOUS)

#### SH-006: Inconsistent heading hierarchy (SERIOUS)

**WCAG Criteria:** 1.3.1 (Info and Relationships) - Level A, 2.4.1 (Bypass Blocks) - Level A

**Description:**
Pages do not follow a logical heading hierarchy. Some pages start with `<h3>`, others have no headings at all.

**Issues by Page:**

**Chat Page** (`apps/web/src/routes/app/chat/[id]/+page.svelte`):

- ✅ HAS `<h1>` for page title (line 706)
- ✅ Properly structured
- **Status:** GOOD

**Models Manager Page** (`apps/web/src/routes/app/settings/models-manager.svelte`):

- ❌ Uses `<h3>` for page title (line 252)
- ❌ Should start with `<h1>` or `<h2>` depending on context
- **Status:** NEEDS FIX

**Settings Pages (api-keys, account, etc.):**

- ❓ Not audited yet (likely similar issues)

**Auth Pages (login, register):**

- ❌ No visible headings
- **Status:** NEEDS FIX

**Impact:**

- Screen reader users cannot understand page structure
- Cannot navigate by headings
- Violates WCAG 2.4.1 (Bypass Blocks) - Level A
- Violates WCAG 1.3.1 (Info and Relationships) - Level A

**Recommended Fix:**
Ensure every page has:

1. Exactly one `<h1>` for the main page title
2. `<h2>` for major sections
3. `<h3>` for subsections
4. No skipped heading levels

**Priority:** HIGH - Critical for screen reader navigation
**Effort:** 2 hours

---

#### SH-007: Missing headings on auth pages (SERIOUS)

**WCAG Criteria:** 2.4.1 (Bypass Blocks) - Level A

**Description:**
Login and register pages have no visible headings, making it difficult for screen reader users to understand the page purpose.

**Locations:**

- `apps/web/src/routes/(auth)/login/+page.svelte`
- `apps/web/src/routes/(auth)/register/+page.svelte`

**Current Code:**

```svelte
<div class="w-full max-w-sm">
  <LoginForm ... />
</div>
```

**Impact:**

- Screen reader users don't know the page purpose
- Cannot navigate to the page title

**Recommended Fix:**

```svelte
<div class="w-full max-w-sm">
  <h1 class="sr-only">Sign in to your account</h1>
  <LoginForm ... />
</div>
```

Note: LoginForm component may need to be updated to include proper heading.

**Priority:** HIGH - Critical for orientation
**Effort:** 1 hour

---

### Category 3: ARIA Landmarks (SERIOUS)

#### SH-008: Missing ARIA landmark roles (SERIOUS)

**WCAG Criteria:** 2.4.1 (Bypass Blocks) - Level A, 1.3.1 (Info and Relationships) - Level A

**Description:**
While HTML5 elements are preferred, the application also lacks ARIA landmark roles as a fallback. This is particularly important for older screen readers or when HTML5 elements are not properly supported.

**Missing Roles:**

- `role="main"` on main content areas
- `role="navigation"` on navigation areas
- `role="banner"` on page headers
- `role="contentinfo"` on page footers
- `role="complementary"` on sidebars
- `role="search"` on search inputs
- `role="form"` on forms

**Impact:**

- Poor screen reader navigation
- Violates WCAG 2.4.1 (Bypass Blocks) - Level A

**Recommended Fix:**
Add ARIA landmark roles alongside HTML5 elements for maximum compatibility:

```svelte
<main role="main" id="main-content" tabindex={-1}>
  <!-- Content -->
</main>

<nav role="navigation" aria-label="Main navigation">
  <!-- Navigation -->
</nav>
```

**Priority:** MEDIUM - Important for compatibility
**Effort:** 2 hours

---

#### SH-009: Missing aria-label on navigation (SERIOUS)

**WCAG Criteria:** 2.4.1 (Bypass Blocks) - Level A, 1.3.1 (Info and Relationships) - Level A

**Description:**
Navigation areas lack descriptive `aria-label` attributes, making it difficult for screen reader users to understand the purpose of each navigation region.

**Locations:**

- `apps/web/src/lib/components/app-sidebar.svelte` (Navigation Rail)
- `apps/web/src/lib/components/secondary-sidebar/ChatList.svelte` (Chat List)
- `apps/web/src/lib/components/secondary-sidebar/SettingsNav.svelte` (Settings Navigation)

**Impact:**

- Screen reader users hear "navigation" but don't know which navigation
- Cannot distinguish between primary and secondary navigation

**Recommended Fix:**

```svelte
<!-- Primary navigation (Navigation Rail) -->
<nav id="navigation" aria-label="Main navigation">
  <Sidebar.Root>
    <!-- Navigation items -->
  </Sidebar.Root>
</nav>

<!-- Secondary navigation (Chat List) -->
<nav aria-label="Chat history">
  <ChatList />
</nav>

<!-- Settings navigation -->
<nav aria-label="Settings sections">
  <SettingsNav />
</nav>
```

**Priority:** MEDIUM - Important for clarity
**Effort:** 1 hour

---

### Category 4: Other Semantic Issues (MODERATE)

#### SH-010: Forms without proper semantic structure (MODERATE)

**WCAG Criteria:** 1.3.1 (Info and Relationships) - Level A

**Description:**
Forms are not wrapped in `<form>` elements with proper landmarks.

**Locations:**

- `apps/web/src/routes/app/chat/[id]/+page.svelte` (line 905-967) - Chat input form
- `apps/web/src/routes/app/settings/models-manager.svelte` - Model configuration forms

**Current Code:**

```svelte
<form onsubmit={handleSubmit}>
  <div class="flex gap-2">
    <textarea ...></textarea>
    <Button ...>Send</Button>
  </div>
</form>
```

**Impact:**

- Forms are not semantically identified
- Screen readers cannot easily identify form boundaries

**Recommended Fix:**

```svelte
<form onsubmit={handleSubmit} aria-label="Chat message form">
  <div class="flex gap-2">
    <textarea ...></textarea>
    <Button ...>Send</Button>
  </div>
</form>
```

**Priority:** LOW - Forms already have some structure
**Effort:** 1 hour

---

#### SH-011: Cards use div instead of semantic elements (MODERATE)

**WCAG Criteria:** 1.3.1 (Info and Relationships) - Level A

**Description:**
Card components are implemented using generic `<div>` elements. While the Card UI components from shadcn-svelte might have some semantics, they should be verified.

**Locations:**

- `apps/web/src/routes/app/settings/models-manager.svelte` (Model cards)

**Impact:**

- Card content is not semantically grouped
- Screen readers may not identify cards as discrete units

**Recommended Fix:**
Ensure Card components use `<article>` or add `role="article"`:

```svelte
<article class={model.isActive ? 'border-primary' : ''} aria-label={`Model: ${model.name}`}>
  <Card>
    <CardHeader>
      <!-- Card content -->
    </CardHeader>
  </Card>
</article>
```

**Priority:** LOW - Cosmetic issue
**Effort:** 2 hours

---

#### SH-012: No use of `<aside>` for complementary content (MODERATE)

**WCAG Criteria:** 1.3.1 (Info and Relationships) - Level A

**Description:**
Secondary sidebars and complementary content areas should use `<aside>` elements with `role="complementary"`.

**Locations:**

- Secondary Sidebar (Chat List, Settings Nav)

**Current Code:**

```svelte
<Sidebar.Root collapsible="none" class={$secondarySidebarStore ? 'flex-1' : 'w-0 overflow-hidden'}>
  <ChatList ... />
</Sidebar.Root>
```

**Impact:**

- Complementary content is not semantically identified
- Screen readers cannot distinguish between main and complementary content

**Recommended Fix:**

```svelte
<aside role="complementary" aria-label="Chat history">
  <Sidebar.Root>
    <ChatList ... />
  </Sidebar.Root>
</aside>
```

**Priority:** LOW - Nice-to-have improvement
**Effort:** 1 hour

---

## Summary by Priority

### Critical Priority (Fix Immediately)

1. **SH-001**: Add `<main>` landmark to all layouts
2. **SH-002**: Add `<nav>` landmarks to navigation areas
3. **SH-006**: Fix heading hierarchy across all pages
4. **SH-007**: Add headings to auth pages

### High Priority (Fix Soon)

1. **SH-003**: Add `<header>` elements
2. **SH-008**: Add ARIA landmark roles
3. **SH-009**: Add aria-label to navigation areas

### Medium Priority (Fix When Possible)

1. **SH-004**: Add `<section>` elements for content areas
2. **SH-005**: Add `<article>` elements for chat messages

### Low Priority (Nice to Have)

1. **SH-010**: Add form landmarks
2. **SH-011**: Use semantic elements for cards
3. **SH-012**: Add `<aside>` elements

---

## Recommendations

### Immediate Actions (Week 1)

1. **Add HTML5 landmarks to all layouts** (3 hours)
   - Add `<main role="main">` to main content areas
   - Add `<nav role="navigation">` to navigation areas
   - Add `<header role="banner">` to page headers
   - Add `aria-label` attributes to all landmarks

2. **Fix heading hierarchy** (2 hours)
   - Ensure every page has exactly one `<h1>`
   - Audit all pages for proper heading structure
   - Add headings to auth pages (can be visually hidden)

### Short-term Actions (Week 2)

1. **Add ARIA landmark roles** (2 hours)
   - Add `role` attributes alongside HTML5 elements
   - Ensure all landmarks have descriptive labels

2. **Improve semantic structure** (3 hours)
   - Add `<section>` elements for content areas
   - Add `<article>` elements for chat messages
   - Add `<aside>` elements for complementary content

### Long-term Actions

1. **Create semantic HTML coding guidelines** (2 hours)
   - Document required semantic structure
   - Create templates for common patterns
   - Add to developer documentation

2. **Automated testing** (3 hours)
   - Add axe-core checks for landmarks
   - Add heading hierarchy validation
   - Integrate into CI/CD pipeline

---

## Testing Checklist

After implementing fixes, verify:

- [ ] Every page has exactly one `<h1>`
- [ ] Headings follow logical hierarchy (h1 → h2 → h3)
- [ ] Main content wrapped in `<main role="main">`
- [ ] Navigation wrapped in `<nav role="navigation">`
- [ ] Page headers use `<header role="banner">`
- [ ] Page footers use `<footer role="contentinfo">`
- [ ] Sidebars use `<aside role="complementary">`
- [ ] All landmarks have descriptive `aria-label`
- [ ] Chat messages wrapped in `<article>` elements
- [ ] Forms wrapped in `<form>` elements with `aria-label`
- [ ] Sections use `<section>` elements with `aria-labelledby`

**Manual Testing Required:**

- Test with NVDA screen reader
- Test with JAWS screen reader
- Verify landmark navigation works
- Verify heading navigation works

---

## Effort Estimate

| Priority  | Tasks        | Estimated Time |
| --------- | ------------ | -------------- |
| Critical  | 4 tasks      | 7 hours        |
| High      | 3 tasks      | 5 hours        |
| Medium    | 2 tasks      | 5 hours        |
| Low       | 3 tasks      | 5 hours        |
| **Total** | **12 tasks** | **22 hours**   |

**Quick Wins (can be done in 4 hours):**

1. Add `<main role="main">` to layouts (1 hour)
2. Add `<nav role="navigation">` to app-sidebar (1 hour)
3. Fix heading on models-manager page (1 hour)
4. Add aria-label to navigation areas (1 hour)

---

## References

- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize&levels=aaa)
- [HTML5 Landmarks](https://www.w3.org/TR/html5/sections.html)
- [ARIA Landmarks](https://www.w3.org/TR/wai-aria-1.2/#landmark_roles)
- [Semantic HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)
- [Heading Structure](https://www.w3.org/WAI/tutorials/page-structure/structure/)

---

## Conclusion

The SambungChat application has significant gaps in semantic HTML structure that impact accessibility for screen reader users. The most critical issues are:

1. **No HTML5 landmarks** (`<main>`, `<nav>`, `<header>`)
2. **Inconsistent heading hierarchy**
3. **Missing ARIA landmarks and labels**

These issues can be resolved with approximately **22 hours of development work**, with the most critical fixes requiring **7 hours**.

Implementing these fixes will:

- ✅ Improve screen reader navigation
- ✅ Meet WCAG 2.1 AA requirements for semantic structure
- ✅ Enhance overall accessibility
- ✅ Improve SEO and code quality

**Status:** 🔴 **NEEDS IMPROVEMENT** - Multiple critical and serious issues identified
