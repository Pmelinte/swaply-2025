import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(path: string) {
  return readFileSync(join(ROOT, path), "utf8");
}

const PUBLIC_CLAIM_FILES = [
  "src/content/press/press-kit.md",
  "src/content/seo/seo-meta.md",
  "src/content/copy/homepage-copy.md",
  "src/content/copy/about-copy.md",
  "src/app/[locale]/layout.tsx",
  "src/app/[locale]/pricing/page.tsx",
  "src/app/[locale]/partners/page.tsx",
] as const;

describe("V1-11 public truth guard", () => {
  it("does not publish the legacy unverified scale and pricing claims", () => {
    const text = PUBLIC_CLAIM_FILES.map(read).join("\n");

    expect(text).not.toMatch(/more than 100 countries/i);
    expect(text).not.toMatch(/100\+ countries/i);
    expect(text).not.toMatch(/200\+ (integrated )?couriers/i);
    expect(text).not.toMatch(/50,000\+.*swappers/i);
    expect(text).not.toMatch(/200,000\+.*items/i);
    expect(text).not.toMatch(/premium (?:from|plans? start at) \$?4\.99/i);
  });

  it("does not publish the legacy translation-provider claim", () => {
    const text = PUBLIC_CLAIM_FILES.map(read).join("\n");

    expect(text).not.toMatch(/DeepL\s*\+\s*Google Translate/i);
    expect(text).not.toMatch(/Dual-layer[^\n]*DeepL[^\n]*Google Translate/i);
  });

  it("uses the canonical public domain and support address", () => {
    const pressKit = read("src/content/press/press-kit.md");
    const seo = read("src/content/seo/seo-meta.md");

    expect(pressKit).toContain("https://www.swaply.world");
    expect(pressKit).toContain("support@swaply.world");
    expect(seo).toContain("https://www.swaply.world");
    expect(pressKit).not.toContain("swaply.io");
    expect(seo).not.toContain("swaply.io");
  });

  it("does not expose an unverified public checkout offer", () => {
    const pricing = read("src/app/[locale]/pricing/page.tsx");

    expect(pricing).not.toContain("/api/payments/checkout");
    expect(pricing).toContain("No new Premium or Business subscription price is publicly offered");
  });

  it("does not mark provider integrations as active", () => {
    const integrations = read("src/app/[locale]/integrations/page.tsx");

    expect(integrations).not.toContain('status: "active"');
    expect(integrations).toContain('type IntegrationStatus = "foundation" | "disabled" | "planned"');
    expect(integrations).toContain("Swaply does not claim live escrow protection in Production.");
  });
});
