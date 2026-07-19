import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/config";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

type DrawerMessages = {
  nav?: { contextMenu?: unknown };
  common?: { close?: unknown };
};

describe("Batch 66.8 Home drawer accessibility contract", () => {
  it("exposes one localized dialog trigger with state and ownership", () => {
    const topBar = source("src/components/layout/TopBar.tsx");

    expect(topBar).toContain('aria-label={t("nav.contextMenu")}');
    expect(topBar).toContain('aria-haspopup="dialog"');
    expect(topBar).toContain("aria-expanded={drawerOpen}");
    expect(topBar).toContain('aria-controls="swaply-contextual-drawer"');
    expect(topBar).not.toContain('aria-label="Open menu"');
  });

  it("keeps focus inside the modal, closes on Escape and restores the opener", () => {
    const drawer = source("src/components/drawer/UnifiedSideDrawer.tsx");

    expect(drawer).toContain('id="swaply-contextual-drawer"');
    expect(drawer).toContain('role="dialog"');
    expect(drawer).toContain('aria-label={t("nav.contextMenu")}');
    expect(drawer).toContain("previousFocusRef.current = activeElement");
    expect(drawer).toContain("(firstFocusable ?? drawer).focus()");
    expect(drawer).toContain('event.key === "Escape"');
    expect(drawer).toContain('event.key !== "Tab"');
    expect(drawer).toContain("lastFocusable.focus()");
    expect(drawer).toContain("previousFocus.focus()");
    expect(drawer).toContain("onClick={close}");
  });

  it("uses labeled heading and list semantics without duplicate nav landmarks", () => {
    const homeDrawer = source("src/components/drawer/variants/DrawerHome.tsx");

    expect(homeDrawer).toContain("aria-labelledby={headingId}");
    expect(homeDrawer).toContain("<h2 id={headingId}");
    expect(homeDrawer).toContain('<ul className="flex flex-col gap-0.5">');
    expect(homeDrawer).toContain("<li>{child}</li>");
    expect(homeDrawer).not.toContain('<nav className="flex flex-col gap-0.5">');
  });

  it("has usable trigger and close labels in every active locale", () => {
    for (const locale of locales) {
      const messages = JSON.parse(
        readFileSync(join(process.cwd(), "src/messages", `${locale}.json`), "utf8"),
      ) as DrawerMessages;

      expect(typeof messages.nav?.contextMenu, `${locale}: nav.contextMenu`).toBe("string");
      expect(String(messages.nav?.contextMenu).trim().length, `${locale}: nav.contextMenu`).toBeGreaterThan(0);
      expect(typeof messages.common?.close, `${locale}: common.close`).toBe("string");
      expect(String(messages.common?.close).trim().length, `${locale}: common.close`).toBeGreaterThan(0);
    }
  });
});
