import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  V107_ALL_REQUIREMENT_IDS,
  V107_CANONICAL_BLOCKERS,
  V107_CLOSURE_READINESS,
  V107_CONFIGURATION_BLOCKERS,
  V107_FINAL_GATE_REQUIRED,
  assertV107ClosureManifestComplete,
} from "@/lib/v1-07/v1-07-closure-readiness";

const root = process.cwd();
const requiredFiles = [
  "src/__tests__/v1-07-1-scope-authority-contract.test.ts",
  "src/__tests__/v1-07-2-stories-authority.test.ts",
  "src/__tests__/stories-authoritative-lifecycle.test.ts",
  "src/__tests__/blog-locale-mdx-fallback.test.ts",
  "src/__tests__/v1-07-6-blog-editorial-authority.test.ts",
  "src/__tests__/v1-07-7-feedback-trust-authority.test.ts",
  "src/__tests__/v1-07-8-blog-feedback-authority.test.ts",
  "src/__tests__/v1-07-9-swapleni-policy-authority.test.ts",
  "src/__tests__/v1-07-10-cross-cutting-closure-readiness.test.ts",
  "supabase/migrations/20260805002000_v1_07_4_story_moderation_requires_bilateral_consent.sql",
  "supabase/migrations/20260805010000_v1_07_6_blog_editorial_authority.sql",
  "supabase/migrations/20260805103000_v1_07_7_feedback_trust_authority.sql",
  "supabase/migrations/20260805120000_v1_07_8_blog_feedback_authority.sql",
  "supabase/migrations/20260805165000_v1_07_9_swapleni_policy_authority.sql",
] as const;

describe("V1-07.11 final cumulative gate", () => {
  it("covers every canonical V1-07 requirement exactly once", () => {
    expect(() => assertV107ClosureManifestComplete()).not.toThrow();
    expect(V107_ALL_REQUIREMENT_IDS).toHaveLength(37);
    expect(new Set(V107_ALL_REQUIREMENT_IDS).size).toBe(37);
    expect(V107_CLOSURE_READINESS).toHaveLength(37);
  });

  it("keeps every implementation and migration input present on the same head", () => {
    for (const file of requiredFiles) {
      expect(existsSync(join(root, file)), file).toBe(true);
    }
  });

  it("preserves unresolved product and configuration boundaries", () => {
    expect(V107_CANONICAL_BLOCKERS.map((entry) => entry.id)).toEqual([
      "V107-STORY-003",
    ]);
    expect(V107_CANONICAL_BLOCKERS[0]?.blocker).toContain("community");
    expect(V107_CANONICAL_BLOCKERS[0]?.blocker).toContain("participants");

    expect(V107_CONFIGURATION_BLOCKERS.map((entry) => entry.id)).toEqual([
      "V107-STORY-008",
      "V107-BLOG-009",
      "V107-SWAPLENI-004",
    ]);
  });

  it("requires cumulative evidence for every non-blocked capability", () => {
    expect(V107_FINAL_GATE_REQUIRED.length).toBeGreaterThan(0);
    for (const entry of V107_FINAL_GATE_REQUIRED) {
      expect(entry.evidencePrs.length, entry.id).toBeGreaterThan(0);
      expect(entry.finalGate.length, entry.id).toBeGreaterThan(0);
      expect(entry.blocker, entry.id).toBeNull();
    }
  });

  it("keeps Swapleni reward policies inactive and Trust independent", () => {
    const migration = readFileSync(
      join(root, "supabase/migrations/20260805165000_v1_07_9_swapleni_policy_authority.sql"),
      "utf8",
    );
    expect(migration).toContain("active boolean not null default false");
    expect(migration).not.toContain("calculate_trust_score");
    expect(migration).not.toContain("trust_level");
  });

  it("does not authorise GA, tag, release or v1.0.0", () => {
    const readiness = readFileSync(
      join(root, "docs/v1-07-10-cross-cutting-closure-readiness.md"),
      "utf8",
    );
    expect(readiness).toContain("SWAPLY_V1_GA");
    expect(readiness).toContain("BLOCKED");
    expect(readiness).not.toContain("SWAPLY_V1_GA — AUTHORISED");
  });
});
