# Batch 45 — Public x-default hreflang alignment

Base: `main` after PR #438 / Batch 45A.

## Goal

Keep locale-specific canonical and hreflang URLs while making `x-default` point to the non-localized public fallback route.

Examples:

- canonical `/en/privacy` → `https://www.swaply.world/en/privacy`
- hreflang `ro` → `https://www.swaply.world/ro/privacy`
- hreflang `x-default` → `https://www.swaply.world/privacy`

## Revalidation

The branch was reset to production commit `a66be342452b0a40439e310704e1d948c32fcfcf` after Batch 45A restored the full CI suite. Only the four Batch 45 files were reapplied.

## Scope

This batch changes only public URL helpers and their unit coverage.

It does not modify Supabase, RLS, authentication, API behavior, payments, matching, AI providers, or page body copy.
