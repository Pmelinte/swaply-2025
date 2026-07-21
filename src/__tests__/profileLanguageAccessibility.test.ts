import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

describe("Batch 66.9 profile language accessibility contract", () => {
  it("keeps avatar and language actions localized", () => {
    const profileTab = source("src/app/[locale]/profile/_components/ProfileTab.tsx");

    expect(profileTab).toContain('alt={t("avatarUrl")}');
    expect(profileTab).not.toContain('alt="Avatar"');
    expect(profileTab).toContain('aria-label={t("addLanguage")}');
    expect(profileTab).toContain('aria-label={`${t("removeLanguage")} ${languageLabel}`}');
  });

  it("uses list semantics and mobile-safe wrapping for selected languages", () => {
    const profileTab = source("src/app/[locale]/profile/_components/ProfileTab.tsx");

    expect(profileTab).toContain('aria-label={t("spokenLanguages")}');
    expect(profileTab).toContain('<li key={lang} className="inline-flex max-w-full min-w-0 items-center');
    expect(profileTab).toContain('<span className="min-w-0 break-words">{languageLabel}</span>');
    expect(profileTab).toContain('className="w-40 max-w-full rounded-lg');
  });

  it("hides decorative upload and removal icons from assistive technology", () => {
    const profileTab = source("src/app/[locale]/profile/_components/ProfileTab.tsx");

    expect(profileTab).toContain('<Plus aria-hidden="true" focusable="false"');
    expect(profileTab).toContain('<X aria-hidden="true" focusable="false"');
  });

  it("keeps the authenticated profile E2E selector aligned with localized English copy", () => {
    const profileE2e = source("e2e/profile.spec.ts");

    expect(profileE2e).toContain('page.getByRole("img", { name: "Avatar (URL)", exact: true })');
    expect(profileE2e).not.toContain('page.getByRole("img", { name: "Avatar", exact: true })');
  });
});
