# Batch 42 — Legal / trust copy consistency pass

Date: 2026-07-09
Branch: `batch-42-legal-trust-copy-consistency`
Base: `main`

## Goal

Batch 42 is a small public legal/trust copy consistency pass after Batch 41.

The goal is to keep public-facing legal and trust pages aligned with the canonical public Swaply domain:

- canonical public site: `https://www.swaply.world`
- support email: `support@swaply.world`
- privacy email: `privacy@swaply.world`
- DPO email: `dpo@swaply.world`
- safety email: `safety@swaply.world`
- DMCA email: `dmca@swaply.world`
- legal email: `legal@swaply.world`

## What changed

### 1. Added a narrow public legal copy normalizer

New file:

- `src/lib/legal-copy.ts`

It defines public contact constants and `normalizePublicLegalCopy(value)`.

The normalizer only replaces legacy public-domain/contact copy:

- `swaply.app` contact emails → `swaply.world`
- `swaply.io` public URL examples → `swaply.world`

It does not change legal meaning, routes, auth, data access, or business logic.

### 2. Applied normalization on the public legal pages

Updated pages:

- `src/app/[locale]/terms/page.tsx`
- `src/app/[locale]/privacy/page.tsx`
- `src/app/[locale]/cookies/page.tsx`
- `src/app/[locale]/safety/page.tsx`
- `src/app/[locale]/dmca/page.tsx`
- `src/app/[locale]/copyright/page.tsx`

This avoids manually editing all locale JSON files while still preventing stale domains from appearing on public legal/trust pages.

### 3. Aligned DMCA form placeholder copy

Updated:

- `src/components/DMCAForm.tsx`

The old example URL `https://swaply.io/en/objects/...` is now generated from the canonical public base URL.

### 4. Aligned Organization JSON-LD contact email

Updated:

- `src/app/[locale]/layout.tsx`

The Organization schema contact email now uses `support@swaply.world` from the shared public legal-copy constants.

### 5. Added unit coverage

New file:

- `src/__tests__/legal-copy.test.ts`

The test verifies that legacy public emails and legacy public URL examples normalize to the canonical public domain.

## Scope boundaries

This batch intentionally does not touch:

- Supabase schema
- RLS policies
- authentication logic
- user data flows
- API routes
- DMCA report endpoint behavior
- payment logic
- business logic
- AI providers
- translation provider activation
- route inventory
- sitemap generation

## Suggested checks

```bash
npm run typecheck
npm run test -- src/__tests__/legal-copy.test.ts
npm run test -- src/__tests__/public-route-audit.test.ts
```

Recommended Vercel preview smoke URLs:

- `/en/terms`
- `/en/privacy`
- `/en/cookies`
- `/en/safety`
- `/en/dmca`
- `/en/copyright`

## Expected effect

Public legal/trust pages should no longer display stale public contact domains such as `swaply.app` or stale public examples such as `swaply.io`.

The canonical public identity remains `swaply.world`.
