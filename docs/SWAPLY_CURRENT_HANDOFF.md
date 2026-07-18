# Swaply — Current Project Handoff

**Last updated:** 2026-07-19  
**Repository:** `Pmelinte/swaply-2025`  
**Production:** `https://www.swaply.world`

## Status

- Train A: `CLOSED`.
- Train B: `CLOSED`.
- Train C: `CLOSED`.
- Train C milestone: `CLOSED_BETA_READY_OBJECTS_ONE_TO_ONE`.
- Train D: `ACTIVE`.
- Current Train D deliverable: `D1 — global-first profile and common infrastructure`.
- Batch 65: `CLOSED` through the Batch 65.6 closure unit and its post-merge Production verification.
- Next incomplete batch: `66`; no Batch 66 implementation is included in the Batch 65.6 PR.
- Train E remains the terminal Train for v1.0; there is no Train F.

## Current checkpoint

- Verified `main` before Batch 65.6: `409655a7b7e0813bc6392fce477d7afb3e44c56c`.
- Batch 65.6 delivery branch: `batch-65-6-onboarding-profile-authority`.
- Batch 65.6 delivery PR: `#481 — close onboarding profile write authority`.
- Supabase Production project: `keaejxlwqtjjglijiplh`.
- Batch 65.6 migration: `20260719010000_batch_65_6_onboarding_profile_authority_closure`.
- Final merge, Vercel Production, route, runtime-log and migration-parity evidence is recorded on PR #481 and in the corresponding Autopilot completion report.

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

## Train D / Batch 65 closure summary

Batch 65 established a global-first profile contract, separated public discovery from private participant identity and removed ordinary direct browser writes to the raw profile table.

### Batch 65.2 — profile compatibility bridge

Merged and live. Profile and onboarding persistence initially tried canonical owner RPCs first and retained a narrowly coded compatibility path while Production authority was being activated.

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
- raw counterparty profile denied;
- relationship predicate moved to the non-exposed `private` schema.

Production migrations:

- `20260718185820_batch_65_4_public_profile_projection`;
- `20260718194451_batch_65_4_private_profile_identity_predicate`.

Detailed evidence: `docs/batch-65-4-public-profile-projection.md`.

### Batch 65.5 — strict shared browser profile RPC boundary

Merged through PR #480 as commit `409655a7b7e0813bc6392fce477d7afb3e44c56c` and verified in Production.

Delivered in the shared profile persistence service:

- `ensure_own_profile_v1` is the sole missing-profile bootstrap authority;
- `update_own_profile_v1` is the sole ordinary owner profile-save authority;
- missing RPC, stale revision, validation, permission and malformed-response failures never fall back to a direct `public.profiles` write;
- positive revision validation and idempotency remain mandatory;
- the old caller payload is retained only for source compatibility and is never sent to Supabase;
- focused unit and integration-contract tests assert that the bridge contains no `.from("profiles")` write path.

Detailed contract: `docs/batch-65-5-strict-profile-rpc.md`.

### Batch 65.6 — onboarding profile authority closure

Delivered through PR #481.

Delivered:

- every onboarding step writes through a session-authenticated server route and `update_own_profile_v1`;
- onboarding completion uses the same revisioned owner authority;
- every current onboarding-owned field is preserved, including languages, approximate location, swap range/context/types/intent, biography, affinity groups, interests and occupation;
- language arrays are normalized globally and continue to preserve the full supported-language list while deriving the first three preferences;
- stale profile revisions are re-read and retried once with a new revision-scoped idempotency key;
- unsupported fields and non-concurrency authority failures remain explicit errors;
- direct authenticated `INSERT` and `UPDATE` grants and policies on `public.profiles` are removed only after the replacement authority is complete;
- owner `SELECT`, account deletion behavior, public profile projection and service-role authority remain intact;
- focused unit tests cover allowlisting, RPC authority, stale-revision recovery and denial without fallback.

Production migration:

- `20260719010000_batch_65_6_onboarding_profile_authority_closure`.

## Batch 65 closure contract

Batch 65 is closed only with all of the following evidence attached to PR #481:

1. exact final-head lint, typecheck, unit tests, build and applicable visual/authenticated checks are green;
2. exact Vercel Preview is `READY` and the onboarding route is reachable;
3. the forward-only migration is applied in Supabase Production;
4. authenticated direct profile `INSERT`/`UPDATE` is absent after migration;
5. owner RPC execution, RLS/policies, public projection and service-role authority remain correct;
6. repository and Production migration histories are aligned;
7. PR #481 is merged automatically only after the previous gates pass;
8. post-merge GitHub CI, Vercel Production, multilingual onboarding routes, runtime logs and Supabase logs/parity are verified.

No Train C scope was reopened, no destructive migration was introduced and no paid provider or subscription was added.

## Tracked non-blocking items

Pre-existing advisor items remain tracked separately, including leaked-password protection being disabled and one older mutable function search path. They must be reconciled no later than the Train D security closure unless a higher-severity finding requires an earlier batch.

## Next mandatory action

Begin only Batch 66 after Batch 65.6 is merged and every post-merge Production gate above is green. Batch 66 must be selected from the canonical Train D master plan and implemented as one small, non-overlapping PR.
