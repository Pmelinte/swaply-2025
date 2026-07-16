# Batch 65 — Contract test matrix

| ID | Contract | Expected result |
|---|---|---|
| S01 | Additive profile columns | Present with deterministic defaults |
| S02 | Locale registry | 43/43 locales match application config |
| S03 | Language backfill | primary → secondary → tertiary, distinct and valid |
| P01 | Public profile disabled | No row remains in `public_profiles` |
| P02 | Public location | City/country only; no address or coordinates |
| P03 | Optional social fields | Public only after explicit visibility consent |
| C01 | Profile update CAS | Stale revision rejected with `40001` |
| C02 | Idempotent replay | Same key and payload returns replay without new revision |
| C03 | Conflicting replay | Same key with changed payload rejected |
| R01 | Direct browser update | Denied; canonical RPC required |
| R02 | Owner update | Actor derived from `auth.uid()` |
| R03 | Outsider identity request | Denied unless an existing participant relationship exists |
| R04 | Participant identity | Minimal identity only, no private fields |
| R05 | Moderator/admin identity | Explicit role-based minimal access |
| G01 | Function security | Explicit `search_path`; narrow grants |
| G02 | Revision guard | Initial revision forced to 1 and server-controlled |

This matrix is pinned by `src/lib/profile/globalProfileMigration.test.ts`. Runtime RLS, two-session concurrency, reload persistence and cleanup tests remain required before Batch 65 closure.
