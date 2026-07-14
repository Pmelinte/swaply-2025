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
| C2 — Canonical Exchange lifecycle | `ACTIVE` | Batch 61.1 closed; Batch 61.2 Production-validated on PR #462, merge pending. |
| C3 — Feedback, notifications, reputation and ledger | `PLANNED` | After C2. |
| C4 — Cancellation, disputes, report and block | `PLANNED` | Before Train C closure. |
| C5 — Train C closure audit | `PLANNED` | Required before Train D. |
| Train D | `PLANNED` | Starts only after Train C closes. |
| Train E | `PLANNED` | Ends with `SWAPLY_V1_GA`; no Train F. |

## 4. Verified checkpoint

- Main before PR #462: `95837cbd94b22f0264a83b3e4f1ad87411660c0b`
- Production: `https://www.swaply.world`
- Batch 61.1 migration: `20260714192055_batch_61_1_canonical_swap_lifecycle`
- Batch 61.2 migrations:
  - `20260714201653_batch_61_2_single_swap_transition_authority`
  - `20260714201719_batch_61_2_transition_guard_bridge`
  - `20260714202043_batch_61_2_swap_transition_authority` — reconciled historical marker
  - `20260714202251_batch_61_2_authority_marker_reset_hardening`
  - `20260714202934_batch_61_2_parallel_authority_reconciliation`
- Production rows after validation: 401 Swap rows, zero invalid statuses and zero transition-request test rows.

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

One database transition authority now controls global status:

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
- immutable requester, responder and item identity after creation.

The API and decision/completion/Exchange adapters use the RPC instead of direct
status writes.

Detailed evidence: `docs/batch-61-2-single-transition-authority.md`.

## 7. Validation evidence

Static gates on the original PR head passed:

- Unit Tests;
- Lint & Type Check;
- Build;
- Public Visual Audit;
- Vercel Preview READY;
- Preview runtime: zero error, warning or fatal logs.

After the final migrations, a Production transaction with rollback passed:

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
11. expected idempotency row cardinality.

The first probe discovered a transaction-local marker leak. Migration
`20260714202251` fixed it and the full probe then passed.

A concurrent parallel migration was detected and reconciled by
`20260714202934`; its second authority and config table are absent from the
final schema.

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
- `swap_transition_requests` has RLS and no direct `anon`/`authenticated` access.
- The participant UPDATE policy still permits non-status fields; confirmation,
  logistics and feedback writes remain for the following batches.
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

1. Wait for all CI and Vercel checks on the final PR #462 head.
2. Verify the final diff and repository–Production migration version parity.
3. Merge only after the exact command `Merge #462`.
4. After merge verify GitHub CI, Vercel Production and runtime.
5. Begin Batch 61.3 — Bilateral Completion.
6. Do not begin Train D before Train C is formally closed.

## 12. Maintenance rule

After every merged batch, record the latest verified evidence, remove stale next
actions and keep detailed history in dedicated reports.
