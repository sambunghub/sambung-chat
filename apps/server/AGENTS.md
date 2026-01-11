# apps/server - Hono Backend Server

Backend server untuk SambungChat dengan Hono framework + ORPC.

---

## 🚨 MANDATORY PRE-BUILD CHECKLIST

**SEBELUM melakukan build apapun, WAJIB lakukan ini dulu:**

```bash
# Step 1: Type check
bun run check

# Step 2: Jika ada error, BACA dan PERBAIKI error tersebut

# Step 3: HANYA setelah type check bersih, baru boleh build
bun run build
```

**RULE: Jika type check gagal, JANGAN lanjut ke build!**

---

## Setup & Run

```bash
# From apps/server directory
bun run dev       # Start dev server
bun run build     # Build for production
bun run start     # Start production server
```

---

## Structure

```
apps/server/
├── src/
│   ├── index.ts              # Server entry point
│   ├── routes/               # Hono routes (optional)
│   └── middleware/           # Auth middleware
├── tsdown.config.ts          # Build config
└── package.json
```

---

## ORPC Integration

Server menggunakan ORPC untuk type-safe RPC communication dengan frontend.

```typescript
import { ORPC } from 'orpc';

export const orpc = new ORPC().router(chatsRouter).router(messagesRouter);
```

---

## Pre-PR Checklist

- [ ] `bun run check` passes
- [ ] `bun run build` succeeds
- [ ] API routes tested
