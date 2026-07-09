import type {
  IntegrationAuditCheck,
  IntegrationAuditReport,
  IntegrationAuditStatus,
} from "./integrationAuditTypes";

export function buildIntegrationAuditReport(input: {
  id: string;
  title: string;
  checks: IntegrationAuditCheck[];
}): IntegrationAuditReport {
  const blockingFailures = input.checks.filter((check) => check.status === "fail" && check.blocking);
  const warnings = input.checks.filter((check) => check.status === "warn");
  const overallStatus = getOverallIntegrationAuditStatus(input.checks);

  return {
    id: input.id,
    title: input.title,
    checks: input.checks,
    overallStatus,
    blockingFailures,
    warnings,
    safeToContinueStacking: blockingFailures.length === 0,
  };
}

export function getOverallIntegrationAuditStatus(checks: readonly IntegrationAuditCheck[]): IntegrationAuditStatus {
  if (checks.some((check) => check.status === "fail" && check.blocking)) return "fail";
  if (checks.some((check) => check.status === "fail" || check.status === "warn")) return "warn";
  return "pass";
}

export function hasCoverageForArea(checks: readonly IntegrationAuditCheck[], area: IntegrationAuditCheck["area"]) {
  return checks.some((check) => check.area === area);
}

export function canMergeWithoutManualReview() {
  return false;
}

export function canSkipPublicVisualAudit() {
  return false;
}

export function requiresStackedPrOrder() {
  return true;
}

export function canDeclareProductionReady(report: IntegrationAuditReport) {
  return report.overallStatus === "pass" && report.blockingFailures.length === 0;
}

export function getMissingCoverageAreas(
  checks: readonly IntegrationAuditCheck[],
  requiredAreas: readonly IntegrationAuditCheck["area"][],
) {
  return requiredAreas.filter((area) => !hasCoverageForArea(checks, area));
}
