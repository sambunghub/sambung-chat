# Troubleshooting Guide - SambungChat

This documentation contains common problems encountered during development and their solutions.

---

## Table of Contents

1. [Build Errors](#build-errors)
2. [Svelte 5 Runes](#svelte-5-runes)
3. [Tailwind CSS v4](#tailwind-css-v4)
4. [Package Development](#package-development)
5. [Import/Export Issues](#importexport-issues)
6. [TypeScript Issues](#typescript-issues)

---

## Build Errors

### Error: "Cannot apply unknown utility class"

**Symptom:**

```
Cannot apply unknown utility class `text-muted-foreground`. Are you using CSS modules or similar and missing `@reference`?
```

**Cause:**
Using `@apply` directive with custom color classes inside `<style>` blocks in Tailwind CSS v4.

**Solution:**
Use CSS variables directly:

```svelte
<!-- DON'T -->
<style>
  input::placeholder {
    @apply text-muted-foreground;
  }
</style>

<!-- DO -->
<style>
  input::placeholder {
    color: hsl(var(--color-muted-foreground));
  }
</style>
```

**Reference:** `apps/web/src/lib/components/layout/SecondarySidebar.svelte:113-116`

---

### Error: "Could not resolve import 'lucide-svelte'"

**Symptom:**

```
Rollup failed to resolve import "lucide-svelte" from ".../packages/ui/dist/components/layout/..."
```

**Cause:**
Package dependency uses `@lucide/svelte` but import statement uses `lucide-svelte` (old package).

**Solution:**
Always use the package name that matches `package.json`:

```typescript
// DON'T
import { Icon } from 'lucide-svelte';

// DO
import { Icon } from '@lucide/svelte';
```

**Reference:** `apps/web/package.json` (use registered dependency)

---

### Error: "Cannot assign to constant"

**Symptom:**

```
Cannot assign to constant
at isTablet = window.innerWidth >= 768
```

**Cause:**
Using `const` with `$state` in Svelte 5 runes. Variables using `$state` must be reassignable.

**Solution:**

```svelte
<script lang="ts">
  // DON'T
  const count = $state(0);

  // DO
  let count = $state(0);
</script>
```

**Reference:** `apps/web/src/lib/components/layout/SecondarySidebar.svelte:30`

---

## Svelte 5 Runes

### $state Variables Must Use `let`

All reactive variables using `$state()` must be declared with `let` not `const`.

```svelte
<script lang="ts">
  // Reactive state - use let
  let count = $state(0);
  let items = $state<string[]>([]);
  let user = $state({ name: 'John' });

  // DOM references - can use let with $state
  let inputRef = $state<HTMLInputElement | undefined>(undefined);

  // Non-reactive - use const
  const config = { theme: 'dark' };
</script>
```

### Component Props with $props

Use `$props()` for component props:

```svelte
<script lang="ts">
  interface Props {
    title: string;
    count?: number;
  }

  let { title, count = 0 }: Props = $props();
</script>
```

### Derived State with $derived

Use `$derived` for computed values:

```svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);

  // Equivalent to useEffect
  $effect(() => {
    console.log('Count changed:', count);
  });
</script>
```

---

## Tailwind CSS v4

### Custom Colors in <style> Blocks

Tailwind CSS v4 does not support `@apply` with custom color utilities in `<style>` blocks. Use CSS variables:

**Available CSS Variables:**

```css
/* From apps/web/src/lib/styles/index.css */
--color-background
--color-foreground
--color-card
--color-card-foreground
--color-popover
--color-popover-foreground
--color-primary
--color-primary-foreground
--color-secondary
--color-secondary-foreground
--color-muted
--color-muted-foreground
--color-accent
--color-accent-foreground
--color-destructive
--color-destructive-foreground
--color-border
--color-input
--color-ring
```

**Usage Example:**

```css
.my-class {
  background-color: hsl(var(--color-primary));
  color: hsl(var(--color-primary-foreground));
  border-color: hsl(var(--color-border));
}
```

### Border Radius Variables

```css
border-radius: var(--radius); /* lg */
border-radius: calc(var(--radius) - 2px); /* md */
border-radius: calc(var(--radius) - 4px); /* sm */
```

### Animation Classes

For animations, ensure `tw-animate-css` plugin is installed in `package.json`:

```bash
bun add -D tw-animate-css
```

Add to `tailwind.config.js`:

```javascript
export default {
  plugins: [require('tw-animate-css')],
};
```

**Reference:** `apps/web/tailwind.config.js:49`

---

## Package Development

### svelte-package Build Scope

`svelte-package` **only builds** the `src/lib/` folder by default. Files outside `src/lib/` will not be included in `dist/`.

**Structure:**

```
apps/web/src/lib/
├── components/          # UI components
├── utils/              # Utility functions
└── stores/             # Svelte stores
```

---

### Export Paths

Export paths in `index.ts` files must be relative to that file's location:

```typescript
// apps/web/src/lib/components/auth/index.ts

// ✅ Correct - relative to current directory
export { SignInForm } from './SignInForm.svelte';
export { SignUpForm } from './SignUpForm.svelte';
```

---

## Import/Export Issues

### Named Export Conflicts

**Symptom:**

```
SyntaxError: The requested module contains conflicting star exports for name 'Header'
```

**Cause:**
Two components with the same export name.

**Solution:**
Use an alias for one of the exports:

```typescript
// apps/web/src/lib/components/layout/index.ts
export { Header as LayoutHeader } from './Header.svelte';

// apps/web/src/routes/+layout.svelte
import { LayoutHeader } from '$lib/components/layout';
```

---

## TypeScript Issues

### Type Imports for Svelte Components

Use `type` keyword for type-only imports:

```typescript
import type { Snippet } from 'svelte';
import type { HTMLInputElement } from 'svelte/elements';
```

### Generic Types with $state

```svelte
<script lang="ts">
  let inputRef = $state<HTMLInputElement | undefined>(undefined);
  let data = $state<DataItem[]>([]);
</script>
```

---

## Quick Debugging Commands

```bash
# Build entire monorepo
bun run build

# Type check
bun run check:types

# Find specific file
find . -name "*.svelte" | xargs grep "componentName"

# Search for imports in web app
rg "from '@lucide/svelte'" apps/web/src

# Check package exports
cat apps/web/package.json | grep -A 10 "exports"
```

---

## Pre-PR Checklist

Before creating a PR, ensure:

- [ ] Build passes: `bun run build`
- [ ] Type check passes: `bun run check:types`
- [ ] No `@apply` with custom colors in `<style>` blocks
- [ ] All imports use correct package names
- [ ] `$state` variables use `let` not `const`
- [ ] Component exports use proper paths
- [ ] No named export conflicts

---

## Additional Resources

- [Svelte 5 Runes Documentation](https://svelte.dev/docs/runes)
- [Tailwind CSS v4 Guide](https://tailwindcss.com/docs/v4-beta)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [shadcn-svelte Component Patterns](https://www.shadcn-svelte.com/docs/components)
