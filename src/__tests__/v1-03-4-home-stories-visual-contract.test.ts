import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

describe("V1-03.4 Home visual and Stories closure", () => {
  it("provides the Stories route linked from Home", () => {
    const home = source("src/app/[locale]/HomePageClient.tsx");
    const stories = source("src/app/[locale]/stories/page.tsx");

    expect(home).toContain('href="/stories"');
    expect(stories).toContain('data-page="stories"');
  });

  it("reads only consent-safe public publication snapshots", () => {
    const stories = source("src/app/[locale]/stories/page.tsx");

    expect(stories).toContain('.from("story_publications")');
    expect(stories).toContain('.eq("is_visible", true)');
    expect(stories).not.toContain('.from("stories")');
    expect(stories).not.toContain('.from("story_revisions")');
    expect(stories).not.toContain('.from("story_consents")');
    expect(stories).not.toContain('.from("story_participants")');
  });

  it("keeps loading, empty and partial-error states usable", () => {
    const stories = source("src/app/[locale]/stories/page.tsx");

    expect(stories).toContain("aria-busy={loading}");
    expect(stories).toContain('role="status"');
    expect(stories).toContain('tCommon("noData")');
    expect(stories).toContain('href="/blog"');
  });

  it("uses the canonical blue-to-green visual language with dark-mode support", () => {
    const stories = source("src/app/[locale]/stories/page.tsx");

    expect(stories).toContain("from-blue-800");
    expect(stories).toContain("to-cyan-600");
    expect(stories).toContain("bg-green-50");
    expect(stories).toContain("dark:bg-green-950/30");
  });
});
