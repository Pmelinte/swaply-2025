import { ChatPage } from '@/components/chat/ChatPage';
import { getTranslations } from 'next-intl/server';

console.log('[messages/page.tsx] module loaded — /[locale]/messages route');

export default async function MessagesRoute() {
  const t = await getTranslations('chat');
  return (
    <>
      <h1 className="sr-only">{t('pageTitle')}</h1>
      <ChatPage conversationId="demo-1" />
    </>
  );
}
