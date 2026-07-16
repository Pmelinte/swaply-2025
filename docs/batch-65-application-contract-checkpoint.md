# Batch 65 — Application contract checkpoint

## Status

`IN PROGRESS — CORE APPLICATION CONTRACT INTEGRATED`

## Added application layer

- `profileContract.ts` maps legacy profile rows to one global-first contract;
- `profileTypes.ts` preserves assignability to the existing `UserProfile` contract;
- `profileService.ts` calls only `update_own_profile_v1` and classifies stale-revision conflicts;
- the shared profile mapper now attaches the canonical contract and revision;
- the fallback resolver now follows primary → secondary → tertiary → route → browser → source → English;
- all 43 active locales are shared with the application i18n registry.

## Tests

- migration contract;
- application profile contract;
- revisioned profile service;
- ordered global-first language fallback;
- existing legacy language-fallback tests remain compatible.

## Deliberate boundary

The current Profile and Onboarding UI still use the legacy `updateProfile` call path. They must be switched to the revisioned service before any Batch 65 migration is applied to Supabase. Until that next checkpoint:

- no migration may be applied;
- no Production behavior is changed;
- the PR must remain draft;
- merge is not authorized.
