# Batch 45 — Public x-default hreflang alignment

Date: 2026-07-09
Branch: `batch-45-xdefault-hreflang-alignment`
Base: `main`

## Goal

Batch 45 follows Batch 44 and fixes one narrow SEO consistency issue observed on live public pages.

After Batch 44, page HTML metadata had route-specific canonical and hreflang values, but the HTTP `Link` header exposed `x-default` as the non-localized public fallback URL. This batch makes that fallback explicit in the shared public URL helper and adds tests so the behavior stays intentional.

## What changed

### 1. Centralized the public default-locale contract

Updated file:

- `src/lib/public-site.ts`

Added:

- `SWAPLY_PUBLIC_DEFAULT_LOCALE = "en"`
- `toSwaplyXDefaultPublicUrl(path)`

`x-default` now points to the non-localized public fallback URL:

- `/privacy` → `https://www.swaply.world/privacy`
- `/terms` → `https://www.swaply.world/terms`
- `/` → `https://www.swaply.world`

Locale-specific canonical and hreflang URLs remain localized:

- canonical for `/ro/privacy` → `https://www.swaply.world/ro/privacy`
- `en` hreflang → `https://www.swaply.world/en/privacy`
- `ro` hreflang → `https://www.swaply.world/ro/privacy`

### 2. Strengthened public metadata tests

Updated file:

- `src/__tests__/public-page-metadata.test.ts`

The test now verifies that every public metadata route keeps:

- localized canonical URL;
- localized `en` / `ro` hreflang URLs;
- non-localized `x-default` fallback URL.

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
- page body copy;
- legal copy.

## Suggested checks

```bash
npm run typecheck
npm run test -- src/__tests__/public-page-metadata.test.ts
npm run test -- src/__tests__/public-site.test.ts
npm run test -- src/__tests__/public-route-audit.test.ts
```

Recommended Vercel preview smoke URLs:

- `/en`
- `/en/privacy`
- `/en/terms`
- `/en/dmca`
- `/en/copyright`

## Expected effect

Public metadata should now be consistent across HTML metadata, sitemap alternates and HTTP `Link` header behavior:

- canonical stays locale-specific;
- normal hreflang entries stay locale-specific;
- `x-default` is intentionally the public non-localized fallback.
