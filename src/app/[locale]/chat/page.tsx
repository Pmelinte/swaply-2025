import { ChatPage } from "@/components/chat/ChatPage";

interface ChatRouteProps {
  searchParams?: Promise<{ conversation?: string; id?: string }>;
}

export default async function ChatRoute({ searchParams }: ChatRouteProps) {
  const params = await searchParams;
  const conversationId = params?.conversation ?? params?.id ?? "demo-1";

  return <ChatPage conversationId={conversationId} />;
}
