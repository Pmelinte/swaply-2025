import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { convertMatchToSwap } from "@/lib/matching/matchPersistence";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const result = await convertMatchToSwap(supabase, id, user.id);

  if (!result) {
    return NextResponse.json({ error: "Could not convert match" }, { status: 400 });
  }

  return NextResponse.json(result);
}
