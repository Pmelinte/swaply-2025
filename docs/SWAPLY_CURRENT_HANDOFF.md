# Swaply — Current Project Handoff

**Last updated:** 2026-07-18  
**Repository:** `Pmelinte/swaply-2025`  
**Production:** `https://www.swaply.world`

## Status

- Train A: `CLOSED`.
- Train B: `CLOSED`.
- Train C: `CLOSED`.
- Train C milestone: `CLOSED_BETA_READY_OBJECTS_ONE_TO_ONE`.
- Train D: `ACTIVE`.
- Current Train D deliverable: `D1 — global-first profile and common infrastructure`.
- Current batch: `65 — profile audit and public/private contract`.
- Batch 65 remains active after the current projection unit.
- Train E remains the terminal Train for v1.0; there is no Train F.

## Current checkpoint

- Verified `main` before this PR: `5adb2557e8f71152453c2a336f144537d8598093`.
- Active branch: `agent/batch-65-4-public-profile-projection`.
- Active PR: `#479 — Batch 65.4: Minimize public profile projection`.
- Supabase Production project: `keaejxlwqtjjglijiplh`, status `ACTIVE_HEALTHY`.
- Current Vercel Production deployment for `main`: `READY`.
- The exact final PR head must still pass CI and Preview before automatic merge.

## Execution authorization

Petru gave standing explicit authorization for Train D Autopilot, Batch 65 through Batch 92. Under this authorization, each small PR may be merged automatically only after all critical repository, Preview, Production, runtime, security and migration-parity gates are green.

The Autopilot must stop for:

- P0/P1;
- risk of data loss or destructive migration;
- new paid service, subscription or cost;
- missing access;
- a major ambiguous product decision.

Only one batch unit and one PR may be active at a time.

## Permanent product rules

- Swaply is global-first across Objects, Properties, Services and Events.
- Global navigation and contextual drawers remain separate.
- Blog and Stories remain separate.
- Swapleni and trust rank remain separate.
- AI is advisory, human-controlled and has a non-AI fallback.
- Private profiles, messages, exact location, Story consent and ledgers remain protected.
- Historical migrations are never rewritten; corrections use new forward-only migrations.
- Repository and Supabase Production migration histories must remain aligned.
- After every merge, verify GitHub CI, Vercel Production, critical routes, runtime logs and Supabase health/parity.

## Train C closure summary

Train C delivered and verified the complete one-to-one Objects lifecycle:

`Profile → Object → Wanted/Favorite → Interest → Match → Chat → Bilateral Agreement → Explicit Exchange → Logistics → Bilateral Completion → Review`

It also delivered controlled cancellation, dispute, report and block paths with participant authorization, stale-state protection, idempotency, concurrency evidence, exactly-once effects and immutable-ID cleanup.

Closure evidence: `docs/TRAIN_C_CLOSURE_REPORT.md`.

## Train D / Batch 65 progress

### Batch 65.2 — profile compatibility bridge

Merged and live. Profile and onboarding persistence try the canonical owner RPCs first and use the legacy direct owner path only when the specific RPC is genuinely absent.

### Batch 65.3 — revisioned profile authority

Merged through PR #478 and verified in Production.

Delivered:

- canonical primary, secondary and tertiary languages;
- automatic-translation and show-original preferences;
- all 43 application locales supported by the profile authority;
- deterministic profile bootstrap and historical missing-profile repair;
- revisioned CAS owner updates;
- idempotent replay and conflict denial;
- concurrent same-profile update serialization;
- explicit ownership, grants and search paths.

Production evidence:

- Auth users: `1,077`;
- profile rows: `1,077`;
- missing profiles: `0` after repairing `120` historical users;
- null primary languages: `0`;
- unsupported locales: `0`;
- duplicate canonical language selections: `0`;
- invalid revisions: `0`.

Production migrations:

- `20260718180005_batch_65_3_profile_authority_activation`;
- `20260718180050_batch_65_3_profile_authority_concurrency_hardening`.

### Batch 65.4 — privacy-minimized profile projection

Production migrations are applied and authenticated privacy verification passes. The PR remains open until the final head passes CI and Vercel Preview.

Delivered:

- explicit `public_profiles.is_public` marker;
- public discovery separated from private participant identity;
- biography, interests, affinity groups, occupation, website and social links exposed only after explicit opt-in;
- public location limited to city and country;
- no exact coordinates, address or postal data in the projection;
- private-profile identity allowed only for self, admin/moderator or a real Match, conversation or Swap relationship;
- anonymous and unrelated authenticated users denied private rows;
- raw counterparty profile remains denied;
- relationship predicate moved to the non-exposed `private` schema;
- direct authenticated owner UPDATE retained temporarily as the zero-downtime compatibility path.

Production migrations:

- `20260718185820_batch_65_4_public_profile_projection`;
- `20260718194451_batch_65_4_private_profile_identity_predicate`.

Production evidence:

- profile rows: `1,077`;
- projection rows: `1,077`;
- biographies exposed without opt-in: `0`;
- occupations exposed without opt-in: `0`;
- websites exposed without opt-in: `0`;
- social links exposed without opt-in: `0`;
- projected locations containing exact-coordinate, address or postal keys: `0`;
- anonymous private-profile read: denied;
- unrelated authenticated private-profile read: denied;
- legitimate participant minimized identity read: allowed;
- raw counterparty profile read: denied;
- owner raw profile and own private projection read: allowed;
- rollback audit restored all tested values and counts exactly.

Detailed evidence: `docs/batch-65-4-public-profile-projection.md`.

## Current risk boundary

No open P0/P1 was found in Batch 65.4.

Known deliberate compatibility boundary:

- authenticated owners still possess the historical direct `UPDATE` path on `public.profiles`;
- the application already prefers the canonical revisioned RPC;
- revocation must occur only after browser persistence, onboarding, stale-revision behavior and recovery are proven on the final Production path.

Pre-existing advisor items not introduced by Batch 65.4 remain tracked separately, including leaked-password protection being disabled and one older mutable function search path. They do not change the current projection verdict but must be reconciled no later than the Train D security closure.

## Next mandatory action

Complete only the current Batch 65.4 PR:

1. pass Unit Tests, Lint & Type Check, Build and Public Visual Audit on the exact final head;
2. verify the exact Vercel Preview is `READY`;
3. verify Preview routes and warning/error/fatal runtime logs;
4. recheck Supabase security/performance advisors and migration parity;
5. merge PR #479 only when every critical gate is green;
6. verify post-merge GitHub CI, Vercel Production, critical routes, runtime logs and Supabase health/parity;
7. then begin the next incomplete Batch 65 unit, without opening an overlapping PR.

The next Batch 65 unit must close the remaining owner-write compatibility boundary and complete the profile contract evidence before Batch 66 begins.
