import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analyze-image/route";

function makeRequest(
  body: object,
  options: { referer?: string; acceptLanguage?: string; ip?: string } = {},
) {
  return new Request("http://localhost/api/analyze-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": options.ip || "wrapper-test",
      ...(options.referer ? { referer: options.referer } : {}),
      ...(options.acceptLanguage
        ? { "accept-language": options.acceptLanguage }
        : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analyze-image compatibility wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("GROQ_API_KEY", "groq-test-key");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("HUGGINGFACE_API_KEY", "");
  });

  it("derives the locale from the localized wizard route", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "Appareil photo numérique",
                  description: "Un appareil photo noir avec objectif.",
                  category_l1: "Cameras & Optics",
                  category_l2: "Digital Cameras",
                  confidence: 0.91,
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await POST(
      makeRequest(
        { imageUrl: "data:image/jpeg;base64,/9j/4AAQ==" },
        {
          referer: "https://www.swaply.world/fr/objects/new",
          acceptLanguage: "ro-RO,ro;q=0.9",
          ip: "wrapper-fr",
        },
      ),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.locale).toBe("fr");
    expect(data.title).toBe("Appareil photo numérique");
    expect(data.category_l1).toBe("Cameras & Optics");
    expect(data.category_l2).toBe("Digital Cameras");
    expect(data.provider).toBe("groq");
  });

  it("lets an explicit locale override the referer locale", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "Digitalkamera",
                  description: "Eine schwarze Digitalkamera mit Objektiv.",
                  category_l1: "Cameras & Optics",
                  category_l2: "Digital Cameras",
                  confidence: 0.9,
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await POST(
      makeRequest(
        {
          imageUrl: "data:image/jpeg;base64,/9j/4AAQ==",
          locale: "de",
        },
        {
          referer: "https://www.swaply.world/fr/objects/new",
          ip: "wrapper-explicit-de",
        },
      ),
    );
    const data = await response.json();
    const [, init] = fetchSpy.mock.calls[0];
    const providerBody = JSON.parse(String(init?.body));

    expect(data.locale).toBe("de");
    expect(providerBody.messages[0].content[0].text).toContain("locale de");
  });
});
