import { FeaturePlaceholder } from '@/components/feature-placeholder';
import { Section } from '@/components/section';

export function MatchPreview() {
  return (
    <Section
      id="matching"
      subtitle="Sugestiile AI sunt dezactivate până la clarificare; folosim un fallback manual."
      title="Match-uri recomandate"
    >
      <FeaturePlaceholder
        description="Matching AI + manual mode – TODO (NEDEFINIT ÎN DOCS). Afișăm doar scheletul pentru a nu bloca build-ul."
        id="MATCH_PAGE"
        title="Matching"
      />
    </Section>
  );
}
