# Swaply — Supabase outage and database recovery runbook

**Production project:** `keaejxlwqtjjglijiplh`  
**Current verified plan boundary:** Free  
**Scope:** Database, Auth, Storage metadata, Realtime and Edge Functions

## 1. Recovery targets and honest boundary

- **Availability RTO target:** restore a safe degraded/read-only experience within 4 hours where provider availability permits.
- **Application-data RPO target:** 24 hours only after a scheduled, encrypted logical Production backup is demonstrably operating.
- **Current proven Production-data RPO:** `NOT PROVEN`; V1-10.1 proved read-only inventory and isolated PostgreSQL dump/restore mechanics, not a true Production dump.

These targets are not SLAs. The Free plan must not be described as having a downloadable managed backup unless separately demonstrated.

## 2. Data boundaries

A PostgreSQL backup and media recovery are separate:

- database backup covers relational data and Storage metadata;
- Supabase Storage backup does not automatically include deleted/absent object bytes;
- Cloudinary and other external media require separate provider recovery;
- an application-level export does not preserve Supabase Auth password hashes;
- exact locations, messages, Story drafts/consents and ledgers must remain private throughout recovery.

## 3. Detection and containment

1. Open an incident record and classify severity.
2. Record project ref, UTC time, application SHA and latest known migration head.
3. Check Supabase project status and logs for `postgres`, `api`, `auth`, `storage`, `realtime` and Edge Functions as applicable.
4. Stop migrations, cleanup jobs and writes that could amplify corruption.
5. Keep public browsing read-only where it remains safe; fail closed for exchange transitions, rewards, moderation authority and private writes.
6. Preserve logs and do not run ad-hoc destructive SQL.

## 4. Decision path

### Provider outage without evidence of corruption

- Keep the application on explicit unavailable/fallback states.
- Do not switch to mock data presented as real.
- Retry only after provider health recovers.
- Verify Auth, critical reads, private writes and Realtime before reopening.

### Application/schema drift

- Compare repository migrations with `Supabase.list_migrations` or the approved CLI.
- Never rewrite applied migration history.
- Prefer a reviewed forward-only migration when rollback is unsafe.
- Run Security/Performance Advisor after DDL.

### Suspected data corruption or loss

1. Freeze writes.
2. Identify the last trustworthy recovery point and evidence.
3. Obtain explicit owner approval before restoring over Production.
4. Restore first into an isolated project/database where possible.
5. Verify schema, constraints, RLS, grants, functions, row counts and representative business invariants.
6. Reconcile Storage and external media separately.
7. Rotate credentials if exposure is possible.

## 5. Restore verification matrix

Minimum checks:

- migration head and checksums where available;
- RLS enabled on exposed private tables;
- `SECURITY DEFINER` execution grants and fixed `search_path`;
- profiles public/private separation;
- messages/conversations participant-only;
- exact versus approximate location boundaries;
- exchange lifecycle and outsider denial;
- Story consent/revision binding;
- Swapleni anti-duplication and aggregate balance checks;
- Blog/translation availability;
- Storage bucket policies and representative object reachability;
- zero unexpected public fixtures.

## 6. Forward-fix rules

Use forward-fix when an inverse migration could destroy newly written data or violate migration history. The forward fix must:

1. be additive or safely transforming;
2. preserve affected rows before constraint changes;
3. be idempotent where practical;
4. include negative authority tests;
5. be applied and read back in Production;
6. keep repository and Production migration history aligned.

## 7. Reopening gate

Reopen writes only after:

- Supabase status is healthy;
- migrations are aligned;
- critical authority and outsider tests pass;
- application Production points to the verified SHA;
- runtime errors are reviewed;
- incident commander records the decision.

## 8. Prohibited actions

- no destructive restore over Production without recorded approval;
- no raw Production export to a public repository or unencrypted artifact;
- no service-role key in logs or client code;
- no claim that synthetic restore evidence equals a Production backup;
- no deletion of evidence to make an advisor or test appear green.
