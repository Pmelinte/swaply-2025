import type { SwapStatus } from "./lifecycle";

export const DISPUTABLE_SWAP_STATUSES = [
  "accepted",
  "in_progress",
] as const satisfies readonly SwapStatus[];

export type DisputableSwapStatus =
  (typeof DISPUTABLE_SWAP_STATUSES)[number];

export const DISPUTE_REASONS = [
  "item_not_received",
  "wrong_item",
  "damaged",
  "condition_mismatch",
  "no_show",
  "other",
] as const;

export type CanonicalDisputeReason = (typeof DISPUTE_REASONS)[number];

export const DISPUTE_EVIDENCE_TYPES = [
  "photo",
  "chat_screenshot",
  "tracking",
  "meeting_code",
  "location_proof",
  "note",
] as const;

export type CanonicalDisputeEvidenceType =
  (typeof DISPUTE_EVIDENCE_TYPES)[number];

export const DISPUTE_RESOLUTIONS = [
  "resolved_requester",
  "resolved_responder",
  "resolved_split",
  "rejected",
] as const;

export type CanonicalDisputeResolution =
  (typeof DISPUTE_RESOLUTIONS)[number];

export type CanonicalDisputeEvidenceInput = {
  evidenceType: CanonicalDisputeEvidenceType;
  content: string;
};

export function isDisputableSwapStatus(
  value: unknown,
): value is DisputableSwapStatus {
  return (
    typeof value === "string" &&
    (DISPUTABLE_SWAP_STATUSES as readonly string[]).includes(value)
  );
}

export function isCanonicalDisputeReason(
  value: unknown,
): value is CanonicalDisputeReason {
  return (
    typeof value === "string" &&
    (DISPUTE_REASONS as readonly string[]).includes(value)
  );
}

export function isCanonicalDisputeEvidenceType(
  value: unknown,
): value is CanonicalDisputeEvidenceType {
  return (
    typeof value === "string" &&
    (DISPUTE_EVIDENCE_TYPES as readonly string[]).includes(value)
  );
}

export function isCanonicalDisputeResolution(
  value: unknown,
): value is CanonicalDisputeResolution {
  return (
    typeof value === "string" &&
    (DISPUTE_RESOLUTIONS as readonly string[]).includes(value)
  );
}

export function validateDisputeDescription(
  description: string | null | undefined,
): { ok: true; description: string } | { ok: false; message: string } {
  const normalized = (description ?? "").trim();
  if (normalized.length < 10) {
    return {
      ok: false,
      message: "Dispute description must contain at least 10 characters",
    };
  }
  if (normalized.length > 2000) {
    return { ok: false, message: "Dispute description is too long" };
  }
  return { ok: true, description: normalized };
}

export function validateDisputeEvidence(
  value: unknown,
):
  | { ok: true; evidence: CanonicalDisputeEvidenceInput[] }
  | { ok: false; message: string } {
  if (value === undefined || value === null) {
    return { ok: true, evidence: [] };
  }
  if (!Array.isArray(value) || value.length > 10) {
    return { ok: false, message: "Dispute evidence must contain at most 10 entries" };
  }

  const evidence: CanonicalDisputeEvidenceInput[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      return { ok: false, message: "Invalid dispute evidence entry" };
    }
    const record = entry as Record<string, unknown>;
    if (!isCanonicalDisputeEvidenceType(record.evidenceType)) {
      return { ok: false, message: "Invalid dispute evidence type" };
    }
    const content = typeof record.content === "string" ? record.content.trim() : "";
    if (content.length < 1 || content.length > 2000) {
      return { ok: false, message: "Invalid dispute evidence content" };
    }
    evidence.push({ evidenceType: record.evidenceType, content });
  }

  return { ok: true, evidence };
}

export function validateResolutionNotes(
  notes: string | null | undefined,
): { ok: true; notes: string } | { ok: false; message: string } {
  const normalized = (notes ?? "").trim();
  if (normalized.length < 3) {
    return { ok: false, message: "Resolution notes are required" };
  }
  if (normalized.length > 2000) {
    return { ok: false, message: "Resolution notes are too long" };
  }
  return { ok: true, notes: normalized };
}
