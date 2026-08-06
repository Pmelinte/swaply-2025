import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

describe("V1-09.2.3 accessible-name guard", () => {
  it("mounts the guard once in the locale layout", () => {
    const layout = source("src/app/[locale]/layout.tsx");

    expect(layout).toContain(
      'import { AccessibleNameGuard } from "@/components/accessibility/AccessibleNameGuard"',
    );
    expect(layout.match(/<AccessibleNameGuard \/>/g)).toHaveLength(1);
  });

  it("preserves authored accessible names", () => {
    const guard = source(
      "src/components/accessibility/AccessibleNameGuard.tsx",
    );

    expect(guard).toContain("if (hasAccessibleName(button)) return");
    expect(guard).toContain("if (hasAssociatedLabel(select)) return");
    expect(guard).toContain('progressbar.getAttribute("aria-label")');
    expect(guard).toContain('progressbar.getAttribute("aria-labelledby")');
  });

  it("covers the three confirmed axe categories", () => {
    const guard = source(
      "src/components/accessibility/AccessibleNameGuard.tsx",
    );

    expect(guard).toContain('querySelectorAll<HTMLButtonElement>("button")');
    expect(guard).toContain('querySelectorAll<HTMLSelectElement>("select")');
    expect(guard).toContain(
      'querySelectorAll<HTMLElement>(\'[role="progressbar"]\')',
    );
    expect(guard).toContain('button.setAttribute("aria-label", label)');
    expect(guard).toContain('select.setAttribute( "aria-label"');
    expect(guard).toContain('progressbar.setAttribute( "aria-label"');
  });

  it("observes controls rendered after navigation or async loading", () => {
    const guard = source(
      "src/components/accessibility/AccessibleNameGuard.tsx",
    );

    expect(guard).toContain("new MutationObserver");
    expect(guard).toContain(
      "observer.observe(document.body, { childList: true, subtree: true })",
    );
    expect(guard).toContain("return () => observer.disconnect()");
  });
});
