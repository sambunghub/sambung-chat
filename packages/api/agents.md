# packages/api - API Routers & Procedures

Shared API routers for backend using ORPC + Zod validation.

---

## 🚨 MANDATORY PRE-BUILD CHECKLIST

**BEFORE doing any build, YOU MUST do this first:**

```bash
# Step 1: Type check
bun run check

# Step 2: If there are errors, READ and FIX those errors

# Step 3: ONLY after type check is clean, you may build
bun run build
```

**RULE: If type check fails, DO NOT proceed to build!**

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
    },
  },

  // Mutation - POST/PUT/DELETE requests
  create: {
    input: z.object({
      title: z.string(),
    }),
    resolve: async ({ input, context }) => {
      return { id: 1, ...input };
    },
  },
});
```

---

## Pre-PR Checklist

- [ ] `bun run check` passes
- [ ] Zod schemas are properly typed
- [ ] Input validation is correct
