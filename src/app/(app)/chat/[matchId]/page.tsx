// src/app/(app)/chat/[matchId]/page.tsx

import { redirect } from "next/navigation";
import ChatClient from "@/features/chat/components/ChatClient";
import { createServerClient } from "@/lib/supabase/server";

interface PageProps {
  params: {
    matchId: string;
  };
}

export default async function ChatPage({ params }: PageProps) {
  const { matchId } = params;

  if (!matchId) {
    redirect("/");
  }

  const supabase = createServerClient();

  // 1) Auth
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // 2) Verify match membership
  const { data: match } = await supabase
    .from("matches")
    .select("id, userAId, userBId")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) {
    redirect("/");
  }

  if (match.userAId !== user.id && match.userBId !== user.id) {
    redirect("/");
  }

  // 3) UI
  return (
    <div className="h-[calc(100vh-4rem)] max-w-3xl mx-auto p-4">
      <ChatClient matchId={matchId} currentUserId={user.id} />
    </div>
  );
}