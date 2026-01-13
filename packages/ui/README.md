# @sambung-chat/ui

UI package for SambungChat using **shadcn-svelte** and **Svelte 5**.

## 📁 Folder Structure

```
packages/ui/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/          # ⚠️ DO NOT EDIT - shadcn-svelte components (generated)
│   │   │   └── ...          # Other custom components (safe to edit)
│   │   ├── utils.ts         # Utility functions (cn, etc)
│   │   └── index.ts         # Public exports
│   ├── styles/
│   │   ├── tokens.css       # Design tokens (OKLCH colors)
│   │   └── index.css        # Global styles & Tailwind imports
│   └── components/          # Legacy components (will be migrated)
├── components.json          # shadcn-svelte CLI configuration
├── tailwind.config.js       # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

## ⚠️ Important Rules

### 🚫 DO NOT EDIT: `src/lib/components/ui/`

This folder contains components generated directly by **shadcn-svelte CLI**. Do not edit manually because:

1. Changes will be **overwritten** when running `npx shadcn-svelte add` again
2. Components follow patterns from shadcn-svelte repository
3. Updates from shadcn-svelte will be easier without conflicts

### ✅ SAFE TO EDIT:

- `src/lib/utils.ts` - Utility functions
- `src/styles/` - Design tokens and custom styles
- `src/lib/components/` (outside `ui/` folder) - Custom components
- `src/components/` - Legacy components
- `components.json` - CLI configuration
- `tailwind.config.js` - Tailwind configuration

## 🎨 Adding New Components with shadcn-svelte CLI

### Prerequisites

Make sure you have `components.json` file in the UI package root.

### How to Add Components

```bash
# From project root
cd packages/ui

# Add component (example: dialog, dropdown-menu)
npx shadcn-svelte@latest add dialog
npx shadcn-svelte@latest add dropdown-menu
npx shadcn-svelte@latest add select

# Add multiple components at once
npx shadcn-svelte@latest add dialog dropdown-menu select
```

### After Adding Components

After CLI finishes, components will automatically be in `src/lib/components/ui/`:

```
src/lib/components/ui/
├── dialog/
│   ├── Dialog.svelte
│   ├── DialogHeader.svelte
│   └── ...
└── dropdown-menu/
    ├── DropdownMenu.svelte
    └── ...
```

## 🔧 Using Components in App

### Import Components

```svelte
<script>
  import { Button } from '@sambung-chat/ui';
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@sambung-chat/ui';
  import { Input } from '@sambung-chat/ui';
  import { Textarea } from '@sambung-chat/ui';
</script>

<Card>
  <CardHeader>
    <CardTitle>Login</CardTitle>
    <CardDescription>Sign in to your account</CardDescription>
  </CardHeader>
  <CardContent>
    <form>
      <Input type="email" placeholder="Email" />
      <Textarea placeholder="Message" />
      <Button>Send</Button>
    </form>
  </CardContent>
</Card>
```

### Import Styles

In `apps/web/src/app.html` or app entry point:

```html
<link rel="stylesheet" href="@sambung-chat/ui/styles.css" />
```

Or import in Svelte file:

```svelte
<script>
  import '@sambung-chat/ui/styles.css';
</script>
```

## 🎨 Design Tokens

Colors use **OKLCH** format (shadcn-svelte standard):

| Color           | Hex     | OKLCH                    |
| --------------- | ------- | ------------------------ |
| Primary (Teal)  | #208B8D | `oklch(0.58 0.10 181.5)` |
| Accent (Orange) | #E67E50 | `oklch(0.65 0.15 21)`    |

### Using Design Tokens in Tailwind

```html
<button class="bg-primary text-primary-foreground hover:bg-primary/90">Button</button>
```

## 🛠️ Build & Check

```bash
# Type checking
bun run check

# Build package
bun run build
```

## 📦 Available Components

shadcn-svelte components that have been added:

- ✅ `Button` - With variants: default, destructive, outline, secondary, ghost, link
- ✅ `Input` - Text input field
- ✅ `Textarea` - Multi-line text input
- ✅ `Card` - Card container with Header, Title, Description, Content, Footer
- ✅ `Label` - Form label
- ✅ `Checkbox` - Checkbox input
- ✅ `Separator` - Visual separator
- ✅ `Skeleton` - Loading placeholder
- ✅ `Tooltip` - Hover tooltip
- ✅ `Sonner/Toaster` - Toast notifications
- ✅ `DropdownMenu` - Dropdown menu
- ✅ `Select` - Select input

### Toast Notifications

Uses `svelte-sonner` for toast notifications.

#### Basic Usage

```ts
import { toast } from 'svelte-sonner';

// Success toast
toast.success('Account created successfully!');

// Error toast
toast.error('Failed to create account. Please try again.');

// Info toast
toast.info('Processing your request...');

// Warning toast
toast.warning('Please check your input');

// Loading toast (with dismiss)
const loadingToast = toast.loading('Creating account...');
// ... later
toast.dismiss(loadingToast);
```

#### With Description

```ts
toast.success('Account created!', {
  description: 'You can now sign in with your credentials.',
});
```

#### Promise Toast

```ts
toast.promise(createUserAccount(formData), {
  loading: 'Creating account...',
  success: 'Account created successfully!',
  error: (err) => `Failed to create account: ${err.message}`,
});
```

#### Toast Colors

| Type    | Background                    | Border                        | Usage       |
| ------- | ----------------------------- | ----------------------------- | ----------- |
| Success | `oklch(0.3 0.1 142)` - Teal   | `oklch(0.5 0.15 142)` - Teal  | Success     |
| Error   | `oklch(0.3 0.15 27)` - Red    | `oklch(0.5 0.2 27)` - Red     | Errors      |
| Warning | `oklch(0.3 0.12 48)` - Orange | `oklch(0.5 0.18 48)` - Orange | Warnings    |
| Info    | `oklch(0.3 0.1 240)` - Blue   | `oklch(0.5 0.15 240)` - Blue  | Information |
| Normal  | Popover colors                | Border colors                 | Default     |

#### Toaster Setup

The `Toaster` component must be added to your root layout (dynamic import for SSR):

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  let ToasterComponent = $state<any>(null);

  onMount(async () => {
    const { Toaster } = await import('@sambung-chat/ui');
    ToasterComponent = Toaster;
  });
</script>

{#if ToasterComponent}
  <svelte:component this={ToasterComponent} />
{/if}
```

### List of Available shadcn-svelte Components to Add

[https://shadcn-svelte.com/docs/components](https://shadcn-svelte.com/docs/components)

Popular:

- `Dialog` - Modal dialog
- `DropdownMenu` - Dropdown menu
- `Select` - Select input
- `Checkbox` - Checkbox input
- `Switch` - Toggle switch
- `Tabs` - Tab navigation
- `Tooltip` - Hover tooltip
- `Toast` - Notification toast
- `Alert` - Alert messages

## 🔍 Troubleshooting

### Module not found: $lib/utils

Make sure `tsconfig.json` has path aliases:

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

### Styles not working

Make sure:

1. `styles.css` is imported in the app
2. `tailwind.config.js` is configured with correct content path

### Build error

Run:

```bash
bun install
bun run check
```

## 📚 References

- [shadcn-svelte Documentation](https://shadcn-svelte.com)
- [Svelte 5 Documentation](https://svelte.dev/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
