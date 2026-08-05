import { V107_REQUIREMENTS, type V107RequirementId } from "./v1-07-contract";

export type V107ClosureState =
  | "implemented_pending_cumulative_evidence"
  | "production_verified_pending_cumulative_evidence"
  | "blocked_by_canonical_decision"
  | "blocked_by_explicit_configuration";

export interface V107ClosureReadinessRow {
  id: V107RequirementId;
  state: V107ClosureState;
  evidencePrs: readonly number[];
  finalGate: readonly string[];
  blocker: string | null;
}

const row = (
  id: V107RequirementId,
  state: V107ClosureState,
  evidencePrs: readonly number[],
  finalGate: readonly string[],
  blocker: string | null = null,
): V107ClosureReadinessRow => ({ id, state, evidencePrs, finalGate, blocker });

export const V107_CLOSURE_READINESS: readonly V107ClosureReadinessRow[] = [
  row("V107-STORY-001", "production_verified_pending_cumulative_evidence", [603, 604, 605], ["completed participant exchange", "authenticated replay", "cleanup"]),
  row("V107-STORY-002", "production_verified_pending_cumulative_evidence", [603, 604, 605], ["bilateral consent", "stale revision", "concurrent consent"]),
  row("V107-STORY-003", "blocked_by_canonical_decision", [603], ["private", "public", "participants remains non-community"], "The product requires community while current storage uses participants. No decision authorises equivalence."),
  row("V107-STORY-004", "production_verified_pending_cumulative_evidence", [603, 604, 605], ["contact redaction", "exact-location denial", "public projection"]),
  row("V107-STORY-005", "production_verified_pending_cumulative_evidence", [603, 604, 605], ["moderator authority", "outsider denial", "publication gate"]),
  row("V107-STORY-006", "production_verified_pending_cumulative_evidence", [604, 605], ["post-publication dispute", "immediate suppression", "immutable history"]),
  row("V107-STORY-007", "implemented_pending_cumulative_evidence", [604, 605], ["original preserved", "locale fallback", "translation-provider failure fallback"]),
  row("V107-STORY-008", "blocked_by_explicit_configuration", [610], ["eligible publication", "one reward", "policy inactive by default"], "Reward amounts, caps and windows are intentionally inactive until explicit product configuration."),
  row("V107-STORY-009", "production_verified_pending_cumulative_evidence", [604, 605], ["withdrawal", "public invisibility", "history retained"]),
  row("V107-STORY-010", "production_verified_pending_cumulative_evidence", [603, 604, 605], ["outsider draft denial", "consent denial", "moderation denial"]),
  row("V107-STORY-011", "production_verified_pending_cumulative_evidence", [604, 605], ["concurrent publication", "single authoritative revision", "replay"]),

  row("V107-BLOG-001", "production_verified_pending_cumulative_evidence", [606, 607], ["draft", "review", "published", "archived"]),
  row("V107-BLOG-002", "implemented_pending_cumulative_evidence", [606], ["Supabase source", "MDX fallback", "provider outage"]),
  row("V107-BLOG-003", "implemented_pending_cumulative_evidence", [606], ["43 locales", "original preserved", "English technical fallback"]),
  row("V107-BLOG-004", "production_verified_pending_cumulative_evidence", [609], ["authenticated submit", "moderation", "withdrawal", "owner read"]),
  row("V107-BLOG-005", "production_verified_pending_cumulative_evidence", [607], ["service authority", "invalid transition denial", "stale revision"]),
  row("V107-BLOG-006", "implemented_pending_cumulative_evidence", [606, 607], ["publish invalidation", "withdraw invalidation", "reload"]),
  row("V107-BLOG-007", "production_verified_pending_cumulative_evidence", [607], ["anonymous published read", "draft denial", "archived denial"]),
  row("V107-BLOG-008", "production_verified_pending_cumulative_evidence", [609], ["no auto-publish", "no trust mutation", "moderation history"]),
  row("V107-BLOG-009", "blocked_by_explicit_configuration", [610], ["approved contribution", "one capped reward", "policy inactive by default"], "Reward amounts, caps and windows are intentionally inactive until explicit product configuration."),

  row("V107-FEEDBACK-001", "production_verified_pending_cumulative_evidence", [608], ["completed exchange", "participant", "one review"]),
  row("V107-FEEDBACK-002", "production_verified_pending_cumulative_evidence", [608], ["same-payload replay", "conflicting payload denial", "concurrent submit"]),
  row("V107-FEEDBACK-003", "production_verified_pending_cumulative_evidence", [608], ["cancelled denial", "disputed denial", "outsider denial"]),
  row("V107-FEEDBACK-004", "production_verified_pending_cumulative_evidence", [608], ["reviewed participant response", "outsider denial", "replay"]),
  row("V107-FEEDBACK-005", "implemented_pending_cumulative_evidence", [608], ["immutable review history", "explicit non-editability", "response history"]),
  row("V107-FEEDBACK-006", "production_verified_pending_cumulative_evidence", [608], ["server-side recalculation", "no client writes", "same-input parity"]),

  row("V107-TRUST-001", "production_verified_pending_cumulative_evidence", [608], ["completed", "cancelled", "disputed", "server authority"]),
  row("V107-TRUST-002", "production_verified_pending_cumulative_evidence", [608, 610], ["DB-derived rank", "Swapleni separation", "no purchase path"]),
  row("V107-TRUST-003", "production_verified_pending_cumulative_evidence", [608], ["dispute signal", "adverse outcome", "promotion prevention"]),
  row("V107-TRUST-004", "production_verified_pending_cumulative_evidence", [608], ["deterministic recalculation", "idempotency", "trigger authority"]),
  row("V107-TRUST-005", "implemented_pending_cumulative_evidence", [608], ["persisted value", "UI display", "reload and second-device parity"]),

  row("V107-SWAPLENI-001", "production_verified_pending_cumulative_evidence", [610], ["append-only ledger", "service-only writer", "owner read"]),
  row("V107-SWAPLENI-002", "production_verified_pending_cumulative_evidence", [610], ["deterministic idempotency key", "one source reward", "concurrent replay"]),
  row("V107-SWAPLENI-003", "production_verified_pending_cumulative_evidence", [610], ["linked reversal", "reversal replay", "immutable original"]),
  row("V107-SWAPLENI-004", "blocked_by_explicit_configuration", [610], ["per-user window cap", "recipient bucket serialization", "inactive policy"], "Numeric reward policies are not authorised yet."),
  row("V107-SWAPLENI-005", "production_verified_pending_cumulative_evidence", [610], ["withdrawn source", "rejected source", "disputed source", "zero retained reward"]),
  row("V107-SWAPLENI-006", "implemented_pending_cumulative_evidence", [610], ["account-ledger parity", "reload", "second-device parity"]),
];

export const V107_ALL_REQUIREMENT_IDS: readonly V107RequirementId[] = Object.values(
  V107_REQUIREMENTS,
).flat();

export const V107_CANONICAL_BLOCKERS = V107_CLOSURE_READINESS.filter(
  (entry) => entry.state === "blocked_by_canonical_decision",
);

export const V107_CONFIGURATION_BLOCKERS = V107_CLOSURE_READINESS.filter(
  (entry) => entry.state === "blocked_by_explicit_configuration",
);

export const V107_FINAL_GATE_REQUIRED = V107_CLOSURE_READINESS.filter(
  (entry) => entry.state.endsWith("pending_cumulative_evidence"),
);

export function assertV107ClosureManifestComplete(): void {
  const actual = new Set(V107_CLOSURE_READINESS.map((entry) => entry.id));
  const expected = new Set(V107_ALL_REQUIREMENT_IDS);

  if (actual.size !== expected.size) {
    throw new Error(`V1-07 closure manifest size mismatch: ${actual.size}/${expected.size}`);
  }

  for (const id of expected) {
    if (!actual.has(id)) {
      throw new Error(`V1-07 closure manifest is missing ${id}`);
    }
  }
}
