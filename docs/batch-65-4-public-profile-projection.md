# Batch 65.4 — Public and participant profile projection

## Status

Production migrations are applied and the authenticated privacy matrix passes. Repository CI and Vercel Preview passed on the initial implementation head; the final Production-aligned hardening head is awaiting its last CI and Preview gate before merge.

## Objective

Minimize the profile data available through `public.public_profiles` while preserving public discovery and the minimal identity needed by legitimate Match, Chat and Exchange participants.

Batch 65 remains active after this unit. Direct authenticated `UPDATE` on `public.profiles` is deliberately retained until browser persistence and the final owner-write revocation gate are proven.

## Predictive audit

Production baseline before apply:

- Auth users: `1,077`;
- profile rows: `1,077`;
- public projection rows: `1,077`;
- profiles marked public by the historical default: `1,077`;
- biographies stored in profiles: `955`;
- biographies copied to the old public projection: `955`;
- occupations copied to the old public projection: `1`;
- profile locations stored: `955`;
- public profile policy: unconditional read for `anon` and `authenticated`;
- direct authenticated owner `UPDATE` remains available as the Batch 65 compatibility path.

Every current visibility document contains the historical keys `publicProfile`, `itemsVisibility`, `showExactLocation` and `showLastSeen`, but no explicit opt-in keys for biography, interests, occupation, website or social links.

## Implemented scope

- additive `public_profiles.is_public` marker;
- index for public discovery rows;
- actor-bound private relationship predicate;
- minimal identity access for self, admin/moderator, Swap participants, conversation participants and matched users;
- anonymous callers excluded from private rows;
- unrelated authenticated users excluded from private rows;
- public profiles remain discoverable;
- biography, interests, affinity groups, occupation, website and social links require explicit visibility opt-in;
- private profiles expose no approximate location, activity metrics, completeness or event badges;
- exact coordinates, street address and postal data are never projected;
- cross-domain preference fields remain excluded from this projection;
- existing suspended/banned exclusion remains active;
- existing projection rows are rebuilt without changing owner profile values;
- the relationship predicate is moved from the exposed `public` API schema into the existing `private` schema;
- anonymous public discovery and authenticated participant identity use separate RLS policies;
- no legacy profile write privilege is revoked in this unit.

## Production migrations

Applied in order and aligned with the repository:

- `20260718185820_batch_65_4_public_profile_projection.sql`;
- `20260718194451_batch_65_4_private_profile_identity_predicate.sql`.

No historical migration was rewritten. The second migration is a forward-only hardening response to the Supabase advisor warning that the initial SECURITY DEFINER relationship predicate was directly callable through the exposed public RPC schema.

## Production evidence

### Projection and privacy

- profile rows: `1,077`;
- projection rows: `1,077`;
- public rows: `1,077` under the historical public default;
- private rows after rollback audit: `0`;
- biographies exposed without explicit opt-in: `0`;
- occupations exposed without explicit opt-in: `0`;
- websites exposed without explicit opt-in: `0`;
- social links exposed without explicit opt-in: `0`;
- locations containing exact-coordinate, address or postal keys: `0`.

### Authenticated rollback matrix

A transaction-scoped Production audit temporarily made one real participant profile private and rolled back all changes.

- anonymous caller reading private projection: denied;
- unrelated authenticated caller reading private projection: denied;
- unrelated authenticated caller reading raw profile: denied;
- legitimate Swap participant reading minimized private identity: allowed;
- legitimate participant reading raw counterparty profile: denied;
- owner reading own raw profile and private projection: allowed;
- post-rollback row counts and projection values: restored exactly.

### Grants and function safety

- `public_profiles` RLS: enabled;
- anonymous and authenticated roles: SELECT only;
- public discovery policy: `is_public` only;
- participant policy: authenticated only through `private.profile_identity_allowed_v1`;
- private helper binds identity internally with `auth.uid()`;
- private helper owner: `postgres`;
- private helper search path: explicit `pg_catalog, public, private`;
- trigger sync function owner: `postgres`;
- trigger sync function search path: explicit `pg_catalog, public`;
- trigger sync function is not executable by anonymous or authenticated callers;
- direct authenticated owner `profiles UPDATE`: intentionally retained for the next Batch 65 compatibility gate.

## Repository and Preview evidence

Initial head `d415dbbbe1a67f98b0ec4b4c89888f8b00d84a67`:

- GitHub CI run `29656571941`: SUCCESS;
- Unit Tests: PASS;
- Lint & Type Check: PASS;
- Build: PASS;
- Public Visual Audit: PASS;
- Vercel Preview: READY on the exact head.

The final head includes only Production-version alignment, the private-schema advisor hardening, contract tests and documentation. It must pass the same CI and Preview gates before automatic merge.

## Remaining gate

1. final GitHub CI success on the latest head;
2. final Vercel Preview READY on the exact head;
3. Preview runtime warning/error/fatal inspection;
4. Supabase advisor recheck confirming no new public helper exposure warning;
5. merge PR #479;
6. verify Vercel Production, critical routes, runtime logs and migration parity after merge.

## Safety boundary

- no profile row was deleted;
- no owner profile value was changed by the migration;
- no exact location is exposed;
- no paid Supabase branch or new service was used;
- no Train C lifecycle behavior changed;
- no direct owner-write revocation occurs in this unit;
- all Production audit mutations were transaction-scoped and rolled back;
- correction remains forward-only through a new migration.
