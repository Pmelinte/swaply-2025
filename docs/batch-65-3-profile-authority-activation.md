# Batch 65.3 — Profile authority activation

## Status

Supabase Production was applied and verified on 2026-07-18. Repository merge remains gated by final CI and Vercel Production verification.

Production migration versions:

- `20260718180005_batch_65_3_profile_authority_activation.sql`;
- `20260718180050_batch_65_3_profile_authority_concurrency_hardening.sql`.

## Objective

Activate the database contract already consumed by the merged profile compatibility bridge, without creating a write outage and without revoking the legacy authenticated `UPDATE` path before the remaining Batch 65 projection and browser-write gates are complete.

## Predictive audit

Production baseline before apply:

- Auth users: `1,077`;
- profile rows: `957`;
- Auth users without a profile: `120`;
- Batch 65 migrations present in Production: `0`;
- `ensure_own_profile_v1`: absent;
- `update_own_profile_v1`: absent;
- existing Auth bootstrap created the welcome email only;
- existing profile writes were owner-scoped through RLS;
- existing `public_profiles` projection was retained in this sub-batch.

The application bridge was already merged in `main`. It attempts the canonical RPC first and falls back only when that exact RPC is missing, permitting an additive activation without a client write outage.

## Implemented scope

- 43-locale canonical normalization, including `yi` parity with the application registry;
- primary, secondary and tertiary language columns;
- automatic translation and show-original preferences;
- monotonic `profile_revision`;
- shared `user_type`, `availability_status` and private timezone fields;
- deterministic language backfill while retaining legacy `languages` and `preferred_locale` compatibility;
- owner-only `ensure_own_profile_v1`;
- owner-only, allowlisted, revisioned `update_own_profile_v1`;
- same-key concurrency serialization and compare-and-set protection;
- request idempotency markers with 24-hour cleanup;
- deterministic profile creation for new Auth users;
- additive repair for the 120 historical Auth users without profiles;
- protection of `profile_revision` and existing server-owned fields from direct compatibility writes;
- explicit grants and `search_path` declarations.

## Production verification

After apply:

- Auth users: `1,077`;
- profile rows: `1,077`;
- Auth users without a profile: `0`;
- null primary languages: `0`;
- unsupported canonical locales: `0`;
- duplicate language choices: `0`;
- invalid profile revisions: `0`;
- canonical functions owned by `postgres` with explicit search paths;
- `ensure_own_profile_v1` and `update_own_profile_v1` executable only by `authenticated` and `service_role`;
- anonymous execution denied;
- Auth profile bootstrap and welcome-email triggers coexist;
- private idempotency markers remain inaccessible to authenticated callers.

A transactional authenticated proof passed for:

1. owner ensure;
2. first revisioned update;
3. same-key idempotent replay;
4. stale-revision rejection;
5. owner-only raw profile access;
6. outsider exclusion;
7. direct compatibility update retained without revision mutation.

The proof rolled back its temporary profile change and idempotency marker.

## Repository and Preview gates

The implementation reached green on the pre-alignment head for:

- Unit Tests;
- Lint & Type Check;
- Build;
- Public Visual Audit;
- Vercel Preview READY;
- no Preview warning, error or fatal runtime entries.

The final repository head must repeat those gates after aligning migration filenames with the exact Production versions.

## Deliberate exclusions

This sub-batch does **not**:

- revoke authenticated direct `UPDATE` on `profiles`;
- remove the legacy owner update policy;
- rebuild the public/participant identity projection;
- change profile UI, media or approximate-location behavior;
- alter Train C lifecycle behavior;
- create a paid Supabase branch or change billing.

These boundaries preserve a zero-downtime correction path. Direct update revocation is allowed only after the public/participant projection and browser persistence paths pass their dedicated authenticated gates.

## Rollback and correction strategy

The migrations are additive and transactional. Post-apply correction is forward-only:

- disable the new Auth bootstrap trigger if account creation is affected;
- revoke RPC execution if an authorization defect is detected;
- retain the legacy owner update policy so the merged compatibility bridge continues to persist profiles;
- repair functions or constraints in a new migration;
- do not drop populated profile columns or delete repaired profile rows.

## Completion boundary

Batch 65 remains active after this PR. The next safe unit is public/participant projection minimization and authenticated projection proof, followed by browser direct-update revocation only when all migration-order gates pass.
