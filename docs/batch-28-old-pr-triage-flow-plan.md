# Batch 28: Old PR triage and flow acceleration plan

## Purpose

After Batches 23–27 stabilized production runtime warnings and route-specific canonical metadata, this batch documents the remaining open pull requests and defines the safer acceleration path.

This batch does not merge, close, or rewrite the old PRs. It records what should be salvaged and what should be rebuilt from current `main`.

## Current open PRs reviewed

### PR #362 — Add admin diagnostic smoke check

Status at triage:

- Open.
- Not merged.
- Not merge-ready as-is.
- Small scope: one Playwright smoke test for `/en/admin/diagnostic`.

Useful idea:

- Keep the concept of an admin diagnostic smoke test.

Reason not to merge as-is:

- The test expects auth/login copy to be visible even when the route itself may be reachable.
- A safer version should accept either the login-gated state or the real diagnostic page heading.
- Rebuild from current `main` as a new test-only batch.

Recommended action:

- Do not merge #362.
- Rebuild as a fresh batch only if admin diagnostics remain a priority.

### PR #366 — Clean up canonical route usage

Status at triage:

- Open.
- Not merged.
- Stale relative to Batches 26 and 27.
- Contains useful route inventory / redirect ideas.

Useful ideas:

- Keep legacy redirects such as `/items` → `/objects` if still missing.
- Keep a canonical route inventory if current code still benefits from it.
- Improve public route smoke tests.

Reason not to merge as-is:

- Batches 26 and 27 already handled a major part of route-specific canonical metadata.
- The smoke test only treats HTTP 5xx as failure, so 404/401 on public canonical routes could still pass.
- Rebuild the useful parts from current `main` with stricter checks.

Recommended action:

- Do not merge #366 as-is.
- Rebuild selected pieces as a fresh route-contract test batch.

### PR #375 — Add swap status updates

Status at triage:

- Open.
- Not merged.
- High-risk application logic.
- Touches swap status transitions, item reservation/release/completion, notifications, duplicate swap protection, and an API route.

Useful ideas:

- Guarded swap status transitions.
- Item reservation during active swaps.
- Marking items exchanged/inactive after completion.
- Notifications when swap status changes.
- Duplicate swap protection.

Reason not to merge as-is:

- It changes multiple business-critical areas at once.
- It needs schema/RLS compatibility checks.
- It needs integration tests, not only build checks.
- It should be rebuilt as smaller batches after the Objects and Matching flows are audited.

Recommended action:

- Do not merge #375 as-is.
- Convert its ideas into a later Exchange-flow roadmap.

## Acceleration rules from here

### Keep small batches for risky areas

Use small batches for:

- Supabase schema/RLS.
- Auth.
- Objects CRUD.
- Matching persistence.
- Chat/messages.
- Swap/exchange state transitions.
- Notifications.

### Allow larger batches for low-risk areas

Larger batches are acceptable for:

- Documentation.
- Test-only improvements.
- Metadata.
- Static copy.
- Public route audits.
- Isolated UI slots that do not touch database or auth.

### Every functional batch should have a validation contract

Each functional batch should state:

- Which routes are touched.
- Which database tables are touched.
- Which user flow is affected.
- Which tests prove it is safe.
- Which Vercel live routes must be checked after merge.

## Proposed next 10 batches

### Batch 29 — Public route contract smoke tests

Rebuild the safe part of PR #366 from current `main`.

Target:

- Verify public canonical routes return HTTP `< 400`.
- Verify legacy routes redirect to canonical routes.
- Verify screenshots are captured even on failure.

No UI, DB, or auth changes.

### Batch 30 — Admin diagnostic smoke test, safe version

Rebuild the useful part of PR #362 from current `main`.

Target:

- `/en/admin/diagnostic` must either redirect to login or render the diagnostic page.
- Test must not assume only one auth state.

No application code changes.

### Batch 31 — Objects flow audit

Audit live/current behavior for:

- `/en/objects`
- `/en/objects/add`
- object detail
- object edit
- my objects
- image fallback
- login gating

Output should be a document first, not code.

### Batch 32 — Objects add/edit stability patch

Implement only the first confirmed issue from Batch 31.

### Batch 33 — Objects image handling patch

Improve upload/fallback/metadata handling only if Batch 31 confirms a live problem.

### Batch 34 — Matching flow audit

Audit selection, express interest, login gating, and public preview behavior.

### Batch 35 — Matching persistence patch

Implement the smallest safe persistence improvement confirmed by Batch 34.

### Batch 36 — Messages/chat flow audit

Audit conversations, message state, translation-disabled fallback, attachments placeholder, and login gating.

### Batch 37 — Exchange flow audit

Audit local/courier/vacation/property/service exchange pages and state copy.

### Batch 38 — Swap status transition design contract

Convert PR #375 ideas into a documented state-machine contract before code:

- allowed statuses;
- actor permissions;
- item reservation rules;
- completion rules;
- cancellation/release rules;
- notification rules;
- required tests;
- required schema/RLS assumptions.

## Immediate recommendation

Next implementation batch should be **Batch 29: Public route contract smoke tests**.

This is the fastest safe acceleration because it expands automated coverage before we start touching Objects, Matching, Chat, or Exchange business logic.
