import dynamic from "next/dynamic";

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

  return <ChatClient to={to} conversationId={conversationId} />;
}
