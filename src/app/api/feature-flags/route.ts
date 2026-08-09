import { NextResponse } from "next/server";
import { loadFlags } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  const flags = await loadFlags();

  return NextResponse.json(
    { flags },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
