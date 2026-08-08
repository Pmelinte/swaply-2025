# Swaply — Vercel outage and application rollback runbook

**Project:** `swaply-2025`  
**Production domains:** `swaply.world`, `www.swaply.world`

## 1. Principle

A Vercel rollback changes application deployment identity; it does not roll back Supabase data or migrations. Application and database compatibility must be checked independently.

## 2. Trigger

Use this runbook for:

- failed or stuck Production deployment;
- broad 5xx/runtime regression;
- critical UI/API regression introduced by a known SHA;
- Vercel regional/platform outage;
- emergency return to a known-good immutable deployment.

## 3. Containment

1. Record current Git SHA, deployment ID, aliases and UTC time.
2. Freeze unrelated merges and automatic deployment changes.
3. Check Vercel deployment state, build output and grouped runtime errors.
4. Determine whether the failure is application-only or depends on a newer database migration.
5. Keep optional providers fail closed.

## 4. Rollback candidate qualification

Before alias cutover, the candidate must be immutable and show:

- exact Git SHA and `READY` state;
- HTTP 2xx/3xx for `/en`, `/en/login` and `/en/explore`;
- compatibility with the current Supabase migration head;
- no known P0/P1 security or privacy regression;
- incident-commander approval.

V1-10.2 performs a non-destructive smoke of an immutable earlier deployment. That is rollback-readiness evidence, not proof that an alias cutover occurred.

## 5. Controlled rollback

1. Record the current deployment as the return-forward target.
2. Assign Production aliases to the qualified prior deployment using the Vercel dashboard/API.
3. Verify `swaply.world` resolves to the intended deployment and SHA.
4. Run public route smoke, authentication entry, critical API and runtime-log checks.
5. If database compatibility fails, return forward immediately; never compensate with unreviewed destructive SQL.
6. Record all deployment IDs and timestamps.

## 6. Return forward

After repair:

1. create or select a new immutable `READY` deployment;
2. run Preview checks and applicable CI/E2E;
3. reassign Production aliases;
4. verify exact SHA, public/authenticated smoke and runtime logs;
5. confirm Supabase migration parity;
6. close only after observation shows no new error cluster.

## 7. Platform outage

When Vercel itself is unavailable:

- do not repeatedly redeploy;
- preserve current Git/Supabase state;
- communicate degraded availability without invented ETA;
- monitor official provider status;
- resume smoke verification only after the provider reports recovery.

## 8. Evidence required

- before/after deployment IDs and SHAs;
- alias state;
- route/status evidence;
- runtime error review;
- database compatibility statement;
- operator and approver;
- rollback or return-forward outcome.
