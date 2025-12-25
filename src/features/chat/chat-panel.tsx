import { FeaturePlaceholder } from '@/components/feature-placeholder';
import { Section } from '@/components/section';

export function ChatPanel() {
  return (
    <Section
      id="chat"
      subtitle="Moderare + traducere chat necesită integrare AI server-side."
      title="Chat"
    >
      <FeaturePlaceholder
        description="Chat cu atașamente scanate + traducere automată este marcat TODO (NEDEFINIT ÎN DOCS). Butoanele sunt inactive."
        id="CHAT_PAGE"
        title="Conversații"
      />
    </Section>
  );
}
