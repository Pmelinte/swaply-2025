import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const workflow = read(".github/workflows/v1-10-2-operations-rehearsal.yml");
const script = read("scripts/v1-10/operations-rehearsal.mjs");
const incident = read("docs/operations/INCIDENT_RESPONSE.md");
const supabase = read("docs/operations/SUPABASE_OUTAGE_RUNBOOK.md");
const vercel = read("docs/operations/VERCEL_OUTAGE_RUNBOOK.md");
const ai = read("docs/operations/AI_PROVIDER_OUTAGE_RUNBOOK.md");
const commercial = read("docs/operations/COMMERCIAL_PROVIDER_OUTAGE_RUNBOOK.md");
const secrets = read("docs/operations/SECRET_ROTATION_RUNBOOK.md");
const responsibilities = read("docs/operations/RESPONSIBILITY_MATRIX.md");
const recoveryRecord = read("docs/operations/RECOVERY_RECORD_V1_10.md");

describe("V1-10.2 operations readiness contract", () => {
  it("rehearses current and immutable rollback deployments without alias mutation", () => {
    expect(script).toContain("CURRENT_PRODUCTION_URL");
    expect(script).toContain("ROLLBACK_CANDIDATE_URL");
    expect(script).toContain('routes = ["/en", "/en/login", "/en/explore"]');
    expect(script).toContain("bodySha256");
    expect(script).toContain("productionAliasChanged: false");
    expect(script).not.toMatch(/alias(es)?\s*\.(set|update|assign)|deployments?\s*\.(create|promote)/i);
    expect(vercel).toContain("rollback-readiness evidence");
    expect(vercel).toContain("does not roll back Supabase data");
  });

  it("proves secret cutover semantics without reading a real secret", () => {
    expect(script).toContain("randomBytes(32)");
    expect(script).toContain('createHmac("sha256"');
    expect(script).toContain("oldCredentialRejected");
    expect(script).toContain("realSecretReadOrRotated: false");
    expect(secrets).toContain("Create the new credential");
    expect(secrets).toContain("Revoke the old credential");
    expect(secrets).toContain("reads or rotates no real credential");
  });

  it("defines incident severity, authority, evidence and reopening gates", () => {
    for (const marker of [
      "SEV-1",
      "Incident commander",
      "preserve evidence",
      "Verification before reopening",
      "Closure",
    ]) {
      expect(incident.toLowerCase()).toContain(marker.toLowerCase());
    }
    expect(responsibilities).toContain("Restore database over Production");
    expect(responsibilities).toContain("separate explicit approval");
  });

  it("keeps Supabase recovery boundaries explicit", () => {
    expect(supabase).toContain("Current proven Production-data RPO");
    expect(supabase).toContain("NOT PROVEN");
    expect(supabase).toContain("does not automatically include");
    expect(supabase).toContain("does not preserve Supabase Auth password hashes");
    expect(supabase).toContain("Prefer a reviewed forward-only migration");
    expect(recoveryRecord).toContain("downloadable managed Production backup is not proven");
    expect(recoveryRecord).toContain("true Production `pg_dump` is not proven");
  });

  it("preserves non-AI and commercial fail-closed behavior", () => {
    expect(ai).toContain("Every AI flow requires a non-AI fallback");
    expect(ai).toContain("deterministic non-AI implementation");
    expect(commercial).toContain("remain inactive");
    expect(commercial).toContain("fail closed");
    expect(workflow).toContain("swaply-ai-facade.test.ts");
    expect(workflow).toContain("commercial-closure-e48.test.ts");
  });

  it("locks release and destructive-operation boundaries", () => {
    expect(recoveryRecord).toContain("does not authorise");
    expect(recoveryRecord).toContain("`v1.0.0`");
    expect(recoveryRecord).toContain("`SWAPLY_V1_GA`");
    expect(recoveryRecord).toContain("destructive restore over Production");
    expect(responsibilities).toContain("no Supabase Production migration or data write").not;
    expect(workflow).toContain("retention-days: 90");
  });
});
