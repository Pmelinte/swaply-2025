import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const messagesDir = path.join(process.cwd(), "src/messages");
const localeFiles = fs.readdirSync(messagesDir).filter((file) => file.endsWith(".json")).sort();
const locales = localeFiles.map((file) => path.basename(file, ".json"));
const catalogues = Object.fromEntries(
  localeFiles.map((file) => [path.basename(file, ".json"), JSON.parse(fs.readFileSync(path.join(messagesDir, file), "utf8"))]),
) as Record<string, Record<string, unknown>>;

const exploreTreeTKeys = [
  "explore.pageTitle",
  "explore.filterDrawer.title",
  "common.search",
  "common.noData",
  "explore.wants",
  "explore.wantsDescription",
  "explore.myWants",
  "explore.addWant",
  "explore.chosenWants",
  "explore.offers",
  "explore.offersDescription",
  "explore.myOffers",
  "explore.addOffer",
  "explore.chosenOffers",
  "explore.mapToggleWants",
  "explore.mapToggleOffers",
  "explore.mapCollapse",
  "explore.mapExpand",
  "objects.condition_new",
  "categories.electronics",
];

let activeMessages = catalogues.en;

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/state", () => ({
  useAppState: () => ({ items: [], loading: { items: false } }),
}));

vi.mock("@/lib/state/drawerStore", () => ({
  useDrawerStore: () => ({ openWith: vi.fn() }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePathname: () => "/explore",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string, values?: Record<string, unknown>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const value = getPath(activeMessages, fullKey);
    if (value === undefined) throw new Error(`MISSING_MESSAGE: ${fullKey}`);
    if (value === null || Array.isArray(value) || typeof value === "object") throw new Error(`INSUFFICIENT_PATH: ${fullKey}`);
    if (typeof value !== "string") throw new Error(`INVALID_MESSAGE: ${fullKey}`);
    return formatMessage(value, values);
  },
}));

function getPath(source: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((node, segment) => (node && typeof node === "object" && !Array.isArray(node) ? (node as Record<string, unknown>)[segment] : undefined), source);
}

function formatMessage(message: string, values: Record<string, unknown> = {}) {
  return message.replace(/\{(\w+)(?:,[^}]*)?\}/g, (_match, name: string) => String(values[name] ?? `{${name}}`));
}

describe("Explore i18n terminal-key contract", () => {
  it("demonstrates the production INSUFFICIENT_PATH cause: explore.filterDrawer is a namespace object in every locale", () => {
    const affected = locales.filter((locale) => {
      const value = getPath(catalogues[locale], "explore.filterDrawer");
      return value && typeof value === "object" && !Array.isArray(value);
    });

    expect(affected).toEqual(locales);
    expect(getPath(catalogues.en, "explore.filterDrawer.title")).toBe("Filters");
  });

  it("keeps every t(...) key used by the Explore tree on a terminal string/ICU message in all 43 locales", () => {
    expect(locales).toHaveLength(43);

    const failures = locales.flatMap((locale) =>
      exploreTreeTKeys.flatMap((key) => {
        const value = getPath(catalogues[locale], key);
        if (typeof value === "string") return [];
        return [`${locale}:${key}:${value === null ? "null" : Array.isArray(value) ? "array" : typeof value}`];
      }),
    );

    expect(failures).toEqual([]);
  });

  it.each(locales)("renders GlobalExploreFeed without i18n runtime errors in %s", async (locale) => {
    const { GlobalExploreFeed } = await import("@/components/explore/GlobalExploreFeed");
    activeMessages = catalogues[locale];
    expect(() => render(<GlobalExploreFeed query="" onQueryChange={() => {}} />)).not.toThrow(/INSUFFICIENT_PATH|MISSING_MESSAGE|INVALID_MESSAGE/);
  });
});
