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
- Batch 65 remains active after the strict shared profile RPC unit.
- Train E remains the terminal Train for v1.0; there is no Train F.

## Current checkpoint

- Verified `main` before this PR: `863ae30413681684ef7ef72154f18e85bef61d75`.
- Active branch: `agent/batch-65-5-strict-profile-rpc`.
- Active PR: `#480 — Batch 65.5: Remove legacy browser profile fallback`.
- Supabase Production project: `keaejxlwqtjjglijiplh`, status `ACTIVE_HEALTHY` at the last verified checkpoint.
- Current Vercel Production deployment for `main`: `READY` at the last verified checkpoint.
- Batch 65.5 contains no database migration.

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

Merged and live. Profile and onboarding persistence initially tried the canonical owner RPCs first and retained a narrowly coded legacy path while Production authority was being activated.

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

Merged through PR #479 and verified in Production.

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
- biographies, occupations, websites and social links exposed without opt-in: `0`;
- projected locations containing exact-coordinate, address or postal keys: `0`;
- anonymous private-profile read: denied;
- unrelated authenticated private-profile read: denied;
- legitimate participant minimized identity read: allowed;
- raw counterparty profile read: denied;
- owner raw profile and own private projection read: allowed;
- rollback audit restored all tested values and counts exactly.

Detailed evidence: `docs/batch-65-4-public-profile-projection.md`.

### Batch 65.5 — strict shared browser profile RPC boundary

Delivery vehicle: PR #480.

Delivered in the shared profile persistence service:

- `ensure_own_profile_v1` is the sole missing-profile bootstrap authority;
- `update_own_profile_v1` is the sole ordinary owner profile-save authority;
- missing RPC, stale revision, validation, permission and malformed-response failures never fall back to a direct `public.profiles` write;
- positive revision validation and idempotency remain mandatory;
- the old caller payload is retained temporarily for source compatibility but is never sent to Supabase;
- focused unit and integration-contract tests assert that the bridge contains no `.from("profiles")` path.

Detailed contract: `docs/batch-65-5-strict-profile-rpc.md`.

## Current risk boundary

No open P0/P1 was found while defining Batch 65.5.

Deliberate remaining compatibility boundary:

- the onboarding wizard still contains its historical direct owner profile update;
- authenticated owners still possess historical direct `INSERT` and `UPDATE` permissions/policies on `public.profiles`;
- these permissions must not be revoked until all onboarding fields are preserved through a canonical authority and browser persistence, stale-revision recovery and Production behavior are proven.

Pre-existing advisor items remain tracked separately, including leaked-password protection being disabled and one older mutable function search path. They must be reconciled no later than the Train D security closure.

## Next mandatory action

Complete only PR #480:

1. pass Unit Tests, Lint & Type Check, Build and Public Visual Audit on the exact final head;
2. verify the exact Vercel Preview is `READY`;
3. verify Preview routes and warning/error/fatal runtime logs;
4. merge automatically only when every critical gate is green;
5. verify post-merge GitHub CI, Vercel Production, critical routes, runtime logs and Supabase health/parity;
6. then begin one non-overlapping Batch 65 onboarding-authority unit.

The next Batch 65 unit must route onboarding through canonical owner authority, preserve every current onboarding field, prove browser persistence and stale-revision recovery, revoke direct authenticated profile `INSERT`/`UPDATE`, and close Batch 65 before Batch 66 begins.
