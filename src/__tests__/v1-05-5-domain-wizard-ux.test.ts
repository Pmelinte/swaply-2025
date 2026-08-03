import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const sharedProgress = readFileSync(
  resolve(
    process.cwd(),
    "src/components/wizard/shared/WizardProgress.tsx",
  ),
  "utf8",
);

const propertyProgress = readFileSync(
  resolve(
    process.cwd(),
    "src/components/wizard/property/PropertyWizardProgress.tsx",
  ),
  "utf8",
);

const sharedNavigation = readFileSync(
  resolve(
    process.cwd(),
    "src/components/wizard/shared/WizardNavButtons.tsx",
  ),
  "utf8",
);

const publicVisualAudit = readFileSync(
  resolve(process.cwd(), "e2e/public-visual-audit.spec.ts"),
  "utf8",
);

describe("V1-05.5 domain wizard UX parity", () => {
  it("exposes accessible progress semantics for shared and Property wizards", () => {
    for (const source of [sharedProgress, propertyProgress]) {
      expect(source).toContain('role="progressbar"');
      expect(source).toContain("aria-valuemin={1}");
      expect(source).toContain("aria-valuemax=");
      expect(source).toContain("aria-valuenow=");
      expect(source).toContain("aria-valuetext={progressLabel}");
      expect(source).toContain('aria-hidden="true"');
    }
  });

  it("clamps invalid progress values instead of rendering broken state", () => {
    expect(sharedProgress).toContain(
      "const safeTotalSteps = Math.max(1, totalSteps)",
    );
    expect(sharedProgress).toContain(
      "const safeStep = Math.min(Math.max(1, step), safeTotalSteps)",
    );
    expect(propertyProgress).toContain(
      "const safeStep = Math.min(Math.max(1, step), WIZARD_STEPS)",
    );
    expect(propertyProgress).toContain(
      'const titleKey = STEP_TITLE_KEYS[safeStep] ?? "step1Title"',
    );
  });

  it("keeps long localized titles usable on narrow screens", () => {
    for (const source of [sharedProgress, propertyProgress]) {
      expect(source).toContain("flex-col gap-2 sm:flex-row");
      expect(source).toContain("min-w-0 break-words");
      expect(source).toContain("shrink-0 text-sm");
    }
  });

  it("provides mobile-width, touch-safe and keyboard-visible navigation", () => {
    expect(sharedNavigation).toContain("flex flex-col gap-3");
    expect(sharedNavigation).toContain("sm:flex-row");
    expect(sharedNavigation).toContain("min-h-11 w-full");
    expect(sharedNavigation).toContain("sm:w-auto");
    expect(sharedNavigation).toContain("focus-visible:ring-2");
    expect(sharedNavigation).toContain("pb-[env(safe-area-inset-bottom)]");
  });

  it("keeps navigation direction-aware and publish state announced", () => {
    expect(sharedNavigation).toContain("rtl:rotate-180");
    expect(sharedNavigation).toContain('aria-hidden="true"');
    expect(sharedNavigation).toContain("aria-busy={loading}");
    expect(sharedNavigation).toContain('role="group"');
    expect(sharedNavigation).not.toContain("<>✅");
  });

  it("covers Properties, Services and Events on desktop and mobile", () => {
    for (const path of ["/properties", "/services", "/events"]) {
      expect(publicVisualAudit).toContain(path);
    }
    expect(publicVisualAudit).toContain('{ name: "desktop", width: 1440');
    expect(publicVisualAudit).toContain('{ name: "mobile", width: 390');
  });

  it("adds one non-English LTR locale and one RTL locale to the domain audit", () => {
    expect(publicVisualAudit).toContain('{ locale: "de", direction: "ltr" }');
    expect(publicVisualAudit).toContain('{ locale: "ar", direction: "rtl" }');
    expect(publicVisualAudit).toContain("toLocalizedRoute(domainPath, locale)");
    expect(publicVisualAudit).toContain(
      'toHaveAttribute("dir", direction)',
    );
    expect(publicVisualAudit).toContain(
      'toHaveAttribute("lang", locale)',
    );
  });
});
