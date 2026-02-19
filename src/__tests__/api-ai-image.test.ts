import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/image/route";

function makeRequest(body: object, ip: string = "test-ip") {
  return new Request("http://localhost/api/ai/image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/image", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("HUGGINGFACE_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_HF_ENABLED", "false");
    vi.resetModules();
  });

  it("returns error when no image provided", async () => {
    const res = await POST(makeRequest({}));
    const data = await res.json();
    expect(data.status).toBe("error");
    expect(data.message).toContain("imageUrl");
  });

  it("blocks SSRF: localhost", async () => {
    const res = await POST(makeRequest({ imageUrl: "http://localhost/secret" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain("blocat");
  });

  it("blocks SSRF: 127.0.0.1", async () => {
    const res = await POST(makeRequest({ imageUrl: "http://127.0.0.1/etc/passwd" }));
    expect(res.status).toBe(400);
  });

  it("blocks SSRF: 10.x.x.x", async () => {
    const res = await POST(makeRequest({ imageUrl: "http://10.0.0.1/internal" }));
    expect(res.status).toBe(400);
  });

  it("blocks SSRF: 192.168.x.x", async () => {
    const res = await POST(makeRequest({ imageUrl: "http://192.168.1.1/admin" }));
    expect(res.status).toBe(400);
  });

  it("blocks SSRF: 172.16-31.x.x", async () => {
    const res = await POST(makeRequest({ imageUrl: "http://172.16.0.1/internal" }));
    expect(res.status).toBe(400);
  });

  it("blocks SSRF: 169.254.x.x (link-local)", async () => {
    const res = await POST(makeRequest({ imageUrl: "http://169.254.169.254/metadata" }));
    expect(res.status).toBe(400);
  });

  it("blocks SSRF: .local domains", async () => {
    const res = await POST(makeRequest({ imageUrl: "http://myserver.local/image.jpg" }));
    expect(res.status).toBe(400);
  });

  it("blocks SSRF: .internal domains", async () => {
    const res = await POST(makeRequest({ imageUrl: "http://api.internal/data" }));
    expect(res.status).toBe(400);
  });

  it("blocks SSRF: 0.0.0.0", async () => {
    const res = await POST(makeRequest({ imageUrl: "http://0.0.0.0:8080/image" }));
    expect(res.status).toBe(400);
  });

  it("blocks SSRF: IPv6 localhost", async () => {
    const res = await POST(makeRequest({ imageUrl: "http://[::1]/image" }, "ssrf-ipv6"));
    expect(res.status).toBe(400);
  });

  it("returns fallback from URL filename when all AI unavailable", async () => {
    // Mock fetch to simulate failed image download
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));
    const res = await POST(makeRequest({ imageUrl: "https://example.com/photos/laptop-dell-2024.jpg" }, "fallback-url"));
    const data = await res.json();
    expect(data.status).toBe("fallback");
    expect(data.attempted).toBeInstanceOf(Array);
    vi.restoreAllMocks();
  });

  it("handles base64 image with data URI prefix", async () => {
    const res = await POST(makeRequest({ imageBase64: "data:image/jpeg;base64,/9j/4AAQ==" }, "base64-uri"));
    const data = await res.json();
    // All AI providers missing — returns fallback or error depending on parsing
    expect(["fallback", "error"]).toContain(data.status);
  });

  it("handles raw base64 without prefix", async () => {
    const res = await POST(makeRequest({ imageBase64: "/9j/4AAQ==" }, "base64-raw"));
    const data = await res.json();
    expect(["fallback", "error"]).toContain(data.status);
  });

  it("rate limits at 10 requests per minute", async () => {
    vi.resetModules();
    const mod = await import("@/app/api/ai/image/route");
    let lastRes;
    for (let i = 0; i < 11; i++) {
      lastRes = await mod.POST(makeRequest({ imageBase64: "dGVzdA==" }, "rl-image"));
    }
    expect(lastRes!.status).toBe(429);
  });
});
