import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("V1-09 privacy AI provider disclosure", () => {
  const privacyPagePath = path.join(
    process.cwd(),
    "src/app/[locale]/privacy/page.tsx",
  );
  const privacyPage = fs.readFileSync(privacyPagePath, "utf8");

  it("names all server-side image-analysis providers without claiming simultaneous activation", () => {
    expect(privacyPage).toContain("AI provider disclosure");
    expect(privacyPage).toContain("Groq");
    expect(privacyPage).toContain("Google Gemini");
    expect(privacyPage).toContain("Hugging Face");
    expect(privacyPage).toContain(
      "Not all providers are necessarily active at the same time.",
    );
  });

  it("keeps the disclosure attached to the public data-sharing section", () => {
    expect(privacyPage).toContain('s.id === "sharing"');
    expect(privacyPage).toContain(
      'data-testid="privacy-ai-provider-disclosure"',
    );
  });

  it("records the legal revision date for the disclosure change", () => {
    expect(privacyPage).toContain("2026-08-08");
  });
});
