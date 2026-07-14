# Swaply — V1 Deferred Issues Register

**Document ID:** `SWAPLY-V1-DEFERRED-ISSUES`  
**Last updated:** 2026-07-14  
**Owner:** Train E5 — General Availability audit  
**Purpose:** preserve nonblocking findings without repeatedly interrupting feature development or losing audit evidence.

## 1. Decision policy

Every new finding receives one decision:

- `FIX_NOW` — P0/P1, security/privacy/Auth/RLS, data integrity, blocked CI/build, blocked canonical flow, or faulty foundation for later work.
- `DEFER_TO_E5` — real but nonblocking cleanup, SEO, localization, refactoring, payload, visual or documentation issue.
- `REVERIFY_AT_E5` — a check was not completed or a possible regression is not yet demonstrated.
- `POST_V1` — valid improvement outside the v1 release gates.
- `ACCEPTED` — intentional limitation documented with rationale.
- `CLOSED` — repaired and verified against its closure test.

A deferred issue must not be promoted to `FIX_NOW` without new evidence matching the criteria above.

## 2. Open register

| ID | Origin | Finding | Evidence / current behavior | Severity | Decision | Recheck trigger | Closure test |
|---|---|---|---|---|---|---|---|
| `V1-DEBT-001` | Train B audit | Legacy `@swaply.app` strings remain in translation source files and can be serialized in the page payload. | Public legal pages normalize visible copy to `@swaply.world`; unit tests require normalized output and reject visible `swaply.app`. No confirmed visible user regression. | Low | `DEFER_TO_E5` | E5 localization/legal cleanup, or earlier if the normalizer is removed/touched. | Repository-wide search shows no obsolete public contact domains in shipped locale payloads; legal-copy tests and public pages remain green. |
| `V1-DEBT-002` | Train B audit | Direct live verification of `/sitemap.xml` was not completed in the manual closure re-audit because the connector returned a 502/tool failure. | Sitemap implementation is defensive, sourced from the public route inventory, and covered by unit/CI contracts. No confirmed production sitemap failure. | Medium | `REVERIFY_AT_E5` | E5 SEO audit, or immediately after any sitemap/public-route change. | Production `/sitemap.xml` returns 200, valid XML, canonical `swaply.world` URLs, required static routes and correct locale alternates. |
| `V1-DEBT-003` | Train A/B re-audit | The complete Public Visual Audit was not manually rerun solely for the re-audit on the latest `main`. | Closure PRs passed Public Visual Audit; PR #458 and PR #459 also passed Public Visual Audit. This is a point-in-time evidence gap, not a demonstrated failure. | Low | `REVERIFY_AT_E5` | E5 release candidate, or after global shell/public-route changes. | Public Visual Audit passes on the release-candidate commit for required desktop/mobile routes and locales. |
| `V1-DEBT-004` | Batch 60 authenticated Production validation | Auxiliary AI calls were not fully neutralized during authenticated E2E and produced nonfatal 403/404/429 responses on image analysis, embeddings and item translation endpoints. | The complete Exchange handoff sequence still executed, idempotency and zero-side-effect checks ran, cleanup succeeded, and no grouped Vercel runtime error was found. The failures were outside the primary Batch 60 contract but create test noise and unnecessary external traffic. | Low | `DEFER_TO_E5` | E5 test-harness hardening, or earlier if these calls make an authenticated suite flaky, slow, costly or rate-limited. | Authenticated release-candidate E2E performs no unintended AI/external requests, or explicitly mocks them with deterministic successful/fallback responses; primary flows remain green. |
| `V1-DEBT-005` | Batch 60 workflow audit | The authenticated workflow step display name still says “through Batch 59” although the terminal project dependency graph executes Batch 60. | The command targets `--project=bilateral-match-agreement`, which now resolves to `explicit-exchange-handoff.spec.ts` after the earlier dependencies. Execution is correct; only the human-readable step label is stale. | Low | `DEFER_TO_E5` | Next edit to `.github/workflows/two-user-auth-e2e.yml`, or E5 CI/documentation cleanup. | Workflow step and job labels accurately describe the terminal Batch/deliverable while the command and dependency graph remain unchanged and green. |

## 3. Active Train C gates are not deferred debts

C1 / Batch 60 has been validated and closed. Its same-ID, idempotency, zero-side-effect and cleanup evidence belongs in `docs/batch-60-4-validation-closure.md`, not in this debt register.

The following remain active C2–C5 gates and must not be postponed to E5:

- one canonical server-side Exchange lifecycle after creation;
- participant-only transitions and outsider denial;
- bilateral delivery/receipt completion;
- feedback participant-only and correct reputation/ledger effects;
- cancellation, dispute, report and block behavior;
- persistence, Realtime, concurrency, stale-state and immutable-ID cleanup for later lifecycle stages;
- final repo–Supabase–Production migration parity;
- Train C closure report.

Failure of any of these blocks the relevant Train C deliverable and must be handled in Train C.

## 4. Update rules

For every new row:

1. cite the repository file, PR, test, Production observation or runtime evidence;
2. distinguish confirmed failure from unverified suspicion;
3. record user impact and severity;
4. define an objective closure test;
5. avoid duplicate entries for the same root cause;
6. do not repair a `DEFER_TO_E5` item opportunistically inside an unrelated feature PR;
7. move to `CLOSED` only after the closure test passes;
8. retain closed rows for release traceability.

## 5. Train E5 processing order

During feature freeze:

1. revalidate every open finding against the release-candidate commit;
2. close findings that no longer reproduce, with evidence;
3. repair confirmed findings in small reviewable batches;
4. rerun relevant unit, build, visual, authenticated E2E and Production checks;
5. require zero open P0/P1 before `v1.0.0`;
6. classify remaining valid nonblocking work as `POST_V1` only through an explicit decision.

## 6. Scope protection

This register prevents two opposite errors:

- repeatedly polishing closed Trains while active product work remains unfinished;
- forgetting real findings until launch.

It is not permission to postpone security, privacy, RLS, data-integrity or canonical-flow failures.
