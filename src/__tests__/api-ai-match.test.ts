import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/match/route";

function makeRequest(body: object, ip: string = "test-ip") {
  return new Request("http://localhost/api/ai/match", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  offeredItem: {
    title: "Laptop Dell",
    category: "Electronică",
    condition: "good",
    description: "Laptop bun",
    wishlist: "Telefon sau tabletă",
  },
  requestedItem: {
    title: "iPhone 13",
    category: "Electronică",
    condition: "good",
    description: "Telefon in stare buna",
    wishlist: "Laptop",
  },
  baseScore: 75,
  reasons: ["Categorii compatibile", "Wishlist match"],
};

describe("POST /api/ai/match", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.resetModules();
  });

  it("returns 400 for missing items", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing items");
  });

  it("returns 400 for missing offered item title", async () => {
    const res = await POST(makeRequest({
      offeredItem: { category: "test" },
      requestedItem: { title: "test", category: "test", condition: "good" },
      baseScore: 50,
      reasons: [],
    }));
    expect(res.status).toBe(400);
  });

  it("returns fallback when no AI providers configured", async () => {
    const res = await POST(makeRequest(validBody));
    const data = await res.json();
    expect(data.aiScoreBoost).toBe(0);
    expect(data.aiSummary).toContain("unavailable");
    expect(data.aiConfidence).toBe("low");
    expect(data.provider).toBe("fallback");
  });

  it("rate limits at 20 requests per minute", async () => {
    vi.resetModules();
    const mod = await import("@/app/api/ai/match/route");
    let lastRes;
    for (let i = 0; i < 21; i++) {
      lastRes = await mod.POST(makeRequest(validBody, "rl-match"));
    }
    expect(lastRes!.status).toBe(429);
  });

  it("handles malformed JSON in request", async () => {
    const req = new Request("http://localhost/api/ai/match", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "test" },
      body: "invalid json",
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
