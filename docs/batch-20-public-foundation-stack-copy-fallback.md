# Batch 20 — Public foundation stack copy fallback

## Goal

Batch 20 prepares the public foundation stack copy for localization without making public routes depend on completed translations.

The public UI still renders the same English copy from the existing runtime config. A separate fallback contract now mirrors that copy and can be used by tests and future localization work. This keeps Batch 20 build-safe while giving future batches a controlled place to add localized entries.

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

## 10 actions included

1. Start Batch 20 from the green Batch 19 head.
2. Add a `publicFoundationStackCopy.ts` fallback contract.
3. Mirror public-facing card text into default English copy records.
4. Keep route metadata, audit IDs, related areas and login-gated flags in the existing content config.
5. Keep the runtime UI copy unchanged for visitors.
6. Add fallback resolver helpers for future localized entries.
7. Add status helpers that report missing localized fields.
8. Add tests that every track has fallback copy.
9. Add tests that `ro-RO` safely falls back to English until Romanian copy exists.
10. Document the localization boundary and safety limits.

## What this enables next

Future batches can add localized copy gradually, one locale at a time, without making public pages blank or broken when a translation is incomplete.

## Fallback rule

- Default locale: `en`.
- Missing locale: fallback to `en`.
- Missing track fields: fallback field-by-field to `en`.
- Legal translations still require human review before being treated as final.

## What this batch does not do

This batch does not translate the UI into all 43 languages and does not wire the public UI to a runtime translation provider. It only creates the safe copy contract that allows translation to be added later without blocking the public site.

## Required checks

- Unit Tests
- Lint & Type Check
- Build
- Public Visual Audit / Playwright
