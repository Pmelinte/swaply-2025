# Swaply — DB Baseline (Contract tehnic)

**Last updated:** 2026-07-18  
**Source:** repository migrations plus verified Supabase Production evidence

## 1. Canonical schemas

### `public`

The application-facing source-of-truth tables remain in `public`. Browser access is controlled through explicit grants and RLS.

Core tables include:

- `public.profiles` — private owner profile source of truth; RLS enabled;
- `public.public_profiles` — privacy-minimized discovery and participant identity projection; RLS enabled;
- `public.items` — Objects listings; RLS enabled;
- `public.properties` — Properties listings; RLS enabled;
- `public.services_listings` — Services listings; RLS enabled;
- `public.events_listings` — Events listings; RLS enabled;
- `public.matches` — participant match records; RLS enabled;
- `public.conversations` and `public.messages` — participant-only communication;
- `public.swaps` — canonical Exchange lifecycle;
- `public.reviews` — canonical completed-Swap feedback;
- `public.notifications` — owner-visible notifications;
- `public.user_tokens` — Swapleni ledger source of truth;
- `public.reports`, `public.blocked_users` and `public.disputes` — canonical safety sources.

No parallel `fake_*` or duplicate source-of-truth table may be introduced without an explicit migration and architectural decision.

### `private`

The `private` schema contains internal helpers that must not be directly exposed through the public Data API.

- `private.profile_identity_allowed_v1(uuid)` is the Batch 65.4 caller-bound relationship predicate used only by `public.public_profiles` RLS.
- `anon` has no schema usage or function execute privilege.
- `authenticated` may execute the helper only through the RLS policy and the helper derives the actor internally from `auth.uid()`.
- SECURITY DEFINER functions use an explicit search path.

## 2. Profile contract after Batch 65.4

### Raw owner profile

`public.profiles` stores the complete owner-controlled profile, including language preferences, visibility settings, private location fields and profile revision.

- owner SELECT remains available through RLS;
- unrelated users and counterparties cannot read the raw row;
- canonical revisioned owner writes use `ensure_own_profile_v1` and `update_own_profile_v1`;
- the historical authenticated owner UPDATE compatibility path remains temporarily available until the later Batch 65 revocation gate.

### Public and participant projection

`public.public_profiles` contains only the fields safe for public discovery or minimal legitimate participant identity.

- `is_public = true`: visible to `anon` and `authenticated` through `public_profiles_public_read`;
- private row: visible only to the owner, admin/moderator or a real Match, conversation or Swap participant through `public_profiles_participant_read`;
- biography, interests, affinity groups, occupation, website and social links require explicit owner opt-in;
- exact coordinates, street address and postal data are never projected;
- public location is limited to city and country;
- suspended or banned profiles are removed from the projection.

Verified Production checkpoint after migrations `20260718185820` and `20260718194451`:

- `1,077` profile rows;
- `1,077` projection rows;
- zero optional biographies, occupations, websites or social links exposed without explicit opt-in;
- zero projected location objects containing exact-coordinate, address or postal keys;
- anonymous and outsider access to a transaction-scoped private profile denied;
- legitimate participant minimal identity allowed;
- raw counterparty profile denied;
- rollback restored all tested values and row counts exactly.

## 3. Golden rule for every database change

Every database change must be delivered through a versioned SQL migration in the repository.

A PR that changes the database must include:

1. the exact Production-aligned migration file;
2. an update to this baseline when the contract changes;
3. RLS, grants, ownership and policy verification;
4. SECURITY DEFINER search-path and execute-grant verification;
5. migration parity between repository and Supabase Production;
6. a forward-only correction migration rather than rewriting applied history.

## 4. Minimum database audit before merge

- RLS enabled on every browser-accessible private table;
- least-privilege grants for `anon` and `authenticated`;
- no unconditional private-data policy;
- owner, participant, outsider, moderator/admin and anonymous boundaries exercised where applicable;
- no callable SECURITY DEFINER helper in an exposed schema unless it is an intentional authenticated command with internal authorization;
- immutable IDs used for fixtures and cleanup;
- duplicate, replay, stale-revision and concurrency behavior tested where applicable;
- advisors reviewed after DDL;
- post-audit queries prove zero residual test data;
- repository migration versions exactly match Production migration history.

## 5. Historical updates

- 2026-02-06: `messages` RLS updated for participant-only chat persistence.
- 2026-07-10: emergency security and profile-access hardening aligned browser privileges and profile onboarding compatibility.
- 2026-07-14 to 2026-07-16: Train C established canonical Match, Chat, Exchange, Review, cancellation, dispute, report and block authorities.
- 2026-07-18: Batch 65.3 activated revisioned profile authority and repaired all missing historical profile rows.
- 2026-07-18: Batch 65.4 introduced privacy-minimized public/participant projection and moved the relationship predicate to the private schema.
