// src/app/(app)/matches/[id]/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatClient from "./ChatClient";

interface PageProps {
  params: { id: string };
}

export default async function MatchChatPage({ params }: PageProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const matchId = params.id;

  if (!matchId) redirect("/");

  // (opțional) verificăm că match-ul există + user e parte din el
  const { data: match } = await supabase
    .from("matches")
    .select("id,userAId,userBId")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) redirect("/");
  if (match.userAId !== user.id && match.userBId !== user.id) redirect("/");

  return (
    <div className="h-[calc(100vh-4rem)] max-w-3xl mx-auto p-4">
      <ChatClient matchId={matchId} currentUserId={user.id} />
    </div>
  );
}
