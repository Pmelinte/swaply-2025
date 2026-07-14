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
| `V1-DEBT-003` | Train A/B re-audit | The complete Public Visual Audit was not manually rerun solely for the re-audit on the latest `main`. | Closure PRs passed Public Visual Audit; PR #458 also passed Public Visual Audit. This is a point-in-time evidence gap, not a demonstrated failure. | Low | `REVERIFY_AT_E5` | E5 release candidate, or after global shell/public-route changes. | Public Visual Audit passes on the release-candidate commit for required desktop/mobile routes and locales. |

## 3. Items intentionally not entered

The following are not deferred debts because they are active Train C gates:

- the 17 authenticated Batch 60 tests;
- same Exchange ID for both participants;
- Exchange idempotency;
- bilateral completion;
- feedback participant-only;
- outsider denial;
- persistence, Realtime and immutable-ID cleanup;
- repo–Supabase–Production migration parity;
- Train C closure report.

Failure of any of these blocks Train C closure and must be handled in Train C, not postponed to E5.

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
