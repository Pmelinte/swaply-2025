"use client";

import { useState, useTransition } from "react";
import type { Profile } from "@/features/profile/types";
import { updateProfileAction } from "@/features/profile/server/profile-actions";

interface ProfileFormProps {
  profile: Profile;
}

/**
 * Formular simplificat pentru editarea profilului utilizatorului.
 * Trimite datele către server action: updateProfileAction().
 */
export function ProfileForm({ profile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const data = {
      full_name: fullName,
      location,
      bio,
    };

    startTransition(async () => {
      const result = await updateProfileAction(data);

      if ((result as any)?.error) {
        setMessage((result as any).error as string);
      } else {
        setMessage("Profile updated successfully!");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium">Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="rounded-md border px-3 py-2"
          placeholder="Your name"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-md border px-3 py-2"
          placeholder="City, Country"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium">Bio</label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="rounded-md border px-3 py-2"
          placeholder="Tell us something about yourself"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save changes"}
      </button>

      {message && (
        <p className="text-sm text-green-600 mt-2">
          {message}
        </p>
      )}
    </form>
  );
}
