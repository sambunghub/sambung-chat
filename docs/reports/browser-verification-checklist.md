# Browser Verification Checklist - Prompt Library UI

## Setup Instructions

1. **Ensure Dev Server is Running:**

   ```bash
   cd ../001-add-skeleton-loading-states-for-chat-interface
   bun run dev
   ```

2. **Open Browser to:**
   - Prompts Library: <http://localhost:5174/app/prompts>
   - Chat Page: <http://localhost:5174>
   - Settings: <http://localhost:5174/app/settings>

---

## Part 1: Prompts Library Page (<http://localhost:5174/app/prompts>)

### 1.1 Page Rendering

- [ ] Page loads without errors
- [ ] Header shows "Prompts Library" breadcrumb
- [ ] Secondary sidebar trigger button is visible
- [ ] No console errors (check browser DevTools Console)

### 1.2 Empty State

- [ ] When no prompts exist, empty state message is displayed
- [ ] "No prompts yet" message is shown
- [ ] "Create your first prompt" call-to-action button is visible
- [ ] Create button opens the create dialog

### 1.3 Loading State

- [ ] Loading skeleton is shown while fetching prompts (3 skeleton cards)
- [ ] Skeleton cards have proper structure and animations
- [ ] Loading state transitions to actual data

### 1.4 Create Prompt

- [ ] Click "Create Prompt" button
- [ ] Create dialog opens with form fields:
  - [ ] Name input (required)
  - [ ] Content textarea (required)
  - [ ] Category dropdown (General, Coding, Writing, Analysis, Creative, Business, Custom)
  - [ ] Variables input with + button
  - [ ] isPublic checkbox
- [ ] Submit button is disabled until required fields are filled
- [ ] Enter a test prompt:
  - Name: "Test Prompt"
  - Content: "This is a test prompt for {variable}"
  - Category: "General"
  - Variables: "variable" (press Enter or click +)
- [ ] Click "Create Prompt"
- [ ] Success toast appears: "Prompt created successfully"
- [ ] Dialog closes
- [ ] New prompt appears in the list
- [ ] No console errors

### 1.5 Prompt Cards Display

- [ ] Prompt card shows:
  - [ ] Category badge with correct color
  - [ ] isPublic badge (if applicable)
  - [ ] Prompt name (truncated if too long)
  - [ ] Content preview (150 chars max with "..." if longer)
  - [ ] Variables preview (first 3, with count if more)
  - [ ] "Last updated" date
- [ ] Three-dot menu button is visible on each card
- [ ] Card hover effects work properly
- [ ] Responsive layout (1/2/3 columns based on screen width)

### 1.6 Search Functionality

- [ ] Search input is visible with search icon
- [ ] Type in search box:
  - [ ] Results filter in real-time
  - [ ] Search matches prompt name and content
  - [ ] Case-insensitive search works
  - [ ] No results state shows when search yields empty results
- [ ] Clear search and verify all prompts reappear

### 1.7 Category Filter

- [ ] Category dropdown is visible
- [ ] Filter by category works correctly
- [ ] "All Categories" shows all prompts
- [ ] Specific category shows only prompts in that category
- [ ] Category and search filters work together

### 1.8 Edit Prompt

- [ ] Click three-dot menu on a prompt card
- [ ] Select "Edit" option
- [ ] Edit dialog opens with pre-filled form data
- [ ] All fields show current prompt data
- [ ] Update prompt name or content
- [ ] Click "Update Prompt"
- [ ] Success toast appears: "Prompt updated successfully"
- [ ] Dialog closes
- [ ] Prompt card shows updated data
- [ ] No console errors

### 1.9 View Prompt

- [ ] Click three-dot menu on a prompt card
- [ ] Select "View" option
- [ ] View dialog opens with full prompt details:
  - [ ] Full prompt content (not truncated)
  - [ ] All variables listed
  - [ ] Category and isPublic status
  - [ ] Created and updated dates
- [ ] Close dialog works (X button or click outside)

### 1.10 Copy to Clipboard

- [ ] Click three-dot menu on a prompt card
- [ ] Select "Copy" option
- [ ] Success toast appears: "Prompt content copied to clipboard"
- [ ] Paste into text editor to verify content was copied
- [ ] No console errors

### 1.11 Delete Prompt

- [ ] Click three-dot menu on a prompt card
- [ ] Select "Delete" option
- [ ] Confirmation dialog appears
- [ ] Click "Cancel" - nothing happens
- [ ] Click "Delete" again and confirm
- [ ] Success toast appears: "Prompt deleted successfully"
- [ ] Prompt is removed from the list
- [ ] No console errors

---

## Part 2: Prompt Selector in Chat (<http://localhost:5174>)

### 2.1 Component Rendering

- [ ] Chat page loads without errors
- [ ] "Insert Prompt" button is visible in chat header (before Model Selector)
- [ ] Button shows notebook emoji 📓
- [ ] Button is styled consistently with other controls

### 2.2 Prompt Selection

- [ ] Click "Insert Prompt" button
- [ ] Dropdown menu opens showing available prompts
- [ ] Each prompt displays:
  - [ ] Category icon/emoji
  - [ ] Category badge with correct color
  - [ ] Prompt name
  - [ ] Content preview (60 chars max)
  - [ ] isPublic badge if applicable
- [ ] Dropdown has proper width (320px)
- [ ] Scrollable if many prompts

### 2.3 Insert Prompt

- [ ] Select a prompt from dropdown
- [ ] Prompt content is inserted into chat input field
- [ ] Variables are converted to placeholders: [variable_name]
- [ ] Cursor is positioned at end of inserted content
- [ ] Chat input auto-resizes if needed
- [ ] Dropdown closes after selection
- [ ] No console errors

### 2.4 Multiple Insertions

- [ ] Insert another prompt
- [ ] Content is appended with proper separator
- [ ] Both prompt contents are visible in input
- [ ] No duplicate or lost text

### 2.5 Empty/Error States

- [ ] If no prompts exist, dropdown shows "No prompts available"
- [ ] If loading fails, error message is shown
- [ ] Loading state shows "Loading prompts..."

---

## Part 3: Settings Navigation (<http://localhost:5174/app/settings>)

### 3.1 Navigation Item

- [ ] Click settings icon in sidebar
- [ ] Secondary sidebar opens
- [ ] "Prompts Library" navigation item is visible
- [ ] Sparkles icon (✨) is shown
- [ ] Click "Prompts Library"
- [ ] Navigates to <http://localhost:5174/app/prompts>

---

## Part 4: Edge Cases & Error Handling

### 4.1 Network Errors

- [ ] Stop backend server (bun run dev:server)
- [ ] Try to load prompts page
- [ ] Error toast appears: "Failed to load prompts"
- [ ] Page doesn't crash
- [ ] Restart backend and refresh page
- [ ] Prompts load successfully

### 4.2 Form Validation

- [ ] Try to create prompt without name
- [ ] Submit button remains disabled
- [ ] Try to create prompt without content
- [ ] Submit button remains disabled
- [ ] Try to create prompt without category
- [ ] Submit button remains disabled

### 4.3 Variable Handling

- [ ] Create prompt with multiple variables (comma-separated)
- [ ] Each variable appears as {variable_name} badge
- [ ] Click X on variable badge to remove
- [ ] Variable is removed from list
- [ ] Enter key adds variable
- [ ] Duplicate variables are prevented

### 4.4 Long Content

- [ ] Create prompt with very long name
- [ ] Name is truncated with "..." in card
- [ ] Full name visible in edit/view dialogs
- [ ] Create prompt with very long content
- [ ] Content is truncated in card preview
- [ ] Full content visible in view dialog

---

## Part 5: Console & Network Checks

### 5.1 Browser Console (DevTools)

- [ ] Open browser DevTools (F12)
- [ ] Console tab shows NO errors
- [ ] No hydration_mismatch warnings
- [ ] No node_invalid_placement_ssr errors
- [ ] No 404 errors for API endpoints
- [ ] No CSP violations

### 5.2 Network Requests (DevTools Network Tab)

- [ ] /rpc/prompt/getAll request succeeds (200)
- [ ] /rpc/prompt/create request succeeds (200) when creating
- [ ] /rpc/prompt/update request succeeds (200) when updating
- [ ] /rpc/prompt/delete request succeeds (200) when deleting
- [ ] All requests include authentication cookie
- [ ] CSRF token is present on mutations

---

## Part 6: Responsive Design

### 6.1 Mobile (375px width)

- [ ] Prompts Library page is usable
- [ ] Cards display in single column
- [ ] Search/filter stack vertically
- [ ] Create/edit dialogs fit on screen
- [ ] Prompt selector dropdown fits within viewport

### 6.2 Tablet (768px width)

- [ ] Prompts Library shows 2 columns
- [ ] All controls are accessible
- [ ] Touch targets are adequate size

### 6.3 Desktop (1280px+ width)

- [ ] Prompts Library shows 3 columns
- [ ] Optimal use of screen space
- [ ] Hover effects work properly

---

## Completion Criteria

✅ **ALL checks must pass** before marking subtask-4-4 as complete.

**Critical Failures (Must Fix):**

- Any console error or warning related to prompt library
- Hydration mismatch errors
- Broken UI components or styling
- Non-functional features (create, edit, delete, search, insert)
- API errors (404, 500, CORS issues)

**Known Acceptable Issues:**

- Pre-existing accessibility warnings (unrelated to prompt library)
- Minor visual styling inconsistencies with shadcn-svelte components

---

## Quick Smoke Test (5 minutes)

If you're short on time, run this quick test:

1. Open <http://localhost:5174/app/prompts>
2. Create a test prompt
3. Verify it appears in the list
4. Edit the prompt
5. Copy the prompt to clipboard
6. Go to <http://localhost:5174>
7. Click "Insert Prompt" button
8. Insert your test prompt into chat
9. Delete the test prompt
10. Check console for errors

If all 10 steps work, the prompt library UI is functioning correctly! ✅
