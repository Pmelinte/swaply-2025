import type { IntegrationAuditArea } from "@/lib/integration-audit-v2/integrationAuditTypes";
import type { PublicExperiencePage } from "@/lib/public-pages/publicPageExperienceConfig";

export type PublicFoundationStackTrackId =
  | "human_centered"
  | "advanced_swaps"
  | "photo_discovery"
  | "guided_chat"
  | "exchange_safety"
  | "token_rank"
  | "language_fallback"
  | "blog_feedback"
  | "ai_advisory";

export interface PublicFoundationStackTrack {
  id: PublicFoundationStackTrackId;
  title: string;
  summary: string;
  publicPromise: string;
  badge: string;
  ctaHref: string;
  ctaLabel: string;
  relatedAreas: readonly IntegrationAuditArea[];
  auditCheckIds: readonly string[];
  pages: readonly PublicExperiencePage[];
  priority: number;
  requiresLoginForRealAction: boolean;
}

export interface PublicFoundationStackSummary {
  page: PublicExperiencePage;
  tracks: readonly PublicFoundationStackTrack[];
  requiredTrackIds: readonly PublicFoundationStackTrackId[];
  loginRequiredOnlyForRealActions: boolean;
}
