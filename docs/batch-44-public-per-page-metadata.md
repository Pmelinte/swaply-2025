# Batch 44 — Public per-page metadata, canonical and hreflang hardening

Date: 2026-07-09
Branch: `batch-44-public-per-page-metadata`
Base: `main`

## Goal

Batch 44 hardens public SEO metadata after Batch 41–43.

Batch 41 made public route inventory explicit.
Batch 42 aligned public legal/trust copy with `swaply.world`.
Batch 43 centralized canonical public URL helpers and guarded sitemap generation.

Batch 44 fixes the remaining visible gap: legal pages such as `/en/privacy` inherited homepage-level metadata because they were client pages and did not have their own server metadata boundary.

## What changed

### 1. Added a public page metadata contract

New file:

- `src/lib/public-pages/publicPageMetadata.ts`

It defines metadata entries for every route covered by the public SEO audit inventory:

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

Each entry includes:

- route id;
- path;
- title;
- description.

The shared helper `buildPublicPageMetadata(locale, id)` returns canonical Next.js metadata with:

- absolute title;
- description;
- Open Graph title/description/url;
- Twitter summary card;
- canonical URL;
- hreflang language map;
- `x-default`.

### 2. Added server metadata boundaries for legal pages

New files:

- `src/app/[locale]/terms/layout.tsx`
- `src/app/[locale]/privacy/layout.tsx`
- `src/app/[locale]/cookies/layout.tsx`
- `src/app/[locale]/safety/layout.tsx`
- `src/app/[locale]/dmca/layout.tsx`
- `src/app/[locale]/copyright/layout.tsx`

These route layouts export `generateMetadata()` while leaving the existing client pages unchanged.

### 3. Added metadata coverage tests

New file:

- `src/__tests__/public-page-metadata.test.ts`

The test verifies:

- every SEO-audited public route has metadata in the contract;
- every public metadata path is unique;
- titles and descriptions are meaningful;
- legal pages do not reuse the homepage title;
- Privacy metadata builds the exact canonical URL `/en/privacy` and expected hreflang entries.

## Scope boundaries

This batch intentionally does not touch:

- Supabase schema;
- RLS policies;
- authentication logic;
- API route behavior;
- DMCA endpoint behavior;
- payment logic;
- matching/business logic;
- AI providers;
- route inventory content;
- sitemap generation logic;
- legal page body copy.

## Suggested checks

```bash
npm run typecheck
npm run test -- src/__tests__/public-page-metadata.test.ts
npm run test -- src/__tests__/public-site.test.ts
npm run test -- src/__tests__/public-route-audit.test.ts
```

Recommended Vercel preview smoke URLs:

- `/en/privacy`
- `/en/terms`
- `/en/cookies`
- `/en/safety`
- `/en/dmca`
- `/en/copyright`

## Expected effect

Legal/trust pages should no longer inherit homepage metadata.

Example expected canonical:

- `/en/privacy` → `https://www.swaply.world/en/privacy`

Example expected title:

- `/en/privacy` → `Privacy Policy | Swaply`

