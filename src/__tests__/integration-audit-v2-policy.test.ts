import { describe, expect, it } from "vitest";
import {
  buildIntegrationAuditReport,
  canDeclareProductionReady,
  canMergeWithoutManualReview,
  canSkipPublicVisualAudit,
  getMissingCoverageAreas,
  getOverallIntegrationAuditStatus,
  requiresStackedPrOrder,
} from "@/lib/integration-audit-v2/integrationAuditPolicy";
import { INTEGRATION_AUDIT_V2_CHECKS } from "@/lib/integration-audit-v2/integrationAuditSeeds";
import { INTEGRATION_AUDIT_AREAS } from "@/lib/integration-audit-v2/integrationAuditTypes";

describe("integration audit v2 policy", () => {
  it("covers every foundation area from batches 8 through 16", () => {
    expect(INTEGRATION_AUDIT_AREAS).toEqual([
      "human_centered_swapping",
      "advanced_swap_modes",
      "photo_discovery",
      "guided_chat",
      "exchange_lifecycle",
      "token_rank_separation",
      "blog_suggestions",
      "ai_evals",
      "language_fallback",
    ]);

    expect(getMissingCoverageAreas(INTEGRATION_AUDIT_V2_CHECKS, INTEGRATION_AUDIT_AREAS)).toEqual([]);
  });

  it("builds a passing audit report when all checks pass", () => {
    const report = buildIntegrationAuditReport({
      id: "audit-v2-green",
      title: "Integration audit v2",
      checks: [...INTEGRATION_AUDIT_V2_CHECKS],
    });

    expect(report.overallStatus).toBe("pass");
    expect(report.blockingFailures).toEqual([]);
    expect(report.safeToContinueStacking).toBe(true);
    expect(canDeclareProductionReady(report)).toBe(true);
  });

  it("warns for non-blocking warnings", () => {
    const report = buildIntegrationAuditReport({
      id: "audit-v2-warn",
      title: "Integration audit v2 warning",
      checks: [
        ...INTEGRATION_AUDIT_V2_CHECKS,
        {
          id: "audit-doc-warning",
          area: "ai_evals",
          label: "Documentation follow-up",
          status: "warn",
          evidence: "A later dashboard can improve visibility.",
          blocking: false,
        },
      ],
    });

    expect(report.overallStatus).toBe("warn");
    expect(report.safeToContinueStacking).toBe(true);
    expect(canDeclareProductionReady(report)).toBe(false);
  });

  it("fails for blocking failures", () => {
    const report = buildIntegrationAuditReport({
      id: "audit-v2-fail",
      title: "Integration audit v2 failure",
      checks: [
        ...INTEGRATION_AUDIT_V2_CHECKS,
        {
          id: "audit-blocking-failure",
          area: "exchange_lifecycle",
          label: "Exchange auto-complete risk",
          status: "fail",
          evidence: "A blocking safety gate failed.",
          blocking: true,
        },
      ],
    });

    expect(report.overallStatus).toBe("fail");
    expect(report.safeToContinueStacking).toBe(false);
    expect(report.blockingFailures).toHaveLength(1);
  });

  it("does not allow merge shortcuts", () => {
    expect(canMergeWithoutManualReview()).toBe(false);
    expect(canSkipPublicVisualAudit()).toBe(false);
    expect(requiresStackedPrOrder()).toBe(true);
  });

  it("computes overall status directly", () => {
    expect(getOverallIntegrationAuditStatus(INTEGRATION_AUDIT_V2_CHECKS)).toBe("pass");
  });
});
