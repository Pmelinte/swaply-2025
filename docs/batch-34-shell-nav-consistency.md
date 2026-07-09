# Batch 34: Shell navigation consistency

## Purpose

Batch 34 fixes a small public-shell consistency issue discovered while preparing the Train A drawer/nav/bottom-nav pass.

The branch bar should look global and stable. It should not make the main navigation look unfinished with visible `Beta` badges.

## Scope

- One small public shell UI consistency fix.
- One mobile Playwright smoke assertion.
- This documentation file.
- No route changes.
- No Supabase changes.
- No RLS changes.
- No auth changes.
- No API changes.
- No business-logic changes.
- No paid AI or translation provider activation.

## UI fix

`src/components/layout/BranchBar.tsx` now keeps the branch label visible on mobile for every tab and removes the visible `Beta` badges from the main branch navigation.

The branch bar now presents the four domains simply and consistently:

- Objects
- Properties
- Services
- Events

This applies on both desktop and mobile.

## Product decision

The main navigation should not advertise unfinished status.

If a page still needs a maturity note, that note should be handled inside the page itself with a discreet contextual message such as:

`This section is being expanded.`

That page-level copy should be reviewed in Batch 35 together with the public beta/empty-state pages.

## Test coverage

`tests/smoke.spec.ts` now includes a mobile public shell contract for `/en` at `390 × 844`.

The mobile contract reuses the same shell assertions from Batch 33:

- visible Swaply top-logo/home link;
- visible drawer trigger;
- visible logged-out Login CTA;
- visible branch navigation;
- visible bottom navigation;
- drawer opens;
- key drawer Info links are visible.

This protects mobile branch labels and prevents branch tabs from degrading into icon-only navigation.

## Why this is safe

The patch does not add new routes, change data, alter authentication, or modify swap/business logic.

It only removes visible beta badges from the global branch bar, keeps existing branch labels visible, and adds a regression test for the compact mobile shell.

## Validation target

Expected CI:

- Unit Tests
- Lint & Type Check
- Build
- Public Visual Audit / Playwright

After merge/deploy:

- Vercel production deployment should become `READY`.
- `/en` should return HTTP `200` on production.
- Production runtime logs should show no `error`, `warning`, or `fatal` entries in the checked window.

## Recommended Batch 35

Batch 35 should continue Train A by auditing the public expansion/empty-state pages:

- `/en/properties`
- `/en/services`
- `/en/events`
- `/en/messages`
- `/en/chat`
- `/en/exchange`

The goal should be to confirm that every public expansion/empty-state page has a clear public purpose, CTA, safe logged-out state, and no broken shell behavior.

## Merge rule

Do not merge the Batch 34 PR until Petru gives the explicit command:

`Merge #...`
