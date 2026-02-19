import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/translate/route";

function makeRequest(body: object, ip: string = "test-ip") {
  return new Request("http://localhost/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/translate", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("HUGGINGFACE_API_KEY", "");
    vi.resetModules();
  });

  it("returns 400 for missing parameters", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Parametri lipsa");
  });

  it("returns 400 for missing text", async () => {
    const res = await POST(makeRequest({ from: "ro", to: "en" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing from", async () => {
    const res = await POST(makeRequest({ text: "test", to: "en" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing to", async () => {
    const res = await POST(makeRequest({ text: "test", from: "ro" }));
    expect(res.status).toBe(400);
  });

  it("returns same text for same language pair", async () => {
    const res = await POST(makeRequest({ text: "Bună ziua", from: "ro", to: "ro" }));
    const data = await res.json();
    expect(data.translated).toBe("Bună ziua");
    expect(data.status).toBe("same_language");
  });

  it("returns fallback when no HF key", async () => {
    const res = await POST(makeRequest({ text: "Hello", from: "en", to: "ro" }));
    const data = await res.json();
    expect(data.translated).toBe("Hello");
    expect(data.status).toBe("fallback");
    expect(data.message).toContain("API key lipsa");
  });

  it("returns fallback for unsupported language pair", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "test-key");
    vi.resetModules();
    const mod = await import("@/app/api/translate/route");
    const res = await mod.POST(makeRequest({ text: "Hello", from: "ja", to: "zh" }));
    const data = await res.json();
    expect(data.status).toBe("fallback");
    expect(data.message).toContain("nesuportata");
  });

  it("rate limits at 30 requests per minute", async () => {
    vi.resetModules();
    const mod = await import("@/app/api/translate/route");
    let lastRes;
    for (let i = 0; i < 31; i++) {
      lastRes = await mod.POST(makeRequest({ text: "test", from: "ro", to: "en" }, "rl-translate"));
    }
    expect(lastRes!.status).toBe(429);
  });

  it("handles invalid JSON body gracefully", async () => {
    const req = new Request("http://localhost/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "test" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
