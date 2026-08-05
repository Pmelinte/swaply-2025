import { describe, expect, it } from "vitest";
import {
  V107_ALL_REQUIREMENT_IDS,
  V107_CANONICAL_BLOCKERS,
  V107_CLOSURE_READINESS,
  V107_CONFIGURATION_BLOCKERS,
  V107_FINAL_GATE_REQUIRED,
  assertV107ClosureManifestComplete,
} from "@/lib/v1-07/v1-07-closure-readiness";

describe("V1-07.10 cross-cutting closure readiness", () => {
  it("accounts for every canonical V1-07 requirement exactly once", () => {
    expect(() => assertV107ClosureManifestComplete()).not.toThrow();
    expect(V107_CLOSURE_READINESS).toHaveLength(V107_ALL_REQUIREMENT_IDS.length);
    expect(new Set(V107_CLOSURE_READINESS.map((entry) => entry.id)).size).toBe(
      V107_ALL_REQUIREMENT_IDS.length,
    );
  });

  it("does not falsely close community visibility", () => {
    expect(V107_CANONICAL_BLOCKERS).toEqual([
      expect.objectContaining({
        id: "V107-STORY-003",
        state: "blocked_by_canonical_decision",
      }),
    ]);
    expect(V107_CANONICAL_BLOCKERS[0]?.blocker).toContain("No decision authorises equivalence");
  });

  it("keeps numeric Swapleni policies explicitly inactive", () => {
    expect(V107_CONFIGURATION_BLOCKERS.map((entry) => entry.id).sort()).toEqual([
      "V107-BLOG-009",
      "V107-STORY-008",
      "V107-SWAPLENI-004",
    ]);
    for (const entry of V107_CONFIGURATION_BLOCKERS) {
      expect(entry.blocker).toMatch(/inactive|not authorised/i);
      expect(entry.evidencePrs).toContain(610);
    }
  });

  it("requires a single cumulative final gate for all remaining implemented capabilities", () => {
    expect(V107_FINAL_GATE_REQUIRED.length).toBeGreaterThan(0);
    for (const entry of V107_FINAL_GATE_REQUIRED) {
      expect(entry.finalGate.length).toBeGreaterThan(0);
      expect(entry.evidencePrs.length).toBeGreaterThan(0);
      expect(entry.state).toMatch(/pending_cumulative_evidence$/);
    }
  });

  it("keeps Blog, Stories, Trust and Swapleni authority separated", () => {
    const storyRewards = V107_CLOSURE_READINESS.find((entry) => entry.id === "V107-STORY-008");
    const blogRewards = V107_CLOSURE_READINESS.find((entry) => entry.id === "V107-BLOG-009");
    const trustSeparation = V107_CLOSURE_READINESS.find((entry) => entry.id === "V107-TRUST-002");

    expect(storyRewards?.finalGate).toContain("eligible publication");
    expect(blogRewards?.finalGate).toContain("approved contribution");
    expect(trustSeparation?.finalGate).toContain("Swapleni separation");
  });

  it("does not claim V1-07 closed before the cumulative PR", () => {
    expect(V107_CLOSURE_READINESS.some((entry) => entry.state.includes("pending"))).toBe(true);
    expect(V107_CLOSURE_READINESS.every((entry) => !entry.state.includes("closed"))).toBe(true);
  });
});
