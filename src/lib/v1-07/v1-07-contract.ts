export const V107_REQUIREMENTS = {
  stories: [
    "V107-STORY-001",
    "V107-STORY-002",
    "V107-STORY-003",
    "V107-STORY-004",
    "V107-STORY-005",
    "V107-STORY-006",
    "V107-STORY-007",
    "V107-STORY-008",
    "V107-STORY-009",
    "V107-STORY-010",
    "V107-STORY-011",
  ],
  blog: [
    "V107-BLOG-001",
    "V107-BLOG-002",
    "V107-BLOG-003",
    "V107-BLOG-004",
    "V107-BLOG-005",
    "V107-BLOG-006",
    "V107-BLOG-007",
    "V107-BLOG-008",
    "V107-BLOG-009",
  ],
  feedback: [
    "V107-FEEDBACK-001",
    "V107-FEEDBACK-002",
    "V107-FEEDBACK-003",
    "V107-FEEDBACK-004",
    "V107-FEEDBACK-005",
    "V107-FEEDBACK-006",
  ],
  trust: [
    "V107-TRUST-001",
    "V107-TRUST-002",
    "V107-TRUST-003",
    "V107-TRUST-004",
    "V107-TRUST-005",
  ],
  swapleni: [
    "V107-SWAPLENI-001",
    "V107-SWAPLENI-002",
    "V107-SWAPLENI-003",
    "V107-SWAPLENI-004",
    "V107-SWAPLENI-005",
    "V107-SWAPLENI-006",
  ],
} as const;

export type V107RequirementId =
  (typeof V107_REQUIREMENTS)[keyof typeof V107_REQUIREMENTS][number];

export const PRODUCT_STORY_STATUSES = [
  "draft",
  "pending_partner_consent",
  "pending_moderation",
  "published",
  "hidden",
  "disputed",
  "rejected",
] as const;

export const STORAGE_STORY_STATUSES = [
  "draft",
  "pending_consent",
  "pending_moderation",
  "published",
  "hidden",
  "disputed",
  "rejected",
] as const;

export type ProductStoryStatus = (typeof PRODUCT_STORY_STATUSES)[number];
export type StorageStoryStatus = (typeof STORAGE_STORY_STATUSES)[number];

export const PRODUCT_STORY_VISIBILITIES = ["private", "community", "public"] as const;
export const STORAGE_STORY_VISIBILITIES = ["private", "participants", "public"] as const;

export type ProductStoryVisibility = (typeof PRODUCT_STORY_VISIBILITIES)[number];
export type StorageStoryVisibility = (typeof STORAGE_STORY_VISIBILITIES)[number];

export function toStorageStoryStatus(status: ProductStoryStatus): StorageStoryStatus {
  return status === "pending_partner_consent" ? "pending_consent" : status;
}

export function toProductStoryStatus(status: StorageStoryStatus): ProductStoryStatus {
  return status === "pending_consent" ? "pending_partner_consent" : status;
}

export function toStorageStoryVisibility(
  visibility: ProductStoryVisibility,
): StorageStoryVisibility | null {
  if (visibility === "community") return null;
  return visibility;
}

export function toProductStoryVisibility(
  visibility: StorageStoryVisibility,
): ProductStoryVisibility {
  return visibility === "participants" ? "private" : visibility;
}

export interface V107CapabilityAuditRow {
  id: V107RequirementId;
  requirement: string;
  repository: "absent" | "foundation" | "partial" | "implemented";
  production: "unknown" | "absent" | "foundation" | "partial" | "verified";
  blocker: string | null;
}

export const V107_INITIAL_AUDIT: readonly V107CapabilityAuditRow[] = [
  {
    id: "V107-STORY-001",
    requirement: "Story draft is created only from a completed real exchange by a participant.",
    repository: "foundation",
    production: "foundation",
    blocker: "Authenticated end-to-end evidence is not yet attached to V1-07.",
  },
  {
    id: "V107-STORY-002",
    requirement: "Author and partner consent is bound to the immutable current revision.",
    repository: "foundation",
    production: "foundation",
    blocker: "Concurrent consent, withdrawal and stale-revision replay remain to be demonstrated.",
  },
  {
    id: "V107-STORY-003",
    requirement: "Product visibility supports private, community and public modes.",
    repository: "partial",
    production: "partial",
    blocker: "Production storage supports private, participants and public; community visibility has no authority contract.",
  },
  {
    id: "V107-STORY-004",
    requirement: "Public Story content excludes exact location and private contact data.",
    repository: "foundation",
    production: "foundation",
    blocker: "Browser-to-RPC-to-public-projection evidence remains required.",
  },
  {
    id: "V107-STORY-005",
    requirement: "Moderation approval is required before public publication.",
    repository: "foundation",
    production: "foundation",
    blocker: "Moderator UI and authenticated role evidence remain incomplete.",
  },
  {
    id: "V107-STORY-006",
    requirement: "Active disputes hide or suspend a Story without deleting immutable history.",
    repository: "foundation",
    production: "foundation",
    blocker: "Dispute-after-publication E2E and re-publication evidence remain required.",
  },
  {
    id: "V107-STORY-007",
    requirement: "Stories preserve original content and support translated presentation.",
    repository: "partial",
    production: "unknown",
    blocker: "No complete Story translation persistence and fallback contract was found.",
  },
  {
    id: "V107-STORY-008",
    requirement: "Story rewards are issued only after valid publication and are idempotent.",
    repository: "absent",
    production: "absent",
    blocker: "No verified Story-to-Swapleni reward authority is present.",
  },
  {
    id: "V107-BLOG-001",
    requirement: "Blog follows draft to review to approved to translated to published authority.",
    repository: "partial",
    production: "absent",
    blocker: "Editorial statuses exist in TypeScript but are not persisted in the Production blog schema.",
  },
  {
    id: "V107-BLOG-002",
    requirement: "Published Blog content is read from Supabase with safe MDX fallback.",
    repository: "partial",
    production: "partial",
    blocker: "Current public routes return no content when Supabase is unavailable; MDX fallback is not wired.",
  },
  {
    id: "V107-BLOG-003",
    requirement: "Blog translations cover all active locales and preserve the original.",
    repository: "partial",
    production: "partial",
    blocker: "Only English source rows are queried and translation evidence is not cumulative for all locales.",
  },
  {
    id: "V107-BLOG-004",
    requirement: "Authenticated structured feedback and suggestions are moderated before use.",
    repository: "foundation",
    production: "absent",
    blocker: "No Production blog feedback or suggestion relation was found.",
  },
  {
    id: "V107-FEEDBACK-001",
    requirement: "Only an eligible participant can submit one review after completed exchange.",
    repository: "implemented",
    production: "foundation",
    blocker: "V1-07 cumulative authenticated replay remains required.",
  },
  {
    id: "V107-FEEDBACK-002",
    requirement: "Review retries are idempotent and conflicting payloads fail closed.",
    repository: "implemented",
    production: "foundation",
    blocker: "Concurrent duplicate submission evidence remains required for V1-07.",
  },
  {
    id: "V107-TRUST-001",
    requirement: "Trust is calculated server-side from eligible exchange and safety signals.",
    repository: "partial",
    production: "partial",
    blocker: "Multiple trust calculation paths exist and need one canonical deterministic authority.",
  },
  {
    id: "V107-TRUST-002",
    requirement: "Trust rank is separate from Swapleni and cannot be purchased.",
    repository: "foundation",
    production: "partial",
    blocker: "UI display and database-derived rank parity remain to be audited.",
  },
  {
    id: "V107-SWAPLENI-001",
    requirement: "Swapleni uses an append-only server-controlled ledger.",
    repository: "implemented",
    production: "foundation",
    blocker: "V1-07 source-specific reward and reversal E2E remains required.",
  },
  {
    id: "V107-SWAPLENI-002",
    requirement: "Each eligible source can create at most one reward through an idempotency key.",
    repository: "implemented",
    production: "foundation",
    blocker: "Story and Blog source caps are not yet connected to approved events.",
  },
];
