// app/(app)/settings/profile/ProfileClient.tsx
"use client";

import type { Profile } from "@/features/profile/types";
import { ProfileView } from "@/features/profile/components/profile-view";
import ProfileForm from "@/features/profile/components/profile-form";
import { ProfileSection } from "@/features/profile/components/profile-section";

interface ProfileClientProps {
  profile: Profile;
  editable?: boolean;
}

export default function ProfileClient({ profile, editable = true }: ProfileClientProps) {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <ProfileSection title="Profile">
        <ProfileView profile={profile} />
      </ProfileSection>

      {editable ? (
        <ProfileSection title="Edit profile">
          <ProfileForm profile={profile} />
        </ProfileSection>
      ) : null}
    </div>
  );
}
