# SAMBUNG CHAT: UI/UX Design Document

**Version:** 1.0
**Last Updated:** January 11, 2026
**Status:** Ready for Implementation

---

## Table of Contents

1. [Design System](#design-system)
2. [Page Structure & Routes](#page-structure--routes)
3. [Component Hierarchy](#component-hierarchy)
4. [Layout Specifications](#layout-specifications)
5. [User Flows](#user-flows)
6. [Component Specifications](#component-specifications)

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

```
apps/web/src/routes/
├── (app)/                    # Main app layout with sidebar
│   ├── chat/
│   │   ├── +page.svelte              # Chat list / home
│   │   ├── [id]/
│   │   │   └── +page.svelte          # Individual chat view
│   │   └── +page.svelte              # New chat
│   ├── prompts/
│   │   ├── +page.svelte              # Prompt templates library
│   │   └── new/+page.svelte          # Create new prompt
│   ├── settings/
│   │   ├── +page.svelte              # General settings
│   │   ├── api-keys/+page.svelte     # API key management
│   │   └── appearance/+page.svelte   # Theme, font size
│   └── +layout.svelte                # App layout (sidebar + main)
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

| Route Group | Layout         | Purpose                         |
| ----------- | -------------- | ------------------------------- |
| `(app)`     | Sidebar + Main | Protected routes, requires auth |
| `(auth)`    | Centered card  | Public auth routes              |

---

## Component Hierarchy

```
SambungChat Components
│
├── Layout Components
│   ├── AppLayout                 # Main app layout with sidebar
│   │   ├── Sidebar
│   │   │   ├── ChatList
│   │   │   ├── NewChatButton
│   │   │   └── UserMenu
│   │   └── MainContent
│   │
│   └── AuthLayout                # Centered auth layout
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
│   │   └── CategoryFilter
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
    ├── Button (from @sambung-chat/ui)
    ├── Input (from @sambung-chat/ui)
    ├── Card (from @sambung-chat/ui)
    ├── Dialog (from @sambung-chat/ui)
    ├── DropdownMenu (from @sambung-chat/ui)
    ├── Select (from @sambung-chat/ui)
    ├── Toast (from @sambung-chat/ui)
    └── LoadingSpinner
```

---

## Layout Specifications

### 1. App Layout (Dual Sidebar: Navigation Rail + Context Sidebar)

**Desktop (> 1024px):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Header (Logo, Search, User Menu)                                           │
├──────┬───────────────────────────────────────────────────────────────────────┤
│ Nav  │        Content Area                                                   │
│ Rail │  ┌─────────────────────────────────────────────────────────────────┐  │
│(64px)│  │                                                                 │  │
│      │  │         Chat Interface / Prompts / Settings                      │  │
│ ┌──┐ │  │                                                                 │  │
│ │💬│ │  │                                                                 │  │
│ ├──┤ │  │                                                                 │  │
│ │✨│ │  │                                                                 │  │
│ ├──┤ │  │                                                                 │  │
│ │⚙️│ │  │                                                                 │  │
│ └──┘ │  └─────────────────────────────────────────────────────────────────┘  │
│      │                                                                       │
├──────┼───────────────────────────────────────────────────────────────────────┤
│      │       Secondary Sidebar (Context-Aware)                               │
│      │  ┌─────────────────────────────────────────────────────────────────┐  │
│      │  │  [+ New Chat]                                                   │  │
│      │  │  ────────────────────────────────────────────────────────────   │  │
│      │  │  📄 Chat: Meaning of Life                     2m ago        │  │
│      │  │  📄 Chat: Python Tutorial                       1h ago        │  │
│      │  │  📄 Chat: React vs Svelte                      3h ago        │  │
│      │  │                                                                 │  │
│      │  │  [Search chats...]                                               │  │
│      │  └─────────────────────────────────────────────────────────────────┘  │
└──────┴───────────────────────────────────────────────────────────────────────┘
```

**Tablet (768px - 1024px):**

```
┌─────────────────────────────────────────────────────────┐
│  Header (Logo, Search, User Menu)                       │
├──────┬──────────────────────────────────────────────────┤
│ Nav  │        Content Area                               │
│ Rail │  (Secondary sidebar expands on hover)            │
│(64px)│                                                   │
│ ┌──┐ │                                                   │
│ │💬│ │                                                   │
│ ├──┤ │                                                   │
│ │✨│ │                                                   │
│ ├──┤ │                                                   │
│ │⚙️│ │                                                   │
│ └──┘ │                                                   │
└──────┴──────────────────────────────────────────────────┘
```

**Mobile (< 768px):**

```
┌─────────────────────────────┐
│  Header (Menu, Title)       │
├─────────────────────────────┤
│                             │
│     Main Content Area       │
│                             │
│                             │
│                             │
└─────────────────────────────┘
┌─────────────────────────────┐
│  💬  ✨  ⚙️  (Bottom Nav)   │
└─────────────────────────────┘
```

### Layout Components Breakdown

**Navigation Rail (64px)** - Always visible:

- Icon-only navigation items
- Active state indicator
- Tooltips on hover
- Consistent across all pages

**Secondary Sidebar (280px)** - Context-aware content:

- Chats page: Shows chat list
- Prompts page: Shows prompt categories
- Settings page: Shows settings navigation
- Collapsible on tablet
- Hidden on mobile (drawer)

**Responsive Behavior**:
| Screen Size | Nav Rail | Secondary Sidebar |
|-------------|----------|-------------------|
| > 1024px (Desktop) | Always visible (64px) | Always visible (280px) |
| 768-1024px (Tablet) | Always visible (64px) | Collapsed (64px), expands on hover |
| < 768px (Mobile) | Hidden (bottom nav instead) | Hidden (slide-in drawer) |

### 2. Chat Interface Layout

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Chat List    Chat Title        ⚙️ Model ▼   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                │    │
│  │  Messages Area (scrollable)                    │    │
│  │                                                │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │ User: What is the meaning of life?   │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  │                                                │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │ Assistant: [Streaming response...]   │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  │                                                │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Model: GPT-4 ▼          Stop              Copy | Delete │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐    │
│  │ [Message input textarea...]              │    │
│  └────────────────────────────────────────────────┘    │
│                                                    📎    │
│                                    Send 📤              │
└─────────────────────────────────────────────────────────┘
```

### 3. Auth Layout (Login/Register)

**Centered Card Layout:**

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│              ┌─────────────────────────┐                │
│              │                         │                │
│              │      Sambung Chat       │                │
│              │        Logo             │                │
│              │                         │                │
│              ├─────────────────────────┤                │
│              │                         │                │
│              │  [Email Input]          │                │
│              │                         │                │
│              │  [Password Input]       │                │
│              │                         │                │
│              │  [Login Button]         │                │
│              │                         │                │
│              │  Don't have an account? │                │
│              │  [Sign up]              │                │
│              │                         │                │
│              └─────────────────────────┘                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## User Flows

### 1. Authentication Flow

```
┌─────────┐
│ Landing │
│  Page   │
└────┬────┘
     │
     ├─→ Already logged in? ──→ Redirect to /chat
     │
     └─→ Not logged in
          │
          ├─→ Go to /login
          │     │
          │     ├─→ Enter credentials
          │     ├─→ Click "Login"
          │     └─→ Success → Redirect to /chat
          │
          └─→ Go to /register
                │
                ├─→ Enter email, password, name
                ├─→ Click "Sign Up"
                └─→ Success → Redirect to /chat
```

### 2. Chat Creation Flow

```
┌─────────────┐
│   Sidebar   │
└──────┬──────┘
       │
       ├─→ Click "New Chat"
       │     │
       │     └─→ Open chat interface
       │           │
       │           ├─→ Select model (default: last used)
       │           └─→ Ready for input
       │
       └─→ Click existing chat
             │
             └─→ Open chat history
```

### 3. Sending Message Flow

```
┌──────────────────┐
│  Chat Interface  │
└─────────┬────────┘
          │
          ├─→ Type message in textarea
          │     │
          │     ├─→ (Optional) Select different model
          │     ├─→ (Optional) Attach file (future)
          │     └─→ Click "Send" / Press Enter
          │           │
          │           ├─→ Show user message immediately
          │           ├─→ Show streaming indicator
          │           ├─→ Stream AI response
          │           └─→ Save to chat history
          │
          └─→ Edit prompt (future)
                │
                └─→ Regenerate response
```

### 4. API Key Management Flow

```
┌──────────────┐
│   Settings   │
└──────┬───────┘
       │
       └─→ Go to "API Keys"
             │
             ├─→ View existing keys (masked)
             │     │
             │     ├─→ Click "Add Key"
             │     │     │
             │     │     ├─→ Select provider (OpenAI, etc.)
             │     │     ├─→ Enter API key
             │     │     ├─→ (Optional) Test connection
             │     │     └─→ Save
             │     │
             │     └─→ Delete key
             │
             └─→ Key stored encrypted in database
```

---

## Component Specifications

### 1. Sidebar Component

**File:** `apps/web/src/components/Sidebar.svelte`

**Props:**

```typescript
interface Props {
  chats: Chat[];
  currentChatId?: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}
```

**Features:**

- New Chat button (primary action)
- Chat list with search
- Chat item: title, last message preview, timestamp
- Pin/unpin chat
- Delete chat (with confirmation)
- Navigation to Prompts, Settings

**Responsive:**

- Desktop: Always visible (280px width)
- Mobile: Hidden behind hamburger menu

---

### 2. ChatInterface Component

**File:** `apps/web/src/components/chat/ChatInterface.svelte`

**Props:**

```typescript
interface Props {
  chatId?: string;
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
- Attach file button (future)

---

### 3. Message Component

**File:** `apps/web/src/components/chat/Message.svelte`

**Props:**

```typescript
interface Props {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  provider?: string;
  timestamp: Date;
  metadata?: MessageMetadata;
  isStreaming?: boolean;
}
```

**Features:**

- Markdown rendering (using `marked` or similar)
- Syntax highlighting for code blocks
- Copy button for code blocks
- Token count (for assistant messages)
- Latency display
- Cost estimation (future)

---

### 4. ModelSelector Component

**File:** `apps/web/src/components/chat/ModelSelector.svelte`

**Props:**

```typescript
interface Props {
  models: Model[];
  selectedModel: Model;
  onSelectModel: (model: Model) => void;
}
```

**Features:**

- Dropdown with provider icons
- Group by provider
- Show model name & description
- Indicate if API key is configured
- Filter/search models

---

### 5. PromptLibrary Component

**File:** `apps/web/src/components/prompts/PromptLibrary.svelte`

**Props:**

```typescript
interface Props {
  prompts: Prompt[];
  categories: string[];
  onUsePrompt: (prompt: Prompt) => void;
  onEditPrompt: (id: string) => void;
  onDeletePrompt: (id: string) => void;
}
```

**Features:**

- Grid/list view toggle
- Search prompts
- Filter by category
- Prompt card: name, description, tags
- "Use" button (opens in new chat or applies to current)
- Edit/delete (for own prompts)
- Create new prompt button

---

### 6. APIKeyManager Component

**File:** `apps/web/src/components/settings/APIKeyManager.svelte`

**Props:**

```typescript
interface Props {
  apiKeys: APIKey[];
  onAddKey: (provider: string, key: string) => void;
  onDeleteKey: (id: string) => void;
}
```

**Features:**

- List of configured keys
- Provider icon/name
- Masked key display (show/hide toggle)
- Last 4 digits visible
- Test connection button
- Add new key dialog
- Delete key (with confirmation)

---

### 7. SettingsNav Component

**File:** `apps/web/src/components/settings/SettingsNav.svelte`

**Props:**

```typescript
interface Props {
  currentPath: string;
}
```

**Navigation Items:**

- General (language, auto-save)
- Appearance (theme, font size, sidebar width)
- API Keys
- Privacy (telemetry toggle)
- Account (email change, password)
- About (version, license)

---

## Responsive Breakpoints

```css
/* Mobile First Approach */

/* Default: < 640px (Mobile) */
/* Single column, bottom nav */

/* sm: 640px - 768px (Tablet) */
/* Sidebar as drawer */

/* md: 768px - 1024px (Small Desktop) */
/* Sidebar always visible */

/* lg: 1024px - 1280px (Desktop) */
/* Full layout */

/* xl: > 1280px (Large Desktop) */
/* Max content width */
```

---

## Animation & Transitions

### Using Svelte Transitions

```svelte
<script>
  import { fade, slide, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
</script>

<!-- Message appears with fade + slide up -->
<div transition:fade|slide={{ duration: 300 }}>
  {content}
</div>

<!-- Modal scales in -->
<div transition:scale|quintOut={{ duration: 200 }}>
  {modalContent}
</div>
```

### Loading States

- Skeleton screens for chat list
- Pulse animation for streaming indicator
- Spinner for button loading states

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation

- `Tab` - Navigate through interactive elements
- `Enter` - Submit form, send message
- `Escape` - Close modal, clear search
- `Ctrl/Cmd + K` - Focus search input
- `Ctrl/Cmd + N` - New chat
- Arrow keys - Navigate lists

### ARIA Labels

All interactive elements must have `aria-label` or accessible text.

### Focus Management

- Visible focus indicators (ring)
- Logical tab order
- Focus trap in modals
- Return focus after closing modals

### Screen Reader Support

- Live regions for streaming responses
- Announce model changes
- Announce errors

---

## Icon Library

Using [Lucide Svelte](https://lucide.dev/) (already in project)

Common icons:

- `MessageSquare` - Chat
- `Plus` - New chat
- `Settings` - Settings
- `Key` - API keys
- `Sparkles` - AI/Prompts
- `User` - User menu
- `LogOut` - Logout
- `Moon` / `Sun` - Theme toggle
- `Send` - Send message
- `Square` - Stop generation
- `Copy` - Copy message
- `Trash2` - Delete
- `Search` - Search
- `ChevronDown` - Dropdown
- `Menu` - Mobile menu

---

## Integration with Existing Code

### Using @sambung-chat/ui Components

```svelte
<script>
  import { Button, Input, Card } from '@sambung-chat/ui';
</script>

<Card>
  <Input placeholder="Type a message..." />
  <Button>Send</Button>
</Card>
```

### API Integration

```svelte
<script>
  import { onMount } from 'svelte';
  import { orpc } from '@sambung-chat/api'; // ORPC client

  let chats = [];

  onMount(async () => {
    chats = await orpc.chats.list();
  });
</script>
```

---

## Implementation Priority

### Phase 1 (Week 1-4): Foundation

1. ✅ Setup shadcn-svelte in packages/ui
2. ✅ Create base components (Button, Input, Card)
3. ⬜ AppLayout with Sidebar
4. ⬜ AuthLayout (Login/Register pages)
5. ⬜ Theme provider (dark mode)

### Phase 2 (Week 5-8): Chat Interface

1. ⬜ ChatInterface component
2. ⬜ Message component with Markdown
3. ⬜ ChatInput with streaming
4. ⬜ ModelSelector
5. ⬜ ChatList in sidebar

### Phase 3 (Week 9-12): Additional Features

1. ⬜ PromptLibrary component
2. ⬜ APIKeyManager component
3. ⬜ Settings pages
4. ⬜ Export chat functionality
5. ⬜ Search chats

---

## Related Documents

- [Open Source PRD](./PRD-OpenSource.md) - Product requirements
- [ROADMAP](./ROADMAP.md) - Development timeline
- [packages/ui/README.md](../packages/ui/README.md) - UI component library

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
