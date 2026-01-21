# Search E2E Tests

Comprehensive end-to-end tests for the Chat History Search Enhancement feature.

## Overview

This test suite validates the complete search workflow including:

- Basic search functionality
- Provider and model filters
- Date range filters
- Folder and pinned filters
- Combined filters
- Search result highlighting
- Message snippets display
- Accessibility
- Performance

## Test Structure

### Test Suites

1. **Basic Search** - Core search functionality
   - Search input visibility and interaction
   - Enter key trigger
   - Loading states
   - Clear search

2. **Provider Filter** - AI provider filtering
   - Multi-select dropdown for providers (OpenAI, Anthropic, Google, etc.)
   - Single and multiple provider selection
   - Clear providers option
   - Filter update on search reload

3. **Model Filter** - Specific AI model filtering
   - Multi-select dropdown for models (GPT-4, Claude 3, etc.)
   - Models filtered by selected providers
   - Alphabetical sorting
   - Clear models option

4. **Date Range Filter** - Temporal filtering
   - From/To date inputs using HTML5 date picker
   - Single and combined date filtering
   - Clear button for date range
   - Date range application

5. **Folder Filter** - Folder-based filtering
   - Dropdown select for folder selection
   - "All Folders" default option
   - Filter update on folder change

6. **Pinned Only Filter** - Pinned chats filtering
   - Checkbox toggle for pinned-only view
   - State management
   - Filter application

7. **Clear All Filters** - Bulk filter reset
   - Visibility when filters are active
   - Single-click reset of all filters
   - Hidden when no filters active

8. **Combined Filters** - Multi-filter scenarios
   - Search + provider filter
   - Search + date range
   - Multiple simultaneous filters

9. **Search Results Display** - Result presentation
   - Chat list visibility
   - Message snippets with role labels (You/AI)
   - Search term highlighting with `<mark>` elements
   - Result updates on filter changes

10. **Accessibility** - WCAG compliance
    - Proper labels for screen readers
    - Keyboard navigation support
    - Semantic HTML structure

11. **Performance** - Speed and efficiency
    - Search completion within acceptable time
    - No console errors during operations
    - Smooth UI updates

## Running the Tests

### Prerequisites

1. **Dependencies**: Ensure all dependencies are installed

   ```bash
   bun install
   ```

2. **Test User Setup**: Tests require an authenticated user with:
   - Existing chats (for search results)
   - Configured AI models (for provider/model filters)
   - Various folders (for folder filter tests)

3. **Database**: Ensure PostgreSQL is running
   ```bash
   bun run db:start
   ```

### Run All E2E Tests

```bash
bun run test:e2e
```

### Run Search Tests Only

```bash
bun run test:e2e tests/e2e/search.spec.ts
```

### Run with UI (Interactive Mode)

```bash
bun run test:e2e:ui
```

### Run in Debug Mode

```bash
bun run test:e2e:debug
```

### Run on Specific Browser

```bash
# Chromium only
bun run test:e2e --project=chromium

# Firefox only
bun run test:e2e --project=firefox

# WebKit (Safari) only
bun run test:e2e --project=webkit
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:5173`
- **Test Directory**: `./tests/e2e`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Timeout**: 120 seconds for server startup
- **Retries**: 2 on CI, 0 locally
- **Reporters**: HTML (playwright-report/) + List

### Server Auto-Start

The configuration automatically starts the dev server before running tests:

```typescript
webServer: {
  command: 'bun run dev:web',
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
}
```

## Test Data Requirements

### Minimum Requirements

To run all tests successfully, you need:

1. **Chats**: At least 3-5 existing conversations
2. **Models**: At least 2-3 configured AI models from different providers
3. **Providers**: Models from at least 2 different providers (e.g., OpenAI, Anthropic)
4. **Folders**: At least 1 custom folder (in addition to "No Folder")
5. **Pinned Chats**: At least 1-2 pinned conversations

### Example Test Data Setup

```bash
# 1. Create test user (if not exists)
# 2. Add AI models via Settings > Models Manager
#    - OpenAI: gpt-4
#    - Anthropic: claude-3-opus
#    - Google: gemini-pro
# 3. Create test conversations with various content
# 4. Create folders: "Work", "Personal", "Research"
# 5. Pin 1-2 important conversations
```

## Test Locators

Key UI elements used in tests:

### Search

- Input: `input[placeholder*="Search chats"]`
- Button: Search triggered via Enter key

### Provider Filter

- Trigger: `button` with text "All Providers" or "N provider(s) selected"
- Options: `[role="menuitem"]` with provider labels
- Clear: `[role="menuitem"]` with text "Clear providers"

### Model Filter

- Trigger: `button` with text "All Models" or "N model(s) selected"
- Options: `[role="menuitem"]` with model names
- Clear: `[role="menuitem"]` with text "Clear models"

### Date Range

- From: `input[type="date"]` (first)
- To: `input[type="date"]` (second)
- Clear: `button[title*="Clear date"]`

### Folder Filter

- Select: `select` element with "All Folders" option
- Options: `<option>` elements with folder names

### Pinned Filter

- Checkbox: `input[type="checkbox"]` (first)
- Label: `text=Pinned only`

### Clear All Filters

- Button: `button` with text "Clear All Filters"

### Search Results

- Chat List: `aside`, `[class*="sidebar"]`, or `[class*="chatlist"]`
- Message Snippets: `text=/You:|AI:/`
- Highlighted Terms: `mark` elements

## Skipping Tests

Tests that lack required data will be automatically skipped with appropriate messages:

```typescript
test.skip(true, 'No models configured, skipping provider filter test');
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run db:start
      - run: bun run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

## Troubleshooting

### Tests Fail with "No models configured"

**Solution**: Add AI models via the UI before running tests

### Tests Redirect to Login Page

**Solution**: Set up test authentication or configure test environment

### "Search results not loading" Timeout

**Solution**: Check database connection and verify chats exist

### Console Errors During Tests

**Solution**:

1. Run `bun run check:types` to verify no type errors
2. Run `bun run check:hydration` to check SSR issues
3. Review browser console logs in test report

### Tests Pass Locally but Fail on CI

**Solution**:

1. Ensure test data is properly seeded on CI
2. Check CI environment variables
3. Review CI artifacts (screenshots, videos, traces)

### View Test Reports

After running tests, open the HTML report:

```bash
# If tests ran via bun run test:e2e
open playwright-report/index.html

# Or on Linux
xdg-open playwright-report/index.html
```

## Test Maintenance

### Adding New Tests

Follow existing patterns:

1. Add test to appropriate `test.describe` block
2. Use `test.beforeEach` for setup
3. Use helper functions (`navigateToChatPage`, `waitForSearchResults`)
4. Handle missing data gracefully with `test.skip()`
5. Clean up after tests (clear filters, reset state)

### Updating Locators

If UI changes, update locators in:

1. Test code (`tests/e2e/search.spec.ts`)
2. This documentation (SEARCH_E2E_TESTS.md)

### Performance Thresholds

Current thresholds (can be adjusted):

- **Search completion**: 5 seconds
- **Filter update**: Immediate (500ms wait for UI)

## Coverage

Current test coverage:

- ✅ Basic search workflow
- ✅ All individual filters (provider, model, date, folder, pinned)
- ✅ Filter combinations
- ✅ Clear filters functionality
- ✅ Search result display
- ✅ Accessibility (keyboard, labels)
- ⚠️ Message snippets (requires test data)
- ⚠️ Search highlighting (requires actual matches)
- ✅ Performance and error handling

## Future Improvements

1. **Visual Regression Testing**: Add screenshots to detect UI changes
2. **API Mocking**: Mock API responses for faster, more reliable tests
3. **Test Data Fixtures**: Create reusable test data setup scripts
4. **Authentication Helpers**: Add test authentication utilities
5. **Network Interception**: Mock network calls for edge cases
6. **Mobile-Specific Tests**: Add mobile viewport-specific tests

## Related Documentation

- [Playwright Docs](https://playwright.dev/)
- [Project CLAUDE.md](../../CLAUDE.md)
- [Search Feature Spec](../../.auto-claude/specs/007-chat-history-search-enhancement/spec.md)
- [Unit Tests](../../packages/api/src/routers/chat.test.ts)

## Support

For issues or questions about E2E tests:

1. Check Playwright troubleshooting guide
2. Review test artifacts (screenshots, videos, traces)
3. Run tests in debug mode: `bun run test:e2e:debug`
4. Consult team testing guidelines

---

**Last Updated**: 2026-01-20
**Test Suite Version**: 1.0.0
**Playwright Version**: ^1.50.1
