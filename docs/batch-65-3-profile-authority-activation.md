# Batch 65.3 — Profile authority activation

## Status

Implementation PR. Supabase Production remains unchanged until repository CI and Vercel Preview are green.

## Objective

Activate the database contract already consumed by the merged profile compatibility bridge, without creating a write outage and without revoking the legacy authenticated `UPDATE` path before authenticated RPC verification.

## Predictive audit

Production baseline on 2026-07-18:

- Auth users: `1,077`;
- profile rows: `957`;
- Auth users without a profile: `120`;
- Batch 65 migrations present in Production: `0`;
- `ensure_own_profile_v1`: absent;
- `update_own_profile_v1`: absent;
- existing Auth bootstrap creates welcome email only;
- existing profile writes remain owner-scoped through RLS;
- existing `public_profiles` projection remains unchanged in this sub-batch.

The application bridge is already merged in `main`. It attempts the canonical RPC first and falls back only when that exact RPC is missing. This permits an additive Production activation with no client deployment dependency.

## Implemented scope

- 43-locale canonical normalization, including `yi` parity with the application registry;
- primary, secondary and tertiary language columns;
- automatic translation and show-original preferences;
- monotonic `profile_revision`;
- shared `user_type`, `availability_status` and private timezone fields;
- deterministic language backfill while retaining legacy `languages` and `preferred_locale` compatibility;
- owner-only `ensure_own_profile_v1`;
- owner-only, allowlisted, revisioned `update_own_profile_v1`;
- request idempotency markers with 24-hour cleanup;
- deterministic profile creation for new Auth users;
- additive repair for the 120 historical Auth users without profiles;
- protection of `profile_revision` and existing server-owned fields from direct compatibility writes;
- explicit grants and `search_path` declarations.

## Deliberate exclusions

This sub-batch does **not**:

- revoke authenticated direct `UPDATE` on `profiles`;
- remove the legacy owner update policy;
- rebuild the public/participant identity projection;
- change profile UI, media or approximate-location behavior;
- alter Train C lifecycle behavior;
- create a paid Supabase branch or change billing.

Those boundaries preserve a zero-downtime rollback path. Direct update revocation is allowed only after both RPCs are verified through an authenticated Production client and the browser no longer depends on fallback.

## Required gates

Before Production apply:

1. Unit Tests — PASS.
2. Lint & Type Check — PASS.
3. Build — PASS.
4. Public Visual Audit — PASS.
5. Vercel Preview — READY with no relevant runtime error/fatal entry.

Immediately after Production apply:

1. migration recorded exactly once;
2. Auth users equal profile rows;
3. zero unsupported or duplicate canonical language choices;
4. both RPCs have owner `postgres`, `SECURITY DEFINER`, explicit `search_path` and narrow grants;
5. anonymous execution denied;
6. owner ensure/update/replay/stale-revision behavior verified;
7. outsider cannot select or mutate another raw profile;
8. direct owner compatibility update remains available for rollback;
9. Auth bootstrap trigger coexists with welcome/onboarding triggers;
10. Supabase API/Auth/Postgres logs contain no relevant new errors;
11. security and performance advisors reviewed.

## Rollback and correction strategy

The migration is additive and transactional. A SQL failure rolls back the entire migration. After a successful apply, correction is forward-only:

- disable the new Auth bootstrap trigger if account creation is affected;
- revoke RPC execution if an authorization defect is detected;
- retain the legacy owner update policy so the merged compatibility bridge continues to persist profiles;
- repair functions or constraints in a new migration;
- do not drop populated profile columns or delete repaired profile rows.

## Completion boundary

Batch 65 remains active after this PR. The next safe unit is public/participant projection minimization plus authenticated RPC proof, followed by direct-update revocation only when all migration-order gates pass.
