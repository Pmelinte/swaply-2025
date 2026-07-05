import { test, expect } from "@playwright/test";

const PROTECTED_POST_ROUTES = [
  "/api/swaps/demo-swap-id/decision",
  "/api/swaps/demo-swap-id/complete",
  "/api/swaps/demo-swap-id/logistics",
  "/api/swaps/demo-swap-id/feedback",
  "/api/messages/demo-message-id/translate",
  "/api/notifications",
];

test.describe("API security smoke", () => {
  for (const route of PROTECTED_POST_ROUTES) {
    test(`POST ${route} rejects anonymous access`, async ({ request }) => {
      const response = await request.post(route, {
        data: {},
        headers: { "Content-Type": "application/json" },
      });

      expect([401, 403, 400, 404]).toContain(response.status());
      expect(response.status(), `${route} must not allow anonymous mutation`).not.toBe(200);
    });
  }

  test("notifications GET rejects anonymous access", async ({ request }) => {
    const response = await request.get("/api/notifications");
    expect([401, 403]).toContain(response.status());
  });
});
