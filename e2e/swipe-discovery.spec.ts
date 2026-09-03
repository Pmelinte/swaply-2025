import { expect, test, type Page } from "@playwright/test";

const domains = ["objects", "properties", "services", "events"] as const;
function fixtureRows(domain: typeof domains[number]) {
  return [1, 2, 3].map((n) => ({
    id: `swipe-fixture-${domain}-${n}`, owner_id: "fixture-owner", title: `Swipe fixture ${domain} ${n}`,
    item_type: { objects: "object", properties: "property", services: "service", events: "event" }[domain],
    category: { objects: "Electronics", properties: "property", services: "service", events: "event" }[domain],
    status: "active", is_active: true, created_at: "2026-09-01T12:00:00Z", images: [],
    condition: "good", city: "Bucharest", location_city: "Bucharest", country_code: "RO",
    swap_geo_preference: "regional", swap_wants_description: "Photography lessons",
    property_type: "apartment", bedrooms: 2, max_guests: 3, exchange_type: "simultaneous",
    available_from: "2027-09-05", available_until: "2027-09-12",
    service_name: `Swipe fixture services ${n}`, category_l1: "Technology", delivery_mode: "remote",
    available_date_from: "2027-09-05", available_days: ["monday", "friday"],
    event_title: `Swipe fixture events ${n}`, start_date: "2027-09-05", end_date: "2027-09-06",
    location_type: "hybrid", is_online: false, capacity_available: 2, transfer_deadline_at: "2027-09-04T23:59:59Z",
  }));
}

async function publicFixtures(page: Page) {
  await page.route("**/rest/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split("/").at(-1);
    let data: unknown[] = [];
    if (table === "properties") data = fixtureRows("properties");
    if (table === "services") data = fixtureRows("services");
    if (table === "items") {
      const query = decodeURIComponent(url.search);
      data = query.includes("eq.property") ? fixtureRows("properties") : query.includes("eq.service") ? fixtureRows("services") : fixtureRows("objects");
    }
    await route.fulfill({ json: data });
  });
  await page.route("**/api/items/events", (route) => route.fulfill({ json: { events: fixtureRows("events") } }));
  await page.route("**/api/wanted", (route) => route.fulfill({ json: { requests: [] } }));
}

async function dragCard(page: Page, direction: "left" | "right", touch: boolean) {
  const card = page.getByTestId("swipe-card");
  await card.scrollIntoViewIfNeeded();
  const box = await card.boundingBox();
  if (!box) throw new Error("Swipe card is not visible");
  const x = box.x + box.width / 2;
  const y = box.y + 90;
  const distance = Math.min(150, box.width * .4) * (direction === "right" ? 1 : -1);
  if (touch) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
    for (let step = 1; step <= 8; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + distance * step / 8, y, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
  } else {
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + distance, y, { steps: 8 }); await page.mouse.up();
  }
}

for (const domain of domains) {
  test(`${domain}: guest gestures, actions, undo, end, keyboard and no hydration errors`, async ({ page, isMobile }, testInfo) => {
    await publicFixtures(page);
    const hydrationErrors: string[] = [];
    const writes: string[] = [];
    page.on("pageerror", (error) => hydrationErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && /hydration|didn't match|does not match|Minified React error/i.test(message.text())) hydrationErrors.push(message.text());
    });
    page.on("request", (request) => {
      if (["POST", "PATCH", "DELETE"].includes(request.method()) && /\/rest\/v1\/|\/api\/(wanted|matching|swaps)/.test(request.url())) writes.push(request.url());
    });
    await page.goto(`/en/${domain}`);
    const swipe = page.getByTestId(`swipe-${domain}`);
    const card = page.getByTestId("swipe-card");
    await expect(card).toHaveAttribute("data-item-id", `swipe-fixture-${domain}-1`);
    const cookieButton = page.getByRole("button", { name: "Reject non-essential", exact: true });
    if (await cookieButton.isVisible()) await cookieButton.click();
    await expect(swipe).toContainText("Try it without an account.");
    await expect(page.getByRole("link", { name: "Login", exact: true })).toBeVisible();
    const order = await page.getByTestId(`explore-world-${domain}`).evaluate((world) => {
      const nodes = [...world.querySelectorAll("h2,h3")].map((node) => node.textContent);
      return nodes;
    });
    expect(order.indexOf("I know what I want")).toBeLessThan(order.indexOf("Swipe Discovery"));
    expect(order.indexOf("Swipe Discovery")).toBeLessThan(order.indexOf("Where wants meet offers"));
    await expect(page.getByTestId("swipe-stack")).toContainText(`Swipe fixture ${domain} 2`);
    await swipe.screenshot({ path: testInfo.outputPath("swipe-en.png") });
    await dragCard(page, "left", !!isMobile);
    await expect(card).toHaveAttribute("data-item-id", `swipe-fixture-${domain}-2`);
    await dragCard(page, "right", !!isMobile);
    await expect(card).toHaveAttribute("data-item-id", `swipe-fixture-${domain}-3`);
    await page.getByTestId("swipe-strong_interest").click();
    await expect(page.getByTestId("swipe-end")).toContainText("You've reached the end");
    await expect(swipe).toContainText("Very interested: Swipe fixture");
    await swipe.getByRole("button", { name: "Undo last choice" }).click();
    await expect(card).toHaveAttribute("data-item-id", `swipe-fixture-${domain}-3`);
    await card.focus(); await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("swipe-end")).toBeFocused();
    await swipe.getByRole("button", { name: "Start again" }).click();
    await page.getByTestId("swipe-dismissed").click();
    await page.getByTestId("swipe-interested").click();
    await expect(card).toHaveAttribute("data-item-id", `swipe-fixture-${domain}-3`);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await card.focus(); await page.keyboard.press("ArrowUp");
    await expect(page.getByTestId("swipe-end")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(hydrationErrors).toEqual([]);
    expect(writes).toEqual([]);
    await page.reload();
    await expect(page.getByTestId("swipe-card")).toHaveAttribute("data-item-id", `swipe-fixture-${domain}-1`);
  });

  test(`${domain}: Romanian public UI, real metadata, no overflow`, async ({ page }, testInfo) => {
    await publicFixtures(page);
    await page.goto(`/ro/${domain}`);
    const swipe = page.getByTestId(`swipe-${domain}`);
    await expect(page.getByTestId("swipe-card")).toBeVisible();
    await expect(swipe.getByRole("button", { name: "Îmi doresc mult", exact: true })).toBeVisible();
    await expect(swipe).toContainText("Poți încerca fără cont.");
    const cookieButton = page.getByRole("button", { name: "Respinge opționale", exact: true });
    if (await cookieButton.isVisible()) await cookieButton.click();
    await swipe.screenshot({ path: testInfo.outputPath("swipe-ro.png") });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByTestId("swipe-interested").click();
    await expect(page.getByTestId("swipe-card")).toHaveAttribute("data-item-id", `swipe-fixture-${domain}-2`);
  });
}
