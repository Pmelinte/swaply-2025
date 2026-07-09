# Batch 41 — Public legal / trust / SEO inventory audit

Status: implemented as a route contract, sitemap source of truth, and smoke-test coverage.

## Goal

Batch 41 makes the public route inventory explicit so that legal pages, trust pages, and SEO-discoverable pages cannot drift apart.

The previous state had public legal pages in code, but not all of them were represented in the public audit contract or sitemap:

- Present in app routes: `/terms`, `/privacy`, `/cookies`, `/safety`, `/dmca`, `/copyright`.
- Present in `PUBLIC_ROUTE_AUDIT_ENTRIES` before Batch 41: `/terms`, `/privacy`, `/safety`.
- Present in sitemap before Batch 41: `/terms`, `/privacy`, `/safety`, `/cookies`.
- Missing from audit and/or sitemap: `/cookies`, `/dmca`, `/copyright`.

## Implemented inventory contract

The public route audit contract now tracks four explicit inventory flags:

| Flag | Meaning |
| --- | --- |
| `seoAudit` | The route is part of the public SEO inventory and must remain indexable/healthy. |
| `trustAudit` | The route contributes to user trust, legal confidence, payment confidence, or safety confidence. |
| `legalAudit` | The route is part of the legal inventory. |
| `sitemapAudit` | The route must be emitted into `sitemap.xml` for every configured locale. |

The contract also records:

- `sitemapPriority`
- `sitemapChangeFrequency`
- visual audit eligibility
- drawer audit eligibility
- login-wall guard
- context-only routes that must not be treated as standalone SEO pages

## Public route groups after Batch 41

### SEO + sitemap public pages

- `/`
- `/objects`
- `/properties`
- `/services`
- `/events`
- `/explore`
- `/matching`
- `/messages`
- `/exchange`
- `/blog`
- `/about`
- `/pricing`
- `/info`
- `/contact`
- `/terms`
- `/privacy`
- `/cookies`
- `/safety`
- `/dmca`
- `/copyright`

### Legal pages

- `/terms`
- `/privacy`
- `/cookies`
- `/safety`
- `/dmca`
- `/copyright`

### Trust pages

- `/about`
- `/pricing`
- `/info`
- `/contact`
- `/terms`
- `/privacy`
- `/cookies`
- `/safety`
- `/dmca`
- `/copyright`

### Context-only public pages

These remain in the public route contract because they are part of public guest experience behavior, but they are not standalone sitemap pages:

- `/chat`
- `/profile`

## Sitemap source of truth

`src/app/sitemap.ts` now reads static public routes from `getPublicSitemapAuditEntries()` instead of maintaining a separate hard-coded legal/static list.

This prevents this class of regression:

1. A new public legal or trust page is added.
2. The page works in the app.
3. The page is forgotten in sitemap or audit coverage.

## Test coverage

Updated tests:

- `src/__tests__/public-route-audit.test.ts`
  - verifies route IDs are unique
  - verifies localization and sitemap path normalization
  - verifies visual audit routes
  - verifies drawer audit routes
  - verifies SEO inventory equals sitemap inventory
  - verifies legal inventory includes all six legal pages
  - verifies trust inventory includes support + legal trust pages
  - verifies context-only routes are excluded from sitemap

- `e2e/public-browsing.spec.ts`
  - adds `/dmca`
  - adds `/copyright`
  - keeps existing `/terms`, `/privacy`, `/cookies`, `/safety`

## Acceptance checklist

- [x] No private/user-only flow changed.
- [x] No Supabase schema changed.
- [x] No payment/auth logic changed.
- [x] Public route audit includes all legal pages.
- [x] Sitemap is generated from the audit inventory.
- [x] DMCA and Copyright are included in legal smoke tests.
- [x] Context-only routes are not added to sitemap.

## Manual follow-up after deploy

Verify these production URLs return 200 and are not login walls:

- `https://www.swaply.world/en/terms`
- `https://www.swaply.world/en/privacy`
- `https://www.swaply.world/en/cookies`
- `https://www.swaply.world/en/safety`
- `https://www.swaply.world/en/dmca`
- `https://www.swaply.world/en/copyright`
- `https://www.swaply.world/sitemap.xml`
