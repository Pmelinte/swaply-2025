# Swaply — Train E Handoff

**Last updated:** 2026-07-26
**Repository:** `Pmelinte/swaply-2025`
**Production:** `https://www.swaply.world`
**Canonical main checkpoint:** `297c6a0e2568ba3062bedb125b7789424d720397`

## Current status

- Train A — CLOSED
- Train B — CLOSED
- Train C — CLOSED
- Train D — CLOSED
- Train E — ACTIVE
- Train E is the final train before `v1.0.0`; there is no Train F.

## Train D closure

Train D is formally closed through `docs/TRAIN_D_CLOSURE_REPORT.md` with milestone:

`PUBLIC_BETA_READY_COMPLETE_PRODUCT`

Delivered and retained in `main`:

- global-first profile and language preferences;
- Objects, Properties, Services and Events;
- cross-domain Explore and matching;
- participant-authorized Chat and Exchange logistics;
- completion, cancellation, disputes, reviews and trust effects;
- Stories consent/moderation foundation;
- Blog editorial and contribution foundation;
- Swapleni ledger separated from trust rank;
- report, block, moderation, anti-abuse and admin foundations;
- global notifications and privacy-minimized public data.

A later defect is treated as a regression or controlled maintenance item and does not reopen a closed train automatically.

## Train E fixed deliverables

### E1 — AI platform foundation

- audit existing `src/lib/ai` implementation before changing it;
- preserve the modular server-side AI gateway;
- model registry and task routing;
- prompt/schema versioning;
- timeout and provider fallback;
- cache, cost, latency and error observability;
- internal evaluation framework;
- no paid provider activation without explicit owner approval.

### E2 — Product AI

- item vision/classification;
- translation and original-message preservation;
- moderation with human-review escalation;
- semantic matching and explainable scoring;
- non-AI fallback for every critical flow;
- human confirmation for metadata, matching and publication decisions.

### E3 — Advanced exchanges

- one-to-many and many-to-one;
- cross-domain packages;
- circular swaps with three users;
- chains with four or five users;
- consent from every participant;
- no automatic finalization by AI.

### E4 — Monetization and integrations

- exchange remains untaxed;
- monetization only through connected services, boosts, subscriptions, affiliates or third-party commissions;
- payment and webhook authority server-side;
- explicit approval required before new paid services, subscriptions or external costs.

### E5 — General Availability closure

- full repository, Production and migration parity audit;
- backup, restore and rollback evidence;
- security, privacy, legal, accessibility and performance gates;
- no open P0/P1 blockers;
- release notes and final handoff;
- explicit owner authorization before production release/tag;
- publish `v1.0.0` and close Train E.

## Permanent operating rules

- Romanian responses and small steps.
- One active batch and one active PR at a time.
- No merge without Petru's explicit command `Merge #...`.
- After every merge: GitHub CI, Vercel Production, critical routes, runtime logs and migration parity.
- No destructive migration or history rewrite.
- No client-controlled authority for Auth, RLS, matching, Chat, Exchange, ledger or payments.
- Swaply remains global-first across all active locales.
- Blog and Stories remain separate.
- Swapleni and trust rank remain separate.
- AI advises; people decide.

## Immediate next action

Start **E1.1 — read-only AI architecture inventory and gap matrix**.

The first step must not change code. It must inventory:

1. AI gateway, providers, task router and model registry;
2. current AI API routes and direct provider calls outside the gateway;
3. schemas, prompts, caches and logging;
4. vision, translation, moderation and matching implementations;
5. fallback behavior and paid-provider dependencies;
6. tests and evaluation cases;
7. exact gaps blocking E1 closure.

Only after this matrix is complete should a small implementation batch be proposed.
