# Swaply — Incident response runbook

**Status:** operational runbook  
**Applies to:** Vercel, Supabase, AI providers, external commercial providers and security/privacy incidents  
**Release boundary:** this document does not authorise provider activation or `SWAPLY_V1_GA`

## 1. Objectives

The response process must protect people and evidence before restoring convenience. The order is:

1. stop further harm;
2. preserve evidence;
3. establish the exact affected deployment, database and time window;
4. restore the smallest safe service surface;
5. verify data and authority boundaries;
6. communicate factually;
7. record follow-up actions.

RTO and RPO values in this runbook are operational targets, not contractual SLAs and not proof already achieved.

## 2. Severity

| Severity | Definition | Initial response target |
|---|---|---|
| `SEV-1` | confirmed data exposure, destructive data loss, account takeover, unusable core exchange authority or broad outage | 15 minutes |
| `SEV-2` | material degradation, one critical provider unavailable with safe fallback, or restricted feature outage | 30 minutes |
| `SEV-3` | non-critical defect, delayed background task or isolated user impact | next operating window |

Any uncertain privacy or authority incident starts at `SEV-1` until evidence supports downgrade.

## 3. Roles

- **Incident commander:** owner or explicitly delegated operator; controls severity, scope and closure.
- **Technical operator:** executes GitHub/Vercel application recovery and gathers logs.
- **Database operator:** controls Supabase investigation, restore or forward-fix actions.
- **Privacy/legal reviewer:** assesses disclosure obligations and public wording.
- **Communications owner:** publishes only approved, verified facts.

One person may hold more than one role, but every action must retain an identifiable owner and timestamp.

## 4. Immediate checklist

1. Create an incident record using `RECOVERY_RECORD_V1_10.md` as the minimum structure.
2. Record UTC time, reporter, symptoms and first known affected request or user.
3. Freeze unrelated merges and deployments.
4. Identify current application SHA, Vercel deployment ID and Supabase migration head.
5. Preserve relevant GitHub Actions, Vercel and Supabase logs.
6. Disable or fail closed the affected optional integration.
7. Never delete suspected evidence during containment.
8. Do not restore a database over Production without owner approval and a recorded rollback point.

## 5. Decision tree

- Application-only regression → follow `VERCEL_OUTAGE_RUNBOOK.md`.
- Database, Auth, Storage or Realtime problem → follow `SUPABASE_OUTAGE_RUNBOOK.md`.
- AI unavailable or unsafe → follow `AI_PROVIDER_OUTAGE_RUNBOOK.md`.
- Payment, affiliate, courier or another commercial integration → follow `COMMERCIAL_PROVIDER_OUTAGE_RUNBOOK.md`.
- Credential exposure → follow `SECRET_ROTATION_RUNBOOK.md` and treat as `SEV-1` until scope is established.

## 6. Verification before reopening

A service may reopen only after applicable checks are recorded:

- exact SHA/deployment identity;
- public route smoke;
- authenticated authority smoke where applicable;
- runtime error review;
- Supabase migration parity and critical table checks;
- participant/outsider boundary checks for affected private resources;
- no unresolved P0/P1 introduced by the recovery action;
- explicit incident-commander decision.

## 7. Communication rules

- State what is known, what is unknown and what is being done.
- Do not promise universal recovery, zero data loss or a deadline without evidence.
- Never expose emails, message contents, exact locations, credentials or raw ledger data in public incident updates.
- Privacy/legal notification decisions require the designated reviewer.

## 8. Closure

The incident record must contain:

- timeline;
- root cause or current best-supported cause;
- affected identities and data classes;
- containment and recovery actions;
- verification evidence;
- residual risks;
- owner acceptance;
- follow-up issue/PR identities.

Closure of an incident does not by itself close a V1 package or authorise a release.
