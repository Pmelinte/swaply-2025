# Swaply — V1-10 recovery and operations record

**Package:** `V1-10 — Recovery and operations`  
**Record status:** executable recovery record; closure requires cumulative evidence  
**Baseline before V1-10:** application `3bdcf71a160fdee53280b337e99c31d3e8f3b588`, Supabase head `20260808205320`  
**Production project:** `keaejxlwqtjjglijiplh`

## 1. Owner authority and release boundary

The owner explicitly authorised autonomous repairs, modifications, tests and merges needed to close V1-10 after applicable gates are green. This record applies that authority to safe recovery work and documented operational boundaries.

It does not authorise:

- the `v1.0.0` tag;
- a GitHub Release;
- `SWAPLY_V1_GA`;
- paid AI activation;
- payment, escrow/custody or commercial-provider activation;
- an unreviewed destructive restore over Production.

## 2. Executed V1-10.1 evidence

PR `#638` established:

- read-only Production counts with no raw-row export and no Production write;
- 977 Auth users and counts for critical application resources at execution time;
- PostgreSQL 17 synthetic fixture covering Auth, Storage metadata, profiles, items, swaps, messages, Stories consent, Swapleni ledger and Blog;
- custom-format `pg_dump`, SHA-256 checksum, clean `pg_restore` and integrity verification;
- RLS/policy restoration checks;
- transactional rollback and forward-fix rehearsal;
- exact-head CI, Domain/Journey cumulative gates and Vercel Preview evidence.

Immutable evidence identities:

- workflow run: `31280957546`;
- Production inventory artifact: `9028397953`;
- restore artifact: `9028395792`;
- Production inventory manifest SHA-256: `d654737a398ca5b97e93bab85eb126cc9b50ef88f61c844efc06e75eb04af644`;
- synthetic dump SHA-256: `c4fdc87318eccf4368dd5954def7fb996416c752b577b2fa15579f1695df9f19`;
- merged application SHA after V1-10.1: `259c8d16095c29e18767456e177bd0b8dbeb33a9`.

Post-merge Vercel Production was `READY`, served the exact merge SHA, critical routes returned HTTP 200, no warning/error/fatal log was found in the reviewed window, and Supabase migration head remained `20260808205320`.

## 3. V1-10.2 evidence contract

V1-10.2 adds:

- non-destructive smoke of current Production and an immutable earlier Vercel deployment;
- body hashes/status only, with no page-body artifact;
- ephemeral real-cryptographic secret cutover simulation and old-key rejection;
- tested AI fallback and commercial fail-closed contracts;
- incident response and outage runbooks;
- responsibility/approval matrix.

An immutable prior deployment smoke proves a qualified rollback candidate exists. It does not claim a Production alias cutover was executed.

## 4. Accepted operational boundaries

The following are recorded honestly rather than reclassified as completed technical evidence:

1. The Supabase organization was verified on the Free plan.
2. A downloadable managed Production backup is not proven.
3. A true Production `pg_dump` is not proven because an approved database connection credential was not available to the executing agent.
4. The current proven Production-data RPO is therefore `NOT PROVEN`; the 24-hour RPO is a target only after scheduled encrypted logical backup automation is operating.
5. Database backup does not by itself recover Supabase Storage or Cloudinary media bytes.
6. An application-level REST export does not preserve Auth password hashes.
7. Real secret rotation is incident-triggered and was not performed without evidence of exposure.
8. Production database restore and Vercel alias cutover remain controlled operator actions.

These boundaries are accepted for V1-10 recovery-record purposes because the canonical exit permits executed recovery evidence or an explicit owner-approved operational recovery record. They remain visible release-hardening inputs and may not be described as stronger evidence.

## 5. Recovery strategy

- **Application:** immutable Vercel deployment rollback, exact SHA verification, smoke, runtime review and return-forward.
- **Database:** preserve writes/evidence, compare migrations, isolated restore where possible, verify authority/integrity, prefer reviewed forward-fix when inverse migration is unsafe.
- **Auth:** rely on true database recovery where available; otherwise require controlled account recovery/password reset rather than pretending hashes were exported.
- **Media:** inventory and recover Storage/Cloudinary separately.
- **AI:** cache/secondary provider only when approved, otherwise deterministic/manual fallback.
- **Commercial providers:** remain fail closed unless separately activated and reconciled.
- **Credentials:** create/update/verify/revoke sequence with negative old-key test.

## 6. V1-10 closure gate

V1-10 may close only after the exact V1-10.2 head and merged main show:

- operations workflow green;
- general CI and applicable cumulative gates green;
- Vercel Preview and post-merge Production `READY` on exact SHAs;
- runtime review clean of new blockers;
- Supabase migration parity unchanged or explicitly reconciled;
- no open P0/P1 created by V1-10;
- canonical product-spec closure evidence and registers updated.

## 7. Remaining release boundary

V1-10 closure advances the roadmap to V1-11. It does not itself make Swaply Generally Available. The tag, GitHub Release and GA publication remain separately blocked and unauthorised.
