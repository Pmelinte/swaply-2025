export const SAFETY_REPORT_REASONS = [
  "spam",
  "harassment",
  "inappropriate",
  "scam",
  "prohibited_item",
  "other",
] as const;

export const SAFETY_REPORT_STATUSES = [
  "open",
  "investigating",
  "resolved",
  "dismissed",
] as const;

export const SAFETY_REPORT_ACTIONS = [
  "investigate",
  "dismiss",
  "warn",
  "hide_item",
  "suspend_7d",
] as const;

export type SafetyReportReason = (typeof SAFETY_REPORT_REASONS)[number];
export type SafetyReportStatus = (typeof SAFETY_REPORT_STATUSES)[number];
export type SafetyReportAction = (typeof SAFETY_REPORT_ACTIONS)[number];
export type SafetyReportTargetType = "user" | "item";

export type SafetyEvidenceInput = {
  evidenceType: "photo" | "chat_screenshot" | "link" | "note";
  content: string;
};

export function isSafetyReportReason(value: unknown): value is SafetyReportReason {
  return typeof value === "string" && SAFETY_REPORT_REASONS.includes(value as SafetyReportReason);
}

export function isSafetyReportStatus(value: unknown): value is SafetyReportStatus {
  return typeof value === "string" && SAFETY_REPORT_STATUSES.includes(value as SafetyReportStatus);
}

export function isSafetyReportAction(value: unknown): value is SafetyReportAction {
  return typeof value === "string" && SAFETY_REPORT_ACTIONS.includes(value as SafetyReportAction);
}

export function mapSafetyErrorStatus(code?: string): number {
  switch (code) {
    case "42501":
      return 403;
    case "P0002":
      return 404;
    case "40001":
    case "23505":
      return 409;
    case "22023":
    case "23514":
      return 422;
    case "54000":
      return 429;
    default:
      return 500;
  }
}
