import { describe, expect, it } from "vitest";
import {
  SWAPLY_PUBLIC_BASE_URL,
  SWAPLY_PUBLIC_DMCA_EMAIL,
  SWAPLY_PUBLIC_DPO_EMAIL,
  SWAPLY_PUBLIC_LEGAL_EMAIL,
  SWAPLY_PUBLIC_PRIVACY_EMAIL,
  SWAPLY_PUBLIC_SAFETY_EMAIL,
  SWAPLY_PUBLIC_SUPPORT_EMAIL,
  SWAPLY_TERMS_REVISION_DATE,
  getPublicTermsSectionCopy,
  normalizePublicLegalCopy,
} from "@/lib/legal-copy";

describe("public legal copy normalizer", () => {
  it("keeps legacy public contact emails aligned with swaply.world", () => {
    const input = [
      "support@swaply.app",
      "privacy@swaply.app",
      "dpo@swaply.app",
      "safety@swaply.app",
      "dmca@swaply.app",
      "legal@swaply.app",
    ].join(" ");

    const output = normalizePublicLegalCopy(input);

    expect(output).toContain(SWAPLY_PUBLIC_SUPPORT_EMAIL);
    expect(output).toContain(SWAPLY_PUBLIC_PRIVACY_EMAIL);
    expect(output).toContain(SWAPLY_PUBLIC_DPO_EMAIL);
    expect(output).toContain(SWAPLY_PUBLIC_SAFETY_EMAIL);
    expect(output).toContain(SWAPLY_PUBLIC_DMCA_EMAIL);
    expect(output).toContain(SWAPLY_PUBLIC_LEGAL_EMAIL);
    expect(output).not.toContain("swaply.app");
  });

  it("keeps legacy public URL examples aligned with swaply.world", () => {
    expect(normalizePublicLegalCopy("https://swaply.io/en/objects/123")).toBe(
      `${SWAPLY_PUBLIC_BASE_URL}/en/objects/123`,
    );
    expect(normalizePublicLegalCopy("https://www.swaply.io/en/dmca")).toBe(
      `${SWAPLY_PUBLIC_BASE_URL}/en/dmca`,
    );
  });
});

describe("V1-09 public Terms reconciliation", () => {
  it("uses the current legal revision date", () => {
    expect(SWAPLY_TERMS_REVISION_DATE).toBe("2026-08-08");
  });

  it("does not claim universal automatic private-message moderation", () => {
    const legacy =
      "All messages are automatically moderated for profanity, personal data leaks, and spam.";
    const output = getPublicTermsSectionCopy("moderation", legacy);

    expect(output).not.toContain("All messages are automatically moderated");
    expect(output).toContain("reporting, blocking, and dispute tools");
    expect(output).toContain("does not guarantee that every private message is automatically screened");
  });

  it("covers all four Swaply domains instead of object-only exchanges", () => {
    const output = getPublicTermsSectionCopy(
      "swap-rules",
      "Swaply facilitates object exchanges between users.",
    );

    expect(output).toContain("Objects");
    expect(output).toContain("Properties");
    expect(output).toContain("Services");
    expect(output).toContain("Events");
  });

  it("keeps prohibited rules broad without claiming automatic enforcement", () => {
    const output = getPublicTermsSectionCopy("prohibited", "legacy prohibited copy");

    expect(output).toContain("weapons");
    expect(output).toContain("illegal drugs");
    expect(output).toContain("counterfeit goods");
    expect(output).toContain("stolen property");
    expect(output).toContain("hazardous materials");
    expect(output).toContain("after review");
  });

  it("aligns account deletion copy with the GDPR deletion workflow", () => {
    const output = getPublicTermsSectionCopy(
      "account-rules",
      "You may delete your account at any time.",
    );

    expect(output).toContain("GDPR deletion workflow");
    expect(output).toContain("deleted, anonymized, or retained");
  });
});
