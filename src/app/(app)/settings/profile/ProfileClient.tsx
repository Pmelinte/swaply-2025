// src/app/(app)/settings/profile/ProfileClient.tsx
"use client";

import type { Profile } from "@/features/profile/types";
import { ProfileView } from "@/features/profile/components/profile-view";
import ProfileForm from "@/features/profile/components/profile-form";
import { ProfileSection } from "@/features/profile/components/profile-section";

interface ProfileClientProps {
  profile: Profile;
  ratingSummary?: any;
}

export default function ProfileClient({ profile, ratingSummary }: ProfileClientProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ProfileSection title="Profil">
        <ProfileView profile={profile} />
      </ProfileSection>

      {ratingSummary ? (
        <ProfileSection title="Reputație">
          <div className="text-sm text-muted-foreground">
            {ratingSummary.totalReviews === 0
              ? "Nu ai primit încă recenzii."
              : `${ratingSummary.averageStars} / 5 · ${ratingSummary.totalReviews} recenzii`}
          </div>
        </ProfileSection>
      ) : null}

      <ProfileSection title="Editează profilul">
        <ProfileForm profile={profile} />
      </ProfileSection>
    </div>
  );
}
