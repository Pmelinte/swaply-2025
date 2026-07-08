import { locales, type Locale } from "@/i18n/config";
import { getPublicVisualAuditRoutes, getPublicDrawerAuditRoutes } from "@/lib/public-pages/publicRouteAudit";

export const REQUIRED_CI_JOBS = [
  "Unit Tests",
  "Lint & Type Check",
  "Build",
  "Public Visual Audit",
] as const;

export const REQUIRED_CI_ARTIFACTS = [
  "vitest-results",
  "swaply-public-visual-audit-screenshots",
  "swaply-public-visual-audit-report",
  "swaply-public-visual-audit-test-results",
] as const;

export const STACKED_PR_RELEASE_ORDER = [
  "agentic/batch-1-global-drawer-public-blog",
  "agentic/batch-2-drawer-navigation-audit",
  "agentic/batch-3-public-pages-proof",
  "agentic/batch-4-public-page-ui-integration",
  "agentic/batch-5-ai-gateway-skeleton",
  "agentic/batch-6-stories-foundation",
  "agentic/batch-7-release-readiness",
] as const;

export const RELEASE_SMOKE_LOCALES = ["en", "ro", "fr", "fil"] as const satisfies readonly Locale[];

export function getReleaseSmokeRoutes() {
  return RELEASE_SMOKE_LOCALES.flatMap((locale) => [
    ...getPublicVisualAuditRoutes(locale),
  ]);
}

export function getReleaseDrawerSmokeRoutes() {
  return RELEASE_SMOKE_LOCALES.flatMap((locale) => [
    ...getPublicDrawerAuditRoutes(locale),
  ]);
}

export function isSupportedReleaseSmokeLocale(locale: string): locale is (typeof RELEASE_SMOKE_LOCALES)[number] {
  return RELEASE_SMOKE_LOCALES.includes(locale as (typeof RELEASE_SMOKE_LOCALES)[number]) && locales.includes(locale as Locale);
}

export function getMissingRequiredArtifacts(uploadedArtifactNames: readonly string[]) {
  return REQUIRED_CI_ARTIFACTS.filter((artifact) => !uploadedArtifactNames.includes(artifact));
}

export function getMissingRequiredJobs(successfulJobNames: readonly string[]) {
  return REQUIRED_CI_JOBS.filter((job) => !successfulJobNames.includes(job));
}
