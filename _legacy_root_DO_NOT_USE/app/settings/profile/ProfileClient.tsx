"use client";

import type { Profile } from "../../../src/features/profile/types";
import { ProfileView } from "../../../src/features/profile/components/profile-view";
import { ProfileForm } from "../../../src/features/profile/components/profile-form";
import { ProfileSection } from "../../../src/features/profile/components/profile-section";

interface ProfileClientProps {
  profile: Profile;
}

/**
 * Componentă client care orchestrează view + form pentru profil.
 */
export default function ProfileClient({ profile }: ProfileClientProps) {
  return (
    <div className="space-y-10 max-w-3xl">
      <ProfileSection
        title="Profil"
        description="Informații generale despre contul tău."
      >
        <ProfileView profile={profile} />
      </ProfileSection>

      <ProfileSection
        title="Editează profilul"
        description="Actualizează numele, avatarul, locația sau bio."
      >
        <ProfileForm profile={profile} />
      </ProfileSection>
    </div>
  );
}
