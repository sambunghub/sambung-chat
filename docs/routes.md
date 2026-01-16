# Route Structure

**Version:** 2.0
**Last Updated:** January 16, 2026
**License:** AGPL-3.0

---

## Overview

Complete URL structure for SambungChat web application.

**Current Implementation Status:**

- ✅ Basic authentication (login/register with Keycloak)
- ✅ Personal workspace with chat interface
- 🚧 Team workspace (planned)
- 🚧 Prompts library (planned)
- 🚧 Agents system (planned)

**Key Patterns:**

- Personal workspace: `/app/*`
- Team workspace: `/team/[slug]/*` (planned)
- Auth routes: `(auth)` route group (no URL prefix)

---

## Current Route Structure

```
/                                          Root (redirects based on auth)
├── login                                   Login page (Keycloak SSO)
├── register                                Registration page
│
├── app/*                                   Personal workspace (CURRENT)
│   ├── chat                               Chat interface (main page)
│   ├── chats                              Chat list (planned)
│   ├── chats/[id]                         View specific chat (planned)
│   ├── agents                             AI agents (planned)
│   ├── prompts                            Prompt templates (planned)
│   └── settings                           User settings (planned)
│
├── team/[slug]/*                           Team workspace (PLANNED)
│   └── ...
│
└── ai                                      Legacy route (redirect to /app/chat)
```

---

## Route Groups

### (auth) - Authentication Routes

**Files:** `apps/web/src/routes/(auth)/`

**Purpose:** Public authentication pages with centered layout (no header/sidebar).

| Route       | File                    | Description                     |
| ----------- | ----------------------- | ------------------------------- |
| `/login`    | `login/+page.svelte`    | Login form with Keycloak SSO    |
| `/register` | `register/+page.svelte` | Registration form with Keycloak |

**Layout:** Minimal centered layout using TailwindCSS:

```svelte
<div class="bg-background flex min-h-screen items-center justify-center p-4">
  {@render children()}
</div>
```

**Features:**

- ✅ Keycloak SSO integration
- ✅ Dynamic callbackURL based on origin
- ✅ Session management via Better Auth
- Server-side protection via `app/+layout.server.ts`

---

### app/ - Personal Workspace (Current Implementation)

**Files:** `apps/web/src/routes/app/`

**Purpose:** User's private workspace with sidebar navigation.

| Route       | File                      | Auth Required | Description                           |
| ----------- | ------------------------- | ------------- | ------------------------------------- |
| `/app`      | `+page.svelte` (redirect) | ✅            | Redirects to `/app/chat`              |
| `/app/chat` | `chat/+page.svelte`       | ✅            | Main chat interface with AI streaming |

**Layout:** Sidebar + Content Area using shadcn-svelte components:

```svelte
<Sidebar.Provider style="--sidebar-width: 350px;">
  <AppSidebar {user} />
  <Sidebar.Inset>
    {@render children()}
  </Sidebar.Inset>
</Sidebar.Provider>
```

**Components:**

- `AppSidebar` - Main sidebar with navigation
- `NavUser` - User menu with avatar

**Current Features:**

- ✅ Real-time AI chat streaming
- ✅ Markdown rendering
- ✅ Message actions (copy, delete, regenerate)
- ✅ Model selector (OpenAI, Anthropic, Google, Groq, Ollama)

**Planned Features:**

- 🚧 Chat history sidebar
- 🚧 Chat folders organization
- 🚧 Prompt templates
- 🚧 AI agents

---

### (team) - Team Workspace (Planned)

**Files:** `apps/web/src/routes/(team)/`

**Purpose:** Shared workspace for team collaboration.

**Status:** 🚧 Route structure exists, not implemented yet

| Route                     | File                             | Auth Required | Team Required | Description                      |
| ------------------------- | -------------------------------- | ------------- | ------------- | -------------------------------- |
| `/team/create`            | `create/+page.svelte`            | ✅            | ❌            | Create new team                  |
| `/team/[slug]`            | `[slug]/+page.svelte`            | ✅            | ✅            | Redirects to `/team/[slug]/chat` |
| `/team/[slug]/chat`       | `[slug]/chat/+page.svelte`       | ✅            | ✅            | New team chat                    |
| `/team/[slug]/chats`      | `[slug]/chats/+page.svelte`      | ✅            | ✅            | Team chat list                   |
| `/team/[slug]/chats/[id]` | `[slug]/chats/[id]/+page.svelte` | ✅            | ✅            | View specific team chat          |
| `/team/[slug]/members`    | `[slug]/members/+page.svelte`    | ✅            | ✅            | Manage team members              |
| `/team/[slug]/agents`     | `[slug]/agents/+page.svelte`     | ✅            | ✅            | Team agents                      |
| `/team/[slug]/settings`   | `[slug]/settings/+page.svelte`   | ✅            | ✅            | Team settings                    |

**Layout:** Header + sidebar + team context switcher (planned).

---

## Legacy Routes

### Old Routes (Redirected)

| Old Route    | New Route   | Status                    |
| ------------ | ----------- | ------------------------- |
| `/ai`        | `/app/chat` | Permanent redirect (301)  |
| `/dashboard` | `/app/chat` | Redirect                  |
| `/todos`     | _(remove)_  | Deprecated (example only) |

---

## URL Examples

### Personal Workspace (Current)

```
http://localhost:5173/app/chat              # Main chat interface
http://localhost:5173/app                   # Redirects to /app/chat
```

### Authentication (Current)

```
http://localhost:5173/login                 # Login with Keycloak SSO
http://localhost:5173/register              # Register with Keycloak SSO
```

### Development URLs

| Service  | URL                        |
| -------- | -------------------------- |
| Web App  | http://localhost:5173      |
| API      | http://localhost:3000      |
| Keycloak | https://auth.azfirazka.com |

---

## SvelteKit File Structure

```
apps/web/src/routes/
├── +layout.svelte                    # Root layout (ModeWatcher, auth redirects)
├── +layout.server.ts                 # Root layout server logic (user session)
├── +page.svelte                      # Landing page (redirects based on auth)
│
├── (auth)/                           # Route group (no URL prefix)
│   ├── +layout.svelte                # Centered auth layout
│   ├── login/
│   │   ├── +page.svelte              # Login form with Keycloak SSO
│   │   └── +page.server.ts           # Login actions
│   └── register/
│       └── +page.svelte              # Registration form
│
├── app/                              # Personal workspace (NO route group)
│   ├── +layout.svelte                # App layout (Sidebar + Content)
│   ├── +layout.server.ts             # Auth protection, user data
│   ├── chat/
│   │   └── +page.svelte              # Main chat interface
│   ├── chats/                        # Planned: Chat list
│   ├── chats/[id]/                   # Planned: View chat
│   ├── agents/                       # Planned: AI agents
│   ├── prompts/                      # Planned: Prompt templates
│   └── settings/                     # Planned: User settings
│
└── (team)/                           # Team workspace (PLANNED)
    ├── +layout.svelte                # Team layout (planned)
    ├── create/
    │   └── +page.svelte              # Create team (planned)
    └── [slug]/
        ├── +page.svelte              # Team home (planned)
        ├── chat/
        │   └── +page.svelte          # Team chat (planned)
        └── ...
```

---

## Authentication Flow

### Server-Side Protection

```typescript
// hooks.server.ts
export const handle: Handle = async ({ event, resolve }) => {
  // Fetch current session from Better Auth
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  // Make session and user available on server
  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  return svelteKitHandler({ event, resolve, auth, building });
};
```

### Route-Level Protection

```typescript
// app/+layout.server.ts
export const load: LayoutServerLoad = async (event) => {
  const user = event.locals.user;

  if (!user) {
    redirect(302, '/login'); // Protected route
  }

  return {
    user,
    session: event.locals.session,
  };
};
```

### Client-Side Auth State

```typescript
// +layout.svelte (root)
import { page } from '$app/stores';

const user = $derived($page.data?.user);

$effect(() => {
  const path = $page.url.pathname;
  if (path === '/' && !user) {
    goto('/login');
  } else if (path === '/' && user) {
    goto('/app/chat');
  }
});
```

---

## Related Documents

- **[Teams Concept](./teams-concept.md)** - Team model and access control (planned)
- **[Database Schema](./database.md)** - Database tables and relationships
- **[Architecture](./architecture.md)** - Overall system architecture
- **[plan-reference/ui-ux-design.md](../plan-reference/ui-ux-design.md)** - UI/UX design blueprint

---

## Migration Notes

### Changes from v1.0 to v2.0

1. **Removed TanStack Query** - Using native Svelte 5 runes ($state, $derived, $effect)
2. **Simplified auth** - Using Better Auth with Keycloak SSO
3. **Simplified layout** - Current implementation uses Sidebar from shadcn-svelte
4. **Removed (app) route group** - Now using direct `app/` path (not route group)

### Next Steps

1. ✅ Complete chat interface with streaming
2. 🚧 Add chat history sidebar
3. 🚧 Implement prompts library
4. 🚧 Build agents system
5. 🚧 Team workspace implementation

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
