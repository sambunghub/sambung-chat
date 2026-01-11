# @sambung-chat/ui - AI Agent Reference

Documentation untuk AI agents yang bekerja pada package UI ini.

## 🚨 MANDATORY PRE-BUILD CHECKLIST

**SEBELUM melakukan build apapun, WAJIB lakukan ini dulu:**

```bash
# Step 1: Type check dengan bun
bun run check

# Step 2: Type check dengan svelte-check untuk detail error
npx svelte-check --tsconfig ./tsconfig.json

# Step 3: Jika ada error, BACA dan PERBAIKI error tersebut
# Contoh untuk melihat error spesifik:
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | grep -A 2 "NavigationRail"

# Step 4: HANYA setelah type check bersih, baru boleh build
bun run build
```

**RULE: Jika type check gagal, JANGAN lanjut ke build!**

Error TypeScript yang paling umum:

- `const` dengan `$state` → Ganti ke `let`
- Import `lucide-svelte` → Ganti ke `@lucide/svelte`
- Type tidak dikenali → Tambahkan type annotation
- Props tidak benar → Cek interface Props

## 🤖 Kontrak untuk AI Agents

### ⛔ CRITICAL: JANGAN EDIT `src/lib/components/ui/`

**Alasan:** Folder ini adalah **generated code** dari shadcn-svelte CLI.

**Konsekuensi jika di-edit:**

- Perubahan akan **OVERWRITTEN** saat user menjalankan `npx shadcn-svelte add [component]`
- Akan menyebabkan merge conflict saat update komponen dari shadcn-svelte
- Melanggar best practice shadcn-svelte workflow

**Solusi yang Benar:**

- Jika butuh variant/custom style → gunakan `className` prop saat memakai komponen
- Jika butuh behavior berbeda → wrap komponen dalam komponen custom di lokasi lain

### ✅ Area yang Aman untuk Diedit

```
packages/ui/
├── src/
│   ├── lib/
│   │   ├── utils.ts                 # ✅ AMAN - Utility functions
│   │   ├── index.ts                 # ✅ AMAN - Public exports
│   │   └── components/              # ✅ AMAN - Custom components
│   │       └── (buat komponen wrapper di sini)
│   ├── styles/                      # ✅ AMAN - Design tokens & custom styles
│   │   ├── tokens.css
│   │   └── index.css
│   └── components/                  # ✅ AMAN - Legacy components
├── components.json                  # ✅ AMAN - shadcn-svelte config
└── tailwind.config.js               # ✅ AMAN - Tailwind config
```

## 🔧 Workflow Menambah Komponen Baru

### Jika User Minta Menambah Komponen shadcn-svelte

**DONT:**

- ❌ Copy-paste dari shadcn-svelte repo manual
- ❌ Edit file di `src/lib/components/ui/`
- ❌ Buat file baru di `src/lib/components/ui/`

**DO:**

```bash
cd packages/ui
npx shadcn-svelte@latest add [nama-komponen]
```

### Contoh Implementasi Komponen Custom

Jika butuh komponen dengan variant custom:

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

## 🏗️ Struktur Internal shadcn-svelte

### Cara Kerja shadcn-svelte CLI

1. `components.json` berisi konfigurasi (path, style, dsb)
2. `npx shadcn-svelte add [component]` akan:
   - Download komponen dari shadcn-svelte templates
   - Install dependencies jika perlu
   - Generate file di `src/lib/components/ui/[component]/`
   - Update exports jika diperlukan

### Pattern Komponen shadcn-svelte

Komponen menggunakan:

- **Svelte 5 runes** (`$state`, `$derived`, `$props`)
- **Snippet API** untuk children rendering
- **tailwind-variants** untuk variant management
- **bits-ui** sebagai headless primitive foundation

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

shadcn-svelte menggunakan **OKLCH** bukan HSL:

```css
/* src/styles/tokens.css */
:root {
  --primary: oklch(0.58 0.1 181.5); /* Teal #208B8D */
  --accent: oklch(0.65 0.15 21); /* Orange #E67E50 */
}
```

### Mapping OKLCH ke Tailwind

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--color-primary))',
        // CSS variables menggunakan HSL wrapper
      },
    },
  },
};
```

Catatan: Meskipun tokens menggunakan OKLCH, Tailwind tetap menggunakan `hsl()` wrapper karena cara kerja CSS variables.

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '$lib/utils'"

**Cause:** TypeScript tidak mengenali path alias

**Fix:** Pastikan `tsconfig.json` memiliki:

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

### Issue: Komponen tidak muncul setelah add

**Checklist:**

1. ✅ Komponen sudah ada di `src/lib/components/ui/`
2. ✅ Export di `src/lib/components/ui/[component]/index.ts`
3. ✅ Re-export di `src/lib/index.ts` (jika perlu)
4. ✅ Run `bun run check` untuk verify

### Issue: Styles tidak apply

**Checklist:**

1. ✅ `@sambung-chat/ui/styles.css` sudah di-import
2. ✅ `tailwind.config.js` content path mencakup `./src/**/*.{html,js,svelte,ts}`
3. ✅ `components.json` css path benar

## 📝 Script Reference

```bash
# Type checking
bun run check

# Build package untuk distribusi
bun run build

# Menambah komponen dari shadcn-svelte
npx shadcn-svelte@latest add [component]
```

## 🔍 Debugging

### Melihat Generated Types

```bash
# Build package untuk generate .d.ts files
bun run build

# Cek dist folder
ls -la dist/
```

### Verify Component Exports

```typescript
// Test import di apps/web atau tempat lain
import { Button } from '@sambung-chat/ui';
console.log(Button); // Harus tidak undefined
```

## 📚 External References

- [shadcn-svelte Docs](https://shadcn-svelte.com)
- [Svelte 5 Docs](https://svelte.dev/docs)
- [bits-ui Docs](https://bits-ui.com)
- [tailwind-variants Docs](https://craig-morten.github.io/tailwind-variants)
