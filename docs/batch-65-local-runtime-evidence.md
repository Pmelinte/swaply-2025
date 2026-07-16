# Batch 65 — Local runtime evidence

## Status

`PASS — BATCH 65.1 EPHEMERAL LOCAL DATABASE`

This evidence was produced without a Supabase cloud branch, without changing the Supabase subscription, and without touching Production.

## Execution

- GitHub workflow: `Batch 65 Database Runtime`
- Workflow run: `29522857170`
- Run number: `21`
- Tested head: `1b0e5612a005a37fe9caae208e2e56d865c2c579`
- Runner: standard `ubuntu-latest`
- Database: local Supabase Postgres 17 container
- Production project reference: not supplied to the workflow
- Supabase access token: not used
- Production credentials: not used
- Telemetry: disabled with `SUPABASE_TELEMETRY_DISABLED=1` and `DO_NOT_TRACK=1`

## Applied migration chain

1. `20260716130000_batch_65_global_profile_contract.sql`
2. `20260716130100_batch_65_profile_revision_guard.sql`
3. `20260716130200_batch_65_locale_registry_completion.sql`
4. `20260716130300_batch_65_1_profile_bootstrap_and_participant_projection.sql`
5. `20260716130400_batch_65_1_remove_legacy_profile_update_privilege.sql`

The migrations were applied to a Production-shaped synthetic baseline containing only deterministic Batch 65 fixture users and relationships.

## Passed runtime domains

| Domain | Result |
|---|---|
| Five-migration application | PASS |
| Additive schema and constraints | PASS |
| Legacy language backfill | PASS |
| 43-locale registry compatibility | PASS |
| Existing Auth user without profile repair | PASS |
| Auth user with null email bootstrap | PASS |
| Route locale normalization during bootstrap | PASS |
| Coherent primary/preferred/legacy language creation | PASS |
| Initial profile revision 1 | PASS |
| Owner-only raw profile RLS | PASS |
| Anonymous raw profile denial | PASS |
| Direct authenticated UPDATE revocation | PASS |
| Canonical owner update RPC | PASS |
| Unsupported-field/IDOR rejection | PASS |
| Public profile projection | PASS |
| Private profile excluded from anonymous discovery | PASS |
| Existing participant reads minimal private identity | PASS |
| Outsider cannot read private participant identity | PASS |
| Optional public fields require consent | PASS |
| Cross-domain preference fields excluded from public projection | PASS |
| Admin minimal identity | PASS |
| Moderator minimal identity | PASS |
| Initial privileged-field guard | PASS |
| Idempotent replay | PASS |
| Idempotency conflict | PASS |
| Bounded 24-hour idempotency retention | PASS |
| Stored idempotency response contains revision only | PASS |
| Stale revision rejection | PASS |
| Two-session CAS race | PASS — one winner, one stale rejection |
| Revision increments exactly once | PASS |
| Fixture cleanup | PASS |
| Residual fixture rows | 0 |
| Container destruction | PASS |

## Read-only Production compatibility evidence

The separate read-only audit of Production found:

- 1,077 Auth users;
- 957 profiles;
- 120 Auth users without a profile;
- zero deterministic bootstrap-username collisions;
- zero unsupported profile locales;
- zero duplicate language arrays;
- zero existing private profiles;
- zero banned or actively suspended profiles;
- no existing object-name collisions for the new Batch 65.1 functions, trigger or idempotency table;
- the existing Auth welcome-email trigger is independent and remains unchanged;
- `onboarding_progress` and the existing profile onboarding trigger are present;
- neither `PUBLIC` nor `authenticated` has `CREATE` privilege on the public schema.

The privacy transition intentionally removes 956 existing biographies and one occupation from anonymous public projection until the corresponding users explicitly opt in. Raw profile values remain unchanged.

## Files forming the reproducible evidence

- `.github/workflows/batch-65-database-runtime.yml`
- `supabase/config.toml`
- `supabase/tests/batch_65_runtime_setup.sql`
- `supabase/tests/batch_65_runtime_assertions.sql`
- `scripts/test-batch-65-concurrency.sh`
- `supabase/tests/batch_65_runtime_cleanup.sql`
- `docs/batch-65-1-production-rollback.md`

## Boundary of this proof

This validates the Batch 65 and 65.1 SQL/security behavior against an isolated schema shaped after the audited Production contract. It does not copy or mutate Production data. The read-only Production inventory is the evidence for compatibility with current data distributions and existing triggers.

No merge or Production migration is authorized by this result.
