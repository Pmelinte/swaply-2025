import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

describe("V1-09.2.4 color contrast contract", () => {
  it("loads targeted contrast corrections after global Tailwind styles", () => {
    const layout = source("src/app/layout.tsx");

    expect(layout).toContain('import "./globals.css"');
    expect(layout).toContain('import "./accessibility-contrast.css"');
    expect(layout.indexOf('import "./accessibility-contrast.css"')).toBeGreaterThan(
      layout.indexOf('import "./globals.css"'),
    );
  });

  it("strengthens the low-contrast utility combinations found by axe", () => {
    const css = source("src/app/accessibility-contrast.css");

    expect(css).toContain(".text-zinc-400, .text-zinc-500");
    expect(css).toContain(".text-amber-600");
    expect(css).toContain(".text-emerald-600");
    expect(css).toContain(".text-green-600");
    expect(css).toContain(".bg-cat-obj.text-white");
    expect(css).toContain(".bg-cat-prop.text-white");
    expect(css).toContain(".bg-cat-svc.text-white");
    expect(css).toContain(".bg-emerald-600.text-white");
    expect(css).toContain(".bg-amber-500.text-white");
  });

  it("does not use opacity to weaken TrustProfileCard copy", () => {
    const trustCard = source("src/components/trust/TrustProfileCard.tsx");

    expect(trustCard).not.toContain("opacity-60");
    expect(trustCard).not.toContain("opacity-70");
    expect(trustCard).not.toContain("opacity-80");
  });
});
