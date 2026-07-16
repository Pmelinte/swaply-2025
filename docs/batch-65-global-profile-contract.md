# Batch 65 — Global profile contract

## Status

`IN PROGRESS — LOCAL RUNTIME PASS`

The repository migration contract, application integration, focused tests and isolated local Supabase runtime matrix are implemented. No migration has been applied to Supabase Production and no merge is authorized.

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

## Application integration

- `UserProfile` is enriched by a canonical `GlobalProfileContract`;
- the mapper reconciles legacy and new language fields;
- Profile and Onboarding save through the revisioned state boundary;
- direct browser profile updates are removed from these flows;
- stale revision conflicts reload fresh profile data;
- ordered languages and translation preferences are visible in Profile;
- user type, availability, timezone and public-field consent are explicit.

## Tests

Repository tests verify:

- additive schema changes;
- 43-locale parity;
- deterministic language backfill order;
- public/private projection boundaries;
- CAS and stale-revision behavior in the SQL contract;
- idempotency registry and replay contract;
- direct UPDATE revocation;
- revision protection;
- participant-only minimal identity;
- explicit `search_path` and narrow RPC grants;
- Profile and Onboarding use the canonical persistence boundary.

The isolated local database workflow additionally executes:

- owner, outsider, anonymous, admin and moderator runtime roles;
- public/private projection behavior;
- two-session CAS concurrency;
- idempotency replay and conflict;
- stale revision rejection;
- privileged-field insertion guard;
- fixture cleanup with zero residual rows;
- container destruction.

Detailed evidence: `docs/batch-65-local-runtime-evidence.md`.

## Safety boundary

- no Supabase cloud branch was created;
- no Supabase subscription was changed;
- no Supabase access token or Production credential is used by the local runtime workflow;
- no Supabase Production migration has been applied;
- no Production data has been changed;
- no Train C lifecycle behavior has been changed;
- no merge is authorized.
