# apps/web - SvelteKit Frontend Application

Frontend application untuk SambungChat dengan SvelteKit 5 + Svelte 5 Runes.

---

## 🚨 MANDATORY PRE-BUILD CHECKLIST

**SEBELUM melakukan build apapun, WAJIB lakukan ini dulu:**

```bash
# Step 1: Type check dengan svelte-check
bun run check

# Step 2: Atau dengan svelte-check untuk detail error
npx svelte-check --tsconfig ./tsconfig.json

# Step 3: Jika ada error, BACA dan PERBAIKI error tersebut
# Contoh untuk melihat error spesifik:
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | grep -A 2 "ComponentName"

# Step 4: HANYA setelah type check bersih, baru boleh build
bun run build
```

**RULE: Jika type check gagal, JANGAN lanjut ke build!**

---

## Setup & Run

```bash
# From apps/web directory
bun run dev       # Start dev server (http://localhost:5173)
bun run build     # Build for production
bun run preview   # Preview production build
bun run check     # Type check
```

---

## Structure

```
apps/web/
├── src/
│   ├── routes/              # SvelteKit file-based routing
│   │   ├── (auth)/          # Auth group layout
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (app)/           # App group layout (with sidebar)
│   │   │   ├── chat/
│   │   │   ├── prompts/
│   │   │   └── settings/
│   │   ├── +layout.svelte   # Root layout
│   │   └── +page.svelte     # Home page
│   ├── lib/                 # App-specific utilities
│   └── components/          # App-specific components
├── static/                  # Static assets
└── vite.config.ts           # Vite configuration
```

---

## SvelteKit Routing

### File-based Routing

```
routes/
├── +layout.svelte           # Root layout
├── +page.svelte             # / (home)
├── login/
│   └── +page.svelte         # /login
├── (app)/                   # Route group (no effect on URL)
│   ├── +layout.svelte       # Layout for app routes
│   ├── +page.svelte         # /app
│   └── chat/
│       └── +page.svelte     # /app/chat
```

### Load Functions

```svelte
<!-- +page.server.ts (server-side load) -->
import { redirect } from '@sveltejs/kit';
import { auth } from '@sambung-chat/auth';

export async function load(event) {
  const session = await auth.api.getSession({
    headers: event.request.headers
  });

  if (!session) {
    throw redirect(302, '/login');
  }

  return { session };
}
```

---

## Using @sambung-chat/ui

```svelte
<script lang="ts">
  import { Button, Input } from '@sambung-chat/ui';
</script>

<Button>Click me</Button>
<Input placeholder="Type here..." />
```

---

## ORPC Integration

```typescript
import { orpc } from '@sambung-chat/orpc';

// Type-safe API calls
const todos = await orpc.todos.getAll.query();
const newTodo = await orpc.todos.create.mutate({ title: 'New todo' });
```

---

## Common Patterns

### Page Component

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';

  let data = $state({});

  async function handleSubmit() {
    // Handle form submission
  }
</script>

<form onsubmit={handleSubmit}>
  <!-- Form content -->
</form>
```

### Layout Component

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { ThemeProvider } from '@sambung-chat/ui';
  import { onMount } from 'svelte';

  let { children } = $props();
</script>

<ThemeProvider>
  {@render children()}
</ThemeProvider>

<svelte:head>
  <title>SambungChat</title>
</svelte:head>

<slot />
```

---

## Pre-PR Checklist

Before committing changes:

- [ ] `bun run check` passes (TypeScript)
- [ ] `bun run build` succeeds
- [ ] No console errors
- [ ] Follows existing component patterns
