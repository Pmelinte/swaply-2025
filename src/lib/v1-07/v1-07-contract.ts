export const V107_REQUIREMENTS = {
  stories: [
    "V107-STORY-001", "V107-STORY-002", "V107-STORY-003", "V107-STORY-004",
    "V107-STORY-005", "V107-STORY-006", "V107-STORY-007", "V107-STORY-008",
    "V107-STORY-009", "V107-STORY-010", "V107-STORY-011",
  ],
  blog: [
    "V107-BLOG-001", "V107-BLOG-002", "V107-BLOG-003", "V107-BLOG-004",
    "V107-BLOG-005", "V107-BLOG-006", "V107-BLOG-007", "V107-BLOG-008",
    "V107-BLOG-009",
  ],
  feedback: [
    "V107-FEEDBACK-001", "V107-FEEDBACK-002", "V107-FEEDBACK-003",
    "V107-FEEDBACK-004", "V107-FEEDBACK-005", "V107-FEEDBACK-006",
  ],
  trust: [
    "V107-TRUST-001", "V107-TRUST-002", "V107-TRUST-003", "V107-TRUST-004",
    "V107-TRUST-005",
  ],
  swapleni: [
    "V107-SWAPLENI-001", "V107-SWAPLENI-002", "V107-SWAPLENI-003",
    "V107-SWAPLENI-004", "V107-SWAPLENI-005", "V107-SWAPLENI-006",
  ],
} as const;

export type V107RequirementId =
  (typeof V107_REQUIREMENTS)[keyof typeof V107_REQUIREMENTS][number];

export const PRODUCT_STORY_STATUSES = [
  "draft", "pending_partner_consent", "pending_moderation", "published",
  "hidden", "disputed", "rejected",
] as const;

export const STORAGE_STORY_STATUSES = [
  "draft", "pending_consent", "pending_moderation", "published",
  "hidden", "disputed", "rejected",
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

const row = (
  id: V107RequirementId,
  requirement: string,
  repository: V107CapabilityAuditRow["repository"],
  production: V107CapabilityAuditRow["production"],
  blocker: string,
): V107CapabilityAuditRow => ({ id, requirement, repository, production, blocker });

export const V107_INITIAL_AUDIT: readonly V107CapabilityAuditRow[] = [
  row("V107-STORY-001", "Story draft is created only from a completed real exchange by a participant.", "foundation", "foundation", "Authenticated end-to-end evidence is not yet attached to V1-07."),
  row("V107-STORY-002", "Author and partner consent is bound to the immutable current revision.", "foundation", "foundation", "Concurrent consent, withdrawal and stale-revision replay remain to be demonstrated."),
  row("V107-STORY-003", "Product visibility supports private, community and public modes.", "partial", "partial", "Production storage supports private, participants and public; community visibility has no authority contract."),
  row("V107-STORY-004", "Public Story content excludes exact location and private contact data.", "foundation", "foundation", "Browser-to-RPC-to-public-projection evidence remains required."),
  row("V107-STORY-005", "Moderation approval is required before public publication.", "foundation", "foundation", "Moderator UI and authenticated role evidence remain incomplete."),
  row("V107-STORY-006", "Active disputes hide or suspend a Story without deleting immutable history.", "foundation", "foundation", "Dispute-after-publication E2E and re-publication evidence remain required."),
  row("V107-STORY-007", "Stories preserve original content and support translated presentation.", "partial", "unknown", "No complete Story translation persistence and fallback contract was found."),
  row("V107-STORY-008", "Story rewards are issued only after valid publication and are idempotent.", "absent", "absent", "No verified Story-to-Swapleni reward authority is present."),
  row("V107-STORY-009", "Story withdrawal removes public visibility immediately while preserving history.", "foundation", "foundation", "Authenticated withdrawal and public-read E2E evidence remain required."),
  row("V107-STORY-010", "Outsiders cannot read drafts, consents, moderation records or private revisions.", "foundation", "foundation", "V1-07 adversarial outsider replay remains required."),
  row("V107-STORY-011", "Story retries and concurrent publication attempts produce one authoritative result.", "partial", "unknown", "No V1-07 synchronized race evidence exists yet."),

  row("V107-BLOG-001", "Blog follows draft to review to approved to translated to published authority.", "partial", "absent", "Editorial statuses exist in TypeScript but are not persisted in Production."),
  row("V107-BLOG-002", "Published Blog content is read from Supabase with safe MDX fallback.", "partial", "partial", "Current public routes return no content when Supabase is unavailable; MDX fallback is not wired."),
  row("V107-BLOG-003", "Blog translations cover all active locales and preserve the original.", "partial", "partial", "Only English source rows are queried and translation evidence is not cumulative for all locales."),
  row("V107-BLOG-004", "Authenticated structured feedback and suggestions are moderated before use.", "foundation", "absent", "No Production blog feedback or suggestion relation was found."),
  row("V107-BLOG-005", "Only approved editorial roles may transition Blog content.", "foundation", "absent", "No persisted editorial-role authority or transition RPC exists in Production."),
  row("V107-BLOG-006", "Blog publication and withdrawal invalidate cache predictably.", "partial", "unknown", "No end-to-end cache invalidation evidence is recorded."),
  row("V107-BLOG-007", "Public Blog pages never expose drafts, review notes or rejected content.", "partial", "partial", "Boolean published filtering exists, but the full editorial state model is absent from Production."),
  row("V107-BLOG-008", "Blog suggestions cannot publish automatically or increase swap trust directly.", "foundation", "absent", "Suggestion persistence and server-side approval authority are absent."),
  row("V107-BLOG-009", "Approved Blog contributions may receive one capped Swapleni reward.", "absent", "absent", "No Blog-to-Swapleni reward event or cap authority exists."),

  row("V107-FEEDBACK-001", "Only an eligible participant can submit one review after completed exchange.", "implemented", "foundation", "V1-07 cumulative authenticated replay remains required."),
  row("V107-FEEDBACK-002", "Review retries are idempotent and conflicting payloads fail closed.", "implemented", "foundation", "Concurrent duplicate submission evidence remains required for V1-07."),
  row("V107-FEEDBACK-003", "Reviews are blocked for cancelled, disputed or otherwise ineligible exchanges.", "foundation", "foundation", "Negative lifecycle branches need V1-07 authenticated evidence."),
  row("V107-FEEDBACK-004", "Review responses are restricted to the reviewed participant.", "foundation", "foundation", "Participant and outsider response boundaries require replay evidence."),
  row("V107-FEEDBACK-005", "Review edits or withdrawals follow an explicit immutable-history contract.", "partial", "unknown", "No complete canonical edit/withdrawal policy and E2E were found."),
  row("V107-FEEDBACK-006", "Feedback side effects update trust deterministically without client writes.", "partial", "partial", "Multiple reputation refresh paths require reconciliation and parity evidence."),

  row("V107-TRUST-001", "Trust is calculated server-side from eligible exchange and safety signals.", "partial", "partial", "Multiple trust calculation paths exist and need one canonical deterministic authority."),
  row("V107-TRUST-002", "Trust rank is separate from Swapleni and cannot be purchased.", "foundation", "partial", "UI display and database-derived rank parity remain to be audited."),
  row("V107-TRUST-003", "Unresolved disputes and severe violations prevent automatic promotion.", "foundation", "partial", "Database calculation and UI treatment need a single verified contract."),
  row("V107-TRUST-004", "Trust recalculation is deterministic, idempotent and auditable.", "partial", "unknown", "No cumulative same-input parity and concurrency evidence exists."),
  row("V107-TRUST-005", "Displayed trust values match the authoritative persisted calculation.", "partial", "unknown", "Repository-to-Production-to-UI parity has not been demonstrated."),

  row("V107-SWAPLENI-001", "Swapleni uses an append-only server-controlled ledger.", "implemented", "foundation", "V1-07 source-specific reward and reversal E2E remains required."),
  row("V107-SWAPLENI-002", "Each eligible source can create at most one reward through an idempotency key.", "implemented", "foundation", "Story and Blog source caps are not yet connected to approved events."),
  row("V107-SWAPLENI-003", "Reward reversals are linked atomically to the original event.", "implemented", "foundation", "Source-specific rollback and replay evidence remain required."),
  row("V107-SWAPLENI-004", "Reward caps prevent farming by repeated Story, Blog or feedback actions.", "partial", "absent", "No complete source-specific cap authority exists."),
  row("V107-SWAPLENI-005", "Disputed, rejected or withdrawn content receives no retained reward.", "absent", "absent", "No verified automatic reversal connection exists for these V1-07 sources."),
  row("V107-SWAPLENI-006", "Swapleni balance and ledger display match server authority after reload.", "partial", "unknown", "Authenticated UI, reload and multi-device parity evidence remain required."),
];
