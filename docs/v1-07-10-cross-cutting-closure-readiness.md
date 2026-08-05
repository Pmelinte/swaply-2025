# V1-07.10 — Cross-cutting closure readiness

## Baseline

- Application main before this PR: `5253d6e17b7ff4dba5053957df8cdc066225b9f4`
- Last merged PR: `#610 — V1-07.9 Policy-driven Swapleni reward authority`
- Vercel Production: `dpl_GR2tntyqbCJ96DTsRjmLby2Acvd3 — READY`
- Supabase migration head: `20260805133249`
- `V1-07 — ACTIVE / NOT CLOSED`
- `SWAPLY_V1_GA — BLOCKED / NOT AUTHORISED`

## Purpose

This batch creates the programmatic boundary between implemented V1-07 authorities and the final cumulative replay. The authoritative manifest is:

`src/lib/v1-07/v1-07-closure-readiness.ts`

It covers all 37 V1-07 IDs exactly once and separates implementation, Production authority, cumulative evidence, canonical blockers and disabled configuration.

## Evidence already delivered

- `#603` — scope and authority contract;
- `#604` — Stories authority and privacy;
- `#605` — Stories moderation, publication, dispute and replay;
- `#606` — Blog locale source and MDX fallback;
- `#607` — Blog editorial authority;
- `#608` — feedback and Trust authority;
- `#609` — Blog feedback and suggestion authority;
- `#610` — policy-driven Swapleni reward authority.

These PRs do not by themselves close V1-07. PR #612 must replay the applicable paths on one exact head.

## Blockers preserved

### Story community visibility

The product requires `private / community / public`; current storage uses `private / participants / public`. This PR does not equate `participants` with `community`. `V107-STORY-003` remains blocked until a canonical decision defines community membership and read authority.

### Swapleni numeric policy

PR #610 added service-controlled policies, source eligibility, idempotency, caps, concurrency serialization and compensating reversals. Reward values, cap values and windows remain inactive because no canonical values are authorised.

Blocked by explicit configuration:

- `V107-STORY-008`;
- `V107-BLOG-009`;
- `V107-SWAPLENI-004`.

No reward is activated by this PR.

## Mandatory PR #612 paths

### Stories

Completed participant exchange; bilateral consent; outsider denial; moderator approval; privacy filtering; publication race and replay; withdrawal; post-publication dispute suppression; translation fallback; immutable cleanup.

### Blog

Locale source selection; original and English fallback; MDX fallback; service-only transitions; stale revision; anonymous published-only read; contribution moderation and withdrawal; no automatic publication, Trust mutation or active reward; cache and reload parity.

### Feedback and Trust

Eligible one-review rule; cancelled/disputed/outsider denial; replay and conflicting payload; concurrency; response boundary; deterministic server-side Trust recalculation; DB-to-UI parity after reload and second device; separation from Swapleni.

### Swapleni

Append-only ledger; owner-only read; service-only RPCs; inactive-policy denial; deterministic key; replay; cap-bucket concurrency; linked reversal and reversal replay; account/ledger/UI parity; zero Production test residue.

## PASS

- every V1-07 ID appears once;
- no capability is marked closed;
- community remains blocked rather than reinterpreted;
- numeric Swapleni policy remains inactive;
- cumulative checks are explicit;
- CI, AI Evaluation and Preview are green;
- no migration and no Production data mutation.

## Next

`PR #612 — V1-07 cumulative authenticated E2E, Production evidence and closure candidate`
