# Batch 63.4 — C4 Integration Closure

## Purpose

Batch 63.4 is the authenticated integration audit for Train C deliverable C4. It verifies that cancellation, disputes, reports and blocks coexist as one coherent safety system in Production.

This Batch closes **C4 only**. It does not close Train C. Deliverable C5 remains the final Train C closure audit and the gate for `CLOSED_BETA_READY_OBJECTS_ONE_TO_ONE`.

## Scope

The closure audit covers the integrated authority introduced by:

- Batch 63.1 — canonical cancellation;
- Batch 63.2 — canonical dispute opening, evidence and resolution;
- Batch 63.3 — canonical reporting, moderation and block/unblock;
- application adapters and admin paths that consume those authorities;
- Supabase Production migrations, grants, RLS, triggers and runtime state;
- Vercel Production for the merged C4 application surface.

Batch 63.4 introduces no database migration and no new product behavior. Repository changes are limited to regression tests and closure documentation.

## Production baseline

Audited repository commit:

`44d20dbac30d2ce481d99a8510abb218afe39811`

Audited Vercel Production deployment:

`dpl_A7Cb8NXFNKeLfKnw8qwGT2NiHnei`

Supabase Production contained:

- the Batch 63.1 cancel authority migration;
- all four Batch 63.2 dispute migrations;
- all logical Batch 63.3 report/block migrations, including the operational split of report submit and resolution;
- the post-audit `GREATEST` and `LEAST/GREATEST` fixes;
- the terminal-effect foreign-key indexes.

Initial public C4 state was clean:

- zero reports;
- zero blocks;
- zero disputes;
- zero cancel effects;
- zero dispute opening or resolution effects;
- zero safety request or resolution-effect rows.

## Canonical command inventory

Production exposes seven C4 commands:

- `cancel_swap_v1(uuid,text,text,text)`;
- `open_swap_dispute_v1(uuid,text,text,text,jsonb,text)`;
- `add_swap_dispute_evidence_v1(uuid,text,text,text)`;
- `resolve_swap_dispute_v1(uuid,text,text,text)`;
- `submit_safety_report_v1(text,uuid,text,text,jsonb,text)`;
- `resolve_safety_report_v1(uuid,text,text,text,text)`;
- `set_user_block_v1(uuid,boolean,text)`.

All seven functions are:

- `SECURITY DEFINER` functions owned by `postgres`;
- executable by `authenticated` users only, in addition to the owner;
- not executable by `PUBLIC`, `anon` or `service_role`;
- protected internally by `auth.uid()`, participant or moderator checks, validation, CAS and idempotency where applicable.

Relevant guards were enabled for:

- canonical Swap status transitions;
- immutable Swap identity;
- completion authority;
- report and block direct writes;
- dispute and evidence direct writes;
- block barriers on matching interests, conversations, messages and Swaps.

## Integration audit

### 1. Cancellation and dispute are exclusive terminal branches — PASS

A rollback-isolated authenticated probe created two accepted Swaps and executed the two terminal branches independently.

Cancellation produced:

- global status `cancelled`;
- exactly one cancel effect;
- zero dispute rows;
- exact item reactivation and lock removal;
- linked conversation cancellation;
- removal of incomplete completion confirmations;
- two deduplicated notifications.

Dispute opening produced:

- global status `disputed`;
- exactly one dispute-opening effect;
- zero cancel effects;
- exact item reservation preserved;
- linked conversation kept active for investigation;
- removal of incomplete completion confirmations;
- two deduplicated notifications.

Cross-branch attempts were rejected:

- dispute after canonical cancellation: SQLSTATE `40001`;
- cancellation after canonical dispute opening: SQLSTATE `40001`.

No Swap can become both cancelled and disputed, and no branch can overwrite the other after the terminal compare-and-set transition.

### 2. Block prevents new contact but preserves existing cancellation — PASS

While a directed block was active:

- a pending matching interest between the pair became `refused`;
- new conversations were rejected with `42501`;
- new messages were rejected with `42501`;
- new Swaps were rejected with `42501`;
- the blocked user received no block notification.

The existing accepted Swap remained cancellable through `cancel_swap_v1`:

- the Swap became `cancelled`;
- the linked conversation became `cancelled`;
- the historical message remained stored;
- exact reserved items became active and unlocked.

A block is therefore a future-contact barrier, not an obstruction to safely closing an existing lifecycle.

### 3. Block preserves dispute, evidence and moderator resolution — PASS

While A had blocked B:

- B could open a dispute on their existing accepted Swap;
- A could add evidence to the dispute;
- an administrator could resolve the dispute as `resolved_split`.

Final controlled state inside the rollback probe:

- directed block remained present and private;
- global Swap remained terminal `disputed`;
- local dispute became `resolved_split`;
- exactly one evidence row existed;
- exactly one resolution-effect row existed;
- linked conversation became `cancelled` after resolution;
- historical message remained stored;
- exact item locks were released;
- both participants retained their previous trust scores.

Blocking cannot suppress dispute rights, evidence preservation or moderator access.

### 4. Raw reporting is independent from Swap lifecycle — PASS

A controlled real authenticated report was submitted and inspected before exact cleanup.

The command created only:

- one open report;
- one actor-scoped idempotency request;
- one `safety.report_submitted` audit event.

It created no:

- Swap transition;
- block relationship;
- target notification;
- suspension or ban;
- `report_count` increment;
- trust change;
- Swapleni row;
- Review row.

The report, request and audit row were deleted by their exact immutable identifiers. Production returned to zero report and safety-request rows.

### 5. Real two-session cancel-versus-dispute race — PASS

A deterministic accepted Swap fixture was created using two pre-existing archived E2E items that had no Swap, conversation or interest references.

Two independent pg_cron sessions started in the same second:

- cancel session: `2026-07-16T07:43:39.253097Z`;
- dispute session: `2026-07-16T07:43:39.256291Z`.

The dispute session acquired the canonical transition first.

Final race state:

- global Swap status `disputed`;
- exactly one dispute row;
- exactly one dispute request;
- exactly one dispute-opening effect;
- zero cancel effects;
- zero cancel request rows;
- exactly one `accepted → disputed` event and one dispute-opened event;
- exact items remained reserved;
- conversation remained active;
- incomplete completion confirmations were removed.

The cancel session failed only with the expected stale-state error:

`Stale swap status: expected accepted, current disputed`

Repeated scheduled dispute executions were idempotent replay and produced no duplicate effects.

This demonstrates that concurrent cancellation and dispute opening serialize on the same Swap row and cannot produce a mixed terminal state.

## Cleanup — PASS

All Batch 63.4 persistent audit artifacts were removed:

- deterministic Swap and conversation;
- dispute, evidence, requests and effects;
- notifications and Swap events;
- completion-confirmation fixtures;
- pg_cron jobs and run history;
- temporary worker functions.

The two borrowed E2E items were restored exactly to their original state:

- status `archived`;
- `is_active=false`;
- no lock owner, deadline or reason;
- original `updated_at` values restored.

The `set_items_updated_at` trigger was re-enabled and verified after restoration.

Final Production verification showed:

- zero Batch 63.4 fixed-ID rows;
- zero reports, blocks, disputes or C4 effect fixtures;
- zero safety request fixtures;
- zero temporary functions;
- zero active Batch 63.4 cron jobs;
- zero Batch 63.4 cron history;
- E2E profiles restored with unchanged trust and counters;
- no suspension or ban.

## Repository integration contract

`src/lib/safety/c4IntegrationClosure.test.ts` prevents regressions in the integrated C4 contract by asserting:

- mutually exclusive CAS-protected `cancelled` and `disputed` terminal branches;
- branch-specific item, confirmation and conversation cleanup;
- block enforcement only at future contact boundaries;
- preservation of existing history and lifecycle authority under block;
- raw report submission without Swap or sanction effects;
- authenticated-only C4 command grants without `service_role` execution;
- canonical application RPC adapters and absence of executable `abuse_reports` paths.

## Advisor review

Supabase security and performance advisors were reviewed after cleanup.

No finding blocks C4 closure.

Intentional findings:

- private request/effect registries use RLS default-deny without browser policies;
- canonical command functions use `SECURITY DEFINER` with narrow execute grants and internal authorization.

Deferred performance hygiene includes historical secondary foreign-key indexes and unrelated RLS optimization notices. These are not correctness, data-integrity, privacy or authorization blockers and are not expanded into Batch 63.4.

## Production application verification

Vercel Production deployment `dpl_A7Cb8NXFNKeLfKnw8qwGT2NiHnei`:

- target: Production;
- state: `READY`;
- Git commit: `44d20dbac30d2ce481d99a8510abb218afe39811`;
- aliases include `www.swaply.world` and `swaply.world`;
- alias error: none.

`https://www.swaply.world/en/exchange` returned HTTP `200`.

Runtime inspection for `error`, `warning` and `fatal` on the exact deployment returned no logs.

## Closure gate

C4 may be marked `closed` only after the closure branch passes:

- Unit Tests, including the C4 integration contract;
- lint and TypeScript;
- Next.js Production Build;
- Public Visual Audit;
- Vercel Preview and runtime-log inspection;
- explicit merge authorization from Petru.

## Verdict

**Authenticated Production integration audit: PASS.**

**C4 closure status: READY FOR CI/PREVIEW AND EXPLICIT MERGE.**

After this closure PR is merged, the next mandatory deliverable is **C5 — final Train C closure audit**. Train C must not be declared closed before C5 passes and is explicitly merged.
