export const revalidate = 0;
import { getServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const ChatPage = dynamic(
  () => import("@/components/chat/ChatPage").then((m) => m.ChatPage),
);

interface Props {
  params: { conversationId: string; locale: string };
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId, locale } = params;

  const supabase = await getServerSupabase();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/${locale}/login?returnTo=/${locale}/chat/${conversationId}`);
    }
  }

  return <ChatPage conversationId={conversationId} />;
}
