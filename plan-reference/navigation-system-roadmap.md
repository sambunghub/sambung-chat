# Navigation System Implementation Roadmap

**Version:** 1.0
**Last Updated:** January 16, 2026
**Status:** Ready to Start
**Phase:** Layout Enhancement

---

## Overview

Step-by-step implementation plan for NavigationRail (64px) + SecondarySidebar (280px) navigation system.

---

## Phase 1: Foundation (Core Layout)

### Week 1: Base Layout Components

#### Task 1.1: Create NavigationRail Component

**Priority:** P0 - Critical
**Estimated:** 2-3 hours
**Dependencies:** None

**Deliverables:**

- [ ] `apps/web/src/lib/components/layout/NavigationRail.svelte`
- [ ] Icon-based navigation (64px fixed width)
- [ ] Tooltips on hover
- [ ] Active state indicator
- [ ] Navigation items: Chat, Agents, Prompts
- [ ] Bottom section: User avatar placeholder

**Acceptance Criteria:**

- 64px fixed width, full height
- Icons from `@lucide/svelte`
- Smooth hover effects
- Active route highlighted
- Responsive tooltip positioning

---

#### Task 1.2: Create SecondarySidebar Component

**Priority:** P0 - Critical
**Estimated:** 2-3 hours
**Dependencies:** None

**Deliverables:**

- [ ] `apps/web/src/lib/components/layout/SecondarySidebar.svelte`
- [ ] 280px width (expanded), 48px (collapsed)
- [ ] Collapse toggle button
- [ ] Keyboard shortcut `Cmd/Ctrl + B`
- [ ] Context content slot

**Acceptance Criteria:**

- Smooth collapse/expand animation
- Persists state to localStorage
- Keyboard toggle works
- Content slot renders correctly

---

#### Task 1.3: Create UserMenu Component

**Priority:** P0 - Critical
**Estimated:** 2 hours
**Dependencies:** None

**Deliverables:**

- [ ] `apps/web/src/lib/components/layout/UserMenu.svelte`
- [ ] Avatar display with user info
- [ ] Theme toggle (Light/Dark)
- [ ] Settings link
- [ ] Logout action
- [ ] Popup positioning

**Acceptance Criteria:**

- Popup displays above avatar
- Theme toggle persists preference
- Logout redirects to login
- Clean close on outside click

---

#### Task 1.4: Create Navigation Config

**Priority:** P1 - High
**Estimated:** 1 hour
**Dependencies:** None

**Deliverables:**

- [ ] `apps/web/src/lib/navigation/nav-config.ts`
- [ ] Nav items configuration
- [ ] TypeScript types
- [ ] Helper functions

**Acceptance Criteria:**

- Type-safe config
- Easy to add new items
- Supports team items

---

#### Task 1.5: Update AppLayout

**Priority:** P0 - Critical
**Estimated:** 2-3 hours
**Dependencies:** Tasks 1.1, 1.2, 1.3, 1.4

**Deliverables:**

- [ ] Update `apps/web/src/routes/app/+layout.svelte`
- [ ] Combine NavigationRail + SecondarySidebar
- [ ] Update responsive behavior
- [ ] Test with existing chat page

**Acceptance Criteria:**

- Layout renders correctly
- No hydration errors
- Mobile responsive
- Existing functionality preserved

---

## Phase 2: Secondary Sidebar Content

### Week 2: Chat & Agents Content

#### Task 2.1: Create ChatList Component

**Priority:** P1 - High
**Estimated:** 3-4 hours
**Dependencies:** Task 1.5

**Deliverables:**

- [ ] `apps/web/src/lib/components/secondary-sidebar/ChatList.svelte`
- [ ] [+ New Chat] button
- [ ] Recent chats list
- [ ] Search bar (keyword + tags)
- [ ] Chat item actions (pin, delete, rename)

**Acceptance Criteria:**

- Lists recent chats
- Search filters correctly
- Actions work as expected
- Empty state displays

---

#### Task 2.2: Create ChatFolders Component

**Priority:** P2 - Medium
**Estimated:** 2-3 hours
**Dependencies:** Task 2.1

**Deliverables:**

- [ ] `apps/web/src/lib/components/secondary-sidebar/ChatFolders.svelte`
- [ ] Collapsible folders
- [ ] Folder creation/editing
- [ ] Drag-and-drop support (optional)

**Acceptance Criteria:**

- Folders collapse/expand
- Can create new folder
- Chats move to folders

---

#### Task 2.3: Create AgentsCategories Component

**Priority:** P1 - High
**Estimated:** 2-3 hours
**Dependencies:** Task 1.5

**Deliverables:**

- [ ] `apps/web/src/lib/components/secondary-sidebar/AgentsCategories.svelte`
- [ ] Category tabs (My, Marketplace, Shared)
- [ ] [+ Create Agent] button
- [ ] Agent cards display
- [ ] Search agents

**Acceptance Criteria:**

- Tabs switch correctly
- Cards display properly
- Search filters work
- Empty states for each category

---

#### Task 2.4: Create PromptsCategories Component

**Priority:** P1 - High
**Estimated:** 2-3 hours
**Dependencies:** Task 1.5

**Deliverables:**

- [ ] `apps/web/src/lib/components/secondary-sidebar/PromptsCategories.svelte`
- [ ] Category tabs (My, Marketplace, Shared)
- [ ] [+ Create Prompt] button
- [ ] Prompt cards display
- [ ] Search prompts

**Acceptance Criteria:**

- Similar to AgentsCategories
- Tabs switch correctly
- Cards display properly
- Search filters work

---

## Phase 3: Routes & Pages

### Week 3: New Routes

#### Task 3.1: Create Agents Page

**Priority:** P1 - High
**Estimated:** 2-3 hours
**Dependencies:** Task 2.3

**Deliverables:**

- [ ] `apps/web/src/routes/app/agents/+page.svelte`
- [ ] Agent grid/list view
- [ ] Empty state
- [ ] Integration with AgentsCategories sidebar

**Acceptance Criteria:**

- Page displays correctly
- Sidebar shows agents categories
- Empty state has CTA

---

#### Task 3.2: Create Prompts Page

**Priority:** P1 - High
**Estimated:** 2-3 hours
**Dependencies:** Task 2.4

**Deliverables:**

- [ ] `apps/web/src/routes/app/prompts/+page.svelte`
- [ ] Prompt grid/list view
- [ ] Empty state
- [ ] Integration with PromptsCategories sidebar

**Acceptance Criteria:**

- Page displays correctly
- Sidebar shows prompts categories
- Empty state has CTA

---

#### Task 3.3: Create Settings Page

**Priority:** P2 - Medium
**Estimated:** 2-3 hours
**Dependencies:** Task 1.3

**Deliverables:**

- [ ] `apps/web/src/routes/app/settings/+page.svelte`
- [ ] Full-width layout (no secondary sidebar)
- [ ] Settings sections:
  - Profile
  - Appearance
  - API Keys
  - Language

**Acceptance Criteria:**

- Full-width layout
- Settings save correctly
- Navigation works

---

#### Task 3.4: Update Chat Page

**Priority:** P2 - Medium
**Estimated:** 1-2 hours
**Dependencies:** Task 2.1

**Deliverables:**

- [ ] Update `apps/web/src/routes/app/chat/+page.svelte`
- [ ] Integration with ChatList sidebar
- [ ] Update active state in NavigationRail

**Acceptance Criteria:**

- Chat page works with new layout
- ChatList shows active chat
- NavigationRail highlights correctly

---

## Phase 4: Polish & Optimization

### Week 4: Final Polish

#### Task 4.1: Responsive Mobile Navigation

**Priority:** P1 - High
**Estimated:** 3-4 hours
**Dependencies:** All previous tasks

**Deliverables:**

- [ ] Bottom navigation for mobile (<768px)
- [ ] Off-canvas drawer for secondary sidebar
- [ ] Swipe gestures
- [ ] Touch-optimized interactions

**Acceptance Criteria:**

- Mobile layout works
- Gestures work smoothly
- Touch targets are appropriate size

---

#### Task 4.2: Animations & Transitions

**Priority:** P2 - Medium
**Estimated:** 2-3 hours
**Dependencies:** All previous tasks

**Deliverables:**

- [ ] Smooth page transitions
- [ ] Sidebar collapse animation
- [ ] Hover effects
- [ ] Loading states

**Acceptance Criteria:**

- 60fps animations
- No janky transitions
- Loading states display

---

#### Task 4.3: Keyboard Accessibility

**Priority:** P1 - High
**Estimated:** 2 hours
**Dependencies:** All previous tasks

**Deliverables:**

- [ ] Full keyboard navigation
- [ ] Focus indicators
- [ ] Screen reader support
- [ ] ARIA labels

**Acceptance Criteria:**

- Tab through nav items
- Enter/space to activate
- Screen reader announces correctly

---

#### Task 4.4: Testing & Bug Fixes

**Priority:** P0 - Critical
**Estimated:** Ongoing

**Deliverables:**

- [ ] Test all navigation flows
- [ ] Fix hydration errors
- [ ] Fix TypeScript errors
- [ ] Fix accessibility issues
- [ ] Performance optimization

**Acceptance Criteria:**

- No console errors
- All tests pass
- Lighthouse score >90

---

## Implementation Order

### Sprint 1 (Days 1-3): Core Layout

1. Task 1.1: NavigationRail (3h)
2. Task 1.2: SecondarySidebar (3h)
3. Task 1.3: UserMenu (2h)
4. Task 1.4: Nav Config (1h)
5. Task 1.5: Update AppLayout (3h)

**Total:** ~12 hours (1.5 days)

---

### Sprint 2 (Days 4-6): Chat Content

1. Task 2.1: ChatList (4h)
2. Task 2.2: ChatFolders (3h)
3. Task 3.4: Update Chat Page (2h)

**Total:** ~9 hours (1 day)

---

### Sprint 3 (Days 7-9): Agents & Prompts

1. Task 2.3: AgentsCategories (3h)
2. Task 2.4: PromptsCategories (3h)
3. Task 3.1: Agents Page (3h)
4. Task 3.2: Prompts Page (3h)

**Total:** ~12 hours (1.5 days)

---

### Sprint 4 (Days 10-12): Polish

1. Task 3.3: Settings Page (3h)
2. Task 4.1: Mobile Responsive (4h)
3. Task 4.2: Animations (3h)
4. Task 4.3: Accessibility (2h)
5. Task 4.4: Testing (ongoing)

**Total:** ~12+ hours (1.5+ days)

---

## Total Estimated Time

**Minimum:** 45 hours (~6 days)
**With Buffer:** 60 hours (~8 days)
**With Testing:** 70+ hours (~9 days)

---

## Dependencies

### Required Packages

- ✅ `@lucide/svelte` - Icons (already installed)
- ✅ shadcn-svelte components - UI primitives
- ⚠️ May need: `svelte-legos` or similar for animations

### External Dependencies

- None - all custom implementation

---

## Risk Assessment

| Risk               | Impact | Mitigation                           |
| ------------------ | ------ | ------------------------------------ |
| Hydration errors   | High   | Test early with SSR                  |
| Mobile complexity  | Medium | Start with desktop, add mobile later |
| Performance        | Low    | Use Svelte 5 runes, lazy loading     |
| Accessibility gaps | Medium | Test with screen reader early        |

---

## Success Criteria

- ✅ No TypeScript errors
- ✅ No hydration errors
- ✅ All navigation flows work
- ✅ Mobile responsive
- ✅ Keyboard accessible
- ✅ Lighthouse score >90
- ✅ All existing features preserved

---

## Next Steps

1. **Review this roadmap** - Get approval
2. **Start Sprint 1** - Core layout components
3. **Daily standup** - Track progress
4. **End of each sprint** - Review and demo
5. **Final sprint** - Polish and testing

---

## Related Documents

- **[navigation-system-design.md](./navigation-system-design.md)** - Design specifications
- **[STATUS.md](./STATUS.md)** - Overall project status
- **[ui-ux-design.md](./ui-ux-design.md)** - Original UI/UX design

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
