import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/image/route";
import {
  DEFAULT_GEMINI_VISION_MODEL,
  DEFAULT_GROQ_VISION_MODEL,
} from "@/lib/ai/vision-analysis";

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

function providerResponse(content: object) {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("POST /api/ai/image", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("GROQ_VISION_MODEL", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_VISION_MODEL", "");
    vi.stubEnv("HUGGINGFACE_API_KEY", "");
    vi.stubEnv("HUGGINGFACE_VISION_MODEL", "");
    vi.stubEnv("NEXT_PUBLIC_HF_ENABLED", "false");
    vi.stubEnv("AI_IMAGE_ALLOWED_HOSTS", "");
    vi.resetModules();
  });

  it("returns error when no image is provided", async () => {
    const res = await POST(makeRequest({}));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.status).toBe("error");
    expect(data.message).toContain("imageUrl");
  });

  it("rejects malformed locales", async () => {
    const res = await POST(
      makeRequest(
        { imageBase64: "data:image/jpeg;base64,/9j/4AAQ==", locale: "../ro" },
        "invalid-locale",
      ),
    );
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.code).toBe("invalid_input");
    expect(data.message).toContain("Locale BCP-47 invalid");
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

  it("blocks public image hosts that are not explicitly allowlisted", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    const res = await POST(
      makeRequest(
        { imageUrl: "https://untrusted.example/photos/laptop-dell-2024.jpg" },
        "untrusted-public-host",
      ),
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.status).toBe("error");
    expect(data.message).toContain("blocat");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("uses the current Groq vision model and requested locale", async () => {
    vi.stubEnv("GROQ_API_KEY", "groq-test-key");
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        providerResponse({
          title: "Appareil photo numérique Sony",
          description: "Un appareil photo numérique noir avec objectif.",
          category_l1: "Cameras & Optics",
          category_l2: "Digital Cameras",
          confidence: 0.93,
        }),
      );

    const res = await POST(
      makeRequest(
        {
          imageBase64: "data:image/jpeg;base64,/9j/4AAQ==",
          locale: "fr",
        },
        "groq-fr",
      ),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.provider).toBe("groq");
    expect(data.model).toBe(DEFAULT_GROQ_VISION_MODEL);
    expect(data.locale).toBe("fr");
    expect(data.categoryL1).toBe("Cameras & Optics");
    expect(data.categoryL2).toBe("Digital Cameras");
    expect(data.confidence).toBe(0.93);

    const [, init] = fetchSpy.mock.calls[0];
    const providerBody = JSON.parse(String(init?.body));
    expect(providerBody.model).toBe(DEFAULT_GROQ_VISION_MODEL);
    expect(providerBody.response_format).toEqual({ type: "json_object" });
    expect(providerBody.messages[0].content[0].text).toContain("locale fr");
    expect(providerBody.messages[0].content[0].text).not.toContain("Romanian");
  });

  it("honours a Groq vision model override", async () => {
    vi.stubEnv("GROQ_API_KEY", "groq-test-key");
    vi.stubEnv("GROQ_VISION_MODEL", "custom/multimodal-model");
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        providerResponse({
          title: "Laptop",
          description: "Portable computer.",
          category_l1: "Electronics",
          category_l2: "Computers",
          confidence: 0.8,
        }),
      );

    const res = await POST(
      makeRequest(
        { imageBase64: "data:image/jpeg;base64,/9j/4AAQ==", locale: "en" },
        "groq-model-override",
      ),
    );
    const data = await res.json();
    const [, init] = fetchSpy.mock.calls[0];
    const providerBody = JSON.parse(String(init?.body));

    expect(data.model).toBe("custom/multimodal-model");
    expect(providerBody.model).toBe("custom/multimodal-model");
  });

  it("uses the current Gemini fallback model when Groq is unavailable", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      title: "Căști fără fir",
                      description: "O pereche de căști audio fără fir.",
                      category_l1: "Electronics",
                      category_l2: "Audio",
                      confidence: 0.88,
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const res = await POST(
      makeRequest(
        { imageBase64: "data:image/jpeg;base64,/9j/4AAQ==", locale: "ro" },
        "gemini-ro",
      ),
    );
    const data = await res.json();

    expect(data.provider).toBe("gemini");
    expect(data.model).toBe(DEFAULT_GEMINI_VISION_MODEL);
    expect(data.locale).toBe("ro");
    expect(data.categoryL2).toBe("Audio");
    expect(String(fetchSpy.mock.calls[0][0])).toContain(
      `/models/${DEFAULT_GEMINI_VISION_MODEL}:generateContent`,
    );
    expect(String(fetchSpy.mock.calls[0][0])).not.toContain("gemini-2.0-flash");
  });

  it("returns a canonical deterministic fallback when an allowlisted download fails", async () => {
    vi.stubEnv("AI_IMAGE_ALLOWED_HOSTS", "example.com");
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

    const res = await POST(
      makeRequest(
        {
          imageUrl: "https://example.com/photos/laptop-dell-2024.jpg",
          locale: "de",
        },
        "fallback-url",
      ),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("fallback");
    expect(data.provider).toBe("deterministic");
    expect(data.title).toBe("Laptop dell");
    expect(data.caption).toBe("Laptop dell");
    expect(data.categoryL1).toBe("Electronics");
    expect(data.categoryL2).toBe("Computers");
    expect(data.locale).toBe("de");
    expect(data.manualCompletionRequired).toBe(true);
    expect(data.attempted).toEqual(
      expect.arrayContaining([expect.stringContaining("fetch-url")]),
    );
  });

  it("handles a base64 image with a data URI prefix", async () => {
    const res = await POST(
      makeRequest(
        { imageBase64: "data:image/jpeg;base64,/9j/4AAQ==", locale: "en" },
        "base64-uri",
      ),
    );
    const data = await res.json();
    expect(data.status).toBe("fallback");
    expect(data.locale).toBe("en");
    expect(data.caption).toBe("");
  });

  it("rejects non-image data URIs", async () => {
    const res = await POST(
      makeRequest(
        { imageBase64: "data:text/plain;base64,dGVzdA==", locale: "en" },
        "base64-invalid-mime",
      ),
    );
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.code).toBe("invalid_image_data_uri");
  });

  it("handles raw base64 without a prefix", async () => {
    const res = await POST(
      makeRequest({ imageBase64: "/9j/4AAQ==", locale: "en" }, "base64-raw"),
    );
    const data = await res.json();
    expect(data.status).toBe("fallback");
  });

  it("rate limits at 10 requests per minute", async () => {
    vi.resetModules();
    const mod = await import("@/app/api/ai/image/route");
    let lastRes;
    for (let i = 0; i < 11; i++) {
      lastRes = await mod.POST(
        makeRequest({ imageBase64: "dGVzdA==", locale: "en" }, "rl-image-v2"),
      );
    }
    expect(lastRes!.status).toBe(429);
  });
});
