# packages/api - API Routers & Procedures

Shared API routers untuk backend menggunakan ORPC + Zod validation.

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

## Structure

```
packages/api/
├── src/
│   └── routers/
│       ├── auth.ts          # Auth router (signUp, signIn, signOut)
│       ├── chat.ts          # Chat CRUD
│       ├── message.ts       # Message operations
│       └── index.ts         # Main export
└── package.json
```

---

## Router Pattern

```typescript
import { z } from 'zod';
import { router } from '@sambung-chat/orpc';

export const myRouter = router({
  // Query - GET requests
  getAll: {
    input: z.object({
      limit: z.number().optional(),
    }),
    resolve: async ({ input, context }) => {
      return { items: [] };
    }
  },

  // Mutation - POST/PUT/DELETE requests
  create: {
    input: z.object({
      title: z.string(),
    }),
    resolve: async ({ input, context }) => {
      return { id: 1, ...input };
    }
  }
});
```

---

## Pre-PR Checklist

- [ ] `bun run check` passes
- [ ] Zod schemas are properly typed
- [ ] Input validation is correct
