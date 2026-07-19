import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearChatTranslationMemoryCache,
  createChatTranslationCacheKey,
  detectLikelyMessageLanguage,
  translateMessage,
} from "./chatTranslation";

function createRequest(
  payload: object,
  status = 200,
): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  })) as unknown as typeof fetch;
}

describe("chat translation failure contract", () => {
  beforeEach(() => {
    clearChatTranslationMemoryCache();
  });

  it("uses the complete message in the cache key", () => {
    const prefix = "a".repeat(250);
    expect(createChatTranslationCacheKey(`${prefix} one`, "en", "ro"))
      .not.toBe(createChatTranslationCacheKey(`${prefix} two`, "en", "ro"));
  });

  it("normalizes hyphenated and underscore locale tags consistently", () => {
    expect(createChatTranslationCacheKey("Olá", "pt_BR", "ro_RO"))
      .toBe(createChatTranslationCacheKey("Olá", "pt-BR", "ro-RO"));
  });

  it("recognizes representative global scripts without forcing English", () => {
    expect(detectLikelyMessageLanguage("Bună, putem face schimbul?")).toBe("ro");
    expect(detectLikelyMessageLanguage("Está aquí para el intercambio")).toBe("es");
    expect(detectLikelyMessageLanguage("שלום, תודה")).toBe("yi");
    expect(detectLikelyMessageLanguage("مرحبا")).toBe("ar");
    expect(detectLikelyMessageLanguage("交換できますか")).toBe("ja");
    expect(detectLikelyMessageLanguage("plain latin text")).toBe("auto");
  });

  it("returns a successful translation and reuses only that successful result", async () => {
    const request = createRequest({
      translated: "Bună",
      status: "ok",
      source: "cache",
    });

    const first = await translateMessage("Hello", "ro", {
      sourceLang: "en",
      request,
    });
    const second = await translateMessage("Hello", "ro", {
      sourceLang: "en",
      request,
    });

    expect(first).toMatchObject({
      originalText: "Hello",
      translatedText: "Bună",
      status: "translated",
      source: "server_cache",
    });
    expect(second.source).toBe("memory_cache");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("keeps the original authoritative when the provider returns fallback", async () => {
    const request = createRequest({
      translated: "Hello",
      status: "fallback",
    });

    const first = await translateMessage("Hello", "ro", {
      sourceLang: "en",
      request,
    });
    const second = await translateMessage("Hello", "ro", {
      sourceLang: "en",
      request,
    });

    expect(first).toEqual({
      originalText: "Hello",
      translatedText: null,
      sourceLang: "en",
      targetLang: "ro",
      status: "fallback",
      source: "fallback",
    });
    expect(second.status).toBe("fallback");
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("treats same-language responses as a safe no-op", async () => {
    const result = await translateMessage("Bună", "ro", {
      sourceLang: "ro",
      request: createRequest({
        translated: "Bună",
        status: "same_language",
      }),
    });

    expect(result.status).toBe("same_language");
    expect(result.originalText).toBe("Bună");
    expect(result.translatedText).toBeNull();
  });

  it("rejects HTTP and malformed success responses instead of inventing translation copy", async () => {
    await expect(translateMessage("Hello", "ro", {
      sourceLang: "en",
      request: createRequest({ error: "unavailable" }, 503),
    })).rejects.toThrow("HTTP 503");

    await expect(translateMessage("Hello", "ro", {
      sourceLang: "en",
      request: createRequest({ status: "ok" }),
    })).rejects.toThrow("malformed");
  });
});
