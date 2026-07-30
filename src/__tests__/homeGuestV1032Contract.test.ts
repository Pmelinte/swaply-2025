import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

describe("V1-03.2 guest Home contract", () => {
  const home = source("src/app/[locale]/HomePageClient.tsx");

  it("keeps guest and authenticated Home explicitly separated", () => {
    expect(home).toContain("function GuestHome()");
    expect(home).toContain("function AuthenticatedHome()");
    expect(home).toContain("return user ? <AuthenticatedHome /> : <GuestHome />");
  });

  it("implements the canonical guest Home order without an Explore-style map", () => {
    expect(home).toContain('href="/register"');
    expect(home).toContain('href="/explore"');
    expect(home).toContain("HOW_IT_WORKS.map");
    expect(home).toContain("BRANCH_CARDS.map");
    expect(home).toContain('href="/blog"');
    expect(home).not.toContain("LazyMapPreview");
  });

  it("uses translated message namespaces instead of new public hardcoded copy", () => {
    expect(home).toContain('useTranslations("hero")');
    expect(home).toContain('useTranslations("branches")');
    expect(home).toContain('useTranslations("benefits")');
    expect(home).toContain('useTranslations("guest")');
    expect(home).toContain('useTranslations("nav")');
    expect(home).toContain('useTranslations("login")');
  });

  it("provides the blue-neutral-green composition and privacy-safe analytics names", () => {
    expect(home).toContain("from-blue-700");
    expect(home).toContain("bg-zinc-50");
    expect(home).toContain("from-emerald-50");
    expect(home).toContain('data-analytics-event="hero_cta_primary"');
    expect(home).toContain('data-analytics-event="hero_cta_secondary"');
    expect(home).toContain('data-analytics-event="guide_opened"');
  });

  it("keeps motion and focus accessibility safeguards", () => {
    expect(home).toContain("focus-visible:outline");
    expect(home).toContain("motion-reduce:transform-none");
    expect(home).toContain('aria-hidden="true"');
    expect(home).toContain('aria-labelledby="home-domains-title"');
    expect(home).toContain('aria-labelledby="home-how-title"');
  });
});
