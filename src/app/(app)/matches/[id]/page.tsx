// src/app/(app)/matches/[id]/page.tsx

import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { matchesRepository } from "@/features/matches/server/matches-repository";
import type { MatchPreview } from "@/features/chat/types";
import ChatClient from "./ChatClient";

interface ChatPageProps {
  params: { id: string };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const matchId = params.id;

  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // verificăm dacă userul are acces la match
  const match: MatchPreview | null = await matchesRepository.getMatchById(
    matchId,
    user.id,
  );

  if (!match) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <ChatClient match={match} />
    </div>
  );
}
