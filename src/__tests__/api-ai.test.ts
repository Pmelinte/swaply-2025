import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/route";

function makeRequest(body: object, ip: string = "test-ip") {
  return new Request("http://localhost/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("HUGGINGFACE_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_HF_ENABLED", "false");
    vi.resetModules();
  });

  it("returns error for missing title and description", async () => {
    const res = await POST(makeRequest({}));
    const data = await res.json();
    expect(data.status).toBe("error");
    expect(data.message).toContain("Titlu sau descriere lipsa");
  });

  it("returns fallback category/tags when HF disabled", async () => {
    const res = await POST(makeRequest({ title: "Laptop Dell vechi", description: "Laptop bun" }));
    const data = await res.json();
    expect(data.status).toBe("fallback");
    expect(data.category).toBeTruthy();
    expect(data.tags).toBeInstanceOf(Array);
  });

  it("keyword fallback: detects electronics", async () => {
    const res = await POST(makeRequest({ title: "Laptop gaming", description: "Calculator puternic" }));
    const data = await res.json();
    expect(data.category).toContain("Laptop");
  });

  it("keyword fallback: detects sports", async () => {
    const res = await POST(makeRequest({ title: "Bicicleta mountain bike", description: "Bicicleta sport" }));
    const data = await res.json();
    expect(data.category).toBeTruthy();
  });

  it("keyword fallback: tags contain matching keywords", async () => {
    const res = await POST(makeRequest({ title: "Laptop gaming vechi", description: "tech gadget" }));
    const data = await res.json();
    expect(data.tags).toBeInstanceOf(Array);
    expect(data.tags.some((t: string) => ["laptop", "gaming", "tech"].includes(t))).toBe(true);
  });

  it("returns default category for unrecognized text", async () => {
    const res = await POST(makeRequest({ title: "xyz abc", description: "nothing special" }));
    const data = await res.json();
    expect(data.category).toBeTruthy(); // "Hobby & Jocuri" fallback
  });

  it("generates description when action=generate_description", async () => {
    const res = await POST(makeRequest({
      prompt: "generate_description",
      title: "Laptop Dell",
      category: "Electronică",
      condition: "new",
    }));
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.description).toContain("Laptop Dell");
    expect(data.description).toContain("nou");
  });

  it("generates description for used condition", async () => {
    const res = await POST(makeRequest({
      prompt: "generate_description",
      title: "Canapea",
      condition: "used",
    }));
    const data = await res.json();
    expect(data.description).toContain("folosit");
  });

  it("generates description for good condition", async () => {
    const res = await POST(makeRequest({
      prompt: "generate_description",
      title: "Telefon",
      condition: "good",
    }));
    const data = await res.json();
    expect(data.description).toContain("bună");
  });

  it("rate limits at 30 requests per minute", async () => {
    vi.resetModules();
    const mod = await import("@/app/api/ai/route");
    let lastRes;
    for (let i = 0; i < 31; i++) {
      lastRes = await mod.POST(makeRequest({ title: "test" }, "rl-ai"));
    }
    expect(lastRes!.status).toBe(429);
  });
});
