# Branch Protection Rules for SambungChat

This document describes the required branch protection rules that should be configured in GitHub repository settings.

## Required Branch Protection Rules

### For `main` and `develop` branches:

1. **Require status checks to pass before merging**
   - ✅ Type Check (required)
   - ✅ Lint (required)
   - ✅ Build (required)
   - ✅ Test (required)

2. **Require branches to be up to date before merging**
   - ✅ Require the branch to be up-to-date before merging

3. **Additional protections (recommended)**
   - Require pull request reviews (1 approval)
   - Dismiss stale PR approvals when new commits are pushed
   - Require review from CODEOWNERS
   - Restrict who can push to the branch
   - Do not allow bypassing the above settings

## How to Configure in GitHub

1. Go to repository **Settings**
2. Navigate to **Branches**
3. Click **Add branch protection rule**
4. Enter branch name pattern: `main` or `develop`
5. Configure the following:

### Branch Protection Settings

```
Branch name pattern: main (and repeat for develop)

☑ Require a pull request before merging
  ☑ Require approvals (1)
  ☑ Dismiss stale reviews
  ☑ Require review from Code Owners

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  Required checks:
    ☑ Type Check
    ☑ Lint
    ☑ Build
    ☑ Test

☑ Do not allow bypassing the above settings

☑ Restrict who can push to matching branches
  Add: (maintainers, admins)

☑ Require conversation resolution before merging
```

## CI Workflow Dependency Chain

The CI jobs have the following dependencies:

```
type-check ───┐
              ├──> build ───> test ───> ✅ (All pass)
lint    ─────┘
```

- **type-check** and **lint** run in parallel
- **build** runs only after both type-check and lint pass
- **test** runs only after build passes

All four jobs must pass before a PR can be merged.

## Status Check Names

The following status checks must be marked as required in GitHub branch protection:

| Job Name   | Status Check Name              |
| ---------- | ------------------------------ |
| Type Check | `CI (type-check) / Type Check` |
| Lint       | `CI (lint) / Lint`             |
| Build      | `CI (build) / Build`           |
| Test       | `CI (test) / Test`             |

## Verification

To verify branch protection is working:

1. Create a pull request to `develop`
2. Make a change that breaks type checking (e.g., add type error)
3. Commit and push
4. Verify that:
   - ✅ All CI jobs run automatically
   - ✅ Type Check job fails
   - ✅ Merge button is disabled
   - ✅ "Required status checks not passing" message appears

## CODEOWNERS File

Create `.github/CODEOWNERS` to require specific approvals:

```
# Default: all changes require approval from maintainers
* @sambunghub/maintainers

# Documentation can be approved by docs team
/docs/ @sambunghub/docs-team

# Package-specific approval
/packages/ui/ @sambunghub/ui-team
/packages/api/ @sambunghub/api-team
```

## Troubleshooting

### Status Checks Not Appearing

If status checks don't appear in branch protection:

1. Verify CI workflow has run at least once
2. Check workflow name matches (should be `CI`)
3. Verify job names match exactly
4. Check that workflows are not marked as `continue-on-error`

### Merge Button Still Enabled

If merge button is enabled despite failing checks:

1. Verify "Do not allow bypassing" is checked
2. Check admin permissions (may bypass by default)
3. Verify all required checks are listed

---

**Note:** These branch protection rules ensure code quality and prevent breaking changes from being merged to main branches.
