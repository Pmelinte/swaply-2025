import dynamic from "next/dynamic";
import { getServerSupabase } from "@/lib/supabase/server";

const MatchClient = dynamic(() => import("./MatchClient").then((m) => m.MatchClient));

export default async function MatchPage() {
  const supabase = await getServerSupabase();
  let isAuthenticated = false;

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  }

  return <MatchClient serverAuthenticated={isAuthenticated} />;
}
