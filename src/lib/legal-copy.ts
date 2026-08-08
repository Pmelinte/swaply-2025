import { SWAPLY_PUBLIC_BASE_URL, SWAPLY_PUBLIC_DOMAIN } from "./public-site";

export { SWAPLY_PUBLIC_BASE_URL, SWAPLY_PUBLIC_DOMAIN } from "./public-site";

export const SWAPLY_PUBLIC_SUPPORT_EMAIL = "support@swaply.world";
export const SWAPLY_PUBLIC_PRIVACY_EMAIL = "privacy@swaply.world";
export const SWAPLY_PUBLIC_DPO_EMAIL = "dpo@swaply.world";
export const SWAPLY_PUBLIC_SAFETY_EMAIL = "safety@swaply.world";
export const SWAPLY_PUBLIC_DMCA_EMAIL = "dmca@swaply.world";
export const SWAPLY_PUBLIC_LEGAL_EMAIL = "legal@swaply.world";
export const SWAPLY_TERMS_REVISION_DATE = "2026-08-08";

const PUBLIC_LEGAL_COPY_REPLACEMENTS = [
  ["support@swaply.app", SWAPLY_PUBLIC_SUPPORT_EMAIL],
  ["privacy@swaply.app", SWAPLY_PUBLIC_PRIVACY_EMAIL],
  ["dpo@swaply.app", SWAPLY_PUBLIC_DPO_EMAIL],
  ["safety@swaply.app", SWAPLY_PUBLIC_SAFETY_EMAIL],
  ["dmca@swaply.app", SWAPLY_PUBLIC_DMCA_EMAIL],
  ["legal@swaply.app", SWAPLY_PUBLIC_LEGAL_EMAIL],
  ["https://www.swaply.io", SWAPLY_PUBLIC_BASE_URL],
  ["https://swaply.io", SWAPLY_PUBLIC_BASE_URL],
  ["www.swaply.io", SWAPLY_PUBLIC_DOMAIN],
  ["swaply.io", "swaply.world"],
] as const;

export type PublicTermsSectionId =
  | "acceptance"
  | "eligibility"
  | "account-rules"
  | "swap-rules"
  | "prohibited"
  | "moderation"
  | "liability"
  | "intellectual-property"
  | "changes"
  | "contact";

const CANONICAL_TERMS_SECTION_COPY: Partial<Record<PublicTermsSectionId, string>> = {
  "account-rules":
    "One account per person. Provide accurate information and do not share credentials. Account deletion is handled through the GDPR deletion workflow available from Profile > Account & Settings; some records may be deleted, anonymized, or retained where required for security, disputes, fraud prevention, accounting, or legal obligations.",
  "swap-rules":
    "Swaply facilitates voluntary exchanges and arrangements between users across Objects, Properties, Services, and Events. Swaply is not a party to the agreement between users. Participants are responsible for confirming the scope, condition, timing, logistics, and other terms of their exchange before completion.",
  prohibited:
    "Illegal goods, services, activities, or transactions are prohibited. This includes weapons, illegal drugs, counterfeit goods, stolen property, hazardous materials, and other content or transactions prohibited by applicable law. Users must not use Swaply to offer or arrange regulated or unlawful activity. Listings or accounts that violate these rules may be restricted, removed, reported, or suspended after review.",
  moderation:
    "Swaply provides reporting, blocking, and dispute tools to help users address inappropriate content, unsafe behavior, or exchange problems. Reports and disputes may be reviewed and acted on under the platform's safety controls. Swaply does not guarantee that every private message is automatically screened or moderated before delivery. AI may be used for specific product functions, such as item analysis, where disclosed in the Privacy Policy.",
  liability:
    "Swaply is provided as a platform for users to discover and arrange exchanges. To the extent permitted by applicable law, Swaply does not guarantee the quality, legality, safety, availability, delivery, performance, or outcome of user-provided objects, properties, services, events, or arrangements. Users should use appropriate precautions, tracked logistics where relevant, and the available report, block, and dispute tools when necessary.",
};

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

/**
 * Returns authoritative runtime copy for Terms sections whose historical
 * translations materially diverge from the current product behavior.
 *
 * The translated value remains the fallback for sections that are still aligned.
 * Canonical overrides are deliberately limited to sections where V1-09 found a
 * legal/runtime mismatch. This avoids pretending that inactive capabilities
 * (for example universal automatic message moderation) exist in Production.
 */
export function getPublicTermsSectionCopy(
  sectionId: PublicTermsSectionId,
  translatedValue: string,
): string {
  const canonical = CANONICAL_TERMS_SECTION_COPY[sectionId];
  return normalizePublicLegalCopy(canonical ?? translatedValue);
}
