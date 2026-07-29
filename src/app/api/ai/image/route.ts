import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { aiImageSchema, validateBody } from "@/lib/validation";
import { requestLogger, captureError } from "@/lib/logger";
import { getFeatureFlag } from "@/lib/feature-flags";
import {
  DEFAULT_GEMINI_VISION_MODEL,
  DEFAULT_GROQ_VISION_MODEL,
  DEFAULT_HUGGINGFACE_VISION_MODEL,
  buildVisionPrompt,
  fallbackVisionFromUrl,
  normalizeVisionLocale,
  parseVisionResponse,
  type VisionAnalysisData,
} from "@/lib/ai/vision-analysis";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Allow server-side downloads only from explicitly trusted image hosts. */
function isPublicUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      return false;
    }

    const allowedHosts = new Set(
      (process.env.AI_IMAGE_ALLOWED_HOSTS ?? "")
        .split(",")
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean),
    );

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      allowedHosts.add(new URL(supabaseUrl).hostname.toLowerCase());
    }

    return allowedHosts.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

type AiResult =
  | { ok: true; data: VisionAnalysisData; model: string }
  | { ok: false; error: string; model: string };

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(ip, { limit: 10, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json(
      {
        status: "error",
        code: "rate_limited",
        message: "Prea multe cereri. Încearcă din nou în 1 minut.",
      },
      { status: 429 },
    );
  }

  const log = requestLogger(request);
  const body = await request.json().catch(() => ({}));
  const { data: validated, error: validationError } = validateBody(body, aiImageSchema);
  if (validationError) {
    log.warn("Validation failed", { error: validationError });
    return NextResponse.json(
      { status: "error", code: "invalid_input", message: validationError },
      { status: 400 },
    );
  }

  const { imageUrl, imageBase64 } = validated!;
  const locale = normalizeVisionLocale(validated!.locale);
  const attempted: string[] = [];

  try {
    let base64Data = "";
    let mimeType = "image/jpeg";

    if (imageBase64) {
      const parsedImage = parseBase64Image(imageBase64);
      if (!parsedImage.ok) {
        return NextResponse.json(
          { status: "error", code: parsedImage.code, message: parsedImage.message },
          { status: parsedImage.status },
        );
      }
      base64Data = parsedImage.base64Data;
      mimeType = parsedImage.mimeType;
    } else if (imageUrl) {
      if (!isPublicUrl(imageUrl)) {
        return NextResponse.json(
          { status: "error", code: "blocked_image_url", message: "URL invalid sau blocat." },
          { status: 400 },
        );
      }

      try {
        const imageResponse = await fetch(imageUrl, {
          signal: AbortSignal.timeout(10_000),
        });
        if (!imageResponse.ok) {
          attempted.push(`fetch-url:http_${imageResponse.status}`);
          return fallbackResponse(imageUrl, locale, attempted);
        }

        const contentType = imageResponse.headers.get("content-type") || "";
        const contentLength = Number(imageResponse.headers.get("content-length") || "0");
        if (!contentType.toLowerCase().startsWith("image/")) {
          return NextResponse.json(
            {
              status: "error",
              code: "invalid_image_content_type",
              message: "URL-ul nu indică o imagine validă.",
            },
            { status: 400 },
          );
        }
        if (contentLength > MAX_IMAGE_BYTES) {
          return NextResponse.json(
            {
              status: "error",
              code: "image_too_large",
              message: "Imaginea depășește limita de 10 MB.",
            },
            { status: 413 },
          );
        }

        const buffer = Buffer.from(await imageResponse.arrayBuffer());
        if (buffer.byteLength > MAX_IMAGE_BYTES) {
          return NextResponse.json(
            {
              status: "error",
              code: "image_too_large",
              message: "Imaginea depășește limita de 10 MB.",
            },
            { status: 413 },
          );
        }

        base64Data = buffer.toString("base64");
        mimeType = contentType.split(";")[0]?.trim() || "image/jpeg";
      } catch (fetchError) {
        log.warn("AI image download failed", {
          code: providerErrorCode(fetchError),
        });
        attempted.push(`fetch-url:${providerErrorCode(fetchError)}`);
        return fallbackResponse(imageUrl, locale, attempted);
      }
    } else {
      return NextResponse.json(
        { status: "error", code: "missing_image", message: "Lipsă imagine." },
        { status: 400 },
      );
    }

    const dataUri = `data:${mimeType};base64,${base64Data}`;
    const prompt = buildVisionPrompt(locale);

    const groqKey = (process.env.GROQ_API_KEY || "").trim();
    const groqModel =
      process.env.GROQ_VISION_MODEL?.trim() || DEFAULT_GROQ_VISION_MODEL;
    if (groqKey) {
      const result = await analyzeWithGroq(dataUri, groqKey, groqModel, prompt, locale);
      if (result.ok) {
        return successResponse("groq", result, attempted);
      }
      log.warn("Groq vision analysis failed", {
        provider: "groq",
        model: result.model,
        code: providerErrorCode(result.error),
      });
      attempted.push(`groq:${providerErrorCode(result.error)}`);
    } else {
      attempted.push("groq:not_configured");
    }

    const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
    const geminiModel =
      process.env.GEMINI_VISION_MODEL?.trim() || DEFAULT_GEMINI_VISION_MODEL;
    if (geminiKey) {
      let result = await analyzeWithGemini(
        base64Data,
        mimeType,
        geminiKey,
        geminiModel,
        prompt,
        locale,
      );
      if (!result.ok && result.error.includes("HTTP 429")) {
        await new Promise((resolve) => setTimeout(resolve, 1_500));
        result = await analyzeWithGemini(
          base64Data,
          mimeType,
          geminiKey,
          geminiModel,
          prompt,
          locale,
        );
      }
      if (result.ok) {
        return successResponse("gemini", result, attempted);
      }
      log.warn("Gemini vision analysis failed", {
        provider: "gemini",
        model: result.model,
        code: providerErrorCode(result.error),
      });
      attempted.push(`gemini:${providerErrorCode(result.error)}`);
    } else {
      attempted.push("gemini:not_configured");
    }

    const huggingFaceKey = (
      process.env.HUGGINGFACE_API_KEY ||
      process.env.HUGGINGFACE_API_TOKEN ||
      ""
    ).trim();
    const huggingFaceModel =
      process.env.HUGGINGFACE_VISION_MODEL?.trim() ||
      DEFAULT_HUGGINGFACE_VISION_MODEL;
    const huggingFaceEnabled = await getFeatureFlag("ai_matching");
    if (huggingFaceKey && huggingFaceEnabled) {
      const result = await analyzeWithHuggingFace(
        dataUri,
        huggingFaceKey,
        huggingFaceModel,
        prompt,
        locale,
      );
      if (result.ok) {
        return successResponse("huggingface", result, attempted);
      }
      log.warn("Hugging Face vision analysis failed", {
        provider: "huggingface",
        model: result.model,
        code: providerErrorCode(result.error),
      });
      attempted.push(`huggingface:${providerErrorCode(result.error)}`);
    } else {
      attempted.push(
        `huggingface:${!huggingFaceKey ? "not_configured" : "disabled"}`,
      );
    }

    return fallbackResponse(imageUrl, locale, attempted);
  } catch (error) {
    captureError(error, { route: "/api/ai/image" });
    attempted.push(`exception:${providerErrorCode(error)}`);
    return fallbackResponse(imageUrl, locale, attempted);
  }
}

async function analyzeWithGroq(
  imageDataUri: string,
  apiKey: string,
  model: string,
  prompt: string,
  locale: string,
): Promise<AiResult> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUri } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        reasoning_effort: "none",
        max_completion_tokens: 500,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        ok: false,
        model,
        error: `HTTP ${response.status}: ${errorText.slice(0, 160)}`,
      };
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false, model, error: "empty_response" };

    const parsed = parseVisionResponse(text, locale);
    return parsed
      ? { ok: true, data: parsed, model }
      : { ok: false, model, error: "invalid_json_response" };
  } catch (error) {
    return { ok: false, model, error: String(error).slice(0, 160) };
  }
}

async function analyzeWithGemini(
  base64Data: string,
  mimeType: string,
  apiKey: string,
  model: string,
  prompt: string,
  locale: string,
): Promise<AiResult> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 500,
          },
        }),
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        ok: false,
        model,
        error: `HTTP ${response.status}: ${errorText.slice(0, 160)}`,
      };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      const blockReason =
        data?.candidates?.[0]?.finishReason ||
        data?.promptFeedback?.blockReason ||
        "empty_response";
      return { ok: false, model, error: String(blockReason) };
    }

    const parsed = parseVisionResponse(text, locale);
    return parsed
      ? { ok: true, data: parsed, model }
      : { ok: false, model, error: "invalid_json_response" };
  } catch (error) {
    return { ok: false, model, error: String(error).slice(0, 160) };
  }
}

async function analyzeWithHuggingFace(
  imageDataUri: string,
  apiKey: string,
  model: string,
  prompt: string,
  locale: string,
): Promise<AiResult> {
  try {
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageDataUri } },
              ],
            },
          ],
          max_tokens: 500,
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        ok: false,
        model,
        error: `HTTP ${response.status}: ${errorText.slice(0, 160)}`,
      };
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false, model, error: "empty_response" };

    const parsed = parseVisionResponse(text, locale);
    return parsed
      ? { ok: true, data: parsed, model }
      : { ok: false, model, error: "invalid_json_response" };
  } catch (error) {
    return { ok: false, model, error: String(error).slice(0, 160) };
  }
}

function successResponse(
  provider: "groq" | "gemini" | "huggingface",
  result: Extract<AiResult, { ok: true }>,
  attempted: string[],
) {
  return NextResponse.json({
    status: "ok",
    ...result.data,
    provider,
    model: result.model,
    attempted: [...attempted, `${provider}:ok`],
  });
}

function fallbackResponse(
  imageUrl: string | undefined,
  locale: string,
  attempted: string[],
) {
  return NextResponse.json({
    status: "fallback",
    ...fallbackVisionFromUrl(imageUrl, locale),
    provider: "deterministic",
    model: "swaply-filename-rules-v2",
    attempted,
  });
}

function parseBase64Image(imageBase64: string):
  | { ok: true; base64Data: string; mimeType: string }
  | { ok: false; code: string; message: string; status: number } {
  let base64Data = imageBase64.trim();
  let mimeType = "image/jpeg";

  if (base64Data.startsWith("data:")) {
    const separatorIndex = base64Data.indexOf(",");
    const header = separatorIndex >= 0 ? base64Data.slice(0, separatorIndex) : "";
    base64Data = separatorIndex >= 0 ? base64Data.slice(separatorIndex + 1) : "";
    mimeType = header.match(/^data:([^;]+);base64$/i)?.[1]?.toLowerCase() || "";

    if (!mimeType.startsWith("image/") || !base64Data) {
      return {
        ok: false,
        code: "invalid_image_data_uri",
        message: "Imagine base64 invalidă.",
        status: 400,
      };
    }
  }

  const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
  if (estimatedBytes > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      code: "image_too_large",
      message: "Imaginea depășește limita de 10 MB.",
      status: 413,
    };
  }

  return { ok: true, base64Data, mimeType };
}

function providerErrorCode(error: unknown): string {
  const text = String(error).toLowerCase();
  const httpStatus = text.match(/http\s+(\d{3})/)?.[1];
  if (httpStatus) return `http_${httpStatus}`;
  if (text.includes("timeout") || text.includes("aborted")) return "timeout";
  if (text.includes("invalid_json")) return "invalid_json";
  if (text.includes("empty_response")) return "empty_response";
  if (text.includes("network") || text.includes("fetch")) return "network_error";
  return "provider_error";
}
