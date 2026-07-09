# Batch 32: Public live audit baseline

## Purpose

Batch 32 documents a production/live audit checkpoint for Train A after the route-contract and admin-diagnostic guardrails from Batches 29–31.

This batch is intentionally documentation-only. It records what is currently verified, what remains only partially verified, and which public-site issue should be handled next.

## Scope

- Documentation only.
- No UI changes.
- No route changes.
- No Supabase changes.
- No RLS changes.
- No auth changes.
- No API changes.
- No business-logic changes.
- No paid AI or translation provider activation.

## Production checkpoint after Batch 31

Batch 31 was verified on production before starting this audit baseline.

- Production deployment: `dpl_CwspA4uYk5dhuNqMFLRKH7BLk6QD`.
- Production commit: `f81e3180f12f9aabbcc5c0b50ce400f10583ecab`.
- Deployment status: `READY`.
- Production aliases include `www.swaply.world` and `swaply.world`.
- `/en/admin/diagnostic` returns HTTP `200` for a logged-out visitor.
- The logged-out admin diagnostic request is safely served through the login guard path.
- Recent production runtime logs for this deployment showed no `error`, `warning`, or `fatal` entries in the checked window.

## Automated coverage already in place

The current Playwright smoke contract covers the main public canonical route inventory:

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

It also covers legacy redirect contracts:

- `/en/match` → `/en/matching`
- `/en/change` → `/en/exchange`
- `/en/items` → `/en/objects`

Admin guardrails now cover:

- `/en/admin/canonical`
- `/en/admin/flows`
- `/en/admin/live-data`
- `/en/admin/matching-engine`
- `/en/admin/diagnostic`

## Live shell observations

The production HTML fetched for the guarded admin diagnostic route confirms that the logged-out shell is not empty and includes the current global navigation structure:

- Top bar with Swaply logo, country/language selector, and login CTA.
- Branch navigation with Objects, Properties, Services, and Events.
- Beta indicators for non-object branches where applicable.
- Bottom navigation with Home, Explore, Matching, Messages, and Exchange.
- Unified side drawer structure with Info and Legal sections.
- Drawer Info links include About, Blog, Contact, and Feedback.
- Drawer Legal links include Terms, Privacy, Cookies, Safety, DMCA, and Copyright.

This is consistent with the Train A goal: protect the public shell and navigation before touching deeper business logic.

## Guarded route observation

`/en/admin/diagnostic` is not a public content page. For logged-out visitors, it currently resolves to the login surface instead of exposing the diagnostic dashboard.

This is acceptable for Batch 31 and Batch 32 because the route is reachable, does not server-error, and presents a safe access guard. The real diagnostic dashboard remains expected only for an authenticated admin or moderator session.

## Current limitations of this audit

This connector session verified live status, HTML shell, deployment status, and runtime logs. It did not perform a full rendered browser visual audit across desktop and mobile screenshots.

Visual proof should still come from the Playwright Public Visual Audit / CI artifacts. Batch 32 records the baseline but does not replace visual QA.

## Candidate findings for Train A

### Finding A — public route status coverage is now stronger

Batches 29 and 30 moved public canonical route coverage from loose availability checks toward a stricter HTTP `< 400` contract and legacy redirect checks.

Recommended action: keep this as baseline. No immediate patch needed.

### Finding B — admin diagnostic is safely guarded

Batch 31 confirmed the diagnostic route can be tested without assuming a single auth state.

Recommended action: keep the safe contract. No immediate patch needed.

### Finding C — shell/nav needs stronger marker assertions

The smoke tests confirm route status and screenshots, but they do not yet assert that the public shell consistently renders the expected top bar, branch bar, bottom nav, and drawer trigger on each public canonical route.

Recommended action: make this the next safe Train A patch.

### Finding D — metadata on guarded/login surfaces should be reviewed later

The fetched login/guarded shell still inherits broad root-level metadata in the HTML head. This is not a Batch 32 code issue, but SEO metadata for guarded/login surfaces should be reviewed in a later focused metadata batch.

Recommended action: defer to a dedicated metadata/legal/SEO batch, not Batch 33 unless Petru prioritizes SEO over visual shell stability.

### Finding E — stale old PRs remain open

Old PRs #362 and #366 still exist as historical branches, but their safe useful parts have already been rebuilt from current `main` in Batches 29–31.

Recommended action: do not merge old PRs. Close or archive them later only with an explicit cleanup command.

## Recommended Batch 33

Batch 33 should be a small test-only/public-shell patch:

- Add stable smoke assertions for the logged-out public shell on the canonical public routes.
- Verify the presence of the top bar / Swaply logo.
- Verify branch navigation links for Objects, Properties, Services, and Events.
- Verify bottom navigation links for Home, Explore, Matching, Messages, and Exchange.
- Keep screenshots on failure.
- Do not change UI, routes, Supabase, auth, or business logic.

This is the safest next step because it turns the live shell observations from Batch 32 into executable regression protection before any public UI patch.

## Merge rule

Do not merge the Batch 32 PR until Petru gives the explicit command:

`Merge #...`
