export const revalidate = 0;
import dynamic from "next/dynamic";

const ChatPage = dynamic(
  () => import("@/components/chat/ChatPage").then((m) => m.ChatPage),
);

interface Props {
  params: Promise<{ conversationId: string; locale: string }>;
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params;
  return <ChatPage conversationId={conversationId} />;
}
