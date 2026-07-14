# Swaply — Current Project Handoff

**Repository path:** `docs/SWAPLY_CURRENT_HANDOFF.md`  
**Last updated:** 2026-07-14  
**Purpose:** concise operational checkpoint for new chats, coding agents and the next Train C batch.

> This file describes the latest verified operating state. It does not replace `docs/ROADMAP_TO_V1.md` or `docs/SWAPLY_PRODUCT_MEMORY.md`.

## 1. Source-of-truth order

When instructions or assumptions conflict, use this order:

1. current repository code, migrations, tests and Production evidence;
2. this handoff;
3. `docs/ROADMAP_TO_V1.md`;
4. `docs/SWAPLY_PRODUCT_MEMORY.md`;
5. `docs/db/DB_BASELINE.md`, reconciled with current migrations;
6. closure reports and batch documentation;
7. older chat summaries as historical context only.

Never treat an old chat statement as more reliable than current repository or runtime evidence.

## 2. Permanent operating rules

- Swaply is global-first, not RO/EN-first.
- Preserve the four domains: Objects, Properties, Services and Events.
- Preserve global navigation: Home, Explore, Matching, Messages and Exchange.
- Do not duplicate global navigation inside contextual drawers.
- Blog and Stories remain separate systems.
- Swapleni/tokens and trust rank remain separate systems.
- AI is advisory; the human decides; every AI flow needs a non-AI fallback.
- Do not remove existing functionality without explicit approval.
- Do not change Auth, RLS, policies, secrets, API contracts or Supabase schema without audit and justification.
- Every DB change uses a versioned migration and must be verified in Production.
- Work in small, reviewable batches.
- No merge without Petru's exact command: `Merge #...`.
- After every merge verify GitHub CI, Vercel Production and relevant runtime/database evidence.

## 3. Program status

| Train | Status | Evidence / next gate |
|---|---|---|
| A — Public shell and navigation | `CLOSED` | Batch 40 closure report and verified public shell evidence. Later defects are regressions, not automatic reopening. |
| B — Public content, SEO, legal and trust | `CLOSED` | Batch 47 closure report, SEO contracts, CI and Production evidence. Nonblocking findings are tracked in `docs/V1_DEFERRED_ISSUES.md`. |
| C — Authenticated one-to-one Objects engine | `ACTIVE` | Batch 60.1–60.2 merged; authenticated Batch 60 closure validation remains mandatory. |
| D — Four-domain complete product | `PLANNED` | Starts only after Train C is closed. |
| E — AI, advanced swaps, commercialization and GA | `PLANNED` | Ends with `SWAPLY_V1_GA`; there is no Train F. |

## 4. Current `main` checkpoint

- Main commit: `24dab3c56c3f4ccb131c9914ed4a9fa22585e1b1`
- Merged PR: **#458 — Batch 60.1–60.2 — explicit Exchange handoff and drift hardening**
- PR head: `9808684f0421aebfc35766e941fe009e1e5f7d68`
- Merge status: merged into `main`
- Vercel status on the merge commit: success / Production deployment READY

### Batch 60.1 verified contract

- both Match participants confirm the same saved agreement revision;
- `Create Exchange` remains an explicit human action;
- the server creates or reuses one linked Exchange;
- both participants resolve the same Exchange ID;
- the agreement is copied as an immutable Exchange snapshot;
- handoff adds no token, notification, trust, item-state, payment, escrow, insurance or completion side effect.

### Batch 60.2 verified contract

- forward-only repair migration restores the reviewed hardened wrapper;
- bilateral and completed-agreement checks are enforced;
- `agreement_revision` remains in the response contract;
- internal implementation is not directly executable by `anon`, `authenticated` or `PUBLIC`;
- `swaps_conversation_id_unique` is the canonical idempotency guard;
- Production integrity checks found no broken conversation/swap or match/swap links in the inspected state;
- Unit Tests, Lint & Type Check, Build and Public Visual Audit passed on the PR;
- Vercel Preview was READY.

## 5. What is not yet proven

Train C is not closed. The following remain active gates and must not be deferred to Train E:

1. complete authenticated Batch 60 suite, including the planned 17 tests;
2. same Exchange ID visible to both participants in the real two-user flow;
3. idempotent repeated creation without duplicate Exchange records;
4. participant-only access and outsider denial;
5. persistence after reload;
6. Realtime synchronization;
7. immutable-ID cleanup with no public test data left behind;
8. final repo–Supabase–Production migration parity;
9. Train C closure report.

A green build or public visual audit alone is not sufficient evidence for these authenticated contracts.

## 6. Current documentation batch

**Batch 60.3 — Canonical Roadmap & V1 Deferred Issues Register**

Scope is documentation-only:

- add `docs/ROADMAP_TO_V1.md`;
- add `docs/DOC_STATUS.md`;
- add `docs/V1_DEFERRED_ISSUES.md`;
- replace this stale Batch 52 handoff with the current Batch 60 checkpoint;
- no application, migration, Auth, RLS, API or business-logic change.

Batch 60.3 does not close Train C and does not prove new runtime behavior.

## 7. Finding triage rule

Use the fixed policy from the roadmap:

- `FIX_NOW`: P0/P1, security/privacy/Auth/RLS, data integrity, blocked CI/build, blocked canonical flow or faulty foundation.
- `DEFER_TO_E5`: confirmed but nonblocking cleanup, SEO, localization, payload, refactoring, visual or documentation issue.
- `REVERIFY_AT_E5`: evidence gap or possible regression not yet demonstrated.
- `POST_V1`: valid improvement outside v1 gates.

Do not opportunistically repair deferred items inside unrelated Train C feature PRs.

## 8. Required validation for every authenticated batch

A batch is not complete until all applicable checks pass:

1. Unit Tests;
2. ESLint;
3. TypeScript;
4. Next.js Build;
5. Public Visual Audit;
6. Vercel Preview;
7. authenticated E2E against the Preview URL;
8. second-user authorization checks where ownership matters;
9. persistence after reload;
10. Realtime checks where applicable;
11. cleanup by immutable record ID;
12. database verification that no public test data remains;
13. Production and migration verification after merge;
14. merge only after explicit approval.

## 9. Exact next action after Batch 60.3

1. Wait for CI on the documentation PR.
2. Merge only after Petru gives the exact command.
3. Verify the resulting Production deployment.
4. Start a narrow **Batch 60 authenticated closure validation**.
5. Run the complete two-user suite and record exact pass/fail evidence.
6. Repair only reproducible blockers in small sub-batches.
7. Close C1 only when all Batch 60 gates are proven.
8. Continue C2–C4, then execute C5 closure audit.
9. Do not begin Train D before Train C is formally closed.

## 10. Ready-to-use prompt for the next functional chat

```text
Continuăm proiectul Swaply — Train C.

Citește integral:
1. docs/ROADMAP_TO_V1.md
2. docs/SWAPLY_CURRENT_HANDOFF.md
3. docs/V1_DEFERRED_ISSUES.md
4. docs/SWAPLY_PRODUCT_MEMORY.md
5. documentația și testele Batch 60 din repository

Checkpoint:
- Train A și Train B sunt CLOSED.
- Train C este ACTIVE.
- PR #458 / Batch 60.1–60.2 este merged în main.
- Main checkpoint: 24dab3c56c3f4ccb131c9914ed4a9fa22585e1b1.
- Exchange handoff și drift hardening sunt implementate.
- Train C nu este închis: validarea autentificată completă Batch 60 rămâne obligatorie.

Primul pas este audit și plan, nu modificare:
- inventariază cele 17 teste și dependențele lor;
- verifică sesiunile User A/User B, RLS, RPC, migrațiile și cleanup-ul;
- definește ordinea testelor, criteriile de acceptare și dovezile necesare;
- clasifică orice constatare ca FIX_NOW, DEFER_TO_E5, REVERIFY_AT_E5 sau POST_V1;
- nu repara observații neblocante din Train A/B în acest batch.
```

## 11. Maintenance rule

Update this file after each merged batch:

- record the latest main commit, PR and verified evidence;
- remove stale “next batch” instructions;
- keep only the current checkpoint and next action;
- move detailed history to batch or closure reports;
- never describe an unverified runtime claim as completed.
