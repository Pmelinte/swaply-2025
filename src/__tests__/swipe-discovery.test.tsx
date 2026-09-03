import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { DomainSwipeDiscovery, type DomainSwipeProps } from "@/components/explore/DomainSwipeDiscovery";
import { normalizeSwipeRows, swipeApproximateLocation, swipeReducer } from "@/lib/explore/swipeDiscovery";
import type { ExploreDomain } from "@/lib/explore/exploreArchitecture";
import en from "@/messages/en.json";
import ro from "@/messages/ro.json";

vi.unmock("next-intl");
vi.mock("@/components/SafeImage", () => ({ SafeImage: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} /> }));
afterEach(cleanup);

const domains: ExploreDomain[] = ["objects", "properties", "services", "events"];
const rows = (domain: ExploreDomain) => [1, 2, 3].map((n) => ({
  id: String(n), title: `${domain} ${n}`, owner_id: "owner", status: "active",
  item_type: { objects: "object", properties: "property", services: "service", events: "event" }[domain],
  city: "Bucharest", condition: "good", property_type: "apartment", bedrooms: 2,
  service_name: `Service ${n}`, delivery_mode: "remote", start_date: "2027-09-03T00:00:00Z",
  is_online: true, swap_wants_description: "A bicycle",
}));
function mount(props: Partial<DomainSwipeProps> & Pick<DomainSwipeProps, "domain">, locale = "en") {
  return render(<NextIntlClientProvider locale={locale} messages={locale === "ro" ? ro : en} timeZone="UTC"><DomainSwipeDiscovery rows={rows(props.domain)} {...props} /></NextIntlClientProvider>);
}

// jsdom does not provide native PointerEvent. Browser tests exercise native input.
function pointer(card: HTMLElement, type: string, x: number, y = 0, primary = true) {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperties(event, { pointerId: { value: 1 }, isPrimary: { value: primary } });
  fireEvent(card, event);
}

describe.each(domains)("%s Swipe", (domain) => {
  it.each([undefined, "viewer"])("separates all choices, advances, ends and undoes for viewer %s", (viewerId) => {
    const before = rows(domain);
    const snapshot = JSON.stringify(before);
    const network = vi.spyOn(globalThis, "fetch");
    const storage = vi.spyOn(Storage.prototype, "setItem");
    mount({ domain, rows: before, viewerId });
    expect(screen.getByTestId("swipe-stack")).toHaveTextContent(`${domain} 2`);
    expect(screen.getByText(en.explore.swipe.localOnly)).toBeVisible();
    fireEvent.click(screen.getByTestId("swipe-dismissed"));
    expect(screen.getByTestId("swipe-card")).toHaveAttribute("data-item-id", "2");
    fireEvent.click(screen.getByTestId("swipe-interested"));
    expect(screen.getByTestId("swipe-card")).toHaveAttribute("data-item-id", "3");
    fireEvent.click(screen.getByTestId("swipe-strong_interest"));
    expect(screen.getByTestId("swipe-end")).toHaveTextContent(en.explore.swipe.endTitle);
    expect(screen.getByText(/Very interested: .*3 — this page only/)).toBeVisible();
    expect(screen.getByTestId("swipe-interested")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: en.explore.swipe.undo }));
    expect(screen.getByTestId("swipe-card")).toHaveAttribute("data-item-id", "3");
    fireEvent.click(screen.getByTestId("swipe-interested"));
    fireEvent.click(screen.getByRole("button", { name: en.explore.swipe.restart }));
    expect(screen.getByTestId("swipe-card")).toHaveAttribute("data-item-id", "1");
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(network).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    network.mockRestore(); storage.mockRestore();
  });
  it("supports left/right drag, cancels vertical gestures, and ignores secondary pointers", () => {
    mount({ domain });
    let card = screen.getByTestId("swipe-card");
    pointer(card, "pointerdown", 180); pointer(card, "pointermove", 40); pointer(card, "pointerup", 40);
    expect(screen.getByTestId("swipe-card")).toHaveAttribute("data-item-id", "2");
    card = screen.getByTestId("swipe-card");
    pointer(card, "pointerdown", 100); pointer(card, "pointermove", 220); pointer(card, "pointerup", 220);
    expect(screen.getByTestId("swipe-card")).toHaveAttribute("data-item-id", "3");
    card = screen.getByTestId("swipe-card");
    pointer(card, "pointerdown", 100); pointer(card, "pointermove", 110, 100); pointer(card, "pointerup", 240, 150);
    expect(card).toHaveAttribute("data-item-id", "3");
    pointer(card, "pointerdown", 100); pointer(card, "pointermove", 230); pointer(card, "pointercancel", 230); pointer(card, "pointerup", 230);
    expect(card).toHaveAttribute("data-item-id", "3");
    pointer(card, "pointerdown", 100, 0, false); pointer(card, "pointerup", 250);
    expect(card).toHaveAttribute("data-item-id", "3");
  });
  it("supports keyboard actions and preserves focus between cards", () => {
    mount({ domain });
    const card = screen.getByTestId("swipe-card"); card.focus();
    fireEvent.keyDown(card, { key: "ArrowLeft" });
    expect(card).toHaveAttribute("data-item-id", "2"); expect(card).toHaveFocus();
    fireEvent.keyDown(card, { key: "ArrowRight", repeat: true });
    expect(card).toHaveAttribute("data-item-id", "2");
    fireEvent.keyDown(card, { key: "ArrowRight" });
    expect(card).toHaveAttribute("data-item-id", "3");
    fireEvent.keyDown(card, { key: "ArrowUp" });
    expect(screen.getByTestId("swipe-end")).toBeVisible();
    expect(screen.getByTestId("swipe-end")).toHaveFocus();
  });
  it("starts fresh after leaving the page and never includes the viewer's own offer", () => {
    const view = mount({ domain, viewerId: "viewer", rows: [...rows(domain), { id: "mine", title: "My offer", owner_id: "viewer" }] });
    fireEvent.click(screen.getByTestId("swipe-interested")); view.unmount();
    mount({ domain, viewerId: "owner" });
    expect(screen.queryByTestId("swipe-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("swipe-end")).toHaveTextContent(en.explore.swipe.emptyTitle);
  });
});

it("uses natural Romanian strings and translates metadata", () => {
  mount({ domain: "objects" }, "ro");
  expect(screen.getByRole("button", { name: "Îmi doresc mult" })).toBeVisible();
  expect(screen.getByText("Bună")).toBeVisible();
  expect(screen.getByText("Nespecificat")).toBeVisible();
});

it("distinguishes loading, failed, empty and completed states", () => {
  let view = mount({ domain: "objects", loading: true });
  expect(screen.getByText(en.explore.swipe.loading)).toBeVisible();
  expect(screen.getByTestId("swipe-interested")).toBeDisabled(); view.unmount();
  const onRetry = vi.fn();
  view = mount({ domain: "objects", failed: true, onRetry });
  fireEvent.click(screen.getByRole("button", { name: en.explore.swipe.retry }));
  expect(onRetry).toHaveBeenCalledOnce(); view.unmount();
  mount({ domain: "objects", query: "missing-search" });
  expect(screen.getByTestId("swipe-end")).toHaveTextContent(en.explore.swipe.emptyTitle);
});

it("only explains same-city evidence when both cities are present", () => {
  let view = mount({ domain: "objects", viewerCity: "Bucharest" });
  fireEvent.click(screen.getByText(en.explore.swipe.whyTitle));
  expect(screen.getByText(/both indicate Bucharest/)).toBeVisible(); view.unmount();
  view = mount({ domain: "objects", viewerCity: "Paris" });
  const card = screen.getByTestId("swipe-card");
  fireEvent.click(within(card).getByText(en.explore.swipe.whyTitle));
  expect(within(card).getByText(/not a personalised match/)).toBeVisible(); view.unmount();
});

describe("truthful public metadata and local reducer", () => {
  it("preserves canonical service format, availability and public joined-item metadata", () => {
    const candidate = normalizeSwipeRows([{ id: "service", service_name: "Lessons", delivery_mode: "both", available_days: ["monday"], gallery: ["https://example.com/service.jpg"], items: { location_city: "Bucharest", is_demo: true } }], "services")[0];
    expect(candidate.city).toBe("Bucharest");
    expect(candidate.isDemo).toBe(true);
    expect(candidate.image).toBe("https://example.com/service.jpg");
    expect(candidate.fields).toContainEqual({ label: "delivery", value: "both", kind: "enum" });
    expect(candidate.fields).toContainEqual({ label: "availability", value: "monday", kind: "weekdays" });
  });
  it("treats the legacy Romanian placeholder asset as a missing image in every locale", () => {
    for (const image_url of ["/no-image.svg", "https://example.com/no-image.svg?v=1"]) {
      expect(normalizeSwipeRows([{ id: "legacy", title: "Legacy", image_url }], "objects")[0].image).toBeUndefined();
    }
  });
  it("uses the canonical hybrid event format instead of guessing from is_online", () => {
    const candidate = normalizeSwipeRows([{ id: "event", title: "Hybrid event", location_type: "hybrid", is_online: false }], "events")[0];
    expect(candidate.fields).toContainEqual({ label: "eventMode", value: "hybrid", kind: "enum" });
  });
  it("rejects malformed, duplicate, inactive, own and cross-domain rows", () => {
    expect(normalizeSwipeRows([null, {}, ...rows("objects"), ...rows("objects"), ...rows("properties"), { id: "old", title: "Old", status: "draft" }, { id: "own", title: "Mine", owner_id: "me" }], "objects", "me")).toHaveLength(3);
  });
  it("does not fabricate property capacity, service modality or reach", () => {
    const sparse = [{ id: "sparse", title: "Sparse", status: "active" }];
    expect(normalizeSwipeRows(sparse, "properties")[0].fields).toEqual([]);
    expect(normalizeSwipeRows(sparse, "services")[0].fields).toEqual([{ label: "delivery", value: "notProvided", kind: "enum" }]);
    expect(normalizeSwipeRows(sparse, "objects")[0].fields).toEqual([{ label: "reach", value: "notProvided", kind: "enum" }]);
  });
  it("never reveals precise addresses, coordinates or private ticket credentials", () => {
    expect(swipeApproximateLocation("123 Main Street, Bucharest, Romania")).toBe("Bucharest, Romania");
    expect(swipeApproximateLocation("44.45, 26.05")).toBeUndefined();
    const candidate = normalizeSwipeRows([{ id: "ticket", title: "Concert", status: "active", start_date: "invalid", venue: "Secret house", address: "12 Main Street", transfer_data: { barcode: "private" } }], "events")[0];
    expect(JSON.stringify(candidate)).not.toMatch(/Secret house|Main Street|barcode|invalid/);
  });
  it("preserves real dates, zero capacity, image objects and exchange description", () => {
    const candidate = normalizeSwipeRows([{ id: "p", title: "Home", property_type: "house", max_guests: 0, available_from: "2027-06-01", photos: [{ url: "https://example.com/home.jpg" }], swap_wants_description: "A week in Paris" }], "properties")[0];
    expect(candidate.image).toBe("https://example.com/home.jpg");
    expect(candidate.fields).toContainEqual({ label: "capacity", value: "0", kind: undefined });
    expect(candidate.fields).toContainEqual({ label: "accepts", value: "A week in Paris", kind: undefined });
  });
  it("does not silently upgrade interest into an explicit wish", () => {
    const history = swipeReducer([], { type: "choose", decision: { id: "1", title: "Object", choice: "strong_interest" } });
    expect(history[0].choice).toBe("strong_interest");
    expect(swipeReducer(history, { type: "choose", decision: { id: "1", title: "Object", choice: "interested" } })).toBe(history);
    expect(swipeReducer(history, { type: "undo" })).toEqual([]);
  });
});

const localeFiles = fs.readdirSync(path.join(process.cwd(), "src/messages")).filter((file) => file.endsWith(".json"));
it.each(localeFiles)("renders all four Swipe domains with valid ICU messages in %s", (file) => {
  const messages = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/messages", file), "utf8"));
  expect(messages.explore.swipe).toBeDefined();
  for (const domain of domains) {
    const view = render(<NextIntlClientProvider locale={file.replace(".json", "")} messages={messages} timeZone="UTC" onError={(error) => { throw error; }}><DomainSwipeDiscovery domain={domain} rows={rows(domain)} /></NextIntlClientProvider>);
    expect(screen.getByTestId("swipe-card")).toBeVisible();
    fireEvent.click(screen.getByTestId("swipe-strong_interest"));
    expect(screen.getByTestId("swipe-card")).toHaveAttribute("data-item-id", "2");
    view.unmount();
  }
});
