# SAMBUNG CHAT: UI/UX Design Document

**Version:** 2.0
**Last Updated:** January 15, 2026
**Status:** Ready for Implementation (with Team Workspace Support)

---

## Table of Contents

1. [Design System](#design-system)
2. [Page Structure & Routes](#page-structure--routes)
3. [Layout Specifications](#layout-specifications)
4. [Component Hierarchy](#component-hierarchy)
5. [Component Specifications](#component-specifications)
6. [Responsive Behavior](#responsive-behavior)
7. [State Management & Data Flow](#state-management--data-flow)
8. [User Flows](#user-flows)
9. [Implementation Priority](#implementation-priority)

---

## Design System

### Color Palette (OKLCH Format)

```css
/* Light Mode */
--primary: oklch(0.58 0.1 181.5); /* #208B8D - Teal */
--primary-foreground: oklch(0.98 0 0);

--accent: oklch(0.65 0.15 21); /* #E67E50 - Orange */
--accent-foreground: oklch(0.98 0 0);

--background: oklch(0.98 0.005 90); /* #FAFAF9 */
--foreground: oklch(0.2 0.02 90); /* #1A1D23 */

--card: oklch(1 0 0);
--card-foreground: oklch(0.2 0.02 90);

--border: oklch(0.88 0.01 90); /* #D1D5DB */
--input: oklch(0.88 0.01 90);
--ring: oklch(0.58 0.1 181.5);

--muted: oklch(0.94 0.01 90);
--muted-foreground: oklch(0.5 0.02 90);

/* Dark Mode */
--primary: oklch(0.65 0.12 181.5); /* #2FB3B6 */
--primary-foreground: oklch(0.15 0.02 90);

--accent: oklch(0.7 0.18 21); /* #F18D64 */
--accent-foreground: oklch(0.15 0.02 90);

--background: oklch(0.15 0.02 90); /* #111827 */
--foreground: oklch(0.98 0 0);

--card: oklch(0.18 0.02 90);
--card-foreground: oklch(0.98 0 0);

--border: oklch(0.25 0.02 90);
--input: oklch(0.25 0.02 90);
--ring: oklch(0.65 0.12 181.5);

--muted: oklch(0.2 0.02 90);
--muted-foreground: oklch(0.6 0.02 90);
```

### Typography

```css
/* Font Families */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;

/* Font Sizes (Tailwind scale) */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing Scale

Tailwind's default spacing scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px

### Border Radius

```css
--radius: 0.5rem; /* 8px - default */
--radius-sm: 0.375rem; /* 6px - small */
--radius-md: 0.5rem; /* 8px - medium */
--radius-lg: 0.75rem; /* 12px - large */
--radius-full: 9999px; /* pill */
```

---

## Page Structure & Routes

### Route Structure (Personal + Team Workspaces)

```
apps/web/src/routes/
├── (app)/                    # Personal workspace
│   ├── chat/
│   │   ├── +page.svelte              # New personal chat
│   │   ├── [id]/
│   │   │   └── +page.svelte          # Individual chat view
│   │   └── +page.svelte              # Chat list / home
│   ├── prompts/
│   │   ├── +page.svelte              # Prompt templates library
│   │   └── new/+page.svelte          # Create new prompt
│   ├── settings/
│   │   ├── +page.svelte              # General settings
│   │   ├── api-keys/+page.svelte     # API key management
│   │   └── appearance/+page.svelte   # Theme, font size
│   └── +layout.svelte                # Personal workspace layout
│
├── (team)/                   # Team workspace
│   ├── [slug]/
│   │   ├── chat/
│   │   │   ├── +page.svelte          # New team chat
│   │   │   ├── [id]/
│   │   │   │   └── +page.svelte      # Individual team chat
│   │   │   └── +page.svelte          # Team chat list / home
│   │   ├── prompts/
│   │   │   ├── +page.svelte          # Team prompts
│   │   │   └── new/+page.svelte      # Create team prompt
│   │   ├── members/
│   │   │   └── +page.svelte          # Team members management
│   │   ├── settings/
│   │   │   └── +page.svelte          # Team settings
│   │   ├── +page.svelte              # Redirects to /chat
│   │   └── +layout.svelte            # Team workspace layout
│   └── create/
│       └── +page.svelte              # Create new team
│
├── (auth)/                   # Authentication routes
│   ├── login/
│   │   └── +page.svelte              # Login page
│   ├── register/
│   │   └── +page.svelte              # Registration page
│   └── +layout.svelte                # Auth layout (centered)
│
└── +layout.svelte                # Root layout (theme provider)
```

### Route Groups

| Route Group | Layout                                | Purpose            | Workspace Type |
| ----------- | ------------------------------------- | ------------------ | -------------- |
| `(app)`     | Header + Nav Rail + Secondary Sidebar | Personal workspace | Personal       |
| `(team)`    | Header + Nav Rail + Secondary Sidebar | Team collaboration | Team           |
| `(auth)`    | Centered card                         | Public auth routes | -              |

### URL Patterns

| Workspace Type | URL Pattern      | Example                                             |
| -------------- | ---------------- | --------------------------------------------------- |
| Personal       | `/app/*`         | `/app/chat`, `/app/prompts`                         |
| Team           | `/team/[slug]/*` | `/team/engineering/chat`, `/team/marketing/prompts` |

---

## Layout Specifications

### Overall Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header (60px)                                                       │
│  [Logo SambungChat]                                                  │  ← Logo only (clean header)
├────┬────────────────────────────────┬────────────────────────────────┤
│Nav │    Secondary Sidebar (280px)   │   Content Area (flex-1)        │
│Rail│    Collapsible, Context-Aware  │   Scrollable                   │
│64px│  ┌──────────────────────────┐ │                                │
│    │  │ [+ New Chat]             │ │   ┌──────────────────────────┐ │
│ 💬 │  │ ──────────────────────── │ │   │  Search: [Context-aware] │ │  ← Search in content
│    │  │ 📄 Project Notes    2m   │ │   └──────────────────────────┘ │
│ ✨ │  │ 📄 Python Tutorial   1h   │ │                                │
│    │  │ [Search chats...]         │ │   Main Content:                │
│ ⚙️ │  └──────────────────────────┘ │   • Chat Interface              │
│    │                              │   • Prompts Library             │
│    │                              │   • Settings                    │
│────┼──────────────────────────────┼─────────────────────────────────┤
│    │                              │                                 │
│ 👤 │  ← User Profile / Avatar     │                                 │
│    │  (Click → User Menu)         │                                 │
│ ───┼──────────────────────────────┼─────────────────────────────────┤
│[Pers│                              │                                 │
│ onal│  ← Workspace Switcher       │                                 │
│  ▼] │                              │                                 │
└────┴──────────────────────────────┴─────────────────────────────────┘
```

### Layout Dimensions

| Component             | Width                               | Height             | Position         |
| --------------------- | ----------------------------------- | ------------------ | ---------------- |
| **Header**            | 100%                                | 60px               | Fixed top        |
| **Navigation Rail**   | 64px                                | 100vh              | Fixed left       |
| **Secondary Sidebar** | 280px (expanded) / 48px (collapsed) | calc(100vh - 60px) | Left of content  |
| **Content Area**      | flex-1                              | calc(100vh - 60px) | Right of sidebar |

### Navigation Rail Structure

```
┌────┐
│ 💬 │  ← Navigation Items (Top → Bottom, by frequency)
│ ✨ │     • Chat (most frequent)
│ 📝 │     • Prompts
│ ⚙️ │     • Settings
│ 👥 │     • Members (team workspace only)
─────┼─── Separator (1px border)
│ 📚 │  ← Utility & Help (Bottom → Top)
│ ❓ │     • Documentation
│ 👤 │     • Help
│    │     • User Menu & Workspace Switcher (bottom)
└────┘
```

### Navigation Items by Workspace

| Workspace    | Nav Items                        | Icons       |
| ------------ | -------------------------------- | ----------- |
| **Personal** | Chat, Prompts, Settings          | 💬 ✨ ⚙️    |
| **Team**     | Chat, Prompts, Members, Settings | 💬 ✨ 👥 ⚙️ |

### Utility Icons (Bottom of Nav Rail)

| Icon | Label         | Action                             |
| ---- | ------------- | ---------------------------------- |
| 📚   | Documentation | Opens docs in new tab              |
| ❓   | Help          | Help center, shortcuts, feedback   |
| 👤   | User Menu     | Opens profile & workspace switcher |

### User Menu Popup

```
┌─────────────────────────────────────┐
│ 👤 John Doe                         │
│ john@example.com                    │
├─────────────────────────────────────┤
│ 🏠 Workspace: ▼                     │  ← Workspace Switcher
│ ├─ ✅ Personal                      │
│ ├─ ✅ Engineering Team    [👥 3]   │
│ ├─ ✅ Marketing Team      [👥 1]   │
│ ├────────────────────────────────── │
│ └─ ➕ Create New Team               │
├─────────────────────────────────────┤
│ ⚙️ Account Settings                 │
│ 🔑 API Keys & Providers             │
│ 🌐 Language: 🇺🇸 English            │
│ 🎨 Theme: 🌙 Dark                  │
├─────────────────────────────────────┤
│ 🚪 Logout                           │
└─────────────────────────────────────┘
```

### Secondary Sidebar Content (Context-Aware)

**Chat Page:**

```
┌─────────────────────────────┐
│ [+ New Chat]        Button  │
├─────────────────────────────┤
│ Recent Chats                │
│ ─────────────────────────   │
│ 📄 Project Notes      2m    │
│ 📄 Python Tutorial     1h    │
│ [Search chats...]      Input │
│                             │
│ Folders (collapse)          │
│ ├─ 📁 Work (3)              │
│ └─ 📁 Personal (5)          │
└─────────────────────────────┘
```

**Prompts Page:**

```
┌─────────────────────────────────────┐
│ [+ Create Prompt]           Button  │
├─────────────────────────────────────┤
│ My Prompts                  Section │
│ ────────────────────────────       │
│ ✨ All My Prompts                   │
│ 📝 Code Generation                  │
│ ✍️ Writing                          │
├─────────────────────────────────────┤
│ Team Prompts (if team)    Section │  ← Team workspace only
│ ────────────────────────────       │
│ 👥 Shared by Team Members           │
├─────────────────────────────────────┤
│ 🌍 Marketplace              Badge    │  ← Curated by admin
│ ────────────────────────────       │
│ 🔥 Trending                        │
│ ⭐ Featured                        │
│ 🆕 New This Week                   │
│ 💡 Contribute your prompt!          │
└─────────────────────────────────────┘
```

**Settings Page:**

- Secondary sidebar hidden by default
- Full-width content for settings panels

**Team Workspace Differences:**

- Header text: "Team Chats" instead of "Recent Chats"
- Button label: "[+ New Team Chat]"
- Shows team member activity indicators
- Shared folders/categories section

---

## Component Hierarchy

```
SambungChat Components
│
├── Layout Components
│   ├── AppLayout                 # Main app layout
│   │   ├── Header                # Logo only
│   │   ├── NavigationRail        # Icon-based nav rail
│   │   │   ├── NavItem          # Navigation item
│   │   │   ├── UserMenu         # User menu popup
│   │   │   │   ├── WorkspaceSwitcher
│   │   │   │   └── UserMenuItem
│   │   │   └── Separator        # Visual divider
│   │   └── SecondarySidebar      # Context-aware sidebar
│   │       ├── ChatList         # For chat pages
│   │       ├── PromptsCategories # For prompts page
│   │       ├── MembersList      # For team pages
│   │       └── CollapseToggle   # Expand/collapse button
│   │
│   └── AuthLayout                # Centered auth layout
│
├── Workspace Components
│   ├── WorkspaceSwitcher         # Switch between personal/team
│   ├── TeamBadge                 # Team indicator
│   └── MemberList                # Team members list
│
├── Chat Components
│   ├── ChatInterface
│   │   ├── MessageList
│   │   │   ├── UserMessage
│   │   │   ├── AssistantMessage
│   │   │   └── MessageMeta
│   │   ├── ChatInput
│   │   │   ├── TextArea
│   │   │   ├── ModelSelector
│   │   │   └── SendButton
│   │   └── StreamingIndicator
│   │
│   ├── ChatListItem              # Sidebar chat item
│   ├── ChatHeader                # Chat title, model info
│   └── EmptyState                # No chats placeholder
│
├── Prompt Components
│   ├── PromptLibrary
│   │   ├── PromptCard
│   │   ├── PromptSearch
│   │   ├── CategoryFilter
│   │   ├── MarketplaceSection    # Curated prompts
│   │   └── TeamPromptsSection    # Team-shared prompts
│   ├── PromptEditor              # Create/edit prompt
│   └── PromptVariableForm        # Variable substitution
│
├── Settings Components
│   ├── APIKeyManager
│   │   ├── APIKeyCard
│   │   ├── AddKeyButton
│   │   └── KeyVisibilityToggle
│   ├── ThemeToggle               # Light/dark mode
│   ├── LanguageSelector
│   └── SettingsNav
│
└── Shared Components
    ├── Button (from $lib/components/ui)
    ├── Input (from $lib/components/ui)
    ├── Card (from $lib/components/ui)
    ├── Dialog (from $lib/components/ui)
    ├── DropdownMenu (from $lib/components/ui)
    ├── Select (from $lib/components/ui)
    ├── Toast (from $lib/components/ui)
    └── LoadingSpinner
```

---

## Component Specifications

### 1. Header Component

**Location:** `apps/web/src/components/layout/Header.svelte`

**Props:**

```typescript
interface Props {
  workspace?: {
    type: 'personal' | 'team';
    name: string;
    slug?: string;
  };
}
```

**Features:**

- Logo (left-aligned or centered)
- Fixed height: 60px
- Clean, minimal design
- No navigation items (moved to Nav Rail)
- No user menu (moved to Nav Rail bottom)

---

### 2. NavigationRail Component

**Location:** `apps/web/src/lib/components/layout/NavigationRail.svelte`

**Props:**

```typescript
interface Props {
  currentPath: string;
  workspaceType: 'personal' | 'team';
  onNavigate: (path: string) => void;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  teams: Array<{
    id: string;
    name: string;
    slug: string;
    memberCount: number;
    onlineCount: number;
  }>;
}
```

**Features:**

- Fixed position: left, full height
- Width: 64px
- Icon-based navigation
- Active state indicator
- Tooltips on hover
- User menu at bottom
- Workspace switcher integrated

**Navigation Items:**

```typescript
const getNavItems = (workspaceType: 'personal' | 'team') => {
  const items = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
    { id: 'prompts', label: 'Prompts', icon: Sparkles, path: '/prompts' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  if (workspaceType === 'team') {
    items.splice(2, 0, {
      id: 'members',
      label: 'Members',
      icon: Users,
      path: '/members',
    });
  }

  return items;
};
```

---

### 3. UserMenu Component

**Location:** `apps/web/src/lib/components/layout/UserMenu.svelte`

**Props:**

```typescript
interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  currentWorkspace: {
    type: 'personal' | 'team';
    id: string;
    name: string;
    slug?: string;
  };
  teams: Array<{
    id: string;
    name: string;
    slug: string;
    avatar?: string;
    memberCount: number;
    onlineCount: number;
  }>;
  onWorkspaceChange: (workspace: Workspace) => void;
  onCreateTeam: () => void;
  onLogout: () => void;
}
```

**Features:**

- Opens as popover above avatar
- User info header
- Workspace switcher dropdown
- Account settings links
- Logout action

**File Structure:**

```
apps/web/src/lib/components/layout/
├── UserMenu.svelte
└── user-menu/
    ├── WorkspaceSwitcher.svelte
    └── UserMenuItem.svelte
```

---

### 4. WorkspaceSwitcher Component

**Location:** `apps/web/src/lib/components/layout/user-menu/WorkspaceSwitcher.svelte`

**Props:**

```typescript
interface Props {
  currentWorkspace: Workspace;
  teams: Team[];
  onWorkspaceChange: (workspace: Workspace) => void;
  onCreateTeam: () => void;
}
```

**UI States:**

**Collapsed (in UserMenu):**

```
🏠 Workspace: ▼
```

**Expanded:**

```
┌────────────────────────────────┐
│ ✅ Personal                    │
│ ├─ [Your Avatar] You           │
│                                │
│ ✅ Engineering Team            │
│ ├─ [Team Avatar] 3 online     │
│                                │
│ ✅ Marketing Team              │
│ ├─ [Team Avatar] 1 online     │
│ ├───────────────────────────── │
│ ➕ Create New Team             │
└────────────────────────────────┘
```

**Keyboard Navigation:**

- `Arrow Up/Down` - Navigate options
- `Enter` - Select workspace
- `Escape` - Close dropdown
- Type-ahead search for team names

---

### 5. SecondarySidebar Component

**Location:** `apps/web/src/lib/components/layout/SecondarySidebar.svelte`

**Props:**

```typescript
interface Props {
  currentPage: 'chat' | 'prompts' | 'settings' | 'members';
  workspaceType: 'personal' | 'team';
  isCollapsed: boolean;
  onToggle: () => void;
}
```

**Features:**

- Context-aware content based on `currentPage`
- Collapsible (280px → 48px)
- Keyboard shortcut: `Cmd/Ctrl + B`
- Dynamic content loading via Svelte 5 `$derived`

**Collapse Behavior:**
| State | Width | Behavior |
|-------|-------|----------|
| Expanded | 280px | Full content with labels |
| Collapsed | 48px | Icon-only view with tooltips |
| Settings | Hidden | Full-width content |

**Content Components:**

- `ChatList.svelte` - For chat pages
- `PromptsCategories.svelte` - For prompts page
- `MembersList.svelte` - For team members page

---

### 6. PromptLibrary Component (Enhanced)

**Location:** `apps/web/src/components/prompts/PromptLibrary.svelte`

**Props:**

```typescript
interface Props {
  workspaceType: 'personal' | 'team';
  myPrompts: Prompt[];
  teamPrompts?: Prompt[];
  marketplacePrompts: Prompt[];
  categories: PromptCategory[];
  onUsePrompt: (prompt: Prompt) => void;
  onCreatePrompt: () => void;
  onEditPrompt: (id: string) => void;
  onSubmitToMarketplace: (id: string) => void;
}
```

**Features:**

- **My Prompts** - Personal prompt library
- **Team Prompts** (team workspace only) - Shared within team
- **Marketplace** - Curated public prompts
- Grid/list view toggle
- Search and filter
- "Publish to Marketplace" toggle (requires admin approval)

**Marketplace Model:**

- Curated only (admin-approved prompts)
- Categories: Code Generation, Writing, Data Analysis, Productivity, Education, Creative
- Submission flow: User → Pending Review → Admin Approval → Public

---

### 7. ChatInterface Component

**Location:** `apps/web/src/components/chat/ChatInterface.svelte`

**Props:**

```typescript
interface Props {
  chatId?: string;
  workspaceType: 'personal' | 'team';
  teamId?: string;
  initialModel?: Model;
}
```

**Features:**

- Message list (scrollable)
- Streaming response display
- Message actions: Copy, Delete, Regenerate
- Model selector dropdown
- Chat input with auto-resize textarea
- Send button (disabled when empty/streaming)
- Stop generation button
- Workspace-aware (personal vs team chats)

---

## Responsive Behavior

### Breakpoint System

```typescript
const breakpoints = {
  sm: '640px', // Mobile landscape
  md: '768px', // Tablet
  lg: '1024px', // Laptop
  xl: '1280px', // Desktop
  '2xl': '1536px', // Large desktop
};
```

### Desktop (≥1024px) - Full Layout

All three columns visible:

- Navigation Rail (64px) - Icon-only
- Secondary Sidebar (280px) - Full content
- Content Area (flex-1) - Remaining space

### Tablet (768px - 1023px) - Collapsible Sidebar

- Navigation Rail: Visible (64px)
- Secondary Sidebar: Collapsed by default (48px)
- Toggle button to expand overlay
- Swipe from left edge → Open sidebar
- Tap outside → Close sidebar

### Mobile (<768px) - Bottom Navigation

**Transformations:**

| Desktop                      | Mobile                       |
| ---------------------------- | ---------------------------- |
| Navigation Rail (64px, left) | Bottom Nav Bar (56px)        |
| Header (60px)                | Header (48px)                |
| Secondary Sidebar (280px)    | Off-canvas drawer (slide-up) |

**Bottom Navigation Items:**

- 💬 Chat (leftmost)
- ✨ Prompts
- ⚙️ Settings
- 👤 User Menu (rightmost)

**Mobile-Specific Interactions:**

- Hamburger menu → Utility drawer (Docs, Help)
- Workspace switcher via User Menu
- Secondary sidebar via slide-up drawer

### Responsive State Management

```typescript
// stores/useResponsive.svelte.ts
import { writable, derived } from 'svelte/store';

function createResponsive() {
  const width = writable(typeof window !== 'undefined' ? window.innerWidth : 1024);

  const breakpoint = derived(width, ($width) => {
    if ($width < 768) return 'mobile';
    if ($width < 1024) return 'tablet';
    return 'desktop';
  });

  return {
    width,
    breakpoint,
    isMobile: derived(breakpoint, ($bp) => $bp === 'mobile'),
    isTablet: derived(breakpoint, ($bp) => $bp === 'tablet'),
    isDesktop: derived(breakpoint, ($bp) => $bp === 'desktop'),
  };
}

export const responsive = createResponsive();
```

---

## State Management & Data Flow

### Application State Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Page State  │  │ Server State │  │  Global State│      │
│  │  (route)     │  │  (load fn)   │  │  (stores)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                   ┌──────────────────┐                       │
│                   │  Component State │  ← Svelte 5 Runes    │
│                   │  ($state, $props)│                       │
│                   └──────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Global Stores

**Location:** `apps/web/src/lib/stores/`

```typescript
// stores/workspace.svelte.ts
import { writable, derived } from 'svelte/store';

interface Workspace {
  type: 'personal' | 'team';
  id: string;
  name: string;
  slug?: string;
}

function createWorkspaceStore() {
  const { subscribe, set, update } = writable<Workspace>({
    type: 'personal',
    id: 'personal',
    name: 'Personal',
  });

  return {
    subscribe,
    setWorkspace: (workspace: Workspace) => set(workspace),
    switchToTeam: (team: Team) =>
      set({
        type: 'team',
        id: team.id,
        name: team.name,
        slug: team.slug,
      }),
    switchToPersonal: () =>
      set({
        type: 'personal',
        id: 'personal',
        name: 'Personal',
      }),
  };
}

export const workspace = createWorkspaceStore();

// Derived store for workspace-aware routes
export const workspaceBasePath = derived(workspace, ($workspace) =>
  $workspace.type === 'team' ? `/team/${$workspace.slug}` : '/app'
);
```

### Route Loading Strategy

**Personal Workspace (`/app/*`):**

```typescript
// (app)/+layout.server.ts
export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;

  const [chats, prompts, folders] = await Promise.all([
    db.query.chats.findMany({
      where: eq(chats.userId, user.id),
      orderBy: [desc(chats.updatedAt)],
      limit: 50,
    }),
    db.query.prompts.findMany({
      where: eq(prompts.userId, user.id),
      orderBy: [desc(prompts.createdAt)],
    }),
    db.query.folders.findMany({
      where: eq(folders.userId, user.id),
    }),
  ]);

  return {
    user,
    workspace: {
      type: 'personal',
      name: 'Personal',
    },
    initialData: { chats, prompts, folders },
  };
};
```

**Team Workspace (`/team/[slug]/*`):**

```typescript
// (team)/[slug]/+layout.server.ts
export const load: PageServerLoad = async ({ params, locals }) => {
  const { slug } = params;
  const user = locals.user;

  // Validate team exists and user is member
  const team = await db.query.teams.findFirst({
    where: eq(teams.slug, slug),
    with: {
      members: {
        where: eq(teamMembers.userId, user.id),
      },
    },
  });

  if (!team || team.members.length === 0) {
    throw redirect(302, '/app/chat');
  }

  const [chats, prompts, members] = await Promise.all([
    db.query.chats.findMany({
      where: eq(chats.teamId, team.id),
      orderBy: [desc(chats.updatedAt)],
    }),
    db.query.prompts.findMany({
      where: eq(prompts.teamId, team.id),
    }),
    db.query.teamMembers.findMany({
      where: eq(teamMembers.teamId, team.id),
      with: {
        user: {
          columns: { id: true, name: true, avatar: true },
        },
      },
    }),
  ]);

  return {
    user,
    workspace: {
      type: 'team',
      id: team.id,
      name: team.name,
      slug: team.slug,
    },
    initialData: { chats, prompts, members },
  };
};
```

### Workspace Switching Flow

```
User clicks "Engineering Team" in WorkspaceSwitcher
        │
        ▼
┌───────────────────────────────────────┐
│ 1. Update workspace store             │
│    workspace.setWorkspace({           │
│      type: 'team',                    │
│      id: 'team-123',                  │
│      name: 'Engineering',             │
│      slug: 'engineering'              │
│    })                                │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 2. Update URL                         │
│    goto(`/team/engineering/chat`)     │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 3. Route loader runs                  │
│    - Validates team membership        │
│    - Loads team data                  │
│    - Returns workspace context        │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 4. Components re-render               │
│    - NavigationRail shows Members     │
│    - SecondarySidebar shows team chats│
│    - Header shows team name           │
└───────────────────────────────────────┘
```

### Client-Side Data Caching

```typescript
// stores/cache.svelte.ts
import { writable } from 'svelte/store';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

function createCacheStore() {
  const cache = new Map<string, CacheEntry<any>>();

  return {
    get: <T>(key: string): T | null => {
      const entry = cache.get(key);
      if (!entry) return null;

      if (Date.now() > entry.timestamp + entry.expiry) {
        cache.delete(key);
        return null;
      }

      return entry.data;
    },

    set: <T>(key: string, data: T, ttlMs = 60000) => {
      cache.set(key, {
        data,
        timestamp: Date.now(),
        expiry: ttlMs,
      });
    },

    invalidate: (pattern: string) => {
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    },
  };
}

export const cache = createCacheStore();
```

---

## User Flows

### 1. Workspace Switching Flow

```
┌─────────────────────┐
│  Personal Workspace │
│  /app/chat          │
└──────────┬──────────┘
           │
           ├─→ Click User Menu (👤)
           │     │
           │     └─→ Click "Engineering Team"
           │           │
           │           ├─→ Update workspace store
           │           ├─→ Navigate to /team/engineering/chat
           │           └─→ Route loader validates membership
           │                 │
           │                 ├─→ Valid member → Show team chat
           │                 └─→ Not member → Redirect to /app/chat
           │
           └─→ Click "Create New Team"
                 │
                 └─→ Navigate to /team/create
```

### 2. Team Creation Flow

```
┌──────────────────┐
│  User Menu       │
│  (Click 👤)       │
└────────┬─────────┘
         │
         └─→ Click "Create New Team"
               │
               ▼
      ┌─────────────────┐
      │  Create Team    │
      │  Form           │
      └────────┬────────┘
               │
               ├─→ Enter team name
               ├─→ Enter slug (auto-generated)
               ├─→ (Optional) Upload team avatar
               ├─→ (Optional) Add team description
               └─→ Click "Create Team"
                     │
                     ├─→ Team created in database
                     ├─→ User added as owner
                     └─→ Redirect to /team/[slug]/chat
```

### 3. Prompt Submission to Marketplace Flow

```
┌──────────────────┐
│  My Prompts      │
│  /app/prompts    │
└────────┬─────────┘
         │
         └─→ Create/edit prompt
               │
               ▼
      ┌─────────────────┐
      │  Prompt Editor  │
      └────────┬────────┘
               │
               ├─→ Enter prompt details
               ├─→ ✅ "Publish to Marketplace" toggle
               └─→ Click "Save"
                     │
                     ├─→ Prompt saved to user's prompts
                     ├─→ Submission added to review queue
                     └─→ Notification: "Submitted for review"
                           │
                           ▼
                  ┌──────────────────┐
                  │  Admin Review    │
                  │  (Dashboard)     │
                  └────────┬─────────┘
                           │
                           ├─→ Review prompt
                           ├─→ Approve → Appears in marketplace
                           └─→ Reject → User notified with feedback
```

---

## Implementation Priority

### Phase 1 (Week 1-4): Foundation & Layout

1. ✅ Setup shadcn-svelte in apps/web
2. ✅ Create base components (Button, Input, Card)
3. ⬜ Update Header component (logo only)
4. ⬜ Create/Update NavigationRail with new structure
5. ⬜ Create UserMenu component
6. ⬜ Create WorkspaceSwitcher component
7. ⬜ Update SecondarySidebar (collapsible)

### Phase 2 (Week 5-8): Personal Workspace

1. ⬜ Personal workspace layout (`/app/*`)
2. ⬜ ChatInterface with streaming
3. ⬜ ChatList in secondary sidebar
4. ⬜ Message component with Markdown
5. ⬜ ModelSelector
6. ⬜ Settings pages

### Phase 3 (Week 9-12): Team Workspace

1. ⬜ Team workspace layout (`/team/[slug]/*`)
2. ⬜ Team creation flow
3. ⬜ Team members management
4. ⬜ Team-specific navigation (Members icon)
5. ⬜ Team settings page
6. ⬜ Workspace switching

### Phase 4 (Week 13-16): Prompts & Marketplace

1. ⬜ PromptLibrary with My Prompts
2. ⬜ Team Prompts section
3. ⬜ Marketplace UI (curated)
4. ⬜ Prompt submission flow
5. ⬜ Admin review dashboard
6. ⬜ Prompt categories & search

### Phase 5 (Week 17-20): Responsive Polish

1. ⬜ Mobile bottom navigation
2. ⬜ Tablet sidebar collapse
3. ⬜ Touch gestures (swipe to open)
4. ⬜ Responsive state management
5. ⬜ Mobile-optimized components

---

## shadcn-svelte Implementation

This section provides specific implementation details using shadcn-svelte components.

### Component Mapping

| Our Component         | shadcn-svelte Implementation      | Notes                       |
| --------------------- | --------------------------------- | --------------------------- |
| **NavigationRail**    | Custom component (64px fixed)     | Button + Tooltip components |
| **SecondarySidebar**  | `Sidebar.Root collapsible="icon"` | Built-in collapse to icons  |
| **UserMenu**          | `Popover` + `DropdownMenu`        | In Nav Rail bottom          |
| **WorkspaceSwitcher** | `Select` / `DropdownMenu`         | Custom component            |
| **AppLayout**         | Wrapper with both sidebars        | Custom layout component     |

### Installation

```bash
cd apps/web
bunx shadcn-svelte@latest add sidebar
bunx shadcn-svelte@latest add popover
bunx shadcn-svelte@latest add dropdown-menu
bunx shadcn-svelte@latest add tooltip
bunx shadcn-svelte@latest add avatar
bunx shadcn-svelte@latest add separator
bunx shadcn-svelte@latest add scroll-area
```

### Theme Variables (CSS)

Add to `apps/web/src/routes/app.css`:

```css
:root {
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);

  /* Custom widths */
  --sidebar-width: 17.5rem; /* 280px */
  --sidebar-width-icon: 3rem; /* 48px collapsed */
  --nav-rail-width: 4rem; /* 64px */
}

.dark {
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.439 0 0);
}
```

### Secondary Sidebar Implementation

**Using `Sidebar.Root` with `collapsible="icon"`:**

```svelte
<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { useSidebar } from '$lib/components/ui/sidebar';
  import { page } from '$stores';

  const sidebar = useSidebar();

  // Context-aware content
  const currentPage = $derived(
    $page.url.pathname.includes('/chat')
      ? 'chat'
      : $page.url.pathname.includes('/prompts')
        ? 'prompts'
        : $page.url.pathname.includes('/settings')
          ? 'settings'
          : 'chat'
  );
</script>

<Sidebar.Provider style="--sidebar-width: 17.5rem; --sidebar-width-mobile: 18rem;">
  <Sidebar.Root collapsible="icon" side="right">
    <Sidebar.Content>
      {#if currentPage === 'chat'}
        <ChatList />
      {:else if currentPage === 'prompts'}
        <PromptsCategories />
      {:else if currentPage === 'settings'}
        <!-- Hidden for settings -->
      {/if}
    </Sidebar.Content>
    <Sidebar.Rail />
  </Sidebar.Root>
</Sidebar.Provider>
```

### Navigation Rail Implementation

**Custom 64px fixed component:**

```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { MessageSquare, Sparkles, Settings, Users, Book, HelpCircle, User } from '@lucide/svelte';
  import UserMenu from './UserMenu.svelte';

  interface Props {
    currentPath: string;
    workspaceType: 'personal' | 'team';
    onNavigate: (path: string) => void;
  }

  let { currentPath, workspaceType, onNavigate }: Props = $props();

  const navItems = $derived(
    workspaceType === 'team'
      ? [
          { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
          { id: 'prompts', label: 'Prompts', icon: Sparkles, path: '/prompts' },
          { id: 'members', label: 'Members', icon: Users, path: '/members' },
          { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
        ]
      : [
          { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
          { id: 'prompts', label: 'Prompts', icon: Sparkles, path: '/prompts' },
          { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
        ]
  );
</script>

<nav class="w-16 bg-card border-r border-r border-border flex flex-col h-screen">
  <!-- Navigation Items -->
  <div class="flex-1 flex flex-col items-center py-4 gap-1">
    {#each navItems as item (item.id)}
      <Tooltip.Root delayDuration={200}>
        <Tooltip.Trigger>
          <Button
            variant={currentPath === item.path ? 'secondary' : 'ghost'}
            size="icon"
            class="w-12 h-12 rounded-lg"
            onclick={() => onNavigate(item.path)}
          >
            {@const Icon = item.icon}
            <Icon class="w-5 h-5" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content side="right">
          {item.label}
        </Tooltip.Content>
      </Tooltip.Root>
    {/each}
  </div>

  <!-- Separator -->
  <div class="w-8 h-px bg-border my-2" />

  <!-- Utility Icons (bottom to top) -->
  <div class="flex flex-col items-center gap-1 mb-2">
    <UserMenu />

    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger>
        <Button variant="ghost" size="icon" class="w-12 h-12 rounded-lg">
          <HelpCircle class="w-5 h-5" />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content side="right">Help</Tooltip.Content>
    </Tooltip.Root>

    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger>
        <Button variant="ghost" size="icon" class="w-12 h-12 rounded-lg">
          <Book class="w-5 h-5" />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content side="right">Documentation</Tooltip.Content>
    </Tooltip.Root>
  </div>
</nav>
```

### User Menu with Workspace Switcher

**Using `Popover` + `DropdownMenu`:**

```svelte
<script lang="ts">
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Popover from '$lib/components/ui/popover';
  import { Button } from '$lib/components/ui/button';
  import { Avatar } from '$lib/components/ui/avatar';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { workspace } from '$lib/stores/workspace';
  import { User } from 'lucide-svelte';

  interface Props {
    user: { id: string; name: string; email: string; avatar?: string };
    teams: Array<{ id: string; name: string; slug: string }>;
  }

  let { user, teams }: Props = $props();
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <Button variant="ghost" size="icon" class="w-12 h-12 rounded-lg">
      {#if user.avatar}
        <Avatar class="w-8 h-8">
          <Avatar.Image src={user.avatar} alt={user.name} />
          <Avatar.Fallback>
            {user.name.charAt(0).toUpperCase()}
          </Avatar.Fallback>
        </Avatar>
      {:else}
        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span class="text-xs font-medium text-primary">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
      {/if}
    </Button>
  </DropdownMenu.Trigger>

  <DropdownMenu.Content side="top" class="w-56">
    <!-- User Info -->
    <div class="px-2 py-1.5">
      <p class="text-sm font-medium">{$workspace.name}</p>
      <p class="text-xs text-muted-foreground">{user.email}</p>
    </div>

    <DropdownMenu.Separator />

    <!-- Workspace Switcher -->
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger>
        <span>Switch Workspace</span>
      </DropdownMenu.SubTrigger>
      <DropdownMenu.SubContent>
        <DropdownMenu.Item onclick={() => workspace.switchToPersonal()}>
          <span>Personal</span>
        </DropdownMenu.Item>
        {#each teams as team (team.id)}
          <DropdownMenu.Item onclick={() => workspace.switchToTeam(team)}>
            <span>{team.name}</span>
          </DropdownMenu.Item>
        {/each}
        <DropdownMenu.Separator />
        <DropdownMenu.Item>
          <span>Create New Team</span>
        </DropdownMenu.Item>
      </DropdownMenu.SubContent>
    </DropdownMenu.Sub>

    <DropdownMenu.Separator />

    <DropdownMenu.Item>
      <span>Account Settings</span>
    </DropdownMenu.Item>
    <DropdownMenu.Item>
      <span>Logout</span>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

### AppLayout Integration

**Combining Header, Nav Rail, and Secondary Sidebar:**

```svelte
<script lang="ts">
  import Header from '$lib/components/layout/Header.svelte';
  import NavigationRail from '$lib/components/layout/NavigationRail.svelte';
  import * as SecondarySidebar from '$lib/components/layout/SecondarySidebar.svelte';
  import { page } from '$stores';
  import { goto } from '$app/navigation';

  function handleNavigate(path: string) {
    const workspaceBase = $page.url.pathname.startsWith('/team/')
      ? '/team/' + $page.params.slug
      : '/app';
    goto(workspaceBase + path);
  }
</script>

<div class="flex h-screen overflow-hidden">
  <!-- Header (fixed top) -->
  <Header class="fixed top-0 left-0 right-0 h-15 z-50" />

  <!-- Navigation Rail (fixed left) -->
  <div class="fixed left-0 top-15 bottom-0 w-16 z-40">
    <NavigationRail
      currentPath={$page.url.pathname}
      workspaceType={$page.params.slug ? 'team' : 'personal'}
      onNavigate={handleNavigate}
    />
  </div>

  <!-- Secondary Sidebar (collapsible) -->
  <div class="fixed left-16 top-15 bottom-0 z-30">
    <SecondarySidebar.Sidebar collapsible="icon" style="--sidebar-width: 17.5rem;">
      <SecondarySidebar.Content />
    </SecondarySidebar.Sidebar>
  </div>

  <!-- Main Content -->
  <main class="ml-[calc(4rem+17.5rem)] mt-15 flex-1 overflow-auto">
    {@render children?.()}
  </main>
</div>
```

### Keyboard Shortcuts

Built-in shortcuts from shadcn-svelte sidebar:

- `Cmd/Ctrl + B` - Toggle secondary sidebar

Custom shortcuts to implement:

- `Cmd/Ctrl + K` - Quick search / command palette
- `Cmd/Ctrl + N` - New chat
- `Cmd/Ctrl + Shift + N` - New prompt

### Responsive Behavior

**Tablet (768px - 1023px):**

```typescript
import { useSidebar } from '$lib/components/ui/sidebar';

const sidebar = useSidebar();

// Auto-collapse on tablet
$effect(() => {
  if (window.innerWidth < 1024 && window.innerWidth >= 768) {
    sidebar.setOpen(false);
  }
});
```

**Mobile (< 768px):**

```svelte
{#if sidebar.isMobile}
  <BottomNavigation />
{:else}
  <NavigationRail />
{/if}
```

### File Structure

```
apps/web/src/lib/components/layout/
├── Header.svelte                    # Logo only (60px)
├── NavigationRail.svelte            # 64px nav rail
├── UserMenu.svelte                  # User menu + workspace switcher
├── user-menu/
│   ├── WorkspaceSwitcher.svelte     # Workspace dropdown
│   └── UserMenuItem.svelte          # Menu item component
└── secondary-sidebar/
    ├── SecondarySidebar.svelte      # Main wrapper
    ├── ChatList.svelte              # Chat page content
    ├── PromptsCategories.svelte     # Prompts page content
    └── MembersList.svelte           # Team members content

apps/web/src/lib/stores/
└── workspace.svelte.ts              # Workspace state management

apps/web/src/routes/(app)/
└── +layout.svelte                   # App layout wrapper
```

---

## Related Documents

- **[teams-concept.md](../docs/teams-concept.md)** - Team model and access control
- **[routes.md](../docs/routes.md)** - Complete URL structure and routing
- **[database.md](../docs/database.md)** - Database tables and relationships
- **[ROADMAP.md](./ROADMAP.md)** - Development timeline
- **[STATUS.md](./STATUS.md)** - Current development status
- **[apps/web/AGENTS.md](../apps/web/AGENTS.md)** - Frontend app guidelines

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
