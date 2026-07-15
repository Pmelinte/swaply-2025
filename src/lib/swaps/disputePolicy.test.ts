import { describe, expect, it } from "vitest";
import {
  isCanonicalDisputeEvidenceType,
  isCanonicalDisputeReason,
  isCanonicalDisputeResolution,
  isDisputableSwapStatus,
  validateDisputeDescription,
  validateDisputeEvidence,
  validateResolutionNotes,
} from "./disputePolicy";

describe("Batch 63.2 dispute policy", () => {
  it("allows disputes only from accepted and in-progress Swaps", () => {
    expect(isDisputableSwapStatus("accepted")).toBe(true);
    expect(isDisputableSwapStatus("in_progress")).toBe(true);
    expect(isDisputableSwapStatus("pending")).toBe(false);
    expect(isDisputableSwapStatus("completed")).toBe(false);
    expect(isDisputableSwapStatus("cancelled")).toBe(false);
    expect(isDisputableSwapStatus("disputed")).toBe(false);
  });

  it("recognizes the canonical reasons, evidence types and outcomes", () => {
    expect(isCanonicalDisputeReason("item_not_received")).toBe(true);
    expect(isCanonicalDisputeReason("other")).toBe(true);
    expect(isCanonicalDisputeReason("spam")).toBe(false);
    expect(isCanonicalDisputeEvidenceType("photo")).toBe(true);
    expect(isCanonicalDisputeEvidenceType("tracking")).toBe(true);
    expect(isCanonicalDisputeEvidenceType("executable")).toBe(false);
    expect(isCanonicalDisputeResolution("resolved_requester")).toBe(true);
    expect(isCanonicalDisputeResolution("resolved_split")).toBe(true);
    expect(isCanonicalDisputeResolution("resolved")).toBe(false);
  });

  it("normalizes and validates the participant description", () => {
    expect(validateDisputeDescription("  item never arrived  ")).toEqual({
      ok: true,
      description: "item never arrived",
    });
    expect(validateDisputeDescription("too short")).toEqual({
      ok: false,
      message: "Dispute description must contain at least 10 characters",
    });
    expect(validateDisputeDescription("x".repeat(2001))).toEqual({
      ok: false,
      message: "Dispute description is too long",
    });
  });

  it("accepts at most ten validated evidence entries", () => {
    expect(
      validateDisputeEvidence([
        { evidenceType: "photo", content: " https://example.test/photo.jpg " },
        { evidenceType: "note", content: "Package was visibly damaged" },
      ]),
    ).toEqual({
      ok: true,
      evidence: [
        { evidenceType: "photo", content: "https://example.test/photo.jpg" },
        { evidenceType: "note", content: "Package was visibly damaged" },
      ],
    });
    expect(
      validateDisputeEvidence([{ evidenceType: "unknown", content: "x" }]),
    ).toEqual({ ok: false, message: "Invalid dispute evidence type" });
    expect(validateDisputeEvidence(Array.from({ length: 11 }, () => ({
      evidenceType: "note",
      content: "x",
    })))).toEqual({
      ok: false,
      message: "Dispute evidence must contain at most 10 entries",
    });
  });

  it("requires concise resolution notes", () => {
    expect(validateResolutionNotes("  evidence favors requester  ")).toEqual({
      ok: true,
      notes: "evidence favors requester",
    });
    expect(validateResolutionNotes(" ")).toEqual({
      ok: false,
      message: "Resolution notes are required",
    });
  });
});
