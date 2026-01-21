# Chat Search Filter Combinations - Testing Guide

## Backend API Tests

All backend filter combination tests are in `packages/api/src/routers/chat.test.ts`.

### Run Tests

```bash
bun test packages/api/src/routers/chat.test.ts
```

### Test Coverage

The test suite includes comprehensive filter combination tests:

#### Two-Filter Combinations

- ✅ Query + Provider
- ✅ Query + Model
- ✅ Query + Date Range
- ✅ Provider + Model
- ✅ Provider + Date Range
- ✅ Model + Date Range

#### Three-Filter Combinations

- ✅ Query + Provider + Model
- ✅ Query + Provider + Date Range
- ✅ Query + Model + Date Range
- ✅ Provider + Model + Date Range

#### Four-Filter Combination

- ✅ Query + Provider + Model + Date Range

#### Edge Cases

- ✅ Empty provider array
- ✅ Empty model array
- ✅ Special characters in query
- ✅ Date range with no results

### Test Results

``✅ 25 tests passing

- 10 performance tests
- 15 filter combination tests

````

---

## Frontend Manual Testing

Since Svelte 5 component testing requires complex infrastructure, manual verification is recommended for the frontend filter UI.

### Test Setup

1. Start the development server:
   ```bash
   bun run dev
````

2. Open the application at `http://localhost:5174`

3. Ensure you have:
   - Multiple AI models configured (at least 2-3 providers like OpenAI, Anthropic, Google)
   - Multiple chat conversations (at least 10+ chats with various content)
   - Chats spanning different date ranges (some recent, some older)

### Test Scenarios

#### 1. Single Filter Tests

**Provider Filter**

- [ ] Select a single provider (e.g., "OpenAI")
- [ ] Verify only chats from that provider are shown
- [ ] Select multiple providers
- [ ] Verify chats from any of the selected providers are shown

**Model Filter**

- [ ] Select a specific model (e.g., "GPT-4")
- [ ] Verify only chats using that model are shown
- [ ] Select multiple models
- [ ] Verify chats using any of the selected models are shown

**Date Range Filter**

- [ ] Set a "from" date
- [ ] Verify only chats created on/after that date are shown
- [ ] Set a "to" date
- [ ] Verify only chats created on/before that date are shown
- [ ] Set both dates
- [ ] Verify only chats within the date range are shown
- [ ] Clear dates using the X button
- [ ] Verify all chats are shown again

**Query Filter**

- [ ] Enter a search query
- [ ] Verify matching text is highlighted in results
- [ ] Verify matching message snippets are shown below chat titles
- [ ] Clear the query
- [ ] Verify all chats are shown again

#### 2. Filter Combination Tests

**Query + Provider**

- [ ] Enter a search query
- [ ] Select one or more providers
- [ ] Verify results match both the query AND the selected providers

**Query + Model**

- [ ] Enter a search query
- [ ] Select one or more models
- [ ] Verify results match both the query AND the selected models

**Query + Date Range**

- [ ] Enter a search query
- [ ] Set a date range
- [ ] Verify results match both the query AND are within the date range

**Provider + Model**

- [ ] Select one or more providers
- [ ] Select one or more models
- [ ] Verify results match both the provider AND model filters
- [ ] Note: Models are filtered by selected providers

**Provider + Date Range**

- [ ] Select one or more providers
- [ ] Set a date range
- [ ] Verify results match both the provider AND date filters

**Model + Date Range**

- [ ] Select one or more models
- [ ] Set a date range
- [ ] Verify results match both the model AND date filters

**Query + Provider + Model**

- [ ] Enter a search query
- [ ] Select one or more providers
- [ ] Select one or more models
- [ ] Verify results match all three filters

**Query + Provider + Date Range**

- [ ] Enter a search query
- [ ] Select one or more providers
- [ ] Set a date range
- [ ] Verify results match all three filters

**Query + Model + Date Range**

- [ ] Enter a search query
- [ ] Select one or more models
- [ ] Set a date range
- [ ] Verify results match all three filters

**Provider + Model + Date Range**

- [ ] Select one or more providers
- [ ] Select one or more models
- [ ] Set a date range
- [ ] Verify results match all three filters

**All Filters Combined**

- [ ] Enter a search query
- [ ] Select one or more providers
- [ ] Select one or more models
- [ ] Set a date range
- [ ] Verify results match all four filters
- [ ] Verify matching text is highlighted
- [ ] Verify message snippets are shown

#### 3. Edge Case Tests

**Empty Results**

- [ ] Set filters that return no results (e.g., future date range)
- [ ] Verify empty state is shown
- [ ] Verify "Clear All Filters" button is visible

**Clear All Filters**

- [ ] Apply multiple filters
- [ ] Click "Clear All Filters" button
- [ ] Verify all filters are reset
- [ ] Verify all chats are shown
- [ ] Verify "Clear All Filters" button is hidden

**Model Filtering by Provider**

- [ ] Select a provider
- [ ] Verify model dropdown only shows models from that provider
- [ ] Select another provider
- [ ] Verify model options update to show models from the new selection
- [ ] Clear provider selection
- [ ] Verify all models are shown

**Search with Special Characters**

- [ ] Search for text with special characters (colons, quotes, etc.)
- [ ] Verify search works correctly

### Performance Checks

- [ ] Search should feel instant (< 100ms for most queries)
- [ ] UI should remain responsive when applying filters
- [ ] No console errors or warnings when using filters

### Accessibility Checks

- [ ] All filter controls are keyboard accessible
- [ ] Filter dropdowns can be opened/closed with keyboard
- [ ] Date inputs work with keyboard navigation
- [ ] Screen reader announces filter states

---

## Expected Results

### ✅ Success Criteria

1. **All backend tests pass** (25/25 tests passing)
2. **Frontend filters work correctly** in all combinations
3. **Search highlighting** appears on matching text
4. **Message snippets** show relevant context
5. **Performance** remains fast with all filters applied
6. **No errors** in browser console
7. **Clear All Filters** button works correctly

### ❌ Known Issues to Watch For

- Filters not clearing properly
- Incorrect results when combining filters
- Performance degradation with complex queries
- Hydration mismatches (SSR issues)
- Filter options not updating based on other filters

---

## Test Data Suggestions

For comprehensive testing, create test chats with:

1. **Multiple providers**: OpenAI, Anthropic, Google, Groq
2. **Multiple models per provider**: 2-3 models each
3. **Varied content**:
   - Technical terms ("API", "database", "authentication")
   - Common words ("the", "and", "is")
   - Unique phrases ("conversation about", "asking about")
4. **Different dates**:
   - Recent chats (last 7 days)
   - Older chats (last 30 days)
   - Much older chats (3+ months ago)
5. **Different states**:
   - Pinned chats
   - Chats in folders
   - Chats with no folder

---

## Troubleshooting

### Tests Not Running

```bash
# Ensure database is running
bun run db:start

# Check database connection
echo $DATABASE_URL
```

### No Test Data

The tests automatically create 120 chats with 1,200 messages. If dataset creation fails:

```bash
# Reset database
bun run db:push --force
```

### Filters Not Working in UI

1. Check browser console for errors
2. Verify API is responding (Network tab in DevTools)
3. Check that models are loaded (filter dropdowns should show options)
4. Try clearing browser cache and reloading

---

## Related Files

- `packages/api/src/routers/chat.ts` - Backend API implementation
- `apps/web/src/lib/components/secondary-sidebar/ChatList.svelte` - Frontend filter UI
- `packages/api/src/routers/chat.test.ts` - Backend test suite
- `packages/db/src/schema/chat.ts` - Database schema
