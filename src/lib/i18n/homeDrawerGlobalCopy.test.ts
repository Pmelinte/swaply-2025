import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

describe("Batch 66.7 Home drawer global copy", () => {
  it("uses existing locale catalogue keys for Blog and legal navigation", () => {
    const drawer = source("src/components/drawer/variants/DrawerHome.tsx");

    expect(drawer).toContain('href="/blog" label={t("blog.pageTitle")}');
    expect(drawer).toContain('<DrawerSection title={t("nav.termsAndGdpr")}>');
    expect(drawer).not.toContain('href="/blog" label="Blog"');
    expect(drawer).not.toContain('<DrawerSection title="Legal">');
  });

  it("uses logical text alignment for RTL locales", () => {
    const drawer = source("src/components/drawer/variants/DrawerHome.tsx");

    expect(drawer).toContain("text-start text-sm");
    expect(drawer).not.toContain("text-left text-sm");
  });
});
