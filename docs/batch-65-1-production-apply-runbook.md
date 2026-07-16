# Batch 65.1 — Production apply runbook

## Status

`BLOCKED — ZERO-DOWNTIME BRIDGE REQUIRED`

This runbook is planning evidence only. It does not authorize a Supabase Production migration, a Vercel Production deployment, a PR merge, or a billing change.

## Critical sequencing finding

The current Production application on `main` still saves owner profiles through a direct `profiles.upsert(...)` path.

The Batch 65 database contract removes the authenticated direct `UPDATE` path and makes `update_own_profile_v1` the canonical owner-write authority. The Batch 65 application code already calls `ensure_own_profile_v1` and `update_own_profile_v1`, but those RPCs do not exist in Production until the migrations are applied.

Therefore:

- **database first is unsafe:** the current Production application can lose profile-save capability before the new application is deployed;
- **application first is unsafe:** the Batch 65 application can call RPCs that do not yet exist;
- applying the database and deploying the application as two independent operations creates an avoidable failure window.

Production apply remains blocked until a small compatibility bridge is deployed first.

## Required compatibility bridge

Create a separate, minimal PR from current `main`. It must not include the Batch 65 UI or schema-dependent controls.

The bridge must:

1. keep the current Production UI and payload shape;
2. attempt `ensure_own_profile_v1` for missing-profile bootstrap;
3. fall back to the existing legacy bootstrap only when the RPC is genuinely unavailable (`42883` or the equivalent PostgREST missing-function code);
4. attempt `update_own_profile_v1` for profile saves when it is available;
5. fall back to the current legacy owner `upsert` only when the RPC is genuinely unavailable;
6. never fall back on permission, RLS, stale-revision, validation, idempotency or other runtime errors;
7. send only the existing Production-schema fields through the fallback path;
8. preserve the current UI until the full Batch 65 application is deployed;
9. include unit tests proving RPC-first behavior, missing-RPC fallback and no fallback for security/conflict errors.

After this bridge is merged by an explicit command and verified in Production, the same deployed application remains compatible both before and after the database migration.

## Gate 0 — immutable pre-apply evidence

Immediately before any Production apply, record:

- current `main` SHA and Vercel Production deployment ID;
- bridge PR merge SHA and deployed SHA;
- Supabase migration history;
- `profiles`, `public_profiles` and `auth.users` row counts;
- Auth users missing a profile;
- profile/public-profile columns;
- table grants and RLS policies;
- trigger definitions on `auth.users` and `public.profiles`;
- definitions, owners and `search_path` values for profile-related functions;
- unsupported locales, duplicate language arrays and malformed JSON counts;
- current Supabase and Vercel error logs.

Expected audited baseline before Batch 65 apply:

| Measure | Expected |
|---|---:|
| Auth users | 1,077 |
| Profiles | 957 |
| Auth users without profile | 120 |
| Current private profiles | 0 |
| Banned profiles | 0 |
| Actively suspended profiles | 0 |
| Unsupported locales | 0 |
| Deterministic bootstrap username collisions | 0 |

Any unexpected drift requires a new read-only audit before proceeding.

## Gate 1 — compatibility bridge acceptance

Before database apply, the bridge deployment must pass:

- Unit Tests;
- Lint and Type Check;
- Build;
- Public Visual Audit;
- Vercel Preview;
- explicit Production deployment verification;
- login and profile reload against the unchanged Production database;
- one profile save using the legacy fallback;
- clean Vercel runtime logs.

Stop if the bridge changes profile data unexpectedly or cannot save on the unchanged database.

## Gate 2 — ordered Production migration apply

Apply only after a separate explicit Production authorization from Petru.

Apply in this exact order:

1. `20260716130000_batch_65_global_profile_contract.sql`
2. `20260716130100_batch_65_profile_revision_guard.sql`
3. `20260716130200_batch_65_locale_registry_completion.sql`
4. `20260716130300_batch_65_1_profile_bootstrap_and_participant_projection.sql`
5. `20260716130400_batch_65_1_remove_legacy_profile_update_privilege.sql`

Rules:

- apply one migration at a time;
- record the result and migration history after each apply;
- stop immediately at the first SQL error or unexpected invariant;
- do not edit or delete an applied migration;
- do not continue merely because later migrations might repair an earlier failure;
- do not merge PR #475 during this sequence.

### Checkpoint after migration 1

Verify read-only:

- all nine additive global-profile columns exist;
- every profile has a positive revision;
- canonical language columns are valid and distinct;
- `update_own_profile_v1` exists with explicit `search_path`;
- `profile_update_requests` exists with RLS enabled;
- no profile rows were lost;
- public projection contains no exact address, coordinates, email, date of birth, payment, token or API-secret fields.

### Checkpoint after migration 2

Verify read-only:

- `protect_profile_privileged_fields` has the expected owner and `search_path`;
- browser callers cannot forge role, badge, trust, verification, subscription, token, API hash or initial revision fields;
- no existing privileged values changed.

### Checkpoint after migration 3

Verify read-only:

- all 43 active locales are accepted by the normalizer;
- unsupported locale count remains zero;
- no language arrays contain duplicates or more than three entries.

### Checkpoint after migration 4

Verify read-only:

- `ensure_own_profile_v1`, `profile_identity_allowed_v1` and the Auth bootstrap trigger exist;
- Auth user count remains 1,077;
- profile count becomes exactly 1,077;
- Auth users without a profile become exactly zero;
- deterministic usernames remain unique;
- new and repaired profiles use coherent `primary_language`, `preferred_locale` and `languages` values;
- `public_profiles.is_public` exists;
- `public_profiles` contains only the minimized projection;
- 956 biographies and one occupation are hidden from anonymous discovery, not deleted from `profiles`;
- idempotency responses contain only revision markers and have a 24-hour expiry;
- the existing welcome-email and onboarding triggers still exist independently.

### Checkpoint after migration 5

Verify read-only:

- `authenticated` has no table-level `UPDATE` privilege on `public.profiles`;
- no authenticated UPDATE policy exists on `profiles`;
- `authenticated` may execute `ensure_own_profile_v1` and `update_own_profile_v1`;
- `anon` may execute neither owner RPC;
- `profile_update_requests` remains inaccessible to browser roles;
- all exposed security-definer functions retain explicit safe `search_path` values.

## Gate 3 — immediate post-apply functional verification

Do not create Production fixture Auth users because the existing welcome-email trigger can create an external side effect.

Use an existing controlled account and verify, one action at a time:

1. login succeeds;
2. profile loads;
3. profile save succeeds through the RPC path;
4. page reload preserves the saved value;
5. a second session receives a stale-revision conflict and reloads current data;
6. onboarding profile persistence succeeds;
7. an existing conversation still resolves the participant's minimal identity;
8. anonymous discovery exposes only permitted public fields;
9. no exact location or sensitive field is exposed;
10. Supabase database/Auth logs and Vercel runtime logs remain clean.

Stop at the first critical failure. Continue only read-only evidence collection after a failure.

## Gate 4 — full Batch 65 application

Only after the database post-apply audit is green:

1. revalidate PR #475 against the now-migrated Production contract;
2. verify its latest CI and Vercel Preview;
3. mark it ready only when all evidence is current;
4. merge only after Petru gives the exact command `Merge #475`;
5. verify GitHub CI, Vercel Production, runtime logs and Supabase advisors after merge.

## Critical stop conditions

Stop rollout and prepare the forward-only rollback when any of the following occurs:

- row loss or unexpected count drift;
- profile bootstrap failure;
- Profile or Onboarding save failure;
- repeated stale conflicts without recovery;
- private profile visible to anonymous or outsider;
- participant identity unavailable to a legitimate participant;
- sensitive field present in `public_profiles`;
- unexpected trigger removal;
- unsafe function owner, grant or `search_path`;
- sustained Supabase or Vercel runtime errors.

## Rollback

Use `docs/batch-65-1-production-rollback.md`.

Rollback is forward-only. Migration history is never rewritten. Additive columns may remain. The emergency compatibility action restores owner-only direct UPDATE temporarily without exposing anonymous access or weakening privileged-field protection.

## Authorization boundary

This runbook does not authorize execution. The next executable Production action still requires a separate, explicit instruction that unmistakably authorizes applying the Batch 65 migrations to Supabase Production.