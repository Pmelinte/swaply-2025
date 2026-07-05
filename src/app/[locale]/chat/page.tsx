import { ChatPage } from "@/components/chat/ChatPage";
import { RealChatPage } from "@/components/chat/RealChatPage";

interface ChatRouteProps {
  searchParams?: Promise<{ conversation?: string; id?: string }>;
}

export default async function ChatRoute({ searchParams }: ChatRouteProps) {
  const params = await searchParams;
  const conversationId = params?.conversation ?? params?.id ?? null;

  if (!conversationId || conversationId.startsWith("demo-")) {
    return <ChatPage conversationId={conversationId ?? "demo-1"} />;
  }

  return <RealChatPage conversationId={conversationId} />;
}
