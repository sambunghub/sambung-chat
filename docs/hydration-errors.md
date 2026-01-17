# Hydration Errors - Prevention and Solutions

## Overview

Hydration errors occur when there's a mismatch between the server-rendered HTML and the client-side rendered content. This document captures common hydration issues in SambungChat and their solutions.

**Last Updated:** 2026-01-17

---

## Common Hydration Error Patterns

### 1. Tooltip Provider SSR Mismatch

**Error:**

```
Failed to hydrate: TypeError: element2.getAttribute is not a function
  in tooltip-provider.svelte
  in sidebar-provider.svelte
  in +layout.svelte
```

**Root Cause:**
The `bits-ui` Tooltip.Provider component doesn't handle SSR well. When it's included in server-rendered HTML, it creates DOM elements that behave differently during client-side hydration.

**Solution:**
Use browser-only rendering for Tooltip.Provider:

```svelte
<!-- packages/ui/src/lib/components/ui/sidebar/sidebar-provider.svelte -->
<script lang="ts">
  import { browser } from '$app/environment';
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  // ... other imports
</script>

{#if browser}
  <Tooltip.Provider delayDuration={0}>
    <div><!-- content --></div>
  </Tooltip.Provider>
{:else}
  <!-- Server-side: render without Tooltip.Provider -->
  <div><!-- content --></div>
{/if}
```

**Files Affected:**

- [`packages/ui/src/lib/components/ui/sidebar/sidebar-provider.svelte`](../packages/ui/src/lib/components/ui/sidebar/sidebar-provider.svelte)

---

### 2. Conditional Rendering with Server Data

**Error:**

```
Hydration failed because the initial UI does not match what was rendered on the server
```

**Root Cause:**
Using data from `load()` functions without null-safety can cause different renders on server vs client:

```svelte
<!-- BAD: Can cause hydration mismatch if data is undefined -->
{#if data.showSSO}
  <Button>SSO</Button>
{/if}
```

**Solution:**
Use optional chaining and null coalescing with defaults:

```svelte
<!-- GOOD: Always has a defined value -->
{#if data?.showSSO ?? false}
  <Button>SSO</Button>
{/if}
```

Or use derived values in components:

```svelte
<script lang="ts">
  let { showSSO = false }: Props = $props();

  // Ensure boolean values for SSR/client consistency
  const shouldShowSSO = $derived(Boolean(showSSO));
</script>

{#if shouldShowSSO}
  <Button>SSO</Button>
{/if}
```

**Files Affected:**

- [`apps/web/src/routes/(auth)/login/+page.svelte`](<../apps/web/src/routes/(auth)/login/+page.svelte>)
- [`apps/web/src/routes/(auth)/register/+page.svelte`](<../apps/web/src/routes/(auth)/register/+page.svelte>)
- [`apps/web/src/lib/components/login-form.svelte`](../apps/web/src/lib/components/login-form.svelte)
- [`apps/web/src/lib/components/register-form.svelte`](../apps/web/src/lib/components/register-form.svelte)

---

### 3. Tooltip Content Default Values

**Error:**

```
Hydration mismatch in sidebar menu buttons
```

**Root Cause:**
shadcn-svelte Sidebar.MenuButton has a default tooltip behavior that can cause SSR/client mismatches.

**Solution:**
Explicitly disable tooltips when not needed:

```svelte
<Sidebar.MenuButton
  size="lg"
  tooltipContent={undefined}  <!-- Disable default tooltip -->
>
```

**Files Affected:**

- [`apps/web/src/lib/components/app-sidebar.svelte`](../apps/web/src/lib/components/app-sidebar.svelte)

---

## Prevention Checklist

Before committing any UI changes, verify:

- [ ] **No browser-only APIs in SSR paths**
  - Use `browser` from `$app/environment` to conditionally render
  - Check for `window`, `document`, `localStorage` usage

- [ ] **Consistent conditional rendering**
  - Use `data?.prop ?? defaultValue` instead of `data.prop`
  - Use `$derived(Boolean(value))` for boolean props
  - Ensure server and client render identical initial HTML

- [ ] **Tooltip providers handled correctly**
  - Wrap with `{#if browser}` for SSR-heavy components
  - Use `tooltipContent={undefined}` to disable defaults

- [ ] **Run svelte-check**
  ```bash
  cd apps/web
  npx svelte-check --tsconfig ./tsconfig.json
  ```

---

## Testing for Hydration Issues

### Manual Testing

1. **Hard refresh** the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Check browser console for hydration warnings
3. Navigate between routes that use different layouts
4. Test with JavaScript disabled to see SSR-only output

### Console Errors to Watch For

```
[Hydration failed because...]
[Failed to hydrate...]
[TypeError: ...getAttribute is not a function]
[TypeError: ... is not a function]
```

---

## Related Documentation

- [`docs/sidebar-journey.md`](./sidebar-journey.md) - Sidebar implementation history
- [`docs/troubleshooting.md`](./troubleshooting.md) - Common build errors
- [SvelteKit SSR Documentation](https://kit.svelte.dev/docs/ssr)
- [shadcn-svelte Sidebar Blocks](https://shadcn-svelte.com/blocks/sidebar)

---

## Quick Reference

### Browser Check Pattern

```svelte
<script>
  import { browser } from '$app/environment';
</script>

{#if browser}
  <!-- Client-only content -->
{:else}
  <!-- SSR-safe fallback -->
{/if}
```

### Null-Safe Data Access

```svelte
<!-- Page component -->
<Component
  showFeature={data?.showFeature ?? false}
  {data?.item}
/>

<!-- Component internal -->
<script>
  let { showFeature = false, item }: Props = $props();
  const isEnabled = $derived(Boolean(showFeature));
</script>
```

### Disable Default Tooltips

```svelte
<Sidebar.MenuButton tooltipContent={undefined}>
  <!-- Button content -->
</Sidebar.MenuButton>
```
