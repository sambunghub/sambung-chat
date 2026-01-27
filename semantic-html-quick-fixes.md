# Semantic HTML Quick Fixes - Developer Guide

**Purpose:** Quick reference for fixing semantic HTML issues in SambungChat
**Related Task:** 3.1 - Audit Semantic HTML Structure
**Last Updated:** 2025-01-26

---

## TL;DR - Top 4 Critical Fixes (4 hours)

### 1. Add `<main>` landmark to layouts (1 hour)

**Files:**

- `apps/web/src/routes/app/+layout.svelte`
- `apps/web/src/routes/(auth)/+layout.svelte`

**Fix:**

```svelte
<!-- BEFORE -->
<Sidebar.Inset id="main-content" tabindex={-1}>
  {@render children()}
</Sidebar.Inset>

<!-- AFTER -->
<main id="main-content" tabindex={-1} role="main">
  {@render children()}
</main>
```

---

### 2. Add `<nav>` landmark to app-sidebar (1 hour)

**File:** `apps/web/src/lib/components/app-sidebar.svelte`

**Fix:**

```svelte
<!-- BEFORE -->
<div id="navigation" tabindex={-1} class="flex overflow-hidden" {...restProps}>
  <Sidebar.Root>
    <!-- Navigation content -->
  </Sidebar.Root>
</div>

<!-- AFTER -->
<nav id="navigation" tabindex={-1} aria-label="Main navigation" role="navigation">
  <Sidebar.Root>
    <!-- Navigation content -->
  </Sidebar.Root>
</nav>
```

---

### 3. Fix heading hierarchy (1 hour)

**Files:**

- `apps/web/src/routes/app/settings/models-manager.svelte` (change h3 → h1)
- `apps/web/src/routes/app/settings/api-keys/+page.svelte` (ensure h1)
- Other settings pages

**Fix:**

```svelte
<!-- BEFORE -->
<h3 class="text-lg font-semibold">Configure AI Models</h3>

<!-- AFTER -->
<h1 class="text-lg font-semibold">Configure AI Models</h1>
```

---

### 4. Add aria-label to navigation (1 hour)

**Files:**

- `apps/web/src/lib/components/app-sidebar.svelte`
- `apps/web/src/lib/components/secondary-sidebar/ChatList.svelte`
- `apps/web/src/lib/components/secondary-sidebar/SettingsNav.svelte`

**Fix:**

```svelte
<!-- Primary Navigation -->
<nav aria-label="Main navigation">

<!-- Chat List (Secondary Sidebar) -->
<nav aria-label="Chat history">

<!-- Settings Navigation -->
<nav aria-label="Settings sections">
```

---

## Complete Fix Checklist

### Layout Files

#### ✅ Root Layout: `apps/web/src/routes/+layout.svelte`

**Issues:** None (wrapper layout, SkipLinks already present)

#### ✅ App Layout: `apps/web/src/routes/app/+layout.svelte`

**Issues:** Missing `<main>` landmark

```svelte
<!-- Line 45-47 -->
<main id="main-content" tabindex={-1} role="main">
  {@render children()}
</main>
```

#### ✅ Auth Layout: `apps/web/src/routes/(auth)/+layout.svelte`

**Issues:** Using `<div>` instead of `<main>`

```svelte
<!-- Line 6-12 -->
<main
  id="main-content"
  tabindex={-1}
  role="main"
  class="bg-background flex min-h-screen items-center justify-center p-4"
>
  {@render children()}
</main>
```

---

### Page Files

#### ✅ Chat Page: `apps/web/src/routes/app/chat/[id]/+page.svelte`

**Issues:** Missing `<header>` element

```svelte
<!-- Line 700 -->
<header class="shrink-0 border-b px-6 py-4">
  <div class="flex items-center justify-between">
    <!-- Content -->
  </div>
</header>
```

**Chat messages should use `<article>`:**

```svelte
<!-- Line 787 -->
<article class="group max-w-[85%] ..." aria-label="Message from {message.role}">
  <div class="rounded-2xl px-4 py-3">
    <!-- Message content -->
  </div>
</article>
```

#### ✅ Models Manager: `apps/web/src/routes/app/settings/models-manager.svelte`

**Issues:** Wrong heading level, missing `<header>`

```svelte
<!-- Line 250-258 -->
<header class="flex items-center justify-between">
  <div>
    <h1 class="text-lg font-semibold">Configure AI Models</h1>
    <p class="text-sm">Add and manage your AI model configurations</p>
  </div>
  <Button>Add Model</Button>
</header>
```

**Model cards should use `<article>`:**

```svelte
<!-- Line 286 -->
<article class={model.isActive ? 'border-primary' : ''} aria-label={`Model: ${model.name}`}>
  <Card>
    <CardHeader>
      <!-- Card content -->
    </CardHeader>
  </Card>
</article>
```

#### ✅ API Keys Page: `apps/web/src/routes/app/settings/api-keys/+page.svelte`

**Action Required:** Audit for heading structure and semantic elements

#### ✅ Account Settings Page: `apps/web/src/routes/app/settings/account/+page.svelte`

**Action Required:** Audit for heading structure and semantic elements

#### ✅ Login Page: `apps/web/src/routes/(auth)/login/+page.svelte`

**Issues:** Missing visible or hidden heading

```svelte
<!-- Add to page -->
<div class="w-full max-w-sm">
  <h1 class="sr-only">Sign in to your account</h1>
  <LoginForm ... />
</div>
```

#### ✅ Register Page: `apps/web/src/routes/(auth)/register/+page.svelte`

**Issues:** Missing visible or hidden heading

```svelte
<!-- Add to page -->
<div class="w-full max-w-sm">
  <h1 class="sr-only">Create your account</h1>
  <RegisterForm ... />
</div>
```

---

### Component Files

#### ✅ App Sidebar: `apps/web/src/lib/components/app-sidebar.svelte`

**Issues:** Missing `<nav>` element and aria-label

```svelte
<!-- Line 113 -->
<nav
  id="navigation"
  tabindex={-1}
  aria-label="Main navigation"
  role="navigation"
  class="flex overflow-hidden"
>
  <Sidebar.Root>
    <!-- Navigation Rail -->
  </Sidebar.Root>

  <!-- Secondary Sidebar - wrap in aside -->
  {#if showSecondarySidebar}
    <aside role="complementary" aria-label="Chat history and settings">
      <Sidebar.Root>
        <ChatList />
      </Sidebar.Root>
    </aside>
  {/if}
</nav>
```

#### ✅ Chat List Component: `apps/web/src/lib/components/secondary-sidebar/ChatList.svelte`

**Action Required:** Add aria-label to container

```svelte
<nav aria-label="Chat history">
  <!-- Chat list content -->
</nav>
```

#### ✅ Settings Navigation Component: `apps/web/src/lib/components/secondary-sidebar/SettingsNav.svelte`

**Action Required:** Add aria-label to container

```svelte>
<nav aria-label="Settings sections">
  <!-- Settings navigation -->
</nav>
```

---

## Code Patterns

### 1. Page Structure Pattern

```svelte
<script>
  // Your imports
</script>

{#if loading}
  <p>Loading...</p>
{:else}
  <!-- Page Header -->
  <header>
    <h1>Page Title</h1>
    <p>Page description</p>
  </header>

  <!-- Main Content -->
  <main>
    <!-- Section 1 -->
    <section aria-labelledby="section-1-heading">
      <h2 id="section-1-heading">Section Title</h2>
      <!-- Content -->
    </section>

    <!-- Section 2 -->
    <section aria-labelledby="section-2-heading">
      <h2 id="section-2-heading">Section Title</h2>
      <!-- Content -->
    </section>
  </main>
{/if}
```

### 2. Chat Message Pattern

```svelte
<article aria-label="Message from {message.role}">
  <div class="message-header">
    <p class="message-role">{message.role === 'user' ? 'You' : 'AI Assistant'}</p>
  </div>
  <div class="message-content">
    {@html messageContent}
  </div>
</article>
```

### 3. Card Pattern

```svelte
<article aria-label={cardTitle}>
  <Card>
    <CardHeader>
      <CardTitle>{cardTitle}</CardTitle>
      <CardDescription>{cardDescription}</CardDescription>
    </CardHeader>
    <CardContent>
      <!-- Card content -->
    </CardContent>
  </Card>
</article>
```

### 4. Form Pattern

```svelte
<form aria-label={formDescription} onsubmit={handleSubmit}>
  <div class="form-group">
    <Label for={inputId}>Label</Label>
    <Input id={inputId} bind:value={formData.value} />
    <p class="text-muted-foreground text-xs">Help text</p>
  </div>
</form>
```

---

## Heading Hierarchy Rules

### DO's ✅

- ✅ Each page has exactly one `<h1>`
- ✅ Headings follow logical order (h1 → h2 → h3)
- ✅ Headings describe the content that follows
- ✅ Use visually hidden headings when necessary (`class="sr-only"`)

### DON'Ts ❌

- ❌ Skip heading levels (h1 → h3)
- ❌ Use headings for styling only
- ❌ Have multiple `<h1>` on a page
- ❌ Use `<div class="text-xl font-bold">` instead of `<h1>`

---

## ARIA Labels Reference

### Common Landmarks

```svelte
<!-- Main content -->
<main role="main" aria-label="Page name">
  <!-- Content -->
</main>

<!-- Primary navigation -->
<nav role="navigation" aria-label="Main navigation">
  <!-- Nav items -->
</nav>

<!-- Secondary navigation -->
<nav role="navigation" aria-label="Chat history">
  <!-- Secondary nav -->
</nav>

<!-- Complementary content (sidebar) -->
<aside role="complementary" aria-label="Additional information">
  <!-- Sidebar content -->
</aside>

<!-- Page header -->
<header role="banner">
  <!-- Logo, title, etc. -->
</header>

<!-- Page footer -->
<footer role="contentinfo">
  <!-- Copyright, links, etc. -->
</footer>

<!-- Form -->
<form role="form" aria-label="Contact form">
  <!-- Form fields -->
</form>

<!-- Search -->
<div role="search" aria-label="Search chats">
  <input type="search" placeholder="Search..." />
</div>
```

---

## Testing Your Changes

### Automated Tests

```bash
# Run accessibility tests
bun run test:axe

# Check for heading issues
bun run check:types
```

### Manual Browser Tests

1. Open DevTools → Elements
2. Look for semantic elements (`<main>`, `<nav>`, `<header>`, etc.)
3. Check ARIA attributes (`role`, `aria-label`)
4. Verify heading hierarchy (h1 → h2 → h3)

### Screen Reader Tests

1. Open NVDA (Windows) or VoiceOver (Mac)
2. Navigate by landmarks (NVDA: D, VoiceOver: VO + U)
3. Navigate by headings (NVDA: H, VoiceOver: VO + Command + H)
4. Verify all landmarks are announced clearly

---

## Quick Reference Table

| Element     | When to Use             | Required Attributes                    |
| ----------- | ----------------------- | -------------------------------------- |
| `<main>`    | Primary content of page | `role="main"`, `id="main-content"`     |
| `<nav>`     | Navigation region       | `role="navigation"`, `aria-label`      |
| `<header>`  | Page or section header  | `role="banner"` (for page header)      |
| `<footer>`  | Page or section footer  | `role="contentinfo"` (for page footer) |
| `<aside>`   | Complementary content   | `role="complementary"`, `aria-label`   |
| `<section>` | Thematic grouping       | `aria-labelledby` or `aria-label`      |
| `<article>` | Self-contained content  | `aria-label` (if not obvious)          |
| `<h1>`      | Main page title         | Exactly one per page                   |
| `<h2>`      | Major sections          | Multiple, after h1                     |
| `<h3>`      | Subsections             | Multiple, after h2                     |

---

## Common Mistakes

### ❌ Mistake 1: Using div for structure

```svelte
<div class="main-content">
  <div class="header">Title</div>
  <div class="content">...</div>
</div>
```

### ✅ Fix: Use semantic elements

```svelte
<main>
  <header><h1>Title</h1></header>
  <div class="content">...</div>
</main>
```

---

### ❌ Mistake 2: Multiple h1 on page

```svelte
<h1>Page Title</h1>
<section>
  <h1>Section Title</h1>
  <!-- Wrong! -->
</section>
```

### ✅ Fix: Use proper hierarchy

```svelte
<h1>Page Title</h1>
<section aria-labelledby="section-1">
  <h2 id="section-1">Section Title</h2>
  <!-- Correct! -->
</section>
```

---

### ❌ Mistake 3: Nav without label

```svelte
<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
</nav>
```

### ✅ Fix: Add aria-label

```svelte
<nav aria-label="Main navigation">
  <a href="/">Home</a>
  <a href="/about">About</a>
</nav>
```

---

## Resources

- [HTML5 Elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)
- [ARIA Landmarks](https://www.w3.org/TR/wai-aria-1.2/#landmark_roles)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Semantic Structure](https://www.w3.org/WAI/tutorials/page-structure/)

---

**Last Updated:** 2025-01-26
**Related:** `semantic-html-audit-report.md`, Task 3.1
