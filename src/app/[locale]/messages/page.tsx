import { ChatPage } from '@/components/chat/ChatPage';

console.log('[messages/page.tsx] module loaded — /[locale]/messages route');

export default function MessagesRoute() {
  return <ChatPage conversationId="demo-1" />;
}
