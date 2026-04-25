import { ChatPage } from '@/components/chat/ChatPage';

console.log('[chat/page.tsx] module loaded — /[locale]/chat route');

export default function ChatRoute() {
  return <ChatPage conversationId="demo-1" />;
}
