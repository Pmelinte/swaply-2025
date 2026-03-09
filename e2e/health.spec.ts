import { test, expect } from "@playwright/test";

test.describe("API health check", () => {
  test("GET /api/health returns status ok", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("health response includes a valid ISO timestamp", async ({
    request,
  }) => {
    const response = await request.get("/api/health");
    const body = await response.json();

    expect(body.timestamp).toBeDefined();
    // Verify the timestamp is a valid ISO 8601 string
    const parsed = new Date(body.timestamp);
    expect(parsed.getTime()).not.toBeNaN();
  });

  test("health response includes version", async ({ request }) => {
    const response = await request.get("/api/health");
    const body = await response.json();

    expect(body.version).toBeDefined();
    expect(typeof body.version).toBe("string");
  });

  test("health response includes service statuses", async ({ request }) => {
    const response = await request.get("/api/health");
    const body = await response.json();

    // The services object should exist and contain known keys
    expect(body.services).toBeDefined();
    expect(typeof body.services).toBe("object");

    // Verify all expected service keys are present
    const expectedServices = [
      "supabase",
      "ai",
      "groq",
      "gemini",
      "maps",
      "cloudinary",
    ];
    for (const service of expectedServices) {
      expect(body.services).toHaveProperty(service);
      // Each service status should be a boolean
      expect(typeof body.services[service]).toBe("boolean");
    }
  });

  test("health response shape matches expected contract", async ({
    request,
  }) => {
    const response = await request.get("/api/health");
    const body = await response.json();

    // Full shape assertion
    expect(body).toMatchObject({
      status: "ok",
      timestamp: expect.any(String),
      version: expect.any(String),
      services: {
        supabase: expect.any(Boolean),
        ai: expect.any(Boolean),
        groq: expect.any(Boolean),
        gemini: expect.any(Boolean),
        maps: expect.any(Boolean),
        cloudinary: expect.any(Boolean),
      },
    });
  });
});
