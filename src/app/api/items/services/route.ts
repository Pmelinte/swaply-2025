import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import type { ServiceFormData } from "@/lib/wizard/serviceWizardStore";
import { normalizeServiceWizardItemInsert } from "@/lib/wizard/serviceWizardNormalize";

export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { form?: ServiceFormData } | null;
  if (!body?.form) return NextResponse.json({ error: "Missing service form" }, { status: 400 });

  const insert = normalizeServiceWizardItemInsert(body.form, auth.user.id);
  const { data, error } = await supabase.from("items").insert(insert).select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] }, { status: 201 });
}
