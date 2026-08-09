import { NextResponse } from "next/server";
import { loadFlags } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  const flags = await loadFlags();
  const publicFlags = flags.map((flag) => ({
    key: flag.id,
    name: flag.name,
    description: flag.description,
    enabled: flag.enabled,
    category: flag.category,
    rollout_percent: flag.rolloutPercent,
    allowed_countries: flag.allowedCountries,
  }));

  return NextResponse.json(
    { flags: publicFlags },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
