import { describe, expect, it } from "vitest";
import {
  SWAPLY_PUBLIC_BASE_URL,
  SWAPLY_PUBLIC_DMCA_EMAIL,
  SWAPLY_PUBLIC_DPO_EMAIL,
  SWAPLY_PUBLIC_LEGAL_EMAIL,
  SWAPLY_PUBLIC_PRIVACY_EMAIL,
  SWAPLY_PUBLIC_SAFETY_EMAIL,
  SWAPLY_PUBLIC_SUPPORT_EMAIL,
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
