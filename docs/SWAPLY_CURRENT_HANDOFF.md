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
| C2 — Canonical Exchange lifecycle | `ACTIVE` | Batch 61.1 closed; Batch 61.2 implemented and awaiting full validation. |
| C3 — Feedback, notifications, reputation and ledger | `PLANNED` | After C2. |
| C4 — Cancellation, disputes, report and block | `PLANNED` | Before Train C closure. |
| C5 — Train C closure audit | `PLANNED` | Required before Train D. |
| Train D | `PLANNED` | Starts only after Train C closes. |
| Train E | `PLANNED` | Ends with `SWAPLY_V1_GA`; no Train F. |

## 4. Verified Production checkpoint

- Validated main commit before Batch 61.2: `95837cbd94b22f0264a83b3e4f1ad87411660c0b`
- Production target: `https://www.swaply.world`
- Batch 61.1 canonical status migration: `20260714192055_batch_61_1_canonical_swap_lifecycle`
- Vercel: READY
- `/en/exchange`: HTTP 200
- `/en/messages`: HTTP 200
- Production runtime after Batch 61.1 merge: no error, warning or fatal logs in the checked window.

Batch 60 authenticated validation previously demonstrated:

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

Detailed C1 evidence is in `docs/batch-60-4-validation-closure.md`.

## 5. Closed Batch 61.1 contract

Batch 61.1 established one global `swaps.status` vocabulary:

`pending → accepted → in_progress → completed`

with controlled terminal or exceptional branches:

- `rejected`;
- `cancelled`;
- `expired`;
- `disputed`.

Logistics detail and dispute resolution outcomes are not global statuses.

## 6. Current Batch 61.2 contract

Batch 61.2 establishes one database transition authority:

- authenticated RPC `transition_swap_v1`;
- internal non-public primitive `apply_swap_transition_v1`;
- row lock and expected-status compare-and-set;
- private idempotency registry;
- atomic status update plus `swap_events` audit;
- responder-only pending acceptance/rejection;
- requester-only pending cancellation;
- system-only expiry using the same primitive;
- temporary trigger bridge for legacy authenticated direct writes;
- rejection of direct privileged bypass.

Detailed scope and boundaries are in
`docs/batch-61-2-single-transition-authority.md`.

## 7. C2 boundary after Batch 61.2

Batch 61.2 does not yet prove:

- bilateral delivery or receipt confirmation;
- completion only after both participants confirm;
- exactly-once item, conversation, notification, trust or token effects;
- canonical logistics and Realtime behavior;
- full cancellation and dispute handling.

Therefore C2 remains `ACTIVE` after Batch 61.2.

## 8. Production schema finding

The old transition route referenced a `swap_bundles` table that does not exist in
Production. Batch 61.2 removes that dependency and does not invent a replacement
table outside an approved bundle contract.

The current participant UPDATE policy still allows non-status fields to be
updated directly. Batch 61.2 protects the global status transition authority;
field-specific confirmation, logistics and feedback writes are addressed in the
following batches.

## 9. Triage policy

- `FIX_NOW`: security, privacy, authorization, data integrity, blocked CI/build, blocked canonical flow or faulty foundation.
- `DEFER_TO_E5`: confirmed but nonblocking cleanup or quality issue.
- `REVERIFY_AT_E5`: evidence gap without demonstrated failure.
- `POST_V1`: valid improvement outside v1 gates.

Current deferred additions:

- `V1-DEBT-004`: auxiliary AI calls create nonfatal authenticated-E2E noise;
- `V1-DEBT-005`: workflow display label says Batch 59 although the dependency graph executes Batch 60.

Do not repair deferred items inside C2 lifecycle PRs unless new evidence promotes them to `FIX_NOW`.

## 10. Validation required for Batch 61.2

Before closure:

1. unit tests, lint, typecheck and build;
2. migration contract tests;
3. Vercel Preview and runtime smoke;
4. repository–Supabase migration parity;
5. authenticated requester/responder role checks;
6. outsider denied;
7. stale expected status rejected;
8. concurrent conflicting transitions allow only one winner;
9. same-key retry returns the same response without duplicate event;
10. reused key for a different request is rejected;
11. direct privileged bypass is rejected;
12. persistence after reload;
13. cleanup by immutable IDs.

A green build alone does not prove the authenticated business contract.

## 11. Exact next action

1. Complete CI and Preview validation for Batch 61.2.
2. Apply the reviewed migrations to Production only after static gates are green.
3. Align repository migration filenames with the actual Production migration versions.
4. Run authenticated CAS, concurrency, idempotency, outsider and cleanup validation.
5. Merge only after the exact command `Merge #...`.
6. After merge verify Production and begin Batch 61.3 — Bilateral Completion.
7. Do not begin Train D before Train C is formally closed.

## 12. Maintenance rule

After each merged batch, record the latest verified evidence, remove stale next
actions and keep detailed history in dedicated reports.
