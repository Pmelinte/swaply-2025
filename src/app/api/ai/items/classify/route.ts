import { NextRequest, NextResponse } from "next/server";

type HuggingFaceLabel = {
  label: string;
  score: number;
};

type HuggingFaceResponse = HuggingFaceLabel[] | HuggingFaceLabel[][] | any;

type NormalizedLabel = {
  label: string;
  confidence: number;
};

type NormalizedClassificationResult = {
  /** Eticheta principală aleasă (ex: "bicycle", "laptop", "sofa") */
  mainLabel: string | null;
  /** Top N etichete normalizate din răspunsul Hugging Face */
  labels: NormalizedLabel[];
  /** Localizarea cerută de client (ro, en, etc.) – doar propagată, nu tradusă aici */
  locale: string;
  /** Răspunsul brut de la Hugging Face, pentru debugging sau UI avansat */
  raw: HuggingFaceResponse;
};

type ErrorResponse = {
  ok: false;
  error: string;
};

type SuccessResponse = {
  ok: true;
  result: NormalizedClassificationResult;
};

type ApiResponse = SuccessResponse | ErrorResponse;

type RequestBody = {
  imageUrl?: string;
  locale?: string;
};

/**
 * POST /api/ai/items/classify
 *
 * Citește imageUrl + locale din body,
 * cheamă Hugging Face (sau alt API) folosind env-urile:
 *  - HF_ITEM_CLASSIFIER_URL (sau HF_IMAGE_CLASSIFIER_URL)
 *  - HF_API_TOKEN (sau HUGGINGFACE_API_KEY)
 *
 * Normalizează răspunsul la un format stabil (NormalizedClassificationResult),
 * astfel încât clientul să îl poată mapa ulterior pe ItemClassificationResult.
 *
 * IMPORTANT: Nu modifică nimic altundeva în proiect – doar acest endpoint nou.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = (await request.json().catch(() => ({}))) as RequestBody;

    const imageUrl = body.imageUrl;
    const locale = body.locale ?? "en";

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_or_invalid_image_url",
        },
        { status: 400 },
      );
    }

    const apiUrl =
      process.env.HF_ITEM_CLASSIFIER_URL ||
      process.env.HF_IMAGE_CLASSIFIER_URL;

    const apiToken =
      process.env.HF_API_TOKEN || process.env.HUGGINGFACE_API_KEY;

    if (!apiUrl || !apiToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "hf_api_not_configured",
        },
        { status: 500 },
      );
    }

    const hfResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      /**
       * Forma exactă a body-ului depinde de pipeline-ul Hugging Face folosit.
       * Aici presupunem că modelul acceptă un URL de imagine în câmpul `inputs`.
       * Dacă modelul tău specific cere altceva (ex. base64), se ajustează aici.
       */
      body: JSON.stringify({
        inputs: imageUrl,
        parameters: {
          // Propagăm locale doar ca metadată – modelul poate sau nu să o folosească
          locale,
        },
      }),
    });

    if (!hfResponse.ok) {
      const text = await hfResponse.text().catch(() => "");
      return NextResponse.json(
        {
          ok: false,
          error:
            text ||
            `hf_request_failed_${hfResponse.status}_${hfResponse.statusText}`,
        },
        { status: 502 },
      );
    }

    const data = (await hfResponse.json()) as HuggingFaceResponse;

    const normalized = normalizeHuggingFaceResponse(data, locale);

    return NextResponse.json(
      {
        ok: true,
        result: normalized,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[AI_ITEMS_CLASSIFY_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
      },
      { status: 500 },
    );
  }
}

/**
 * Normalizează răspunsul Hugging Face la un format stabil,
 * care poate fi apoi mapat în client pe ItemClassificationResult.
 *
 * Suportă:
 *  - array simplu de { label, score }
 *  - array de array (unele pipelines întorc [[{ label, score }]])
 *  - fallback generic (păstrează raw data)
 */
function normalizeHuggingFaceResponse(
  data: HuggingFaceResponse,
  locale: string,
): NormalizedClassificationResult {
  let labels: NormalizedLabel[] = [];
  let mainLabel: string | null = null;

  if (Array.isArray(data)) {
    // Cazul 1: [ { label, score }, ... ]
    if (data.length > 0 && "label" in data[0] && "score" in data[0]) {
      labels = (data as HuggingFaceLabel[]).map((entry) => ({
        label: entry.label,
        confidence: entry.score,
      }));
    }

    // Cazul 2: [ [ { label, score }, ... ] ]
    if (
      labels.length === 0 &&
      Array.isArray(data[0]) &&
      data[0].length > 0 &&
      "label" in data[0][0] &&
      "score" in data[0][0]
    ) {
      labels = (data[0] as HuggingFaceLabel[]).map((entry) => ({
        label: entry.label,
        confidence: entry.score,
      }));
    }
  }

  if (labels.length > 0) {
    mainLabel = labels[0]?.label ?? null;
  }

  return {
    mainLabel,
    labels,
    locale,
    raw: data,
  };
}
