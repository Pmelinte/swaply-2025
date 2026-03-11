import { isAuthenticated } from "@/lib/supabase/auth";
import { ChatGuestPreview } from "@/components/guest-previews/ChatGuestPreview";
import { ChatClient } from "./ChatClient";

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const authed = await isAuthenticated();
  if (!authed) return <ChatGuestPreview />;

  const rawTo = searchParams?.to;
  const rawConversation = searchParams?.conversation;
  const to = Array.isArray(rawTo) ? rawTo[0] : rawTo ?? null;
  const conversationId = Array.isArray(rawConversation) ? rawConversation[0] : rawConversation ?? null;

  return <ChatClient to={to} conversationId={conversationId} />;
}
