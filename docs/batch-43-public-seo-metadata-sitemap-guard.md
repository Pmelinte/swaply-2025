# Batch 43 — Public SEO metadata / sitemap guard

Date: 2026-07-09
Branch: `batch-43-public-seo-metadata-sitemap-guard`
Base: `main`

## Goal

Batch 43 stabilizes the public SEO foundation after Batch 41 and Batch 42.

Batch 41 made the public route inventory the source of truth for static sitemap routes. Batch 42 aligned legal/trust public copy with the canonical `swaply.world` identity.

Batch 43 keeps that direction and adds two guards:

1. one canonical helper for public site URLs and hreflang URLs;
2. a best-effort dynamic sitemap guard so static public sitemap routes still render even if Supabase dynamic sitemap data is unavailable.

## What changed

### 1. Canonical public site helper

New file:

- `src/lib/public-site.ts`

It defines:

- `SWAPLY_PUBLIC_DOMAIN = "www.swaply.world"`
- `SWAPLY_PUBLIC_BASE_URL = "https://www.swaply.world"`
- `normalizePublicPath(path)`
- `toSwaplyPublicUrl(path)`
- `toSwaplyLocalizedPublicUrl(locale, path)`
- `buildPublicHreflangLanguages(locales, path)`

### 2. Legal copy reuses canonical URL constants

Updated:

- `src/lib/legal-copy.ts`

The legal copy normalizer now reuses the canonical public site constants from `public-site.ts` instead of defining its own base URL.

### 3. Sitemap uses canonical URL helpers

Updated:

- `src/app/sitemap.ts`

Sitemap URL generation now uses:

- `toSwaplyLocalizedPublicUrl(locale, path)`
- `buildPublicHreflangLanguages(locales, path)`

This keeps sitemap URLs and hreflang URLs aligned with the same canonical public base.

### 4. Sitemap dynamic data is best-effort

The Supabase-powered dynamic sitemap section is now wrapped in a defensive guard.

If Supabase is unavailable or throws while loading dynamic object/city/category pages, sitemap generation falls back to:

- static public route inventory;
- static programmatic SEO city/category combinations;
- blog posts.

This prevents a dynamic-data failure from taking down the entire sitemap.

### 5. Metadata base and Organization schema aligned

Updated:

- `src/app/[locale]/layout.tsx`

The layout now uses the canonical helper for:

- `metadataBase`
- default alternates/canonical helper
- Organization JSON-LD `url`
- Organization JSON-LD `logo`

### 6. Added unit coverage

New file:

- `src/__tests__/public-site.test.ts`

The test verifies:

- canonical public domain/base URL;
- public path normalization;
- canonical public URL generation;
- localized public URL generation;
- hreflang map generation with `x-default`.

## Scope boundaries

This batch intentionally does not touch:

- Supabase schema
- RLS policies
- authentication logic
- user data flows
- API routes
- object matching logic
- payment logic
- AI providers
- translation provider activation
- route inventory content
- legal page copy
- DMCA endpoint behavior

## Suggested checks

```bash
npm run typecheck
npm run test -- src/__tests__/public-site.test.ts
npm run test -- src/__tests__/legal-copy.test.ts
npm run test -- src/__tests__/public-route-audit.test.ts
```

Recommended Vercel preview smoke URLs:

- `/en`
- `/en/privacy`
- `/en/dmca`
- `/sitemap.xml`

## Expected effect

- Public canonical URL generation is centralized.
- Public metadata and sitemap use the same canonical domain.
- `sitemap.xml` is less likely to return a server error if dynamic Supabase sitemap data is temporarily unavailable.

