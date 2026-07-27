import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { moderateSchema, validateBody } from "@/lib/validation";
import { requestLogger } from "@/lib/logger";
import { createServerAIGateway } from "@/lib/ai/server";
import { proposeMessageModeration } from "@/lib/ai/safety-moderation";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(ip, { limit: 60, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({
      safe: true,
      flags: [],
      message: "Rate limited",
      category: "safe",
      riskScore: 0,
      recommendedAction: "allow",
      source: "deterministic",
      requiresHumanReview: false,
      automaticEnforcement: false,
    }, { status: 429 });
  }

  const log = requestLogger(request);
  const body = await request.json().catch(() => ({}));
  const { data: validated, error: validationError } = validateBody(body, moderateSchema);
  if (validationError) {
    log.warn("Validation failed", { error: validationError });
    return NextResponse.json({
      safe: false,
      flags: ["invalid_input"],
      message: validationError,
      category: "suspicious",
      riskScore: 50,
      recommendedAction: "manual_review",
      source: "deterministic",
      requiresHumanReview: true,
      automaticEnforcement: false,
    }, { status: 400 });
  }

  const proposal = await proposeMessageModeration(
    createServerAIGateway(),
    validated!.text ?? "",
  );

  // This endpoint returns a recommendation. It does not suspend users,
  // create reports, delete messages or write moderation actions.
  return NextResponse.json(proposal);
}
