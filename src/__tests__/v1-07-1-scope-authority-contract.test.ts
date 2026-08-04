import { describe, expect, it } from "vitest";
import {
  PRODUCT_STORY_STATUSES,
  PRODUCT_STORY_VISIBILITIES,
  STORAGE_STORY_STATUSES,
  STORAGE_STORY_VISIBILITIES,
  V107_INITIAL_AUDIT,
  V107_REQUIREMENTS,
  toProductStoryStatus,
  toProductStoryVisibility,
  toStorageStoryStatus,
  toStorageStoryVisibility,
} from "@/lib/v1-07/v1-07-contract";

describe("V1-07.1 canonical scope and authority contract", () => {
  it("assigns unique requirement IDs across all V1-07 domains", () => {
    const ids = Object.values(V107_REQUIREMENTS).flat();
    expect(ids.length).toBeGreaterThanOrEqual(30);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("audits every declared requirement exactly once", () => {
    const declared = Object.values(V107_REQUIREMENTS).flat().sort();
    const audited = V107_INITIAL_AUDIT.map((row) => row.id).sort();

    expect(audited).toEqual(declared);
    expect(new Set(audited).size).toBe(audited.length);
  });

  it("keeps Stories, Blog, feedback, trust and Swapleni as separate requirement families", () => {
    expect(V107_REQUIREMENTS.stories.every((id) => id.startsWith("V107-STORY-"))).toBe(true);
    expect(V107_REQUIREMENTS.blog.every((id) => id.startsWith("V107-BLOG-"))).toBe(true);
    expect(V107_REQUIREMENTS.feedback.every((id) => id.startsWith("V107-FEEDBACK-"))).toBe(true);
    expect(V107_REQUIREMENTS.trust.every((id) => id.startsWith("V107-TRUST-"))).toBe(true);
    expect(V107_REQUIREMENTS.swapleni.every((id) => id.startsWith("V107-SWAPLENI-"))).toBe(true);
  });

  it("records the current Story status vocabulary without pretending storage equals product language", () => {
    expect(PRODUCT_STORY_STATUSES).toContain("pending_partner_consent");
    expect(STORAGE_STORY_STATUSES).toContain("pending_consent");
    expect(toStorageStoryStatus("pending_partner_consent")).toBe("pending_consent");
    expect(toProductStoryStatus("pending_consent")).toBe("pending_partner_consent");
  });

  it("fails closed for community visibility until an authority contract exists", () => {
    expect(PRODUCT_STORY_VISIBILITIES).toEqual(["private", "community", "public"]);
    expect(STORAGE_STORY_VISIBILITIES).toEqual(["private", "participants", "public"]);
    expect(toStorageStoryVisibility("private")).toBe("private");
    expect(toStorageStoryVisibility("public")).toBe("public");
    expect(toStorageStoryVisibility("community")).toBeNull();
    expect(toProductStoryVisibility("participants")).toBe("private");
  });

  it("does not mark every audited capability as implemented or Production verified", () => {
    expect(V107_INITIAL_AUDIT.some((row) => row.repository === "absent")).toBe(true);
    expect(V107_INITIAL_AUDIT.some((row) => row.production === "absent")).toBe(true);
    expect(V107_INITIAL_AUDIT.some((row) => row.production === "unknown")).toBe(true);
    expect(V107_INITIAL_AUDIT.every((row) => row.blocker !== null)).toBe(true);
  });

  it("records the confirmed Blog and Story authority gaps", () => {
    const community = V107_INITIAL_AUDIT.find((row) => row.id === "V107-STORY-003");
    const editorial = V107_INITIAL_AUDIT.find((row) => row.id === "V107-BLOG-001");
    const fallback = V107_INITIAL_AUDIT.find((row) => row.id === "V107-BLOG-002");
    const storyReward = V107_INITIAL_AUDIT.find((row) => row.id === "V107-STORY-008");

    expect(community?.blocker).toContain("community visibility");
    expect(editorial?.blocker).toContain("not persisted");
    expect(fallback?.blocker).toContain("MDX fallback");
    expect(storyReward?.production).toBe("absent");
  });
});
