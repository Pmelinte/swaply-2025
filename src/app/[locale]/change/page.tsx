export const dynamic = "force-dynamic";
import { ChangeClient } from "./ChangeClient";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function ChangePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const raw = searchParams?.swap;
  const swapFromQuery = Array.isArray(raw) ? raw[0] : raw ?? null;

  const supabase = await getServerSupabase();
  let isAuthenticated = false;

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  }

  return <ChangeClient swapFromQuery={swapFromQuery} serverAuthenticated={isAuthenticated} />;
}
