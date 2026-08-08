import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("V1-09.4.2 privacy AI provider disclosure contract", () => {
  const privacyPage = read("src/app/[locale]/privacy/page.tsx");
  const aiImageRoute = read("src/app/api/ai/image/route.ts");

  it("keeps public disclosure aligned with every executable image-analysis provider", () => {
    expect(aiImageRoute).toContain("analyzeWithGroq");
    expect(aiImageRoute).toContain("analyzeWithGemini");
    expect(aiImageRoute).toContain("analyzeWithHuggingFace");

    expect(privacyPage).toContain("Groq");
    expect(privacyPage).toContain("Google Gemini");
    expect(privacyPage).toContain("Hugging Face");
  });

  it("does not claim that all providers are simultaneously active", () => {
    expect(privacyPage).toContain(
      "Depending on configuration and availability",
    );
    expect(privacyPage).toContain(
      "Not all providers are necessarily active at the same time.",
    );
  });

  it("exposes the disclosure in the public data-sharing section", () => {
    expect(privacyPage).toContain("AI provider disclosure");
    expect(privacyPage).toContain('s.id === "sharing"');
    expect(privacyPage).toContain(
      'data-testid="privacy-ai-provider-disclosure"',
    );
  });
});
