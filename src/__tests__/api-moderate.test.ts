// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/moderate/route";

function makeRequest(body: object, ip: string = "test-ip") {
  return new Request("http://localhost/api/moderate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/moderate", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("HUGGINGFACE_API_KEY", "");
    vi.resetModules();
  });

  it("returns safe for clean text", async () => {
    const res = await POST(makeRequest({ text: "Bună ziua! Vreau să schimb o carte." }));
    const data = await res.json();
    expect(data.safe).toBe(true);
    expect(data.flags).toEqual([]);
  });

  it("returns safe for empty text", async () => {
    const res = await POST(makeRequest({ text: "" }));
    const data = await res.json();
    expect(data.safe).toBe(true);
  });

  it("returns safe for missing text", async () => {
    const res = await POST(makeRequest({}));
    const data = await res.json();
    expect(data.safe).toBe(true);
  });

  // Personal data detection
  it("detects phone numbers", async () => {
    const res = await POST(makeRequest({ text: "Sună-mă la 0745123456 pentru detalii." }));
    const data = await res.json();
    expect(data.safe).toBe(false);
    expect(data.flags).toContain("date_personale");
  });

  it("detects email addresses", async () => {
    const res = await POST(makeRequest({ text: "Contactează-mă la user@example.com" }));
    const data = await res.json();
    expect(data.safe).toBe(false);
    expect(data.flags).toContain("date_personale");
  });

  it("detects IP addresses", async () => {
    const res = await POST(makeRequest({ text: "Serverul meu e pe 192.168.1.1" }));
    const data = await res.json();
    expect(data.safe).toBe(false);
    expect(data.flags).toContain("date_personale");
  });

  it("detects IBAN keyword", async () => {
    const res = await POST(makeRequest({ text: "Trimite pe IBAN contul meu" }));
    const data = await res.json();
    expect(data.safe).toBe(false);
    expect(data.flags).toContain("date_personale");
  });

  it("detects IBAN format", async () => {
    const res = await POST(makeRequest({ text: "RO49AAAA1234567890123456" }));
    const data = await res.json();
    expect(data.safe).toBe(false);
    expect(data.flags).toContain("date_personale");
  });

  // Profanity detection
  it("detects Romanian profanity", async () => {
    const res = await POST(makeRequest({ text: "Ești un prost total" }));
    const data = await res.json();
    expect(data.safe).toBe(false);
    expect(data.flags).toContain("limbaj_inadecvat");
  });

  it("detects English profanity", async () => {
    const res = await POST(makeRequest({ text: "This is some shit product" }));
    const data = await res.json();
    expect(data.safe).toBe(false);
    expect(data.flags).toContain("limbaj_inadecvat");
  });

  it("detects Spanish profanity", async () => {
    const res = await POST(makeRequest({ text: "Es una mierda completa" }));
    const data = await res.json();
    expect(data.safe).toBe(false);
    expect(data.flags).toContain("limbaj_inadecvat");
  });

  // Spam detection
  it("detects long messages as spam", async () => {
    const longText = "a".repeat(501);
    const res = await POST(makeRequest({ text: longText }));
    const data = await res.json();
    expect(data.flags).toContain("mesaj_prea_lung");
  });

  it("detects repeated characters as spam", async () => {
    const res = await POST(makeRequest({ text: "Salutttttttt cum esti" }));
    const data = await res.json();
    expect(data.flags).toContain("spam_caractere");
  });

  it("detects excessive URLs as spam", async () => {
    const res = await POST(makeRequest({ text: "https://a.com https://b.com https://c.com" }));
    const data = await res.json();
    expect(data.flags).toContain("spam_linkuri");
  });

  it("allows 2 or fewer URLs", async () => {
    const res = await POST(makeRequest({ text: "Verifică https://a.com și https://b.com" }));
    const data = await res.json();
    expect(data.flags).not.toContain("spam_linkuri");
  });

  // Multiple flags
  it("can return multiple flags", async () => {
    const text = "Ești un prost, emailul e prost@mail.com" + "t".repeat(6);
    const res = await POST(makeRequest({ text }));
    const data = await res.json();
    expect(data.safe).toBe(false);
    expect(data.flags.length).toBeGreaterThanOrEqual(2);
  });

  // Rate limiting
  it("rate limits at 60 requests per minute", async () => {
    // Use fresh module to have clean rate-limit state
    vi.resetModules();
    const mod = await import("@/app/api/moderate/route");

    let lastRes;
    for (let i = 0; i < 61; i++) {
      lastRes = await mod.POST(makeRequest({ text: "test" }, "ratelimit-ip"));
    }
    expect(lastRes!.status).toBe(429);
  });

  // Message format
  it("includes message when unsafe", async () => {
    const res = await POST(makeRequest({ text: "Ești un idiot complet" }));
    const data = await res.json();
    expect(data.message).toContain("Mesaj blocat");
  });

  it("has no message when safe", async () => {
    const res = await POST(makeRequest({ text: "Bună ziua!" }));
    const data = await res.json();
    expect(data.message).toBeUndefined();
  });
});
