import { FeaturePlaceholder } from '@/components/feature-placeholder';
import { Section } from '@/components/section';

export function InfoSections() {
  return (
    <div className="space-y-4">
      <Section subtitle="Statistici globale și legal" title="Info">
        <p className="text-sm text-gray-700">
          Conținutul legal și statisticile sunt listate conform SWAPLY_MASTER_SPEC. Atât banner-ul de cookies cât și linkul
          “Manage cookies” sunt prezente pe pagină prin secțiunea legală.
        </p>
        <FeaturePlaceholder
          description="Implementarea completă pentru statistici live și tokeni este TODO (NEDEFINIT ÎN DOCS)."
          id="INFO_PAGE"
          title="Statistici & Legal"
        />
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>Termeni & Condiții</li>
          <li>Privacy Policy (GDPR) + Download/Delete account (link placeholder)</li>
          <li>Cookies: banner + “manage preferences”</li>
          <li>Contact suport, feedback, raportare abuz</li>
        </ul>
      </Section>
    </div>
  );
}
