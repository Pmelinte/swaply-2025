# Batch 65.1 — Corrective scope

Status: `IN PROGRESS — NO PRODUCTION APPLY`

This corrective sub-batch addresses the final read-only audit blockers:

- deterministic profile creation for Auth users without a profile;
- canonical `ensure_own_profile_v1` bootstrap;
- removal of the browser profile upsert path;
- participant-aware private identity through the existing `public_profiles` consumer;
- explicit public-field minimization;
- bounded idempotency retention without duplicated profile snapshots;
- rollback documentation and full zero-cost runtime retest.

No Supabase cloud branch, subscription, card, Production migration or merge is authorized.
