# Route Structure

**Version:** 1.0
**Last Updated:** January 14, 2026
**License:** AGPL-3.0

---

## Overview

Complete URL structure for SambungChat web application.

**Key Patterns:**

- Personal workspace: `/app/*`
- Team workspace: `/team/[slug]/*`
- Public shares: `/p/[token]`
- Platform admin: `/admin/*`

---

## Route Structure Diagram

```
/                                          Landing page (public)
├── login                                   Login page
├── register                                Registration page
│
├── app/*                                   Personal workspace
│   ├── chat                               New personal chat
│   ├── chats                              Personal chat list
│   ├── chats/[id]                         View personal chat
│   ├── chats/[id]/share                   Share settings
│   ├── folders                            Manage folders
│   ├── tags                               Manage tags
│   ├── models                             Model preferences
│   ├── agents                             AI agents
│   ├── plugins                            Plugins
│   ├── settings                           Settings
│   └── next-plan                          Roadmap/plan
│
├── team/[slug]/*                           Team workspace
│   ├── chat                               New team chat
│   ├── chats                              Team chat list
│   ├── chats/[id]                         View team chat
│   ├── chats/[id]/share                   Share settings
│   ├── folders                            Team folders
│   ├── tags                               Team tags
│   ├── models                             Team model config
│   ├── members                            Manage members
│   ├── agents                             Team agents
│   ├── plugins                            Team plugins
│   ├── settings                           Team settings
│   └── next-plan                          Team roadmap
│
├── team/create                             Create new team
│
├── models/*                                Model management
│   ├──                                   Browse models
│   ├── providers                          Configure providers
│   └── custom                             Custom endpoints
│
├── p/[token]                               Public shared chat
│
└── admin/*                                 Platform admin (superadmin)
    ├── users                              Manage all users
    ├── teams                              Manage all teams
    └── settings                           Platform settings
```

---

## Route Groups

### (auth) - Authentication Routes

**Files:** `apps/web/src/routes/(auth)/`

**Purpose:** Public authentication pages without header/sidebar.

| Route       | File                    | Description       |
| ----------- | ----------------------- | ----------------- |
| `/login`    | `login/+page.svelte`    | Login form        |
| `/register` | `register/+page.svelte` | Registration form |

**Layout:** Minimal centered layout, no navigation.

---

### (app) - Personal Workspace

**Files:** `apps/web/src/routes/(app)/`

**Purpose:** User's private workspace.

| Route                   | File                            | Auth Required | Description                        |
| ----------------------- | ------------------------------- | ------------- | ---------------------------------- |
| `/app`                  | `+page.svelte`                  | ✅            | Redirects to `/app/chat`           |
| `/app/chat`             | `chat/+page.svelte`             | ✅            | New personal chat (main interface) |
| `/app/chats`            | `chats/+page.svelte`            | ✅            | Personal chat list with filters    |
| `/app/chats/[id]`       | `chats/[id]/+page.svelte`       | ✅            | View specific personal chat        |
| `/app/chats/[id]/share` | `chats/[id]/share/+page.svelte` | ✅            | Share settings for chat            |
| `/app/folders`          | `folders/+page.svelte`          | ✅            | Manage personal folders            |
| `/app/tags`             | `tags/+page.svelte`             | ✅            | Manage personal tags               |
| `/app/models`           | `models/+page.svelte`           | ✅            | Personal model preferences         |
| `/app/agents`           | `agents/+page.svelte`           | ✅            | Personal AI agents                 |
| `/app/plugins`          | `plugins/+page.svelte`          | ✅            | Personal plugins                   |
| `/app/settings`         | `settings/+page.svelte`         | ✅            | User settings                      |
| `/app/next-plan`        | `next-plan/+page.svelte`        | ✅            | Roadmap view                       |

**Layout:** Header + sidebar navigation.

---

### (team) - Team Workspace

**Files:** `apps/web/src/routes/(team)/`

**Purpose:** Shared workspace for team collaboration.

| Route                           | File                                   | Auth Required | Team Required | Description                      |
| ------------------------------- | -------------------------------------- | ------------- | ------------- | -------------------------------- |
| `/team/create`                  | `create/+page.svelte`                  | ✅            | ❌            | Create new team                  |
| `/team/[slug]`                  | `[slug]/+page.svelte`                  | ✅            | ✅            | Redirects to `/team/[slug]/chat` |
| `/team/[slug]/chat`             | `[slug]/chat/+page.svelte`             | ✅            | ✅            | New team chat                    |
| `/team/[slug]/chats`            | `[slug]/chats/+page.svelte`            | ✅            | ✅            | Team chat list                   |
| `/team/[slug]/chats/[id]`       | `[slug]/chats/[id]/+page.svelte`       | ✅            | ✅            | View specific team chat          |
| `/team/[slug]/chats/[id]/share` | `[slug]/chats/[id]/share/+page.svelte` | ✅            | ✅            | Share settings                   |
| `/team/[slug]/folders`          | `[slug]/folders/+page.svelte`          | ✅            | ✅            | Team folders                     |
| `/team/[slug]/tags`             | `[slug]/tags/+page.svelte`             | ✅            | ✅            | Team tags                        |
| `/team/[slug]/models`           | `[slug]/models/+page.svelte`           | ✅            | ✅            | Team model config                |
| `/team/[slug]/members`          | `[slug]/members/+page.svelte`          | ✅            | ✅            | Manage team members              |
| `/team/[slug]/agents`           | `[slug]/agents/+page.svelte`           | ✅            | ✅            | Team agents                      |
| `/team/[slug]/plugins`          | `[slug]/plugins/+page.svelte`          | ✅            | ✅            | Team plugins                     |
| `/team/[slug]/settings`         | `[slug]/settings/+page.svelte`         | ✅            | ✅            | Team settings                    |
| `/team/[slug]/next-plan`        | `[slug]/next-plan/+page.svelte`        | ✅            | ✅            | Team roadmap                     |

**Layout:** Header + sidebar + team context switcher.

**Team Context:** Loaded from URL slug, passed to all child routes.

---

### (models) - Model Management

**Files:** `apps/web/src/routes/(models)/`

**Purpose:** Centralized model configuration.

| Route               | File                     | Auth Required | Description                     |
| ------------------- | ------------------------ | ------------- | ------------------------------- |
| `/models`           | `+page.svelte`           | ✅            | Browse available models         |
| `/models/providers` | `providers/+page.svelte` | ✅            | Configure API keys per provider |
| `/models/custom`    | `custom/+page.svelte`    | ✅            | Add custom endpoints            |

**Layout:** Header + sidebar.

---

### (public) - Public Shares

**Files:** `apps/web/src/routes/(public)/`

**Purpose:** Publicly accessible shared chats (no auth required).

| Route        | File                   | Auth Required | Description             |
| ------------ | ---------------------- | ------------- | ----------------------- |
| `/p/[token]` | `[token]/+page.svelte` | ❌            | View public shared chat |

**Layout:** Minimal (read-only view).

---

### (admin) - Platform Administration

**Files:** `apps/web/src/routes/(admin)/`

**Purpose:** Platform superadmin features.

| Route             | File                    | Auth Required | Role Required | Description       |
| ----------------- | ----------------------- | ------------- | ------------- | ----------------- |
| `/admin/users`    | `users/+page.svelte`    | ✅            | Superadmin    | Manage all users  |
| `/admin/teams`    | `teams/+page.svelte`    | ✅            | Superadmin    | Manage all teams  |
| `/admin/settings` | `settings/+page.svelte` | ✅            | Superadmin    | Platform settings |

**Layout:** Header + admin sidebar.

---

## URL Examples

### Personal Workspace

```
https://app.sambung.com/app/chat              # New personal chat
https://app.sambung.com/app/chats             # Personal chat list
https://app.sambung.com/app/chats/abc-123     # View chat
https://app.sambung.com/app/chats/abc-123/share # Share settings
https://app.sambung.com/app/folders           # Manage folders
https://app.sambung.com/app/models            # Model preferences
```

### Team Workspace

```
https://app.sambung.com/team/engineering/chat          # New team chat
https://app.sambung.com/team/engineering/chats         # Team chat list
https://app.sambung.com/team/engineering/chats/xyz-789 # View team chat
https://app.sambung.com/team/marketing/members          # Manage members
https://app.sambung.com/team/create                     # Create new team
```

### Public Share

```
https://app.sambung.com/p/abc-123-xyz-789   # Public chat (no login needed)
```

---

## Route Parameters

### Team Slug

```typescript
// (team)/[slug]/+page.server.ts
export const load: PageServerLoad = async ({ params }) => {
  const { slug } = params;

  // Validate slug format
  if (!/^[a-z0-9-]{3,50}$/.test(slug)) {
    throw error(400, 'Invalid slug format');
  }

  // Fetch team
  const team = await db.query.teams.findFirst({
    where: eq(teams.slug, slug),
  });

  if (!team) {
    throw redirect(302, '/team/create');
  }

  // Check membership
  // ...

  return { team };
};
```

### Chat ID

```typescript
// (app)/chats/[id]/+page.server.ts
export const load: PageServerLoad = async ({ params, locals }) => {
  const { id } = params;
  const user = locals.user;

  const chat = await db.query.chats.findFirst({
    where: eq(chats.id, id),
  });

  // Check access
  if (chat.teamId) {
    // Team chat - check team membership
    // ...
  } else {
    // Personal chat - check ownership
    if (chat.userId !== user.id) {
      throw error(403, 'Access denied');
    }
  }

  return { chat };
};
```

### Public Token

```typescript
// (public)/[token]/+page.server.ts
export const load: PageServerLoad = async ({ params }) => {
  const { token } = params;

  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.publicToken, token), eq(chats.isPublic, true)),
  });

  if (!chat) {
    throw error(404, 'Public chat not found');
  }

  return { chat };
};
```

---

## Migration from Legacy Routes

### Old → New Mapping

| Old Route    | New Route   | Status                  |
| ------------ | ----------- | ----------------------- |
| `/ai`        | `/app/chat` | Move                    |
| `/dashboard` | `/app`      | Redirect to `/app/chat` |
| `/todos`     | _(remove)_  | Deprecated              |

### Redirect Implementation

```typescript
// +page.svelte (root /dashboard route)
import { redirect } from '@sveltejs/kit';

export const load = () => {
  redirect(302, '/app/chat');
};
```

```typescript
// +page.server.ts (old /ai route)
export const load = () => {
  redirect(301, '/app/chat'); // Permanent redirect
};
```

---

## SvelteKit File Structure

```
apps/web/src/routes/
├── +layout.svelte                    # Root layout
├── +layout.server.ts                 # Root layout server logic
├── +page.svelte                      # Landing page
│
├── (auth)/                           # Route group (no URL prefix)
│   ├── +layout.svelte                # Auth layout
│   ├── login/
│   │   ├── +page.svelte
│   │   └── +page.server.ts
│   └── register/
│       └── +page.svelte
│
├── (app)/                            # Route group → /app/*
│   ├── +layout.svelte                # App layout
│   ├── +page.svelte
│   ├── chat/
│   │   └── +page.svelte
│   ├── chats/
│   │   ├── +page.svelte
│   │   └── [id]/
│   │       ├── +page.svelte
│   │       └── +page.server.ts
│   └── ...
│
├── (team)/                           # Route group → /team/*
│   ├── +layout.svelte                # Team layout
│   ├── create/
│   │   └── +page.svelte
│   └── [slug]/
│       ├── +page.svelte
│       ├── +page.server.ts           # Load team context
│       ├── chat/
│       │   └── +page.svelte
│       └── ...
│
├── (models)/                         # Route group → /models/*
│   ├── +layout.svelte
│   └── ...
│
├── (public)/                         # Route group → /p/*
│   └── [token]/
│       └── +page.svelte
│
└── (admin)/                          # Route group → /admin/*
    ├── +layout.svelte
    └── ...
```

---

## Related Documents

- **[Teams Concept](./teams-concept.md)** - Team model and access control
- **[Database Schema](./database.md)** - Team tables and relationships
- **[API Reference](./api-reference.md)** - Route handlers and endpoints
- **[Architecture](./architecture.md)** - Overall system architecture

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
