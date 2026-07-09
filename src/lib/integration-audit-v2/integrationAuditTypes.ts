export type IntegrationAuditArea =
  | "human_centered_swapping"
  | "advanced_swap_modes"
  | "photo_discovery"
  | "guided_chat"
  | "exchange_lifecycle"
  | "token_rank_separation"
  | "blog_suggestions"
  | "ai_evals"
  | "language_fallback";

export type IntegrationAuditStatus = "pass" | "warn" | "fail";

export interface IntegrationAuditCheck {
  id: string;
  area: IntegrationAuditArea;
  label: string;
  status: IntegrationAuditStatus;
  evidence: string;
  blocking: boolean;
}

export interface IntegrationAuditReport {
  id: string;
  title: string;
  checks: IntegrationAuditCheck[];
  overallStatus: IntegrationAuditStatus;
  blockingFailures: IntegrationAuditCheck[];
  warnings: IntegrationAuditCheck[];
  safeToContinueStacking: boolean;
}

export const INTEGRATION_AUDIT_AREAS: readonly IntegrationAuditArea[] = [
  "human_centered_swapping",
  "advanced_swap_modes",
  "photo_discovery",
  "guided_chat",
  "exchange_lifecycle",
  "token_rank_separation",
  "blog_suggestions",
  "ai_evals",
  "language_fallback",
] as const;
