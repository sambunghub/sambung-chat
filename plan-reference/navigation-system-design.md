# Navigation System Design

**Version:** 1.0
**Last Updated:** January 16, 2026
**Status:** Approved - Ready for Implementation
**Phase:** Layout Enhancement

---

## Overview

Complete navigation system design with NavigationRail (64px master menu) and SecondarySidebar (280px context-aware content). This system replaces the current single 350px Sidebar with a more flexible, modern dual-sidebar architecture.

---

## Architecture

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Header (60px) - Logo only                                       │
├────┬──────────────────────────────────────┬─────────────────────┤
│Nav │    Secondary Sidebar (280px)         │   Content Area       │
│Rail│    Collapsible, Context-Aware        │   (flex-1)           │
│64px│  ┌────────────────────────────────┐  │                     │
│    │  │ [+ New Chat]                  │  │   Main Content:     │
│    │  │ ─────────────────────────────  │  │   • Chat Interface  │
│ 💬 │  │ Recent Chats                   │  │   • Agents Library  │
│    │  │ 📄 Project Notes    2m         │  │   • Prompts Library │
│ 🤖 │  │ 📄 Python Tutorial   1h        │  │   • Settings        │
│    │  │ [Search chats...]              │  │                     │
│ ✨ │  └────────────────────────────────┘  │                     │
│    │                                    │                     │
│ 👥 │  ← Team items (only if in team)    │                     │
│    │                                    │                     │
│────┼────────────────────────────────────┴─────────────────────┤
│ 👤 │ User Avatar (bottom) - Opens User Menu                   │
└────┴───────────────────────────────────────────────────────────┘
```

---

## Components

### 1. NavigationRail (64px)

**Location:** `apps/web/src/lib/components/layout/NavigationRail.svelte`

**Purpose:** Master menu with icon-based navigation

**Navigation Items:**

| Icon | Label   | Path           | Secondary Sidebar Content           |
| ---- | ------- | -------------- | ----------------------------------- |
| 💬   | Chat    | `/app/chat`    | Chat history + folders + search     |
| 🤖   | Agents  | `/app/agents`  | My Agents \| Marketplace \| Shared  |
| ✨   | Prompts | `/app/prompts` | My Prompts \| Marketplace \| Shared |
| 👥   | Team    | `/team/[slug]` | Dashboard \| Members \| Settings    |

**Separator** (1px border)

**Bottom Section:**

- 👤 User Avatar (opens UserMenu)

**Props:**

```typescript
interface NavigationRailProps {
  currentPath: string;
  userTeams?: Team[]; // For team nav items
  onNavigate: (path: string) => void;
}
```

---

### 2. SecondarySidebar (280px)

**Location:** `apps/web/src/lib/components/layout/SecondarySidebar.svelte`

**Purpose:** Context-aware content that changes based on active NavigationRail item

**Dimensions:**

- Expanded: 280px (full content)
- Collapsed: 48px (icon-only with tooltips)
- Hidden: on Settings page (full-width content)

**Toggle:** Keyboard shortcut `Cmd/Ctrl + B`

**Context Content:**

| Nav Item | Component                  | Content Structure               |
| -------- | -------------------------- | ------------------------------- |
| Chat     | `ChatList.svelte`          | Recent chats, folders, search   |
| Agents   | `AgentsCategories.svelte`  | My Agents, Marketplace, Shared  |
| Prompts  | `PromptsCategories.svelte` | My Prompts, Marketplace, Shared |
| Team     | `TeamDashboard.svelte`     | Analytics, members, settings    |

**Props:**

```typescript
interface SecondarySidebarProps {
  currentPage: 'chat' | 'agents' | 'prompts' | 'team' | 'settings';
  isCollapsed: boolean;
  onToggle: () => void;
}
```

---

### 3. UserMenu (Avatar Popup)

**Location:** `apps/web/src/lib/components/layout/UserMenu.svelte`

**Purpose:** Personal settings and account actions

**Content:**

```
┌─────────────────────────────────┐
│ 👤 John Doe                     │
│ john@example.com                │
│ [Avatar preview]                │
├─────────────────────────────────┤
│ 🌙 Theme: Dark ▼               │
│ ⚙️ Settings → /settings         │
│ 🚪 Logout                       │
└─────────────────────────────────┘
```

**Features:**

- Theme toggle (Light/Dark)
- Settings link
- Logout action
- Profile info display

---

## Detailed SecondarySidebar Content

### Chat → ChatList

**Components:**

- `ChatList.svelte` - Main container
- `ChatFolders.svelte` - Folder structure
- `ChatSearchBar.svelte` - Search by keyword/tags

**Features:**

- [+ New Chat] button
- Recent chats list (last 50)
- Folders (collapsible):
  - Work (3)
  - Personal (5)
  - Custom folders
- Search bar:
  - Keyword search
  - Tag filtering
- Chat item actions:
  - Pin/unpin
  - Delete
  - Rename

**Data Structure:**

```typescript
interface ChatItem {
  id: string;
  title: string;
  updatedAt: Date;
  folder?: string;
  tags?: string[];
  pinned?: boolean;
}
```

---

### Agents → AgentsCategories

**Components:**

- `AgentsCategories.svelte` - Main container
- `AgentCard.svelte` - Agent item

**Categories:**

1. **My Agents** - Created by user
2. **Marketplace** - Public/free agents from developers
3. **Shared with me** - Private agents shared by others

**Features:**

- [+ Create Agent] button
- Category tabs
- Agent cards with:
  - Name, description
  - Avatar/icon
  - Usage stats
- Search agents
- Filter by category

**Data Structure:**

```typescript
interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  visibility: 'personal' | 'team' | 'public';
  marketplaceFeatured?: boolean;
  createdBy: string;
}
```

---

### Prompts → PromptsCategories

**Components:**

- `PromptsCategories.svelte` - Main container
- `PromptCard.svelte` - Prompt item

**Categories:**

1. **My Prompts** - Created by user
2. **Marketplace** - Public/free prompts from developers
3. **Shared with me** - Private prompts shared by others

**Features:**

- [+ Create Prompt] button
- Category tabs
- Prompt cards with:
  - Name, description
  - Variables count
  - Usage stats
- Search prompts
- Filter by category

**Data Structure:**

```typescript
interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: string[];
  visibility: 'personal' | 'team' | 'public';
  marketplaceFeatured?: boolean;
  createdBy: string;
}
```

---

### Team → TeamDashboard

**Components:**

- `TeamDashboard.svelte` - Main container
- `TeamAnalytics.svelte` - Simple stats
- `TeamMembersList.svelte` - Members management

**Sections:**

1. **Dashboard Analytics**
   - Total chats
   - Active members
   - Agent usage
   - Prompt usage

2. **Members**
   - Member list
   - Role badges
   - Add member button

3. **Settings**
   - Team name
   - Team avatar
   - Permissions

**Data Structure:**

```typescript
interface TeamStats {
  totalChats: number;
  activeMembers: number;
  agentUsage: number;
  promptUsage: number;
}

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
}
```

---

## Configuration

### Nav Config (TypeScript-based)

**Location:** `apps/web/src/lib/navigation/nav-config.ts`

```typescript
import { MessageSquare, Bot, Sparkles, Users } from '@lucide/svelte';

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  secondarySidebarComponent: string;
}

export const personalNavItems: NavItem[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    path: '/app/chat',
    secondarySidebarComponent: 'ChatList',
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: Bot,
    path: '/app/agents',
    secondarySidebarComponent: 'AgentsCategories',
  },
  {
    id: 'prompts',
    label: 'Prompts',
    icon: Sparkles,
    path: '/app/prompts',
    secondarySidebarComponent: 'PromptsCategories',
  },
];

export const teamNavItems: NavItem[] = [
  ...personalNavItems,
  {
    id: 'team',
    label: 'Team',
    icon: Users,
    path: `/team/{slug}`,
    secondarySidebarComponent: 'TeamDashboard',
  },
];

export function getNavItems(hasTeam: boolean): NavItem[] {
  return hasTeam ? teamNavItems : personalNavItems;
}
```

---

## File Structure

```
apps/web/src/lib/
├── components/
│   ├── layout/
│   │   ├── NavigationRail.svelte          # 64px nav rail
│   │   ├── UserMenu.svelte                # Avatar popup
│   │   ├── SecondarySidebar.svelte        # 280px context sidebar
│   │   └── ThemeToggle.svelte             # Theme switcher
│   │
│   ├── navigation/
│   │   ├── nav-config.ts                  # Menu configuration
│   │   └── types.ts                       # Shared types
│   │
│   └── secondary-sidebar/
│       ├── ChatList.svelte                # Chat history
│       ├── ChatFolders.svelte             # Folder structure
│       ├── ChatSearchBar.svelte           # Search component
│       ├── AgentsCategories.svelte        # Agents categories
│       ├── PromptsCategories.svelte       # Prompts categories
│       └── TeamDashboard.svelte           # Team dashboard
│
└── routes/
    └── app/
        ├── +layout.svelte                 # Updated with NavigationRail + SecondarySidebar
        ├── chat/+page.svelte              # Current chat page
        ├── agents/+page.svelte            # Agents page (new)
        ├── prompts/+page.svelte           # Prompts page (new)
        └── settings/+page.svelte          # Settings page (new)
```

---

## Route Structure

```
/app/chat          → Chat interface with chat history sidebar
/app/agents        → Agents library with categories sidebar
/app/prompts       → Prompts library with categories sidebar
/app/settings      → Settings page (no secondary sidebar, full-width)
/team/[slug]       → Team workspace with team dashboard sidebar
/team/[slug]/chat  → Team chat
```

---

## Responsive Behavior

### Desktop (≥1024px)

- NavigationRail: Visible (64px)
- SecondarySidebar: Expanded (280px) or collapsed (48px)
- Toggle button available

### Tablet (768px - 1023px)

- NavigationRail: Visible (64px)
- SecondarySidebar: Collapsed by default (48px)
- Toggle button to expand

### Mobile (<768px)

- NavigationRail: Transform to Bottom Navigation (56px)
- SecondarySidebar: Off-canvas drawer (slide-up)
- Swipe gestures support

---

## State Management

### Navigation State

```typescript
// stores/navigation.svelte.ts
export const navigationStore = {
  activeNav: $state<'chat' | 'agents' | 'prompts' | 'team'>('chat'),
  sidebarCollapsed: $state(false),
  activeTeam: $state<Team | null>(null),
};
```

### User Menu State

```typescript
// stores/user-menu.svelte.ts
export const userMenuStore = {
  isOpen: $state(false),
  theme: $state<'light' | 'dark'>('dark'),
};
```

---

## Database Schema

### Agents Table

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatar VARCHAR(500),
  visibility VARCHAR(20) DEFAULT 'personal', -- 'personal' | 'team' | 'public'
  marketplace_featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id), -- nullable
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Prompts Table

```sql
CREATE TABLE prompts (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  visibility VARCHAR(20) DEFAULT 'personal', -- 'personal' | 'team' | 'public'
  marketplace_featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id), -- nullable
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Future Enhancements (Phase 2)

1. **Database-driven menu** - Store menu config in database for team customization
2. **Drag-and-drop folders** - Reorder chat folders
3. **Custom themes** - User-defined color schemes
4. **Keyboard shortcuts** - Full keyboard navigation
5. **Workspace switcher** - Quick team switching
6. **Notification badges** - Unread counts on nav items

---

## Related Documents

- **[navigation-system-roadmap.md](./navigation-system-roadmap.md)** - Implementation roadmap
- **[ui-ux-design.md](./ui-ux-design.md)** - Original UI/UX design document
- **[STATUS.md](./STATUS.md)** - Overall project status
- **[../docs/routes.md](../docs/routes.md)** - Route structure documentation

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
