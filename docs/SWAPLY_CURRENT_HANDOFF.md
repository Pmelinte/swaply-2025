# Swaply — Current Project Handoff

**Repository path:** `docs/SWAPLY_CURRENT_HANDOFF.md`  
**Last updated:** 2026-07-14  
**Purpose:** latest verified operational checkpoint and next Train C action.

## 1. Source-of-truth order

1. Current code, migrations, tests and Production evidence.
2. This handoff.
3. `docs/ROADMAP_TO_V1.md`.
4. `docs/SWAPLY_PRODUCT_MEMORY.md`.
5. Current technical contracts reconciled with migrations.
6. Closure reports and historical batch notes.
7. Older chat summaries.

## 2. Permanent rules

- Swaply remains global-first across Objects, Properties, Services and Events.
- Global navigation and contextual drawers remain separate.
- Blog and Stories remain separate.
- Tokens and trust rank remain separate.
- AI is advisory and every AI flow needs a fallback.
- Do not remove functionality without explicit approval.
- Database changes require reviewed versioned migrations and Production verification.
- Use small reviewable batches.
- Merge only after Petru gives the exact `Merge #...` command.
- After merge verify CI, Vercel Production and relevant runtime/database evidence.

## 3. Program status

| Train / deliverable | Status | Evidence / next gate |
|---|---|---|
| Train A | `CLOSED` | Batch 40 closure report. |
| Train B | `CLOSED` | Batch 47 closure report; nonblocking findings stay in the deferred register. |
| Train C | `ACTIVE` | C1 closed; C2 active. |
| C1 — Batch 60 handoff and validation | `CLOSED` | `docs/batch-60-4-validation-closure.md`. |
| C2 — Canonical Exchange lifecycle | `ACTIVE` | Start with predictive audit only. |
| C3 — Feedback, notifications, reputation and ledger | `PLANNED` | After C2. |
| C4 — Cancellation, disputes, report and block | `PLANNED` | Before Train C closure. |
| C5 — Train C closure audit | `PLANNED` | Required before Train D. |
| Train D | `PLANNED` | Starts only after Train C closes. |
| Train E | `PLANNED` | Ends with `SWAPLY_V1_GA`; no Train F. |

## 4. Verified Production checkpoint

- Validated commit: `f422588e4c7480178e1faf8cdb6ba9d43ca2b105`
- Production deployment: `dpl_xmzyHnSVSE6ZJUtJ3rV8n9EFFxNF`
- Target: `https://www.swaply.world`
- Vercel: READY
- Public smoke: HTTP 200

Batch 60 authenticated validation demonstrated:

- both participants confirmed the same agreement revision;
- no Exchange existed before the explicit action;
- the first RPC call created one Exchange;
- both participants opened the same Exchange ID;
- retry reused the same Exchange without duplicates;
- the frozen snapshot matched the confirmed revision;
- Match, conversation and Exchange links were consistent;
- item, token, trust and notification state did not change from the handoff;
- cleanup removed the Exchange and restored the Match fixture;
- final inspection found no orphan or broken Exchange links.

Detailed evidence is in `docs/batch-60-4-validation-closure.md`.

## 5. C1 closure boundary

C1 proves only:

`confirmed Match agreement → explicit Create Exchange → one idempotent linked Exchange`.

It does not prove logistics, receipt, bilateral completion, feedback, reputation effects, cancellation, disputes, report/block or final Train C closure.

## 6. Current objective — C2

C2 must establish one canonical server-side Exchange lifecycle after creation.

The first C2 step is analysis-only. Inventory before implementation:

1. all Exchange/Swap statuses and legacy aliases;
2. every UI, API and SQL transition path;
3. functions, triggers, constraints, grants and RLS;
4. participant, outsider and admin authorization;
5. item-state, notification, trust and token effects;
6. Realtime and reload behavior;
7. cancellation and dispute paths;
8. current tests and Production migration parity;
9. concurrency, stale state, idempotency and cleanup behavior.

The audit must produce one state diagram, transition matrix, authorization matrix, contradiction list, batch plan and E2E acceptance plan.

Do not change application code, migrations or Production during the initial C2 audit.

## 7. Triage policy

- `FIX_NOW`: security, privacy, authorization, data integrity, blocked CI/build, blocked canonical flow or faulty foundation.
- `DEFER_TO_E5`: confirmed but nonblocking cleanup or quality issue.
- `REVERIFY_AT_E5`: evidence gap without demonstrated failure.
- `POST_V1`: valid improvement outside v1 gates.

Current additions:

- `V1-DEBT-004`: auxiliary AI calls create nonfatal authenticated-E2E noise;
- `V1-DEBT-005`: workflow display label says Batch 59 although the dependency graph executes Batch 60.

Do not repair deferred items inside C2 lifecycle PRs unless new evidence promotes them to `FIX_NOW`.

## 8. Validation required for authenticated feature batches

Applicable checks include unit tests, lint, typecheck, build, public visual audit, Preview, authenticated two-user E2E, outsider denial, persistence, Realtime, concurrency, stale state, idempotency, immutable-ID cleanup and post-merge Production verification.

A green build alone does not prove an authenticated business flow.

## 9. Batch 60.4 scope

Batch 60.4 is documentation-only:

- adds the authenticated Production validation report;
- marks C1 closed and C2 active;
- updates this handoff;
- records nonblocking E2E/documentation debt;
- does not alter application code, database schema, policies, APIs, business logic or Production data.

It does not close Train C.

## 10. Exact next action

1. Merge Batch 60.4 only after CI is green and explicit approval.
2. Verify Production deployment and runtime.
3. Begin C2 in audit-only mode.
4. Complete lifecycle and authorization matrices before implementation.
5. Split implementation into small batches.
6. Do not begin Train D before Train C is formally closed.

## 11. Maintenance rule

After each merged batch, record the latest verified evidence, remove stale next actions and keep detailed history in dedicated reports.
