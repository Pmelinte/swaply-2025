# Batch 34: Shell navigation consistency

## Purpose

Batch 34 fixes a small public-shell consistency issue discovered while preparing the Train A drawer/nav/bottom-nav pass.

On mobile widths, inactive beta branch tabs could show only the icon plus the `Beta` badge. That made the tab visually less clear than Objects and less clear than the desktop branch bar.

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

`src/components/layout/BranchBar.tsx` now keeps the branch label visible on mobile for every tab:

- Objects
- Properties
- Services
- Events

For beta branches, the mobile label is rendered compactly as:

- `Properties · Beta`
- `Services · Beta`
- `Events · Beta`

On desktop, the existing label plus separate `Beta` badge behavior is preserved.

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

This specifically protects mobile branch labels for the beta branches.

## Why this is safe

The patch does not add new routes, change data, alter authentication, or modify swap/business logic.

It only makes existing branch labels visible in the compact mobile shell and adds a regression test for that behavior.

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

Batch 35 should continue Train A by auditing the public beta pages and empty-state pages:

- `/en/properties`
- `/en/services`
- `/en/events`
- `/en/messages`
- `/en/chat`
- `/en/exchange`

The goal should be to confirm that every beta/empty page has a clear public purpose, CTA, safe logged-out state, and no broken shell behavior.

## Merge rule

Do not merge the Batch 34 PR until Petru gives the explicit command:

`Merge #...`
