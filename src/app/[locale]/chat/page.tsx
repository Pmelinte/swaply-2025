import dynamic from "next/dynamic";
import { getServerSupabase } from "@/lib/supabase/server";

const ChatClient = dynamic(() => import("./ChatClient").then((m) => m.ChatClient));

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const rawTo = searchParams?.to;
  const rawConversation = searchParams?.conversation;
  const to = Array.isArray(rawTo) ? rawTo[0] : rawTo ?? null;
  const conversationId = Array.isArray(rawConversation) ? rawConversation[0] : rawConversation ?? null;

  const supabase = await getServerSupabase();
  let isAuthenticated = false;

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  }

  return <ChatClient to={to} conversationId={conversationId} serverAuthenticated={isAuthenticated} />;
}
