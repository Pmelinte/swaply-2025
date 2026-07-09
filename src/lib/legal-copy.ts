export const SWAPLY_PUBLIC_BASE_URL = "https://www.swaply.world";
export const SWAPLY_PUBLIC_SUPPORT_EMAIL = "support@swaply.world";
export const SWAPLY_PUBLIC_PRIVACY_EMAIL = "privacy@swaply.world";
export const SWAPLY_PUBLIC_DPO_EMAIL = "dpo@swaply.world";
export const SWAPLY_PUBLIC_SAFETY_EMAIL = "safety@swaply.world";
export const SWAPLY_PUBLIC_DMCA_EMAIL = "dmca@swaply.world";
export const SWAPLY_PUBLIC_LEGAL_EMAIL = "legal@swaply.world";

const PUBLIC_LEGAL_COPY_REPLACEMENTS = [
  ["support@swaply.app", SWAPLY_PUBLIC_SUPPORT_EMAIL],
  ["privacy@swaply.app", SWAPLY_PUBLIC_PRIVACY_EMAIL],
  ["dpo@swaply.app", SWAPLY_PUBLIC_DPO_EMAIL],
  ["safety@swaply.app", SWAPLY_PUBLIC_SAFETY_EMAIL],
  ["dmca@swaply.app", SWAPLY_PUBLIC_DMCA_EMAIL],
  ["legal@swaply.app", SWAPLY_PUBLIC_LEGAL_EMAIL],
  ["https://www.swaply.io", SWAPLY_PUBLIC_BASE_URL],
  ["https://swaply.io", SWAPLY_PUBLIC_BASE_URL],
  ["www.swaply.io", "www.swaply.world"],
  ["swaply.io", "swaply.world"],
] as const;

/**
 * Keeps public legal/trust copy aligned with the canonical Swaply public domain.
 *
 * Some translated legal strings were generated before `swaply.world` became the
 * canonical public domain. This normalizer is intentionally narrow: it only
 * replaces legacy public contact domains and legacy public URL examples, without
 * changing legal meaning, routes, auth, data access, or business logic.
 */
export function normalizePublicLegalCopy(value: string): string {
  let normalized = value;

  for (const [from, to] of PUBLIC_LEGAL_COPY_REPLACEMENTS) {
    normalized = normalized.split(from).join(to);
  }

  return normalized;
}
