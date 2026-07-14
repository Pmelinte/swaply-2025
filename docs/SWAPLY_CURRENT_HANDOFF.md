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
- Use small reviewable batches.
- Merge only after Petru gives the exact `Merge #...` command.
- After merge verify CI, Vercel Production and relevant runtime/database evidence.

## 3. Program status

| Train / deliverable | Status | Evidence / next gate |
|---|---|---|
| Train A | `CLOSED` | Batch 40 closure report. |
| Train B | `CLOSED` | Batch 47 closure report. |
| Train C | `ACTIVE` | C1 closed; C2 active. |
| C1 — Batch 60 handoff and validation | `CLOSED` | `docs/batch-60-4-validation-closure.md`. |
| C2 — Canonical Exchange lifecycle | `ACTIVE` | Batch 61.1 closed; Batch 61.2 Production-validated on canonical PR #462, merge pending. |
| C3 — Feedback, notifications, reputation and ledger | `PLANNED` | After C2. |
| C4 — Cancellation, disputes, report and block | `PLANNED` | Before Train C closure. |
| C5 — Train C closure audit | `PLANNED` | Required before Train D. |
| Train D | `PLANNED` | Starts only after Train C closes. |
| Train E | `PLANNED` | Ends with `SWAPLY_V1_GA`; no Train F. |

## 4. Verified checkpoint

- Main before PR #462: `95837cbd94b22f0264a83b3e4f1ad87411660c0b`
- Production: `https://www.swaply.world`
- Batch 61.1 migration: `20260714192055_batch_61_1_canonical_swap_lifecycle`
- Canonical Batch 61.2 migrations:
  - `20260714201653_batch_61_2_single_swap_transition_authority`
  - `20260714201719_batch_61_2_transition_guard_bridge`
  - `20260714202043_batch_61_2_swap_transition_authority` — superseded historical marker
  - `20260714202251_batch_61_2_authority_marker_reset_hardening`
  - `20260714202934_batch_61_2_parallel_authority_reconciliation`
  - `20260714203949_batch_61_2_authority_consolidation` — superseded historical marker
  - `20260714204113_batch_61_2_remove_bundle_dependency` — superseded historical marker
  - `20260714204708_batch_61_2_late_parallel_reconciliation`
- Production after final validation: 401 Swap rows, zero invalid statuses, zero transition-request test rows and zero rollback-probe events.

## 5. Closed Batch 61.1 contract

Global `swaps.status` vocabulary:

`pending → accepted → in_progress → completed`

Controlled exceptional or terminal branches:

- `rejected`;
- `cancelled`;
- `expired`;
- `disputed`.

Logistics details and dispute outcomes are not global statuses.

## 6. Batch 61.2 contract

One database transition authority controls global status:

- public authenticated RPC `transition_swap_v1`;
- internal non-public `apply_swap_transition_v1`;
- row lock and expected-status CAS;
- private idempotency registry;
- atomic status update plus one `swap_events` audit;
- responder-only pending acceptance/rejection;
- requester-only pending cancellation;
- system-only expiry;
- outsider denial;
- privileged direct-bypass denial;
- temporary legacy authenticated bridge;
- immutable requester, responder and item identity after creation;
- no dependency on the absent `swap_bundles` table.

The API and decision/completion/Exchange adapters use the authenticated RPC
instead of direct status writes.

Detailed evidence: `docs/batch-61-2-single-transition-authority.md`.

## 7. Validation evidence

The repository and Production contract were reconciled after two separate
parallel-migration incidents. The closed duplicate PR #463 must never be merged.
PR #462 is the only canonical Batch 61.2 branch.

The final Production rollback probe passed:

1. canonical responder acceptance;
2. same-key replay and one event;
3. conflicting reuse of a key rejected;
4. stale expected state rejected;
5. requester cannot accept;
6. responder can reject;
7. outsider denied;
8. privileged direct bypass denied;
9. legacy authenticated write routed through the same authority;
10. requester can cancel pending;
11. expected idempotency row cardinality;
12. system expiry through the same primitive;
13. participant and item identity immutability;
14. immediate authority-marker reset.

The probe ended with `ROLLBACK`. Final checks confirmed:

- 401 Swap rows;
- zero incompatible status rows;
- zero transition-request test rows;
- zero rollback-probe events;
- parallel config table absent;
- parallel RPC absent;
- parallel trigger absent.

## 8. C2 boundary after Batch 61.2

Still not proven or implemented:

- bilateral delivery and receipt confirmation;
- completion only after both participants confirm;
- exactly-once item, conversation, notification, trust and token effects;
- canonical logistics lifecycle and Realtime;
- complete cancellation and dispute handling.

Therefore C2 remains `ACTIVE`.

## 9. Production schema notes

- `swap_bundles` does not exist; Batch 61.2 does not invent it.
- `swap_transition_requests` has RLS and no direct `anon`/`authenticated` table access.
- `transition_swap_v1` is the authenticated entrypoint.
- `apply_swap_transition_v1` has no execute grant for browser roles or `service_role`.
- The participant UPDATE policy still permits non-status fields; confirmation,
  logistics and feedback writes remain for following batches.
- Historical completion/cancel/dispute triggers remain and must be reconciled
  with exactly-once effects in Batch 61.3/C3.

## 10. Triage policy

- `FIX_NOW`: security, privacy, authorization, data integrity, blocked CI/build or broken canonical flow.
- `DEFER_TO_E5`: confirmed nonblocking cleanup or quality issue.
- `REVERIFY_AT_E5`: evidence gap without demonstrated failure.
- `POST_V1`: valid improvement outside v1 gates.

Current deferred items:

- `V1-DEBT-004`: auxiliary AI calls create nonfatal authenticated-E2E noise;
- `V1-DEBT-005`: workflow display label says Batch 59 although its graph executes Batch 60.

## 11. Exact next action

1. Wait for all GitHub CI and Vercel Preview checks on the final PR #462 head.
2. Audit the final head SHA and changed-file scope.
3. Do not merge until Petru gives the exact command `Merge #462`.
