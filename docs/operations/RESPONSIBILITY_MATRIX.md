# Swaply — Recovery responsibility and approval matrix

## 1. Roles

| Role | Primary responsibility |
|---|---|
| Product owner / incident commander | severity, scope, destructive-action approval, user/public communication approval, incident closure |
| Application operator | GitHub, CI, Vercel deployments, route smoke, runtime evidence |
| Database operator | Supabase state, migrations, RLS/grants, backup/restore/forward-fix verification |
| Security/privacy reviewer | exposure assessment, evidence minimisation, notification/legal escalation |
| Provider operator | AI, email, media or commercial provider health, credential and reconciliation evidence |

The same person may fulfil several roles, but the record must distinguish the action performed from the approval decision.

## 2. Approval matrix

| Action | Operator may execute autonomously | Owner approval required |
|---|---:|---:|
| Read-only logs, deployment and migration inventory | yes | no |
| Non-Production synthetic restore drill | yes | no |
| Immutable deployment smoke without alias change | yes | no |
| Fail closed an optional provider | yes, during incident | record immediately |
| Forward-only migration to Production | after reviewed PR and green gates | governed by normal merge authority |
| Change Production alias to prior deployment | only during confirmed incident under runbook | yes, recorded |
| Restore database over Production | no | yes, explicit and recorded |
| Rotate suspected-exposed credential | containment may begin immediately | record owner/incident approval |
| Activate paid AI, payment, escrow or commercial provider | no | separate explicit approval |
| Publish `v1.0.0`, GitHub Release or `SWAPLY_V1_GA` | no | separate explicit approval |

## 3. Evidence ownership

- GitHub identities: application operator.
- Vercel deployment/runtime identities: application operator.
- Supabase migration/schema/advisor identities: database operator.
- Privacy and notification decision: security/privacy reviewer.
- Final incident/recovery acceptance: incident commander.

## 4. Handoff requirements

Every handoff records UTC time, exact current SHA/deployment/migration head, open risks, last safe action and the next prohibited/destructive boundary. Credentials are never included.

## 5. V1-10 owner authority

The owner authorised autonomous repair, testing and merge for V1-10 when applicable gates are green. This permits non-destructive recovery evidence and normal reviewed changes. It does **not** authorise the `v1.0.0` tag, GitHub Release, `SWAPLY_V1_GA`, paid provider activation, payment, escrow or an unreviewed destructive Production restore.
