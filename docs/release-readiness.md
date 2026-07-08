# Swaply release readiness guide

This guide keeps stacked agentic PRs reviewable and safe.

## Required CI jobs

Every PR in the stack must pass:

1. Unit Tests
2. Lint & Type Check
3. Build
4. Public Visual Audit

Do not mark a PR ready for review while any required job is pending, failed, skipped unexpectedly or missing.

## Required artifacts

Every green run should upload:

- `vitest-results`
- `swaply-public-visual-audit-screenshots`
- `swaply-public-visual-audit-report`
- `swaply-public-visual-audit-test-results`

The screenshot artifact is part of the review surface, not optional decoration.

## Current stacked order

1. `agentic/batch-1-global-drawer-public-blog`
2. `agentic/batch-2-drawer-navigation-audit`
3. `agentic/batch-3-public-pages-proof`
4. `agentic/batch-4-public-page-ui-integration`
5. `agentic/batch-5-ai-gateway-skeleton`
6. `agentic/batch-6-stories-foundation`
7. `agentic/batch-7-release-readiness`

Merge or retarget in order. Do not merge a higher PR if its base PR is still unmerged and unstable.

## Visual review notes

When reviewing screenshot artifacts, check at least:

- desktop Home
- mobile Home
- desktop Objects
- mobile Objects
- Matching drawer
- Messages drawer
- Exchange drawer
- Blog drawer

Look for:

- blank pages
- login walls on public routes
- duplicated bottom navigation links inside the drawer
- mobile overlap with bottom navigation
- missing `Guest experience` proof sections on Home/domain pages
- obvious runtime error text

## Locale smoke coverage

Release smoke coverage must include:

- `en`
- `ro`
- `fr`
- `fil`

The `fil` locale intentionally proves that three-letter locale prefixes are not broken.

## Migration rule

A PR may document a migration plan without applying it. If it adds migrations, it must say whether they are required before deployment, safe to apply repeatedly, reversible, and whether RLS changes can affect public pages.

## Final ready-for-review gate

Before marking a stacked PR ready:

1. Confirm the PR base is correct.
2. Confirm the head SHA is the one that passed CI.
3. Confirm all required jobs passed.
4. Confirm all required artifacts exist.
5. Confirm Playwright screenshots are not only generated but meaningful.
6. Confirm the PR body explains what was not implemented.
7. Confirm no provider keys, migrations or auth/RLS changes were added accidentally.
