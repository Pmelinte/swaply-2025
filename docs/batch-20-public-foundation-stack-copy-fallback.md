# Batch 20 — Public foundation stack copy fallback contract

## Goal

Batch 20 documents a safe localization fallback contract for the public foundation stack without adding new runtime code.

The public UI still renders the same English copy from the existing runtime config. This documentation captures the fallback rules that future batches can implement once the build path is proven safe.

## Safety boundaries

- No Supabase migrations.
- No RLS changes.
- No auth changes.
- No backend changes.
- No provider AI integration.
- No payment or token accounting changes.
- No route changes.
- No merge.
- No public free-text comments.
- No real action without login.
- No new runtime translation provider.
- No runtime dependency from the public UI to incomplete localized copy.
- No new `src/lib` localization module in this batch.

## 10 actions included

1. Start Batch 20 from the green Batch 19 head.
2. Document the localization fallback contract for foundation stack copy.
3. Keep the public runtime UI copy unchanged for visitors.
4. Keep route metadata, audit IDs, related areas and login-gated flags unchanged.
5. Preserve the existing public visual audit behavior.
6. Preserve the existing unit-test surface from Batch 19.
7. Record the default locale rule: `en` is the safe fallback.
8. Record the missing-locale rule: incomplete locales must fall back to `en`.
9. Record the legal-copy rule: legal translations still require human review.
10. Keep the batch build-safe by avoiding runtime localization wiring.

## Future implementation rule

A later localization batch can add runtime copy only after it proves these constraints:

- Missing locale never blanks a public card.
- Missing field falls back field-by-field to `en`.
- UI remains visible logged-out.
- Public Visual Audit still checks the same routes.
- Legal copy is clearly marked as requiring human review.

## Fallback rule

- Default locale: `en`.
- Missing locale: fallback to `en`.
- Missing track fields: fallback field-by-field to `en`.
- Legal translations still require human review before being treated as final.

## What this batch does not do

This batch does not translate the UI into all 43 languages and does not wire the public UI to a runtime translation provider. It only records the safe fallback contract so implementation can happen later without blocking the public site.

## Required checks

- Unit Tests
- Lint & Type Check
- Build
- Public Visual Audit / Playwright
