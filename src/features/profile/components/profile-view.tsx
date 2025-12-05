import React from "react";
import type { Profile } from "@/features/profile/types";

interface ProfileViewProps {
  profile: Profile;
}

/**
 * Componentă read-only pentru afișarea profilului.
 * Poate fi folosită în dashboard, card-uri, pagini publice etc.
 */
export function ProfileView({ profile }: ProfileViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <img
          src={profile.avatar_url || "/default-avatar.png"}
          alt={profile.full_name || profile.username}
          className="h-20 w-20 rounded-full object-cover border"
        />

        <div>
          <h2 className="text-xl font-semibold">
            {profile.full_name || profile.username}
          </h2>
          {profile.location && (
            <p className="text-sm text-muted-foreground">{profile.location}</p>
          )}
        </div>
      </div>

      {profile.bio && (
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {profile.bio}
        </p>
      )}
    </div>
  );
}
