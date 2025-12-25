import { Section } from '@/components/section';
import { ProfileForm } from '@/features/profile/profile-form';
import { getCurrentProfile, getServerSession } from '@/lib/auth';
import { FeaturePlaceholder } from '@/components/feature-placeholder';
import { LogoutButton } from '@/features/auth/logout-button';

export default async function ProfilePage() {
  const session = await getServerSession();
  const profile = await getCurrentProfile();

  if (!session) {
    return (
      <Section subtitle="Pentru a edita profilul trebuie să fii autentificat." title="Profil">
        <p className="text-sm text-gray-700">Autentifică-te pentru a continua.</p>
      </Section>
    );
  }

  return (
    <div className="space-y-4">
      <Section subtitle="Setează badge, limbă și preferințe vizibilitate." title="Profil">
        <div className="flex justify-end">
          <LogoutButton />
        </div>
        <ProfileForm initialProfile={profile} />
      </Section>
      <Section subtitle="Locație aproximativă / hartă" title="Locație & confidențialitate">
        <FeaturePlaceholder
          description="Control granular pentru vizibilitate pe hartă (Premium/Platinum) – TODO (NEDEFINIT ÎN DOCS)."
          id="PROFILE_LOCATION"
          title="Setări hartă"
        />
      </Section>
      <Section subtitle="Preferințe AI" title="AI & moderare">
        <FeaturePlaceholder
          description="Moderare text/imagine și explainability se implementează server-side; marcat TODO (NEDEFINIT ÎN DOCS)."
          id="PROFILE_AI"
          title="Setări AI"
        />
      </Section>
    </div>
  );
}
