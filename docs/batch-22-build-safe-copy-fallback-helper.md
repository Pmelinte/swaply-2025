# Batch 22 — Build-safe copy fallback helper repair

## Goal

Batch 22 repairs the localization fallback path by introducing the smallest possible helper under `src/lib` without connecting it to public UI runtime.

Batch 20 showed that a larger runtime copy module can break `next build`. Batch 21 proved the fallback algorithm in test space. Batch 22 now moves only the generic fallback helper into `src/lib` and keeps all real public copy in the existing runtime config.

## Safety boundaries

- No public UI copy changes.
- No public route changes.
- No Supabase migrations.
- No RLS changes.
- No auth changes.
- No backend changes.
- No provider AI integration.
- No real translations.
- No runtime translation provider.
- No merge.

## What changed

1. Added `src/lib/public-foundation-stack/publicFoundationStackCopyFallback.ts`.
2. The helper only normalizes locale keys and merges localized fields over default copy.
3. The helper does not import public page config.
4. The helper does not import React.
5. The helper does not import routing.
6. The helper does not contain full copy tables.
7. The helper is not connected to `PublicFoundationStackSection`.
8. The diagnostic test now imports and uses the helper.
9. The fallback behavior remains field-by-field.
10. Public UI remains visually unchanged.

## Why this is safer than the failed Batch 20 attempt

The failed Batch 20 attempt introduced a larger copy module with default copy tables and localization status helpers. That was too much to wire near the public runtime path at once.

This batch isolates only the generic fallback mechanics:

- `normalizePublicFoundationStackLocale(locale)`
- `resolvePublicFoundationStackCopyFallback(defaultCopy, localizedCopy)`

If this passes Unit Tests, Type Check, Build and Public Visual Audit, then a future batch can try one small integration step at a time.

## Recommended next step if green

Batch 23 should not add all languages. It should use the helper in one non-UI config path or one narrowly scoped read helper, then run full CI again.
