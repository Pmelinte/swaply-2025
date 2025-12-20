// src/app/(app)/chat/[swapId]/page.tsx

import { redirect } from "next/navigation";
import ChatClient from "@/features/chat/components/ChatClient";
import { createServerClient } from "@/lib/supabase/server";

interface PageProps {
  params: {
    swapId: string;
  };
}

export default async function ChatPage({ params }: PageProps) {
  const { swapId } = params;

  if (!swapId) {
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

  // 2) Verify swap membership
  const { data: swap } = await supabase
    .from("swaps")
    .select("id, from_user, to_user")
    .eq("id", swapId)
    .maybeSingle();

  if (!swap) {
    redirect("/");
  }

  if (swap.from_user !== user.id && swap.to_user !== user.id) {
    redirect("/");
  }

  // 3) UI
  return (
    <div className="h-[calc(100vh-4rem)] max-w-3xl mx-auto p-4">
      <ChatClient swapId={swapId} currentUserId={user.id} />
    </div>
  );
}
