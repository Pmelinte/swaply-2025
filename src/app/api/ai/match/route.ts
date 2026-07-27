import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { aiMatchSchema, validateBody } from "@/lib/validation";
import { requestLogger, captureError } from "@/lib/logger";
import { createServerAIGateway } from "@/lib/ai/server";
import { proposeSemanticMatchExplanation } from "@/lib/ai/semantic-match";

/**
 * Semantic match explanation.
 *
 * The existing local matching algorithm remains authoritative. This endpoint
 * produces an advisory explanation and a bounded suggested score only.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(ip, { limit: 20, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const log = requestLogger(request);
  try {
    const body = await request.json();
    const { data: validated, error: validationError } = validateBody(body, aiMatchSchema);
    if (validationError) {
      log.warn("Validation failed", { error: validationError });
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const input = validated!;
    const proposal = await proposeSemanticMatchExplanation(createServerAIGateway(), {
      offeredItem: input.offeredItem,
      requestedItem: input.requestedItem,
      baseScore: input.baseScore,
      algorithmicReasons: input.reasons,
      locale: typeof body.locale === "string" ? body.locale : undefined,
      distanceKm: typeof body.distanceKm === "number" ? body.distanceKm : undefined,
    });

    return NextResponse.json({
      aiScoreBoost: proposal.scoreAdjustment,
      aiSummary: proposal.summary,
      aiConfidence: proposal.confidence,
      provider: proposal.source === "ai" ? "gateway" : "fallback",
      semanticScore: proposal.semanticScore,
      reasons: proposal.reasons,
      risks: proposal.risks,
      baseScore: proposal.baseScore,
      suggestedScore: proposal.suggestedScore,
      affectsRanking: proposal.affectsRanking,
      requiresHumanConfirmation: proposal.requiresHumanConfirmation,
    });
  } catch (error) {
    captureError(error, { route: "/api/ai/match" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}