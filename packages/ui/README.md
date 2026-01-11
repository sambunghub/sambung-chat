# @sambung-chat/ui

Package UI untuk SambungChat menggunakan **shadcn-svelte** dan **Svelte 5**.

## 📁 Struktur Folder

```
packages/ui/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/          # ⚠️ JANGAN EDIT - Komponen shadcn-svelte (generated)
│   │   │   └── ...          # Komponen custom lainnya (aman di-edit)
│   │   ├── utils.ts         # Utility functions (cn, dll)
│   │   └── index.ts         # Export publik
│   ├── styles/
│   │   ├── tokens.css       # Design tokens (OKLCH colors)
│   │   └── index.css        # Global styles & Tailwind imports
│   └── components/          # Legacy components (akan di-migrate)
├── components.json          # Konfigurasi shadcn-svelte CLI
├── tailwind.config.js       # Konfigurasi Tailwind
└── tsconfig.json            # Konfigurasi TypeScript
```

## ⚠️ Aturan Penting

### 🚫 JANGAN EDIT: `src/lib/components/ui/`

Folder ini berisi komponen yang di-generate langsung oleh **shadcn-svelte CLI**. Jangan edit manual karena:

1. Perubahan akan **timpa** saat menjalankan `npx shadcn-svelte add` lagi
2. Komponen mengikuti pattern dari shadcn-svelte repository
3. Updates dari shadcn-svelte akan lebih mudah tanpa conflict

### ✅ AMAN DI-EDIT:

- `src/lib/utils.ts` - Utility functions
- `src/styles/` - Design tokens dan custom styles
- `src/lib/components/` (luar folder `ui/`) - Komponen custom
- `src/components/` - Legacy components
- `components.json` - Konfigurasi CLI
- `tailwind.config.js` - Tailwind configuration

## 🎨 Menambah Komponen Baru dengan shadcn-svelte CLI

### Prasyarat

Pastikan sudah memiliki file `components.json` di root package UI.

### Cara Menambah Komponen

```bash
# Dari root project
cd packages/ui

# Tambah komponen (contoh: dialog, dropdown-menu)
npx shadcn-svelte@latest add dialog
npx shadcn-svelte@latest add dropdown-menu
npx shadcn-svelte@latest add select

# Tambah multiple komponen sekaligus
npx shadcn-svelte@latest add dialog dropdown-menu select
```

### Setelah Menambah Komponen

Setelah CLI selesai, komponen akan otomatis ada di `src/lib/components/ui/`:

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

## 🔧 Menggunakan Komponen di Aplikasi

### Import Komponen

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
    <CardDescription>Masuk ke akun Anda</CardDescription>
  </CardHeader>
  <CardContent>
    <form>
      <Input type="email" placeholder="Email" />
      <Textarea placeholder="Pesan" />
      <Button>Kirim</Button>
    </form>
  </CardContent>
</Card>
```

### Import Styles

Di `apps/web/src/app.html` atau entry point aplikasi:

```html
<link rel="stylesheet" href="@sambung-chat/ui/styles.css" />
```

Atau import di Svelte file:

```svelte
<script>
  import '@sambung-chat/ui/styles.css';
</script>
```

## 🎨 Design Tokens

Warna menggunakan format **OKLCH** (standard shadcn-svelte):

| Warna           | Hex     | OKLCH                    |
| --------------- | ------- | ------------------------ |
| Primary (Teal)  | #208B8D | `oklch(0.58 0.10 181.5)` |
| Accent (Orange) | #E67E50 | `oklch(0.65 0.15 21)`    |

### Menggunakan Design Tokens di Tailwind

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

## 📦 Komponen yang Tersedia

Komponen shadcn-svelte yang sudah ditambahkan:

- ✅ `Button` - Dengan variants: default, destructive, outline, secondary, ghost, link
- ✅ `Input` - Text input field
- ✅ `Textarea` - Multi-line text input
- ✅ `Card` - Card container dengan Header, Title, Description, Content, Footer

### Daftar Komponen shadcn-svelte yang Tersedia untuk Ditambahkan

[https://shadcn-svelte.com/docs/components](https://shadcn-svelte.com/docs/components)

Populer:

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

Pastikan `tsconfig.json` memiliki path aliases:

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

### Styles tidak berfungsi

Pastikan:

1. `styles.css` sudah di-import di aplikasi
2. `tailwind.config.js` sudah dikonfigurasi dengan content path yang benar

### Build error

Jalankan:

```bash
bun install
bun run check
```

## 📚 Referensi

- [shadcn-svelte Documentation](https://shadcn-svelte.com)
- [Svelte 5 Documentation](https://svelte.dev/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
