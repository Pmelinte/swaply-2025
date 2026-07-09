# Batch 33: Public shell smoke assertions

## Purpose

Batch 33 turns the Batch 32 public live shell observations into executable Playwright regression checks.

The goal is to ensure every logged-out canonical public route keeps the same global shell contract:

- visible Swaply top-logo/home link;
- visible drawer trigger;
- visible logged-out Login CTA;
- visible branch navigation;
- visible bottom navigation;
- drawer opens and exposes the key Info links.

## Scope

- Test-only application coverage plus this documentation file.
- No UI changes.
- No route changes.
- No Supabase changes.
- No RLS changes.
- No auth changes.
- No API changes.
- No business-logic changes.
- No paid AI or translation provider activation.

## Public routes covered

The public shell contract is applied to the same canonical route inventory already protected by the public route contract:

- `/en`
- `/en/objects`
- `/en/explore`
- `/en/matching`
- `/en/messages`
- `/en/exchange`
- `/en/chat`
- `/en/properties`
- `/en/services`
- `/en/events`
- `/en/blog`
- `/en/about`
- `/en/contact`

## New shell contract

Each public route must:

1. Return HTTP `>= 200` and `< 400`.
2. Render the top Swaply logo/home link.
3. Render the drawer trigger with accessible name `Open menu`.
4. Render the logged-out `Login` CTA.
5. Render branch navigation with:
   - Objects;
   - Properties;
   - Services;
   - Events.
6. Render bottom navigation with:
   - Home;
   - Explore;
   - Matching;
   - Messages;
   - Exchange.
7. Open the side drawer when the drawer trigger is clicked.
8. Render key drawer Info links:
   - About Swaply;
   - Blog;
   - Contact.

## Why this is safe

This batch only adds Playwright assertions. It does not change product code or production behavior.

The tests are intentionally based on stable accessible labels and canonical hrefs already present in the production shell after Batch 32.

## Why this matters

Before Train A starts changing visible navigation or public pages, this batch protects the global public shell from regressions such as:

- missing top navigation;
- missing branch tabs;
- broken bottom navigation;
- hidden or non-functional drawer trigger;
- drawer opening failure;
- missing core Info links.

## Validation target

Expected CI:

- Unit Tests
- Lint & Type Check
- Build
- Public Visual Audit / Playwright

After merge/deploy:

- Vercel deployment should become `READY`.
- `/en` should return HTTP `200` on production.
- Production runtime logs should show no `error`, `warning`, or `fatal` entries in the checked window.

## Recommended Batch 34

Batch 34 should use the strengthened shell contract to safely inspect and correct any confirmed drawer/nav/bottom-nav inconsistencies.

It should remain small and avoid business logic.

## Merge rule

Do not merge the Batch 33 PR until Petru gives the explicit command:

`Merge #...`
