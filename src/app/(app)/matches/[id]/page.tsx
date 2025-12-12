// src/app/(app)/matches/[id]/page.tsx

import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ChatClient from "./ChatClient";

interface PageProps {
  params: { id: string };
}

export default async function MatchChatPage({ params }: PageProps) {
  const supabase = createServerClient();
  const matchId = params.id;

  // 1. User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // 2. Match
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) {
    notFound();
  }

  if (match.userAId !== user.id && match.userBId !== user.id) {
    notFound();
  }

  // 3. Mesaje
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  return (
    <ChatClient
      matchId={matchId}
      currentUserId={user.id}
      initialMessages={messages ?? []}
    />
  );
}