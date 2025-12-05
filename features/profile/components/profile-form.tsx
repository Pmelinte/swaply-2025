"use client";

import { useState, useTransition, FormEvent } from "react";
import type { Profile } from "@/features/profile/server/profile-actions";

/**
 * Formular simplu pentru editarea profilului.
 * Folosește API-ul /api/profile (PUT) pentru update.
 */

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [username, setUsername] = useState(profile.username ?? "");
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      username: username || profile.username,
      full_name: fullName || null,
      location: location || null,
      bio: bio || null,
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Failed to update profile");
        }

        setSuccess("Profil actualizat cu succes.");
      } catch (e: any) {
        setError(e?.message || "A apărut o eroare la salvare.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium">Username</label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
        />
        <p className="text-xs text-gray-500">
          Va fi folosit ca identificator public (ex: @{username || profile.username}).
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Nume complet</label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Numele tău"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Locație</label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Oraș, țară"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Bio</label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Spune câteva lucruri despre tine…"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Se salvează…" : "Salvează profilul"}
      </button>
    </form>
  );
}
