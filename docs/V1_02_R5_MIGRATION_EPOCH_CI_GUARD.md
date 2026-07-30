# V1-02-R5 — Application migration epoch and CI guard

## 0. Control header

| Field | Value |
|---|---|
| Roadmap package | `V1-02` |
| Batch ID | `V1-02-R5` |
| Status | `PR_OPEN / CI_PASS` |
| Owner | `ChatGPT / Petru` |
| Application base SHA | `b81480e4c2d6275ad03e78b33c1715f8ca781c6b` |
| Working branch | `agent/v1-02-r5-migration-epoch-ci-guard` |
| Active PR | `#563` |
| Verified implementation head before this final evidence correction | `34a7abacd4ca0f818e0e4d13ef8de9c11c214322` |
| Start date | `2026-07-30` |
| Last update | `2026-07-30T19:45:00+03:00` |
| Canonical product version | `v2.0.0` |
| Production target | `https://www.swaply.world` |

## 1. Objective

```text
Make the R4 migration classification machine-enforceable in the application repository without changing Supabase Production.
```

## 2. Why this batch exists

R4 classified 140 repository SQL files and 138 Production migration rows. It confirmed one historical repository version collision, logical mappings under different Production timestamps, historical/composite files, mixed partial files and one unsafe Auth one-shot.

The classification was documentary only. Without an application-side guard, generic tooling could still treat the historical directory as a pending queue, accept an unclassified migration or introduce another duplicate version.

## 3. Canonical sources

1. `AI_CONTEXT.md`;
2. `CURRENT_VERSION.md`;
3. `SWAPLY_INDEX.md`;
4. `08_MANUAL/ROADMAP_TO_PRODUCT_COMPLETE.md` — V1-02;
5. `08_MANUAL/BATCH_EXECUTION_TEMPLATE.md`;
6. `07_VERIFICATION/EVIDENCE/V1-02/V1-02_2026-07-30_b81480e_R4-forward-only-migration-reconciliation.md`;
7. `07_VERIFICATION/EVIDENCE/V1-02/V1-02_2026-07-30_b81480e_R4-migration-reconciliation-manifest.json`;
8. application `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, `docs/db/DB_BASELINE.md` and `supabase/migrations`;
9. Supabase Production migration history, read-only.

### Requirement IDs

```text
GA-05, GA-06, GA-07, RG-10
```

## 4. Initial factual state

| Layer | Verified state | Evidence |
|---|---|---|
| Application code | `main` exactly equals the active RC | GitHub comparison |
| Migration directory | 140 SQL files | R4 manifest |
| Production history | 138 rows, zero duplicate versions | Supabase read-only query |
| Historical collision | version `20260324200000` used by two repository files | R4 evidence |
| CI guard | absent | repository inspection |
| Package dependencies | base `package.json` and `package-lock.json` use `reading-time: ^1.5.0` | final base-to-head diff and lockfile inspection |
| Supabase write needed | no | R4 verdict |

## 5. Predictive audit

### Predicted affected files

```text
supabase/migration-governance/r4-classification-snapshot.json
supabase/migration-governance/forward-epoch.json
scripts/check-migration-governance.mjs
.github/workflows/migration-governance.yml
package.json
docs/db/MIGRATION_GOVERNANCE.md
docs/db/DB_BASELINE.md
docs/V1_02_R5_MIGRATION_EPOCH_CI_GUARD.md
```

### Predicted risks

| Risk | Severity | Prevention | Verification |
|---|---|---|---|
| Historical collision makes guard fail | High | exact R4 allowlist | clean-repository guard test |
| New migration omitted from registry | High | reject unclassified SQL | negative self-test |
| Future duplicate version | High | unique-version check after epoch | negative self-test |
| Historical SQL edited | High | CI git-diff rejection | PR diff guard |
| Historical directory replayed automatically | Critical | executable automation scan | negative self-test |
| R5 accidentally changes Production | Critical | no migration/apply operation | Supabase history remains unchanged |
| Full-file replacement changes an unrelated package declaration | High | compare final package manifest to base and lockfile | final diff contains only the two R5 npm commands |

## 6. Scope

### Included

- normalized R4 classification snapshot;
- forward-only epoch registry;
- local/CI guard;
- negative guard self-tests;
- database-governance documentation;
- dedicated GitHub Actions check;
- two npm commands exposing the guard and its self-tests.

### Explicit non-scope

- no Supabase write;
- no migration file added or applied;
- no historical SQL rename/delete/edit;
- no Stories or Swapleni implementation;
- no legacy grant hardening;
- no application runtime behavior change;
- no Vercel configuration change;
- no dependency-version change in the final PR diff.

## 7. Implementation plan

1. Store the normalized R4 classification snapshot and epoch configuration.
2. Add a Node-core guard for inventory, versions, diff immutability and forbidden automation.
3. Add negative self-tests.
4. Add a dedicated PR/main workflow and package commands.
5. Document the permanent policy and update the technical baseline.
6. Open one draft PR and run applicable CI.
7. Correct an intermediate R5 transcription error before the final diff and rerun the complete check set.

Rollback is a repository revert. There is no database rollback because R5 performs no database change.

## 8. Complete file inventory

### Files created

```text
supabase/migration-governance/r4-classification-snapshot.json
supabase/migration-governance/forward-epoch.json
scripts/check-migration-governance.mjs
.github/workflows/migration-governance.yml
docs/db/MIGRATION_GOVERNANCE.md
docs/V1_02_R5_MIGRATION_EPOCH_CI_GUARD.md
```

### Files replaced completely

```text
package.json
docs/db/DB_BASELINE.md
```

### Migrations

```text
NONE
```

## 9. Data and authority contract

`NOT_APPLICABLE` for runtime data mutation. R5 is repository governance only. Browser, API and database authority are unchanged.

## 10. UX contract

`NOT_APPLICABLE`. No UI or user-visible runtime behavior changes.

## 11. Test matrix

| ID | Scenario | Result |
|---|---|---|
| R5-T01 | Current 140-file baseline | `PASS` |
| R5-T02 | Unclassified SQL file | `PASS` — correctly rejected |
| R5-T03 | Two future files share a version | `PASS` — correctly rejected |
| R5-T04 | Automated include-all push command | `PASS` — correctly rejected |
| R5-T05 | Historical migration modified in PR | `PASS` — current PR contains zero SQL migration changes; diff guard active |
| R5-T06 | Registered unique forward migration support | `PASS` — registry contract implemented; no forward migration added in R5 |

## 12. Required checks and observed results

Verified implementation head before this final evidence correction:

```text
34a7abacd4ca0f818e0e4d13ef8de9c11c214322
```

| Check | Result | Evidence |
|---|---|---|
| Migration Epoch Guard — inventory and PR diff | `PASS` | GitHub run `30562489792` |
| Migration Epoch Guard — negative self-tests | `PASS` | GitHub run `30562489792` |
| 43-Locale Contract | `PASS` | CI run `30562489551` |
| Lint & Type | `PASS` | CI run `30562489551` |
| Unit Tests / Vitest | `PASS` | CI run `30562489551` |
| Build | `PASS` | CI run `30562489551` |
| AI Evaluation & Regression Gate | `PASS` | GitHub run `30562489526` |
| Vercel Preview status | `PASS` | GitHub/Vercel status for head `34a7abacd4...` |
| Supabase non-write check | `PASS` | 138 rows; R1 remains head; zero R5 rows; zero duplicate Production versions |

The first CI attempt on an earlier intermediate R5 head failed because the full-file `package.json` replacement accidentally transcribed `reading-time` as nonexistent `^5.1.0`. The base repository and lockfile both use `^1.5.0`. The accidental branch change was removed, and the complete check set then passed. The final base-to-head diff changes `package.json` only by adding the two R5 commands. The failed run is preserved as superseded evidence, not presented as a defect inherited from `main`.

## 13. Evidence plan

```text
EV-V1-02-R5-REPO-001
EV-V1-02-R5-GUARD-001
EV-V1-02-R5-CI-001
EV-V1-02-R5-NONWRITE-001
```

## 14. Rollback and recovery

- revert the R5 repository commit or PR;
- no Supabase forward-fix is required;
- no data restoration is required;
- active pre-R5 RC remains the rollback target until merge;
- after merge, re-freeze the new `main` SHA only after CI and Production verification.

## 15. PR contract

### Branch

```text
agent/v1-02-r5-migration-epoch-ci-guard
```

### PR

```text
#563 — V1-02-R5: enforce forward-only migration epoch
```

No merge without the explicit command `Merge #563`.

## 16. Acceptance criteria

- [x] normalized R4 classification snapshot is stored and hash-verified against its canonical source hash;
- [x] all baseline SQL files are classified;
- [x] unclassified files fail;
- [x] historical changes fail through the PR diff contract;
- [x] new duplicate versions fail;
- [x] the documented historical duplicate remains accepted only in its exact form;
- [x] forbidden automated replay fails;
- [x] applicable CI is green on the implementation head;
- [x] Supabase history remains unchanged after the implementation head;
- [ ] merge occurs only after explicit authorization;
- [ ] post-merge Production/Vercel verification and RC re-freeze are complete.

## 17. Current verdict

```text
VERDICT: PR_OPEN / CI_PASS — merge not authorised
```

### Next single step

```text
Wait for Petru's explicit command `Merge #563`.
```
