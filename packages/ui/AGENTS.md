# @sambung-chat/ui - AI Agent Reference

Documentation for AI agents working on this UI package.

## 🚨 MANDATORY PRE-BUILD CHECKLIST

**BEFORE doing any build, YOU MUST do this first:**

```bash
# Step 1: Type check with bun
bun run check

# Step 2: Type check with svelte-check for detailed errors
npx svelte-check --tsconfig ./tsconfig.json

# Step 3: If there are errors, READ and FIX those errors
# Example to see specific errors:
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | grep -A 2 "NavigationRail"

# Step 4: ONLY after type check is clean, you may build
bun run build
```

**RULE: If type check fails, DO NOT proceed to build!**

Most common TypeScript errors:

- `const` with `$state` → Change to `let`
- Import `lucide-svelte` → Change to `@lucide/svelte`
- Type not recognized → Add type annotation
- Props incorrect → Check interface Props

## 🤖 Contract for AI Agents

### ⛔ CRITICAL: DO NOT EDIT `src/lib/components/ui/`

**Reason:** This folder contains **generated code** from shadcn-svelte CLI.

**Consequences if edited:**

- Changes will be **OVERWRITTEN** when user runs `npx shadcn-svelte add [component]`
- Will cause merge conflicts when updating components from shadcn-svelte
- Violates shadcn-svelte workflow best practice

**Correct Solution:**

- If you need variant/custom style → use `className` prop when using the component
- If you need different behavior → wrap the component in a custom component elsewhere

### ✅ Safe Areas to Edit

```
packages/ui/
├── src/
│   ├── lib/
│   │   ├── utils.ts                 # ✅ SAFE - Utility functions
│   │   ├── index.ts                 # ✅ SAFE - Public exports
│   │   └── components/              # ✅ SAFE - Custom components
│   │       └── (create component wrappers here)
│   ├── styles/                      # ✅ SAFE - Design tokens & custom styles
│   │   ├── tokens.css
│   │   └── index.css
│   └── components/                  # ✅ SAFE - Legacy components
├── components.json                  # ✅ SAFE - shadcn-svelte config
└── tailwind.config.js               # ✅ SAFE - Tailwind config
```

## 🔧 Workflow for Adding New Components

### If User Requests to Add shadcn-svelte Component

**DON'T:**

- ❌ Copy-paste from shadcn-svelte repo manually
- ❌ Edit files in `src/lib/components/ui/`
- ❌ Create new files in `src/lib/components/ui/`

**DO:**

```bash
cd packages/ui
npx shadcn-svelte@latest add [component-name]
```

### Custom Component Implementation Example

If you need a component with custom variants:

```svelte
<!-- src/lib/components/CustomButton.svelte -->
<script>
  import { Button } from '@sambung-chat/ui';

  export let variant = 'custom';
  export let children;
</script>

<Button variant="default" class="bg-gradient-to-r from-purple-500 to-pink-500">
  {@render children()}
</Button>
```

## 🏗️ shadcn-svelte Internal Structure

### How shadcn-svelte CLI Works

1. `components.json` contains configuration (paths, styles, etc.)
2. `npx shadcn-svelte add [component]` will:
   - Download component from shadcn-svelte templates
   - Install dependencies if needed
   - Generate file in `src/lib/components/ui/[component]/`
   - Update exports if needed

### shadcn-svelte Component Pattern

Components use:

- **Svelte 5 runes** (`$state`, `$derived`, `$props`)
- **Snippet API** for children rendering
- **tailwind-variants** for variant management
- **bits-ui** as headless primitive foundation

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  type $$Props = {
    class?: string;
    children: Snippet;
  };

  export let className: $$Props['class'] = undefined;
  export let children: $$Props['children'];
</script>

<div class={cn('base-classes', className)}>
  {@render children()}
</div>
```

## 🎨 Design System Configuration

### Color Format: OKLCH

shadcn-svelte uses **OKLCH** not HSL:

```css
/* src/styles/tokens.css */
:root {
  --primary: oklch(0.58 0.1 181.5); /* Teal #208B8D */
  --accent: oklch(0.65 0.15 21); /* Orange #E67E50 */
}
```

### Mapping OKLCH to Tailwind

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--color-primary))',
        // CSS variables use HSL wrapper
      },
    },
  },
};
```

Note: Even though tokens use OKLCH, Tailwind still uses `hsl()` wrapper due to how CSS variables work.

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '$lib/utils'"

**Cause:** TypeScript doesn't recognize path alias

**Fix:** Ensure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "paths": {
      "$lib": ["./src/lib"],
      "$lib/*": ["./src/lib/*"]
    }
  }
}
```

### Issue: Component doesn't appear after add

**Checklist:**

1. ✅ Component exists in `src/lib/components/ui/`
2. ✅ Export in `src/lib/components/ui/[component]/index.ts`
3. ✅ Re-export in `src/lib/index.ts` (if needed)
4. ✅ Run `bun run check` to verify

### Issue: Styles not applying

**Checklist:**

1. ✅ `@sambung-chat/ui/styles.css` is imported
2. ✅ `tailwind.config.js` content path includes `./src/**/*.{html,js,svelte,ts}`
3. ✅ `components.json` css path is correct

## 📝 Script Reference

```bash
# Type checking
bun run check

# Build package for distribution
bun run build

# Add components from shadcn-svelte
npx shadcn-svelte@latest add [component]
```

## 🔍 Debugging

### View Generated Types

```bash
# Build package to generate .d.ts files
bun run build

# Check dist folder
ls -la dist/
```

### Verify Component Exports

```typescript
// Test import in apps/web or elsewhere
import { Button } from '@sambung-chat/ui';
console.log(Button); // Should not be undefined
```

## 📚 External References

- [shadcn-svelte Docs](https://shadcn-svelte.com)
- [Svelte 5 Docs](https://svelte.dev/docs)
- [bits-ui Docs](https://bits-ui.com)
- [tailwind-variants Docs](https://craig-morten.github.io/tailwind-variants)
