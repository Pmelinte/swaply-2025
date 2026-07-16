# Batch 65 — Global profile contract

## Status

`IN PROGRESS — MIGRATION CONTRACT CHECKPOINT`

This checkpoint contains the repository migration contract and focused contract tests only. It does not apply any migration to Supabase Production and does not yet integrate the application UI or state layer.

## Scope frozen for Batch 65

- keep `public.profiles` owner-only;
- maintain a sanitized public projection in `public.public_profiles`;
- support canonical primary, secondary and tertiary languages;
- preserve original-language and automatic-translation preferences;
- add shared user type, availability and private timezone fields;
- add a monotonic profile revision;
- provide owner-only CAS and idempotent update authority;
- remove private profiles from public discovery;
- expose only minimal identity to an existing participant, moderator or admin;
- preserve compatibility with `languages` and `preferred_locale`;
- do not modify Train C lifecycle behavior.

## Repository migration chain

1. `20260716130000_batch_65_global_profile_contract.sql`
   - reconciles the missing Production language columns;
   - backfills the canonical language order;
   - adds revision, user type, availability and timezone;
   - hardens the public projection;
   - adds `update_own_profile_v1`;
   - adds `get_profile_identity_v1`;
   - removes direct authenticated profile UPDATE authority.
2. `20260716130100_batch_65_profile_revision_guard.sql`
   - forces revision `1` on authenticated profile insertion;
   - preserves the server-owned revision and existing privileged fields.
3. `20260716130200_batch_65_locale_registry_completion.sql`
   - aligns the database normalizer with all 43 active application locales, including `yi`.

## Tests

`src/lib/profile/globalProfileMigration.test.ts` verifies:

- additive schema changes;
- 43-locale parity;
- deterministic language backfill order;
- public/private projection boundaries;
- CAS and stale-revision behavior in the SQL contract;
- idempotency registry and replay contract;
- direct UPDATE revocation;
- revision protection;
- participant-only minimal identity;
- explicit `search_path` and narrow RPC grants.

## Safety boundary

- no Supabase migration has been applied;
- no Production data has been changed;
- no application code has been changed yet;
- no merge is authorized;
- the next checkpoint is application type, mapper and profile-service integration.
