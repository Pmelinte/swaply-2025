// src/app/(app)/matches/page.tsx

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { matchRepository } from "@/features/matches/server/matches-repository";
import MatchList from "@/features/matches/components/MatchList";

export default async function MatchesPage() {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // obținem match-uri pentru user
  const matches = await matchRepository.listMatchesForUser(user.id);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Match-urile tale</h1>

      <MatchList matches={matches} />
    </div>
  );
}
