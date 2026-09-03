import React from "react";
import fs from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExploreClient } from "@/app/[locale]/explore/ExploreClient";

vi.unmock("next-intl");

const state = vi.hoisted(() => ({ user: null as null | { id: string; location: { country: string } }, params: new URLSearchParams(), replace: vi.fn() }));
const router = { replace: state.replace };
vi.mock("next/navigation", () => ({ useSearchParams: () => state.params }));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => router,
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
}));
vi.mock("@/lib/state", () => ({ useAppState: () => ({ user: state.user, items: [{ id: "demo-must-not-be-counted" }] }) }));
vi.mock("@/components/drawer/variants/DrawerExplore", () => ({ EXPLORE_APPLY_EVENT: "explore:apply-filters" }));
vi.mock("@/components/maps/MapEmbed", () => ({ MapEmbed: () => <div data-testid="existing-map" /> }));
vi.mock("@/components/explore/GlobalExploreFeed", () => ({ GlobalExploreFeed: ({ query }: { query: string }) => <div data-testid="existing-feed">{query}</div> }));

const dir = path.join(process.cwd(), "src/messages");
const catalogues = Object.fromEntries(fs.readdirSync(dir).filter((name) => name.endsWith(".json")).map((name) => [name.replace(".json", ""), JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"))]));
function show(locale = "en") {
  return render(<NextIntlClientProvider locale={locale} messages={catalogues[locale]} timeZone="UTC"><ExploreClient /></NextIntlClientProvider>);
}

beforeEach(() => {
  state.user = null;
  state.params = new URLSearchParams();
  state.replace.mockReset();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Explore hub refinement", () => {
  it("presents four modes and four public domain links, without the detailed domain experience", async () => {
    show();
    expect(within(screen.getByTestId("explore-modes")).getAllByRole("button")).toHaveLength(4);
    for (const domain of ["objects", "properties", "services", "events"]) expect(screen.getByRole("link", { name: new RegExp(catalogues.en.branches[domain]) }).getAttribute("href")).toBe(`/${domain}`);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.queryByTestId("explore-world-all")).toBeNull();
    expect(screen.queryByTestId("existing-feed")).toBeNull();
    expect(screen.queryByTestId("existing-map")).toBeNull();
    expect(screen.queryByRole("link", { name: /sign in|register/i })).toBeNull();
    expect(screen.getByText(catalogues.en.explore.hub.modelTitle).compareDocumentPosition(screen.getByText(catalogues.en.explore.hub.radarTitle)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await screen.findByText(catalogues.en.explore.hub.radarUnavailable);
  });

  it("explains two Sky perspectives, the map, then two Field perspectives without simulated controls", async () => {
    show();
    const model = within(screen.getByTestId("explore-model"));
    const copy = catalogues.en.explore.hub;
    const regions = model.getAllByRole("region");
    expect(regions.map((region) => within(region).getByRole("heading", { level: 3 }).textContent)).toEqual([copy.skyTitle, copy.horizonTitle, copy.fieldTitle]);
    expect(within(regions[0]).getAllByRole("heading", { level: 4 }).map((heading) => heading.textContent)).toEqual([copy.modelWantsTitle, copy.modelDiscoveryTitle]);
    expect(within(regions[2]).getAllByRole("heading", { level: 4 }).map((heading) => heading.textContent)).toEqual([copy.modelOffersTitle, copy.modelDemandTitle]);
    expect(within(regions[0]).getAllByRole("listitem")).toHaveLength(2);
    expect(within(regions[2]).getAllByRole("listitem")).toHaveLength(2);
    expect(within(regions[2]).getByRole("list").getAttribute("start")).toBe("3");
    expect(within(regions[1]).getByText(copy.modelMapViews)).toBeTruthy();
    expect(model.queryByRole("button")).toBeNull();
    expect(model.queryByRole("link")).toBeNull();
    expect(model.getByText(copy.modelAvailability)).toBeTruthy();
    await screen.findByText(copy.radarUnavailable);
  });

  it("clearly labels the available alternatives instead of pretending Swipe or Reverse works", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: /I want to discover/ }));
    expect(screen.getByText(catalogues.en.explore.hub.discoverAvailable)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /I know what I have/ }));
    expect(screen.getByText(catalogues.en.explore.hub.offerAvailable)).toBeTruthy();
    expect(screen.queryByTestId("existing-feed")).toBeNull();
    await screen.findByText(catalogues.en.explore.hub.radarUnavailable);
  });

  it("opens only the existing map on request with a clear capability limit", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: /Explore on the map/ }));
    expect(screen.getByTestId("existing-map")).toBeTruthy();
    expect(screen.getByText(catalogues.en.explore.hub.mapAvailable)).toBeTruthy();
    await screen.findByText(catalogues.en.explore.hub.radarUnavailable);
  });

  it("focuses search and reveals existing public results only after submission", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: /I know what I want/ }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("textbox")));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "bicycle" } });
    expect(screen.queryByTestId("existing-feed")).toBeNull();
    fireEvent.submit(screen.getByRole("search"));
    expect(screen.getByTestId("existing-feed").textContent).toBe("bicycle");
    expect(state.replace).toHaveBeenCalledWith("/explore?q=bicycle", { scroll: false });
  });

  it("hydrates a shared search URL", async () => {
    state.params = new URLSearchParams("q=books");
    show();
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("books");
    expect(screen.getByTestId("existing-feed").textContent).toBe("books");
    await screen.findByText(catalogues.en.explore.hub.radarUnavailable);
  });

  it("counts only unique rows from the real public endpoint, not demo AppState or inferred matches", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [{ id: "real-1" }, { id: "real-1" }, { id: "real-2" }] } as Response);
    show();
    expect(await screen.findByText("2 recent public offers in the available sample.")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/items/recent", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(screen.getByText(catalogues.en.explore.hub.radarGuest)).toBeTruthy();
  });

  it("shows unavailable rather than fabricated zero statistics on failure", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    state.user = { id: "member", location: { country: "Romania" } };
    show();
    expect(await screen.findByText(catalogues.en.explore.hub.radarUnavailable)).toBeTruthy();
    expect(screen.getByText(catalogues.en.explore.hub.radarMember)).toBeTruthy();
    expect(screen.queryByText(/0 recent public offers/)).toBeNull();
  });

  it.each(Object.keys(catalogues))("keeps all hub messages resolvable in %s", async (locale) => {
    expect(Object.keys(catalogues)).toHaveLength(43);
    for (const key of Object.keys(catalogues.en.explore.hub)) expect(typeof catalogues[locale].explore.hub[key]).toBe("string");
    show(locale);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(catalogues[locale].explore.hub.title);
    await screen.findByText(catalogues[locale].explore.hub.radarUnavailable);
  });
});
