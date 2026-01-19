# Drag & Drop Chat dan Folder Management

## 📋 Overview

Implementasi drag & drop functionality untuk:

1. **Reorder chat** dalam folder yang sama
2. **Move chat antar folder** (drag chat ke folder lain)
3. **Reorder folder** dalam sidebar
4. **Optional**: Nested folder structure

---

## 🎯 User Stories

### 1. Reorder Chats within Folder

**User wants**: Mengatur urutan chat sesuai preferensi

**Scenario**:

- User drag chat item ke posisi baru dalam folder yang sama
- Visual feedback: highlight drop zone, ghost image saat drag
- Order tersimpan di database
- Urutan tetap konsisten setelah refresh

### 2. Move Chat to Different Folder

**User wants**: Memindahkan chat ke folder lain dengan mudah

**Scenario**:

- User drag chat item ke folder header
- Drop zone muncul di folder target
- Chat pindah ke folder baru
- Order di folder baru adalah posisi drop

### 3. Reorder Folders

**User wants**: Mengatur urutan folder di sidebar

**Scenario**:

- User drag folder header ke posisi baru
- Visual feedback: highlight drop zone
- Order tersimpan di database

---

## 🔧 Technical Approach

### Library Comparison

| Library               | Pros                             | Cons                             | Recommendation                      |
| --------------------- | -------------------------------- | -------------------------------- | ----------------------------------- |
| **Native HTML5 DnD**  | No dependency, browser native    | Verbose API, limited styling     | ⚠️ Not recommended                  |
| **dnd-kit**           | Modern, accessible, small bundle | React-centric (has Svelte port?) | ✅ Best if Svelte version available |
| **svelte-dnd-action** | Svelte-native, simple API        | Less active maintenance          | ✅ Good for simple cases            |
| **svelte-drag-drop**  | Svelte 5 runes support           | Newer, smaller community         | ✅ Recommended for Svelte 5         |

### Recommended: **svelte-dnd-action**

**Reason**:

- Native Svelte integration via action directive
- Simple API: `use:dndzone`
- Good performance with virtual scrolling
- Active maintenance

### Installation

```bash
bun add svelte-dnd-action
```

---

## 📊 Database Schema Changes

### Chat Table - Add Position Field

```sql
ALTER TABLE chats ADD COLUMN position INTEGER DEFAULT 0;

-- Index for efficient ordering
CREATE INDEX idx_chats_folder_position ON chats(folder_id, position);
```

### Folder Table - Add Position Field

```sql
ALTER TABLE folders ADD COLUMN position INTEGER DEFAULT 0;

-- Index for efficient ordering
CREATE INDEX idx_folders_user_position ON folders(user_id, position);
```

### Updated Drizzle Schema

```typescript
// packages/db/src/schema/chat.ts
export const chats = pgTable('chats', {
  // ... existing fields
  position: integer('position').notNull().default(0),
  // ... rest of fields
});

// packages/db/src/schema/folder.ts
export const folders = pgTable('folders', {
  // ... existing fields
  position: integer('position').notNull().default(0),
  // ... rest of fields
});
```

---

## 🎨 UI/UX Design

### Drag States

#### 1. Idle State

```
┌─────────────────────────┐
│ 📌 Pinned               │
│ ┌─────────────────────┐ │
│ │ 📎 Chat 1      2h   │ │
│ │ 📎 Chat 2      1h   │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

#### 2. Dragging State

```
┌─────────────────────────┐
│ 📌 Pinned               │
│ ┌─────────────────────┐ │
│ │ 📎 Chat 2      1h   │ │  ← Ghost image (opacity)
│ └─────────────────────┘ │
│ ▼                       │  ← Drop indicator
│ ┌─────────────────────┐ │
│ │ 📎 Chat 1      2h   │ │  ← Shifted down
│ └─────────────────────┘ │
└─────────────────────────┘
```

#### 3. Over Folder (Drop Target)

```
┌─────────────────────────┐
│ 📁 Work     ← DROP HERE │  ← Highlighted border
│ └─────────────────────┘ │
│ 📁 Personal             │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Visual Feedback

1. **Drag Start**: Opacity 0.5, scale 1.05, shadow
2. **Over Drop Zone**: Border highlight, background tint
3. **Drop Preview**: Ghost placeholder showing drop position
4. **Drag End**: Success animation (subtle flash)

### Color Scheme

```css
/* Dragging */
.dragging {
  opacity: 0.5;
  transform: scale(1.02);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  cursor: grabbing;
}

/* Drop zone */
.drop-zone-active {
  border: 2px dashed hsl(var(--primary));
  background: hsl(var(--primary) / 0.1);
  border-radius: 0.5rem;
}

/* Drop indicator */
.drop-indicator {
  height: 3px;
  background: hsl(var(--primary));
  border-radius: 2px;
  margin: 0.25rem 0;
}

/* Success flash */
@keyframes flash-success {
  0% {
    background: hsl(var(--primary) / 0.3);
  }
  100% {
    background: transparent;
  }
}

.drop-success {
  animation: flash-success 0.3s ease-out;
}
```

---

## 🔌 API Changes

### Backend Endpoints

#### 1. Update Chat Position

```typescript
// /rpc/chat/reorder
input: {
  chatId: string;
  newPosition: number;
  folderId?: string | null; // Optional: move to different folder
}
```

#### 2. Update Folder Position

```typescript
// /rpc/folder/reorder
input: {
  folderId: string;
  newPosition: number;
}
```

### Implementation

```typescript
// packages/api/src/routers/chat.ts
export const chatRouter = router({
  // ... existing procedures

  reorder: {
    input: z.object({
      chatId: z.string(),
      newPosition: z.number().min(0),
      folderId: z.string().nullable().optional(),
    }),
    resolve: async ({ input, context }) => {
      const { chatId, newPosition, folderId } = input;

      // Get current chat
      const currentChat = await db.query.chats.findFirst({
        where: eq(chats.id, chatId),
      });

      if (!currentChat) {
        throw new Error('Chat not found');
      }

      // If folder changed, move to new folder
      const targetFolderId = folderId ?? currentChat.folderId;
      const position = newPosition;

      // Shift other chats down
      await db
        .update(chats)
        .set({ position: sql`position + 1` })
        .where(
          and(
            eq(chats.folderId, targetFolderId ?? null),
            gte(chats.position, position),
            ne(chats.id, chatId)
          )
        );

      // Update target chat
      const [updated] = await db
        .update(chats)
        .set({
          folderId: targetFolderId,
          position,
          updatedAt: new Date(),
        })
        .where(eq(chats.id, chatId))
        .returning();

      return updated;
    },
  },
});
```

---

## 🚀 Implementation Phases

### Phase 1: Database & Backend (Week 1)

- [ ] Add `position` field to `chats` table
- [ ] Add `position` field to `folders` table
- [ ] Create migration
- [ ] Add `chat.reorder` API endpoint
- [ ] Add `folder.reorder` API endpoint
- [ ] Update chat.getAll to return sorted by position
- [ ] Update folder.getAll to return sorted by position

### Phase 2: Chat Reorder (Week 1-2)

- [ ] Install `svelte-dnd-action`
- [ ] Add drag handle to ChatListItem
- [ ] Implement `dndzone` in ChatList
- [ ] Handle `consider` event (drag start)
- [ ] Handle `finalize` event (drop complete)
- [ ] Call API to persist new order
- [ ] Optimistic UI updates
- [ ] Error handling & rollback

### Phase 3: Move Chat to Folder (Week 2)

- [ ] Make folder headers drop zones
- [ ] Highlight folder on hover with dragging item
- [ ] Handle drop on folder header
- [ ] Call API with folderId
- [ ] Visual feedback for successful move

### Phase 4: Folder Reorder (Week 2-3)

- [ ] Add drag handle to folder headers
- [ ] Implement folder-level dndzone
- [ ] Handle folder reordering
- [ ] Call API to persist order

### Phase 5: Polish (Week 3)

- [ ] Add drag animations
- [ ] Improve touch support (mobile)
- [ ] Keyboard accessibility (Escape to cancel)
- [ ] Loading states during API calls
- [ ] Undo toast for accidental moves
- [ ] Performance testing with many chats

---

## 📱 Mobile Considerations

### Touch Events

`svelte-dnd-action` supports touch events, but need to ensure:

- Long press to initiate drag (prevent accidental drags)
- Visual feedback on touch devices
- Scroll vs drag conflict resolution

### Mobile Optimizations

```typescript
// Longer delay for touch devices
const touchDragDelay = 200; // ms

// Provide visual feedback before drag starts
onTouchStart={(e) => {
  setTimeout(() => {
    if (isTouch) startDrag();
  }, touchDragDelay);
}}
```

---

## ⚠️ Edge Cases & Considerations

### 1. Empty Folders

- What happens if all chats moved out of a folder?
- **Solution**: Keep empty folder, user can delete manually

### 2. Pinned Chats

- Should pinned chats be draggable?
- **Solution**: Pinned chats maintain own order, separate from normal chats

### 3. Concurrent Edits

- Two users reordering same folder?
- **Solution**: Last write wins, but consider optimistic locking

### 4. Large Lists

- Performance with 100+ chats?
- **Solution**: Virtual scrolling with `svelte-virtual-list`

### 5. Undo/Redo

- User accidentally moves chat?
- **Solution**: Toast notification with "Undo" button

---

## 🎯 Success Criteria

### Functional

- ✅ Can reorder chats within folder
- ✅ Can move chat to different folder
- ✅ Can reorder folders
- ✅ Order persists after refresh
- ✅ Works on desktop and mobile

### Performance

- ✅ Drag feels smooth (60fps)
- ✅ No lag with 100+ items
- ✅ API calls < 500ms

### UX

- ✅ Clear visual feedback during drag
- ✅ Intuitive drop zones
- ✅ Undo option for accidental moves
- ✅ Keyboard accessible (Escape to cancel)

---

## 📚 References

- [svelte-dnd-action Docs](https://github.com/isnorik/svelte-dnd-action)
- [HTML5 Drag & Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [DnD Best Practices](https://www.smashingmagazine.com/2020/02/accessible-drag-drop/

---

## 🔄 Migration Strategy

### Existing Data

For existing chats without position:

```sql
-- Set position based on current order (creation date)
WITH ranked_chats AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY folder_id ORDER BY created_at DESC) as pos
  FROM chats
)
UPDATE chats
SET position = ranked_chats.pos
FROM ranked_chats
WHERE chats.id = ranked_chats.id;
```

### Rollout Plan

1. **Week 1**: Backend + Database migration (non-breaking)
2. **Week 2**: Frontend chat reorder (feature flag)
3. **Week 3**: Folder reorder + polish
4. **Week 4**: Release to production

---

_Last updated: 2025-01-18_
