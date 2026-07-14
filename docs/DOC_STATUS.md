# Swaply — Document Status Register

**Document ID:** `SWAPLY-DOC-STATUS`  
**Last updated:** 2026-07-14  
**Purpose:** prevent old documents, chat summaries, and superseded batch notes from overriding current repository evidence.

## 1. Status vocabulary

| Status | Meaning |
|---|---|
| `canonical` | Governs current product direction or operating rules. |
| `current` | Describes the latest verified operational checkpoint. |
| `technical_contract` | Governs a technical area but must be reconciled with current migrations and Production before changes. |
| `closure_evidence` | Formal evidence that a Train, deliverable or Batch was closed. |
| `historical` | Useful for chronology and rationale; must not override canonical/current documents. |
| `idea_bank` | Product or growth ideas without mandatory v1 scope. |
| `superseded` | Replaced by a newer document; retained only for history. |

## 2. Canonical and current documents

| Path | Status | Authority | Maintenance rule |
|---|---|---|---|
| `docs/ROADMAP_TO_V1.md` | `canonical` | Finite Train A–E program, gates, milestone order and anti-scope rules. | Update only when scope or verified Train state changes. No Train F. |
| `docs/SWAPLY_CURRENT_HANDOFF.md` | `current` | Latest operational checkpoint and exact next action. | Update after every merged batch. Keep concise. |
| `docs/SWAPLY_PRODUCT_MEMORY.md` | `canonical` | Permanent product principles and complete product direction. | Do not silently reduce product scope. Reconcile with roadmap for scheduling. |
| `docs/V1_DEFERRED_ISSUES.md` | `current` | Single register for nonblocking issues deferred to E5 or post-v1. | Every entry needs severity, evidence, decision and closure test. |
| `docs/db/DB_BASELINE.md` | `technical_contract` | Database guardrails, RLS and migration discipline. | Current Production and repo migrations outrank the dated snapshot. Update when DB contract changes. |

## 3. Closure evidence

| Path | Status | Scope |
|---|---|---|
| `docs/batch-40-train-a-closure-report.md` | `closure_evidence` | Train A — public shell and navigation. |
| `docs/batch-47-train-b-closure-report.md` | `closure_evidence` | Train B — public content, SEO, legal and trust. |
| `docs/batch-60-4-validation-closure.md` | `closure_evidence` | Train C deliverable C1 — authenticated Batch 60 Production validation and cleanup. This does not close Train C. |

Closure reports are immutable historical evidence. Later regressions are fixed separately and do not rewrite the original closure decision unless the original evidence is proven false.

## 4. Batch documentation

Files named `docs/batch-*.md` are normally `historical` after their PR is merged, except when explicitly classified above as `closure_evidence`.

They may contain:

- the scope and constraints of that batch;
- implementation notes;
- migration details;
- test evidence;
- accepted limitations.

They must not be used alone to infer current behavior. Verify current `main`, current migrations, current tests and Production.

## 5. External memory and chat documents

The long-form document `Swaply_memorie_global_first_drawer_blog_stories_prompturi_agentice_AI_actualizat` is a product-memory source. The repository version `docs/SWAPLY_PRODUCT_MEMORY.md` is the canonical repository reference.

Shared chat links, conversation exports, previous handoffs and assistant summaries are `historical` unless their claims are reproduced in current canonical documents or verified in the repository/runtime.

## 6. Classification rules for newly discovered documents

1. A new document is not canonical merely because it is newer.
2. A document becomes canonical only through an explicit repository change and review.
3. A batch note cannot change the Train map by itself.
4. A closure report records a completed checkpoint; it is not a live backlog.
5. Product ideas that do not satisfy a current gate go to `idea_bank` or `post_v1`.
6. A document containing a stale commit, batch number or runtime claim must be updated or marked `superseded`.
7. Never delete historical evidence solely to reduce clutter; classify it instead.

## 7. Conflict resolution

When documents disagree, use this order:

1. current code, migrations, tests and Production evidence;
2. `docs/SWAPLY_CURRENT_HANDOFF.md`;
3. `docs/ROADMAP_TO_V1.md`;
4. `docs/SWAPLY_PRODUCT_MEMORY.md`;
5. technical contracts such as `docs/db/DB_BASELINE.md`, reconciled with current migrations;
6. closure reports;
7. batch notes and older documents;
8. chat history and assistant summaries.

Any unresolved contradiction must be recorded in `docs/V1_DEFERRED_ISSUES.md` or fixed immediately if it qualifies as `FIX_NOW` under the roadmap.

## 8. Governance rule

Changes to this registry, the roadmap or the handoff are documentation changes. They do not prove application functionality. Functional claims still require the applicable CI, Preview, authenticated E2E, Production and database evidence.
