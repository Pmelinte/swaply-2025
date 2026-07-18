# Batch 65.4 — Public and participant profile projection

## Status

Implementation prepared on a dedicated branch. Production migration, authenticated proof, repository CI, Vercel Preview and merge remain pending.

## Objective

Minimize the profile data available through `public.public_profiles` while preserving public discovery and the minimal identity needed by legitimate Match, Chat and Exchange participants.

Batch 65 remains active after this unit. Direct authenticated `UPDATE` on `public.profiles` is deliberately retained until browser persistence and projection gates are both proven.

## Predictive audit

Production baseline before apply:

- Auth users: `1,077`;
- profile rows: `1,077`;
- public projection rows: `1,077`;
- profiles marked public by the historical default: `1,077`;
- biographies stored in profiles: `955`;
- biographies currently copied to the public projection: `955`;
- occupations currently copied to the public projection: `1`;
- profile locations stored: `955`;
- public profile policy: unconditional read for `anon` and `authenticated`;
- direct authenticated owner `UPDATE` remains available as the Batch 65 compatibility path.

Every current visibility document contains the historical keys `publicProfile`, `itemsVisibility`, `showExactLocation` and `showLastSeen`, but does not contain explicit opt-in keys for biography, interests, occupation, website or social links.

## Implemented scope

- additive `public_profiles.is_public` marker;
- index for public discovery rows;
- actor-bound `profile_identity_allowed_v1` relationship predicate;
- minimal identity access for self, admin/moderator, Swap participants, conversation participants and matched users;
- anonymous callers excluded from private rows;
- public profiles remain discoverable;
- biography, interests, affinity groups, occupation, website and social links require explicit visibility opt-in;
- private profiles expose no approximate location, activity metrics, completeness or event badges;
- exact coordinates, street address and postal data are never projected;
- cross-domain preference fields remain excluded from this projection;
- existing suspended/banned exclusion remains active;
- existing projection rows are rebuilt without changing owner profile values;
- no legacy profile write privilege is revoked in this unit.

## Migration

- `20260718190000_batch_65_4_public_profile_projection.sql`.

## Required verification

1. migration applies transactionally;
2. all `1,077` eligible profile rows remain represented;
3. biography, occupation, website and social-link exposure follows explicit opt-in only;
4. approximate location contains only city and country;
5. anonymous access to a private profile is denied;
6. an unrelated authenticated user cannot read a private profile;
7. a legitimate participant can read the same private profile's minimal identity;
8. raw `profiles` remains owner-only;
9. function ownership, grants, RLS and search paths are correct;
10. GitHub Unit Tests, Lint & Type Check, Build and Public Visual Audit pass;
11. Vercel Preview is READY with no relevant warning/error/fatal runtime entries;
12. after merge, Vercel Production, routes, runtime and migration parity pass.

## Safety boundary

- no profile row is deleted;
- no existing profile value is modified;
- no exact location is exposed;
- no paid Supabase branch or new service is used;
- no Train C lifecycle behavior changes;
- no direct owner-write revocation occurs;
- correction remains forward-only through a new migration.
