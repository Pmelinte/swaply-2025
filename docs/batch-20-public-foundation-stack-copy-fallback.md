# Batch 20 — Public foundation stack copy fallback

## Goal

Batch 20 prepares the public foundation stack copy for localization without making public routes depend on completed translations.

The UI still renders the same English copy, but the strings are now centralized behind a fallback contract. Future translation work can add localized entries without touching the card metadata, audit mapping, page mapping or login safety flags.

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

## 10 actions included

1. Start Batch 20 from the green Batch 19 head.
2. Add a `publicFoundationStackCopy.ts` fallback contract.
3. Move public-facing card text into default English copy records.
4. Keep route metadata, audit IDs, related areas and login-gated flags in the existing content config.
5. Use copy resolver helpers inside `publicFoundationStackContent.ts`.
6. Keep the visible UI copy unchanged for visitors.
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

This batch does not translate the UI into all 43 languages. It only creates the safe structure that allows translation to be added without blocking the public site.

## Required checks

- Unit Tests
- Lint & Type Check
- Build
- Public Visual Audit / Playwright
