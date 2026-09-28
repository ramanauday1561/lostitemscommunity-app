# Playwright E2E Tests

End-to-end tests for the Lost Items Community app using Playwright.

## Setup

### Install Playwright

```bash
npm install -D @playwright/test
```

### Test Users

The tests use the following test accounts (must exist in your Supabase instance):
- **testuser@example.com** / `Test@12345` - Regular user account
- **testuser2@example.com** / `Test@12345` - Secondary user for multi-account tests
- **superadmin@example.com** / `Admin@12345` - Admin account for moderation tests

To create these accounts, sign up through the app's signup flow or use Supabase Auth admin panel.

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test playwright/phase6-forum.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### Run single test
```bash
npx playwright test -g "Forum: Load threads"
```

## Test Files

### phase6-forum.spec.ts
Tests for Phase 6 Forum feature:
- **Load threads**: Verify threads load from Supabase
- **Filter by tag**: Test Sighting/Question/Reunited filtering
- **Create thread**: Testuser creates new thread with title/body/tag
- **Open thread**: Navigate to thread detail and see replies
- **Reply to thread**: Add reply to existing thread
- **Mark helpful**: Vote thread as helpful (thumb up)
- **Multi-account interaction**: Two users create/reply in same thread
- **Admin moderation**: Admin can suspend/delete threads
- **Thread count**: Verify count increases after creation
- **Tag persistence**: Filter remains after opening thread

## Multi-Instance Testing

The `phase6-forum.spec.ts` file includes a multi-instance test that:
1. Opens two parallel browser contexts
2. User 1 (testuser@example.com) creates a thread
3. User 2 (testuser2@example.com) logs in and sees the thread
4. User 2 replies to the thread
5. User 1 refreshes and sees the reply

This verifies:
- ✅ Supabase sync between instances
- ✅ Realtime or eventual consistency of data
- ✅ Both users see the same thread/replies
- ✅ No race conditions or stale data

## Debugging Tests

### View test report
```bash
npx playwright show-report
```

### Screenshots and videos
Failed tests automatically capture:
- Screenshots (`test-results/`)
- Videos (`test-results/`)
- Traces (`test-results/`)

### Inspect element
Use `page.pause()` in test to stop and inspect:
```typescript
await page.pause();
```

## Environment

Tests run against:
- **URL**: `http://localhost:3000` (configurable in `playwright.config.ts`)
- **App**: Running dev server (auto-started by Playwright)
- **Database**: Supabase instance specified in app's .env

## Notes

- Tests assume the app is running or can auto-start via `npm run dev`
- Test data is created in Supabase and persists between runs
- Adjust selectors if app UI changes (look for placeholders, aria-labels, or text)
- Multi-instance test can validate:
  - Forum thread creation and visibility across users
  - Reply sync between browser contexts
  - Helpful vote updates
  - Tag filtering consistency

## CI/CD Integration

For GitHub Actions or similar CI:

```yaml
- name: Install Playwright
  run: npx playwright install

- name: Run tests
  run: npm run test:e2e
```

Tests will:
- Run serially (1 worker) in CI
- Retry failed tests 2 times
- Capture screenshots/videos on failure
- Generate HTML report
